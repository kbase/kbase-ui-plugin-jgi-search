// a wrapper for the help component, loads the search help.
define([
    'knockout',
    'kb_knockout/registry',
    'kb_lib/html',
    'kb_knockout/components/help',
    'kb_knockout/lib/viewModelBase',
    '../../lib/ui',
    'yaml!../helpData.yml'
], function (
    ko,
    reg,
    html,
    HelpComponent,
    ViewModelBase,
    ui,
    helpDb
) {
    var t = html.tag,
        div = t('div'),
        span = t('span');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);
            this.onClose = params.onClose;
            this.helpDb = helpDb;
            this.buttons = [
                {
                    title: 'Close',
                    action: this.doClose
                }
            ];
            this.title = 'Search Help';

            this.parent = context.$parent;
        }

        doClose() {
            this.parent.bus.send('close');
        }
    }

    function template() {
        return ui.buildDialog({
            title: span({dataBind: {text: 'title'}}),
            body: div({
                dataBind: {
                    component: {
                        name: HelpComponent.quotedName(),
                        params: {
                            helpDb: 'helpDb',
                            onClose: 'doClose'
                        }
                    }
                }
            }),
            buttons: [
                {
                    label: 'Close',
                    onClick: 'doClose'
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