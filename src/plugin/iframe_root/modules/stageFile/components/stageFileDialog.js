/*
stageFileDialog

*/
define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/html',
    'kb_lib/htmlBuilders',
    '../../lib/model',
    '../../lib/appViewModel',
    '../../lib/ui',
    './stageFileControl',
    '../../components/stagingStatusViewer'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    htmlBuilders,
    Model,
    AppViewModel,
    ui,
    StageFileControlComponent,
    StagingStatusViewerComponent
) {
    'use strict';

    const t = html.tag,
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

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.parent = context.$parent;
            this.runtime = context.$root.runtime;
            this.showOverlay = context.$root.showOverlay;

            this.onClose = () => {
                this.parent.bus.send('close');
            };

            this.item = ko.observable();

            this.id = params.id;

            this.model = new Model({
                runtime: this.runtime
            });

            this.appViewModel = new AppViewModel({
                runtime: this.runtime
            });

            this.destinationFileBaseName = ko.observable();
            this.destinationFileExtension = ko.observable();
            this.isImportable = ko.observable();
            this.error = ko.observable();
            this.fileName = ko.observable();

            this.destinationFileName = ko.pureComputed(() => {
                return this.destinationFileBaseName() + '.' + this.destinationFileExtension();
            });

            this.filenameStatus = {
                exists: ko.observable(),
                identical: ko.observable(),
                error: ko.observable(),
                loading: ko.observable()
            };

            this.destinationFileBaseName.extend({
                rateLimit: {
                    timeout: 500,
                    method: 'notifyWhenChangesStop'
                }
            });

            this.fileDetail;

            this.stageButtonEnabled = ko.pureComputed(() => {
                if (this.filenameStatus.error()) {
                    return false;
                }
                if (this.filenameStatus.loading()) {
                    return false;
                }
                return true;
            });

            // SUBSCRIPTIONS
            this.subscribe(this.destinationFileBaseName, (newValue) => {

                // Validate the filename
                const noSpacesRegex = /\s/;
                if (noSpacesRegex.test(newValue)) {
                    this.filenameStatus.error({
                        exception: 'File name may not contain spaces'
                    });
                    return;
                }

                const windowsReservedCharacters = /[<>:"/\\|?*\]^]/;
                if (windowsReservedCharacters.test(newValue)) {
                    this.filenameStatus.error({
                        exception: 'File name may not contain the characters <>:"/\\|?*]'
                    });
                    return;
                }

                const noInitialDot = /^\./;
                if (noInitialDot.test(newValue)) {
                    this.filenameStatus.error({
                        exception: 'File name may not begin with a .'
                    });
                    return;
                }


                var actualFilename = [newValue, '.', this.destinationFileExtension()].join('');

                // detect duplicate filename here, and set status accordingly.
                this.filenameStatus.loading(true);
                this.model
                    .checkFilename(actualFilename)
                    .then((result) => {
                        if (result.exists) {
                            if (this.fileDetail.file.md5sum === result.exists.md5) {
                                this.filenameStatus.identical(true);
                            } else {
                                this.filenameStatus.identical(false);
                            }
                            this.filenameStatus.exists(result.exists);
                            this.filenameStatus.error(null);
                        } else if (result.error) {
                            this.filenameStatus.error(result.error);
                        } else {
                            this.filenameStatus.exists(null);
                            this.filenameStatus.error(null);
                        }
                    })
                    .catch((err) => {
                        // todo trigger error panel
                        console.error('ERROR', err);
                        this.filenameStatus.error({
                            exception: err.message
                        });
                    })
                    .finally(() => {
                        this.filenameStatus.loading(false);
                    });
            });

            // MAIN +++
            this.appViewModel.getDetail(params.id).then((result) => {
                this.item(result);

                this.fileDetail = result;

                this.destinationFileExtension(result.file.parts.extension);
                this.destinationFileBaseName(result.file.parts.base);
                this.fileName(result.file.parts.name);

                if (result.file.typing.error) {
                    this.isImportable(false);
                    this.error(result.file.typing.error);
                } else {
                    this.isImportable(true);
                }
            });

            this.showDetail = ko.observable(false);

            this.showDetailClass = ko.pureComputed(() => {
                if (this.showDetail()) {
                    return styles.classes.textin;
                }
                return styles.classes.textout;
            });

            this.transferJobMonitor = {
                jobMonitoringId: ko.observable(),
                jobId: ko.observable(),
                status: ko.observable(),
                error: ko.observable()
            };

            this.monitorTimerId = null;

            this.actions = {
                doStage: () => {
                    this.doStage();
                }
            };
        }

        doOpenJobsMonitor() {
            this.showOverlay({
                name: StagingStatusViewerComponent.name(),
                viewModel: {
                    runtime: this.runtime
                }
            });
        }

        checkTransferStatus() {
            if (this.monitorTimerId) {
                return;
            }
            var param = {
                job_monitoring_id: this.transferJobMonitor.jobMonitoringId(),
                job_id: this.transferJobMonitor.jobId()
            };
            return this.model.getStageStatus(param).then((stageStatus) => {
                this.transferJobMonitor.status(stageStatus.status);
                if (['error', 'completed'].includes(stageStatus.status)) {
                    return;
                }
                this.monitorTimerId = window.setTimeout(() => {
                    this.monitorTimerId = null;
                    this.checkTransferStatus();
                }, 1000);
            });
        }

        doStage() {
            return (
                this.model
                    .stageFile(this.id, this.destinationFileName())
                    // but our reaction to it is not!
                    .spread((result, error) => {
                        if (result) {
                            this.transferJobMonitor.jobMonitoringId(result.job_monitoring_id);
                            this.transferJobMonitor.jobId(result.job_id);
                            this.transferJobMonitor.status('submitted');

                            // TODO: start the monitor!
                            this.checkTransferStatus();
                        } else {
                            this.error(error);
                            this.transferJobMonitor.error(error);
                        }
                    })
            );
        }

        // return {
        //     item: item,
        //     destinationFileBaseName: destinationFileBaseName,
        //     destinationFileExtension: destinationFileExtension,
        //     destinationFileName: destinationFileName,
        //     isImportable: isImportable,
        //     error: error,
        //     showDetail: showDetail,
        //     showDetailClass: showDetailClass,

        //     onClose: params.onClose,
        //     doOpenJobsMonitor: doOpenJobsMonitor,

        //     //  pass through...
        //     id: params.id,
        //     fileName: fileName,
        //     filenameStatus: filenameStatus,
        //     doStage: doStage,
        //     transferJobMonitor: transferJobMonitor,
        //     stageButtonEnabled: stageButtonEnabled,

        //     dispose: dispose
        // };
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
                }
            },
            textout: {
                css: {
                    animationDuration: '0.5s',
                    animationName: 'disappear',
                    animationIterationCount: '1',
                    animationDirection: 'normal',
                    opacity: '0',
                    height: '0px'
                }
            }
        },
        rules: {
            keyframes: {
                appear: {
                    from: {
                        height: '0px',
                        opacity: '0'
                    },
                    to: {
                        height: 'auto',
                        opacity: '1'
                    }
                },
                disappear: {
                    from: {
                        height: 'auto',
                        opacity: '1'
                    },
                    to: {
                        height: '0px',
                        opactiy: '0'
                    }
                }
            }
        }
    });

    function buildSourceFileInfo() {
        return div(
            gen.if(
                'item',
                gen.with(
                    'item',
                    table(
                        {
                            class: 'table',
                            dataBind: {
                                with: 'file'
                            }
                        },
                        [
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
                                th(
                                    {
                                        scope: 'row'
                                    },
                                    'Filename'
                                ),
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
                                th(
                                    {
                                        scope: 'row'
                                    },
                                    'Data type'
                                ),
                                td({
                                    dataBind: {
                                        text: 'dataType'
                                    }
                                })
                            ]),
                            tr([
                                th(
                                    {
                                        scope: 'row'
                                    },
                                    'Encoding'
                                ),
                                td({
                                    dataBind: {
                                        text: 'encoding ? encoding : "-"'
                                    }
                                })
                            ]),
                            tr([
                                th(
                                    {
                                        scope: 'row'
                                    },
                                    'Size'
                                ),
                                td({
                                    dataBind: {
                                        text: 'size'
                                    }
                                })
                            ]),
                            tr([
                                th(
                                    {
                                        scope: 'row'
                                    },
                                    'Date added'
                                ),
                                td({
                                    dataBind: {
                                        text: 'added'
                                    }
                                })
                            ])
                        ]
                    )
                ),
                htmlBuilders.loading()
            )
        );
    }

    function buildFilenameExists() {
        return div(
            {
                class: 'alert alert-warning',
                style: {
                    width: '100%',
                    whiteSpace: 'normal'
                },
                dataBind: {
                    with: 'filenameStatus'
                }
            },
            [
                p(
                    {
                        style: {
                            fontWeight: 'bold'
                        }
                    },
                    'A filename with this name already exists in your staging area.'
                ),

                table(
                    {
                        dataBind: {
                            with: 'exists'
                        },
                        class: 'table',
                        style: {
                            backgroundColor: 'transparent',
                            marginTop: '6px'
                        }
                    },
                    [
                        tr([
                            th('Copied'),
                            td({
                                dataBind: {
                                    typedText: {
                                        value: 'mtime',
                                        type: '"date"',
                                        format: '"elapsed"'
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
                    ]
                ),
                gen.if(
                    'identical',
                    p(['It is ', b('identical'), ' to the file you are copying, so copying is unnecessary.']),
                    p(['It is ', b('different'), ' than the one you are copying.'])
                ),
                p('You may change the filename above to create a unique filename.')
            ]
        );
    }

    function buildFilenameStatusIndicator() {
        return gen.if(
            'filenameStatus.loading',
            span({
                class: 'fa fa-spinner fa-pulse'
            }),
            [
                gen.if('filenameStatus.exists', buildFilenameExists()),

                gen.if(
                    'filenameStatus.error',
                    div(
                        {
                            class: 'alert alert-danger',
                            style: {
                                width: '100%',
                                whiteSpace: 'normal'
                            },
                            dataBind: {
                                with: 'filenameStatus.error'
                            }
                        },
                        [
                            gen.if(
                                '$data.validationError',
                                p({
                                    dataBind: {
                                        text: '$data.validationError'
                                    }
                                })
                            ),

                            gen.if(
                                '$data.exception',
                                p({
                                    dataBind: {
                                        text: '$data.exception'
                                    }
                                })
                            ),

                            gen.if(
                                '$data.error',
                                p({
                                    dataBind: {
                                        text: '$data.error'
                                    }
                                })
                            )
                        ]
                    ),
                    div([
                        span({
                            class: 'fa fa-check',
                            style: {
                                color: 'green'
                            }
                        }),
                        ' This filename is ok :)'
                    ])
                )
            ]
        );
    }

    function buildDestinationFileTable() {
        return div({}, [
            table(
                {
                    class: 'table form'
                },
                [
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
                        th(
                            {
                                scope: 'row'
                            },
                            'Original filename'
                        ),
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
                        th(
                            {
                                scope: 'row'
                            },
                            'Edit filename'
                        ),
                        td(
                            {
                                style: {
                                    width: '60%',
                                    // any max-width < the actual width it may be
                                    // seems okay, need to test.
                                    maxWidth: '10px',
                                    whiteSpace: 'nowrap',
                                    overflowX: 'auto',
                                    textOverflow: 'ellipsis'
                                }
                            },
                            [
                                div(
                                    {
                                        style: {
                                            display: 'flex',
                                            flexDirection: 'row',
                                            width: '100%',
                                            alignItems: 'baseline'
                                        }
                                    },
                                    [
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
                                        gen.if(
                                            'destinationFileExtension',
                                            [
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
                                                })
                                            ],
                                            div(
                                                {
                                                    style: {
                                                        fontStyle: 'italic',
                                                        flex: 'o o auto'
                                                    }
                                                },
                                                'n/a'
                                            )
                                        )
                                    ]
                                )
                            ]
                        )
                    ]),
                    tr([
                        th(
                            {
                                scope: 'row'
                            },
                            'Destination'
                        ),
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
                            div({}, buildFilenameStatusIndicator())
                        ])
                    ])
                ]
            )
        ]);
    }

    function buildDestinationFileInfo() {
        return div(
            gen.if(
                'item',
                gen.if(
                    'isImportable',
                    buildDestinationFileTable(),
                    div(
                        {
                            style: {
                                color: 'red'
                            }
                        },
                        [
                            p('sorry, not importable'),
                            p({
                                dataBind: {
                                    text: 'error().message'
                                }
                            })
                        ]
                    )
                ),
                htmlBuilders.loading()
            )
        );
    }

    function buildImportView() {
        return div(
            {
                class: 'container-fluid'
            },
            [
                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [
                                span(
                                    {
                                        style: {
                                            fontWeight: 'bold',
                                            fontSize: '120%',
                                            marginRight: '4px'
                                        }
                                    },
                                    'Source - JGI'
                                )
                            ]
                        ),
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [
                                span(
                                    {
                                        style: {
                                            fontWeight: 'bold',
                                            fontSize: '120%',
                                            marginRight: '4px'
                                        }
                                    },
                                    'Destination - KBase'
                                )
                            ]
                        )
                    ]
                ),

                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [
                                p(
                                    {
                                        dataBind: {
                                            css: 'showDetailClass'
                                        },
                                        style: {
                                            overflowY: 'hidden'
                                        }
                                    },
                                    [
                                        'The file is stored at the JGI Archive and Metadata Organizer (JAMO) and ',
                                        'may be copied into your KBase File Staging Area.'
                                    ]
                                )
                            ]
                        ),
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [
                                p(
                                    {
                                        dataBind: {
                                            css: 'showDetailClass'
                                        }
                                    },
                                    [
                                        'The JGI JAMO file will be copied into your KBase Staging Area ',
                                        'from where it may be imported into one or more KBase Narratives for ',
                                        'further analysis and inspection.'
                                    ]
                                )
                            ]
                        )
                    ]
                ),
                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [buildSourceFileInfo()]
                        ),
                        div(
                            {
                                class: 'col-md-6'
                            },
                            [buildDestinationFileInfo()]
                        )
                    ]
                ),
                div(
                    {
                        class: 'row'
                    },
                    [
                        div(
                            {
                                class: 'col-md-12'
                            },
                            [
                                div({
                                    dataBind: {
                                        component: {
                                            name: StageFileControlComponent.quotedName(),
                                            params: {
                                                id: 'id',
                                                fileName: 'destinationFileName',
                                                transferJobMonitor: 'transferJobMonitor',
                                                enabled: 'stageButtonEnabled',
                                                actions: 'actions'
                                            }
                                        }
                                    }
                                })
                            ]
                        )
                    ]
                )
            ]
        );
    }

    function buildBody() {
        return div([
            p(['Copy a file from JGI JAMO to your KBase Staging Area.']),
            p(
                {
                    dataBind: {
                        css: 'showDetailClass'
                    }
                },
                [
                    'Copying a file from JGI JAMO into your Staging area may take anywhere from a few seconds to ',
                    'several minutes. If the file is not readily available on disk at JAMO, it will be fetched from ',
                    'the tape archive, a process which may take several minutes by itself. In addition, large files will ',
                    'take longer than smaller ones, due both to retrieval of the data from tape to disk, and then ',
                    'copying over the network to your KBase Staging area.'
                ]
            ),
            buildImportView()
        ]);
    }

    function buildTitle() {
        return div([
            'Copy File to Staging',
            span(
                {
                    style: {
                        float: 'right',
                        fontSize: '80%',
                        paddingTop: '8px',
                        marginRight: '40px'
                    }
                },
                [
                    'Show details? ',
                    input({
                        type: 'checkbox',
                        dataBind: {
                            checked: 'showDetail'
                        }
                    })
                ]
            )
        ]);
    }

    function template() {
        return div([
            ui.buildDialog({
                title: buildTitle(),
                body: buildBody(),
                buttons: [
                    {
                        label: 'Close and View Jobs',
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
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});
