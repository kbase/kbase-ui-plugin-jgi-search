define([
    'knockout',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/httpUtils',
    'kb_lib/html',
    'kb_knockout/components/overlayPanel',
    'lib/domUtils',
    './components/main',
    './help/components/searchHelp'
], (
    ko,
    gen,
    ViewModelBase,
    httpUtils,
    html,
    OverlayPanelComponent,
    {setInnerHTML},
    MainComponent,
    SearchHelpComponent
) => {
    const t = html.tag, div = t('div');

    class RootViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.runtime = params.runtime;

            this.running = ko.observable(false);
            this.initialParams = ko.observable();
            this.overlayComponent = ko.observable();
            this.showOverlay = ko.observable();

            this.subscribe(this.showOverlay, (newValue) => {
                this.overlayComponent(newValue);
            });
        }
    }

    // creates a top level component which has good integration
    // with a panel widget.
    class RootComponent {
        constructor(runtime, name) {
            this.runtime = runtime;
            this.name = name;

            this.vm = new RootViewModel({
                runtime: runtime
            });
            this.running = ko.observable(false);
            this.initialParams = ko.observable();
            this.node = null;
            this.render();
        }

        render() {
            const temp = document.createElement('div');
            setInnerHTML(temp, div(
                {
                    style: {
                        flex: '1 1 0px',
                        display: 'flex',
                        flexDirection: 'column'
                    }
                },
                [
                    gen.if(
                        'running',
                        gen.component({
                            name: this.name,
                            params: {
                                runtime: 'runtime',
                                initialParams: 'initialParams'
                            }
                        })
                    ),
                    gen.component({
                        name: OverlayPanelComponent.name(),
                        params: {
                            component: 'overlayComponent',
                            hostVm: '$data'
                        }
                    })
                ]
            ));
            this.node = temp.firstChild;
        }

        start(params) {
            // this.render();
            ko.applyBindings(this.vm, this.node, (context) => {
                context.runtime = this.runtime;
            });
            this.vm.initialParams(params);
            this.vm.running(true);
        }

        stop() {
            this.vm.running(false);
        }
    }

    class Widget {
        constructor(config) {
            this.runtime = config.runtime;
            this.hostNode = null;
            this.container = null;
            this.rootComponent = null;
        }

        googleFormLink(arg) {
            const baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScfZEQlO2Zq1ZgYQkn0pEIlXJapEOxrdeZmHY4PqvIyy7sugw/viewform';
            const query = {
                usp: 'pp_url',
                'entry.45112532': arg.username,
                'entry.1257375807': arg.realname,
                'entry.1670959681': arg.email,
                'entry.250050267': arg.subject
            };
            return baseUrl + '?' + httpUtils.encodeQuery(query);
        }

        showFeedback() {
            const fields = {
                username: this.runtime.service('session').getUsername(),
                realname: this.runtime.service('session').getRealname() || '',
                email: this.runtime.service('session').getEmail(),
                subject: 'JGI Search'
            };
            window.open(this.googleFormLink(fields), '_blank');
        }

        showHelp() {
            this.rootComponent.vm.showOverlay({
                name: SearchHelpComponent.name(),
                params: {},
                viewModel: {}
            });
        }

        attach(node) {
            this.hostNode = node;
            this.rootComponent = new RootComponent(this.runtime, MainComponent.name());
            this.container = this.hostNode.appendChild(this.rootComponent.node);
            this.container.setAttribute('data-k-b-testhook-plugin', 'jgi-search');
        }

        start(params) {
            this.runtime.send('ui', 'setTitle', 'JGI Search (BETA)');

            this.runtime.send('ui', 'addButton', {
                name: 'feedback',
                label: 'Feedback',
                style: 'default',
                icon: 'bullhorn',
                toggle: false,
                params: {
                    // ref: objectInfo.ref
                },
                callback: () => {
                    this.showFeedback();
                }
            });

            this.runtime.send('ui', 'addButton', {
                name: 'help',
                label: 'Help',
                style: 'default',
                icon: 'question-circle',
                toggle: false,
                params: {
                    // ref: objectInfo.ref
                },
                callback: () => {
                    this.showHelp();
                }
            });

            this.rootComponent.start(params);
        }

        stop() {
            this.rootComponent.stop();
        }

        detach() {
            if (this.hostNode && this.container) {
                this.hostNode.removeChild(this.container);
                this.container.innerHTML = '';
            }
        }
    }

    return Widget;
});
