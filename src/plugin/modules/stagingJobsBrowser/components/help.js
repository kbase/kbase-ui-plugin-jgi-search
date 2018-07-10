// a wrapper for the help component, loads the search help.
define([
    'kb_knockout/registry',
    'kb_common/html',
    '../../lib/ui',
    'yaml!../helpData.yml'
], function (
    reg,
    html,
    ui,
    helpDb
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    class ViewModel {
        constructor(params) {
            this.title = 'Search Help';
            this.buttons = [
                {
                    title: 'Close',
                    action: () => {
                        this.doClose;
                    }
                }
            ];
            this.helpDb = helpDb;
            this.onClose = params.onClose;
        }
        doClose() {
            this.onClose();
        }
    }

    function buildHelpViewer() {
        return div({
            dataBind: {
                component: {
                    name: '"generic/help"',
                    params: {
                        helpDb: 'helpDb',
                        onClose: 'onClose'
                    }
                }
            }
        });
    }

    function template() {
        return ui.buildDialog({
            title: span({dataBind: {text: 'title'}}),
            icon: 'question-circle',
            body: buildHelpViewer()
        });
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});