define([
    'kb_ko/KO',
    'kb_common/httpUtils',
    'kb_common/html',
    './components/main'
], function (
    KO,
    httpUtils,
    html,
    MainComponent
) {
    'use strict';

    let ko = KO.ko;
    let t = html.tag,
        div = t('div');

    // creates a top level component which has good integration
    // with a panel widget.
    function createRootComponent(runtime, name) {
        var vm = {
            runtime: runtime,
            running: ko.observable(false),
            initialParams: ko.observable()
        };
        var temp = document.createElement('div');
        temp.innerHTML = div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            '<!-- ko if: running -->',
            KO.komponent({
                name: name,
                params: {
                    runtime: 'runtime',
                    initialParams: 'initialParams'
                }
            }),
            '<!-- /ko -->'
        ]);
        var node = temp.firstChild;
        ko.applyBindings(vm, node, function (context) {
            context.runtime = runtime;
        });

        function start(params) {
            vm.initialParams(params);
            vm.running(true);
        }

        function stop() {
            vm.running(false);
        }
       
        return {
            vm: vm,
            node: node,
            start: start,
            stop: stop
        };
    }

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
            rootComponent = createRootComponent(runtime, MainComponent.name());
            container = hostNode.appendChild(rootComponent.node);
        }

        function start(params) {
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

            rootComponent.start(params);
        }

        function stop() {
            rootComponent.stop();
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
