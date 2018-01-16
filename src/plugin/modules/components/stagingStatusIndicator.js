define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span');

    function viewModel(params) {
        return {
            status: params.status,
            verbose: params.verbose || false
        };
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
            '<!-- ko switch: status -->',
            
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
            }, buildSpinner()),
            '<!-- /ko -->',

            '<!-- ko case: "submitted" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'black'
                },
                title: 'File transfer request has been recevied'
            }, buildSpinner()),
            '<!-- /ko -->',


            '<!-- ko case: "queued" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'orange'
                },
                title: 'File transfer request has been queued'
            }, buildSpinner()),
            '<!-- /ko -->',

            '<!-- ko case: "restoring" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'blue'
                },
                title: 'Restoring the file from JAMO archive'
            }, buildSpinner()),
            '<!-- /ko -->',

            '<!-- ko case: "copying" -->',
            span({
                style: {
                    fontSize: '80%',
                    color: 'green'
                },
                title: 'Copying the file to your staging area'
            }, buildSpinner()),
            '<!-- /ko -->',

            '<!-- ko case: "$default" -->',
            span({
                // class: 'fa fa-question-circle',
                style: {
                    color: 'red'
                },
                dataBind: {
                    text: 'status'
                }
            }),
            '<!-- /ko -->',

            '<!-- /ko -->',
            '<!-- ko if: verbose -->',
            span({
                dataBind: {
                    text: 'status'
                },
                style: {
                    marginLeft: '4px'
                }
            }),
            '<!-- /ko -->'
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});