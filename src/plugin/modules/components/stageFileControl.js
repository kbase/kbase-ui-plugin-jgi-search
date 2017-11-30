define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        button = t('button');

    function viewModel(params) {
        console.log('inside stage file control!', params);
        var id = params.id;
        var fileName = params.fileName;
        var transferJob = params.transferJob;

        var stagingStatus = ko.observable();
        var error = ko.observable();
        
        function doStage() {

            // spawn the staging request
            // the search vm takes care of the rest...

            // stagingStatus('requesting');

            // TODO: need to work on the detail item structure!

            params.doStage(id, fileName)
                .then(function (result) {
                    if ('jobId' in result) {
                        transferJob(result);
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

        return {
            doStage: doStage,
            stagingStatus: stagingStatus,
            transferJob: transferJob,
            error: error
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
                    div({
                        dataBind: {
                            component: {
                                name: '"jgi-search/staging-status-indicator"',
                                params: {
                                    status: 'transferJob().status'
                                }
                            }
                        }
                    }),
    
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

    function template() {
        return buildImportForm();
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});
