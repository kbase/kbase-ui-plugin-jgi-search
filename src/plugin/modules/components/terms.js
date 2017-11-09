define([
    'knockout-plus',
    'marked',
    'kb_common/html',
    'text!../jgiTerms.md'
], function (
    ko,
    marked,
    html,
    jgiTerms
) {
    'use strict';

    var t = html.tag,
        h2 = t('h2'),
        div = t('div'),
        button = t('button'),
        p = t('p');

    function viewModel(params) {
        var search = params.search;

        var termsContent= marked(jgiTerms);

        function doAgree() {
            search.jgiTermsAgreed(true);
        }

        return {
            search: search,
            termsContent: termsContent,
            doAgree: doAgree
        };

    }
    function template() {
        return div({
            class: 'component-terms'
        }, [
            h2('JGI Data Terms and Conditions'),
            p([
                'Dear User: Before utilizing the JGI Search tool, we ask that ',
                'you agree to the terms and conditions for utilizing this data.'
            ]),
            p([
                'Your agreement to the terms and conditions will be stored in ',
                'your user account and you will not be required to agree in the ',
                'future.'
            ]),
            div({
                dataBind: {
                    html: 'termsContent'
                },
                class: 'terms-content'
            }),
            div({
                style: {
                    textAlign: 'center',
                    marginTop: '12px'
                }
            }, [
                button({
                    type: 'button',
                    class: 'btn btn-primary',
                    dataBind: {
                        click: 'doAgree'
                    }
                }, 'Agree')
                // button({
                //     type: 'button',
                //     class: 'btn btn-danger',
                //     dataBind: {
                //         click: 'doCancel'
                //     }
                // }, 'Cancel')
            ])
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
