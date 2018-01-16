/*
Top level panel for jgi search
*/
define([
    // global deps
    'bluebird',
    'knockout-plus',
    'numeral',
    // local deps
    '../errorWidget',
    '../lib/utils',
    './data',
    './schema',
    '../viewModels/stagingJobs',
    '../components/stagingStatusViewer'
], function (
    Promise,
    ko,
    numeral,
    ErrorWidget,
    utils,
    Data,
    schema,
    StagingJobsVm,
    StagingStatusViewerComponent
) {
    'use strict';

    function factory(params) {
        var runtime = params.runtime;
        var showError = params.showError;
        var showOverlay = params.showOverlay;
        var error = params.error;


        var maxSearchResults = 10000;
        var data = Data.make({
            runtime: runtime
        });

        var stagingJobsVm = StagingJobsVm.make({
            runtime: runtime
        });


        var searchResults = ko.observableArray();
        var searchInput = ko.observable();
        var searchTotal = ko.observable();
        var actualSearchTotal = ko.observable();
        var searchElapsed = ko.observable();

        var page = ko.observable();

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

        function getDetail(id) {
            return data.fetchDetail(id)
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

                    var jobs = stagingJobsVm.stagingJobs().filter(function (job) {
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
                            typing: fileType,
                            md5sum: hit.source.md5sum
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

        function checkFilename(filename) {
            return Promise.try(function () {
                try {
                    var error = schema.validateFilename(filename);

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
                return data.getFileMetadata(filename)
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

            return currentSearch.search = data.fetchQuery(query.query, query.filter, sortSpec(),  page(), pageSize())
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
                    } else {
                        actualSearchTotal(result.total);
                        searchTotal(result.total);
                    }

                    searchResults.removeAll();
                    searchElapsed(stats.request_elapsed_time);

                    var jobMap = {};
                    stagingJobsVm.stagingJobs().forEach(function (job) {
                        jobMap[job.dbId] = job;
                    });
                    

                    schema.hitsToRows(result.hits, doStage, jobMap).forEach(function (row) {                     
                        searchResults.push(row);                        
                    });
                    return true;
                })
                .then(function (searched) {
                    if (searched) {
                        searching(false);
                    }
                })
                .catch(function (err) {
                    console.error('ERRORx', err);
                    searching(false);
                    showError(err);
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

            // if (health() === 'sick') {
            //     return 'sick';
            // }

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

        // SEARCH HISTORY

        var searchHistory = ko.observableArray();

        searchHistory.subscribe(function (newValue) {
            data.saveSearchHistory(newValue)
                .spread(function (result, error) {
                    if (error) {
                        showError(error);
                    }
                });
        });

        data.getSearchHistory()
            .spread(function (result, error) {
                if (error) {
                    showError(error);
                } else {
                    searchHistory(result);                    
                }
            })
            .catch(function (err) {
                console.error('ERROR retrieving search history', err);
            });

      

       

        // SORTING support

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

        // var health = ko.observable('healthy');

        // health.subscribe(function (newValue) {
        //     if (newValue === 'sick') {
        //         status('sick');
        //     }
        // });


        // ACTIONS

        function doStage(id, fileName) {
            data.stageFile(id, fileName);
        }

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

        function showStageJobViewer() {
            showOverlay({
                name: StagingStatusViewerComponent.name(),
                viewModel: {
                    runtime: runtime
                }
            });
        }

        // LIFECYCLE

        function start() {
            stagingJobsVm.start();
        }

        function stop() {
            stagingJobsVm.stop();
        }

        return {
            // health: health,
            // INPUTS
            searchInput: searchInput,
            // typeFilterInput: typeFilterInput,
            typeFilter: typeFilter,
            typeFilterOptions: typeFilterOptions,

            seqProjectFilter: seqProjectFilter,
            proposalFilter: proposalFilter,
            piFilter: piFilter,

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
            stagingJobStates: stagingJobsVm.stagingJobStates,
            stagingJobsState: stagingJobsVm.stagingJobsState,
            runtime: runtime,

            pageSize: pageSize,
            // Note, starts with 1.
            page: page,
            doStage: doStage,

            doSearch: doSearch,
            showStageJobViewer: showStageJobViewer,

            sortBy: sortBy,
            
            start: start,
            stop: stop
        };
    }

    return {
        make: factory
    };
});
