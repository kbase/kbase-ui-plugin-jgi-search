/*
Top level panel for jgi search
*/
define([
    // global deps
    'bluebird',
    'knockout-plus',
    'numeral',
    'marked',
    // kbase deps
    'kb_common/html',
    // local deps
    '../errorWidget',
    '../lib/utils',
    '../search/data',
    '../search/viewModel',
    '../search/components/search',
    '../terms/components/terms',
    '../components/searchError'
], function (
    Promise,
    ko,
    numeral,
    marked,
    html,
    ErrorWidget,
    utils,
    Data,
    SearchVm,
    SearchComponent,
    TermsComponent,
    SearchErrorComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div');
   
    function viewModel(params) {
        var runtime = params.runtime;
        var subscriptions = ko.kb.SubscriptionManager.make();        

        var data = Data.make({
            runtime: runtime
        });

        // STATUS

        var status = ko.observable('none');

        // ERROR

        var error = ko.observable();
        function showError(err) {
            var stackTrace = [];
            if (err.stack) {
                stackTrace = err.stack.split('\n');
            }

            // Emitted by the search ui or the search backend. Well structured.
            if (err instanceof utils.JGISearchError || err.info) {
                error({
                    source: err.source,
                    code: err.code,
                    message: err.message,
                    detail: err.detail,
                    info: err.info,
                    stackTrace: stackTrace
                });
            // Emitted by the rpc library; also well structured but not idiomatic
            // for this plugin. Translate
            // } else if (err instanceof RequestError) {

            // Some other error, but at least an error object.
            } else if (err instanceof Error) {
                error({
                    code: 'error',
                    message: err.name + ': ' + err.message,
                    detail: 'trace here',
                    info: {
                        stackTrace: err.stack.split('\n')
                    },
                    stackTrace: stackTrace
                });
            // Some other object altogether
            } else {
                error({
                    code: 'unknown',
                    message: err.message || '',
                    detail: '',
                    info: err || {},
                    stackTrace: stackTrace
                });
            }
            showOverlay({
                name: SearchErrorComponent.name(),
                type: 'error',
                params: {
                    type: '"error"',
                    hostVm: 'search'
                },
                viewModel: {
                    error: error
                }
            });
        }
        

        // TERMS AND AGREEMENT
 
        var jgiTermsAgreed = ko.observable(false);

        subscriptions.add(jgiTermsAgreed.subscribe(function (newValue) {
            // save the agreed-to-state in the user's profile.
            data.saveJgiAgreement(newValue)
                .spread(function (result, error) {
                    if (result) {
                        if (newValue) {
                            status('agreed');
                        } else {
                            status('needagreement');
                        }
                    } else {
                        showError(error);
                    }
                });
        }));

        data.getJgiAgreement()
            .spread(function (result, error) {
                if (result) {
                    if (result.agreed) {
                        status('agreed');
                    } else {
                        status('needagreement');
                    }
                } else {
                    // show error...
                    showError(error);
                }
            });


        // OVERLAY

        // OVERLAY integration

        var overlayComponent = ko.observable();
    
        var showOverlay = ko.observable();

        subscriptions.add(showOverlay.subscribe(function (newValue) {
            overlayComponent(newValue);
        }));

        // SEARCH

        // TODO: make better!
        // console.log('params.initialParams', params.initialParams);
        var initialParams = params.initialParams();
        // if (params.initialParams.q) {
        //     initialParams.query = initialParams.q;
        // }

        var searchVm = SearchVm.make({
            runtime: runtime,
            error: error,
            showError: showError,
            showOverlay: showOverlay,
            initialQuery: initialParams.q
        });

        function dispose() {
            searchVm.stop();
            searchVm.dispose();
            subscriptions.dispose();
        }

        searchVm.start();

        var vm = {
            search: searchVm,
            overlayComponent: overlayComponent,
            jgiTermsAgreed: jgiTermsAgreed,
            dispose: dispose,
            status: status
        };
        return vm;
    }

    function template() {
        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column',
                paddingRight: '12px',
                paddingLeft: '12px'
            }
        }, [
            '<!-- ko switch: status -->',
            // possible states:
            // awaiting agreement status
            // agreed
            // not agreed
            // error

            '<!-- ko case: "none" -->', 
            // 'loading...',
            '<!-- /ko -->',

            '<!-- ko case: "needagreement" -->', 
            // '<!-- ko ifnot: $component.search.jgiTermsAgreed() -->',
            ko.kb.komponent({
                name: TermsComponent.name(),
                params: {
                    jgiTermsAgreed: 'jgiTermsAgreed'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko case: "agreed" -->', 
            // '<!-- ko if: $component.search.jgiTermsAgreed() -->',
            ko.kb.komponent({
                name: SearchComponent.name(),
                params: {
                    search: 'search'
                }
            }),
            '<!-- /ko -->',

            '<!-- ko case: "sick" -->',
            'SICK SICK SICK!!!',
            '<!-- /ko -->',

            '<!-- /ko -->',
            ko.kb.komponent({
                name: 'generic/overlay-panel-bootstrappish',
                params: {
                    component: 'overlayComponent',
                    hostVm: 'search'
                }
            })
        ]);
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});
