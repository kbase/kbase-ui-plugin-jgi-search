define([
    'knockout',
    'kb_common/html'
], function(
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {}

    function template() {
        return tr([
            th('Score'),
            th('Title'),
            th('Date'),
            th('File type')
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    ko.components.register('jgisearch/search-header', component());
});