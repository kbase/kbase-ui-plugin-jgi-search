define([
    'knockout-plus',
    'kb_common/html',
    '../../lib/profile'
], function (
    ko,
    html,
    UserProfile
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        img = t('img'),
        div = t('div'),
        span = t('span'),
        input = t('input');

    function viewModel(params) {
        // Params
        var logo = params.logo;

        

        // Own VM

        function doHelp() {
            params.search.showOverlay({
                name: 'jgi-search/search-help',
                params: {},
                viewModel: {}
            });
        }
       
        var showHistory = ko.observable(false);

        var searchHistory = params.search.searchHistory;

        function addToSearchHistory(value) {
            if (searchHistory.indexOf(value) !== -1) {
                return;
            }
            
            searchHistory.push(value);

            if (searchHistory().length > 10) {
                searchHistory.shift();
            }
        }

        

        // When it is updated by either of those methods, we save
        // it in the search history, and also forward the value to
        // the search query.

        // This is the search value the user has commited by clicking
        // the search button or pressing the Enter key.
       
        // var searchInput = ko.observable().syncWith(params.search.searchInput);
        
        // searchInput.subscribe(function (newValue) {
        //     addToSearchHistory(newValue);
        // });

        ko.subscribable.fn.syncFrom = function (targetObservable, callbackTarget, event) {
            var sourceObservable = this; 
            targetObservable.subscribe(function (v) { 
                sourceObservable(v); 
            }, callbackTarget, event); 
            return sourceObservable; 
        };

        // This is the obervable in the actual search input.
        var searchControlValue = ko.observable().syncFrom(params.search.searchInput);

        function useFromHistory(data) {
            showHistory(false);
            searchControlValue(data);
            doRunSearch();
        }

        function doToggleHistory() {
            showHistory(!showHistory());
        }

        var searchInputClass = ko.pureComputed(function () {
            if (searchControlValue() !== params.search.searchInput()) {
                return styles.classes.modifiedFilterInput;
            }

            if (params.search.searchInput()) {
                return styles.classes.activeFilterInput;
            }

            return null;
        });

        function doRunSearch() {
            addToSearchHistory(searchControlValue());
            params.search.searchInput(searchControlValue());
        }

        function doKeyUp(data, ev) {
            if (ev.key) {
                if (ev.key === 'Enter') {
                    doRunSearch();
                }
            } else if (ev.keyCode) {
                if (ev.keyCode === 13) {
                    doRunSearch();
                }
            }
        }

        // hack to ensure that clicking in side the history control does not close it!
        var historyContainerId = html.genId();

        function clickListener (ev) {
            // in history container?
            var t = ev.target;
            if (t.getAttribute('data-type') === 'history-item') {
                return true;
            }
            if (t.getAttribute('data-type') === 'history-toggle-button') {
                return true;
            }

            if (showHistory()) {
                showHistory(false);
            }
            return true;
        }

        document.addEventListener('click', clickListener, true);

        function dispose() {
            if (clickListener) {
                document.removeEventListener('click', clickListener, true);
            }
        }

        return {
            logo: logo,
            // The top level search is included so that it can be
            // propagated.
            search: params.search,
            // And we break out fields here for more natural usage (or not??)
            searchControlValue: searchControlValue,
            searching: params.search.searching,

            showHistory: showHistory,
            doToggleHistory: doToggleHistory,

            useFromHistory: useFromHistory,
            searchHistory: searchHistory,
            searchInputClass: searchInputClass,

            historyContainerId: historyContainerId,

            // ACTIONS
            doHelp: doHelp,
            doRunSearch: doRunSearch,
            doKeyUp: doKeyUp,

            // LIFECYCLE
            dispose: dispose
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
        }
    });

    function buildSearchBar() {
        /*
            Builds the search input area using bootstrap styling and layout.
        */
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            '<!-- ko if: logo -->',
            div({
                class: 'input-group-addon',
                style: {
                    padding: '0',
                    border: 'none',
                    backgroundColor: 'transparent'
                }
            }, img({
                dataBind: {
                    attr: {
                        src: 'logo'
                    }
                },
                style: {
                    display: 'inline',
                    height: '30px',
                    marginRight: '6px'
                }
            })),
            '<!-- /ko -->',
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer',
                    borderRadius: '4px',
                    borderTopRightRadius: '0',
                    borderBottomRightRadius: '0',
                    paddingLeft: '8px',
                    paddingRight: '8px'
                },
                dataBind: {
                    click: 'doRunSearch'
                }
            }, span({
                style: {
                    display: 'inline-block',
                    width: '2em',
                    textAlign: 'center'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '100%',
                    color: '#000'
                },
                dataBind: {
                    css: {
                        'fa-search': '!searching()',
                        'fa-spinner fa-pulse': 'searching()'
                    }
                }
            }))),
            div({
                class: 'form-control',
                style: {
                    display: 'inline-block',
                    width: '100%',
                    position: 'relative',
                    padding: '0',
                    border: 'none'
                }
            }, [
                input({
                    class: 'form-control',                   
                    dataBind: {
                        textInput: 'searchControlValue',
                        // value: 'searchInput',
                        hasFocus: true,
                        // css: 'searchInput() ? "' + styles.classes.activeFilterInput + '" : null',
                        css: 'searchInputClass',
                        event: {
                            keyup: 'doKeyUp'
                        }
                    },
                    placeholder: 'Search JGI Data'
                }),
                '<!-- ko if: showHistory -->',
                div({
                    class: styles.classes.historyContainer,
                    dataBind: {
                        attr: {
                            id: 'historyContainerId'
                        }
                    }
                }, [
                    '<!-- ko if: searchHistory().length > 0 -->',
                    '<!-- ko foreach: searchHistory -->',                    
                    div({
                        dataBind: {
                            text: '$data',
                            click: '$component.useFromHistory'
                        },
                        class: styles.classes.historyItem,
                        dataType: 'history-item'
                    }),
                    '<!-- /ko -->',
                    '<!-- /ko -->',
                    '<!-- ko ifnot: searchHistory().length > 0 -->',
                    p({
                        style: {
                            fontStyle: 'italic'
                        }
                    }, 'no items in history yet - Search!'),
                    '<!-- /ko -->',
                ]),
                '<!-- /ko -->'
            ]),
            div({
                class: 'input-group-addon',
                dataType: 'history-toggle-button',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doToggleHistory',
                    style: {
                        'background-color': 'showHistory() ? "silver" : null'
                    }
                }
            }, span({
                class: 'fa fa-history'
            })),
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doHelp'
                }
            }, span({
                class: 'fa fa-info'
            }))
        ]));
    }

    function template() {
        return div({}, [
            styles.sheet,
            buildSearchBar()
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});