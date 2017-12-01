/*
Top level panel for jgi search
*/
define([
    'knockout-plus',
    'kb_common/html',
    './lib/utils'
], function (
    ko,
    html,
    utils
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;

        var styles = html.makeStyles({
            plugin: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }           
        });

        function attach(node) {
            hostNode = node;
            // container = node;
            container = hostNode.appendChild(document.createElement('div'));
            container.style.flex = '1 1 0px';
            container.style.display = 'flex';
            container.style['flex-direction'] = 'column';
        }

        function start() {
            runtime.send('ui', 'setTitle', 'JGI Search (beta)');

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
                    alert('does not do anything yet...');
                }
            });

            container.innerHTML = div({
                class: styles.classes.plugin
            }, [
                styles.sheet,
                utils.komponent({
                    name: 'jgi-search/main',
                    params: {
                        runtime: 'runtime'
                    }
                })
            ]);
            var vm = {
                runtime: runtime
            };
            ko.applyBindings(vm, container);
        }

        function stop() {
            // nothing yet.
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
