define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        a = t('a');

    function viewModel(params) {
        function doCopy(data) {
            params.row.doTransfer();
        }

        return {
            field: params.field,
            row: params.row,
            doCopy: doCopy
        };
    }

    function template() {
        return  span([
            '<!-- ko ifnot: row.transferJob() -->',
            a({
                dataBind: {
                    click: '$component.doCopy', // 'function () {column.action.fn(row);}',
                    clickBubble: false,
                    // attr: {
                    //     title: 'row[column.name].info'
                    // }
                },
                style: {
                    cursor: 'pointer'
                },
                class: 'fa fa-download fa-rotate-270'
            }),
            '<!-- /ko -->',
            '<!-- ko if: row.transferJob() -->',


            '<!-- ko switch: row.transferJob().status -->',
            
            '<!-- ko case: "complete" -->',
            span({
                class: 'fa fa-check',
                style: {
                    color: 'green'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko case: "error" -->',
            span({
                class: 'fa fa-times',
                style: {
                    color: 'red'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko case: $default -->',
            span({
                style: {
                    fontSize: '80%',
                }
            }, html.loading()),
            '<!-- /ko -->',

            '<!-- /ko -->',


            '<!-- /ko -->',
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