define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div'),
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
        return  div({
            // style: {
            //     flex: '1 1 0px',
            //     display: 'flex',
            //     flexDirection: 'column'
            // }
        }, [
            '<!-- ko ifnot: row.transferJob() -->',
            span({
                class: 'mini-button'
            }, a({
                dataBind: {
                    click: '$component.doCopy', // 'function () {column.action.fn(row);}',
                    clickBubble: false,
                    attr: {
                        // Note: using character 13 below because knockout has a problem with
                        // embedded \n.
                        title: 'row.stage.fileName + String.fromCharCode(13) + "(" + row.stage.info + ")"'
                    }
                },
                style: {
                    cursor: 'pointer'
                },
                class: 'fa fa-download fa-rotate-270'
            })),
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