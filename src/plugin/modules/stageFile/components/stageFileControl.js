/*
stageFileControl

A subcomponent of the stageFileDialog, provides the button and associated staging
feedback for issuing a request to copy a JAMO file to KBase Staging, and to subsequently
monitor it.
*/
define([
    'knockout-plus',
    'kb_common/html',
    '../../components/stagingStatusIndicator'
], function (
    ko,
    html,
    StagingStatusIndicatorComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        button = t('button');

    function viewModel(params) {
        // var id = params.id;
        // var fileName = params.fileName;

        var stagingStatus = ko.observable();
        var error = ko.observable();
        
        function doStage() {

            // spawn the staging request
            // the search vm takes care of the rest...

            // stagingStatus('requesting');

            // TODO: need to work on the detail item structure!
            params.doStage();
            // todo: reflect simple error status here? 

            // params.doStage(id, fileName())
            //     .then(function (result, error) {
            //         console.log('staged??', result);
            //         if (result) {
            //             // create a transfer job
            //             transferJob(result);
            //             // stagingStatus('sent');
            //         } else {
            //             // stagingStatus('error');
            //             error(error);
            //         }
            //     })
            //     .catch(function (err) {
            //         // stagingStatus('error');

            //         console.error('ERROR', err);
            //         error({
            //             message: err.message,
            //             error: err
            //         });
            //     });
        }

        return {
            doStage: doStage,
            stagingStatus: stagingStatus,
            transferJobMonitor: params.transferJobMonitor,
            error: error,
            enabled: params.enabled
        };
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
                '<!-- ko ifnot: transferJobMonitor.status() -->',
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
                ]),
                '<!-- /ko -->'
                // div({
                //     style: {
                //         textAlign: 'center',
                //         marginTop: '4px'
                //     }
                // }, [

                //     '<!-- ko if: transferJobMonitor.error -->',
                //     div({
                //         dataBind: {
                //             with: 'transferJobMonitor.error'
                //         },
                //         style: {
                //             border: '2px red solid'
                //         }
                //     }, [
                //         div({
                //             dataBind: {
                //                 text: 'message'
                //             }
                //         })
                //     ]),
                //     '<!-- /ko -->'
                // ])
            ]),
            div({
                style: {
                    width: '50em',
                    margin: '10px auto 20px auto'
                }
            }, [
                // show status if we have any...
                '<!-- ko if: transferJobMonitor.status() -->',

                '<!-- ko if: transferJobMonitor.status() !== "completed" -->',
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
                ]),
                '<!-- /ko -->',

                '<!-- ko if: transferJobMonitor.status() == "completed" -->',
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

                '<!-- ko if: transferJobMonitor.status() == "error" -->',
                div({
                    style: {
                        border: '1px red solid',
                        padding: '10px'
                    }
                }, [
                    p([
                        'Error with transfer (no more info!)'
                    ])
                ]),
                '<!-- /ko -->',

                '<!-- /ko -->',

                '<!-- ko if: transferJobMonitor.error -->',
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
                ]),
                '<!-- /ko -->'
            ])
        ]);
    }

    function template() {
        return buildImportForm();
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});
