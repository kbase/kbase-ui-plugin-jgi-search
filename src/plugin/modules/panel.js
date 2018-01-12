define([
    'knockout-plus'
], function (
    ko
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var rootComponent;
       
        function showFeedback() {
            alert('redirect to feedback form...');
        }

        function attach(node) {
            hostNode = node;
            rootComponent = ko.kb.createRootComponent(runtime, 'jgi-search/main');
            container = hostNode.appendChild(rootComponent.node);
        }

        function start() {
            runtime.send('ui', 'setTitle', 'JGI Search (beta)');

            runtime.send('ui', 'addButton', {
                name: 'feedback',
                label: 'Feedback',
                style: 'default',
                icon: 'bullhorn',
                toggle: false,
                params: {
                    // ref: objectInfo.ref
                },
                callback: function() {
                    // runtime.send('copyWidget', 'toggle');
                    showFeedback();
                }
            });

            rootComponent.vm.running(true);
        }

        function stop() {
            rootComponent.vm.running(false);
        }

        function detach() {
            // container.innerHTML = '';
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
