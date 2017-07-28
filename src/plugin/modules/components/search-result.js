define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function(
    ko,
    html,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3'),
        h4 = t('h4');

    function viewModel(params) {
        var searchResults = params.searchVM.searchResults;
        var searching = params.searchVM.searching;
        return {
            searchVM: params.searchVM,
            searchResults: searchResults,
            searching: searching
        };
    }

    function buildImportForm() {
        return div({

        }, table({
            class: 'table table-striped'
        }, [
            tr([
                th('Index Id'),
                td({
                    dataBind: {
                        text: 'stagingSpec.indexId'
                    }
                })
            ]),
            tr([
                th(''),
                td(button({
                    dataBind: {
                        click: 'stagingSpec.doStage'
                    }
                }, 'Stage'))
            ]),
            tr([
                th('Status'),
                td({
                    dataBind: {
                        text: 'stagingSpec.stagingStatus'
                    }
                })
            ])
        ]));
    }

    function buildImporter() {
        return [
            '<!-- ko if: !$component.searchVM.jgiTerms.agreed() -->',
            p([
                'To import public JGI data files into KBase, you must agree to the JGI Data Usage and Download Policy.'
            ]),
            div({
                style: {
                    margin: '4px',
                    border: '1px silver solid',
                    padding: '4px',
                    textAlign: 'center'
                },
                dataBind: {
                    with: '$component.searchVM.jgiTerms'
                }
            }, [
                button({
                    class: 'btn btn-primary',
                    dataBind: {
                        click: 'doView'
                    }
                }, 'View and (Possibly) Agree')
            ]),
            '<!-- /ko -->',
            '<!-- ko if: $component.searchVM.jgiTerms.agreed() -->',
            '<!-- ko if: importSpecs.length === 0 -->',
            div('No import available for this file type'),
            '<!-- /ko -->',
            '<!-- ko if: importSpecs.length > 0 -->',
            div({
                dataBind: {
                    foreach: 'importSpecs'
                }
            }, [
                h4('Type info'),
                table({
                    class: 'table table-striped',
                    dataBind: {
                        with: 'importSpec'
                    }
                }, [
                    tr([
                        th('Module'),
                        td({
                            dataBind: {
                                text: 'kbaseType.module'
                            }
                        })
                    ]),
                    tr([
                        th('Name'),
                        td({
                            dataBind: {
                                text: 'kbaseType.name'
                            }
                        })
                    ]),
                    tr([
                        th('Version'),
                        td({
                            dataBind: {
                                text: 'kbaseType.version'
                            }
                        })
                    ]),
                ]),
                h4('Form'),
                buildImportForm()
            ]),
            '<!-- /ko -->',
            '<!-- /ko -->'
        ];
    }

    function buildFileInfo() {
        return table({
            class: 'table table-striped',
            dataBind: {
                with: 'file'
            }
        }, [
            tr([
                th('Filename'),
                td({
                    dataBind: {
                        text: 'name'
                    }
                })
            ]),
            tr([
                th('Data type'),
                td({
                    dataBind: {
                        text: 'dataType'
                    }
                })
            ]),
            tr([
                th('Encoding'),
                td({
                    dataBind: {
                        text: 'encoding'
                    }
                })
            ]),
            tr([
                th('Indexed Type'),
                td({
                    dataBind: {
                        text: 'indexedType'
                    }
                })
            ]),
            tr([
                th('Size'),
                td({
                    dataBind: {
                        text: 'size'
                    }
                })
            ]),
            tr([
                th('Status'),
                td({
                    dataBind: {
                        text: 'status'
                    }
                })
            ]),

            tr([
                th('Date added'),
                td({
                    dataBind: {
                        text: 'added'
                    }
                })
            ])
        ]);
    }

    function buildProposalInfo() {
        return table({
            class: 'table table-striped',
            dataBind: {
                with: 'proposal'
            }
        }, [
            tr([
                th('Title'),
                td({
                    dataBind: {
                        text: 'title'
                    }
                })
            ]),
            tr([
                th('PI'),
                td({
                    dataBind: {
                        text: 'pi.last_name + ", " + pi.first_name'
                    }
                })
            ]),
            tr([
                th('Year'),
                td({
                    dataBind: {
                        text: 'year'
                    }
                })
            ])
        ]);
    }

    function buildProjectInfo() {
        return table({
            class: 'table table-striped',
            dataBind: {
                with: 'project'
            }
        }, [
            tr([
                th('Name'),
                td({
                    dataBind: {
                        text: 'name'
                    }
                })
            ]),
            tr([
                th('ID'),
                td({
                    dataBind: {
                        text: 'id'
                    }
                })
            ]),
            tr([
                th('Status'),
                td({
                    dataBind: {
                        text: 'status'
                    }
                })
            ]),
            tr([
                th('As of'),
                td({
                    dataBind: {
                        text: 'statusDate'
                    }
                })
            ]),
            tr([
                th('Comments'),
                td({
                    dataBind: {
                        text: 'comments'
                    }
                })
            ]),
            // tr([
            //     th('Year'),
            //     td({
            //         dataBind: {
            //             text: 'year'
            //         }
            //     })
            // ])
        ]);
    }

    function buildProjectView() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    h3('Proposal'),
                    buildProposalInfo()
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('Sequencing Project'),
                    buildProjectInfo()
                ])
            ])
        ]);
    }

    function buildImportView() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    h3('From file'),
                    buildFileInfo()
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('To object'),
                    buildImporter()
                ])
            ])
        ]);
    }


    function buildResult() {
        return div({
            class: '-result'
        }, [
            div({
                dataBind: {
                    click: 'function (data) {data.showDetail(!data.showDetail());}',
                    css: {
                        '-active': 'showDetail'
                    }
                },
                class: '-summary-row'
            }, [
                div({
                    dataBind: {
                        text: 'rowNumber'
                    },
                    style: {
                        width: '5%'
                    },
                    class: '-cell'
                }),
                // div({
                //     dataBind: {
                //         text: 'score'
                //     },
                //     style: {
                //         width: '5%'
                //     },
                //     class: '-cell'
                // }),
                div({
                    dataBind: {
                        text: 'projectId',
                        clickBubble: false,
                        click: '$component.searchVM.doAddToSearch.bind($data, $data, "projectId")'
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell -search-link'
                }),
                div({
                    dataBind: {
                        text: 'title'
                    },
                    style: {
                        width: '30%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'pi',
                        // click: 'function (data) {doAddToSearch(data, "pi"); return false;}',
                        click: '$component.searchVM.doAddToSearch.bind($data, $data, "pi")',
                        clickBubble: false
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell -search-link'
                }),
                div({
                    dataBind: {
                        text: 'modified'
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'dataType'
                    },
                    style: {
                        width: '5%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'scientificName'
                    },
                    style: {
                        width: '15%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'metadata'
                    },
                    style: {
                        width: '15%'
                    },
                    class: '-cell'
                })
            ]),
            '<!-- ko if: showDetail -->',
            BS.buildTabs({
                tabs: [{
                    name: 'project',
                    label: 'Project',
                    body: div({
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    }, buildProjectView())
                }, {
                    name: 'import',
                    label: 'Import',
                    body: div({
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    }, buildImportView())
                }, {
                    name: 'metadata',
                    label: 'Metadata',
                    body: div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: '$data.detail.metadata',
                                    open: true
                                }
                            }
                        },
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    })
                }, {
                    name: 'alldata',
                    label: 'All Data',
                    body: div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: '$data.detail'
                                }
                            }
                        },
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    })
                }, {
                    name: 'rawdata',
                    label: 'Raw Data',
                    body: div({
                        class: '-detail',
                        dataBind: {
                            text: 'detailFormatted'
                        }
                    })
                }]
            }).content,
            '<!-- /ko -->'
        ]);
    }

    function template() {
        return div({
            class: 'component-jgi-search-search-result'
        }, [
            div({}, [
                div({
                    class: '-results'
                }, [
                    div({
                        class: '-header'
                    }, [
                        div({
                            style: {
                                width: '5%'
                            },
                            class: '-cell'
                        }, '#'),
                        // div({
                        //     style: {
                        //         width: '5%'
                        //     },
                        //     class: '-cell'
                        // }, 'Score'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'Project ID'),
                        div({
                            style: {
                                width: '30%'
                            },
                            class: '-cell'
                        }, 'Title'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'PI'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'Date'),
                        div({
                            style: {
                                width: '5%'
                            },
                            class: '-cell'
                        }, 'Type'),
                        div({
                            style: {
                                width: '15%'
                            },
                            class: '-cell'
                        }, 'Scientific name'),
                        div({
                            style: {
                                width: '15%'
                            },
                            class: '-cell'
                        }, 'Metadata')
                    ]),
                    '<!-- ko if: searchResults().length > 0 -->',
                    '<!-- ko foreach: searchResults -->',
                    buildResult(),
                    '<!-- /ko -->',
                    '<!-- /ko -->',
                    '<!-- ko if: searchResults().length === 0 -->',
                    '<!-- ko if: searching() -->',
                    div({
                        style: {
                            margin: '10px',
                            border: '1px silver solid',
                            padding: '8px',
                            backgroundColor: 'silver',
                            textAlign: 'center'
                        }
                    }, html.loading('Searching...')),
                    '<!-- /ko -->',
                    '<!-- ko if: !searching() -->',
                    div({
                        style: {
                            margin: '10px',
                            border: '1px silver solid',
                            padding: '8px',
                            backgroundColor: 'silver',
                            textAlign: 'center'
                        }
                    }, 'no results, keep trying!'),
                    '<!-- /ko -->',
                    '<!-- /ko -->'

                ])
            ])
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    ko.components.register('jgisearch/search-result', component());
});