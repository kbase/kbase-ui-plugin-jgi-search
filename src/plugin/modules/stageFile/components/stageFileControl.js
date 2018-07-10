/*
stageFileControl

A subcomponent of the stageFileDialog, provides the button and associated staging
feedback for issuing a request to copy a JAMO file to KBase Staging, and to subsequently
monitor it.
*/
define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_common/html',
    '../../components/stagingStatusIndicator'
], function (
    ko,
    reg,
    gen,
    html,
    StagingStatusIndicatorComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        button = t('button');

    class ViewModel {
        constructor(params) {
            this.stagingStatus = ko.observable();
            this.error = ko.observable();
            this.doStage = params.actions.doStage;
            this.transferJobMonitor = params.transferJobMonitor;
            this.enabled = params.enabled;
        }
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
                gen.ifnot('transferJobMonitor.status()',
                    // Button to request copy to staging
                    // disabled when the transfer is in progress or completed.
                    div({
                        class: 'button-group'
                    }, [
                        button({
                            dataBind: {
                                click: '$component.doStage',
                                disable: 'transferJobMonitor.status() || !enabled()'
                            },
                            class: 'btn btn-primary'
                        }, [
                            span({
                                class: 'fa fa-download fa-rotate-270',
                                style: {
                                    margin: '0 4px 0 0'
                                }
                            }),
                            'Copy File to your Data Staging Area'
                        ])
                    ]))
            ]),
            div({
                style: {
                    width: '50em',
                    margin: '10px auto 20px auto'
                }
            }, [
                gen.if('transferJobMonitor.status()',
                    gen.switch('transferJobMonitor.status()', [
                        [
                            '"completed"',
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
                            ])
                        ],
                        [
                            '"error"',
                            div({
                                style: {
                                    border: '1px red solid',
                                    padding: '10px'
                                }
                            }, [
                                p([
                                    'Error with transfer (no more info!)'
                                ])
                            ])
                        ],
                        [
                            '$default',
                            div({
                                style: {
                                    border: '1px orange solid',
                                    padding: '10px'
                                }
                            }, [
                                p({
                                    style: {
                                        textAlign: 'center'
                                    }
                                }, [
                                    /*
                                        This component just shows the status of the staging job,
                                        given a job status which may be an observable.
                                    */
                                    span({
                                        dataBind: {
                                            component: {
                                                name: StagingStatusIndicatorComponent.quotedName(),
                                                params: {
                                                    status: 'transferJobMonitor.status'
                                                }
                                            }
                                        }
                                    }),
                                    'Transfer is in progress.'
                                ])
                            ])
                        ]
                    ])),
                gen.if('transferJobMonitor.error',
                    div({
                        dataBind: {
                            with: 'transferJobMonitor.error()'
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
                    ])),
            ])
        ]);
    }

    function template() {
        return buildImportForm();
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
