define([
    'kb_common/html'
], function(
    html 
) {
    'use strict';

    var t = html.tag,
        div = t('div');

    function viewModel(params) {        
        return { };
    }

    function template() {
        return div({
            class: 'form-inline',
            style: {
                display: 'inline-block'
            }
        }, [
            'paging bar will be here...'
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