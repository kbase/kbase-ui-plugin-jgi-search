define([
    'knockout-plus',
    'kb_common/html',
    '../lib/ui'
], function (
    ko,
    html,
    ui
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function viewModel(params) {
        return {
            onClose: params.onClose
        };
    }

    function template() {
        return ui.buildDialog('Inspector', 'Search result inspector is currently disabled');
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});