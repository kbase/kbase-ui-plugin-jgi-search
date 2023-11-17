define(['knockout', 'kb_knockout/registry', 'kb_lib/html'], function (ko, reg, html) {
    'use strict';
    const t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a');

    /*
    params are:
        searchInput
        searchHistory
    */
    class ViewModel {
        constructor(params) {
            this.searchInputQueryValue = ko.pureComputed(function () {
                return encodeURIComponent(params.searchInput() || '');
            });
        }
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px'
        },
        activeFilterInput: {
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        },
        modifiedFilterInput: {
            backgroundColor: 'rgba(255, 245, 158, 1)',
            color: '#000'
        },
        historyContainer: {
            display: 'block',
            position: 'absolute',
            border: '1px silver solid',
            backgroundColor: 'rgba(255,255,255,0.9)',
            zIndex: '3',
            top: '100%',
            left: '0',
            right: '0'
        },
        historyItem: {
            css: {
                padding: '3px',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                }
            }
        },
        addonButton: {
            css: {
                color: 'black',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    backgroundColor: 'silver'
                },
                active: {
                    backgroundColor: 'gray',
                    color: 'white'
                }
            }
        },
        addonButtonDisabled: {
            css: {
                color: 'gray',
                cursor: 'normal'
            }
        },
        warningContainer: {
            display: 'block',
            position: 'absolute',
            border: '1px silver solid',
            // from bootstrap's bg-warning default color
            backgroundColor: '#fcf8e3',
            zIndex: '3',
            top: '100%',
            left: '0',
            right: '0'
        },
        navBar: {
            css: {
                // marginLeft: '20px',
                borderBottom: '1px rgba(200, 200, 200, 1) solid'
            }
        },
        selectedNavLink: {
            css: {
                display: 'inline-block',
                padding: '4px 8px',
                margin: '0 8px 0 8px',
                cursor: 'pointer',
                verticalAlign: 'center',
                border: '1px rgba(200, 200, 200, 1) solid',
                marginBottom: '-1px',
                borderBottom: '1px white solid'
            }
        },
        navLink: {
            css: {
                display: 'inline-block',
                padding: '4px 8px',
                margin: '0 8px 0 8px',
                cursor: 'pointer',
                verticalAlign: 'center',
                border: '1px rgba(200, 200, 200, 0.5) solid',
                borderBottom: 'none',
                backgroundColor: '#DDD',
                opacity: '0.8'
            },
            pseudo: {
                hover: {
                    backgroundColor: '#FFF',
                    opacity: '1'
                }
            }
        },
        label: {
            css: {
                fontWeight: 'bold',
                color: 'gray',
                marginRight: '4px'
            }
        }
    });

    function buildNavBar() {
        return div(
            {
                class: styles.classes.navBar
            },
            [
                span(
                    {
                        class: styles.classes.label
                    },
                    'Search:'
                ),
                a(
                    {
                        class: styles.classes.navLink,
                        dataBind: {
                            attr: {
                                href: '"/#search&q=" + searchInputQueryValue()',
                                target: '"_top"'
                            }
                        }
                    },
                    'KBase - User Data, Genome Features, Reference Data'
                ),
                span(
                    {
                        class: styles.classes.selectedNavLink
                    },
                    'JGI'
                )
            ]
        );
    }

    function template() {
        return div(
            {
                class: styles.classes.component,
                dataKBTesthookComponent: 'nav-bar'
            },
            [
                div(
                    {
                        styles: {
                            flex: '1 1 0px'
                        }
                    },
                    buildNavBar()
                )
            ]
        );
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});
