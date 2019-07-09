define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html',
    '../lib/ui',
    '../stagingJobsBrowser/components/main'
], function (
    ko,
    reg,
    gen,
    html,
    ui,
    StagingJobsBrowserComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    class ViewModel {
        constructor(params, context) {
            this.parent = context.$parent;

            this.clock = ko.observable();

            // generate a clock ...
            this.clockInterval = window.setInterval(() => {
                var time = new Date().getTime();
                this.clock(time);
            }, 1000);

            this.onClose = () => {
                this.parent.bus.send('close');
            };
        }

        dispose() {
            if (this.clockInterval) {
                window.clearInterval(this.clockInterval);
            }
        }
    }



    function buildJobsBrowser() {
        return gen.component({
            name: StagingJobsBrowserComponent.name(),
            params: {}
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
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});