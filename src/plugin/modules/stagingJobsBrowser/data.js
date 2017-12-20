define([
    'bluebird',
    'knockout-plus',
    'kb_common_ts/HttpClient',
    '../lib/rpc'
], function (
    Promise,
    ko,
    HttpClient,
    Rpc
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;

        var rpc = Rpc.make({runtime: runtime});

        function fetchStagingJobs(page, pageSize, filterSpec, sortSpec) {
            var start = (page - 1) * pageSize;
            var limit = pageSize;
            var param = {
                username: runtime.service('session').getUsername(),
                filter: filterSpec,
                sort: sortSpec,
                range: {
                    start: start,
                    limit: limit
                }
            };
            console.log('sending param', param);
            return rpc.call('jgi_gateway_eap', 'staging_jobs', param)
                .spread(function (result, error) {
                    console.log('got', result, error);
                    if (result) {
                        var stagingJobs = result.jobs.map(function (job) {
                            return {
                                dbId: job.jamo_id,
                                filename: job.filename,
                                jobId: job.job_id,
                                started: new Date(job.created * 1000),
                                updated: job.updated ? new Date(job.updated * 1000) : null,
                                status: job.status_code
                            };
                        });
                        // result.jobs.forEach(function (job) {
                        //     var j = {
                        //         dbId: job.jamo_id,
                        //         filename: job.filename,
                        //         jobId: job.job_id,
                        //         started: new Date(job.created * 1000),
                        //         updated: ko.observable(job.updated ? new Date(job.updated * 1000) : null),
                        //         status: ko.observable(job.status_code)
                        //     };
                        //     stagingJobs.push(j);
                        // });
                        return {
                            jobs: stagingJobs,
                            total_available: result.total_available,
                            total_matched: result.total_matched // LEFT OFF HERE make sure these are right
                        };
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
            fetchStagingJobs: fetchStagingJobs
        });
    }

    return Object.freeze({
        make: factory
    });
});