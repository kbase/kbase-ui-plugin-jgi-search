define([
    'bluebird',
    'knockout-plus',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_service/utils',
    '../utils',
    'css!./browser.css'
], function (
    Promise,
    ko,
    marked,
    html,
    GenericClient,
    serviceUtils,
    utils
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div'),
        button = t('button'),
        input = t('input'),
        select = t('select');

    ko.extenders.parsed = function (target, parseFun) {
        target.parsed = ko.observable();
        target.parseError = ko.observable();

        function parseit(newValue) {
            try {
                target.parsed(parseFun(newValue));
            } catch (ex) {
                target.parseError(ex.message);
                console.error('Error parsing : ' + ex.message);
            }
        }
        target.subscribe(function (newValue) {
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
        var search = params.search;
        var totalCount = search.searchTotal;
        var actualTotalCount = search.actualSearchTotal;
        var searching = search.searching;
        var pageSize = search.pageSize;
        var page = search.page;

        console.log('staging state', search);

        var pageFrom = ko.pureComputed(function () {
            if (!page()) {
                return '';
            }

            return (page() - 1) * pageSize() + 1;
        });

        var pageTo = ko.pureComputed(function () {
            if (!page()) {
                return '';
            }
            return Math.min(page() * pageSize(), totalCount());
        });



        var pageSizeInput = ko.pureComputed(function() {
            return String(pageSize());
        });
        // pageSizeInput.subscribe(function (newValue) {
        //     pageSize(parseInt(newValue));
        // });

        // Our own, for now. Since these are overall properties of the
        // search capabilities, they should be foisted up to the search as well.

        // SORTING
        var sortBy = ko.observable();

        // TODO: these need to come from the type
        // var sortFields = typeDef.searchKeys;
        var sortFields = [];
        var sortFieldsMap = {};
        sortFields.forEach(function (sortField) {
            sortFieldsMap[sortField.key] = sortField;
        });
        var currentSortField = ko.pureComputed(function () {
            // The "natural" sort order is simply an empty string which we translate
            // into a null.
            var sortKey = sortBy();
            if (!sortKey || sortKey.length === 0) {
                return null;
            }
            return sortFieldsMap[sortBy()];
        });
        currentSortField.subscribe(function () {
            params.search.doSearch();
        });

        var sortDirection = ko.observable('ascending');
        var sortDirections = [{
            value: 'ascending',
            label: 'Ascending'
        }, {
            value: 'descending',
            label: 'Descending'
        }];
        var sortDescending = ko.pureComputed(function () {
            return (sortDirection() === 'descending');
        });
        sortDescending.subscribe(function () {
            params.search.doSearch();
        });

        // PAGING
        // var pageSize = ko.observable(search.pageSize || 10).extend({
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

        var totalPages = ko.pureComputed(function () {
            if (!search.searchTotal()) {
                return 0;
            }
            var size = search.searchTotal() / pageSize();
            return Math.ceil(size);
        });

        var pageInput = ko.observable(String(page()));
        pageInput.extend({
            rateLimit: {
                timeout: 500,
                method: 'notifyWhenChangesStop'
            }
        });
        pageInput.subscribe(function (newValue) {
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
                pageInput(totalPages());
                return;
            }
            if (value < 1) {
                pageInput(1);
                return;
            }
            
            if (value !== page()) {
                page(value);
            }
        });
        page.subscribe(function (newValue) {
            if (newValue !== parseInt(pageInput())) {
                pageInput(String(newValue));
            }
        });
        var pageValues = ko.pureComputed(function () {
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

        var pageSizes = [5, 10, 20, 50, 100].map(function (value) {
            return {
                label: String(value),
                value: String(value)
            };
        });

        // todo: yeah, this should be in the top level...
        // pageSizeInput.subscribe(function () {
        //     if (params.search.searchTotal() > 0) {
        //         params.search.doSearch();
        //     }
        // });

        // pageStart.subscribe(function() {
        //     if (params.search.searchResults().length > 0) {
        //         params.search.doSearch();
        //     }
        // });

        function dispose() {
            // subscriptions.forEach(function(subscription) {
            //     subscription.dispose();
            // });
        }

        function isSearchState(states) {
            var s = search.searchState();
            return states.some(function (state) {
                return (state === s);
            });
        }

        return {
            search: params.search,
            // Search (shared)
            totalCount: totalCount,
            searching: searching,
            actualTotalCount: actualTotalCount,

            // Paging
            page: page,
            totalPages: totalPages,
            pageInput: pageInput,
            pageValues: pageValues,
            pageSize: pageSize,
            pageSizeInput: pageSizeInput,
            pageSizes: pageSizes,

            pageFrom: pageFrom,
            pageTo: pageTo,

            doFirst: doFirst,
            doLast: doLast,
            doPrevPage: doPrevPage,
            doNextPage: doNextPage,

            // Sorting
            sortBy: sortBy,
            sortFields: sortFields,
            sortDirection: sortDirection,
            sortDirections: sortDirections,

            // Queries
            isSearchState: isSearchState,

            // Actions
            doSearch: params.search.doSearch,

            // Knockout lifecycle
            dispose: dispose
        };
    }

    function buildIcon(type) {
        return span({
            class: 'fa fa-' + type
        });
    }

    function buildStagingStatus() {
        return [
            '<!-- ko if: search.stagingJobsState().pending -->',
            // html.loading(),

            '<!-- ko foreach: search.stagingJobs -->',

            utils.komponent({
                name: 'jgi-search/copy-status-indicator',
                params: {
                    transferJob: '$data'
                }
            }),

            '<!-- /ko -->',


            '<!-- /ko -->',
            '<!-- ko ifnot: search.stagingJobsState().pending -->',

            '<!-- ko if: search.stagingJobsState().completed -->',
            span({
                dataBind: {
                    text: 'search.stagingJobsState().completed'
                }
            }), 
            ' file',  
            '<!-- ko if: search.stagingJobsState().completed > 1 -->',
            's',
            '<!-- /ko -->',            
            ' copied',
            '<!-- /ko -->',
            
            '<!-- /ko -->'
        ];
        
    }

    // function buildStagingStatusx() {
    //     return [
    //         '<!-- ko if: search.stagingJobs().length === 0 -->',
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 height: '25px'
    //             }
    //         }, [
    //             'No current transfers'
    //         ]),
    //         '<!-- /ko -->',

    //         '<!-- ko if: search.stagingJobs().length > 0 -->',

    //         '<!-- ko ifnot: search.monitoringJobs() -->',
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 height: '25px'
    //             }
    //         }, [
    //             'Transferred ',
    //             span({
    //                 dataBind: {
    //                     text: 'search.stagingJobStates.completed'
    //                 },
    //                 style: {
    //                     fontWeight: 'bold'
    //                 }
    //             }),
    //             ' file',
    //             '<!-- ko if: search.stagingJobs().length > 1 -->',
    //             's',
    //             '<!-- /ko -->',
    //             ' to your staging area'
    //         ]),
    //         '<!-- /ko -->',

    //         '<!-- ko if: search.monitoringJobs() -->',
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 height: '25px'
    //             }
    //         }, [
    //             'Transferring ',
    //             span({
    //                 style: {
    //                     fontSize: '80%'
    //                 }
    //             }, html.loading())
    //         ]),
    //         div({
    //             style: {
    //                 display: 'inline-block'
    //             }
    //         }, 'sending'),
    //         div({
    //             dataBind: {
    //                 text: 'search.stagingJobStates.sent',
    //                 style: {
    //                     'font-weight': 'search.stagingJobStates.sent() > 0 ? "bold" : "normal"',
    //                     color: 'search.stagingJobStates.sent() > 0 ? "green" : "black"',
    //                     border: 'search.stagingJobStates.sent() > 0 ? "1px green solid" : "1px silver dashed"'
    //                 }
    //             },
    //             style: {
    //                 display: 'inline-block',
    //                 width: '25px',
    //                 height: '25px',
    //                 border: '1px silver solid',
    //                 fontFamily: 'monospace',
    //                 textAlign: 'center'
    //             }
    //         }),
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 marginLeft: '4px'
    //             }
    //         }, 'queued'),
    //         div({
    //             dataBind: {
    //                 text: 'search.stagingJobStates.queued',
    //                 style: {
    //                     'font-weight': 'search.stagingJobStates.queued() > 0 ? "bold" : "normal"',
    //                     color: 'search.stagingJobStates.queued() > 0 ? "green" : "black"',
    //                     border: 'search.stagingJobStates.queued() > 0 ? "1px green solid" : "1px silver dashed"'
    //                 }
    //             },
    //             style: {
    //                 display: 'inline-block',
    //                 width: '25px',
    //                 height: '25px',
    //                 border: '1px silver solid',
    //                 fontFamily: 'monospace',
    //                 textAlign: 'center'
    //             }
    //         }),
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 marginLeft: '4px'
    //             }
    //         }, 'restoring'),
    //         div({
    //             dataBind: {
    //                 text: 'search.stagingJobStates.restoring',
    //                 style: {
    //                     'font-weight': 'search.stagingJobStates.restoring() > 0 ? "bold" : "normal"',
    //                     color: 'search.stagingJobStates.restoring() > 0 ? "green" : "black"',
    //                     border: 'search.stagingJobStates.restoring() > 0 ? "1px green solid" : "1px silver dashed"'
    //                 }
    //             },
    //             style: {
    //                 display: 'inline-block',
    //                 width: '25px',
    //                 height: '25px',
    //                 border: '1px silver solid',
    //                 fontFamily: 'monospace',
    //                 textAlign: 'center'
    //             }
    //         }),
    //         div({
    //             style: {
    //                 display: 'inline-block',
    //                 marginLeft: '4px'
    //             }
    //         }, 'copying'),
    //         div({
    //             dataBind: {
    //                 text: 'search.stagingJobStates.copying',
    //                 style: {
    //                     'font-weight': 'search.stagingJobStates.copying() > 0 ? "bold" : "normal"',
    //                     color: 'search.stagingJobStates.copying() > 0 ? "green" : "black"',
    //                     border: 'search.stagingJobStates.copying() > 0 ? "1px green solid" : "1px silver dashed"'
    //                 }
    //             },
    //             style: {
    //                 display: 'inline-block',
    //                 width: '25px',
    //                 height: '25px',
    //                 border: '1px silver solid',
    //                 fontFamily: 'monospace',
    //                 textAlign: 'center'
    //             }
    //         }),
    //         div({
    //             style: {
    //                 display: 'inline-block'
    //             }
    //         }, 'completed'),
    //         div({
    //             dataBind: {
    //                 text: 'search.stagingJobStates.completed',
    //                 style: {
    //                     'font-weight': 'search.stagingJobStates.completed() > 0 ? "bold" : "normal"',
    //                     color: 'search.stagingJobStates.completed() > 0 ? "green" : "black"',
    //                     border: 'search.stagingJobStates.completed() > 0 ? "1px green solid" : "1px silver dashed"'
    //                 }
    //             },
    //             style: {
    //                 display: 'inline-block',
    //                 width: '25px',
    //                 height: '25px',
    //                 border: '1px silver solid',
    //                 fontFamily: 'monospace',
    //                 textAlign: 'center'
    //             }
    //         }),
    //         '<!-- /ko -->',

    //         '<!-- /ko -->'
    //     ];
    // }

    function buildPagingControls() {
        return div({
            class: 'btn-toolbar ' + styles.classes.toolbar
        }, [
            div({
                style: {
                    display: 'inline-block',
                    width: '34%',
                    verticalAlign: 'middle',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
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
                                disable: '!page() || page() === 1 || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('step-backward')),
                        button({
                            dataBind: {
                                click: 'doPrevPage',
                                disable: '!page() || page() === 1 || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('backward')),
                        button({
                            dataBind: {
                                click: 'doNextPage',
                                disable: '!page() || page() === totalPages() || searching()'
                            },
                            class: 'btn btn-default'
                        }, buildIcon('forward')),
                        button({
                            dataBind: {
                                click: 'doLast',
                                disable: '!page() || page() === totalPages() || searching()'
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
                                },
                                ifnot: 'isSearchState(["none", "notfound"])'
                            }
                        }, [
                            span({
                                dataBind: {
                                    text: 'pageFrom()'
                                }
                            }),
                            ' to ',
                            span({
                                dataBind: {
                                    text: 'pageTo()'
                                }
                            }),
                            ' of ',
                            span({
                                dataBind: {
                                    typedText: {
                                        value: 'totalCount',
                                        type: '"number"',
                                        format: '"0,0"'
                                    }
                                },
                                style: {
                                    verticalAlign: 'middle'
                                }
                            }),
                            '<!-- ko if: actualTotalCount() > totalCount() -->',
                            span({
                                style: {
                                    fontStyle: 'italic'
                                }
                            }, [
                                ' (truncated from ',
                                span({
                                    dataBind: {
                                        typedText: {
                                            value: 'actualTotalCount',
                                            type: '"number"',
                                            format: '"0,0"'
                                        }
                                    }
                                }),
                                ')'
                            ]),
                            '<!-- /ko -->',
                            // '<!-- /ko -->'
                        ])
                    ])
                ]),

            ]),

            div({
                style: {
                    display: 'inline-block',
                    width: '33%',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }
            }, [
                '<!-- ko if: totalPages() && totalPages() > 1 -->',
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
                }),
                '<!-- /ko -->',
            ]),

            div({
                style: {
                    display: 'inline-block',
                    width: '33%',
                    verticalAlign: 'middle',
                    textAlign: 'right',
                    paddingRight: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }
            }, buildStagingStatus())
        ]);
    }


    var styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                'flex-direction': 'column'
            }
        },
        controls: {
            css: {
                flex: '0 0 50px'
            }
        },
        toolbar: {
            css: {
                // borderBottom: '1px silver solid',
                margin: '0',
                // paddingBottom: '4px'
            }
        },
        items: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                'flex-direction': 'column'
            }
        }
    });

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            div({
                class: styles.classes.controls
            }, buildPagingControls()),
            div({
                class: styles.classes.items,
                dataBind: {
                    component: {
                        name: '"jgisearch/search-result2"',
                        params: {
                            search: 'search'
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
