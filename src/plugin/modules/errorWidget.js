define([
    'bluebird',
    'jquery',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    'kb_common/ui'
], function (
    Promise,
    $,
    html,
    BS,
    ui
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function buildPresentableJson(data) {
        switch (typeof data) {
        case 'string':
            return data;
        case 'number':
            return String(data);
        case 'boolean':
            return String(data);
        case 'object':
            if (data === null) {
                return 'NULL';
            }
            if (data instanceof Array) {
                return table({ class: 'table table-striped' },
                    data.map(function (datum, index) {
                        return tr([
                            th(String(index)),
                            td(buildPresentableJson(datum))
                        ]);
                    }).join('\n')
                );
            }
            return table({ class: 'table table-striped' },
                Object.keys(data).map(function (key) {
                    return tr([th(key), td(buildPresentableJson(data[key]))]);
                }).join('\n')
            );
        default:
            return 'Not representable: ' + (typeof data);
        }
    }

    function renderErrorDialog(title, content, okLabel) {
        return div({ class: 'modal fade', tabindex: '-1', role: 'dialog' }, [
            div({ class: 'modal-dialog  modal-lg kb-error-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({ type: 'button', class: 'close', dataDismiss: 'modal', ariaLabel: okLabel }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        content
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({ type: 'button', class: 'btn btn-default', dataDismiss: 'modal', dataElement: 'ok' }, okLabel)
                    ])
                ])
            ])
        ]);
    }

    function buildErrorDisplay(arg) {
        return div([
            arg.body,
            BS.buildPanel({
                name: 'message',
                classes: ['kb-panel-light'],
                title: 'Message',
                type: 'danger',
                body: div(arg.error.message)
            }),
            BS.buildPanel({
                name: 'type',
                classes: ['kb-panel-light'],
                title: 'Type',
                type: 'danger',
                body: div(arg.error.type)
            }),
            BS.buildPanel({
                name: 'code',
                classes: ['kb-panel-light'],
                title: 'Code',
                type: 'danger',
                body: div(arg.error.code)
            }),
            (function () {
                if (!arg.error.info) {
                    return '';
                }
                return BS.buildCollapsiblePanel({
                    name: 'info',
                    title: 'Info',
                    type: 'danger',
                    classes: ['kb-panel-light'],
                    collapsed: true,
                    hidden: false,
                    body: div(buildPresentableJson(arg.error.info))
                });
            }())

        ]);
    }

    function showErrorDialog(arg) {


        var dialog = renderErrorDialog(arg.title, buildErrorDisplay(arg), arg.okLabel || 'OK'),
            dialogId = html.genId(),
            confirmNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        confirmNode.id = dialogId;
        confirmNode.innerHTML = dialog;

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

        modalNode.appendChild(confirmNode);

        modalDialogNode = modalNode.querySelector('.modal');
        $(modalDialogNode).modal('show');
        return new Promise(function (resolve) {
            modalDialogNode.querySelector('[data-element="ok"]').addEventListener('click', function () {
                confirmNode.parentElement.removeChild(confirmNode);
                resolve(false);
            });
            modalDialogNode.addEventListener('hide.bs.modal', function () {
                resolve(false);
            });
        });
    }

    // function factory() {
    //     function attach() {

    //     }

    //     function start(params) {

    //     }

    //     function stop() {

    //     }

    //     function detach() {

    //     }

    //     return {
    //         attach: attach,
    //         start: start,
    //         stop: stop,
    //         detach: detach
    //     };
    // }

    return {
        show: showErrorDialog
    };
});