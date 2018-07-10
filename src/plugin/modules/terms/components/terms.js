define([
    'kb_knockout/registry',
    'marked',
    'kb_common/html',
    'text!../jgiTerms.md'
], function (
    reg,
    marked,
    html,
    jgiTerms
) {
    'use strict';

    const t = html.tag,
        h2 = t('h2'),
        div = t('div'),
        button = t('button'),
        p = t('p');

    class ViewModel {
        constructor(params) {
            this.termsContent= marked(jgiTerms);
            this.jgiTermsAgreed = params.jgiTermsAgreed;
        }

        doAgree() {
            this.jgiTermsAgreed(true);
        }
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
            ])
        ]);
    }
    function component() {
        return {
            viewModel: ViewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
