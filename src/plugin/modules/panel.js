define([
    'knockout-plus',
    'kb_common/httpUtils',
    './components/main'
], function (
    ko,
    httpUtils,
    MainComponent
) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;
        var rootComponent;

        function googleFormLink(arg) {
            var baseUrl = 'https://docs.google.com/forms/d/e/1FAIpQLScfZEQlO2Zq1ZgYQkn0pEIlXJapEOxrdeZmHY4PqvIyy7sugw/viewform';
            var query = {
                usp: 'pp_url',
                'entry.45112532': arg.username,
                'entry.1257375807': arg.realname,
                'entry.1670959681': arg.email,
                'entry.250050267': arg.subject
            };
            return baseUrl + '?' + httpUtils.encodeQuery(query);
        }
       
        function showFeedback() {
            var fields = {
                username: runtime.service('session').getUsername(),
                realname: runtime.service('session').getRealname() || '',
                email: runtime.service('session').getEmail(),
                subject: 'JGI Search'
            };
            window.open(googleFormLink(fields), '_blank');
        }

        function attach(node) {
            hostNode = node;
            rootComponent = ko.kb.createRootComponent(runtime, MainComponent.name());
            container = hostNode.appendChild(rootComponent.node);
        }

        function start() {
            runtime.send('ui', 'setTitle', 'JGI Search (BETA)');

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
