define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a');
        

    /*
    params are:
        searchInput
        searchHistory
    */
    function viewModel() {
        return {
           
        };
    }

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
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
                marginLeft: '20px'
            }
        },
        navLink: {
            css: {
                padding: '4px'
            }
        },
        label: {
            css: {
                fontWeight: 'bold',
                color: 'gray'
            }
        }
    });
  

    function buildNavBar() {
        return div({
            class:  styles.classes.navBar
        }, [
            span({
                class: styles.classes.label
            }, 'Search:'),
            span({
                class: styles.classes.navLink
            }, 'JGI'), 
            a({
                class: styles.classes.navLink,
                href: '#search'
            }, 'KBase'),
            ' ',
            a({
                class: styles.classes.navLink,
                href: '#search?tab=reference-data'
            }, 'Reference Data')
        ]);
    }

    function template() {
        return div({
            class: styles.classes.component,
            dataKBTesthookComponent: 'nav-bar'
        }, [
            div({
                styles: {
                    flex: '1 1 0px'
                }
            }, buildNavBar())
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});