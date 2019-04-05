define(['knockout', 'kb_lib/html'], (ko, html) => {
    'use strict';

    const t = html.tag,
        div = t('div');

    function komponent(componentDef) {
        return (
            '<!-- ko component: {name: "' +
            componentDef.name +
            '", params: {' +
            Object.keys(componentDef.params)
                .map(function (key) {
                    return key + ':' + componentDef.params[key];
                })
                .join(',') +
            '}}--><!-- /ko -->'
        );
    }

    function createRootComponent(runtime, name) {
        var vm = {
            runtime: runtime,
            running: ko.observable(false)
        };
        var temp = document.createElement('div');
        temp.innerHTML = div(
            {
                style: {
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            },
            [
                '<!-- ko if: running -->',
                komponent({
                    name: name,
                    params: {
                        runtime: 'runtime'
                    }
                }),
                '<!-- /ko -->'
            ]
        );
        var node = temp.firstChild;
        ko.applyBindings(vm, node, function (context) {
            context.runtime = runtime;
        });

        function start() {
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

    return {
        createRootComponent
    };
});
