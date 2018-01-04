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
    '../lib/profile',
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
    Profile,
    Import
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function getImportInfo(dataType, indexId, fileName, hit) {
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

        // TODO: replace all of this staging job business with more specific
        // calls to get:
        // - counts of pending jobs in each state
        // - whether there are any pending jobs for a given search id
        //   in order to show the status in the table... but ...
        var stagingJobs = ko.observableArray();
        // // var stagingJobsMap = {};
        // stagingJobs.subscribe(function (changes) {
        //     changes.forEach(function (change) {
        //         if (change.status === 'deleted') {
        //             // delete stagingJobsMap[change.value.id];
        //         } else {
        //             // stagingJobsMap[change.value.id] = change.value;
        //             monitorJobs();
        //         }
        //     });
        // }, null, 'arrayChange');

        // contains a couunt of the number of staging jobs in particular
        // stages during this search session, which begins when the component
        // is loaded and ends when it is unloaded.
        var stagingJobStates = {
            sent: ko.observable(0),
            submitted: ko.observable(0),
            queued: ko.observable(0),
            restoring: ko.observable(0),
            copying: ko.observable(0),
            completed: ko.observable(0),
            error: ko.observable(0)
        };

        var stagingJobsState = ko.pureComputed(function () {
            var pending = stagingJobStates.sent() +
                stagingJobStates.submitted() +
                stagingJobStates.queued() +
                stagingJobStates.restoring() +
                stagingJobStates.copying();
        
            return {
                pending: pending,
                completed: stagingJobStates.completed(),
                some: pending + stagingJobStates.completed() + stagingJobStates.error()
            };
        });

        function updateStagingJobStates() {
            var states = {
                sent: 0,
                submitted: 0,
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

        function getStagingJobStatus() {
            var param = {
                username: runtime.service('session').getUsername()
            };
            return rpc.call('jgi_gateway_eap', 'staging_jobs_summary', param)
                .spread(function (result, error) {
                    if (error) {
                        console.error('ERROR', error);
                        return;
                    }
                    ['sent', 'submitted', 'queued', 'restoring', 'copying', 'completed', 'error'].forEach(function (state) {
                        stagingJobStates[state](result.state[state]);
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        var timer;

        function jobStatusLoop() {
            getStagingJobStatus()
                .finally(function () {
                    timer = window.setTimeout(function () {
                        jobStatusLoop();
                    }, 10000);
                });
        }

        jobStatusLoop();



        // function getStagingJobs() {
        //     // var first = (page - 1) * pageSize;
        //     // var count = pageSize;
        //     var param = {
        //         username: runtime.service('session').getUsername(),
        //         filter: {                    
        //         },
        //         range: {
        //             start: 0,
        //             limit: 1000
        //         }
        //     };
        //     return rpc.call('jgi_gateway_eap', 'staging_jobs', param)
        //         .spread(function (result, error) {
        //             if (result) {
        //                 result.jobs.forEach(function (job) {
        //                     var j = {
        //                         dbId: job.jamo_id,
        //                         filename: job.filename,
        //                         jobId: job.job_id,
        //                         started: new Date(job.created * 1000),
        //                         updated: ko.observable(job.updated ? new Date(job.updated * 1000) : null),
        //                         status: ko.observable(job.status_code)
        //                     };
        //                     stagingJobs.push(j);
        //                 });
        //             } else if (error) {
        //                 console.error('ERROR', error);
        //             } else {
        //                 // what here?
        //             }
        //         })
        //         .catch(function (err) {
        //             console.error('ERROR getting staging jobs:', err);
        //         });
        // }

        // // get initial staging jobs.
        // getStagingJobs();

        function doStage(id, fileName) {
            return rpc.call('jgi_gateway_eap', 'stage', {
                file: {
                    id: id,
                    filename: fileName,
                    username: runtime.service('session').getUsername()
                }
            })
                .spread(function (result, error) {
                    if (result) {
                        var job = {
                            dbId: id,
                            filename: fileName,
                            jobId: result.job_id,
                            started: new Date(),
                            updated: ko.observable(new Date()),
                            status: ko.observable('sent')
                        };
                        // job.elapsed = ko.pureComputed(function () {
                        //     return this.updated().getTime() - this.started.getTime();
                        // }.bind(job));
                        // stagingJobs.push(job);

                        // Set it it the results item as well.
                        // TODO: restore this behavior!
                        // var res = searchResults();
                        // for (var i = 0; i < res.length; i += 1) {
                        //     var item = res[i];
                        //     if (item.id === job.dbId) {
                        //         item.transferJob(job);
                        //         break;
                        //     }
                        // }

                        return job;
                    } else {
                        console.error('ERROR staging', error);
                        throw new Error('Empty result when staging');
                    }
                })
                .catch(function (err) {
                    return {
                        message: err.message,
                        error: err
                    };
                });
        }


        // Fetch send a query and fetch the results.
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
            return rpc.call('jgi_gateway_eap', 'search', param);
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
                sort: [],
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

        function checkFilename(filename) {
            return Promise.try(function () {
                try {
                    var error = validateFilename(filename);

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
                return getFileMetadata(filename)
                    .spread(function (result, error) {
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
                    .catch(function (err) {
                        return {
                            exception: err.message
                        };
                        // console.error('ERROR checking filename', err);
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
            page(null);
            currentSearch = {
                search: null,
                query: null,
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

            var query = searchQuery();

            if (!query) {
                return;
            }

            // TODO: compare previous to current query ... if same, do not do another search, just 
            //   return. The problem is stuttering -- duplicate updates to the search query 
            //   via observables.

            // TODO: eliminate stuttering!
            // Sometimes observables cause duplicate updates to the search query ... 
            // stop that.

            if (!pageSize()) {
                console.warn('ditching search request - no page size yet', pageSize());
                return;
            }

            currentSearch = {
                search: null,
                query: query,
                cancelled: false
            };
            var thisSearch = currentSearch;
            var searchStart = new Date().getTime();


            searching(true);

            return currentSearch.search = fetchQuery(query.query, query.filter, sortSpec(),  page(), pageSize())
                .spread(function (result, error, stats) {
                    if (thisSearch.cancelled) {
                        console.warn('search cancelled, ignoring results...');
                        return false;
                    }

                    // TODO: handle better!
                    if (error) {
                        // thisSearch.search.cancel();
                        // thisSearch.cancelled = true;
                        currentSearch = {
                            search: null,
                            cancelled: false
                        };
                        try {
                            clearQuery();
                            clearSearch();
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
                        return true;
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
                        var rowNumber = (page() - 1) * pageSize() + 1 + index;

                        var sequencingProjectId = (function (id) {
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

                        var fileParts = utils.grokFileParts(hit.source.file_name);
                        
                        var fileType = utils.grokFileType(hit.source.file_type, fileParts);

                        var title = utils.grokTitle(hit, fileType);

                        var scientificName = utils.grokScientificName(hit, fileType);

                        var pi = utils.grokPI(hit, fileType);

                        // TODO move this out to a function:
                        var s1;
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

                        var stagingInfo;
                    
                        if (fileType.error) {
                            stagingInfo = fileType.error.message;
                        } else {
                            stagingInfo = 'Copy this file to your staging area';
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
                                info: stagingInfo,
                                fileName: hit.source.file_name
                            },
                            // For reference, not direct display
                            transferJob: ko.observable(jobMap[hit.id]),
                            fileType: fileType
                        };
                        
                        searchResults.push(resultItem);                        
                    });
                    return true;
                })
                .then(function (searched) {
                    if (searched) {
                        searching(false);
                    }
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    searching(false);
                    showError(error);
                })
                .finally(function () {
                    currentSearch = {
                        search: null,
                        cancelled: false
                    };
                });
        }

        // EXPLICIT LISTENERS
        page.subscribe(function () {
            doSearch();
        });

        pageSize.subscribe(function() {
            doSearch();
        });

        searchQuery.subscribe(function (newValue) {
            // reset the page back to 1 because we do not know if the
            // new search will extend this far.
            if (!newValue) {
                page(null);
                return;
            }
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
            var profile = Profile.make({
                runtime: runtime
            });
            profile.saveJgiAgreement(agreed)
                .spread(function (result, error) {
                    if (result) {
                        if (agreed) {
                            status('agreed');
                        } else {
                            status('needagreement');
                        }
                    } else {
                        showError(error);
                    }
                });
        }

        function getJgiAgreement() {
            var profile = Profile.make({
                runtime: runtime
            });
            profile.getJgiAgreement()
                .spread(function (result, error) {
                    if (result) {
                        if (result.agreed) {
                            status('agreed');
                        } else {
                            status('needagreement');
                        }
                    } else {
                        // show error...
                        showError(error);
                    }
                });
        }

        // SEARCH HISTORY

        var searchHistory = ko.observableArray();

        function getSearchHistory() {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.getSearchHistory()
                .spread(function (result, error) {
                    if (result) {
                        return result;
                    } else {
                        showError(error);
                    }
                });
        }

        function saveSearchHistory(history) {
            var profile = Profile.make({
                runtime: runtime
            });
            return profile.saveSearchHistory(history)
                .spread(function (result, error) {
                    if (result) {
                        return result;
                    } else {
                        showError(error);
                    }
                });
        }

        searchHistory.subscribe(function (newValue) {
            saveSearchHistory(newValue);
        });

        getSearchHistory()
            .then(function (history) {
                searchHistory(history);
            })
            .catch(function (err) {
                console.error('ERROR retrieving search history', err);
            });

        // TERMS AND AGREEMENT
 
        jgiTermsAgreed.subscribe(function (newValue) {
            // save the agreed-to-state in the user's profile.
            saveJgiAgreement(newValue);
        });

        getJgiAgreement();


        var overlayComponent = ko.observable();
        
        var showOverlay = ko.observable();

        showOverlay.subscribe(function (newValue) {
            overlayComponent(newValue);
        });

        function showStageJobViewer() {
            showOverlay({
                name: 'jgi-search/staging-status-viewer',
                viewModel: {
                    runtime: runtime
                }
            });
        }

        // sortColumns is the ordered list of all columns currently
        // sorted. Each sort object is a reference to the actual column
        // sort spec.
        var sortColumns = ko.observableArray();

        // The sortSpec translates the sortColumns into a form which can be
        // used by the search.
        var sortSpec = ko.pureComputed(function () {
            return sortColumns().map(function (column) {
                return {
                    field: column.sort.keyName,
                    descending: column.sort.direction() === 'descending'
                };
            });            
        });

        sortSpec.subscribe(function () {
            doSearch();
        });

        function sortBy(column) {
            if (!column.sort) {
                console.warn('Sort not implemented for this column, but sort by called anyway', column);
                return;
            }

            // for now just single column sort.            
            if (sortColumns().length === 1) {
                var currentSortColumn = sortColumns()[0];
                if (currentSortColumn !== column) {
                    currentSortColumn.sort.active(false);
                }
                sortColumns.removeAll();                
            }

            if (column.sort.active()) {
                column.sort.direction(column.sort.direction() === 'descending' ? 'ascending' : 'descending');
            } else {
                column.sort.active(true);
            }

            sortColumns.push(column);
        }

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

                searchHistory: searchHistory,

                // for fetching details of a serach result item.
                getDetail: getDetail,

                // check whether filename exists or not.
                checkFilename: checkFilename,

                // Staging
                stagingJobStates: stagingJobStates,
                stagingJobsState: stagingJobsState,
                runtime: runtime,

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
                status: status,
                showStageJobViewer: showStageJobViewer,

                sortBy: sortBy
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
                name: 'jgi-search/search',
                params: {
                    search: 'search'
                }
            }),
            '<!-- /ko -->',

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
