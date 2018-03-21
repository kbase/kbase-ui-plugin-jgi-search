/*
stageFileDialog
    
*/
define([
    'knockout-plus',
    'kb_common/html',
    '../../lib/ui',
    './stageFileControl'
], function (
    ko,
    html,
    ui,
    StageFileControlComponent
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        b = t('b'),
        input = t('input'),
        table = t('table'),
        colgroup = t('colgroup'),
        col = t('col'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');


    function viewModel(params) {
        var item = ko.observable();
        var subscriptions = ko.kb.SubscriptionManager.make();

        var destinationFileBaseName = ko.observable();
        var destinationFileExtension = ko.observable();
        var isImportable = ko.observable();
        var error = ko.observable();
        var fileName = ko.observable();

        var destinationFileName = ko.pureComputed(function () {
            return destinationFileBaseName() + '.' + destinationFileExtension();
        });
        // var destinationFileName = ko.observable();
        

        var filenameStatus = {
            exists: ko.observable(),
            identical: ko.observable(),
            error: ko.observable(),
            loading: ko.observable()
        };

        destinationFileBaseName.extend({
            rateLimit: {
                timeout: 500,
                method: 'notifyWhenChangesStop'
            }
        });

        var fileDetail;

        subscriptions.add(destinationFileBaseName.subscribe(function (newValue) {

            // Check the basename. These are special conditions for just the base
            // name to give somewhat better error messages for these conditions.
            // The filename check would catch these too, so maybe we can ditch them.
            // if (!newValue || newValue.length === 0) {
            //     filenameStatus.error({
            //         validationError: 'Cannot have empty filename'
            //     });
            //     return;
            // }
            // if (newValue.trim(' ').length === 0) {
            //     filenameStatus.error({
            //         validationError: 'Filename may not consist of just spaces'
            //     });
            //     return;
            // }

            var actualFilename = [newValue, '.',  destinationFileExtension()].join('');

            // detect duplicate filename here, and set status accordingly.
            filenameStatus.loading(true);
            params.checkFilename(actualFilename)
                .then(function (result) {
                    if (result.exists) {
                        if (fileDetail.file.md5sum === result.exists.md5) {
                            filenameStatus.identical(true);
                        } else {
                            filenameStatus.identical(false);
                        }
                        filenameStatus.exists(result.exists);
                        filenameStatus.error(null);
                    } else if (result.error) {
                        filenameStatus.error(result.error);
                    } else {
                        // destinationFileName(actualFilename);
                        filenameStatus.exists(null);
                        filenameStatus.error(null);
                    }                    
                })
                .catch(function (err) {
                    // todo trigger error panel
                    console.error('ERROR', err);
                    filenameStatus.error({
                        exception: err.message
                    });
                    // filenameStatus.error(err.message);
                })
                .finally(function () {
                    filenameStatus.loading(false);
                });
        }));

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

                fileDetail = result;

                destinationFileExtension(result.file.parts.extension);
                destinationFileBaseName(result.file.parts.base);
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
        
        function doOpenJobsMonitor() {
            params.showStageJobViewer();
        }

        var transferJobMonitor = {
            jobId: ko.observable(),
            status: ko.observable(),
            error: ko.observable()
        };

        function doStage() {
            // doStage call is passed in.
            return params.doStage(params.id, destinationFileName())
                // but our reaction to it is not!
                .spread(function (result, error) {
                    if (result) {
                        transferJobMonitor.jobId(result.job_id);
                        transferJobMonitor.status('submitted');                        

                        // TODO: start the monitor!
                    } else {
                        error(error);
                        transferJobMonitor.error(error);
                    }
                });
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            item: item,
            destinationFileBaseName: destinationFileBaseName,
            destinationFileExtension: destinationFileExtension,
            destinationFileName: destinationFileName,
            isImportable: isImportable,
            error: error,
            showDetail: showDetail,
            showDetailClass: showDetailClass,

            onClose: params.onClose,
            doOpenJobsMonitor: doOpenJobsMonitor,

            //  pass through...
            id: params.id,
            fileName: fileName,
            filenameStatus: filenameStatus,
            doStage: doStage,
            transferJobMonitor: transferJobMonitor,
            stageButtonEnabled: stageButtonEnabled,

            dispose: dispose
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
                        },
                        style: {
                            fontFamily: 'monospace',
                            whiteSpace: 'pre'
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

    // function buildProposedFilename() {
    //     return [
    //         '<!-- ko if: destinationFileName() !== fileName() -->',
    //         div({
    //             style: {
    //                 marginTop: '4px'
    //             }
    //         }, 'New proposed filename: '),
    //         div({
    //             dataBind: {
    //                 text: 'destinationFileName'
    //             },
    //             style: {
    //                 fontFamily: 'monospace',
    //                 fontWeith: 'bold'
    //             }
    //         }),
    //         '<!-- /ko -->'
    //     ];
    // }

    function buildFilenameStatusIndicator() {
        return [
            '<!-- ko ifnot: filenameStatus.loading -->',

            '<!-- ko ifnot: filenameStatus.error -->',
            div([
                span({
                    class: 'fa fa-check',
                    style: {
                        color: 'green'
                    }
                }),
                ' This filename is ok :)'
            ]),
            '<!-- /ko -->',

            '<!-- ko if: filenameStatus.exists -->',
            div({
                class: 'alert alert-warning',
                style: {
                    width: '100%',
                    whiteSpace: 'normal'
                },
                dataBind: {
                    with: 'filenameStatus'
                }
            }, [   
                p({style: {
                    fontWeight: 'bold'
                }}, 'A filename with this name already exists in your staging area.'),
                             
                table({
                    dataBind: {
                        with: 'exists'
                    },
                    class: 'table',
                    style: {
                        backgroundColor: 'transparent',
                        marginTop: '6px'
                    }
                }, [
                    tr([
                        th('Copied'),
                        td({
                            dataBind: {
                                typedText: {
                                    value: 'mtime',
                                    type: '"date"',
                                    format: '"elapsed"'
                                    // format: '"YYYY/MM/DD"'
                                }
                            }
                        })
                    ]),
                    tr([
                        th('Size'),
                        td({
                            dataBind: {
                                typedText: {
                                    value: 'size',
                                    type: '"number"',
                                    format: '"0.0b"'
                                }
                            }
                        })
                    ])
                ]),
                '<!-- ko if: identical -->',
                p([
                    'It is ',
                    b('identical'),
                    ' to the file you are copying, so copying is unnecceary.'
                ]),
                '<!-- /ko -->',
                '<!-- ko ifnot: identical -->',
                p([
                    'It is ',
                    b('different'), 
                    ' than the one you are copying.'
                ]),
                '<!-- /ko -->',
                // p('You may still copy this file to your Staging Area, but it will overwrite the existing file.'),
                p('You may change the filename above to create a unique filename.')
            ]),
            '<!-- /ko -->',

            '<!-- ko if: filenameStatus.error -->',
            div({
                class: 'alert alert-danger',
                style: {
                    width: '100%',
                    whiteSpace: 'normal'
                },
                dataBind: {
                    with: 'filenameStatus.error'
                }
            }, [
                '<!-- ko if: $data.validationError -->',
                p({
                    dataBind: {
                        text: '$data.validationError'
                    }
                }),
                '<!-- /ko -->',

                '<!-- ko if: $data.exception -->',
                p({
                    dataBind: {
                        text: '$data.exception'
                    }
                }),
                '<!-- /ko -->',

                '<!-- ko if: $data.error -->',
                p({
                    dataBind: {
                        text: '$data.error'
                    }
                }),
                '<!-- /ko -->'
               
            ]),
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
                    }, 'Original filename'),
                    td({
                        dataBind: {
                            text: 'fileName'
                        },
                        style: {
                            fontFamily: 'monospace',
                            whiteSpace: 'pre'
                        }
                    })
                ]),
               
                tr([
                    th({
                        scope: 'row'
                    }, 'Edit filename'),
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
                                    flex: '1 1 0px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre'
                                }
                            }),
                            '<!-- ko if: destinationFileExtension -->',
                            '.',
                            div({
                                dataBind: {
                                    text: 'destinationFileExtension'
                                },
                                style: {
                                    flex: '0 0 auto',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre'
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
                       
                        
                    ])
                ]),
                tr([
                    th({
                        scope: 'row'
                    }, 'Destination'),
                    td([
                        div({
                            dataBind: {
                                text: 'destinationFileName'
                            },
                            style: {
                                fontFamily: 'monospace',
                                whiteSpace: 'pre'
                            }
                        }),
                        div({
                        }, [
                            buildFilenameStatusIndicator()
                            // buildProposedilename()                            
                        ])
                    ])
                ]),
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
                                name: StageFileControlComponent.quotedName(),
                                params: {
                                    id: 'id',
                                    fileName: 'destinationFileName',
                                    doStage: 'doStage',
                                    transferJobMonitor: 'transferJobMonitor',
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
            // buildDialog(buildTitle(), buildBody()),
            ui.buildDialog({
                title: buildTitle(),
                body: buildBody(),
                buttons: [
                    {
                        label: 'Close & Monitor Jobs',
                        onClick: 'doOpenJobsMonitor'
                    },
                    {
                        label: 'Close',
                        onClick: 'onClose'
                    }
                ]
            })
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