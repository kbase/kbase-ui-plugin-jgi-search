define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        var tabsetId = html.genId();
        var tabs = ko.observableArray();
        var tabClasses = ko.observableArray(['nav', 'nav-tabs']);
        var activeTab = ko.observable();

        var hostVM = params.vm;

        // Bus -- ??!!
        // TODO: provide the bus on the top level of the params...
        var bus = hostVM.tabsetBus;
        bus.on('add-tab', function (message) {
            addTab(message.tab);
        });
        bus.on('select-tab', function (message) {
            if (typeof message === 'number') {
                doSelectTab(tabs()[message]);
            }
        });

        // Initialize Tabs

        if (params.tabs) {
            params.tabs.forEach(function (tab) {
                tabs.push(makeTab(tab));
            });
        }

        if (!('active' in params)) {
            if (tabs().length > 0) {
                tabs()[0].active(true);
                activeTab(tabs()[0]);
            }
        }

        function doCloseTab(tab) {
            var index = tabs.indexOf(tab);
            tabs.remove(tab);
            if (index === 0) {
                return;
            }
            // if not the selected tab, nothing else to do.
            if (tab !== activeTab()) {
                return;
            }

            // If no closable tabs, we go back to the first tab.
            var currentTab;
            var totalTabs = tabs().length;
            var closableTabs = tabs().reduce(function (closableCount, tab) {
                return closableCount + (tab.closable() ? 1 : 0);
            }, 0);
            var nonclosableTabs = totalTabs - closableTabs;
            if (closableTabs > 0) {
                // avoid opening up the last unclosable tab if there are closables left.
                if (index === nonclosableTabs) {
                    currentTab = tabs()[index + 1];
                } else {
                    currentTab = tabs()[index - 1];
                }
            } else {
                currentTab = tabs()[0];
            }

            activateTab(currentTab);
            currentTab.active(true);
        }

        // bootstrap tabs implemeneted in knockout.
        function makeTab(params) {
            // inject the hostVM into the tab params
            // TODO get rid of that???
            if (!params.component.params) {
                params.component.params = {};
            }
            params.component.params.hostVM = hostVM;
            return {
                label: params.label,
                component: params.component,
                content: params.content,
                active: ko.observable(false),
                closable: ko.observable(params.closable || false)
            };
        }

        function addTab(tab) {
            var newTab = makeTab(tab);
            tabs.push(newTab);
            deactivateCurrentTab();
            activateTab(newTab);
        }

        function activateTab(tab) {
            tab.active(true);
            activeTab(tab);
        }

        function deactivateCurrentTab() {
            if (activeTab()) {
                activeTab().active(false);
            }
        }

        function doSelectTab(tab) {
            deactivateCurrentTab();
            activateTab(tab);
        }

        bus.send('ready');

        return {
            // JUST TABS
            tabs: tabs,
            tabClasses: tabClasses,
            tabsetId: tabsetId,
            doCloseTab: doCloseTab,
            doSelectTab: doSelectTab,
            addTab: addTab,

            // PASS THROUGH
            hostVM: hostVM
        };
    }

    function template() {
        return div({
            class: 'component-tabset'
        }, [
            ul({
                dataBind: {
                    attr: {
                        id: 'tabsetId'
                    },
                    foreach: 'tabs'
                },
                class: 'kb-tabs',
                role: 'tablist'
            }, li({
                role: 'presentation',
                class: 'tabs',
                dataBind: {
                    css: {
                        active: 'active'
                    }
                }
            }, [
                a({
                    dataBind: {
                        click: '$component.doSelectTab'
                    },
                    role: 'tab',
                    style: {
                        display: 'inline-block'
                    }
                }, [
                    span({
                        dataBind: {
                            text: 'label'
                        }
                    }),
                    '<!-- ko if: closable -->',
                    span({
                        class: '-button',
                        dataBind: {
                            click: '$component.doCloseTab'
                        }
                    }, span({
                        class: 'fa fa-times',
                    })),
                    '<!-- /ko -->'
                ]),
            ])),
            div({
                class: 'tab-content',
                dataBind: {
                    foreach: 'tabs'
                }
            }, div({
                dataBind: {
                    attr: {
                        active: 'active'
                    },
                    css: { in: 'active',
                        active: 'active'
                    }
                },
                class: 'tab-pane fade',
                role: 'tabpanel'
            }, [
                '<!-- ko if: $data.component -->',
                div({
                    dataBind: {
                        component: {
                            name: 'component.name',
                            params: 'component.params'
                        }
                    }
                }),
                '<!-- /ko -->',
                '<!-- ko if: $data.content -->',
                div({
                    dataBind: {
                        html: '$data.content'
                    }
                }),
                '<!-- /ko -->',
            ]))
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