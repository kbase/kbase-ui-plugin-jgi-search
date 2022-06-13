define([
    'bluebird',
    'kb_lib/props',
    'kb_lib/messenger',
    './services/session',
    './services/rpc'
], (Promise, props, Messenger, SessionService, RPCService) => {
    'use strict';

    class Runtime {
        constructor({ authorization, token, username, config, pluginConfigDB }) {
            this.authorization = authorization;
            this.token = token;
            this.username = username;

            this.configDB = new props.Props({ data: config });
            this.pluginConfigDB = pluginConfigDB;
            // TODO: fix this!
            this.pluginPath = '/modules/plugins/' + pluginConfigDB.getItem('package.name') + '/iframe_root';
            this.pluginResourcePath = this.pluginPath + '/resources';

            this.messenger = new Messenger();

            this.heartbeatTimer = null;

            this.services = {
                session: new SessionService({ runtime: this }),
                rpc: new RPCService({ runtime: this })
            };

            this.featureSwitches = {};
            this.configDB.getItem('ui.featureSwitches.available', []).forEach((featureSwitch) => {
                this.featureSwitches[featureSwitch.id] = featureSwitch;
            });
        }

        config(path, defaultValue) {
            return this.configDB.getItem(path, defaultValue);
        }

        getConfig(path, defaultValue) {
            return this.config(path, defaultValue);
        }

        service(name) {
            if (!(name in this.services)) {
                throw new Error('The UI service "' + name + '" is not defined');
            }
            return this.services[name];
        }

        getService(name) {
            return this.service(name);
        }

        // COMM

        send(channel, message, data) {
            this.messenger.send({ channel, message, data });
        }

        receive(channel, message, handler) {
            return this.messenger.receive({ channel, message, handler });
        }

        recv(channel, message, handler) {
            return this.receive(channel, message, handler);
        }

        drop(subscription) {
            this.messenger.unreceive(subscription);
        }

        // FEATURE SWITCHES

        featureEnabled(id, defaultValue = false) {
            const featureSwitch = this.featureSwitches[id];
            if (!featureSwitch) {
                throw new Error('Feature switch "' + id + '" not defined');
            }

            const enabledFeatureSwitches = this.configDB.getItem('ui.featureSwitches.enabled');
            const enabled = enabledFeatureSwitches.includes(id);
            return enabled || defaultValue;
        }

        // LIFECYCLE

        start() {
            return Promise.try(() => {
                this.heartbeatTimer = window.setInterval(() => {
                    this.send('app', 'heartbeat', { time: new Date().getTime() });
                }, 1000);
                return this.services.session.start();
            });
        }

        stop() {
            return Promise.try(() => {
                window.clearInterval(this.heartbeatTimer);

                return this.services.session.stop();
            });
        }
    }

    return Runtime;
});
