define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    '../utils'
], function (
    ko,
    html,
    BS,
    utils
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        button = t('button'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3');

    function viewModel(params) {

        var stagingStatus = ko.observable();
        var error = ko.observable();

        function doStage() {
            // spawn the staging request
            // the search vm takes care of the rest...

            // stagingStatus('requesting');

            // TODO: need to work on the detail item structure!
            console.log('going to stage ...', params.item.data.id);

            params.search.doStage(params.item.data.id)
                .then(function (result) {
                    console.log('result', result);
                    if ('jobId' in result) {
                        params.item.transferJob(result);
                        // stagingStatus('sent');
                    } else {
                        // stagingStatus('error');
                        error(result);
                    }
                })
                .catch(function (err) {
                    // stagingStatus('error');
                    error({
                        message: err.message,
                        error: err
                    });
                });
        }

        var transferJob = ko.observable();

        return {
            item: params.item,
            search: params.search,
            doStage: doStage,
            stagingStatus: stagingStatus,
            error: error
        };
    }

    var styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        sectionHeader: {
            css: {
                fontWeight: 'bold'
            }
        }
    });

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
                th('Id'),
                td({
                    dataBind: {
                        text: 'id'
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
            class: 'container-fluid',
            dataBind: {
                with: 'item'
            }
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

    function buildDestinationFileInfo() {
        return div({
            dataBind: {
                with: 'importSpec'
            }
        }, [
            div({
                class: styles.classes.sectionHeader
            }, 'File Info'),
            p([
                'After the files are copied, two files will appear in your Staging Directory. ',
                'The original data file, prefixed with a unique id; and a "metadata file", ',
                'containing the same metadata you can find in the metadata tab.'
            ]),
            table({
                class: 'table form',
                dataBind: {
                    with: 'stagingSpec'
                }
            }, [
                tr([
                    th('Data file'),
                    td({
                        style: {
                            width: '60%',
                            // any max-width < the actual width it may be
                            // seems okay, need to test.
                            maxWidth: '10px',
                            whiteSpace: 'nowrap',
                            overflowX: 'auto',
                            textOverflow: 'ellipsis'
                        }
                    }, [
                        span({
                            dataBind: {
                                text: 'indexId'
                            }
                        }),
                        '.',
                        span({
                            dataBind: {
                                text: 'fileName'
                            },
                            style: {
                                fontWeight: 'bold'
                            }
                        })
                    ])
                ]),
                tr([
                    th('Metadata file'),
                    td([
                        span({
                            dataBind: {
                                text: 'indexId'
                            }
                        }),
                        '.metadata'
                    ])
                ])
            ])
        ]);
    }

    function buildImportForm() {
        return div({
            // dataBind: {
            //     with: 'stagingSpec'
            // }
        }, [
            div({
                style: {
                    width: '20em',
                    margin: '10px auto 20px auto'
                }
            }, [
                div({
                    class: 'button-group'
                }, [
                    button({
                        dataBind: {
                            click: '$component.doStage',
                            disable: 'transferJob()'
                        },
                        class: 'btn btn-primary'
                    }, [
                        span({
                            class: 'fa fa-download fa-rotate-270',
                            style: {
                                margin: '0 4px 0 0'
                            }
                        }),
                        'Copy JGI File to your Data Staging Area'
                    ])
                ]),
                div({
                    style: {
                        textAlign: 'center',
                        marginTop: '4px'
                    }
                }, [
                    '<!-- ko if: transferJob() -->',

                    '<!-- ko if: transferJob().status() !== "completed" -->',
                    div([
                        span({
                            class: 'fa fa-spinner fa-pulse fa-fw',
                            style: {
                                // margin: '0 4px',
                                color: 'orange'
                            }
                        }),
                        span({
                            dataBind: {
                                text: 'transferJob().status()'
                            },
                            style: {
                                marginLeft: '4px'
                            }
                        }),
                    ]),
                    '<!-- /ko -->',

                    '<!-- ko if: transferJob().status() == "completed" -->',
                    div([
                        span({
                            class: 'fa fa-check',
                            style: {
                                color: 'green'
                            }
                        }),
                        span({
                            style: {
                                marginLeft: '4px'
                            }
                        }, 'Transfer complete!'),
                    ]),
                    '<!-- /ko -->',

                    '<!-- /ko -->',

                    '<!-- ko if: $component.error -->',
                    div({
                        dataBind: {
                            with: '$component.error'
                        },
                        style: {
                            border: '2px red solid'
                        }
                    }, [
                        div({
                            dataBind: {
                                text: 'message'
                            }
                        })
                    ]),
                    '<!-- /ko -->'
                ])
            ]),
            div({
                style: {
                    width: '50em',
                    margin: '10px auto 20px auto'
                }
            }, [
                '<!-- ko if: transferJob() -->',

                '<!-- ko if: transferJob().status() !== "completed" -->',
                div({
                    style: {
                        border: '1px orange solid',
                        padding: '10px'
                    }
                }, [
                    p([
                        'Transfer is in progress. You may close this window and monitor it from the main results window.'
                    ])
                ]),
                '<!-- /ko -->',

                '<!-- ko if: transferJob().status() == "completed" -->',
                div({
                    style: {
                        border: '1px green solid',
                        padding: '10px'
                    }
                }, [
                    p([
                        'Transfer is complete. You will find your transferred file in the Data Panel\'s Staging tab of any Narrative, ',
                        'from where you may import it.'
                    ])
                ]),
                '<!-- /ko -->',

                '<!-- /ko -->',

                '<!-- ko if: $component.error -->',
                div({
                    dataBind: {
                        with: '$component.error'
                    },
                    style: {
                        border: '2px red solid'
                    }
                }, [
                    div({
                        dataBind: {
                            text: 'message'
                        }
                    })
                ]),
                '<!-- /ko -->'
            ])
        ]);
    }

    // function buildImporter() {
    //     return [
    //         '<!-- ko if: !importSpec -->',
    //         div('No import available for this file type'),
    //         '<!-- /ko -->',
    //         '<!-- ko if: importSpec -->',
    //
    //         '<!-- ko if: !$component.search.jgiTerms.agreed() -->',
    //         div({
    //             style: {
    //                 margin: '4px 0 ',
    //                 border: '2px red solid',
    //                 padding: '4px',
    //                 textAlign: 'center'
    //             },
    //             dataBind: {
    //                 with: '$component.search.jgiTerms'
    //             }
    //         }, [
    //             p([
    //                 'To copy or import public JGI data files into KBase, ',
    //                 br(),
    //                 'you must agree to the JGI Data Usage and Download Policy.'
    //             ]),
    //             button({
    //                 class: 'btn btn-primary',
    //                 dataBind: {
    //                     click: 'doView'
    //                 }
    //             }, 'View and (Possibly) Agree')
    //         ]),
    //         '<!-- /ko -->',
    //
    //         '<!-- ko if: $component.search.jgiTerms.agreed() -->',
    //         div({
    //             dataBind: {
    //                 with: 'importSpec'
    //             }
    //         }, [
    //             buildImportForm(),
    //         ]),
    //         '<!-- /ko -->',
    //
    //         '<!-- /ko -->'
    //     ];
    // }

    function buildDestImportInfo() {
        return [
            '<!-- ko if: !importSpec -->',
            div('No import available for this file type'),
            '<!-- /ko -->',
            '<!-- ko if: importSpec -->',
            div({
                dataBind: {
                    with: 'importSpec'
                }
            }, [
                '<!-- ko if: kbaseType -->',
                div({
                    class: styles.classes.sectionHeader
                }, 'Import information'),
                p([
                    'After copying the file to your Staging Folder, you will be able to import the file into a Narrative as a',
                    ' data object of type ',
                    span({
                        style: {
                            fontWeight: 'bold',
                        },
                        dataBind: {
                            with: 'kbaseType'
                        }
                    }, [
                        span({
                            dataBind: {
                                text: 'module'
                            }
                        }),
                        '.',
                        span({
                            dataBind: {
                                text: 'name'
                            }
                        }),
                        '-',
                        span({
                            dataBind: {
                                text: 'version'
                            }
                        })
                    ])
                ]),
                '<!-- /ko -->',
                '<!-- ko if: error -->',
                div({
                    dataBind: {
                        text: 'error'
                    },
                    class: 'text-danger'
                }),
                '<!-- /ko -->'
            ]),
            '<!-- /ko -->',
        ];
    }

    function buildSourceFileInfo() {
        return div([
            div({
                class: styles.classes.sectionHeader
            }, 'File info'),
            table({
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
                    th('Size'),
                    td({
                        dataBind: {
                            text: 'size'
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
            ])
        ]);
    }
    // function buildInfoLink(tip) {
    //     var tipId = html.genId();
    //     return div({
    //         style: {
    //             position: 'relative',
    //             display: 'inline-block'
    //         }
    //     }, [
    //         span({
    //             class: 'fa fa-info info-tooltip',
    //             dataBind: {
    //                 click: '$component.doShowTip.bind(null, "' + tipId + '")'
    //             },
    //         }),
    //         div({
    //             class: 'kb-tooltip -hidden',
    //             id: tipId,
    //             dataBind: {
    //                 text: '$component.infoTopics["' + tip + '"].tip'
    //             }
    //         })
    //     ]);
    // }
    function buildSourceImportMetadata() {
        return div({
            dataBind: {
                with: 'importSpec'
            }
        }, [

            '<!-- ko if: kbaseType -->',
            div({
                class: styles.classes.sectionHeader
            }, 'File import metadata'),
            p([
                'This information may be required when importing the data into KBase.'
            ]),
            table({
                class: 'table',
                dataBind: {
                    foreach: 'importMetadata'
                }
            }, [
                tr([
                    th({
                        dataBind: {
                            text: 'key'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'value'
                        }
                    })
                ])
            ]),

            '<!-- /ko -->',
            '<!-- ko if: !kbaseType -->',
            div([
                p([
                    'Sorry, this file is not importable into KBase.'
                ])
            ]),
            '<!-- /ko -->'
        ]);
    }

    function buildImportView() {
        return div({
            class: 'container-fluid',
            dataBind: {
                with: 'item'
            }
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    buildImportForm()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    span({
                        style: {
                            fontWeight: 'bold',
                            fontSize: '120%',
                            marginRight: '4px'
                        }
                    }, 'Source - JGI'),
                    // buildInfoLink('fromFile')
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    span({
                        style: {
                            fontWeight: 'bold',
                            fontSize: '120%',
                            marginRight: '4px'
                        }
                    }, 'Destination - KBase'),
                    // buildInfoLink('toStaging')
                ])
            ]),

            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    p([
                        'The file is stored at the JGI Archive and Metadata Organizer (JAMO) and ',
                        'may be copied into your KBase File Staging Area.'
                    ])
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    p([
                        'The JGI JAMO file will be copied into your KBase Staging Area ',
                        'from where it may be imported into one or more KBase Narratives for ',
                        'further analysis and inspection.'
                    ])
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    buildSourceFileInfo()
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    buildDestinationFileInfo()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    buildSourceImportMetadata()
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    buildDestImportInfo()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [

                ]),
                div({
                    class: 'col-md-6'
                }, [

                ])
            ]),

        ]);
    }

    function buildMetadataView() {
        return div({
            dataBind: {
                component: {
                    name: '"jgisearch/json-viewer"',
                    params: {
                        value: '$component.item.source.metadata',
                        open: true
                    }
                }
            },
            style: {
                margin: '4px',
                // border: '1px silver solid',
                padding: '4px'
            }
        });
    }

    function template() {
        return div([
            styles.sheet,
            BS.buildTabs({
                tabs: [{
                    id: 'project',
                    title: 'Project',
                    body: buildProjectView()
                }, {
                    id: 'import',
                    title: 'Import',
                    body: buildImportView()
                }, {
                    id: 'metadata',
                    title: 'Metadata',
                    body: buildMetadataView()
                }]
            }).content
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
