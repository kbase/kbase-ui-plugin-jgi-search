define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        button = t('button');

    function validateViewModel(params) {
        var spec = {            
            source: {
                type: 'string',
                required: false
            },
            code: {
                type: 'string',
                required: true
            },
            message: {
                type: 'string',
                required: true
            },
            detail: {
                type: 'string',
                required: true
            },
            info: {
                type: 'object',
                required: false
            },
            onClose: {
                type: 'function',
                required: true
            }
        };

    }

    function viewModel(params) {
        var error = params.error;

        var source = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().source;
        });
        var code = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().code;
        });
        var message = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().message;
        });
        var detail = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().detail;
        });
        var info = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().info;
        });

        function doClose() {
            params.onClose();
        }

        return {
            // The error wrapper dialog interface
            title: 'Search Error',
            buttons: [
                {
                    title: 'Close',
                    action: doClose
                }
            ],
            error: error,
            close: close,
            // The error component VM interface
            source: source,
            code: code,
            message: message,
            detail: detail,
            info: info
        };
    }

    function builErrorViewer() {
        return div({
            dataBind: {
                component: {
                    name: '"generic/error"',
                    params: {
                        source: 'source',
                        code: 'code',
                        message: 'message',
                        detail: 'detail',
                        info: 'info'
                    }
                }
            }
        });
    }

    function template() {
        return div({}, [
            // title
            div({
                dataBind: {
                    text: 'title'
                },
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px',
                    borderBottom: '1px green solid',
                    // height: '50px'
                }
            }),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                }
            }, builErrorViewer()),
            div({
                dataBind: {
                    foreach: 'buttons'
                },
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                class: 'btn btn-default',
                dataBind: {
                    text: 'title',
                    click: 'action'
                }
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