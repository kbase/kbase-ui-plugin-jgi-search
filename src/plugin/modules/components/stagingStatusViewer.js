define([
    'knockout-plus',
    'kb_common/html',
    '../lib/utils',
    '../lib/ui',
    '../stagingJobsBrowser/components/main'
], function (
    ko,
    html,
    utils,
    ui,
    StagingJobsBrowserComponent
) {
    'use strict';

    var t = html.tag, 
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
            name: StagingJobsBrowserComponent.name(),
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

    return ko.kb.registerComponent(component);
});