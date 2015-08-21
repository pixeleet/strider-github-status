var setStatus = require('./lib/handler').setStatus
  , createComment = require('./lib/handler').createComment
  , debug = require('debug')('strider-github-status');

function jobStatus(job) {
  if (job.errored) return 'error'
  return job.test_exitcode === 0 ? 'success' : 'failure'
}

// TODO: give information here as to why id errored/failed?
function jobDescription(job) {
  if (job.errored) return 'Strider tests errored'
  return 'Strider tests ' + (job.test_exitcode === 0 ? 'succeeded' : 'failed')
}

var
    STRIDER_DATA_FOLDER = process.env.STRIDER_DATA_FOLDER || '/home/strider/.strider/data'
  , UNIT_TEST_RUNNER_LOG = process.env.UNIT_TEST_RUNNER_LOG || 'unit-test-runner.log'
  , UNIT_TEST_ERRORS_LOG = process.env.UNIT_TEST_ERRORS_LOG || 'unit-test-errors.log'
;

function readLog(job) {
    var slug = job.project.name.replace('/', '-');
    var projectFolder = [slug, job._id].join('-');
    var BASE_PATH = path.resolve([ STRIDER_DATA_FOLDER, projectFolder ].join('/'));

    var runnerLogPath = path.resolve([BASE_PATH, UNIT_TEST_RUNNER_LOG]);
    var errorsLogPath = path.resolve([BASE_PATH, UNIT_TEST_ERRORS_LOG]);

    if (job.errored || job.test_exitcode !== 0)
        return fs.readFileSync(errorsLogPath).toString();

    return fs.readFileSync(runnerLogPath).toString();
}

module.exports = {
  // global events
  listen: function (io, context) {
    io.on('plugin.github-status.started', function (jobId, projectName, token, data) {
      debug('got', jobId, projectName, token, data)
      var url = context.config.server_name + '/' + projectName + '/job/' + jobId
      setStatus(token, url, data, 'pending', 'Strider test in progress')
    })

    io.on('plugin.github-status.done', function (jobId, projectName, token, data) {
      var onDoneAndSaved = function (job) {
        if (job._id.toString() !== jobId.toString()) return
        debug('plugin done', jobId, projectName, token, data)

        io.removeListener('job.doneAndSaved', onDoneAndSaved)
        var url = context.config.server_name + '/' + projectName + '/job/' + jobId
          , status = jobStatus(job)
          , description = jobDescription(job)
          , report = readLog(job)

        setStatus(token, url, data, status, description);
        createComment(token, url, data, status, report);
      }
      io.on('job.doneAndSaved', onDoneAndSaved)
    })
  }
}
