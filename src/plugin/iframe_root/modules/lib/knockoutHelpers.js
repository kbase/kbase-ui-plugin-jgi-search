define(['knockout', 'kb_lib/html'], (ko, html) => {
    const t = html.tag,
        div = t('div');

    function komponent(componentDef) {
        const params = Object.keys(componentDef.params)
            .map(function (key) {
                return key + ':' + componentDef.params[key];
            })
            .join(',');
        return (
            `<!-- ko component: {name: "${componentDef.name}", params: {${params}}}--><!-- /ko -->`
        );
    }

    function createRootComponent(runtime, name) {
        var vm = {
            runtime: runtime,
            running: ko.observable(false)
        };
        var temp = document.createElement('div');
        // xss safe
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
                    name,
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
            vm,
            node,
            start,
            stop
        };
    }

    return {
        createRootComponent
    };
});
