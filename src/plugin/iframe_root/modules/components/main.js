/*
Top level panel for jgi search
*/
define([
    // global deps
    'knockout',
    // kbase deps
    'kb_lib/html',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    // local deps
    '../lib/utils',
    '../lib/model',
    '../search/viewModel',
    '../search/components/search',
    '../terms/components/terms',
    '../components/searchError'
], function (
    ko,
    html,
    reg,
    gen,
    ViewModelBase,
    utils,
    Model,
    SearchViewModel,
    SearchComponent,
    TermsComponent,
    SearchErrorComponent
) {
    'use strict';

    const t = html.tag,
        div = t('div');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);

            this.showOverlay = context.$root.showOverlay;

            this.runtime = params.runtime;
            this.initialParams = params.initialParams();

            this.model = new Model({
                runtime: this.runtime
            });
            this.status = ko.observable('none');
            this.error = ko.observable();
            this.jgiTermsAgreed = ko.observable(false);

            this.search = new SearchViewModel(
                {
                    error: this.error,
                    showError: this.showError,
                    initialQuery: this.initialParams.q
                },
                context
            );

            // INIT

            this.subscribe(this.jgiTermsAgreed, (newValue) => {
                // save the agreed-to-state in the user's profile.
                this.model.saveJgiAgreement(newValue).spread((result, error) => {
                    if (result) {
                        if (newValue) {
                            this.status('agreed');
                        } else {
                            this.status('needagreement');
                        }
                    } else {
                        this.showError(error);
                    }
                });
            });

            this.model.getJgiAgreement().spread((result, error) => {
                if (result) {
                    if (result.agreed) {
                        this.status('agreed');
                    } else {
                        this.status('needagreement');
                    }
                } else {
                    // show error...
                    this.showError(error);
                }
            });
        }

        showError(err) {
            var stackTrace = [];
            if (err.stack) {
                stackTrace = err.stack.split('\n');
            }

            // Emitted by the search ui or the search backend. Well structured.
            if (err instanceof utils.JGISearchError || err.info) {
                this.error({
                    source: err.source,
                    code: err.code,
                    message: err.message,
                    detail: err.detail,
                    info: err.info,
                    stackTrace: stackTrace
                });
                // Emitted by the rpc library; also well structured but not idiomatic
                // for this plugin. Translate

                // Some other error, but at least an error object.
            } else if (err instanceof Error) {
                this.error({
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
                this.error({
                    code: 'unknown',
                    message: err.message || '',
                    detail: '',
                    info: err || {},
                    stackTrace: stackTrace
                });
            }
            this.showOverlay({
                name: SearchErrorComponent.name(),
                type: 'error',
                params: {
                    type: '"error"',
                    hostVm: 'search'
                },
                viewModel: {
                    error: this.error
                }
            });
        }
    }

    function template() {
        return div(
            {
                style: {
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingRight: '12px',
                    paddingLeft: '12px'
                }
            },
            [
                // possible states:
                // awaiting agreement status
                // agreed
                // not agreed
                // error
                gen.switch('status', [
                    ['"none"', ''],
                    [
                        '"needagreement"',
                        gen.component({
                            name: TermsComponent.name(),
                            params: {
                                jgiTermsAgreed: 'jgiTermsAgreed'
                            }
                        })
                    ],
                    [
                        '"agreed"',
                        gen.component({
                            name: SearchComponent.name(),
                            params: {
                                search: 'search',
                                runtime: 'runtime'
                            }
                        })
                    ],
                    ['"sick"', 'SICK SICK SICK!!!']
                ])
            ]
        );
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
