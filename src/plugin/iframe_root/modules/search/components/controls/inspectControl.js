define([
    'kb_knockout/registry',
    'kb_lib/html',
    '../../../components/inspector'
], function (
    reg,
    html,
    InspectorComponent
) {
    'use strict';

    const t = html.tag,
        span = t('span'),
        div = t('div');

    const styles = html.makeStyles({
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

    class ViewModel {
        constructor(params, context) {
            this.search = params.env.search;
            this.field = params.field;
            this.row = params.row;
            this.showOverlay = context.$root.showOverlay;
        }

        doInspect() {
            this.showOverlay({
                name: InspectorComponent.name(),
                // TODO: short this out ... I don't think we need all this
                viewModel: {
                    item: this.row,
                    getDetail: (...args) => {
                        return this.search.getDetail.apply(this.search, args);
                    }
                }
            });
        }
    }

    function template() {
        return  div({
        }, [
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
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});