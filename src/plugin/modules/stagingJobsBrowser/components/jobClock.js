define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        span = t('span'),
        div = t('div');
    var unwrap = ko.utils.unwrapObservable;

    function viewModel(params) {
        var startTime = unwrap(params.row.started.value);
        // var statusTime = unwrap(params.row.updated.value);
        var status = params.row.status.value;
        // var statusElapsed = statusTime - startTime;
        var elapsed = unwrap(params.row.elapsed.value);

        var showCurrentElapsed = ko.pureComputed(function () {
            switch (unwrap(status)) {
            case 'completed':
            case 'error':
                return false;
            default:
                return true;
            }
        });

        return {
            startTime: startTime,
            showCurrentElapsed: showCurrentElapsed,
            status: status,
            elapsed: elapsed
        };
    }

    function template() {
        return div([
            '<!-- ko if: showCurrentElapsed -->',
            span({
                dataBind: {
                    component: {
                        name: '"generic/elapsed-clock"',
                        params: {
                            startTime: 'startTime'
                        }
                    }
                }
            }),
            '<!-- /ko -->',
            '<!-- ko ifnot: showCurrentElapsed -->',
            span({
                dataBind: {
                    typedText: {
                        type: '"date"',
                        format: '"duration"',
                        value: 'elapsed'
                    }
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

    return component;
});