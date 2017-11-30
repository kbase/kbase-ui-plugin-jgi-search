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

    function viewModel(params) {
        function doInspect() {
            params.env.search.showOverlay({
                name: 'jgi-search/inspector',
                // TODO: short this out ... I don't think we need all this
                params: {
                    // id: 'id',
                    // doStage: 'doStage',
                    // transferJob: 'transferJob',
                    // getDetail: 'getDetail'
                },
                viewModel: {
                    // id: params.row.id,
                    // doStage: params.env.search.doStage,
                    // transferJob: params.row.transferJob,
                    // getDetail: params.env.search.getDetail
                }
            });
        }

        return {
            field: params.field,
            row: params.row,
            // wow, after 5 days, this feels janky, but ... whatever ...
            // doCopy: doCopy,
            // doStage: doStage
            doInspect: doInspect
        };
    }

    function template() {
        return  div({
        }, [
            styles.sheet,
            span({
                class: styles.classes.miniButton,
                dataBind: {
                    click: '$component.doInspect',
                    clickBubble: false,
                },
            }, span({
                style: {
                    cursor: 'pointer'
                },
                class: 'fa fa-info'
            }))
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