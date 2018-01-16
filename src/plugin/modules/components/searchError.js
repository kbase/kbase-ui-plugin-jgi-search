define([
    'knockout-plus',
    'kb_common/html',
    '../lib/ui'
], function (
    ko,
    html,
    ui
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

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
        var stackTrace = ko.pureComputed(function () {
            if (!error()) {
                return;
            }
            return error().stackTrace;
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
            onClose: doClose,
            // The error component VM interface
            source: source,
            code: code,
            message: message,
            detail: detail,
            info: info,
            stackTrace: stackTrace
        };
    }

    function buildErrorViewer() {
        return div({
            dataBind: {
                component: {
                    name: '"generic/error"',
                    params: {
                        source: 'source',
                        code: 'code',
                        message: 'message',
                        detail: 'detail',
                        info: 'info',
                        stackTrace: 'stackTrace'
                    }
                }
            }
        });
    }

    function buildTitle() {
        return span({
            dataBind: {
                text: 'title'
            }
        });
    }

    function template() {
        return ui.buildDialog({
            type: 'error',
            title: buildTitle(), 
            body: buildErrorViewer()
        });
    }

    // function template() {
    //     return div({}, [
    //         // title
    //         div({
    //             dataBind: {
    //                 text: 'title'
    //             },
    //             style: {
    //                 color: '#2e618d',
    //                 backgroundColor: 'rgba(255,255,255,1)',
    //                 fontSize: '130%',
    //                 fontWeight: 'bold',
    //                 padding: '15px',
    //                 borderBottom: '1px solid #e5e5e5'
    //                 // height: '50px'
    //             }
    //         }),
    //         // body
    //         div({
    //             style: {
    //                 padding: '15px',
    //                 minHeight: '10em',
    //                 maxHeight: '85vh',
    //                 overflowY: 'auto',
    //                 backgroundColor: 'rgba(255,255,255,1)',
    //             }
    //         }, builErrorViewer()),
    //         div({
    //             dataBind: {
    //                 foreach: 'buttons'
    //             },
    //             style: {
    //                 padding: '15px',
    //                 textAlign: 'right',
    //                 backgroundColor: 'rgba(255,255,255,1)',
    //                 borderTop: '1px solid #e5e5e5'
    //             }
    //         }, button({
    //             type: 'button',
    //             class: 'btn btn-default',
    //             dataBind: {
    //                 text: 'title',
    //                 click: 'action'
    //             }
    //         }))
    //     ]);
    // }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});