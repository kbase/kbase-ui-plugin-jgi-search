define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html',
    '../lib/ui',
    'kb_knockout/components/error'
], function (
    ko,
    reg,
    html,
    ui,
    ErrorComponent
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        span = t('span');

    class ViewModel {
        constructor(params, context) {
            this.error = params.error;

            this.title = 'Search Error';

            this.source = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().source;
            });
            this.code = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().code;
            });
            this.message = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().message;
            });
            this.detail = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().detail;
            });
            this.info = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().info;
            });
            this.stackTrace = ko.pureComputed(() => {
                if (!this.error()) {
                    return;
                }
                return this.error().stackTrace;
            });
            this.parent = context.$root.parent;
        }

        onClose() {
            this.parent.bus.send('close');
        }

        // return {
        //     // The error wrapper dialog interface
        //     title: 'Search Error',
        //     buttons: [
        //         {
        //             title: 'Close',
        //             action: doClose
        //         }
        //     ],
        //     error: error,
        //     close: close,
        //     onClose: doClose,
        //     // The error component VM interface
        //     source: source,
        //     code: code,
        //     message: message,
        //     detail: detail,
        //     info: info,
        //     stackTrace: stackTrace
        // };
    }

    function buildErrorViewer() {
        return div({
            dataBind: {
                component: {
                    name: ErrorComponent.quotedName(),
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
            body: buildErrorViewer(),
            buttons: [
                {
                    label: 'close',
                    onClick: 'onClose'
                }
            ]
        });
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});