define([
    'knockout-plus',
    'kb_common/html',
    './result'
], function (
    ko,
    html,
    ResultComponent
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

    // NB: hmm, it looks like the params are those active in the tab which spawned
    // this component...
    function viewModel(params) {
        var subscriptions = ko.kb.SubscriptionManager.make();
        // From parent search component.
        var search = params.search;
        var totalCount = search.searchTotal;
        var actualTotalCount = search.actualSearchTotal;
        var searching = search.searching;
        var pageSize = search.pageSize;
        var page = search.page;

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

        var sortDirection = ko.observable('ascending');
        var sortDirections = [{
            value: 'ascending',
            label: 'Ascending'
        }, {
            value: 'descending',
            label: 'Descending'
        }];

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
        subscriptions.add(pageInput.subscribe(function (newValue) {
            // If bad input, don't do anything.
            if (newValue === '' || newValue === undefined || newValue === null) {
                return;
            } else if (isNaN(newValue)) {
                return;
            }
            var value = parseInt(newValue);
            if (value > totalPages()) {
                value = totalPages();
            }
            if (value < 1) {
                value = 1;
            }
            if (value !== page()) {
                page(value);
            }
        }));
        subscriptions.add(page.subscribe(function (newValue) {
            if (newValue !== parseInt(pageInput())) {
                pageInput(String(newValue));
            }
        }));
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

        function dispose() {
            subscriptions.dispose();
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

            // Knockout lifecycle
            dispose: dispose
        };
    }

    function buildIcon(type) {
        return span({
            class: 'fa fa-' + type
        });
    }

    function buildPagingButtons() {
        return div({
            style: {
                display: 'inline-block',
                width: '50%',
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
                                    value: 'totalCount()',
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
                                fontStyle: 'italic',
                                color: 'brown'
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
            ])
        ]);
    }

    function buildPageSelector() {
        return  div({
            style: {
                display: 'inline-block',
                width: '50%',
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
        ]);
    }

    function buildPagingControls() {
        return div({
            class: 'btn-toolbar ' + styles.classes.toolbar
        }, [
            buildPagingButtons(),
            buildPageSelector()
        ]);
    }


    var styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        controls: {
            css: {
                flex: '0 0 50px'
            }
        },
        toolbar: {
            css: {
                margin: '0',
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
                        name: ResultComponent.quotedName(),
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

    return ko.kb.registerComponent(component);
});
