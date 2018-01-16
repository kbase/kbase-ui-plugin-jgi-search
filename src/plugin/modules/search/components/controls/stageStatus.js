/*
A component to display the current status of this file vis-a-vis any existing or past staging jobs.
It should reflect:
- never staged - empty
- currently staging - amber spinner
- has staged 
    - most recent one succeeded, a green checkmark
    - most recent one failure, red x
- gosh, this requires an interesting and potentially expensive query ...
*/
define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    function viewModel(params) {
        var status = ko.observable('none');

        return {
            field: params.field,
            row: params.row,
            status: status
        };
    }

    var styles = html.makeStyles({
    });

    function template() {
        return  div({
        }, [
            styles.sheet,

            '<!-- ko switch: status() -->', 

            '<!-- ko case: "none" -->',
            span(),
            '<!-- /ko -->',

            '<!-- ko case: "not-importable" -->',
            span({
                class: 'fa fa-ban'
            }),
            '<!-- /ko -->',

            '<!-- ko case: "sent" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'silver'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "submitted" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'gray'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "queued" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'orange'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "restoring" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'blue'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "copying" -->',
            div([
                span({
                    class: 'fa fa-spinner fa-pulse fa-fw',
                    style: {
                        color: 'green'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "completed" -->',
            div([
                span({
                    class: 'fa fa-check',
                    style: {
                        color: 'green'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- ko case: "error" -->',
            div([
                span({
                    class: 'fa fa-ban',
                    style: {
                        color: 'red'
                    }
                })                
            ]),
            '<!-- /ko -->',

            '<!-- /ko -->'
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