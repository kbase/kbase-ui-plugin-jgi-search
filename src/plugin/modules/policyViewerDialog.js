define([
    'knockout',
    'marked',
    'kb_common/html',
    'text!./jgiTerms.md'
], function(
    ko,
    marked,
    html,
    jgiTerms
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        button = t('button');

    function buildDialog(title) {
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
                                click: 'close'
                            }
                        }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"policy-viewer"',
                                    params: {
                                        policy: 'policy',
                                        agreed: 'agreed',
                                        finished: 'finished',
                                        doAgree: 'doAgree',
                                        doCancel: 'doCancel'
                                    }
                                }
                            }
                        })
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({
                            type: 'button',
                            class: 'btn btn-primary',
                            dataBind: {
                                click: 'doAgree'
                            }
                        }, 'Agree'),
                        button({
                            type: 'button',
                            class: 'btn btn-danger',
                            dataBind: {
                                click: 'doCancel'
                            }
                        }, 'Cancel')
                    ])
                ])
            ])
        ]);
    }

    function viewModel(params) {
        function close() {
            var backdrop = document.querySelector('.modal-backdrop');
            backdrop.parentElement.removeChild(backdrop);
            params.node.parentElement.removeChild(params.node);
        }
        var agreed = params.agreed;

        var finished = ko.observable(false);

        function doAgree() {
            agreed(true);
            finished(true);
        }

        function doCancel() {
            agreed(false);
            finished(true);
        }
        finished.subscribe(function(newValue) {
            if (newValue) {
                close();
            }
        });
        return {
            policy: marked(jgiTerms),
            agreed: agreed,
            finished: finished,
            doAgree: doAgree,
            doCancel: doCancel
        };
    }

    function showDialog(params) {
        var dialog = buildDialog('JGI Data Policy'),
            dialogId = html.genId(),
            helpNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        helpNode.id = dialogId;
        helpNode.innerHTML = dialog;

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

        modalNode.appendChild(helpNode);

        var backdropNode = document.createElement('div');
        backdropNode.classList.add('modal-backdrop', 'fade', 'in');
        document.body.appendChild(backdropNode);

        ko.applyBindings(viewModel({
            node: modalNode,
            agreed: params.agreed
        }), helpNode);
        modalDialogNode = modalNode.querySelector('.modal');
        modalDialogNode.classList.add('in');
        modalDialogNode.style.display = 'block';
    }

    return {
        showDialog: showDialog
    };
});