define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/ui'
], function(
    ko,
    html,
    ui
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        input = t('input');

    /*
    This view model establishes the primary search context, including the 
    search inputs
    search state
    paging controls
    search results

    sub components will be composed with direct references to any of these vm pieces
    they need to modify or use.
     */
    function viewModel(params) {

        // Unpack the Search VM.
        var searchInput = params.searchVM.searchInput;
        var doSearch = params.searchVM.doSearch;
        var searchResults = params.searchVM.searchResults;
        var searchTotal = params.searchVM.searchTotal;
        var searching = params.searchVM.searching;
        var pageSize = params.searchVM.pageSize;
        var page = params.searchVM.page;

        function doHelp() {
            ui.showDialog({
                title: 'Help',
                body: 'Helpful hints here...'
            });
        }

        // Simple state used for ui-busy state. Set true when a search api call is begin, 
        // false when it is finished (finally).

        return {
            // The top level searchVM is included so that it can be
            // propagated.
            searchVM: params.searchVM,
            search: params.searchVM,
            // And we break out fields here for more natural usage (or not??)
            searchInput: searchInput,
            searchResults: searchResults,
            searchTotal: searchTotal,
            searching: searching,
            pageSize: pageSize,
            page: page,
            // ACTIONS
            doHelp: doHelp,
            doSearch: doSearch
        };
    }

    /*
        Builds the search input area using bootstrap styling and layout.
    */
    function buildInputArea() {
        return div({
            class: 'form'
        }, div({
            class: 'input-group'
        }, [
            input({
                class: 'form-control',
                dataBind: {
                    textInput: 'searchInput',
                    hasFocus: true
                },
                placeholder: 'Search JGI Public Data'
            }),
            div({
                class: 'input-group-addon',
                style: {
                    cursor: 'pointer'
                },
                dataBind: {
                    click: 'doSearch'
                }
            }, span({
                class: 'fa',
                style: {
                    fontSize: '125%',
                    color: '#000',
                    width: '2em'
                },
                dataBind: {
                    // style: {
                    //     color: 'searching() ? "green" : "#000"'
                    // }
                    css: {
                        'fa-search': '!searching()',
                        'fa-spinner fa-pulse': 'searching()',
                    }
                }
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

    function buildResultsArea() {
        return div({
            dataBind: {
                component: {
                    name: '"jgisearch/browser"',
                    params: {
                        searchVM: 'searchVM'
                    }
                }
            }
        });
    }

    function template() {
        return div({}, [
            buildInputArea(),
            '<!-- ko if: search.showResults() -->',
            // '<!-- ko if: search.searchStatus() === "results" || search.searchStatus() === "searching" -->',
            buildResultsArea(),
            '<!-- /ko -->',
            '<!-- ko if: search.noSearch() -->',
            // '<!-- ko if: search.searchStatus() === "nosearch" -->',
            div({
                style: {
                    margin: '10px',
                    border: '1px silver solid',
                    padding: '8px',
                    backgroundColor: 'silver',
                    textAlign: 'center'
                }
            }, 'No active search; to search for files, enter terms above'),
            '<!-- /ko -->',
            // '<!-- ko if: search.searchStatus() === "noresults" -->',
            // 'Sorry, no results',
            // '<!-- /ko -->',
            // '<!-- ko if: search.searchStatus() === "searching" -->',
            // 'searching',
            // '<!-- /ko -->',
            // '<!-- ko if: search.searchStatus() === "error" -->',
            // 'ERROR',
            // '<!-- /ko -->'

        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }
    ko.components.register('jgisearch/search', component());
});