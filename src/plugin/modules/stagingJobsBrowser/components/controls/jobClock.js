define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_common/html'
], function (
    ko,
    reg,
    gen,
    html
) {
    'use strict';
    const t = html.tag,
        span = t('span'),
        div = t('div');

    const unwrap = ko.utils.unwrapObservable;

    class ViewModel {
        constructor(params) {
            this.startTime = unwrap(params.row.started.value);
            this.status = params.row.status.value;
            this.elapsed = unwrap(params.row.elapsed.value);

            this.showCurrentElapsed = ko.pureComputed(() => {
                switch (unwrap(status)) {
                case 'completed':
                case 'error':
                case 'notfound':
                    return false;
                default:
                    return true;
                }
            });
        }
    }

    function template() {
        return div(gen.if('showCurrentElapsed',
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
            span({
                dataBind: {
                    typedText: {
                        type: '"date"',
                        format: '"duration"',
                        value: 'elapsed'
                    }
                }
            })));
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});