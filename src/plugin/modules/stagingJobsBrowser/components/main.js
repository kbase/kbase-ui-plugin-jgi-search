define([
    'knockout-plus',
    'moment',
    'kb_common/html',
    '../../lib/utils',
    '../../lib/profile',
    '../data',
    '../schema'
], function(
    ko,
    moment,
    html,
    utils,
    Profile,
    Data,
    schema
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function viewModel(params) {
        var runtime = params.runtime;
        var data = Data.make({runtime: runtime});

        // OVERLAY

        // The overlayComponent is passed directly to the overlay panel.
        // Updating this overvable will cause the overlay panel to show the 
        // specified component.
        var overlayComponent = ko.observable();
        var showOverlay = ko.observable();
        showOverlay.subscribe(function (newValue) {
            // if a good component...
            overlayComponent(newValue);
        });

        // SEARCH
        var searchInput = ko.observable();
        var searchResults = ko.observableArray();
        var searchTotal = ko.observable();
        var actualSearchTotal = ko.observable();
        var searchElapsed = ko.observable();
        var searching = ko.observable();
        var page = ko.observable();
        var pageSize = ko.observable();

        // Filters
        var jobStatusFilter = ko.observableArray();

        // schema.columns.forEach(function (column) {
        //     if (column.sort && column.sort.active()) {
        //         search.sortBy(column);
        //     }
        // });

        // columns are copied and observables added.
        // var columns = schema.columns.map(function (column) {
        //     var col = JSON.parse(JSON.stringify(column));
        //     if (!col.sort) {
        //         col.sort = {
        //             enabled: false
        //         };
        //     }
        //     col.sort.active = ko.observable(false);
        //     return col;
        // });

        // ditch?
        var userSearch = ko.observable();
        var availableRowHeight = ko.observable();

        // Computeds
        var searchQuery = ko.pureComputed(function () {
            return searchInput();
        });

        var searchParams = ko.pureComputed(function () {
            if (pageSize()) {
                if (!page()) {
                    page(1);
                }
            }
            return {
                query: searchQuery(),
                page: page(),
                pageSize: pageSize()
            };
        });

        var searchState = ko.pureComputed(function () {
            if (searching()) {
                return 'inprogress';
            }

            // In the staging browser, we use filter logic.
            // I.e., always showing something, filtered, 
            // so 'none' state does not exist.
            if (!pageSize()) {
                return 'pending';
            }
            if (searchResults().length === 0) {
                return 'notfound';
            } else {
                return 'success';
            }
        });

        // TODO: proper concurrency and cancellation...

        // Data fetch

        function removeJob(jobMonitoringId) {
            return data.deleteStagingJob(jobMonitoringId)
                .then(function () {
                    // console.log('job deleted...');
                })
                .catch(function (err) {
                    console.error('ERROR!', err);
                })
                .finally(function () {
                    refreshSearch();
                });
        }


        function fetchData(page, pageSize, filterSpec, sortSpec) {
            var now = new Date().getTime();
            return data.fetchStagingJobs(page, pageSize, filterSpec, sortSpec)
                .then(function (result) {
                    var rows = result.jobs.map(function (row) {
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

        function doSearch() {
            if (!pageSize()) {
                return;
            }
            if (!page()) {
                return;
            }
             // TODO: proper concurrency and cancellation...

            if (searching()) {
                return;
            }
            searching(true);
            // only do this if the results are different, otherwise
            // just update the array.
            return fetchData(page(), pageSize(), filterSpec(), sortSpec())
                .then(function (result) {
                    searchTotal(result.totalAvailable);
                    actualSearchTotal(result.totalMatched);
                    // TODO: smart updating of the result rows!
                    searchResults.removeAll();
                    result.rows.forEach(function (row) {                       
                        searchResults.push(row);
                    });
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                })
                .finally(function () {
                    searching(false);
                });
        }

        function refreshSearch() {
            if (refreshTimer) {
                window.clearTimeout(refreshTimer);
                refreshTimer = null;
            }
            doSearch()
                .finally(function () {
                    refreshLoop();
                });
        }

        var refreshTimer;

        function refreshLoop() {
            refreshTimer = window.setTimeout(function () {
                if (refreshTimer === null) {
                    return;
                }
                doSearch();
                refreshLoop();
            }, 10000);
        }

        refreshLoop();

       
        // Subscriptions

        searchParams.subscribe(function () {
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
        });

        // The job here is to reset the page, if necessary, due to 
        // a change in page size.
        pageSize.subscribeChanged(function (newValue, oldValue) {
            var currentPage = page();

            if (!currentPage) {
                return;
            }

            var newPage = Math.floor((currentPage - 1) * oldValue / newValue) + 1;
            page(newPage);
        });

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

        sortSpec.subscribe(function (newValue) {
            doSearch();
        });

        var filterSpec = ko.pureComputed(function () {
            var filter = {};
            // Search input

            // Filter by job status
            if (jobStatusFilter().length > 0) {
                filter.job_statuses = jobStatusFilter();
            }

            return filter;
        });

        filterSpec.subscribe(function () {
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

        var columns = schema.columns.map(function (column) {
            if (column.sort) {
                column.sort.active = ko.observable(false);
            }
            return column;
        });
        var columnsMap = columns.reduce(function (acc, column) {
            acc[column.name] = column;
            return acc;
        }, {});

        sortBy(columnsMap.started);

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
 
        // CLOCK
        // I know...
        var clock = ko.observable();
        var clockInterval = window.setInterval(function () {
            var time = new Date().getTime();
            clock(time);
        }, 1000);

        function dispose() {
            if (clockInterval) {
                window.clearInterval(clockInterval);
                clockInterval = null;
            }
            if (refreshTimer) {
                window.clearTimeout(refreshTimer);
                refreshTimer = null;
            }
        }

        // INIT

        function init() {
            // fetchData();
        }
        try {
            init();
        } catch (ex) {
            console.error('EXCEPTION', ex);
        }

        return {
            overlayComponent: overlayComponent,
            
            search: {
                // INPUTS
                searchInput: searchInput,
                searchHistory: searchHistory,


                // SYNTHESIZED INPUTS
                searchQuery: searchQuery,
                searchState: searchState,

                // RESULTS
                searchResults: searchResults,
                searchTotal: searchTotal,
                actualSearchTotal: actualSearchTotal,
                searchElapsed: searchElapsed,
                searching: searching,
                userSearch: userSearch,

                // FILTER
                jobStatusFilter: jobStatusFilter,

                // Sorting
                sortBy: sortBy,

                // computed
                availableRowHeight: availableRowHeight,
                pageSize: pageSize,

                // Note, starts with 1.
                page: page,

                refreshSearch: refreshSearch,
                showOverlay: showOverlay,
                // error: error,

                // actions
                removeJob: removeJob,

                columns: columns
            },
            dispose: dispose
        };
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

    function buildInputArea() {
        return ko.kb.komponent({
            name: 'jgi-search/staging-jobs-browser/search-bar',
            params: {
                search: 'search'
            }
        });
    }
    
    function buildFilterArea() {
        return ko.kb.komponent({
            name: 'jgi-search/staging-jobs-browser/filter-bar',
            params: {
                search: 'search'
            }
        });
    }

    function buildResultsArea() {
        return ko.kb.komponent({
            name: 'jgi-search/staging-jobs-browser/generic/browser',
            params: {
                search: 'search'
            }
        });
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            // The search input area
            div({
                class: styles.classes.searchArea
            }, buildInputArea()),
            // The search filter area
            div({
                class: styles.classes.filterArea
            }, buildFilterArea()),
            // The search results / error / message area
            div({
                class: styles.classes.resultArea
            }, [
                buildResultsArea()
            ])
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