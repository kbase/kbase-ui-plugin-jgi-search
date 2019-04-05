/*
Top level panel for jgi search
*/
define([
    // global deps
    'knockout',
    // kbase deps
    'kb_knockout/lib/viewModelBase',
    // local deps
    '../lib/utils',
    '../lib/model',
    './schema',
    '../viewModels/stagingJobs',
    '../components/stagingStatusViewer'
], function (
    ko,
    ViewModelBase,
    utils,
    Model,
    schema,
    StagingJobsViewModel,
    StagingStatusViewerComponent
) {
    'use strict';

    class SearchViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.showOverlay = context.$root.showOverlay;
            this.runtime = context.$root.runtime;

            this.showError = params.showError;
            this.error = params.error;

            this.maxSearchResults = 10000;
            this.model = new Model({
                runtime: this.runtime
            });

            this.stagingJobsVm = new StagingJobsViewModel({
                runtime: this.runtime
            });
            this.stagingJobsState = this.stagingJobsVm.stagingJobsState;

            this.searchResults = ko.observableArray();
            this.searchInput = ko.observable();
            this.searchTotal = ko.observable();
            this.actualSearchTotal = ko.observable();
            this.searchElapsed = ko.observable();
            this.searchInstanceID = ko.observable();
            this.page = ko.observable();

            this.searchQuery = ko.pureComputed(() => {
                // Search input dependencies
                // We make deep copies of our search inputs so we can
                // play with them.
                const query = JSON.parse(JSON.stringify(this.searchExpression()));

                const autoQuery = this.searchAutoQuery();
                const filter = this.searchFilter();

                // transfer filters to the search query.
                Object.keys(filter).forEach((key) => {
                    query.filter[key] = filter[key];
                });

                Object.keys(autoQuery).forEach((key) => {
                    query.query[key] = autoQuery[key];
                });

                // If we have a filter but no query, we just assume the query
                // selects all
                if (Object.keys(query.query).length === 0) {
                    if (Object.keys(query.filter).length > 0) {
                        query.query._all = '*';
                    } else {
                        // nothing to do, just reset the search
                        this.clearSearch();
                        return null;
                    }
                }

                // const id = this.searchInstanceID();

                // Default file type filter, now enabled by "show supported file types" checkbox.
                if (!query.query.file_type) {
                    query.query.file_type = this.typeFilterOptions.map((option) => {
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

            this.typeFilter = ko.observableArray();
            this.typeFilterOptions = [{
                label: 'FASTQ',
                value: 'fastq'
            }, {
                label: 'FASTA',
                value: 'fasta'
            },{
                label: 'BAM',
                value: 'bam'
            }].map((item) => {
                item.enabled = ko.pureComputed(() => {
                    return this.typeFilter().indexOf(item.value) === -1;
                });
                return item;
            });

            // PROJECT FILTER
            // Note that the project filter key is "project_id", even
            // though there are underlying this at least two
            // project id fields -- sequencing and analysis.
            this.seqProjectFilter = ko.observable();
            this.subscribe(this.seqProjectFilter, (newValue) => {
                var filter = this.searchFilter();
                if (!newValue) {
                    delete filter.project_id;
                } else {
                    filter.project_id = [newValue];
                }
                this.searchFilter(filter);
            });

            this.proposalFilter = ko.observable();
            this.subscribe(this.proposalFilter, (newValue) => {
                var filter = this.searchFilter();
                if (!newValue) {
                    delete filter.proposal_id;
                } else {
                    filter.proposal_id = [newValue];
                }
                this.searchFilter(filter);
            });

            this.piFilter = ko.observable();
            this.subscribe(this.piFilter, (newValue) => {
                var filter = this.searchFilter();
                if (!newValue) {
                    delete filter.pi_name;
                } else {
                    filter.pi_name = newValue;
                }
                this.searchFilter(filter);
            });
            // SEARCH FLAGS
            this.searching = ko.observable(false);
            this.userSearch = ko.observable(false);


            this.availableRowHeight = ko.observable();
            this.pageSize = ko.observable();

            // Handling search interactions...

            // This is the result of parsing from user input

            // Note: this is like a computed observable, but we don't want to
            // change the value of the search expression if there was no
            // change bits.
            // But a pure computed change will be triggered by the search input,
            // even though the resulting value for the computed is the same.
            this.searchExpression = ko.observable({
                query: {},
                filter: {}
            });

            this.subscribe(this.searchInput, (newSearchInput) => {
                var newExpression = utils.parseSearchExpression(newSearchInput);
                if (utils.isEqual(newExpression, this.searchExpression())) {
                    return;
                }
                this.addToSearchHistory(newSearchInput);
                this.searchExpression(newExpression);
            });

            // This receives query fields from specific query controls.
            this.searchAutoQuery = ko.observable({});

            // This receives filters from specific filter controls.
            this.searchFilter = ko.observable({});

            this.subscribe(this.typeFilter, (newValue) => {
                const newQuery = JSON.parse(JSON.stringify(this.searchAutoQuery()));
                const newTypeFilter = JSON.parse(JSON.stringify(newValue));

                if (newTypeFilter && newTypeFilter.length > 0) {
                    newQuery.file_type = newTypeFilter.join(' | ');
                } else {
                    delete newQuery.file_type;
                }

                if (utils.isEqual(newQuery, this.searchAutoQuery())) {
                    return;
                }
                this.searchAutoQuery(newQuery);
            });

            this.currentSearch = {
                search: null,
                cancelled: false
            };

            // EXPLICIT LISTENERS
            this.subscribe(this.page, () => {
                this.doSearch();
            });

            this.subscribe(this.pageSize, () => {
                this.doSearch();
            });

            this.subscribe(this.searchQuery, (newValue) => {
                // reset the page back to 1 because we do not know if the
                // new search will extend this far.
                if (!newValue) {
                    this.page(null);
                    return;
                }
                if (!this.page()) {
                    this.page(1);
                } else if (this.page() > 1) {
                    this.page(1);
                }
                this.doSearch();
            });

            // TRY COMPUTING UBER-STATE

            this.searchState = ko.pureComputed(() => {
                if (this.searching()) {
                    return 'inprogress';
                }

                if (this.searchQuery()) {
                    if (!this.pageSize()) {
                        return 'pending';
                    }
                    if (this.searchResults().length === 0) {
                        return 'notfound';
                    } else {
                        return 'success';
                    }
                } else {
                    return 'none';
                }
            });

            // SEARCH HISTORY

            this.searchHistory = ko.observableArray();

            this.subscribe(this.searchHistory, (newValue) => {
                this.model.saveSearchHistory(newValue)
                    .spread((result, error) => {
                        if (error) {
                            this.showError(error);
                        }
                    });
            });

            // SORTING support

            // sortColumns is the ordered list of all columns currently
            // sorted. Each sort object is a reference to the actual column
            // sort spec.
            this.sortColumns = ko.observableArray();

            // The sortSpec translates the sortColumns into a form which can be
            // used by the search.
            this.sortSpec = ko.pureComputed(() => {
                return this.sortColumns().map((column) => {
                    return {
                        field: column.sort.keyName,
                        descending: column.sort.direction() === 'descending'
                    };
                });
            });

            this.subscribe(this.sortSpec, () => {
                this.doSearch();
            });

            // MAIN

            this.model.getSearchHistory()
                .spread((result, error) => {
                    if (error) {
                        this.showError(error);
                    } else {
                        this.searchHistory(result);
                    }
                })
                .then(() => {
                    this.searchInput(params.initialQuery);
                })
                .catch((err) => {
                    console.error('ERROR retrieving search history', err);
                });
        }

        clearQuery() {
            this.seqProjectFilter(null);
            this.proposalFilter(null);
            this.searchInput('');
        }

        // getDetail(id) {
        //     return this.model.fetchDetail(id)
        //         .then((result) => {
        //             const hit = result.hits[0];
        //             let projectId;
        //             if (hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id) {
        //                 projectId = hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id;
        //             } else {
        //                 projectId = 'n/a';
        //             }

        //             const proposalId = utils.getProp(hit.source.metadata, ['proposal_id'], '-');
        //             // actual file suffix.
        //             const fileParts = utils.grokFileParts(hit.source.file_name);
        //             const fileType = utils.grokFileType(hit.source.file_type, fileParts);
        //             // Title
        //             const title = utils.grokTitle(hit, fileType);
        //             const scientificName = utils.grokScientificName(hit, fileType);
        //             // By type metadata.
        //             const metadata = utils.grokMetadata(hit, fileType);
        //             const pi = utils.grokPI(hit, fileType);

        //             // have a current transfer job?
        //             const jobs = this.stagingJobsVm.stagingJobs().filter((job) => {
        //                 return job.dbId === hit.id;
        //             });
        //             const transferJob = jobs[0];
        //             let analysisProject;
        //             if (utils.hasProp(hit.source.metadata, 'analysis_project')) {
        //                 analysisProject = {
        //                     name: utils.getProp(hit.source.metadata, 'analysis_project.analysisProjectName'),
        //                     assemblyMethod: utils.getProp(hit.source.metadata, 'analysis_project.assemblyMethod'),
        //                     genomeType: utils.getProp(hit.source.metadata, 'analysis_project.genomeType'),
        //                     id: utils.getProp(hit.source.metadata, 'analysis_project.itsAnalysisProjectId'),
        //                     modificationDate: utils.getProp(hit.source.metadata, 'analysis_project.modDate'),
        //                     comments: utils.getProp(hit.source.metadata, 'analysis_project.comments')
        //                 };
        //             }
        //             let sequencingProject;
        //             if (utils.hasProp(hit.source.metadata, 'sequencing_project')) {
        //                 sequencingProject = {
        //                     name: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_name'),
        //                     id: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_id'),
        //                     status: utils.getProp(hit.source.metadata, 'sequencing_project.current_status'),
        //                     statusDate: utils.getProp(hit.source.metadata, 'sequencing_project.status_date'),
        //                     comments: utils.getProp(hit.source.metadata, 'sequencing_project.comments')
        //                 };
        //             }
        //             return {
        //                 // rowNumber: rowNumber,
        //                 id: hit.id,
        //                 score: numeral(hit.score).format('00.00'),
        //                 type: hit.type,
        //                 title: title,
        //                 date: utils.usDate(hit.source.file_date),
        //                 modified: utils.usDate(hit.source.modified),
        //                 // fileExtension: fileExtension,
        //                 fileType: utils.normalizeFileType(hit.source.file_type),
        //                 // TODO: these should all be in just one place.
        //                 dataType: fileType.dataType,
        //                 proposalId: proposalId,
        //                 projectId: projectId,
        //                 pi: pi,
        //                 metadata: metadata,
        //                 scientificName: scientificName.scientificName,
        //                 file: {
        //                     parts: fileParts,
        //                     name: hit.source.file_name,
        //                     // baseName: fileBaseName,
        //                     // extension: fileExtension,
        //                     dataType: fileType.dataType,
        //                     encoding: fileType.encoding,
        //                     indexedType: utils.normalizeFileType(hit.source.file_type),
        //                     size: numeral(hit.source.file_size).format('0.0 b'),
        //                     added: utils.usDate(hit.source.added_date),
        //                     status: hit.source.file_status,
        //                     types: utils.normalizeFileType(hit.source.file_type),
        //                     typing: fileType,
        //                     md5sum: hit.source.md5sum
        //                 },
        //                 proposal: hit.source.metadata.proposal,
        //                 sequencingProject: sequencingProject,
        //                 analysisProject: analysisProject,
        //                 // importSpec: getImportInfo(fileType.dataType, hit.id, hit.source.file_name, hit),
        //                 showInfo: ko.observable(false),
        //                 detailFormatted: JSON.stringify(hit.source, null, 4),
        //                 source: hit.source,
        //                 data: hit,
        //                 // UI
        //                 transferJob: ko.observable(transferJob)
        //             };
        //         });
        // }

        // checkFilename(filename) {
        //     return Promise.try(() => {
        //         try {
        //             const error = Model.validateFilename(filename);

        //             if (error) {
        //                 return {
        //                     validationError: error
        //                 };
        //             }
        //         } catch (ex) {
        //             return {
        //                 exception: ex.message
        //             };
        //         }
        //         return this.model.getFileMetadata(filename)
        //             .spread((result, error) => {
        //                 if (error) {
        //                     console.error('ERROR checking filename.', error);
        //                     return {
        //                         error: error
        //                     };
        //                 } else {
        //                     if (result) {
        //                         return {
        //                             exists: result
        //                         };
        //                     }
        //                     return false;
        //                 }
        //             })
        //             .catch((err) => {
        //                 return {
        //                     exception: err.message
        //                 };
        //             });
        //     });
        // }

        // Interactive addition of search data from search results
        // into the search input.
        doAddToSearch(data, field) {
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
            this.searchInput(newSearchInput);
        }

        addToSearchHistory(value) {
            // Do not add empty search values.
            if (!value) {
                return;
            }
            if (value.trim().length === 0) {
                return;
            }

            // Remove the search input if it is already in the list
            this.searchHistory.remove(value);

            // Add the item to the top of the list.
            this.searchHistory.unshift(value);

            // remove the last entry if we have exceeded 10 items.
            // the last entry will be the oldest one.
            if (this.searchHistory().length > 10) {
                this.searchHistory.pop();
            }
        }

        clearSearch() {
            if (this.currentSearch.search) {
                this.currentSearch.search.cancel();
                this.currentSearch.cancelled = true;
            }
            this.searchResults.removeAll();
            this.searchTotal(0);
            this.actualSearchTotal(0);
            this.page(null);
            this.currentSearch = {
                search: null,
                query: null,
                cancelled: false
            };
        }

        doSearch() {
            // Search cancellation
            if (this.currentSearch.search) {
                console.warn('cancelling search...');
                this.currentSearch.search.cancel();
                this.currentSearch.cancelled = true;
            }

            var query = this.searchQuery();

            if (!query) {
                return;
            }

            // TODO: compare previous to current query ... if same, do not do another search, just
            //   return. The problem is stuttering -- duplicate updates to the search query
            //   via observables.

            // TODO: eliminate stuttering!
            // Sometimes observables cause duplicate updates to the search query ...
            // stop that.

            if (!this.pageSize()) {
                console.warn('ditching search request - no page size yet', this.pageSize());
                return;
            }

            this.currentSearch = {
                search: null,
                query: query,
                cancelled: false
            };
            const thisSearch = this.currentSearch;

            this.searching(true);

            return this.currentSearch.search = this.model.fetchQuery(query.query, query.filter, this.sortSpec(),  this.page(), this.pageSize())
                .spread((result, error, stats) => {
                    if (thisSearch.cancelled) {
                        console.warn('search cancelled, ignoring results...');
                        return false;
                    }

                    // TODO: handle better!
                    if (error) {
                        this.currentSearch = {
                            search: null,
                            cancelled: false
                        };
                        try {
                            this.clearQuery();
                            this.clearSearch();
                        } catch (ex) {
                            console.error('huh?', ex);
                        }

                        this.showError(new utils.JGISearchError(
                            'dynamic_service:jgi_search_gateway',
                            error.code,
                            error.message,
                            'An error was encountered processing your search request.',
                            error.info
                        ));
                        return true;
                    }

                    console.warn('jgi search elapsed', stats);

                    if (result.total > this.maxSearchResults) {
                        this.actualSearchTotal(result.total);
                        var actualMax = this.pageSize() * Math.floor(this.maxSearchResults/this.pageSize());
                        this.searchTotal(actualMax);
                    } else {
                        this.actualSearchTotal(result.total);
                        this.searchTotal(result.total);
                    }

                    this.searchResults([]);
                    this.searchElapsed(stats.request_elapsed_time);

                    const rows = schema.hitsToRows(result.hits, (...arg) => {this.doStage.apply(this, arg);});

                    this.searchResults(rows);
                    return true;
                })
                .then((searched) => {
                    if (searched) {
                        this.searching(false);
                    }
                })
                .catch((err) => {
                    console.error('ERROR', err);
                    this.searching(false);
                    this.showError(err);
                })
                .finally(() => {
                    this.currentSearch = {
                        search: null,
                        cancelled: false
                    };
                });
        }

        sortBy(column) {
            if (!column.sort) {
                console.warn('Sort not implemented for this column, but sort by called anyway', column);
                return;
            }

            // for now just single column sort.
            if (this.sortColumns().length === 1) {
                const currentSortColumn = this.sortColumns()[0];
                if (currentSortColumn !== column) {
                    currentSortColumn.sort.active(false);
                }
                this.sortColumns.removeAll();
            }

            if (column.sort.active()) {
                column.sort.direction(column.sort.direction() === 'descending' ? 'ascending' : 'descending');
            } else {
                column.sort.active(true);
            }

            this.sortColumns.push(column);
        }

        showStageJobViewer() {
            this.showOverlay({
                name: StagingStatusViewerComponent.name(),
                viewModel: {
                    runtime: this.runtime
                }
            });
        }
    }

    return SearchViewModel;
});