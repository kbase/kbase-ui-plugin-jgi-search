define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_common/html',
    'kb_knockout/components/elapsedClock'
], function (
    ko,
    reg,
    gen,
    html,
    ElapsedClockComponent
) {
    'use strict';
    const t = html.tag,
        span = t('span'),
        div = t('div');

    const unwrap = ko.utils.unwrapObservable;

    class ViewModel {
        constructor(params) {
            this.startTime = unwrap(params.row.started.value);
            this.endTime = params.row.updated.value;
            this.status = params.row.status.value;
            this.elapsed = unwrap(params.row.elapsed.value);

            this.showCurrentElapsed = ko.pureComputed(() => {
                switch (unwrap(this.status)) {
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
        return div(gen.if('showCurrentElapsed()',
            span({
                dataBind: {
                    component: {
                        name: ElapsedClockComponent.quotedName(),
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