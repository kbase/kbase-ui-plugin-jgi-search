define([
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/dynamicServiceClient'
], function (
    GenericClient,
    DynamicService
) {
    'use strict';


    function factory(config) {
        var runtime = config.runtime,
            hostNode, container;

        function serviceCall(moduleName, functionName, params) {
            var override = runtime.config(['services', moduleName, 'url'].join('.'));
            // console.log('overriding?', moduleName, override);
            var token = runtime.service('session').getAuthToken();
            var client;
            if (override) {
                client = new GenericClient({
                    module: moduleName,
                    url: override,
                    token: token
                });
            } else {
                client = new DynamicService({
                    url: runtime.config('services.service_wizard.url'),
                    token: token,
                    module: moduleName
                });
            }
            return client.callFunc(functionName, [
                params
            ]);
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start() {
            container.innerHTML = 'jobs...';

            return serviceCall('jgi_gateway', 'list_jobs', [])
                .catch(function (err) {
                    console.error('ERROR', err);
                });
        }

        function stop() {

        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
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