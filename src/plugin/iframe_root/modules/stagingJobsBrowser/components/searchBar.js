define(['knockout', 'kb_knockout/registry', 'kb_knockout/lib/generators', 'kb_lib/html', './help'], function (
    ko,
    reg,
    gen,
    html,
    HelpComponent
) {
    'use strict';

    const t = html.tag,
        p = t('p'),
        img = t('img'),
        div = t('div'),
        span = t('span'),
        input = t('input');

    class ViewModel {
        constructor(params, context) {
            this.showOverlay = context['$root'].showOverlay;

            this.search = params.search;
            this.searching = params.searching;

            // Params
            this.logo = params.logo;

            this.showHistory = ko.observable(false);

            this.searchHistory = params.search.searchHistory;

            this.searchControlValue = ko.observable().syncFrom(params.search.searchInput);

            this.searchInputClass = ko.pureComputed(() => {
                if (this.searchControlValue() !== this.search.searchInput()) {
                    return styles.classes.modifiedFilterInput;
                }

                if (this.search.searchInput()) {
                    return styles.classes.activeFilterInput;
                }

                return null;
            });

            this.historyContainerId = html.genId();

            this.clickEventListener = (ev) => {
                this.clickListener(ev);
            };

            document.addEventListener('click', this.clickEventListener, true);
        }

        // Own VM

        doHelp() {
            this.showOverlay({
                name: HelpComponent.name(),
                params: {},
                viewModel: {}
            });
        }

        addToSearchHistory(value) {
            // Do not add empty search values.
            if (!value) {
                return;
            }
            if (value.trim().length === 0) {
                return;
            }

            if (this.searchHistory.indexOf(value) !== -1) {
                return;
            }

            this.searchHistory.unshift(value);

            if (this.searchHistory().length > 10) {
                this.searchHistory.pop();
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

        // This is the obervable in the actual search input.

        useFromHistory(data) {
            this.showHistory(false);
            this.searchControlValue(data);
            this.doRunSearch();
        }

        doToggleHistory() {
            this.showHistory(!this.showHistory());
        }

        doRunSearch() {
            this.addToSearchHistory(this.searchControlValue());
            this.search.searchInput(this.searchControlValue());
        }

        doKeyUp(data, ev) {
            if (ev.key) {
                if (ev.key === 'Enter') {
                    this.doRunSearch();
                }
            } else if (ev.keyCode) {
                if (ev.keyCode === 13) {
                    this.doRunSearch();
                }
            }
        }

        // hack to ensure that clicking in side the history control does not close it!
        clickListener(ev) {
            // We don't want to handle clicks for the history control itself -- either
            // an item in the list or the button. The handlers for these things will do
            // the right thing.
            var elementType = ev.target.getAttribute('data-type');
            if (['history-toggle-button', 'history-toggle-button-icon', 'history-item'].indexOf(elementType) == -1) {
                this.showHistory(false);
            }
            return true;
        }

        doRefreshSearch() {
            this.search.refreshSearch();
        }

        // LIFECYCLE

        dispose() {
            super.dispose();
            if (this.clickEventListener) {
                document.removeEventListener('click', this.clickEventListener, true);
            }
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
        }
    });

    function buildSearchBar() {
        /*
            Builds the search input area using bootstrap styling and layout.
        */
        return div(
            {
                class: 'form'
            },
            div(
                {
                    class: 'input-group'
                },
                [
                    '<!-- ko if: logo -->',
                    div(
                        {
                            class: 'input-group-addon',
                            style: {
                                padding: '0',
                                border: 'none',
                                backgroundColor: 'transparent'
                            }
                        },
                        img({
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
                        })
                    ),
                    '<!-- /ko -->',
                    div(
                        {
                            class: 'input-group-addon ' + styles.classes.addonButton,
                            style: {
                                borderRadius: '4px',
                                borderTopRightRadius: '0',
                                borderBottomRightRadius: '0',
                                paddingLeft: '8px',
                                paddingRight: '8px'
                            },
                            dataBind: {
                                click: 'doRunSearch'
                            }
                        },
                        span(
                            {
                                style: {
                                    display: 'inline-block',
                                    width: '2em',
                                    textAlign: 'center'
                                }
                            },
                            span({
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
                            })
                        )
                    ),
                    div(
                        {
                            class: 'form-control',
                            style: {
                                display: 'inline-block',
                                width: '100%',
                                position: 'relative',
                                padding: '0',
                                border: 'none'
                            }
                        },
                        [
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
                                placeholder: 'Search File Staging Jobs'
                            }),
                            '<!-- ko if: showHistory -->',
                            div(
                                {
                                    class: styles.classes.historyContainer,
                                    dataBind: {
                                        attr: {
                                            id: 'historyContainerId'
                                        }
                                    }
                                },
                                [
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
                                    p(
                                        {
                                            style: {
                                                fontStyle: 'italic'
                                            }
                                        },
                                        'no items in history yet - Search!'
                                    ),
                                    '<!-- /ko -->'
                                ]
                            ),
                            '<!-- /ko -->'
                        ]
                    ),
                    div(
                        {
                            class: 'input-group-addon ' + styles.classes.addonButton,
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
                        },
                        span({
                            dataType: 'history-toggle-button-icon',
                            class: 'fa fa-history'
                        })
                    ),
                    div(
                        {
                            class: 'input-group-addon ' + styles.classes.addonButton,
                            dataType: 'refresh-button',
                            style: {
                                cursor: 'pointer'
                            },
                            dataBind: {
                                click: 'doRefreshSearch',
                                style: {
                                    'background-color': 'searching() ? "silver" : null'
                                }
                            }
                        },
                        span({
                            class: 'fa fa-refresh'
                        })
                    )
                    // div({
                    //     class: 'input-group-addon ' + styles.classes.addonButton,
                    //     style: {
                    //         cursor: 'pointer'
                    //     },
                    //     dataBind: {
                    //         click: 'doHelp'
                    //     }
                    // }, span({
                    //     class: 'fa fa-question'
                    // }))
                ]
            )
        );
    }

    function template() {
        return div({}, [buildSearchBar()]);
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});
