define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        button = t('button'),    
        div = t('div'),
        span = t('span'),
        table = t('table'),
        colgroup = t('colgroup'),
        col = t('col'),
        thead = t('thead'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function viewModel(params) {
        var stagingJobs = params.stagingJobs;

        return {
            stagingJobs: stagingJobs,
            onClose: params.onClose
        };
    }

    function buildJobsTable() {
        return table({
            class: ['table table-striped']
        }, [
            colgroup([
                col({
                    style: {
                        width: '10%'
                    }
                }),
                col({
                    style: {
                        width: '15%'
                    }
                }),
                col({
                    style: {
                        width: '15%'
                    }
                }),
                col({
                    style: {
                        width: '50%'
                    }
                }),
                col({
                    style: {
                        width: '10%'
                    }
                })
            ]),
            thead(
                tr([
                    th('Started'),
                    th('Status'),
                    th(''),
                    th('Filename'),
                    th('JobId')
                ])
            ),
            tbody([
                '<!-- ko foreach: stagingJobs -->',
                tr([
                    td({
                        dataBind: {
                            typedText: {
                                'type': '"date"',
                                'format': '"YYYY/MM/DD"',
                                'value': 'started'
                            }
                        }
                    }),
                    td({
                        dataBind:{
                            component: {
                                name: '"jgi-search/staging-status-indicator"',
                                params: {
                                    status: 'status',
                                    verbose: 'true'
                                }
                            }
                        }
                    }),
                    td([
                        '<!-- ko if: status() !== "completed" && status() !== "error" -->',
                        // show elapsed time since started if still running
                        span({
                            dataBind: {
                                component: {
                                    name: '"generic/elapsed-clock"',
                                    params: {
                                        type: '"elapsed"',
                                        startTime: 'started'
                                    }
                                }
                            }
                        }),
                        // span({
                        //     dataBind: {
                        //         typedText: {
                        //             'type': '"date"',
                        //             'format': '"nice-elapsed"',
                        //             'value': 'started'
                        //         }
                        //     }
                        // }),
                        '<!-- /ko -->',
                        '<!-- ko if: status() === "completed" || status() === "error" -->',
                        // show the elapsed time between started and updated (which is frozen when completed or errored)
                        span({
                            dataBind: {
                                typedText: {
                                    'type': '"date"',
                                    'format': '"duration"',
                                    'value': 'elapsed'
                                }
                            }
                        }),
                        '<!-- /ko -->'
                    ]),
                    td({
                        dataBind: {
                            text: 'filename'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'jobId'
                        }
                    })
                ]),
                '<!-- /ko -->'                
            ])
        ]);
    }

    function buildDialog(title, body) {
        return div({
        }, [
            // title
            div({
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px',
                    borderBottom: '1px green solid'
                }
            }, title),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                }
            }, body),
            // buttons
            div({
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                dataBind: {
                    click: 'onClose'
                }
            }, 'Close')),

        ]);
    }

    function template() {
        return div([
            '<!-- ko if: stagingJobs().length > 0 -->',
            buildDialog('Staging Jobs', buildJobsTable()),
            '<!-- /ko -->',
            '<!-- ko ifnot: stagingJobs().length > 0 -->',
            buildDialog('Staging Jobs', 'Sorry, no current jobs to view'),
            '<!-- /ko -->'
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