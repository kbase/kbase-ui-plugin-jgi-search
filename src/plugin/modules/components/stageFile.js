define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        button = t('button'),
        p = t('p'),
        input = t('input'),
        table = t('table'),
        colgroup = t('colgroup'),
        col = t('col'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');


    function viewModel(params) {

        var item = ko.observable();

        var destinationFileBaseName = ko.observable();
        var destinationFileExtension = ko.observable();
        var isImportable = ko.observable();
        var error = ko.observable();
        var fileName = ko.observable();
    
        params.getDetail(params.id)
            .then(function (result) {
                item(result);

                destinationFileBaseName(result.file.parts.base);
                destinationFileExtension(result.file.parts.extension);
                fileName(result.file.parts.name);

                if (result.file.typing.error) {
                    isImportable(false);
                    error(result.file.typing.error);
                } else {
                    isImportable(true);
                }
            });

        return {
            item: item,
            destinationFileBaseName: destinationFileBaseName,
            destinationFileExtension: destinationFileExtension,
            isImportable: isImportable,
            error: error,

            onClose: params.onClose,
            //  pass through...
            id: params.id,
            fileName: fileName,
            doStage: params.doStage,
            transferJob: params.transferJob            
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

    function buildSourceFileInfo() {
        return div([
            // div({
            //     class: styles.classes.sectionHeader
            // }, 'File info'),

            '<!-- ko if: item -->',
            '<!-- ko with: item -->',
            table({
                class: 'table',
                dataBind: {
                    with: 'file'
                }
            }, [
                colgroup([
                    col({
                        style: {
                            width: '30%'                            
                        }
                    }),
                    col({
                        style: {
                            width: '70%'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Filename'),
                    td({
                        dataBind: {
                            text: 'name'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Data type'),
                    td({
                        dataBind: {
                            text: 'dataType'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Encoding'),
                    td({
                        dataBind: {
                            text: 'encoding ? encoding : "-"'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Size'),
                    td({
                        dataBind: {
                            text: 'size'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Date added'),
                    td({
                        dataBind: {
                            text: 'added'
                        }
                    })
                ])
            ]),
            '<!-- /ko -->',
            '<!-- /ko -->',

            '<!-- ko ifnot: item -->',
            html.loading(),
            '<!-- /ko -->'
        ]);
    }

   

    function buildDestinationFileTable() {
        return div({
            // dataBind: {
            //     with: 'importSpec'
            // }
        }, [
            // div({
            //     class: styles.classes.sectionHeader
            // }, 'File Info'),
            // p([
            //     'Before copying the file to your staging area, you may reanme it.'
            // ]),
            table({
                class: 'table form',
                // dataBind: {
                //     with: 'stagingSpec'
                // }
            }, [
                colgroup([
                    col({
                        style: {
                            width: '30%'                            
                        }
                    }),
                    col({
                        style: {
                            width: '70%'
                        }
                    })
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Filename'),
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
                        // span({
                        //     dataBind: {
                        //         text: 'indexId'
                        //     }
                        // }),
                        // '.',
                        div({
                            style: {
                                display: 'flex',
                                flexDirection: 'row',
                                width: '100%',
                                alignItems: 'baseline'
                            }
                        }, [
                            input({
                                dataBind: {
                                    value: 'destinationFileBaseName'
                                },
                                style: {
                                    flex: '1 1 0px'
                                }
                            }),
                            '<!-- ko if: destinationFileExtension -->',
                            '.',
                            div({
                                dataBind: {
                                    text: 'destinationFileExtension'
                                },
                                style: {
                                    flex: '0 0 auto'
                                }
                            }),
                            '<!-- /ko -->',
                            '<!-- ko ifnot: destinationFileExtension -->',
                            div({
                                style: {
                                    fontStyle: 'italic',
                                    flex: 'o o auto'
                                }
                            }, 'n/a'),
                            '<!-- /ko -->'
                        ])
                    ])
                ])
                // tr([
                //     th('Metadata file'),
                //     td([
                //         span({
                //             dataBind: {
                //                 text: 'indexId'
                //             }
                //         }),
                //         '.metadata'
                //     ])
                // ])
            ])
        ]);
    }

    function buildDestinationFileInfo() {
        return div([
            // div({
            //     class: styles.classes.sectionHeader
            // }, 'File info'),

            '<!-- ko if: item -->',
            // '<!-- ko with: item -->',
            '<!-- ko if: isImportable -->',
            buildDestinationFileTable(),
            '<!-- /ko -->',
            '<!-- ko ifnot: isImportable -->',
            div({
                style: {
                    color: 'red'
                }
            }, [
                p('sorry, not importable'),
                p({
                    dataBind: {
                        text: 'error().message'
                    }
                })
            ]),
            '<!-- /ko -->',
            // '<!-- /ko -->',
            '<!-- /ko -->',

            '<!-- ko ifnot: item -->',
            html.loading(),
            '<!-- /ko -->'
        ]);
    }

    function buildImportView() {
        return div({
            class: 'container-fluid',
            // dataBind: {
            //     with: 'item'
            // }
        }, [
           
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
                    class: 'col-md-12'
                }, [
                    div({
                        dataBind: {
                            component: { 
                                name: '"jgi-search/stage-file-control"',
                                params: {
                                    id: 'id',
                                    fileName: 'fileName',
                                    doStage: 'doStage',
                                    transferJob: 'transferJob'
                                }
                            }
                        }
                    })
                ])
            ])
            // div({
            //     class: 'row'
            // }, [
            //     div({
            //         class: 'col-md-6'
            //     }, [
            //         buildSourceImportMetadata()
            //     ]),
            //     div({
            //         class: 'col-md-6'
            //     }, [
            //         buildDestImportInfo()
            //     ])
            // ]),
           

        ]);
    }

    function buildBody() {
        return div([
            p([
                'Copy a file from JGI JAMO to your KBase Staging Area.'
            ]),
            p([
                'Copying a file from JGI JAMO into your Staging area may take anywhere from a few seconds to ',
                'several minutes. If the file is not readily available on disk at JAMO, it will be fetched from ',
                'the tape archive, a process which may take several minutes by itself. In addition, large files will ',
                'take longer than smaller ones, due both to retrieval of the data from tape to disk, and then ',
                'copying over the network to your KBase Staging area.'
            ]),
            buildImportView()
        ]);
    }

    function buildDialog(title, body) {
        return div({
            style: {
                // backgroundColor: 'white'
            }
        }, [
            // title
            div({
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px',
                    borderBottom: '1px green solid'
                }
            }, title),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                }
            }, body),
            // buttons
            div({
                // dataBind: {
                //     foreach: 'buttons'
                // },
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                dataBind: {
                    click: 'onClose'
                }
            }, 'Close')),

        ]);
    }

    function template() {
        return buildDialog('Copy File to Staging', buildBody());
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});