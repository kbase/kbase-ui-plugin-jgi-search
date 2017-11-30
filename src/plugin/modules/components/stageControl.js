define([
    'kb_common/html',
    '../lib/utils'
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

        function doStage() {
            params.env.search.showOverlay({
                name: 'jgi-search/stage-file',
                // TODO: short this out ... I don't think we need all this
                params: {
                    id: 'id',
                    doStage: 'doStage',
                    transferJob: 'transferJob',
                    getDetail: 'getDetail'
                },
                viewModel: {
                    id: params.row.id,
                    doStage: params.env.search.doStage,
                    transferJob: params.row.transferJob,
                    getDetail: params.env.search.getDetail
                }
            });
        }

        return {
            field: params.field,
            row: params.row,
            // wow, after 5 days, this feels janky, but ... whatever ...
            doCopy: doCopy,
            doStage: doStage
        };
    }

    var styles = html.makeStyles({
        miniButton: {
            css: {
                padding: '2px 4px',
                border: '2px transparent solid',
                cursor: 'pointer',
                display: 'inline-block',
                backgroundColor: 'transparent',
                textAlign: 'center'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'rgb(211, 211, 211)',
                    border: '2px gray solid'
                },
                active: {
                    border: '2px gray solid',
                    backgroundColor: '#555',
                    color: '#FFF'
                }
            }
        }
    });


    function template() {
        return  div({
        }, [
            styles.sheet,
            '<!-- ko ifnot: row.transferJob() -->',
            span({
                class: styles.classes.miniButton,
                dataBind: {
                    click: '$component.doStage', 
                    clickBubble: false,
                    attr: {
                        // Note: using character 13 below because knockout has a problem with
                        // embedded \n.
                        title: 'row.stage.fileName + String.fromCharCode(13) + "(" + row.stage.info + ")"'
                    }
                },
            }, span({
                style: {
                    cursor: 'pointer'
                },
                class: 'fa fa-download fa-rotate-270'
            })),
            '<!-- /ko -->',

            '<!-- ko if: row.transferJob() -->',
            utils.komponent({
                name: 'jgi-search/staging-status-indicator',
                params: {
                    status: 'row.transferJob().status'
                }
            }),
            '<!-- /ko -->'
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