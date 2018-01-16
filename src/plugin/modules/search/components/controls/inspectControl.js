define([
    'knockout-plus',
    'kb_common/html',
    '../../../components/inspector'
], function (
    ko,
    html,
    InspectorComponent
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
                name: InspectorComponent.name(),
                // TODO: short this out ... I don't think we need all this
                viewModel: {
                    item: params.row,
                    getDetail: params.env.search.getDetail
                }
            });
        }

        return {
            field: params.field,
            row: params.row,
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

    return ko.kb.registerComponent(component);
});