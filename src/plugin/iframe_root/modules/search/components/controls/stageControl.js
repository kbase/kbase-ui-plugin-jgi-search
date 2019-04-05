/*
stageControl Component
Small control which, when clicked, pops up a dialog allowing the user to attempt
to request a copy of the given JAMO file to KBase Staging.
Will be disabled with special icon if the status of the record indicates that the
file is not importable to kbase.
*/
define([
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    '../../../stageFile/components/stageFileDialog'
], function (
    reg,
    gen,
    html,
    StageFileDialogComponent
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    class ViewModel {
        constructor(params, context) {
            this.row = params.row;
            this.search = params.env.search;
            this.field = params.field;
            this.showOverlay = context.$root.showOverlay;
        }

        doCopy() {
            this.row.doTransfer();
        }

        doShowStage() {
            this.showOverlay({
                name: StageFileDialogComponent.name(),
                // TODO: short this out ... I don't think we need all this
                // params: {
                //     id: 'id',
                //     doStage: 'doStage',
                //     transferJob: 'transferJob',
                //     getDetail: 'getDetail'
                // },
                viewModel: {
                    id: this.row.id,
                    doStage: (...args) => {
                        return this.search.doStage.apply(this.search, args);
                    },
                    transferJob: this.transferJob,
                    getDetail: (...args) => {
                        return this.search.getDetail.apply(this.search, args);
                    },
                    checkFilename: (...args) => {
                        return this.search.checkFilename.apply(this.search, args);
                    },
                    showStageJobViewer: (...args) => {
                        return this.search.showStageJobViewer.apply(this.search, args);
                    }
                }
            });
        }
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
        },
        disabledMiniButton: {
            css: {
                padding: '2px 4px',
                border: '2px transparent solid',
                cursor: 'pointer',
                display: 'inline-block',
                backgroundColor: 'transparent',
                textAlign: 'center',
                color: 'rgba(150,150,150,1)'
            }
        }
    });


    function template() {
        return  div({
        }, gen.if('row.fileType.error',
            span({
                class: styles.classes.disabledMiniButton,
                dataBind: {
                    attr: {
                        title: 'row.stage.fileName + String.fromCharCode(13) + "(" + row.stage.info + ")"'
                    }
                },
            }, span({
                style: {
                    cursor: 'not-allowed',
                    // fontSize: '80%'
                },
                class: 'fa fa-stack fa-lg'
            }, [
                span({
                    class: 'fa fa-download fa-rotate-270 fa-stack-1x'
                }),
                span({
                    class: 'fa fa-times fa-stack-2x',
                    style: {
                        color: 'rgba(100,100,100,0.3)'
                    }
                })
            ])),
            span({
                class: styles.classes.miniButton,
                dataBind: {
                    click: '$component.doShowStage',
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
            }))));
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