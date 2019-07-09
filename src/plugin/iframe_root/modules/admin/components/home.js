define(['kb_knockout/registry', 'kb_lib/html'], function (reg, html) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        ul = t('ul'),
        li = t('li');

    function viewModel() {
        return {};
    }

    function buildLayout() {
        return div([
            p('Hi, this is the jgi search admin tool.'),
            p('This specific version is quite crude.'),
            p('Some things we might want to see:'),
            ul([
                li('The number of users who have used jgi search'),
                li('The search history of all or some users'),
                li('Summary of search terms used (in history)')
            ])
        ]);
    }

    function template() {
        return buildLayout();
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
