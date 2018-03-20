/*
stageControl Component
Small control which, when clicked, pops up a dialog allowing the user to attempt
to request a copy of the given JAMO file to KBase Staging.
Will be disabled with special icon if the status of the record indicates that the
file is not importable to kbase.
*/
define([
    'knockout-plus',
    'kb_common/html',
    '../../../stageFile/components/stageFileDialog'
], function (
    ko,
    html,
    StageFileDialogComponent
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
                name: StageFileDialogComponent.name(),
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
                    getDetail: params.env.search.getDetail,
                    checkFilename: params.env.search.checkFilename,
                    showStageJobViewer: params.env.search.showStageJobViewer
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
        }, [
            '<!-- ko if: row.fileType.error -->', 
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
            '<!-- /ko -->',

            '<!-- ko ifnot: row.fileType.error -->', 

            // '<!-- ko ifnot: row.transferJob() -->',
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
            // '<!-- /ko -->',

            // '<!-- ko if: row.transferJob() -->',
            // utils.komponent({
            //     name: 'jgi-search/staging-status-indicator',
            //     params: {
            //         status: 'row.transferJob().status'
            //     }
            // }),
            // '<!-- /ko -->',

            '<!-- /ko -->'
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});