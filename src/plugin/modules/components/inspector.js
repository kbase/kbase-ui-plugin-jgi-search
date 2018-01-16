define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    '../lib/ui'
], function (
    ko,
    html,
    BS,
    ui
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3');

    function viewModel(params) {
        var details = ko.observable();

        params.getDetail(params.item.id)
            .then(function (resultItem) {
                details(resultItem);
            });
        return {
            details: details,
            onClose: params.onClose
        };
    }

    var styles = html.makeStyles({
        component: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        sectionHeader: {
            css: {
                fontWeight: 'bold'
            }
        }
    });

    function buildProposalInfo() {
        return table({
            class: 'table  table-hover table-condensed',
            dataBind: {
                with: 'proposal'
            }
        }, tbody([
            tr([
                th('Title'),
                td({
                    dataBind: {
                        text: 'title'
                    }
                })
            ]),
            tr([
                th('Id'),
                td({
                    dataBind: {
                        text: 'id'
                    }
                })
            ]),
            tr([
                th('PI'),
                td({
                    dataBind: {
                        text: 'pi.last_name + ", " + pi.first_name'
                    }
                })
            ]),
            tr([
                th('Year'),
                td({
                    dataBind: {
                        text: 'year'
                    }
                })
            ])
        ]));
    }

    function buildSequencingdProjectInfo() {
        return table({
            class: 'table  table-hover table-condensed',
            dataBind: {
                with: 'sequencingProject'
            }
        }, [
            tr([
                th('Name'),
                td({
                    dataBind: {
                        text: 'name'
                    }
                })
            ]),
            tr([
                th('ID'),
                td({
                    dataBind: {
                        text: 'id'
                    }
                })
            ]),
            tr([
                th('Status'),
                td({
                    dataBind: {
                        text: 'status'
                    }
                })
            ]),
            tr([
                th('As of'),
                td({
                    dataBind: {
                        text: 'statusDate'
                    }
                })
            ]),
            tr([
                th('Comments'),
                td({
                    dataBind: {
                        text: 'comments'
                    }
                })
            ]),
            // tr([
            //     th('Year'),
            //     td({
            //         dataBind: {
            //             text: 'year'
            //         }
            //     })
            // ])
        ]);
    }

    function buildAnalysisProjectInfo() {
        return table({
            class: 'table table-hover table-condensed',
            dataBind: {
                with: 'analysisProject'
            }
        }, [
            tr([
                th('Name'),
                td({
                    dataBind: {
                        text: 'name'
                    }
                })
            ]),
            tr([
                th('ID'),
                td({
                    dataBind: {
                        text: 'id'
                    }
                })
            ]),
            tr([
                th('Method'),
                td({
                    dataBind: {
                        text: 'assemblyMethod'
                    }
                })
            ]),
            tr([
                th('Genome type'),
                td({
                    dataBind: {
                        text: 'genomeType'
                    }
                })
            ]),
            tr([
                th('Modified'),
                td({
                    dataBind: {
                        text: 'modificationDate'
                    }
                })
            ]),
            tr([
                th('Comments'),
                td({
                    dataBind: {
                        text: 'comments'
                    }
                })
            ])
        ]);
    }

    function buildProjectView() {
        return div({
            class: 'container-fluid',
            dataBind: {
                with: 'details'
            }
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    h3('Proposal'),
                    '<!-- ko if: proposal -->',
                    buildProposalInfo(),
                    '<!-- /ko -->',
                    '<!-- ko ifnot: proposal -->',
                    div({
                        style: {
                            fontStyle: 'italic',
                            textAlign: 'center'
                        }
                    }, 'No proposal details available'),
                    '<!-- /ko -->'
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('Sequencing Project'),
                    '<!-- ko if: sequencingProject -->',
                    buildSequencingdProjectInfo(),
                    '<!-- /ko -->',
                    '<!-- ko ifnot: sequencingProject -->',
                    div({
                        style: {
                            fontStyle: 'italic',
                            textAlign: 'center'
                        }
                    }, 'No sequencing project details available'),
                    '<!-- /ko -->'
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('Analysis Project'),
                    '<!-- ko if: analysisProject -->',
                    buildAnalysisProjectInfo(),
                    '<!-- /ko -->',
                    '<!-- ko ifnot: analysisProject -->',
                    div({
                        style: {
                            fontStyle: 'italic',
                            textAlign: 'center'
                        }
                    }, 'No analysis project details available'),
                    '<!-- /ko -->'
                ])
            ])
        ]);
    }

    function buildMetadataView() {
        return div({
            dataBind: {
                component: {
                    name: '"generic/json-viewer"',
                    params: {
                        value: 'details().source',
                        open: true
                    }
                }
            },
            style: {
                margin: '4px',
                padding: '4px'
            }
        });
    }

    function buildInspector() {
        return div([
            '<!-- ko ifnot: details() -->',
            html.loading(),
            '<!-- /ko -->',

            '<!-- ko if: details() -->',
            styles.sheet,
            BS.buildTabs({
                tabs: [{
                    id: 'project',
                    title: 'Project',
                    body: buildProjectView()
                },  {
                    id: 'metadata',
                    title: 'Metadata',
                    body: buildMetadataView()
                }]
            }).content,
            '<!-- /ko -->'
        ]);
    }

    function template() {        
        return ui.buildDialog({
            type: 'default',
            title: 'Inspector', 
            body: buildInspector()
        });
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});