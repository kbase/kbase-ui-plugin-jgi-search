define([
    'knockout-plus',
    'kb_common/html',
    '../lib/utils'
], function (
    ko,
    html,
    utils
) {
    'use strict';

    var t = html.tag,
        button = t('button'),    
        div = t('div');

    function viewModel(params) {
        var clock = ko.observable();

        // generate a clock ...
        var clockInterval = window.setInterval(function () {
            var time = new Date().getTime();
            clock(time);
        }, 1000);
        
        function dispose() {
            if (clockInterval) {
                window.clearInterval(clockInterval);
            }
        }

        return {
            runtime: params.runtime,
            onClose: params.onClose,
            clock: clock,
            dispose: dispose
        };
    }

    function buildDialog(title, body) {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            // title
            div({
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px',
                    borderBottom: '1px green solid'
                }
            }, title),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    // maxHeight: 'calc(100vh - 100px)',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    overflowY: 'auto',
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, body),
            // buttons
            div({
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                class: 'btn btn-default',
                dataBind: {
                    click: 'onClose'
                }
            }, 'Close'))
        ]);
    }

    function buildJobsBrowser() {
        return utils.komponent({
            name: 'jgi-search/staging-jobs-browser/main',
            params: {
                runtime: 'runtime'
            }
        });
    }

    function template() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            buildDialog('Staging Jobs', buildJobsBrowser())
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