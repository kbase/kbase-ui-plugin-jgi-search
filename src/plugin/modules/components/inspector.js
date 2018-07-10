define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_common/html',
    'kb_common/bootstrapUtils',
    '../lib/ui',
    '../lib/appViewModel'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html,
    BS,
    ui,
    AppViewModel
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        table = t('table'),
        tbody = t('tbody'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3');

    class ViewModel extends ViewModelBase {
        constructor(params, context) {
            super(params);
            this.details = ko.observable();

            const runtime = context.$root.runtime;
            const appViewModel = new AppViewModel({
                runtime: runtime
            });

            appViewModel.getDetail(params.item.id)
                .then((resultItem) => {
                    this.details(resultItem);
                });

            this.parent = context.$parent;
            this.onClose = () => {
                this.parent.bus.send('close');
            };
        }
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
            ])
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
                    gen.if('proposal',
                        buildProposalInfo(),
                        div({
                            style: {
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }
                        }, 'No proposal details available'))
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('Sequencing Project'),
                    gen.if('sequencingProject',
                        buildSequencingdProjectInfo(),
                        div({
                            style: {
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }
                        }, 'No sequencing project details available'))
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
                    gen.if('analysisProject',
                        buildAnalysisProjectInfo(),
                        div({
                            style: {
                                fontStyle: 'italic',
                                textAlign: 'center'
                            }
                        }, 'No analysis project details available'))
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
        return div(
            gen.if('details()',
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
                html.loading()));
    }

    function template() {
        return ui.buildDialog({
            type: 'default',
            title: 'Inspector',
            body: buildInspector(),
            buttons: [
                {
                    label: 'Close',
                    onClick: 'onClose'
                }
            ]
        });
    }

    function component() {
        return {
            viewModelWithContext: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});