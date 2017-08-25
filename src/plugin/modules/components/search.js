define([
    'knockout-plus',
    'bluebird',
    'kb_common/html',
    'kb_common/ui',
    'yaml!../helpData.yml'
], function (
    ko,
    Promise,
    html,
    ui,
    helpData
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div'),
        span = t('span'),
        button = t('button'),
        input = t('input');

    function buildHelpDialog(title) {
        return div({
            class: 'modal fade',
            tabindex: '-1',
            role: 'dialog'
        }, [
            div({ class: 'modal-dialog' }, [
                div({ class: 'modal-content' }, [
                    div({ class: 'modal-header' }, [
                        button({
                            type: 'button',
                            class: 'close',
                            // dataDismiss: 'modal',
                            ariaLabel: 'Done',
                            dataBind: {
                                click: 'close'
                            }
                        }, [
                            span({ ariaHidden: 'true' }, '&times;')
                        ]),
                        span({ class: 'modal-title' }, title)
                    ]),
                    div({ class: 'modal-body' }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"help"',
                                    params: {
                                        helpDb: 'helpDb'
                                    }
                                }
                            }
                        })
                    ]),
                    div({ class: 'modal-footer' }, [
                        button({
                            type: 'button',
                            class: 'btn btn-default',
                            // dataDismiss: 'modal',
                            // dataElement: 'ok',
                            dataBind: {
                                click: 'close'
                            }
                        }, 'Done')
                    ])
                ])
            ])
        ]);
    }

    function helpVM(node) {
        // var helpTopics = helpData.topics.map(function(topic) {
        //     return {
        //         id: topic.id,
        //         title: topic.title,
        //         content: topic.content
        //             // content: topic.content.map(function(paragraph) {
        //             //     return p(paragraph);
        //             // }).join('\n')
        //     };
        // });

        function close() {
            var backdrop = document.querySelector('.modal-backdrop');
            backdrop.parentElement.removeChild(backdrop);
            node.parentElement.removeChild(node);
        }

        return {
            helpDb: helpData,
            close: close
        };
    }

    function showHelpDialog() {
        var dialog = buildHelpDialog('JGI Search Help'),
            dialogId = html.genId(),
            helpNode = document.createElement('div'),
            kbaseNode, modalNode, modalDialogNode;

        helpNode.id = dialogId;
        helpNode.innerHTML = dialog;

        // top level element for kbase usage
        kbaseNode = document.querySelector('[data-element="kbase"]');
        if (!kbaseNode) {
            kbaseNode = document.createElement('div');
            kbaseNode.setAttribute('data-element', 'kbase');
            document.body.appendChild(kbaseNode);
        }

        // a node upon which to place Bootstrap modals.
        modalNode = kbaseNode.querySelector('[data-element="modal"]');
        if (!modalNode) {
            modalNode = document.createElement('div');
            modalNode.setAttribute('data-element', 'modal');
            kbaseNode.appendChild(modalNode);
        }

        modalNode.appendChild(helpNode);

        var backdropNode = document.createElement('div');
        backdropNode.classList.add('modal-backdrop', 'fade', 'in');
        document.body.appendChild(backdropNode);

        ko.applyBindings(helpVM(modalNode), helpNode);
        modalDialogNode = modalNode.querySelector('.modal');
        modalDialogNode.classList.add('in');
        modalDialogNode.style.display = 'block';
    }

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
            showHelpDialog();
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
    return component;
});