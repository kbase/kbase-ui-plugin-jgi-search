define([
    'knockout',
    'kb_knockout/registry',
    'kb_common/html'
], function (
    ko,
    reg,
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
        }
    }

    function template() {
        return div([
            span({
                dataBind: {
                    component: {
                        name: '"generic/relative-clock"',
                        params: {
                            startTime: 'startTime'
                        }
                    }
                }
            })
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