define([
    'knockout-plus',
    'kb_common/html'
], function(
    ko,
    html
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

        // Simple state used for ui-busy state. Set true when a search api call is begin, 
        // false when it is finished (finally).

        return {
            // The top level searchVM is included so that it can be
            // propagated.
            searchVM: params.searchVM,
            // And we break out fields here for more natural usage (or not??)
            searchInput: searchInput,
            searchResults: searchResults,
            searchTotal: searchTotal,
            searching: searching,
            doSearch: doSearch,
            pageSize: pageSize,
            page: page
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
                class: 'fa fa-search',
                style: {
                    fontSize: '125%',
                    color: '#000'
                },
                dataBind: {
                    style: {
                        color: 'searching() ? "green" : "#000"'
                    }
                }
            }))
        ]));
    }

    function buildSummaryArea() {
        return div({
            class: 'well'
        }, [
            div({
                dataBind: {
                    text: 'searchInput'
                }
            }),
            div([
                span({
                    dataBind: {
                        text: 'searchTotal'
                    }
                }), ' hits'
            ])
        ]);
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
            // buildSummaryArea(),
            buildResultsArea()
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