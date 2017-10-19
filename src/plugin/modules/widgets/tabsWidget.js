define([
    'bluebird',
    'kb_common/html'
], function (
    Promise,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container,
            runtime = config.runtime;

        // var tabsControl = document.querySelector(selector);

        var tabSet;
        var panelSet;
        var currentTab;

        // var tabsOrder = arg.order;
        // var tabsDefinition = arg.tabs;

        var tabsId = html.genId();
        var tabsMap = config.tabs.reduce(function (accum, tab) {
            if (tab) {
                accum[tab.name] = tab;
            }
            return accum;
        }, {});

        //     function render() {
        //         var html = '<div class="flex-tabs" id="' + myId + '">' +
        //                    ''

        //         tabsOrder.map(function (tabName) {
        //             var tab = tabsDefinition[tabName];

        //         }
        // }

        function render() {
            var style = {};
            if (config.style) {
                style = config.style;
            }
            hostNode.innerHTML = div({
                class: 'flex-tabs',
                id: tabsId,
                style: style
            }, [
                div({
                    class: '-tabs'
                }, config.tabs.map(function (tab) {
                    return div({
                        class: '-tab',
                        dataTab: tab.name
                    }, div({
                        class: '-label',
                    }, tab.label));
                })),
                div({
                    class: '-panels'
                }, config.tabs.map(function (tab) {
                    return div({
                        class: '-panel',
                        dataTabPanel: tab.name
                    });
                }))
            ]);
            tabSet = hostNode.querySelector('.-tabs');
            panelSet = hostNode.querySelector('.-panels');
        }

        function deactivateCurrentTab() {
            if (!currentTab) {
                return;
            }
            var tab = hostNode.querySelector('[data-tab="' + currentTab + '"]');
            var panel = hostNode.querySelector('[data-tab-panel="' + currentTab + '"]');
            tab.classList.add('-inactive');
            panel.classList.add('-inactive');
            tab.classList.remove('-active');
            panel.classList.remove('-active');
        }

        var currentTabWidget;

        function unloadCurrentTab() {
            return Promise.try(function () {
                if (!currentTabWidget) {
                    return null;
                }
                return currentTabWidget.stop()
                    .then(function (value) {
                        return currentTabWidget.detach();
                    });
            });
        }

        function loadTab(tabName) {
            currentTabWidget = tabsMap[tabName].panel.factory.make({
                runtime: runtime
            });
            var tabNode = hostNode.querySelector('[data-tab-panel="' + tabName + '"]');
            return currentTabWidget.attach(tabNode)
                .then(function () {
                    return currentTabWidget.start();
                });
        }

        function activateTab(tabName) {
            currentTab = tabName;
            var tab = hostNode.querySelector('[data-tab="' + currentTab + '"]');
            var panel = hostNode.querySelector('[data-tab-panel="' + currentTab + '"]');
            return unloadCurrentTab()
                .then(function () {
                    tab.classList.remove('-inactive');
                    panel.classList.remove('-inactive');
                    return loadTab(tabName);
                })
                .then(function () {
                    tab.classList.add('-active');
                    panel.classList.add('-active');
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                })

        }

        // Service API

        function attach(node) {
            return Promise.try(function () {
                hostNode = node;
                // More bare to the metal...
                render();
            });
        }

        function start(params) {
            return Promise.try(function () {
                var tabs = Array.prototype.slice.call(tabSet.querySelectorAll('[data-tab]'));
                // var tabPanels = Array.prototype.slice.call(tabSet.querySelectorAll('[data-tab-panel]'));
                tabs.forEach(function (tab) {
                    var tabName = tab.getAttribute('data-tab');
                    var tabPanel = hostNode.querySelector('[data-tab-panel="' + tabName + '"]');
                    tab.classList.add(tabName === currentTab ? '-active' : '-inactive');
                    tabPanel.classList.add(tabName === currentTab ? '-active' : '-inactive');
                    tab.addEventListener('click', function (ev) {
                        deactivateCurrentTab();
                        activateTab(tabName);
                    });
                });
                if (config.initialTab) {
                    return activateTab(config.initialTab);
                }
            });
        }

        function stop() {
            return Promise.try(function () {
                return null;
            });
        }

        function detach() {
            return Promise.try(function () {
                if (hostNode) {
                    hostNode.innerHTML = '';
                }
                return null;
            });
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