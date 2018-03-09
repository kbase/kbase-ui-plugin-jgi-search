define([
    'bluebird',
    'knockout-plus',
    'kb_common_ts/HttpClient',
    '../lib/rpc',
    '../lib/profile'
], function (
    Promise,
    ko,
    Http,
    Rpc,
    Profile
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;

        var rpc = Rpc.make({runtime: runtime});

        function getStagingJobStatus() {
            var param = {
                username: runtime.service('session').getUsername(),
                job_monitoring_ids: []
            };
            return rpc.call('jgi_gateway', 'staging_jobs_summary', param);
        }

        function stageFile(id, filename) {
            return rpc.call('jgi_gateway', 'stage', {
                file: {
                    id: id,
                    filename: filename,
                    username: runtime.service('session').getUsername()
                }
            });
        }

        function fetchQuery(query, filter, sortSpec, page, pageSize) {
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
            return rpc.call('jgi_gateway', 'search', param)
                .catch(function (err) {
                    err.message = 'Sorry, an error was encountered running your search: "' + err.message + '"';
                    throw err;
                });
        }

        function fetchDetail(id) {
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
            return rpc.call('jgi_gateway', 'search', param)
                .catch(function (err) {
                    console.error('ERROR', err, query, typeof page, typeof pageSize);
                    throw err;
                })
                .spread(function (result, err) {
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

        function getFileMetadata(filename) {
            // make a rest call to the staging service...
            // var url = [runtime.config('services.staging.url'), 'existance', encodeURIComponent(filename)].join('/');
            var url = [runtime.config('services.staging.url'), 'metadata', encodeURIComponent(filename)].join('/');
            // var url = [runtime.config('services.ftp_service.url'), 'list', runtime.service('session').getUsername()].join('/');
            var http = new Http.HttpClient();
            return http.request({
                url: url,
                method: 'GET',
                header: new Http.HttpHeader({
                    'Authorization': runtime.service('session').getAuthToken()
                })
            })
                .then(function (result) {
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
                .catch(function (err) {
                    return [null, err.message];
                });
        }

        function saveJgiAgreement(agreed) {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.saveJgiAgreement(agreed);
        }

        function getJgiAgreement() {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.getJgiAgreement();
               
        }

        function getSearchHistory() {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.getHistory('search');
        }

        function saveSearchHistory(history) {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.saveHistory('search', history);                
        }

        return Object.freeze({
            getStagingJobStatus: getStagingJobStatus,
            stageFile: stageFile,
            fetchQuery: fetchQuery,
            fetchDetail: fetchDetail,
            getFileMetadata: getFileMetadata,
            saveJgiAgreement: saveJgiAgreement,
            getJgiAgreement: getJgiAgreement,
            getSearchHistory: getSearchHistory,
            saveSearchHistory: saveSearchHistory
        });
    }

    return Object.freeze({
        make: factory
    });
});