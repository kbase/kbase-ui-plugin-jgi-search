define([
    'kb_common/html',
    '../utils'
], function (
    html,
    utils
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        function doCopy() {
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
        }, [
            '<!-- ko ifnot: row.transferJob() -->',
            span({
                class: 'mini-button'
            }, span({
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

            utils.komponent({
                name: 'jgi-search/copy-status-indicator',
                params: {
                    transferJob: 'row.transferJob()'
                }
            }),
            
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