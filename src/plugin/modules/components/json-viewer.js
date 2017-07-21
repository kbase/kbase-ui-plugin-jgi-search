define([
    'knockout',
    'kb_common/html'
], function(
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    function makeBrowsable(obj, forceOpen) {
        switch (typeof obj) {
            case 'string':
            case 'number':
            case 'boolean':
                return {
                    type: typeof obj,
                    value: obj,
                    display: String(obj)
                };
            case 'object':
                if (obj === null) {
                    return {
                        type: 'null',
                        value: obj,
                        display: 'null'
                    };
                } else if (obj instanceof Array) {
                    return {
                        type: 'array',
                        show: ko.observable(forceOpen || false),
                        value: obj.map(function(element) {
                            // return makeBrowsable(element);
                            return element;
                        })
                    };
                } else {
                    return {
                        type: 'object',
                        show: ko.observable(forceOpen || false),
                        value: Object.keys(obj).map(function(key) {
                            return {
                                key: key,
                                value: obj[key]
                            };
                        }).sort(function(a, b) {
                            if (a.key < b.key) {
                                return -1;
                            } else if (a.key > b.key) {
                                return 1;
                            }
                            return 0;
                        })
                    };
                }
            default:
                return {
                    type: 'unknown',
                    value: 'type not handled: ' + (typeof obj),
                    display: 'type not handled: ' + (typeof obj)
                }
        }
    }

    function viewModel(params) {
        var value = params.value;
        var browsable = makeBrowsable(value, params.open);
        var open = params.open;
        return {
            value: value,
            level: params.level || 0,
            browsable: browsable,
            open: open
        };
    }

    function icon(name) {
        return span({
            class: 'fa fa-' + name,
            style: {
                fontSize: '80%'
            }
        });
    }

    function template() {
        return div({
            dataBind: {
                style: {
                    'margin-left': 'String(level * 10) + "px"'
                },
                with: 'browsable'
            }
        }, [
            '<!-- ko if: type === "object"-->',
            div({

            }, [
                '<!-- ko if: value.length === 0 -->',
                span({
                    style: {
                        color: 'gray'
                    }
                }, [
                    icon('cube'),
                    ' (empty)'
                ]),
                '<!-- /ko -->',
                '<!-- ko if: value.length !== 0 -->',
                div(div({
                    dataBind: {
                        click: 'function (data) {show(!show());}',
                        style: {
                            color: 'show() ? "red" : "green"'
                        }
                    },
                    class: 'mini-button'
                }, [
                    icon('cube'),
                    ' ',
                    span({
                        dataBind: {
                            ifnot: 'show'
                        }
                    }, icon('plus')),
                    span({
                        dataBind: {
                            if: 'show'
                        }
                    }, icon('minus'))
                ])),
                '<!-- ko if: show-->',
                div({
                    dataBind: {
                        foreach: 'value'
                    }
                }, [
                    div({
                        dataBind: {
                            text: 'key'
                        }
                    }),
                    div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: 'value',
                                    level: '$component.level + 1'
                                }
                            }
                        }
                    })
                ]),
                '<!-- /ko -->',
                '<!-- /ko -->'
            ]),
            '<!-- /ko -->',
            '<!-- ko if: type === "array"-->',
            div({}, [
                '<!-- ko if: value.length === 0 -->',
                span({
                    style: {
                        color: 'gray'
                    }
                }, [
                    icon('list'),
                    ' (empty)'
                ]),
                '<!-- /ko -->',
                '<!-- ko if: value.length !== 0 -->',
                div(div({
                    dataBind: {
                        click: 'function (data) {show(!show());}',
                        style: {
                            color: 'show() ? "red" : "green"'
                        }
                    },
                    class: 'mini-button'
                }, [
                    icon('list'),
                    ' ',
                    span({
                        dataBind: {
                            ifnot: 'show'
                        }
                    }, icon('plus')),
                    span({
                        dataBind: {
                            if: 'show'
                        }
                    }, icon('minus'))
                ])),
                '<!-- ko if: show -->',
                div({
                    dataBind: {
                        foreach: 'value'
                    }
                }, [
                    div([
                        '[',
                        span({
                            dataBind: {
                                text: '$index'
                            }
                        }),
                        ']'
                    ]),
                    div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: '$data',
                                    level: '$component.level + 1'
                                }
                            }
                        }
                    })
                ]),
                '<!-- /ko -->',
                '<!-- /ko -->'
            ]),
            '<!-- /ko -->',
            '<!-- ko if: type === "string"-->',
            div({
                dataBind: {
                    text: 'value'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'green'
                }
            }),
            '<!-- /ko -->',
            '<!-- ko if: type === "number"-->',
            div({
                dataBind: {
                    text: 'String(value)'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'blue'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko if: type === "boolean"-->',
            div({
                dataBind: {
                    text: 'value ? "true" : "false"'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'orange'
                }
            }),
            '<!-- /ko -->',
            '<!-- ko if: type === "null"-->',
            div({
                dataBind: {
                    text: 'display'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'gray'
                }
            }),
            '<!-- /ko -->',
            '<!-- ko if: type === "unknown"-->',
            div({
                dataBind: {
                    text: 'value'
                },
                style: {
                    fontWeight: 'bold',
                    color: 'red'
                }
            }),
            '<!-- /ko -->',

        ]);

        // return div({
        //     dataBind: {
        //         foreach: 'browsable'
        //     }
        // }, [
        //     '<!-- ko if: type === "object"',
        //     div({
        //         dataBind: {
        //             text: 'display'
        //         }
        //     })
        // ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('jgisearch/json-viewer', component());
});