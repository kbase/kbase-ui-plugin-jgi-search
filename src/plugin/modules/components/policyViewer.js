define([
    'knockout-plus',
    'kb_common/html'
], function(
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        button = t('button');

    function viewModel(params) {
        var policy = params.policy;

        return {
            policy: policy
        };
    }

    function template() {
        return div({
            class: 'component-policy-viewer'
        }, [
            div({
                dataBind: {
                    html: 'policy'
                },
                style: {
                    maxHeight: '30em',
                    overflowY: 'auto',
                    padding: '4px',
                    border: '1px silver solid'
                }
            })
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('policy-viewer', component());
});