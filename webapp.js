var setStatus = require('./lib/handler'),
    debug = require('debug')('strider-github-status'),
    path = require('path'),
    fs = require('fs')

function jobStatus(job) {
    if (job.errored) return 'error'
    return job.test_exitcode === 0 ? 'success' : 'failure'
}

// TODO: give information here as to why id errored/failed?
function jobDescription(job) {
    var runnerLogPath = path.resolve(__dirname, 'unit-test-runner.log');
    var errorsLogPath = path.resolve(__dirname, 'unit-test-errors.log');

    var runnerLog = fs.readFileSync(runnerLogPath);
    var errorsLog = fs.readFileSync(errorsLogPath);

    console.log('logFileContents', runnerLog);
    console.log('logFileContents', errorsLog);

    if (job.errored) return 'Strider tests errored'
    return 'Strider tests ' + (job.test_exitcode === 0 ? 'succeeded' : 'failed').concat('\n' + runnerLog);
}

module.exports = {
    // global events
    listen: function(io, context) {
        io.on('plugin.github-status.started', function(jobId, projectName, token, data) {
            debug('got', jobId, projectName, token, data)
            var url = context.config.server_name + '/' + projectName + '/job/' + jobId
            setStatus(token, url, data, 'pending', 'Strider test in progress')
        })

        io.on('plugin.github-status.done', function(jobId, projectName, token, data) {
            var onDoneAndSaved = function(job) {
                if (job._id.toString() !== jobId.toString()) return
                debug('plugin done', jobId, projectName, token, data)

                io.removeListener('job.doneAndSaved', onDoneAndSaved)
                debug('job data', job);
                var url = context.config.server_name + '/' + projectName + '/job/' + jobId,
                    status = jobStatus(job),
                    description = jobDescription(job)
                setStatus(token, url, data, status, description)
            }
            io.on('job.doneAndSaved', onDoneAndSaved)
        })
    }
}
