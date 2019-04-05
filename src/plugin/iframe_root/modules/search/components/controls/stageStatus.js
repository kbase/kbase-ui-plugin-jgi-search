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
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_lib/html'
], function (
    ko,
    reg,
    gen,
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        div = t('div');

    class ViewModel {
        constructor(params) {
            this.status = ko.observable('none');
            this.field = params.field;
            this.row = params.row;
        }
    }

    var styles = html.makeStyles({
    });

    function template() {
        return  div({
        }, gen.switch('status()', [
            [
                '"none"',
                span()
            ],
            [
                '"not-importable"',
                span({
                    class: 'fa fa-ban'
                }),
            ],
            [
                '"sent"',
                div([
                    span({
                        class: 'fa fa-spinner fa-pulse fa-fw',
                        style: {
                            color: 'silver'
                        }
                    })
                ]),
            ],
            [
                '"submitted"',
                div([
                    span({
                        class: 'fa fa-spinner fa-pulse fa-fw',
                        style: {
                            color: 'gray'
                        }
                    })
                ])
            ],
            [
                '"restoring"',
                div([
                    span({
                        class: 'fa fa-spinner fa-pulse fa-fw',
                        style: {
                            color: 'blue'
                        }
                    })
                ])
            ],
            [
                '"completed"',
                div([
                    span({
                        class: 'fa fa-check',
                        style: {
                            color: 'green'
                        }
                    })
                ])
            ],
            [
                '"copying"',
                div([
                    span({
                        class: 'fa fa-spinner fa-pulse fa-fw',
                        style: {
                            color: 'green'
                        }
                    })
                ])
            ],
            [
                div([
                    span({
                        class: 'fa fa-ban',
                        style: {
                            color: 'red'
                        }
                    })
                ])
            ]
        ]));
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});