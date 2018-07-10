define([
    'knockout',
    'moment',
    'kb_common/html',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    '../../lib/profile',
    '../../lib/model',
    '../schema',
    './searchBar',
    './filterBar',
    './browser'
], function (
    ko,
    moment,
    html,
    reg,
    gen,
    ViewModelBase,
    Profile,
    Model,
    schema,
    SearchBarComponent,
    FilterBarComponent,
    BrowserComponent
) {
    'use strict';

    const t = html.tag,
        div = t('div');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.runtime = context.$root.runtime;
            this.showOverlay = context.$root.showOverlay;

            this.model = new Model({
                runtime: this.runtime
            });

            // SEARCH
            this.searchInput = ko.observable();
            this.searchResults = ko.observableArray();
            this.searchTotal = ko.observable();
            this.actualSearchTotal = ko.observable();
            this.searchElapsed = ko.observable();
            this.searching = ko.observable();
            this.page = ko.observable();
            this.pageSize = ko.observable();

            // Filters
            this.jobStatusFilter = ko.observableArray();

            // ditch?
            this.userSearch = ko.observable();
            this.availableRowHeight = ko.observable();

            // Computeds
            this.searchQuery = ko.pureComputed(() => {
                return this.searchInput();
            });

            this.searchParams = ko.pureComputed(() => {
                if (this.pageSize()) {
                    if (!this.page()) {
                        this.page(1);
                    }
                }
                return {
                    query: this.searchQuery(),
                    page: this.page(),
                    pageSize: this.pageSize()
                };
            });

            this.searchState = ko.pureComputed(() => {
                if (this.searching()) {
                    return 'inprogress';
                }

                // In the staging browser, we use filter logic.
                // I.e., always showing something, filtered,
                // so 'none' state does not exist.
                if (!this.pageSize()) {
                    return 'pending';
                }
                if (this.searchResults().length === 0) {
                    return 'notfound';
                } else {
                    return 'success';
                }
            });

            this.refreshTimer = null;


            // Subscriptions

            this.subscribe(this.searchParams, () => {
                this.doSearch();
            });

            this.subscribe(this.searchQuery, () => {
                // reset the page back to 1 because we do not konw if the
                // new search will extend this far.
                if (!this.page()) {
                    this.page(1);
                } else if (this.page() > 1) {
                    this.page(1);
                }
            });

            // The job here is to reset the page, if necessary, due to
            // a change in page size.
            this.subscribe(this.pageSize, (newValue, oldValue) => {
                var currentPage = this.page();

                if (!currentPage) {
                    return;
                }

                var newPage = Math.floor((currentPage - 1) * oldValue / newValue) + 1;
                this.page(newPage);
            });



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

            this.filterSpec = ko.pureComputed(() => {
                var filter = {};
                // Search input

                // Filter by job status
                if (this.jobStatusFilter().length > 0) {
                    filter.job_statuses = this.jobStatusFilter();
                }

                return filter;
            });

            this.subscribe(this.filterSpec, () => {
                this.doSearch();
            });

            this.columns = schema.columns.map((column) => {
                if (column.sort) {
                    column.sort.active = ko.observable(false);
                }
                return column;
            });
            this.columnsMap = this.columns.reduce((acc, column) => {
                acc[column.name] = column;
                return acc;
            }, {});

            // TODO TODO TODO!!
            this.showError = ko.observable();

            // SEARCH HISTORY
            this.searchHistory = ko.observableArray();

            this.subscribe(this.searchHistory, (newValue) => {
                this.saveSearchHistory(newValue);
            });

            this.clock = ko.observable();
            this.clockInterval = window.setInterval(() => {
                var time = new Date().getTime();
                this.clock(time);
            }, 1000);


            // MAIN
            this.getSearchHistory()
                .then((history) => {
                    this.searchHistory(history);
                })
                .catch((err) => {
                    console.error('ERROR retrieving search history', err);
                });
            this.sortBy(this.columnsMap.started);
            this.refreshLoop();
        }

        // TODO: proper concurrency and cancellation...

        // Data fetch

        removeJob(jobMonitoringId) {
            return this.model.deleteStagingJob(jobMonitoringId)
                .then(() => {
                    // console.log('job deleted...');
                })
                .catch((err) => {
                    console.error('ERROR!', err);
                })
                .finally(() => {
                    this.refreshSearch();
                });
        }


        fetchData(page, pageSize, filterSpec, sortSpec) {
            var now = new Date().getTime();
            return this.model.fetchStagingJobs(page, pageSize, filterSpec, sortSpec)
                .then((result) => {
                    var rows = result.jobs.map((row) => {
                        var elapsed;
                        if (row.status === 'completed' || row.status === 'error') {
                            elapsed = row.updated - row.started;
                        } else {
                            elapsed = now - row.started;
                        }
                        return {
                            dbId: {
                                value: row.dbId
                            },
                            filename: {
                                value: row.filename
                            },
                            jobId: {
                                value: row.jobId,
                                jobMonitoringId: row.jobMonitoringId
                            },
                            started: {
                                value: row.started,
                                info: moment(row.started).format('MM/DD/YYY @ h:mm:ss a')
                            },
                            updated: {
                                value: ko.observable(row.updated)
                            },
                            elapsed: {
                                value: ko.observable(elapsed)
                            },
                            status: {
                                value: ko.observable(row.status)
                            }
                        };
                    });
                    return {
                        totalAvailable: result.total_available,
                        totalMatched: result.total_matched,
                        rows: rows
                    };
                });
        }

        doSearch() {
            if (!this.pageSize()) {
                return;
            }
            if (!this.page()) {
                return;
            }
            // TODO: proper concurrency and cancellation...

            if (this.searching()) {
                return;
            }
            this.searching(true);
            // only do this if the results are different, otherwise
            // just update the array.
            return this.fetchData(this.page(), this.pageSize(), this.filterSpec(), this.sortSpec())
                .then((result) => {
                    this.searchTotal(result.totalAvailable);
                    this.actualSearchTotal(result.totalMatched);
                    // TODO: smart updating of the result rows!
                    this.searchResults.removeAll();
                    result.rows.forEach((row) => {
                        this.searchResults.push(row);
                    });
                })
                .catch((err) => {
                    console.error('ERROR', err);
                })
                .finally(() => {
                    this.searching(false);
                });
        }

        refreshSearch() {
            if (this.refreshTimer) {
                window.clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }
            this.doSearch()
                .finally(() => {
                    this.refreshLoop();
                });
        }

        refreshLoop() {
            this.refreshTimer = window.setTimeout(() => {
                if (this.refreshTimer === null) {
                    return;
                }
                this.doSearch();
                this.refreshLoop();
            }, 10000);
        }

        sortBy(column) {
            if (!column.sort) {
                console.warn('Sort not implemented for this column, but sort by called anyway', column);
                return;
            }

            // for now just single column sort.
            if (this.sortColumns().length === 1) {
                var currentSortColumn = this.sortColumns()[0];
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

        getSearchHistory() {
            var profile = new Profile({
                runtime: this.runtime
            });
            return profile.getHistory('jobsbrowser')
                .spread((result, error) => {
                    if (result) {
                        return result;
                    } else {
                        this.showError(error);
                    }
                });
        }

        saveSearchHistory(history) {
            var profile = new Profile({
                runtime: this.runtime
            });
            return profile.saveHistory('jobsbrowser', history)
                .spread((result, error) => {
                    if (result) {
                        return result;
                    } else {
                        this.showError(error);
                    }
                });
        }

        dispose() {
            if (this.clockInterval) {
                window.clearInterval(this.clockInterval);
                this.clockInterval = null;
            }
            if (this.refreshTimer) {
                window.clearTimeout(this.refreshTimer);
                this.refreshTimer = null;
            }
            super.dispose();
        }
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
            // border: '1px red solid'
        },
        filterArea: {
            flex: '0 0 50px',
            textAlign: 'left'
            // border: '1px blue dashed'
        },
        resultArea: {
            flex: '1 1 0px',
            // border: '1px green dotted',
            display: 'flex',
            flexDirection: 'column'
        },
        activeFilterInput: {
            // fontFamily: 'monospace',
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        },
        modifiedFilterInput: {
            // fontFamily: 'monospace',
            backgroundColor: 'rgba(255, 245, 158, 1)',
            color: '#000'
        },
        checkboxControl: {
            borderColor: 'transparent',
            boxShadow: 'none',
            margin: '0 2px'
        }
    });

    function buildFilterArea() {
        return gen.component({
            name: FilterBarComponent.name(),
            params: {
                search: '$data'
            }
        });
    }

    function buildResultsArea() {
        return gen.component({
            name: BrowserComponent.name(),
            params: {
                search: '$data'
            }
        });
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            div({
                class: styles.classes.filterArea
            }, buildFilterArea()),
            div({
                class: styles.classes.resultArea
            }, [
                buildResultsArea()
            ])
        ]);
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});