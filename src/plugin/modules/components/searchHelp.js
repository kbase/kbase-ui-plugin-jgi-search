// a wrapper for the help component, loads the search help.
define([
    'knockout-plus',
    'kb_common/html',
    '../lib/ui',
    'yaml!../helpData.yml'
], function (
    ko,
    html,
    ui,
    helpDb
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    function viewModel(params) {
        function doClose() {
            params.onClose();
        }

        return {
            title: 'Search Help',
            buttons: [
                {
                    title: 'Close',
                    action: doClose
                }
            ],
            helpDb: helpDb,
            onClose: params.onClose
        };
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
        return ui.buildDialog(span({dataBind: {text: 'title'}}), buildHelpViewer());        
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});