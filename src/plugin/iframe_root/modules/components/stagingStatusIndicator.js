define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html'
], function (
    ko,
    reg,
    gen,
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span');

    class ViewModel {
        constructor(params) {
            this.status = params.status;
            this.verbose = params.verbose || false;
        }
    }

    function buildSpinner() {
        return span({
            style: {
                fontSize: '130%'
            }
        }, span({
            class: 'fa fa-spinner fa-pulse fa-fw'
        }));
    }

    function template() {
        return  span({
        }, [
            gen.switch('status', [[
                '"completed"',
                span({
                    class: 'fa fa-check',
                    style: {
                        color: 'green'
                    },
                    title: 'File transfer request has been successfully copied to your staging area'
                })
            ], [
                '"error"',
                span({
                    class: 'fa fa-times',
                    style: {
                        color: 'red'
                    },
                    title: 'An error was encountered transferring the file to your staging area'
                })
            ], [
                '"sent"',
                span({
                    style: {
                        fontSize: '80%',
                        color: 'gray'
                    },
                    title: 'File transfer request has been sent'
                }, buildSpinner())
            ], [
                '"submitted"',
                span({
                    style: {
                        fontSize: '80%',
                        color: 'black'
                    },
                    title: 'File transfer request has been recevied'
                }, buildSpinner())
            ], [
                '"queued"',
                span({
                    style: {
                        fontSize: '80%',
                        color: 'orange'
                    },
                    title: 'File transfer request has been queued'
                }, buildSpinner())
            ], [
                '"restoring"',
                span({
                    style: {
                        fontSize: '80%',
                        color: 'blue'
                    },
                    title: 'Restoring the file from JAMO archive'
                }, buildSpinner())
            ], [
                '"copying"',
                span({
                    style: {
                        fontSize: '80%',
                        color: 'green'
                    },
                    title: 'Copying the file to your staging area'
                }, buildSpinner())
            ], [
                '$default',
                span({
                    // class: 'fa fa-question-circle',
                    style: {
                        color: 'red'
                    },
                    dataBind: {
                        text: 'status'
                    }
                })
            ]
            ]),
            gen.if('verbose',
                span({
                    dataBind: {
                        text: 'status'
                    },
                    style: {
                        marginLeft: '4px'
                    }
                }))
        ]);
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});