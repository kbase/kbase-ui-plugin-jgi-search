define([
    'knockout',
    'kb_common/html',
], function(
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        button = t('button');

    function buildDialog(arg) {
        return div({
            class: 'modal fade',
            tabindex: '-1',
            role: 'dialog'
        }, [
            div({ class: 'modal-dialog modal-lg' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({
                            type: 'button',
                            class: 'close',
                            // dataDismiss: 'modal',
                            ariaLabel: 'Done',
                            dataBind: {
                                click: 'doClose'
                            }
                        }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, arg.title)
                    ]),
                    div({ class: 'modal-body' }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"' + arg.component + '"',
                                    params: 'imported'
                                }
                            }
                        })
                    ]),
                    // div({ class: 'modal-footer' }, [
                    //     button({
                    //         type: 'button',
                    //         class: 'btn btn-primary',
                    //         dataBind: {
                    //             click: 'doClose'
                    //         }
                    //     }, 'Close')
                    // ])
                ])
            ])
        ]);
    }

    function viewModel(params) {
        return {
            doClose: params.close,
            imported: params.imported
        };
    }

    function showDialog(arg) {
        var dialog = buildDialog(arg),
            dialogId = html.genId(),
            dialogNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        dialogNode.id = dialogId;
        dialogNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(dialogNode);

        var backdropNode = document.createElement('div');
        backdropNode.classList.add('modal-backdrop', 'fade', 'in');
        document.body.appendChild(backdropNode);

        function close() {
            console.log('closing?');
            var backdrop = document.querySelector('.modal-backdrop');
            backdrop.parentElement.removeChild(backdrop);
            modalNode.parentElement.removeChild(modalNode);
        }

        console.log('paras', arg.params);
        ko.applyBindings(viewModel({
            close: close,
            imported: arg.params
        }), dialogNode);
        modalDialogNode = modalNode.querySelector('.modal');
        modalDialogNode.classList.add('in');
        modalDialogNode.style.display = 'block';
    }

    return {
        showDialog: showDialog
    };
});
