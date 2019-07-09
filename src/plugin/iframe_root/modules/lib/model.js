define([
    'bluebird',
    'kb_common_ts/HttpClient',
    './rpc',
    './profile',
    './utils'
], function (
    Promise,
    Http,
    RPC,
    Profile,
    utils
) {
    'use strict';

    class Model {
        constructor({runtime}) {
            this.runtime = runtime;
            this.rpc = new RPC({runtime: runtime});
        }

        getStagingJobStatus() {
            var param = {
                username: this.runtime.service('session').getUsername(),
                job_monitoring_ids: []
            };
            return this.rpc.call('jgi_gateway', 'staging_jobs_summary', param);
        }

        stageFile(id, filename) {
            return this.rpc.call('jgi_gateway', 'stage', {
                file: {
                    id: id,
                    filename: filename,
                    username: this.runtime.service('session').getUsername()
                }
            });
        }

        fetchQuery(query, filter, sortSpec, page, pageSize) {
            var fields = [
                'metadata.proposal_id', 'metadata.proposal.title',
                'metadata.sequencing_project_id', 'metadata.analysis_project_id', 'metadata.pmo_project_id',
                'file_size', 'file_type', 'file_name', // file type, data type
                'metadata.pmo_project.name', 'metadata.sequencing_project.sequencing_project_name', // title
                'metadata.proposal.pi.last_name', 'metadata.proposal.pi.first_name', 'metadata.pmo_project.pi_name', // pi
                'metadata.analysis_project.piName', // more pi
                // scientific name
                'metadata.genus', 'metadata.sow_segment.genus', 'metadata.pmo_project.genus', 'metadata.gold_data.genus',
                'metadata.species', 'metadata.sow_segment.species', 'metadata.pmo_project.species', 'metadata.gold_data.species',
                'metadata.strain', 'metadata.sow_segment.strain', 'metadata.pmo_project.strain', 'metadata.gold_data.strain',
                'metadata.analysis_project.ncbiGenus','metadata.analysis_project.ncbiSpecies','metadata.analysis_project.ncbiStrain',
                'file_date', // date
                'modified', // modified
                '_es_public_data', // is the data public?
                // fastq
                'metadata.portal.display_location', 'metadata.sow_segment.index_sequence',
                'metadata.gold_data.gold_url', 'metadata.gold_data.gold_stamp_id'
            ];
            var param = {
                query: query,
                filter: filter,
                sort: sortSpec,
                fields: fields,
                limit: pageSize,
                page: page,
                include_private: 0
            };
            return this.rpc.call('jgi_gateway', 'search', param)
                .catch((err) => {
                    err.message = 'Sorry, an error was encountered running your search: "' + err.message + '"';
                    throw err;
                });
        }

        fetchDetail(id) {
            var query = {
                _id: id
            };
            var param = {
                query: query,
                filter: null,
                fields: null,
                sort: [],
                limit: 1,
                page: 1,
                include_private: 0
            };
            return this.rpc.call('jgi_gateway', 'search', param)
                .catch((err) => {
                    console.error('ERROR', err, query, typeof page, typeof pageSize);
                    throw err;
                })
                .spread((result, err) => {
                    if (result) {
                        return result;
                    }
                    if (err) {
                        console.error('error fetching search detail ', err);
                        throw new Error('Need to handle this error: ' + err.message);
                    } else {
                        throw new Error('Hmm, should have a result or an error!');
                    }
                });
        }

        getFileMetadata(filename) {
            var url = [
                this.runtime.config('services.staging.url'),
                'metadata',
                encodeURIComponent(filename)
            ].join('/');
            var http = new Http.HttpClient();
            return http.request({
                url: url,
                method: 'GET',
                header: new Http.HttpHeader({
                    'Authorization': this.runtime.service('session').getAuthToken()
                })
            })
                .then((result) => {
                    switch (result.status) {
                    case 200:
                        var fileMetadata = JSON.parse(result.response);

                        // TODO: do something with the file metadata
                        return [fileMetadata, null];
                    case 404:
                        // good, it doesn't exist.
                        return [null, null];
                    default:
                        return [null, result.response];
                    }
                })
                .catch((err) => {
                    return [null, err.message];
                });
        }

        saveJgiAgreement(agreed) {
            return new Profile({
                runtime: this.runtime
            }).saveJgiAgreement(agreed);
        }

        getJgiAgreement() {
            return new Profile({
                runtime: this.runtime
            }).getJgiAgreement();
        }

        getSearchHistory() {
            return new Profile({
                runtime: this.runtime
            }).getHistory('search');
        }

        saveSearchHistory(history) {
            return new Profile({
                runtime: this.runtime
            }).saveHistory('search', history);
        }

        static validateFilename(filename) {
            if (!filename || filename.length === 0) {
                return 'A filename may not be blank';
            }
            if (!filename.trim(' ').length === 0) {
                return 'A filename not consist entirely of spaces';
            }
            if (/^\..*$/.test(filename)) {
                return 'Dot files not allowed';
            }
            if (/^[\s]+\..*$/.test(filename)) {
                return 'A filename with only spaces before the first dot not allowed';
            }
            if (/\//.test(filename)) {
                return 'Invalid character in filename: /';
            }
            if (/[\\/:*?"<>|]/.test(filename)) {
                return 'Invalid character in filename: \\ / : * ? " < > | ';
            }
            if (/[[\\u0000-\\u001F\\u007F\\u0080-\\u009F]]/.test(filename)) {
                return 'File contains non-printable characters';
            }
            return null;
        }

        checkFilename(filename) {
            return Promise.try(() => {
                try {
                    const error = Model.validateFilename(filename);

                    if (error) {
                        return {
                            validationError: error
                        };
                    }
                } catch (ex) {
                    return {
                        exception: ex.message
                    };
                }
                return this.getFileMetadata(filename)
                    .spread((result, error) => {
                        if (error) {
                            console.error('ERROR checking filename.', error);
                            return {
                                error: error
                            };
                        } else {
                            if (result) {
                                return {
                                    exists: result
                                };
                            }
                            return false;
                        }
                    })
                    .catch((err) => {
                        return {
                            exception: err.message
                        };
                    });
            });
        }

        deleteStagingJob(jobMonitoringId) {
            const param = {
                username: this.runtime.service('session').getUsername(),
                job_monitoring_id: jobMonitoringId
            };
            return this.rpc.call('jgi_gateway', 'remove_staging_job', param)
                .spread((result, error) => {
                    if (result) {
                        // console.log('Yay!');
                    } else if (error) {
                        console.error('ERROR', error);
                    } else {
                        throw new Error('Unexpected - both result and error are null!!');
                    }
                })
                .catch((err) => {
                    console.error('EX', err);
                });
        }

        fetchStagingJobs(page, pageSize, filterSpec, sortSpec) {
            const start = (page - 1) * pageSize;
            const limit = pageSize;
            const param = {
                username: this.runtime.service('session').getUsername(),
                filter: filterSpec,
                sort: sortSpec,
                range: {
                    start: start,
                    limit: limit
                }
            };
            return this.rpc.call('jgi_gateway', 'staging_jobs', param)
                .spread((result, error) => {
                    if (result) {
                        var stagingJobs = result.jobs.map((job) => {
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
                .catch((err) => {
                    console.error('ERROR getting staging jobs:', err);
                });
        }

        getStageStatus(param) {
            return this.rpc.call('jgi_gateway', 'stage_status', param)
                .spread((message, error) => {
                    if (message) {
                        return utils.grokStageStatus(message);
                    } else if (error) {
                        throw new Error(error.message);
                    } else {
                        throw new Error('Unexpected result: no result or error');
                    }
                });
        }
    }

    return Model;
});