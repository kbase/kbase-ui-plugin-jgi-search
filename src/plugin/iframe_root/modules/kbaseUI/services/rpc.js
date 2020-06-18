define(['bluebird', '../rpc'], function (Promise, rpc) {
    'use strict';

    // function proxyMethod(obj, method, args) {
    //     if (!obj[method]) {
    //         throw {
    //             name: 'UndefinedMethod',
    //             message: 'The requested method "' + method + '" does not exist on this object',
    //             suggestion: 'This is a developer problem, not your fault'
    //         };
    //     }
    //     return obj[method].apply(obj, args);
    // }

    class RPCService {
        constructor({ runtime }) {
            this.runtime = runtime;
        }

        start() {
            return true;
        }
        stop() {
            return true;
        }
        pluginHandler() {
            return Promise.try(function () {});
        }

        makeClient({ module, timeout, authenticated }) {
            if (authenticated === undefined) {
                authenticated = true;
            } else {
                authenticated = authenticated ? true : false;
            }
            const client = new rpc.RPCClient({
                runtime: this.runtime,
                module: module,
                timeout: timeout,
                authenticated: authenticated
            });
            return client;
        }
    }

    return RPCService;
});
