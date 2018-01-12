define([
    'knockout-plus',
    'kb_common/html',
    '../lib/utils',
    '../lib/ui'
], function (
    ko,
    html,
    utils,
    ui
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

   

    function buildJobsBrowser() {
        return ko.kb.komponent({
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
            ui.buildFullHeightDialog({
                title: 'Staging Jobs', 
                body: buildJobsBrowser()
            })
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