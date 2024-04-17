define(['bluebird', '../typeManager'], (Promise, TypeManager) => {
    'use strict';

    class TypeService {
        constructor({ runtime, config }) {
            this.runtime = runtime;

            this.typeManager = TypeManager.make({
                runtime: runtime,
                typeDefs: {}
            });

            this.pluginHandler(config);
        }

        start() {
            return Promise.try(() => {
                var problems = this.typeManager.checkViewers(),
                    errors = [];
                if (problems.length > 0) {
                    problems.forEach((problem) => {
                        switch (problem.severity) {
                        case 'warning':
                            console.warn(problem.message, problem);
                            break;
                        case 'error':
                            console.error(problem.message, problem);
                            errors.push(problem.message);
                            break;
                        default:
                            console.error(problem.message, problem);
                            break;
                        }
                    });
                    if (errors.length > 0) {
                        throw new Error('Error starting Type Manager. Check the log for details. ' + errors.join('; '));
                    }
                }
                return true;
            });
        }

        stop() {
            return Promise.try(() => {
                return true;
            });
        }

        pluginHandler(pluginConfig) {
            if (!pluginConfig) {
                return;
            }
            pluginConfig.map((typeDef) => {
                var type = typeDef.type,
                    viewers = typeDef.viewers,
                    icon = typeDef.icon;

                if (icon) {
                    this.typeManager.setIcon(type, icon);
                }

                if (viewers) {
                    viewers.map((viewerDef) => {
                        return Promise.try(() => {
                            this.typeManager.addViewer(type, viewerDef);
                        });
                    });
                }
            });
        }

        proxyMethod(obj, method, args) {
            if (!obj[method]) {
                throw {
                    name: 'UndefinedMethod',
                    message: 'The requested method "' + method + '" does not exist on this object',
                    suggestion: 'This is a developer problem, not your fault'
                };
            }
            return obj[method].apply(obj, args);
        }

        getViewer() {
            return this.proxyMethod(this.typeManager, 'getViewer', arguments);
        }
        parseTypeId() {
            return this.proxyMethod(this.typeManager, 'parseTypeId', arguments);
        }
        getIcon() {
            return this.proxyMethod(this.typeManager, 'getIcon', arguments);
        }
        getColor() {
            return this.proxyMethod(this.typeManager, 'getColor', arguments);
        }
        makeVersion() {
            return this.proxyMethod(this.typeManager, 'makeVersion', arguments);
        }
        makeTypeId() {
            return this.proxyMethod(this.typeManager, 'makeTypeId', arguments);
        }
        makeType() {
            return this.proxyMethod(this.typeManager, 'makeType', arguments);
        }
        hasType() {
            return this.proxyMethod(this.typeManager, 'hasType', arguments);
        }
    }

    return TypeService;
});
