define([
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    'kb_common/jsonRpc/exceptions',
    './utils'
], function (
    DynamicService,
    GenericClient,
    exceptions,
    utils
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
            ])
                .catch(function (err) {
                    console.log('err', err instanceof Error, err instanceof exceptions.CustomError, err instanceof exceptions.AjaxError, err instanceof exceptions.ServerError);
                    if (err instanceof exceptions.AjaxError) {
                        console.error('AJAX Error', err);
                        throw new utils.JGISearchError('ajax', err.code, err.message, null, {
                            originalError: err
                        });
                    } else if (err instanceof exceptions.RpcError) {
                        console.error('RPC Error', err);
                        throw new utils.JGISearchError('ajax', err.name, err.message, null , {
                            originalError: err
                        });
                    } else {
                        throw new utils.JGISearchError('rpc-call', err.name, err.message, null, {
                            originalError: err
                        });
                    }
                });
        }

        return {
            call: call
        };
    }

    return {
        make: factory
    };
});
