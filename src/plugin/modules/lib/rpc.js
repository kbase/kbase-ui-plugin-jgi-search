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
    'use strict';
    class RPC {
        constructor({runtime}) {
            this.runtime = runtime;
        }

        // TODO: this should go in to the ui services
        call(moduleName, functionName, params) {
            const override = this.runtime.config(['services', moduleName, 'url'].join('.'));
            const token = this.runtime.service('session').getAuthToken();
            let client;
            if (override) {
                client = new GenericClient({
                    module: moduleName,
                    url: override,
                    token: token
                });
            } else {
                client = new DynamicService({
                    url: this.runtime.config('services.service_wizard.url'),
                    token: token,
                    module: moduleName
                });
            }
            return client.callFunc(functionName, [
                params
            ])
                .catch((err) => {
                    console.error('err', err instanceof Error, err instanceof exceptions.CustomError, err instanceof exceptions.AjaxError, err instanceof exceptions.ServerError);
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
    }

    return RPC;
});
