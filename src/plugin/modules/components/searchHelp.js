// a wrapper for the help component, loads the search help.
define([
    'knockout-plus',
    'kb_common/html',
    'yaml!../helpData.yml'
], function (
    ko,
    html,
    helpDb
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        button = t('button');

    function viewModel(params) {
        var hostVm = params.hostVm;

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
            close: close,
            hostVm: hostVm
        };
    }

    function buildHelpViewer() {
        return div({
            dataBind: {
                component: {
                    name: '"generic/help"',
                    params: {
                        helpDb: 'helpDb',
                        hostVm: 'hostVm'
                    }
                }
            }
        });
    }

    function template() {
        return div({
        }, [
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
                    borderBottom: '1px green solid'
                }
            }),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                }
            }, buildHelpViewer()),
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