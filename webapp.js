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

    var description;
    var runnerLogPath = path.resolve('/home/strider/.strider/data/pixeleet-sweebr-' + job._id, 'unit-test-runner.log');
    var runnerLog = fs.existsSync(runnerLogPath) ? fs.readFileSync(runnerLogPath) : '';

    if (job.errored) description = 'Strider tests errored'
    description = 'Strider tests ' + (job.test_exitcode === 0 ? 'succeeded' : 'failed') + '\n' + runnerLog;

    debug('Job Data', JSON.Stringify(job, false, 4));
    debug('LogPath', runnerLogPath);
    debug('Description', description);

    return description;
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
                debug('onDoneAndSaved [job]', job);
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
