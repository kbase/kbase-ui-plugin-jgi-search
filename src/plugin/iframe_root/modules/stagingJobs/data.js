define(['knockout', '../../lib/rpc'], function (ko, rpc) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;

        function stagingJobs(page, pageSize) {
            var first = (page - 1) * pageSize;
            var count = pageSize;
            var param = {
                filter: {
                    username: runtime.service('session').getUsername()
                },
                range: {
                    start: first,
                    limit: count
                }
            };
            return rpc
                .call('jgi_gateway', 'staging_jobs', param)
                .spread(function (result, error) {
                    if (result) {
                        result.jobs.forEach(function (job) {
                            var j = {
                                dbId: job.jamo_id,
                                filename: job.filename,
                                jobId: job.job_id,
                                started: new Date(job.created * 1000),
                                updated: ko.observable(job.updated ? new Date(job.updated * 1000) : null),
                                status: ko.observable(job.status_code)
                            };
                            stagingJobs.push(j);
                        });
                    } else if (error) {
                        console.error('ERROR', error);
                    } else {
                        // what here?
                    }
                })
                .catch(function (err) {
                    console.error('ERROR getting staging jobs:', err);
                });
        }

        return Object.freeze({
            stagingJobs: stagingJobs
        });
    }

    return Object.freeze({
        make: factory
    });
});
