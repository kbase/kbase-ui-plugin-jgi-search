require(['loader'], () => {
    require([
        'bluebird',
        'dompurify',
        'kbaseUI/integration',
        'kbaseUI/dispatcher',
        'kb_knockout/load',
        'kb_lib/props',
        'yaml!./config.yml',
        'bootstrap',
        'css!font_awesome'
    ], (Promise, DOMPurify, Integration, Dispatcher, knockoutLoader, props, pluginConfig) => {
        const SHOW_LOADER_AFTER = 1000;

        DOMPurify.setConfig({ADD_ATTR: ['target'], ADD_URI_SAFE_ATTR: ['target'], ADD_TAGS: ['#comment']});

        const pluginConfigDB = new props.Props({data: pluginConfig});

        function loader(message) {
            // clone of bootstrap 3 'well' class.
            const style = {
                'border': '1px solid #e3e3e3',
                'padding': '19px',
                'border-radius': '4px',
                'background-color': '#f5f5f5',
                'min-height': '20px',
                'max-width': '40em',
                'margin': '20px auto 0 auto',
                'box-shadow': 'inset 0 1px 1px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                'flex-direction': 'row',
                'justify-content': 'center',
                'align-items': 'center'
            };
            const styleString = Object.entries(style).map(([key, value]) => {
                return `${key}:${value};`;
            }).join(' ');
            return `
                <div style="${styleString}">
                ${message} <span class="fa fa-2x fa-spinner fa-pulse" />
                </div>
            `;
        }

        Promise.try(() => {
            const integration = new Integration({
                rootWindow: window,
                pluginConfig
            });
            const rootNode = document.getElementById('root');

            // NOW -- we need to implement widget dispatch here
            // based on the navigation received from the parent context.
            let dispatcher = null;
            let loadingTimer = null;

            return knockoutLoader
                .load()
                .then((ko) => {
                    // For more efficient ui updates.
                    // This was introduced in more recent knockout releases,
                    // and in the past introduced problems which were resolved
                    // in knockout 3.5.0.
                    ko.options.deferUpdates = true;
                    // replace the html binding handler.
                    ko.bindingHandlers.html = {
                        init(element, valueAccessor) {
                            const value = ko.unwrap(valueAccessor()) || '';
                            // xss safe
                            element.innerHTML = DOMPurify.sanitize(value);
                        },
                        update(element, valueAccessor) {
                            const value = ko.unwrap(valueAccessor()) || '';
                            // xss safe
                            element.innerHTML = DOMPurify.sanitize(value);
                        }
                    };
                })
                .then(() => {
                    return integration.start();
                })
                .then(() => {
                    // place a loader.
                    loadingTimer = window.setTimeout(() => {
                        // xss safe
                        rootNode.innerHTML = loader('Loading Search Plugin ...');
                    }, SHOW_LOADER_AFTER);
                })
                .then(() => {
                    // Add routes to panels here
                    dispatcher = new Dispatcher({
                        runtime: integration.runtime,
                        node: rootNode,
                        views: pluginConfigDB.getItem('views', [])
                    });
                    return dispatcher.start();
                })
                .then((dispatcher) => {
                    window.clearTimeout(loadingTimer);
                    rootNode.innerHTML = '';
                    integration.onNavigate(({path, params, view}) => {
                        dispatcher.dispatch({view, path, params});
                    });
                    integration.started();

                })
                .catch((err) => {
                    integration.startError(err);
                });
        }).catch((err) => {
            console.error('ERROR2', err);
        });
    });
});
