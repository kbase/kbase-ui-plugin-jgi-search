define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    './navBar',
    './searchBar',
    './browser'
], function (ko, reg, gen, html, NavBarComponent, SearchBarComponent, SearchBrowserComponent) {
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
    class ViewModel {
        constructor(params) {
            // Unpack the Search VM.
            this.runtime = params.runtime;
            this.search = params.search;

            this.searchInput = params.search.searchInput;
            this.searchResults = params.search.searchResults;
            this.searchTotal = params.search.searchTotal;
            this.searching = params.search.searching;
            this.pageSize = params.search.pageSize;
            this.page = params.search.page;
            this.doSearch = params.search.doSearch;

            this.typeFilterOptions = params.search.typeFilterOptions.map((option) => {
                return option;
            });
            this.typeFilterOptions.unshift({
                label: 'Select one or more file types',
                value: '_select_',
                enabled: true
            });

            this.piFilter = ko
                .observable()
                .extend({
                    rateLimit: 300
                })
                .syncWith(params.search.piFilter);

            this.seqProjectFilter = ko
                .observable()
                .extend({
                    rateLimit: 300
                })
                .syncWith(params.search.seqProjectFilter);

            this.proposalFilter = ko
                .observable()
                .extend({
                    rateLimit: 300
                })
                .syncWith(params.search.proposalFilter);

            this.logo = this.runtime.pluginResourcePath + '/images/jgi-short-logo.jpg';
            this.typeFilterInput = ko.observable('_select_');
        }

        doRemoveTypeFilter(data) {
            this.search.typeFilter.remove(data);
        }

        doSelectTypeFilter(data) {
            if (data.typeFilterInput() === '_select_') {
                return;
            }
            this.search.typeFilter.push(data.typeFilterInput());
            data.typeFilterInput('_select_');
        }
    }

    function buildInputArea() {
        return gen.component({
            name: SearchBarComponent.name(),
            params: {
                logo: 'logo',
                search: 'search'
            }
        });
    }

    function buildNavArea() {
        return gen.component({
            name: NavBarComponent.name(),
            params: {
                searchInput: 'searchInput'
            }
        });
    }

    function buildTypeFilter() {
        return div(
            {
                class: 'form-group',
                style: {
                    margin: '0 4px'
                }
            },
            [
                label('Type'),
                select(
                    {
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
                    },
                    gen.if(
                        'enabled',
                        option({
                            dataBind: {
                                value: 'value',
                                text: 'label',
                                enable: 'enabled'
                            }
                        })
                    )
                ),

                // selected types
                div(
                    {
                        dataBind: {
                            foreach: 'search.typeFilter'
                        },
                        style: {
                            display: 'inline-block'
                        }
                    },
                    [
                        span(
                            {
                                style: {
                                    display: 'inline-block',
                                    margin: '0 4px'
                                }
                            },
                            [
                                span({
                                    dataBind: {
                                        text: '$data'
                                    },
                                    class: ['form-control', styles.classes.activeFilterInput]
                                }),
                                span(
                                    {
                                        dataBind: {
                                            click: '$component.doRemoveTypeFilter.bind($component)'
                                        },
                                        class: 'kb-btn-mini -danger'
                                    },
                                    span({
                                        class: 'fa fa-times'
                                    })
                                )
                            ]
                        )
                    ]
                )
            ]
        );
    }

    function buildSeqProjectFilter() {
        return div(
            {
                class: 'form-group',
                style: {
                    margin: '0 4px'
                }
            },
            [
                label(
                    {
                        style: {
                            marginRight: '4px'
                        }
                    },
                    'Project'
                ),
                input({
                    dataBind: {
                        value: 'seqProjectFilter',
                        css: 'seqProjectFilter() ? "' + styles.classes.activeFilterInput + '" : null'
                    },
                    placeholder: 'Filter by seq. project id',
                    class: 'form-control',
                    style: {
                        width: '12em'
                    }
                }),
                // enable the clear button
                gen.if(
                    'seqProjectFilter',
                    span(
                        {
                            dataBind: {
                                click: '() => {seqProjectFilter("");}'
                            },
                            class: 'kb-btn-mini -danger'
                        },
                        span({
                            class: 'fa fa-times'
                        })
                    )
                )
            ]
        );
    }

    function buildProposalFilter() {
        return div(
            {
                class: 'form-group',
                style: {
                    margin: '0 4px'
                }
            },
            [
                label(
                    {
                        style: {
                            marginRight: '4px'
                        }
                    },
                    'Proposal'
                ),
                input({
                    dataBind: {
                        value: 'proposalFilter',
                        css: 'proposalFilter() ? "' + styles.classes.activeFilterInput + '" : null'
                    },
                    placeholder: 'Filter by proposal id',
                    class: 'form-control',
                    style: {
                        width: '12em'
                    }
                }),
                // enable the clear button
                gen.if(
                    'proposalFilter',
                    span(
                        {
                            dataBind: {
                                click: '() => {proposalFilter("");}'
                            },
                            class: 'kb-btn-mini -danger'
                        },
                        span({
                            class: 'fa fa-times'
                        })
                    )
                )
            ]
        );
    }

    function buildPIFilter() {
        return div(
            {
                class: 'form-group',
                style: {
                    margin: '0 4px'
                }
            },
            [
                label(
                    {
                        style: {
                            marginRight: '4px'
                        }
                    },
                    'PI'
                ),
                input({
                    dataBind: {
                        textInput: 'piFilter',
                        css: 'piFilter() ? "' + styles.classes.activeFilterInput + '" : null'
                    },
                    placeholder: 'Filter by PI last name',
                    class: 'form-control',
                    style: {
                        width: '12em'
                    }
                }),
                // enable the clear button
                gen.if(
                    'piFilter',
                    span(
                        {
                            dataBind: {
                                click: 'function() {piFilter("");}'
                            },
                            class: 'kb-btn-mini -danger'
                        },
                        span({
                            class: 'fa fa-times'
                        })
                    )
                )
            ]
        );
    }

    function buildFilterArea() {
        return div(
            {
                class: 'form-inline',
                style: {}
            },
            [
                span(
                    {
                        style: {
                            fontWeight: 'bold',
                            color: 'gray',
                            marginTop: '8px',
                            fontSize: '80%'
                        }
                    },
                    'Filters: '
                ),
                buildTypeFilter(),
                buildPIFilter(),
                buildProposalFilter(),
                buildSeqProjectFilter()
            ]
        );
    }

    function buildResultsArea() {
        return gen.component({
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
            flex: '0 0 50px'
        },
        searchArea: {
            flex: '0 0 50px'
        },
        filterArea: {
            flex: '0 0 50px'
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
        return div(
            {
                class: styles.classes.component
            },
            [
                div(
                    {
                        class: styles.classes.navArea
                    },
                    buildNavArea()
                ),
                // The search input area
                div(
                    {
                        class: styles.classes.searchArea
                    },
                    buildInputArea()
                ),
                // The search filter area
                div(
                    {
                        class: styles.classes.filterArea
                    },
                    buildFilterArea()
                ),
                // The search results / error / message area
                div(
                    {
                        class: styles.classes.resultArea
                    },
                    [buildResultsArea()]
                )
            ]
        );
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});
