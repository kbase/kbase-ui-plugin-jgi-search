define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span');

    function viewModel(params) {
        return {
            transferJob: params.transferJob
        };
    }

    function template() {
        return  span({
        }, [
            '<!-- ko if: transferJob -->',

            '<!-- ko switch: transferJob.status -->',
            
            '<!-- ko case: "completed" -->',
            span({
                class: 'fa fa-check',
                style: {
                    color: 'green'
                },
                title: 'File transfer request has been successfully copied to your staging area'
            }),
            '<!-- /ko -->',

            '<!-- ko case: "error" -->',
            span({
                class: 'fa fa-times',
                style: {
                    color: 'red'
                },
                title: 'An error was encountered transferring the file to your staging area'
            }),
            '<!-- /ko -->',


            '<!-- ko case: "sent" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'gray'
                },
                title: 'File transfer request has been sent'
            }, html.loading()),
            '<!-- /ko -->',


            '<!-- ko case: "queued" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'orange'
                },
                title: 'File transfer request has been queued'
            }, html.loading()),
            '<!-- /ko -->',

            '<!-- ko case: "restoring" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'blue'
                },
                title: 'Restoring the file from JAMO archive'
            }, html.loading()),
            '<!-- /ko -->',

            '<!-- ko case: "copying" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'green'
                },
                title: 'Copying the file to your staging area'
            }, html.loading()),
            '<!-- /ko -->',

            '<!-- ko case: "$default" -->',
            span({
                // class: 'fa fa-question-circle',
                style: {
                    color: 'red'
                },
                dataBind: {
                    text: 'transferJob.status()'
                }
            }),
            '<!-- /ko -->',

            '<!-- /ko -->',

            '<!-- /ko -->',
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