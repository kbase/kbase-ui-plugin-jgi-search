define([
    'bluebird',
    'knockout-plus',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    'css!./browser.css'
], function(
    Promise,
    ko,
    marked,
    html,
    GenericClient,
    serviceUtils
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div'),
        button = t('button'),
        label = t('label'),
        input = t('input'),
        select = t('select');

    ko.extenders.parsed = function(target, parseFun) {
        function parseit(newValue) {
            try {
                target.parsed = parseFun(newValue);
            } catch (ex) {
                console.error('Error parsing : ' + ex.message);
            }
        }
        target.subscribe(function(newValue) {
            parseit(newValue);
        });
        parseit(target());
        return target;
    };

    function dateString(date) {
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
        // return date.toLocaleString();
    }

    // NB: hmm, it looks like the params are those active in the tab which spawned
    // this component...
    function viewModel(params) {
        // From parent search component.
        var searchVM = params.searchVM;
        var totalCount = searchVM.searchTotal;
        var searching = searchVM.searching;
        var pageSize = searchVM.pageSize;
        var page = searchVM.page;

        var pageSizeInput = ko.observable(String(pageSize()));
        pageSizeInput.subscribe(function(newValue) {
            pageSize(parseInt(newValue));
        });

        // Our own, for now. Since these are overall properties of the
        // search capabilities, they should be foisted up to the searchVM as well.

        // SORTING
        var sortBy = ko.observable();

        // TODO: these need to come from the type
        // var sortFields = typeDef.searchKeys;
        var sortFields = [];
        var sortFieldsMap = {};
        sortFields.forEach(function(sortField) {
            sortFieldsMap[sortField.key] = sortField;
        });
        var currentSortField = ko.pureComputed(function() {
            // The "natural" sort order is simply an empty string which we translate
            // into a null.
            var sortKey = sortBy();
            if (!sortKey || sortKey.length === 0) {
                return null;
            }
            return sortFieldsMap[sortBy()];
        });
        currentSortField.subscribe(function() {
            params.searchVM.doSearch();
        });

        var sortDirection = ko.observable('ascending');
        var sortDirections = [{
            value: 'ascending',
            label: 'Ascending'
        }, {
            value: 'descending',
            label: 'Descending'
        }];
        var sortDescending = ko.pureComputed(function() {
            return (sortDirection() === 'descending');
        });
        sortDescending.subscribe(function() {
            params.searchVM.doSearch();
        });

        // PAGING
        // var pageSize = ko.observable(searchVM.pageSize || 10).extend({
        //     parsed: function(value) {
        //         return parseInt(value);
        //     }
        // });
        // var pageStart = ko.pureComputed(function() {
        //     return (page() - 1) * pageSize();
        // });
        // var pageEnd = ko.pureComputed(function() {
        //     return Math.min(pageStart() + pageSize(), totalCount()) - 1;
        // });

        var totalPages = ko.pureComputed(function() {
            if (!searchVM.searchTotal()) {
                return 0;
            }
            var size = searchVM.searchTotal() / pageSize();
            return Math.ceil(size);
        });

        var pageInput = ko.observable(String(page()));
        pageInput.extend({
            rateLimit: {
                timeout: 500,
                method: 'notifyWhenChangesStop'
            }
        });
        pageInput.subscribe(function(newValue) {
            // If bad input, don't do anything.
            if (newValue === '' || newValue === undefined || newValue === null) {
                return;
                // newValue = '1';
            } else if (isNaN(newValue)) {
                return;
                // newValue = '1';
            }
            var value = parseInt(newValue);
            if (value > totalPages()) {
                value = totalPages();
            }
            if (value !== page()) {
                page(value);
            }
        });
        page.subscribe(function(newValue) {
            if (newValue !== parseInt(pageInput())) {
                pageInput(String(newValue));
            }
        });
        var pageValues = ko.pureComputed(function() {
            var values = [];
            if (totalPages() > 100) {
                return values;
            }
            for (var i = 0; i < totalPages(); i += 1) {
                values.push({
                    value: String(i + 1),
                    label: String(i + 1)
                });
            }
            return values;
        });

        function doFirst() {
            page(1);
        }

        function doLast() {
            page(totalPages());
        }

        function doPrevPage() {
            if (page() > 1) {
                page(page() - 1);
            }
        }

        function doNextPage() {
            if (page() < totalPages()) {
                page(page() + 1);
            }
        }

        var pageSizes = [5, 10, 20, 50, 100].map(function(value) {
            return {
                label: String(value),
                value: String(value)
            };
        });

        // todo: yeah, this should be in the top level...
        pageSizeInput.subscribe(function() {
            if (params.searchVM.searchTotal() > 0) {
                params.searchVM.doSearch();
            }
        });

        // pageStart.subscribe(function() {
        //     if (params.searchVM.searchResults().length > 0) {
        //         params.searchVM.doSearch();
        //     }
        // });

        function dispose() {
            // subscriptions.forEach(function(subscription) {
            //     subscription.dispose();
            // });
        }

        return {
            searchVM: params.searchVM,
            // Search (shared)
            totalCount: totalCount,
            searching: searching,

            // Paging
            page: page,
            totalPages: totalPages,
            pageInput: pageInput,
            pageValues: pageValues,
            pageSize: pageSize,
            pageSizeInput: pageSizeInput,
            pageSizes: pageSizes,
            // pageStart: pageStart,
            // pageEnd: pageEnd,
            doFirst: doFirst,
            doLast: doLast,
            doPrevPage: doPrevPage,
            doNextPage: doNextPage,

            // Sorting
            sortBy: sortBy,
            sortFields: sortFields,
            sortDirection: sortDirection,
            sortDirections: sortDirections,

            // Actions
            doSearch: params.searchVM.doSearch,

            // Knockout lifecycle
            dispose: dispose
        };
    }

    function buildIcon(type) {
        return span({
            class: 'fa fa-' + type
        });
    }

    function buildPagingControls() {
        return div({
            class: 'btn-toolbar -toolbar'
        }, [
            div({
                style: {
                    display: 'inline-block',
                    width: '33.33%',
                    verticalAlign: 'top'
                }
            }, [
                div({
                    class: 'btn-group form-inline',
                    style: {
                        margin: '0'
                    }
                }, [
                    div([
                        button({
                            dataBind: {
                                click: 'doFirst',
                                disable: 'page() === 1 || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('step-backward')),
                        button({
                            dataBind: {
                                click: 'doPrevPage',
                                disable: 'page() === 1 || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('backward')),
                        button({
                            dataBind: {
                                click: 'doNextPage',
                                disable: 'page() === totalPages() || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('forward')),
                        button({
                            dataBind: {
                                click: 'doLast',
                                disable: 'page() === totalPages() || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('step-forward')),

                        span({
                            style: {
                                display: 'inline-block',
                                verticalAlign: 'middle',
                                textAlign: 'center',
                                margin: '6px 0 0 4px',
                                float: 'none',
                                height: '20px'
                            },
                            dataBind: {
                                style: {
                                    color: 'searching() ? "gray" : "black"'
                                }
                            }
                        }, [
                            span({
                                dataBind: {
                                    text: '(page() - 1) * pageSize() + 1'
                                }
                            }),
                            ' to ',
                            span({
                                dataBind: {
                                    text: 'Math.min(page() * pageSize(), totalCount())'
                                }
                            }),
                            ' of ',
                            span({
                                dataBind: {
                                    text: 'totalCount()'
                                },
                                style: {
                                    marginRight: '10px',
                                    verticalAlign: 'middle'
                                }
                            })
                        ])
                    ])
                ]),

            ]),
            div({
                style: {
                    display: 'inline-block',
                    width: '33.33%',
                    verticalAlign: 'top',
                    textAlign: 'center'
                }
            }, [
                span({
                    style: {
                        marginLeft: '6px'
                    }
                }, 'page '),
                '<!-- ko if: totalPages() <= 100 -->',
                select({
                    dataBind: {
                        value: 'pageInput',
                        options: 'pageValues',
                        optionsValue: '"value"',
                        optionsText: '"label"'
                    },
                    class: 'form-control',
                    style: {
                        display: 'inline-block',
                        width: '5em'
                    }
                }),
                '<!-- /ko -->',
                '<!-- ko if: totalPages() > 100 -->',
                input({
                    dataBind: {
                        textInput: 'pageInput'
                    },
                    class: 'form-control',
                    style: {
                        display: 'inline-block',
                        width: '5em'
                    }
                }),
                '<!-- /ko -->',
                span({
                    style: {
                        marginLeft: '6px'
                    }
                }, ' of '),
                span({
                    dataBind: {
                        text: 'totalPages()'
                    }
                })
            ]),
            div({
                class: 'btn-group form-inline',
                style: {
                    width: '33.33%',
                    margin: '0',
                    textAlign: 'right',
                    float: 'none',
                    verticalAlign: 'top'
                }
            }, [
                label({
                    style: {
                        // for bootstrap
                        marginBottom: '0',
                        fontWeight: 'normal'
                    }
                }, [
                    select({
                        dataBind: {
                            value: 'pageSizeInput',
                            options: 'pageSizes',
                            optionsText: '"label"',
                            optionsValue: '"value"'
                        },
                        class: 'form-control'
                    }),
                    ' items per page'
                ])
            ]),
            // div({
            //     class: 'btn-group form-inline',
            //     style: {
            //         width: '55%',
            //         margin: '0',
            //         textAlign: 'right',
            //         float: 'none',
            //         verticalAlign: 'top'
            //     }
            // }, [
            //     label({
            //         style: {
            //             // for bootstrap
            //             marginBottom: '0',
            //             fontWeight: 'normal'
            //         }
            //     }, [
            //         'Sort by ',
            //         select({
            //             dataBind: {
            //                 value: 'sortBy',
            //                 options: 'sortFields',
            //                 optionsText: '"label"',
            //                 optionsValue: '"key"',
            //                 optionsCaption: '"Natural"'
            //             },
            //             class: 'form-control'
            //         }),
            //         select({
            //             dataBind: {
            //                 value: 'sortDirection',
            //                 options: 'sortDirections',
            //                 optionsText: '"label"',
            //                 optionsValue: '"value"',
            //                 disable: '!sortBy()'
            //             },
            //             class: 'form-control'
            //         }),
            //     ])
            // ])
        ]);
    }

    function template() {
        return div({
            class: 'component-jgisearch-browser'
        }, [
            div({
                style: {
                    padding: '4px',
                    marginTop: '10px',
                    marginBottom: '6px'
                }
            }, buildPagingControls()),
            div({
                dataBind: {
                    component: {
                        name: '"jgisearch/search-result"',
                        params: {
                            searchVM: 'searchVM'
                        }
                    }
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