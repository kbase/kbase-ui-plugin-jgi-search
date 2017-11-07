define([
    'knockout-plus',
    'bluebird',
    'kb_common/html',
    'kb_common/ui',
    '../utils',
    'yaml!../helpData.yml'
], function (
    ko,
    Promise,
    html,
    ui,
    utils,
    helpData
) {
    'use strict';

    var t = html.tag,
        select = t('select'),
        option = t('option'),
        div = t('div'),
        span = t('span'),
        button = t('button'),
        input = t('input'),
        label = t('label');

    function buildHelpDialog(title) {
        return div({
            class: 'modal fade',
            tabindex: '-1',
            role: 'dialog'
        }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({
                            type: 'button',
                            class: 'close',
                            // dataDismiss: 'modal',
                            ariaLabel: 'Done',
                            dataBind: {
                                click: 'close'
                            }
                        }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"help"',
                                    params: {
                                        helpDb: 'helpDb'
                                    }
                                }
                            }
                        })
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({
                            type: 'button',
                            class: 'btn btn-default',
                            // dataDismiss: 'modal',
                            // dataElement: 'ok',
                            dataBind: {
                                click: 'close'
                            }
                        }, 'Done')
                    ])
                ])
            ])
        ]);
    }

    function helpVM(node) {
        // var helpTopics = helpData.topics.map(function(topic) {
        //     return {
        //         id: topic.id,
        //         title: topic.title,
        //         content: topic.content
        //             // content: topic.content.map(function(paragraph) {
        //             //     return p(paragraph);
        //             // }).join('\n')
        //     };
        // });

        function close() {
            var backdrop = document.querySelector('.modal-backdrop');
            backdrop.parentElement.removeChild(backdrop);
            node.parentElement.removeChild(node);
        }

        return {
            helpDb: helpData,
            close: close
        };
    }

    function showHelpDialog() {
        var dialog = buildHelpDialog('JGI Search Help'),
            dialogId = html.genId(),
            helpNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        helpNode.id = dialogId;
        helpNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(helpNode);

        var backdropNode = document.createElement('div');
        backdropNode.classList.add('modal-backdrop', 'fade', 'in');
        document.body.appendChild(backdropNode);

        ko.applyBindings(helpVM(modalNode), helpNode);
        modalDialogNode = modalNode.querySelector('.modal');
        modalDialogNode.classList.add('in');
        modalDialogNode.style.display = 'block';
    }

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

        function doHelp() {
            showHelpDialog();
        }

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

        // var seqProjectFilter = ko.observable();

        // Disable - simplify to single project filter
        // var newSeqProject = ko.observable();

        // newSeqProject.subscribe(function (newValue) {
        //     newValue = newValue.trim(' ');
        //     if (newValue.length === 0) {
        //         return;
        //     }
        //     params.search.seqProjectFilter.push(parseInt(newValue));
        //     newSeqProject('');
        // });

        // function doRemoveSeqProject(data) {
        //     params.search.seqProjectFilter.remove(data);
        // }

        console.log('in search, page size is', pageSize());

        return {
            // The top level search is included so that it can be
            // propagated.
            search: params.search,
            // And we break out fields here for more natural usage (or not??)
            searchInput: searchInput,
            searchResults: searchResults,
            searchTotal: searchTotal,
            searching: searching,
            pageSize: pageSize,
            page: page,
            // Type filter
            typeFilterInput: ko.observable('_select_'),
            typeFilterOptions: typeFilterOptions,
            // Project filter
            // newSeqProject: newSeqProject,
            seqProjectFilter: params.search.seqProjectFilter,
            proposalFilter: params.search.proposalFilter,
            piFilter: params.search.piFilter,

            // doRemoveSeqProject: doRemoveSeqProject,

            // ACTIONS
            doHelp: doHelp,
            doSearch: params.search.doSearch,
            doRemoveTypeFilter: doRemoveTypeFilter,
            doSelectTypeFilter: doSelectTypeFilter
        };
    }

    /*
        Builds the search input area using bootstrap styling and layout.
    */
    function buildInputArea() {
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            input({
                class: 'form-control',
                style: {
                    margin: '0 4px'
                },
                dataBind: {
                    textInput: 'searchInput',
                    hasFocus: true
                },
                placeholder: 'Search JGI Public Data'
            }),
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doSearch'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '125%',
                    color: '#000',
                    width: '2em'
                },
                dataBind: {
                    // style: {
                    //     color: 'searching() ? "green" : "#000"'
                    // }
                    css: {
                        'fa-search': '!searching()',
                        'fa-spinner fa-pulse': 'searching()',
                    }
                }
            })),
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doHelp'
                }
            }, span({
                class: 'fa fa-info'
            }))
        ]));
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
                        border: '1px silver solid',
                        borderRadius: '3px',
                        padding: '3px'
                    }
                }, [
                    span(({
                        dataBind: {
                            text: '$data'
                        },
                        style: {
                            padding: '3px'
                        }
                    })),
                    span({
                        dataBind: {
                            click: '$component.doRemoveTypeFilter'
                        },
                        class: 'kb-btn-mini'
                    }, 'x')
                ])
            ])
        ]);
    }

    // function buildSeqProjectFilter() {
    //     return div({
    //         class: 'form-group',
    //         style: {
    //             margin: '0 4px'
    //         }
    //     }, [
    //         label({}, 'Projects'),
    //         input({
    //             dataBind: {
    //                 value: 'newSeqProject'
    //             },
    //             placeholder: 'Filter by seq. project id'
    //         }),
    //         div({
    //             style: {
    //                 display: 'inline-block'
    //             },
    //             dataBind: {
    //                 foreach: 'seqProjectFilter'
    //             }
    //         }, [
    //             span({
    //                 style: {
    //                     border: '1px silver solid',
    //                     borderRadius: '3px',
    //                     padding: '3px'
    //                 }
    //             }, [
    //                 span(({
    //                     dataBind: {
    //                         text: '$data'
    //                     },
    //                     style: {
    //                         padding: '3px'
    //                     }
    //                 })),
    //                 span({
    //                     dataBind: {
    //                         click: '$component.doRemoveSeqProject'
    //                     },
    //                     class: 'kb-btn-mini'
    //                 }, 'x')
    //             ])
    //         ])
    //     ]);
    // }

    function buildFilterControl(arg) {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({
                style: {
                    marginRight: '2px'
                }
            }, arg.label),
            input({
                dataBind: {
                    value: 'filter',
                    style: {
                        'font-family': 'filter() ? "monospace": "inherit"'
                    }
                },
                placeholder: arg.placeholder,
                style: {
                    width: '8em'
                }
            }),
            // enable the clear button
            '<!-- ko if: filter -->',
            span({
                dataBind: {
                    click: 'function() {filter("");}'
                },
                class: 'kb-btn-mini'
            }, 'x'),
            '<!-- /ko -->',
            // disable the clear button
            '<!-- ko ifnot: filter -->',
            span({                
                class: 'kb-btn-mini -hidden'
            }, 'x'),
            '<!-- /ko -->'
        ]);
    }

    function buildSeqProjectFilter() {
        // return span({
        //     dataBind: {
        //         let: '{filter: seqProjectFilter}'
        //     }
        // }, buildFilterControl({
        //     label: 'Project',
        //     placeholder: 'Filter by seq. project id'
        // }));
        // return [
        //     '<!-- ko let: {filter: seqProjectFilter} -->',
        //     buildFilterControl({
        //         label: 'Project',
        //         placeholder: 'Filter by seq. project id'
        //     }),
        //     '<!-- /ko -->'
        // ];
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({
                style: {
                    marginRight: '2px'
                }
            }, 'Project'),
            input({
                dataBind: {
                    value: 'seqProjectFilter',
                    style: {
                        'font-family': 'seqProjectFilter() ? "monospace": "inherit"'
                    }
                },
                placeholder: 'Filter by seq. project id',
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
                class: 'kb-btn-mini'
            }, 'x'),
            '<!-- /ko -->',
            // disable the clear button
            '<!-- ko ifnot: seqProjectFilter -->',
            span({                
                class: 'kb-btn-mini -hidden'
            }, 'x'),
            '<!-- /ko -->'
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
                    marginRight: '2px'
                }
            }, 'Proposal'),
            input({
                dataBind: {
                    value: 'proposalFilter',
                    style: {
                        'font-family': 'proposalFilter() ? "monospace": "inherit"'
                    }
                },
                placeholder: 'Filter by proposal id',
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
                class: 'kb-btn-mini'
            }, 'x'),
            '<!-- /ko -->',
            // disable the clear button
            '<!-- ko ifnot: proposalFilter -->',
            span({                
                class: 'kb-btn-mini -hidden'
            }, 'x'),
            '<!-- /ko -->'
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
                    marginRight: '2px'
                }
            }, 'PI'),
            input({
                dataBind: {
                    value: 'piFilter',
                    style: {
                        'font-family': 'piFilter() ? "monospace": "inherit"'
                    }
                },
                placeholder: 'Filter by PI last name',
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
                class: 'kb-btn-mini'
            }, 'x'),
            '<!-- /ko -->',
            // disable the clear button
            '<!-- ko ifnot: piFilter -->',
            span({                
                class: 'kb-btn-mini -hidden'
            }, 'x'),
            '<!-- /ko -->'
        ]);
    }

    function buildAnalysisProjectFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label({}, 'Projects'),
            input({
                dataBind: {
                    value: 'newProject'
                },
                placeholder: 'Filter by anal. project id'
            }),
            div({
                style: {
                    display: 'inline-block'
                },
                dataBind: {
                    foreach: 'projectFilter'
                }
            }, [
                span({
                    style: {
                        border: '1px silver solid',
                        borderRadius: '3px',
                        padding: '3px'
                    }
                }, [
                    span(({
                        dataBind: {
                            text: '$data'
                        },
                        style: {
                            padding: '3px'
                        }
                    })),
                    span({
                        dataBind: {
                            click: '$component.doRemoveProject'
                        },
                        class: 'kb-btn-mini'
                    }, 'x')
                ])
            ])
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
        return utils.komponent({
            name: 'jgisearch/browser',
            params: {
                search: 'search'
            }
        });
    }

    function buildExample(text) {
        return span({
            style: {
                fontFamily: 'monospace',
                backgroundColor: 'rgba(247, 242, 225, 0.5)',
                fontWeight: 'bold',
                border: '1px gray solid',
                padding: '4px'
            }
        }, text);
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
            // border: '1px blue dashed'
        },
        resultArea: {
            flex: '1 1 0px',
            // border: '1px green dotted',
            display: 'flex',
            flexDirection: 'column'
        }
    });


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
                buildResultsArea(),
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
