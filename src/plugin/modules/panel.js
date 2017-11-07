/*
Top level panel for jgi search
*/
define([
    'knockout-plus',
    'kb_common/html',
    './utils'
], function (
    ko,
    html,
    utils
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;


        function buildTabs() {
            div({
                class: 'col-md-12'
            }, div({
                dataBind: {
                    component: {
                        name: '"tabset"',
                        params: {
                            vm: {
                                QE: 'QE',
                                searchResults: 'searchResults',
                                searching: 'searching',
                                searchInput: 'searchInput',
                                withPublicData: 'searchPublicData',
                                withPrivateData: 'searchPrivateData',
                                runtime: 'runtime',
                                bus: 'tabsetBus',
                                error: 'error'
                            }
                        }
                    }
                }
            }));

            // var tabDef = {
            //     runtime: runtime,
            //     style: {
            //         padding: '0 10px'
            //     },
            //     initialTab: params.tab || 'profile',
            //     tabs: [{
            //             name: 'profile',
            //             label: 'Your Profile',
            //             panel: {
            //                 factory: ProfileManager
            //             }
            //         },
            //         {
            //             name: 'account',
            //             label: 'Account',
            //             panel: {
            //                 factory: PersonalInfoEditor
            //             }
            //         },
            //         {
            //             name: 'links',
            //             label: 'Linked Sign-In Accounts',
            //             panel: {
            //                 factory: LinksManager
            //             }
            //         }, (function () {
            //             if (vm.developerTokens.enabled) {
            //                 return {
            //                     name: 'developer-tokens',
            //                     label: 'Developer Tokens',
            //                     panel: {
            //                         factory: DeveloperTokenManager
            //                     }
            //                 };
            //             }
            //         }()), (function () {
            //             if (vm.serviceTokens.enabled) {
            //                 return {
            //                     name: 'service-tokens',
            //                     label: 'Service Tokens',
            //                     panel: {
            //                         factory: ServiceTokenManager
            //                     }
            //                 };
            //             }
            //         }()), {
            //             name: 'signins',
            //             label: 'Sign-Ins',
            //             panel: {
            //                 factory: SigninManager
            //             }
            //         }, {
            //             name: 'agreements',
            //             label: 'Usage Agreements',
            //             panel: {
            //                 factory: AgreementsManager
            //             }
            //         }
            //         // {
            //         //     name: 'about',
            //         //     label: 'About',
            //         //     content: buildAbout()
            //         // }
            //     ].filter(function (tab) {
            //         return tab ? true : false;
            //     })
            // };
            //
            // tabs = TabsWidget.make(tabDef);
            // return tabs.attach(node)
            //     .then(function () {
            //         return tabs.start();
            //     });
        }

        function setupTabs() {
            var tabsetBus = NanoBus();

            // The ready message is called when the tabset has loaded and is ready to
            // interact. We use it here to add the initial tab for search results.
            tabsetBus.on('ready', function () {
                tabsetBus.send('add-tab', {
                    tab: {
                        label: 'Search across all types',
                        component: {
                            name: 'jgi-search/main',
                            // NB these params are bound here, not in the tabset.
                            params: {

                            }
                        }
                    }
                });
            });
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
            container.classList.add('plugin-jgi-search');
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'JGI Search (beta)');

            container.innerHTML = utils.komponent({
                name: 'jgi-search/main',
                params: {
                    runtime: 'runtime'
                }
            });
            var vm = {
                runtime: runtime
            };
            ko.applyBindings(vm, container);
        }

        function stop() {
            // nothing yet.
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
                container.innerHTML = '';
            }
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});
