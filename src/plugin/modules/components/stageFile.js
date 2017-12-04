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

        var filenameStatus = {
            error: ko.observable(),
            loading: ko.observable()
        };

        destinationFileBaseName.extend({
            rateLimit: {
                timeout: 500,
                method: 'notifyWhenChangesStop'
            }
        });

        destinationFileBaseName.subscribe(function (newValue) {
            if (!newValue || newValue.length === 0) {
                filenameStatus.error('Cannot have empty filename');
                return;
            }

            var actualFilename = [newValue, '.',  destinationFileExtension()].join('');

            // detect duplicate filename here, and set status accordingly.
            filenameStatus.loading(true);
            params.checkFilename(actualFilename)
                .then(function (error) {
                    if (error) {
                        filenameStatus.error(error);
                    } else {
                        filenameStatus.error(null);
                    }                    
                })
                .catch(function (err) {
                    filenameStatus.error(err.message);
                })
                .finally(function () {
                    filenameStatus.loading(false);
                });
        });

        var stageButtonEnabled = ko.pureComputed(function () {
            if (filenameStatus.error()) {
                return false;
            }
            if (filenameStatus.loading()) {
                return false;
            }
            return true;
        });

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

        var showDetail = ko.observable(false);

        var showDetailClass = ko.pureComputed(function () {
            if (showDetail()) {
                return styles.classes.textin;
            }
            return styles.classes.textout;
        });

        return {
            item: item,
            destinationFileBaseName: destinationFileBaseName,
            destinationFileExtension: destinationFileExtension,
            isImportable: isImportable,
            error: error,
            showDetail: showDetail,
            showDetailClass: showDetailClass,

            onClose: params.onClose,
            //  pass through...
            id: params.id,
            fileName: fileName,
            filenameStatus: filenameStatus,
            doStage: params.doStage,
            transferJob: params.transferJob,
            stageButtonEnabled: stageButtonEnabled
        };
    }

    var styles = html.makeStyles({
        classes: {
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
            },
            textin: {
                css: {
                    animationDuration: '0.5s',
                    animationName: 'appear',
                    animationIterationCount: '1',
                    animationDirection: 'normal',
                    opacity: '1',
                    height: 'auto'
                    // maxHeight: '300px'
                }
            },
            textout: {
                css: {
                    animationDuration: '0.5s',
                    animationName: 'disappear',
                    animationIterationCount: '1',
                    animationDirection: 'normal',
                    opacity: '0',
                    // transformOrigin: 'top',
                    // transform: 'scaleY(0)'
                    height: '0px'
                    // maxHeight: '0px'
                }
            },
        },
        rules: {
            keyframes: {
                appear: {
                    from: {
                        // transform: 'scaleY(0)',
                        // transformOrigin: 'top',
                        height: '0px',
                        // maxHeight: '0px',
                        opacity: '0'
                    },
                    to: {
                        // transform: 'scaleY(1)',
                        // transformOrigin: 'top',
                        height: 'auto',
                        // maxHeight: '300px',
                        opacity: '1'
                    }
                },
                disappear: {
                    from: {
                        // transform: 'scaleY(1)',
                        // transformOrigin: 'top',
                        height: 'auto',
                        // maxHeight: '300px',
                        opacity: '1'
                    },
                    to: {
                        // transform: 'scaleY(0)',
                        // transformOrigin: 'top',
                        height: '0px',
                        // maxHeight: '0px',
                        opactiy: '0'
                    }
                }
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

    function buildFilenameStatusIndicator() {
        return [
            '<!-- ko ifnot: filenameStatus.loading -->',

            '<!-- ko ifnot: filenameStatus.error -->',
            span([
                span({
                    class: 'fa fa-check',
                    style: {
                        color: 'green'
                    }
                }),
                ' This filename is ok :)'
            ]),
            '<!-- /ko -->',

            '<!-- ko if: filenameStatus.error -->',
            span({
                class: 'alert alert-danger',
                style: {
                    width: '100%'
                },
                dataBind: {
                    text: 'filenameStatus.error'
                }
            }),
            '<!-- /ko -->',

            '<!-- /ko -->',

            '<!-- ko if: filenameStatus.loading -->',
            span({ 
                class: 'fa fa-spinner fa-pulse'
            }),
            '<!-- /ko -->'
        ];
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
                                    textInput: 'destinationFileBaseName'
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
                        ]),
                        div({
                            style: {
                                display: 'flex',
                                flexDirection: 'row',
                                width: '100%',
                                alignItems: 'baseline'
                            }
                        }, [
                            buildFilenameStatusIndicator()
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
                    p({
                        dataBind: {
                            css: 'showDetailClass'                            
                        },
                        style: {
                            overflowY: 'hidden'
                        }
                    }, [
                        'The file is stored at the JGI Archive and Metadata Organizer (JAMO) and ',
                        'may be copied into your KBase File Staging Area.'
                    ])
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    p({
                        dataBind: {
                            css: 'showDetailClass' 
                        }
                    }, [
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
                                    transferJob: 'transferJob',
                                    enabled: 'stageButtonEnabled'
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
                'Copy a file from JGI JAMO to your KBase Staging Area.',
                
            ]),
            p({
                dataBind: {
                    css: 'showDetailClass' 
                }
            }, [
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
                class: 'btn btn-default',
                dataBind: {
                    click: 'onClose'
                }
            }, 'Close')),

        ]);
    }

    function buildTitle() {
        return div([
            'Copy File to Staging',
            span({
                style: {
                    float: 'right',
                    fontSize: '80%',
                    paddingTop: '8px',
                    marginRight: '40px'
                }
            }, [
                'Show details? ',
                input({
                    type: 'checkbox',
                    dataBind: {
                        checked: 'showDetail'
                    }
                })
            ])
        ]);
    }

    function template() {
        return div([
            styles.sheet,
            buildDialog(buildTitle(), buildBody())
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