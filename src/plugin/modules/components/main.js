/*
Top level panel for jgi search
*/
define([
    // global deps
    'bluebird',
    'knockout-plus',
    'numeral',
    'marked',
    // kbase deps
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_common/props',
    'kb_common_ts/HttpClient',
    // local deps
    '../lib/rpc',
    '../errorWidget',
    '../lib/utils',
    // local data
    'yaml!../lib/import.yml'
], function (
    Promise,
    ko,
    numeral,
    marked,
    html,
    GenericClient,
    Props,
    Http,
    Rpc,
    ErrorWidget,
    utils,
    Import
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        a = t('a'),
        div = t('div');

    function getImportInfo(dataType, indexId, fileName, hit) {
        // console.log('getting import info:', dataType, indexId);
        if (!dataType) {
            return null;
        }
        // get the import spec
        // for now a simple filter
        var dataTypeDef = Import.dataTypes[dataType];
        if (!dataTypeDef) {
            throw new Error('unsupported data type: ' + dataType);
        }
        var importMetadata = utils.grokImportMetadata(dataTypeDef, hit);
        // console.log('grokked?', importMetadata);
        return {
            importSpec: dataTypeDef,
            kbaseType: importMetadata.kbaseType,
            error: importMetadata.error,
            importMetadata: importMetadata.metadata,
            stagingSpec: {
                indexId: indexId,
                // doStage: function (data) {
                //     doStage(data);
                // },
                stagingStatus: ko.observable(),
                stagingProgress: ko.observable(),
                stagingProgressColor: ko.observable(),
                fileName: ko.observable(fileName)
            }
        };
    }

    function viewModel(params) {
        var runtime = params.runtime;
        var rpc = Rpc.make({
            runtime: runtime
        });

        var maxSearchResults = 10000;

        var stagingJobs = ko.observableArray();
        // var stagingJobsMap = {};
        stagingJobs.subscribe(function (changes) {
            changes.forEach(function (change) {
                if (change.status === 'deleted') {
                    // delete stagingJobsMap[change.value.id];
                } else {
                    // stagingJobsMap[change.value.id] = change.value;
                    monitorJobs();
                }
            });
        }, null, 'arrayChange');

        // contains a couunt of the number of staging jobs in particular
        // stages during this search session, which begins when the component
        // is loaded and ends when it is unloaded.
        var stagingJobStates = {
            sent: ko.observable(0),
            queued: ko.observable(0),
            restoring: ko.observable(0),
            copying: ko.observable(0),
            completed: ko.observable(0),
            error: ko.observable(0)
        };

        var stagingJobsState = ko.pureComputed(function () {
            var pending = stagingJobStates.sent() +
                stagingJobStates.queued() +
                stagingJobStates.restoring() +
                stagingJobStates.copying();
        
            return {
                pending: pending,
                completed: stagingJobStates.completed(),
                some: pending + stagingJobStates.completed() + stagingJobStates.error()
            };
        });

        // console.log('staging job state', stagingJobsState());

        function updateStagingJobStates() {
            var states = {
                sent: 0,
                queued: 0,
                restoring: 0,
                copying: 0,
                completed: 0,
                error: 0
            };
            stagingJobs().forEach(function (job) {
                var newState = job.status();
                if (newState in states) {
                    states[newState] += 1;
                } else {
                    // hack for now, get the service to return this.
                    states['error'] += 1;
                    console.warn('Staging job state unrecognized: ', newState);
                }
            });
            Object.keys(states).forEach(function (state) {
                stagingJobStates[state](states[state]);
            });
        }

        stagingJobs.subscribe(function () {
            updateStagingJobStates();
        });

        // stagingJobs.subscribe(function (changes) {
        //     console.log('subbed', changes);
        //
        //     changes.forEach(function (change) {
        //         var increment = 1;
        //         if (change.status === 'deleted') {
        //             increment = -1;
        //         }
        //         var newState = change.value.status;
        //         if (newState in stagingJobStates) {
        //             var state = stagingJobStates[newState];
        //             state(state() + increment);
        //         } else {
        //             console.warn('Staging job state unrecognized: ' + newState)
        //         }
        //     })
        // }, null, 'arrayChange');

        var monitoringJobs = ko.observable(false);
        function monitorJobs(jobId, progress, color) {
            if (monitoringJobs()) {
                return;
            }
            function checkProgress() {
                var jobChecks = stagingJobs().map(function (job) {
                    if (job.status() === 'completed') {
                        return;
                    }
                    return rpc.call('jgi_gateway_eap', 'stage_status', {
                        job_id: job.jobId
                    })
                        .spread(function (result, error) {
                            if (error) {
                                throw new Error('Error checking job state: ' + error.message);
                            }
                            return result;
                        })
                        .then(function (result) {
                            var status = utils.grokStageStats(result);
                            job.updated(new Date());
                            job.status(status.status);
                            return status.status;
                        });
                }).filter(function (jobCheck) {
                    return (jobCheck !== undefined);
                });
                return Promise.all(jobChecks)
                    .then(function (result) {
                        // should be list of statuses...
                        var runAgain = result.some(function (status) {
                            return (status !== 'completed' && status !== 'error' && status !== 'unknown1');
                        });
                        // console.log('stage status is', result, stats);
                        // hmph, value comes back as a simple string.
                        // if (!result) {
                        //     progress('hmm, no progress.');
                        //     return;
                        // }
                        // var stageStats = utils.grokStageStats(result.message);
                        // // console.log('grokked status', stageStats);
                        // progress(stageStats.status);
                        //
                        // color(statusConfig[stageStats.status].color);
                        //
                        // if (stageStats.status === 'completed') {
                        //     return;
                        // }
                        // console.log('monitored', result);
                        if (runAgain) {
                            window.setTimeout(checkProgress, 5000);
                        } else {
                            monitoringJobs(false);
                        }
                    })
                    .catch(function (err) {
                        // progress(err.message);
                        console.error('ERROR checking job state', err);
                    })
                    .finally(function () {
                        updateStagingJobStates();
                    });
            }
            monitoringJobs(true);
            checkProgress();
        }

        function doStage(id, fileName) {
            console.log('staging...', id, fileName);
            return rpc.call('jgi_gateway_eap', 'stage', {
                ids: [id]
            })
                .spread(function (result, error) {
                    if (result) {
                        // stagingSpec.stagingStatus('Staging submitted with job id ' + result.job_id);
                        // console.log('got result', result);
                        var job = {
                            dbId: id,
                            filename: fileName,
                            jobId: result.job_id,
                            started: new Date(),
                            updated: ko.observable(new Date()),
                            status: ko.observable('sent')
                        };
                        job.elapsed = ko.pureComputed(function () {
                            // var now = new Date().getTime();
                            return this.updated().getTime() - this.started.getTime();
                        }.bind(job));
                        stagingJobs.push(job);

                        // Set it it the results item as well.
                        var res = searchResults();
                        for (var i = 0; i < res.length; i += 1) {
                            // console.log('item', item, item.id, job.dbId);
                            var item = res[i];
                            if (item.id === job.dbId) {
                                item.transferJob(job);
                                break;
                            }
                        }

                        return job;
                        // return {
                        //     jobId: result.job_id
                        // };

                        // monitorProgress(result.job_id, stagingSpec.stagingProgress, stagingSpec.stagingProgressColor);
                    } else {
                        // stagingSpec.stagingStatus('unknown - see console');
                        throw new Error('Empty result when staging');
                    }
                    // return result;
                })
                .catch(function (err) {
                    // console.error('ERROR', err, stagingSpec);
                    // stagingSpec.stagingStatus('error - ' + err.message);
                    return {
                        message: err.message,
                        error: err
                    };
                    // throw err;
                });
        }


        // Fetch send a query and fetch the results.
        function fetchQuery(query, filter, page, pageSize) {
            var fields = [
                'metadata.proposal_id', 'metadata.proposal.title',
                'metadata.sequencing_project_id', 'metadata.analysis_project_id', 'metadata.pmo_project_id',
                'file_size', 'file_type', 'file_name', // file type, data type
                'metadata.pmo_project.name', 'metadata.sequencing_project.sequencing_project_name', // title
                'metadata.proposal.pi.last_name', 'metadata.proposal.pi.first_name', 'metadata.pmo_project.pi_name', // pi
                // scientific name
                'metadata.genus', 'metadata.sow_segment.genus', 'metadata.pmo_project.genus', 'metadata.gold_data.genus',
                'metadata.species', 'metadata.sow_segment.species', 'metadata.pmo_project.species', 'metadata.gold_data.species',
                'metadata.strain', 'metadata.sow_segment.strain', 'metadata.pmo_project.strain', 'metadata.gold_data.strain',
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
                fields: fields,
                limit: pageSize,
                page: page,
                include_private: 0
            };
            return rpc.call('jgi_gateway_eap', 'search', param)
                // .catch(function (err) {
                //     console.error('ERROR', err, query, typeof page, typeof pageSize);
                //     throw err;
                // });
        }

        function doRemoveError(data) {
            errors.remove(data);
        }

        function doRemoveMessage(data) {
            messages.remove(data);
        }

        function addMessage() {
            // message already present by id?

            // if not ,add it.
        }

        var searchResults = ko.observableArray();

        var searchInput = ko.observable();

        var searchTotal = ko.observable();
        var actualSearchTotal = ko.observable();
        var searchElapsed = ko.observable();

        var page = ko.observable();
        var errors = ko.observableArray();
        var messages = ko.observableArray();

        function clearQuery() {
            seqProjectFilter(null);
            proposalFilter(null);
            searchInput('');
        }

        var searchQuery = ko.pureComputed(function () {
            // Search input dependencies
            // We make deep copies of our search inputs so we can
            // play with them.
            var query = JSON.parse(JSON.stringify(searchExpression()));

            var autoQuery = searchAutoQuery();
            var filter = searchFilter();

            // transfer filters to the search query.
            Object.keys(filter).forEach(function (key) {
                query.filter[key] = filter[key];
            });

            Object.keys(autoQuery).forEach(function (key) {
                query.query[key] = autoQuery[key];
            });

            // If we have a filter but no query, we just assume the query
            // selects all
            if (Object.keys(query.query).length === 0) {
                if (Object.keys(query.filter).length > 0) {
                    query.query._all = '*';
                } else {
                    // nothing to do, just reset the search
                    clearSearch();
                    return null;
                }
            }

            // Default file type filter, now enabled by "show supported file types" checkbox.
            if (!query.query.file_type) {
                query.query.file_type = typeFilterOptions.map(function (option) {
                    return option.value;
                }).join(' | ');
            }

            if (Object.keys(query.query).length > 0) {
                query.query.operator = 'AND';
            }
            if (Object.keys(query.filter).length > 0) {
                query.filter.operator = 'AND';
            }

            return query;
        });

        // Fetch details for a given search result item.
        function fetchDetail(id) {
            var query = {
                _id: id
            };
            var param = {
                query: query,
                filter: null,
                fields: null,
                limit: 1,
                page: 1,
                include_private: 0
            };
            return rpc.call('jgi_gateway_eap', 'search', param)
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

       
        function getDetail(id) {
            return fetchDetail(id)
                .then(function (result) {
                    // var project = hit.source.metadata;
                    var hit = result.hits[0];
                    // var rowNumber = (page() - 1) * pageSize() + 1 + index;
                    var projectId;
                    if (hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id) {
                        projectId = hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id;
                    } else {
                        projectId = 'n/a';
                    }

                    var proposalId = utils.getProp(hit.source.metadata, ['proposal_id'], '-');

                    // actual file suffix.

                    var fileParts = utils.grokFileParts(hit.source.file_name);
                    console.log('file parts', fileParts);
                
                    // var fileBaseName, fileExtension;
                    // var reExtension = /^(.*)\.(.*)$/;
                    // var fileName = hit.source.file_name;
                    // var m = reExtension.exec(fileName);
                    // if (m) {
                    //     fileBaseName = m[1];
                    //     fileExtension = m[2];
                    // } else {
                    //     fileBaseName = null;
                    //     fileExtension = null;
                    // }
                    var fileType = utils.grokFileType(hit.source.file_type, fileParts);

                    // Title
                    var title = utils.grokTitle(hit, fileType);

                    var scientificName = utils.grokScientificName(hit, fileType);

                    // scientific name may be in different places.

                    // By type metadata.
                    var metadata = utils.grokMetadata(hit, fileType);

                    var pi = utils.grokPI(hit, fileType);

                    // have a current transfer job?

                    var jobs = stagingJobs().filter(function (job) {
                        return job.dbId === hit.id;
                    });
                    var transferJob = jobs[0];
                    // console.log('HIT', hit);
                    var analysisProject;
                    if (utils.hasProp(hit.source.metadata, 'analysis_project')) {
                        analysisProject = {
                            name: utils.getProp(hit.source.metadata, 'analysis_project.analysisProjectName'),
                            assemblyMethod: utils.getProp(hit.source.metadata, 'analysis_project.assemblyMethod'),
                            genomeType: utils.getProp(hit.source.metadata, 'analysis_project.genomeType'),
                            id: utils.getProp(hit.source.metadata, 'analysis_project.itsAnalysisProjectId'),
                            modificationDate: utils.getProp(hit.source.metadata, 'analysis_project.modDate'),
                            comments: utils.getProp(hit.source.metadata, 'analysis_project.comments')
                        };
                    }
                    var sequencingProject;
                    if (utils.hasProp(hit.source.metadata, 'sequencing_project')) {
                        sequencingProject = {
                            name: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_name'),
                            id: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_id'),
                            status: utils.getProp(hit.source.metadata, 'sequencing_project.current_status'),
                            statusDate: utils.getProp(hit.source.metadata, 'sequencing_project.status_date'),
                            comments: utils.getProp(hit.source.metadata, 'sequencing_project.comments')
                        };
                    }
                    return {
                        // rowNumber: rowNumber,
                        id: hit.id,
                        score: numeral(hit.score).format('00.00'),
                        type: hit.type,
                        title: title,
                        date: utils.usDate(hit.source.file_date),
                        modified: utils.usDate(hit.source.modified),
                        // fileExtension: fileExtension,
                        fileType: utils.normalizeFileType(hit.source.file_type),
                        // TODO: these should all be in just one place.
                        dataType: fileType.dataType,
                        proposalId: proposalId,
                        projectId: projectId,
                        pi: pi,
                        metadata: metadata,
                        scientificName: scientificName.scientificName,
                        file: {
                            parts: fileParts,
                            name: hit.source.file_name,
                            // baseName: fileBaseName,
                            // extension: fileExtension,
                            dataType: fileType.dataType,
                            encoding: fileType.encoding,
                            indexedType: utils.normalizeFileType(hit.source.file_type),
                            size: numeral(hit.source.file_size).format('0.0 b'),
                            added: utils.usDate(hit.source.added_date),
                            status: hit.source.file_status,
                            types: utils.normalizeFileType(hit.source.file_type),
                            typing: fileType
                        },
                        proposal: hit.source.metadata.proposal,
                        sequencingProject: sequencingProject,
                        analysisProject: analysisProject,
                        // importSpec: getImportInfo(fileType.dataType, hit.id, hit.source.file_name, hit),
                        showInfo: ko.observable(false),
                        detailFormatted: JSON.stringify(hit.source, null, 4),
                        source: hit.source,
                        data: hit,
                        // UI
                        transferJob: ko.observable(transferJob)
                    };
                });
        }

        function validateFilename(filename) {
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

        function checkFilename(filename) {
            return Promise.try(function () {
                try {
                    var error = validateFilename(filename);

                    if (error) {
                        return error;
                    }
                } catch (ex) {
                    return ex.message;
                }

                // make a rest call to the staging service...
                // var url = [runtime.config('services.staging.url'), 'existance', encodeURIComponent(filename)].join('/');
                var url = [runtime.config('services.staging.url'), 'search', encodeURIComponent(filename)].join('/');
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
                            var files = JSON.parse(result.response);
                            if (files.length === 0) {
                                return null;
                            }
                            return 'Sorry, this file already exists.';
                        default:
                            return result.response;
                        }
                    })
                    .catch(function (err) {
                        return err.message;
                        // console.log('error', err);
                        // return 'some error! ' + err.message
                    });
            });

        }

        // FILTERS

        // TYPE FILTER
        // var typeFilterInput = ko.observable();
        var typeFilter = ko.observableArray();
        var typeFilterOptions = [{
            label: 'FASTQ',
            value: 'fastq'
        }, {
            label: 'FASTA',
            value: 'fasta'
        },
        // {
        //     label: 'SRA',
        //     value: 'sra'
        // }, {
        //     label: 'genbank',
        //     value: 'genbank'
        // }, {
        //     label: 'genome feature format',
        //     value: 'gff'
        // },
        {
            label: 'BAM!',
            value: 'bam'
        }].map(function (item) {
            item.enabled = ko.pureComputed(function () {
                return typeFilter().indexOf(item.value) === -1;
            });
            return item;
        });

        // PROJECT FILTER
        // Note that the project filter key is "project_id", even
        // though there are underlying this at least two
        // project id fields -- sequencing and analysis.
        var seqProjectFilter = ko.observable();

        seqProjectFilter.subscribe(function (newValue) {
            var filter = searchFilter();
            if (!newValue) {
                delete filter.project_id;                
            } else {
                filter.project_id = [newValue];
            }
            searchFilter(filter);
        });

        var proposalFilter = ko.observable();
        proposalFilter.subscribe(function (newValue) {
            var filter = searchFilter();
            if (!newValue) {
                delete filter.proposal_id;                
            } else {
                filter.proposal_id = [newValue];
            }
            searchFilter(filter);
        });

        var piFilter = ko.observable();
        piFilter.subscribe(function (newValue) {
            var filter = searchFilter();
            if (!newValue) {
                delete filter.pi_name;                
            } else {
                filter.pi_name = newValue;
            }
            console.log('new filter is ...', filter, newValue);
            
            searchFilter(filter);
        });
        // SEARCH FLAGS

        var searching = ko.observable(false);

        var userSearch = ko.observable(false);

        // var searchState = ko.observable('none');

        // Interactive addition of search data from search results
        // into the search input.
        function doAddToSearch(data, field) {
            var newSearchInput = data[field];
            if (!data[field]) {
                return;
            }
            switch (typeof newSearchInput) {
            case 'string':
                // normal, nothing to do.
                break;
            case 'number':
                newSearchInput = String(newSearchInput);
                break;
            default:
                // errors.push('Search type not supported: ' + typeof newSearchInput);
                console.error('Search type not supported: ' + typeof newSearchInput);
            }
            searchInput(newSearchInput);
        }

        var availableRowHeight = ko.observable();

        var pageSize = ko.observable();


        // Handling search interactions...

        // This is the result of parsing from user input

        // Note: this is like a computed observable, but we don't want to
        // change the value of the search expression if there was no
        // change bits.
        // But a pure computed change will be triggered by the search input,
        // even though the resulting value for the computed is the same.
        var searchExpression = ko.observable({
            query: {},
            filter: {}
        });

        searchInput.subscribe(function () {
            var newExpression = utils.parseSearchExpression(searchInput());
            if (utils.isEqual(newExpression, searchExpression())) {
                return;
            }
            searchExpression(newExpression);
        });


        // This receives query fields from specific query controls.
        var searchAutoQuery = ko.observable({});

        // This receives filters from specific filter controls.
        var searchFilter = ko.observable({});

        // This is now a trigger for a new type to be added to the
        // type filter.
        // search.typeFilterInput.subscribe(function (newValue) {
        //     // first update the type filter list.
        //     if (newValue === 'all') {
        //         search.typeFilter.removeAll();
        //         search.typeFilterInput('');
        //     } else if (newValue === '') {
        //         // do nothing...
        //     } else {
        //         search.typeFilter.push(newValue);
        //         search.typeFilterInput('');
        //     }
        // });

        typeFilter.subscribe(function (newValue) {
            var newQuery = JSON.parse(JSON.stringify(searchAutoQuery()));

            var newTypeFilter = JSON.parse(JSON.stringify(newValue));

            if (newTypeFilter && newTypeFilter.length > 0) {
                newQuery.file_type = newTypeFilter.join(' | ');
            } else {
                delete newQuery.file_type;
            }

            // TODO: do this better!
            // if (!newQuery.file_type) {
            //     newQuery.file_type = ['fastq', 'fasta', 'bam'].join(' | ');
            // }

            if (utils.isEqual(newQuery, searchAutoQuery())) {
                return;
            }
            searchAutoQuery(newQuery);
        });
        // typeFilter([]);

        var currentSearch = {
            search: null,
            cancelled: false
        };

        function clearSearch() {
            if (currentSearch.search) {
                currentSearch.search.cancel();
                currentSearch.cancelled = true;
            }
            searchResults.removeAll();
            searchTotal(0);
            actualSearchTotal(0);
            currentSearch = {
                search: null,
                cancelled: false
            };
        }

        var error = ko.observable();
        function showError(err) {
            if (err instanceof utils.JGISearchError || err.info) {
                error({
                    source: err.source,
                    code: err.code,
                    message: err.message,
                    detail: err.detail,
                    info: err.info
                });
            } else if (err instanceof Error) {
                error({
                    code: 'error',
                    message: err.name + ': ' + err.message,
                    detail: 'trace here',
                    info: {
                        stackTrace: err.stack.split('\n')
                    }
                });
            } else {
                error({
                    code: 'unknown',
                    message: err.message,
                    detail: '',
                    info: err
                });
            }
            showOverlay({
                name: 'jgi-search/search-error',
                type: 'error',
                params: {
                    type: '"error"',
                    hostVm: 'search'
                },
                viewModel: {
                    error: error
                }
            });
        }

        function doSearch() {
            // Search cancellation
            if (currentSearch.search) {
                console.warn('cancelling search...');
                currentSearch.search.cancel();
                currentSearch.cancelled = true;
            }
            currentSearch = {
                search: null,
                cancelled: false
            };
            var thisSearch = currentSearch;
            var searchStart = new Date().getTime();

            var query = searchQuery();

            if (!query) {
                return;
            }

            if (!pageSize()) {
                console.warn('ditching search request - no page size yet', pageSize());
                return;
            }

            searching(true);

            return currentSearch.search = fetchQuery(query.query, query.filter, page(), pageSize())
                // .then(function (result) {
                //     // TODO: make better error object
                //     if (result.error) {
                //         throw new Error(result.error.message);
                //     }
                //     return result;
                // })
                .spread(function (result, error, stats) {
                    if (thisSearch.cancelled) {
                        console.warn('search cancelled, ignoring results...');
                        return;
                    }

                    // TODO: handle better!
                    if (error) {
                        // code, message, detail, info
                        
                        // console.log('ERROR', error);
                        thisSearch.search.cancel();
                        thisSearch.cancelled = true;
                        currentSearch = {
                            search: null,
                            cancelled: false
                        };
                        try {
                            clearQuery();
                        } catch (ex) {
                            console.error('huh?', ex);
                        }
                        showError(new utils.JGISearchError(
                            'dynamic_service:jgi_search_gateway',
                            error.code,
                            error.message,
                            'An error was encountered processing your search request.',
                            error.info
                        ));
                        // showError(error, div([
                        //     p('An error has occurred processing your JGI Search.'),
                        //     p('The search details are shown below. '),
                        //     p([
                        //         'If this problem persists, you may consider ',
                        //         a({
                        //             href: runtime.config('resources.help.url'),
                        //             target: '_blank'
                        //         }, 'filing a bug report'),
                        //         '.'
                        //     ])
                        // ]));
                        // clearSearch();
                        return;
                        // ErrorWidget.show({
                        //     title: 'Error',
                        //     body: div([
                        //         p('An error has occurred processing your JGI Search.'),
                        //         p('The search details are shown below. '),
                        //         p([
                        //             'If this problem persists, you may consider ',
                        //             a({
                        //                 href: runtime.config('resources.help.url'),
                        //                 target: '_blank'
                        //             }, 'filing a bug report'),
                        //             '.'
                        //         ])
                        //     ]),
                        //     error: error
                        //     // body: error.message + '(' + error.type + ',' + error.code + ')'
                        // });
                        // return;
                        // throw new Error(error.message + '(' + error.type + ',' + error.code + ')');
                    }

                    var searchCallElapsed = new Date().getTime() - searchStart;
                    console.log('ui search call elapsed', searchCallElapsed);
                    console.log('jgi search elapsed', stats);

                    if (result.total > maxSearchResults) {
                        actualSearchTotal(result.total);
                        var actualMax = pageSize() * Math.floor(maxSearchResults/pageSize());
                        searchTotal(actualMax);
                        addMessage({
                            type: 'warning',
                            message: 'Too many search results (' + result.total + '), restricted to 10,000'
                        });
                    } else {
                        actualSearchTotal(result.total);
                        searchTotal(result.total);
                    }

                    searchResults.removeAll();
                    searchElapsed(stats.request_elapsed_time);

                    var jobMap = {};
                    stagingJobs().forEach(function (job) {
                        jobMap[job.dbId] = job;
                    });

                    result.hits.forEach(function (hit, index) {
                        // var project = hit.source.metadata;
                        var rowNumber = (page() - 1) * pageSize() + 1 + index;

                        var sequencingProjectId = (function (id) {
                            // return {
                            //     value: id,
                            //     addToSearch:  function () {
                            //         seqProjectFilter.push(id);
                            //     }
                            // };
                            return {
                                value: id,
                                info: 'Sequencing project id'
                            };
                        }(utils.getProp(hit.source.metadata, ['sequencing_project_id'])));

                        var pmoProjectId = (function (id) {
                            return {
                                value: id
                            };
                        }(utils.getProp(hit.source.metadata, ['pmo_project_id'])));

                        var analysisProjectId = utils.getProp(hit.source.metadata, ['analysis_project_id'], '-');

                        var proposalId = {
                            value: utils.getProp(hit.source.metadata, ['proposal_id']),
                            info: utils.getProp(hit.source.metadata, ['proposal.title'], 'Proposal title unavailable')
                        };

                        // actual file suffix.
                        // var fileExtension;
                        // var reExtension = /^(.*)\.(.*)$/;
                        // var fileName = hit.source.file_name;
                        // var m = reExtension.exec(fileName);
                        // if (m) {
                        //     fileExtension = m[2];
                        // } else {
                        //     fileExtension = null;
                        // }
                        var fileParts = utils.grokFileParts(hit.source.file_name);
                        var fileType = utils.grokFileType(hit.source.file_type, fileParts);

                        var title = utils.grokTitle(hit, fileType);

                        var scientificName = utils.grokScientificName(hit, fileType);

                        var pi = utils.grokPI(hit, fileType);

                        // var pi = (function (id) {
                        //     var pi = utils.grokPI(hit, fileType);
                        //     if (!pi) {
                        //         return '';
                        //     }
                            
                        //     // return {
                        //     //     text: pi.text,
                        //     //     addToSearch:  function () {
                        //     //         var oldInput = searchInput() || '';
                        //     //         searchInput(oldInput + (pi.first ? ' ' + pi.first : '') + (pi.last ? ' ' + pi.last : '') );
                        //     //     }
                        //     // };
                        //     return pi.text;
                        // }());

                        // TODO move this out to a function:
                        var s1;
                        // console.log('PORTAL', fileType.dataType, utils.getProp(hit, 'source.metadata.portal.display_location'));
                        var portalLocation = utils.getProp(hit, 'source.metadata.portal.display_location');
                        if (portalLocation && portalLocation instanceof Array) {
                            if (portalLocation.length > 0) {
                                if (portalLocation.length > 1) {
                                    console.warn('more than one portal display location');
                                }
                                switch (fileType.dataType) {
                                case 'fastq':
                                    switch (portalLocation[0]) {
                                    case 'Raw Data':
                                        s1 = {
                                            value: 'raw',
                                            info: 'Raw Data'
                                        };
                                        break;
                                    case 'QC Filtered Raw Data':
                                        s1 = {
                                            // value: 'QCFil',
                                            value: 'filtered',
                                            info: 'QC Filtered Raw Data'
                                        };
                                        break;
                                    case 'QA Filtered Raw Data':
                                        s1 = {
                                            // value: 'QAFil',
                                            value: 'filtered',
                                            info: 'QA Filtered Raw Data'
                                        };
                                        break;
                                    case 'Metatranscriptome Filtered Data':
                                        s1 = {
                                            value: 'MetaFil',
                                            info: 'Metatranscriptome Filtered Data'
                                        };
                                        break;
                                    case 'QC and Genome Assembly':
                                        s1 = {
                                            value: 'QCGenAss',
                                            info: 'QC and Genome Assembly'
                                        };
                                        break;
                                    default:
                                        if (portalLocation[0]) {
                                            s1 = {
                                                value: '?',
                                                info: 'Unrecognized reads type "' + utils.getProp(hit, 'source.metadata.portal.display_location', '-')
                                            };
                                        } else {
                                            s1 = {
                                                value: '?',
                                                info: 'No reads type defined'
                                            };
                                        }
                                        s1 = '*' + utils.getProp(hit, 'source.metadata.portal.display_location', '-');
                                    }
                                    break;
                                }
                            } else if (portalLocation.length === 0) {
                                console.warn('empty portal location');
                            }
                        }
                        if (!s1) {
                            s1 = {
                                value: '-',
                                info: ''
                            };
                        }

                        var s2;
                        switch (fileType.dataType) {
                        case 'fastq':
                            // s2 = utils.getProp(hit, 'source.metadata.sow_segment.index_sequence', '-');
                            if (utils.hasProp(hit, 'source.metadata.gold_data')) {
                                var goldLabel;
                                var goldUrl;
                                if (utils.hasProp(hit, 'source.metadata.gold_data.gold_url')) {
                                    goldUrl = utils.getProp(hit, 'source.metadata.gold_data.gold_url');
                                    goldLabel = 'GOLD';
                                } else if (utils.hasProp(hit, 'source.metadata.gold_data.gold_stamp_id')) {
                                    var goldId = utils.getProp(hit, 'source.metadata.gold_data.gold_stamp_id');
                                    goldUrl = 'https://gold.jgi.doe.gov/projects?id=' + goldId;
                                    if (!/^Gp/.test(goldId)) {
                                        goldLabel = 'GOLD?';
                                    } else {
                                        goldLabel = 'GOLD*';
                                    }
                                }
                                if (goldUrl) {
                                    s2 = {
                                        value: goldLabel,
                                        info: 'Link to gold record',
                                        url: goldUrl
                                    };
                                } 
                            }                           
                            break;
                        
                        }
                        var resultItem = {
                            id: hit.id,
                            rowNumber: rowNumber,
                            title: title,
                            pi: pi,
                            proposalId: proposalId,
                            analysisProjectId: analysisProjectId,
                            pmoProjectId: pmoProjectId,
                            sequencingProjectId: sequencingProjectId,
                            date: {
                                value: new Date(hit.source.file_date),
                                info: 'The file date'
                            },
                            scientificName: scientificName,
                            dataType: {
                                value: fileType.dataType,
                                info: 'The file format'
                            },
                            s1: s1,
                            s2: s2,
                            fileSize: {
                                value: hit.source.file_size,
                                info: numeral(hit.source.file_size).format('0.0 b') + '\n(the size of the file)'
                            },
                            // view stuff
                            selected: ko.observable(false),
                            isPublic: utils.getProp(hit, 'source._es_public_data', false),
                            doTransfer: function () {
                                try {
                                    doStage(hit.id, hit.source.file_name);
                                } catch (ex) {
                                    console.error('ERROR staging', ex);
                                }
                            },
                            stage: {
                                value: hit.source.file_name,
                                info: 'Copy this file to your staging area',
                                fileName: hit.source.file_name
                            },
                            transferJob: ko.observable(jobMap[hit.id])
                        };
                        
                        searchResults.push(resultItem);
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    showError(error);
                })
                .finally(function () {
                    // currentSearch = {
                    //     search: null,
                    //     cancelled: false
                    // };
                    // if (!thisSearch.cancelled) {
                        searching(false);
                    // }
                });
        }

        // EXPLICIT LISTENERS
        page.subscribe(function () {
            doSearch();
        });

        pageSize.subscribe(function() {
            doSearch();
        });

        searchQuery.subscribe(function () {
            // reset the page back to 1 because we do not konw if the
            // new search will extend this far.
            if (!page()) {
                page(1);
            } else if (page() > 1) {
                page(1);
            }
            doSearch();
        });

        // TRY COMPUTING UBER-STATE
        var searchState = ko.pureComputed(function () {
            // TODO: error

            if (searching()) {
                return 'inprogress';
            }

            if (searchQuery()) {
                if (!pageSize()) {
                    return 'pending';
                }
                if (searchResults().length === 0) {
                    return 'notfound';
                } else {
                    return 'success';
                }
            } else {
                return 'none';
            }
        });

        var status = ko.observable('none');

        var jgiTermsAgreed = ko.observable(false);

        function saveJgiAgreement(agreed) {
            var username = runtime.service('session').getUsername();
            var profileService = new GenericClient({
                // Note now using the module name for the service id in the services config.
                url: runtime.config('services.UserProfile.url'),
                token: runtime.service('session').getAuthToken(),
                module: 'UserProfile'
            });
            profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var prefs = Props.make({data: profile.getItem('profile.preferences', {})});

                    prefs.setItem('agreements.jgiData',  {
                        agreed: agreed,
                        time: new Date().getTime()
                    });

                    var profileUpdate = {
                        profile: {
                            profile: {
                                preferences: prefs.debug()
                            },
                            user: profile.getItem('user')
                        }
                    };

                    // Don't want to really replace, but update_user_profile only 
                    return profileService.callFunc('update_user_profile', [profileUpdate])
                        .then(function () {
                            // successfully saved profile
                            // console.log('saved profile...');
                            if (agreed) {
                                status('agreed');
                            } else {
                                status('needagreement');
                            }
                        })
                        .catch(function (err) {
                            // TODO: need error message!
                            console.error('failed to save profile...', err);
                        });
                })
                .catch(function (err) {
                    console.error('error getting profile', err);
                });
        }
        function getJgiAgreement() {
            var username = runtime.service('session').getUsername();
            var profileService = new GenericClient({
                // Note now using the module name for the service id in the services config.
                url: runtime.config('services.UserProfile.url'),
                token: runtime.service('session').getAuthToken(),
                module: 'UserProfile'
            });
            profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var agreed = profile.getItem('profile.preferences.agreements.jgiData.agreed', false);
                    if (agreed) {
                        status('agreed');
                    } else {
                        status('needagreement');
                    }
                })
                .catch(function (err) {
                    console.error('error getting profile', err);
                    return false;
                });
        }

        jgiTermsAgreed.subscribe(function (newValue) {
            // save the agreed-to-state in the user's profile.
            console.log('saving to profile...');
            saveJgiAgreement(newValue);
        });

        getJgiAgreement();


        var overlayComponent = ko.observable();
        
        var showOverlay = ko.observable();

        showOverlay.subscribe(function (newValue) {
            overlayComponent(newValue);
        });

        var vm = {
            search: {
                // INPUTS
                searchInput: searchInput,
                // typeFilterInput: typeFilterInput,
                typeFilter: typeFilter,
                typeFilterOptions: typeFilterOptions,

                seqProjectFilter: seqProjectFilter,
                proposalFilter: proposalFilter,
                piFilter: piFilter,

                jgiTermsAgreed: jgiTermsAgreed,

                error: error,

                // SYNTHESIZED INPUTS
                searchQuery: searchQuery,
                searchState: searchState,

                // OVERLAY
                showOverlay: showOverlay,

                // RESULTS
                searchResults: searchResults,
                searchTotal: searchTotal,
                actualSearchTotal: actualSearchTotal,
                searchElapsed: searchElapsed,
                searching: searching,
                userSearch: userSearch,
                availableRowHeight: availableRowHeight,
                
                // showResults: showResults,
                // noSearch: noSearch,
                doAddToSearch: doAddToSearch,

                // for fetching details of a serach result item.
                getDetail: getDetail,

                // check whether filename exists or not.
                checkFilename: checkFilename,

                // Staging
                stagingJobStates: stagingJobStates,
                stagingJobsState: stagingJobsState,
                monitoringJobs: monitoringJobs,
                stagingJobs: stagingJobs,

                pageSize: pageSize,
                // Note, starts with 1.
                page: page,
                errors: errors,
                messages: messages,
                doRemoveError: doRemoveError,
                doRemoveMessage: doRemoveMessage,
                addMessage: addMessage,
                doStage: doStage,

                doSearch: doSearch,
                status: status
            },
            overlayComponent: overlayComponent
        };
        return vm;
    }

    function template() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                padding: '10px'
            }
        }, [
            '<!-- ko switch: search.status -->',
            // possible states:
            // awaiting agreement status
            // agreed
            // not agreed

            '<!-- ko case: "none" -->', 
            'loading...',
            '<!-- /ko -->',

            '<!-- ko case: "needagreement" -->', 
            // '<!-- ko ifnot: $component.search.jgiTermsAgreed() -->',
            utils.komponent({
                name: 'jgi-search/terms',
                params: {
                    search: 'search'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko case: "agreed" -->', 
            // '<!-- ko if: $component.search.jgiTermsAgreed() -->',
            utils.komponent({
                name: 'jgisearch/search',
                params: {
                    search: 'search'
                }
            }),
            '<!-- /ko -->',

           
            // '<!-- ko case: $default -->', 
            // 'hmm',
            // div({
            //     dataBind: {
            //         text: 'search.status'
            //     }
            // }),
            // '<!-- /ko -->',

            '<!-- /ko -->',
            utils.komponent({
                name: 'generic/overlay-panel',
                params: {
                    component: 'overlayComponent',
                    hostVm: 'search'
                }
            })
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});
