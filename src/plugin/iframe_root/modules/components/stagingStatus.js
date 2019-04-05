define(['knockout', 'kb_knockout/registry', 'kb_lib/html'], function (ko, reg, html) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        return {
            status: params.status
        };
    }

    function template() {
        return div([
            '<!-- ko if: status() !== "completed" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'orange'
                    }
                }),
                span({
                    dataBind: {
                        text: 'status()'
                    },
                    style: {
                        marginLeft: '4px'
                    }
                })
            ]),
            '<!-- /ko -->',

            '<!-- ko if: status() == "completed" -->',
            div([
                span({
                    class: 'fa fa-check',
                    style: {
                        color: 'green'
                    }
                }),
                span(
                    {
                        style: {
                            marginLeft: '4px'
                        }
                    },
                    'Transfer complete!'
                )
            ]),
            '<!-- /ko -->'
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
