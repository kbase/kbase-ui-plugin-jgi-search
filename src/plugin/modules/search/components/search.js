define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/ui',
    '../../lib/utils',
    'kb_plugin_jgi-search',
    './navBar',
    './searchBar',
    './browser'
], function (
    ko,
    html,
    ui,
    utils,
    Plugin,
    NavBarComponent,
    SearchBarComponent,
    SearchBrowserComponent
) {
    'use strict';

    var t = html.tag,
        select = t('select'),
        option = t('option'),
        div = t('div'),
        span = t('span'),
        input = t('input'),
        label = t('label');

    /*
    This view model establishes the primary search context, including the
    search inputs
    search state
    paging controls
    search results

    sub components will be composed with direct references to any of these vm pieces
    they need to modify or use.
     */
    function viewModel(params) {

        // Unpack the Search VM.
        var searchInput = params.search.searchInput;
        var searchResults = params.search.searchResults;
        var searchTotal = params.search.searchTotal;
        var searching = params.search.searching;
        var pageSize = params.search.pageSize;
        var page = params.search.page;

        var typeFilterOptions = params.search.typeFilterOptions.map(function (option) {
            return option;
        });
        typeFilterOptions.unshift({
            label: 'Select one or more file types',
            value: '_select_',
            enabled: true
        });

        function doRemoveTypeFilter(data) {
            params.search.typeFilter.remove(data);
        }

        function doSelectTypeFilter(data) {
            if (data.typeFilterInput() === '_select_') {
                return;
            }
            params.search.typeFilter.push(data.typeFilterInput());
            data.typeFilterInput('_select_');
        }

        var piFilter = ko.observable().extend({
            rateLimit: 300
        }).syncWith(params.search.piFilter);

        var seqProjectFilter = ko.observable().extend({
            rateLimit: 300
        }).syncWith(params.search.seqProjectFilter);

        var proposalFilter = ko.observable().extend({
            rateLimit: 300
        }).syncWith(params.search.proposalFilter);

        return {
            // The top level search is included so that it can be
            // propagated.
            search: params.search,
            runtime: params.search.runtime,
            // And we break out fields here for more natural usage (or not??)
            searchInput: searchInput,
            searchResults: searchResults,
            searchTotal: searchTotal,
            searching: searching,
            pageSize: pageSize,
            page: page,

            logo: Plugin.plugin.fullPath  + '/images/jgi-short-logo.jpg',

            // Type filter
            typeFilterInput: ko.observable('_select_'),
            typeFilterOptions: typeFilterOptions,

            // Project filter
            seqProjectFilter: seqProjectFilter,
            proposalFilter: proposalFilter,
            piFilter: piFilter,

            // ACTIONS
            doSearch: params.search.doSearch,
            doRemoveTypeFilter: doRemoveTypeFilter,
            doSelectTypeFilter: doSelectTypeFilter
        };
    }

    function buildInputArea() {
        return ko.kb.komponent({
            name: SearchBarComponent.name(),
            params: {
                logo: 'logo',
                search: 'search'
            }
        });
    }

    function buildNavArea() {
        return ko.kb.komponent({
            name: NavBarComponent.name(),
            params: {
                searchInput: 'searchInput'
            }
        });
    }

    function buildTypeFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label('Type'),
            select({
                dataBind: {
                    value: 'typeFilterInput',
                    event: {
                        change: '$component.doSelectTypeFilter'
                    },
                    foreach: 'typeFilterOptions'
                },
                class: 'form-control',
                style: {
                    margin: '0 4px'
                }
            }, [
                '<!-- ko if: enabled -->',
                option({
                    dataBind: {
                        value: 'value',
                        text: 'label',
                        enable: 'enabled'
                    }
                }),
                '<!-- /ko -->'
            ]),

            // selected types
            div({
                dataBind: {
                    foreach: 'search.typeFilter'
                },
                style: {
                    display: 'inline-block'
                }
            }, [
                span({
                    style: {
                        display: 'inline-block',
                        margin: '0 4px'
                    },
                }, [
                    span(({
                        dataBind: {
                            text: '$data'
                        },
                        // style: {
                        //     backgroundColor: 'transparent',
                        //     borderColor: 'transparent'
                        // },
                        class: ['form-control', styles.classes.activeFilterInput]
                    })),
                    span({
                        dataBind: {
                            click: '$component.doRemoveTypeFilter'
                        },
                        class: 'kb-btn-mini -danger'
                    }, span({
                        class: 'fa fa-times'
                    }))
                ])
            ])
        ]);
    }

    function buildSeqProjectFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({
                style: {
                    marginRight: '4px'
                }
            }, 'Project'),
            input({
                dataBind: {
                    value: 'seqProjectFilter',
                    css: 'seqProjectFilter() ? "' + styles.classes.activeFilterInput + '" : null'
                },
                placeholder: 'Filter by seq. project id',
                class: 'form-control',
                style: {
                    width: '8em'
                }
            }),
            // enable the clear button
            '<!-- ko if: seqProjectFilter -->',
            span({
                dataBind: {
                    click: 'function() {seqProjectFilter("");}'
                },
                class: 'kb-btn-mini -danger'
            }, span({
                class: 'fa fa-times'
            })),
            '<!-- /ko -->',
            // disable the clear button
            // '<!-- ko ifnot: seqProjectFilter -->',
            // span({                
            //     class: 'kb-btn-mini -danger -hidden'
            // }, span({
            //     class: 'fa fa-times'
            // })),
            // '<!-- /ko -->'
        ]);
    }

    function buildProposalFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({
                style: {
                    marginRight: '4px'
                }
            }, 'Proposal'),
            input({
                dataBind: {
                    value: 'proposalFilter',
                    css: 'proposalFilter() ? "' + styles.classes.activeFilterInput + '" : null'
                },
                placeholder: 'Filter by proposal id',
                class: 'form-control',
                style: {
                    width: '8em'
                }
            }),
            // enable the clear button
            '<!-- ko if: proposalFilter -->',
            span({
                dataBind: {
                    click: 'function() {proposalFilter("");}'
                },
                class: 'kb-btn-mini -danger'
            }, span({
                class: 'fa fa-times'
            })),
            '<!-- /ko -->',
            // disable the clear button
            // '<!-- ko ifnot: proposalFilter -->',
            // span({                
            //     class: 'kb-btn-mini -danger -hidden'
            // }, span({
            //     class: 'fa fa-times'
            // })),
            // '<!-- /ko -->'
        ]);
    }

    function buildPIFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({
                style: {
                    marginRight: '4px'
                }
            }, 'PI'),
            input({
                dataBind: {
                    textInput: 'piFilter',
                    css: 'piFilter() ? "' + styles.classes.activeFilterInput + '" : null',
                },
                placeholder: 'Filter by PI last name',
                class: 'form-control',
                style: {
                    width: '8em'
                }
            }),
            // enable the clear button
            '<!-- ko if: piFilter -->',
            span({
                dataBind: {
                    click: 'function() {piFilter("");}'
                },
                class: 'kb-btn-mini -danger'
            }, span({
                class: 'fa fa-times'
            })),
            '<!-- /ko -->',
            // disable the clear button
            // '<!-- ko ifnot: piFilter -->',
            // span({                
            //     class: 'kb-btn-mini -hidden'
            // }, span({
            //     class: 'fa fa-times'
            // })),
            // '<!-- /ko -->'
        ]);
    }

    function buildFilterArea() {
        return div({
            class: 'form-inline',
            style: {                
            }
        }, [
            span({
                style: {
                    fontWeight: 'bold',
                    color: 'gray',
                    marginTop: '8px',
                    fontSize: '80%'
                }
            }, 'Filters: '),
            buildTypeFilter(),
            buildPIFilter(),
            buildProposalFilter(),
            buildSeqProjectFilter()
        ]);
    }

    function buildResultsArea() {
        return ko.kb.komponent({
            name: SearchBrowserComponent.name(),
            params: {
                search: 'search',
                runtime: 'runtime'
            }
        });
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        navArea: {
            flex: '0 0 50px',
        },
        searchArea: {
            flex: '0 0 50px',
        },
        filterArea: {
            flex: '0 0 50px',
        },
        resultArea: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        activeFilterInput: {
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        }
    });

    function template() {
        return div({
            class: styles.classes.component
        }, [
            div({
                class: styles.classes.navArea
            }, buildNavArea()),
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
                buildResultsArea(),
            ])
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});
