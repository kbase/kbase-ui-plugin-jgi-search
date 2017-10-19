define([
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',

], function (
    DynamicService,
    GenericClient
) {
    function factory(config) {
        var runtime = config.runtime;

        // TODO: this should go in to the ui services
        function call(moduleName, functionName, params) {
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

        return {
            call: call
        }
    }

    return {
        make: factory
    }
});
