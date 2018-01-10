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

        function deleteStagingJob(jobMonitoringId) {
            var param = {
                username: runtime.service('session').getUsername(),
                job_monitoring_id: jobMonitoringId
            };
            return rpc.call('jgi_gateway_eap', 'remove_staging_job', param)
                .spread(function (result, error) {
                    // console.log('deletion result...', result, error);
                    if (result) {
                        // console.log('Yay!');
                    } else if (error) {
                        console.error('ERROR', error);
                    } else {
                        throw new Error('Unexpected - both result and error are null!!');
                    }
                })
                .catch(function (err) {
                    console.error('EX', err);
                });
        }

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
            return rpc.call('jgi_gateway_eap', 'staging_jobs', param)
                .spread(function (result, error) {
                    if (result) {
                        // console.log('got staging jobs...', result);
                        var stagingJobs = result.jobs.map(function (job) {
                            return {
                                jobMonitoringId: job.job_monitoring_id,
                                jamoId: job.jamo_id,
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
            fetchStagingJobs: fetchStagingJobs,
            deleteStagingJob: deleteStagingJob
        });
    }

    return Object.freeze({
        make: factory
    });
});