define([
    'kb_knockout/registry',
    'kb_lib/html',
    '../../components/table'
], function (
    reg,
    html,
    TableComponent
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        div = t('div');

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        miniButton: {
            css: {
                padding: '2px',
                border: '2px transparent solid',
                cursor: 'pointer'
            },
            pseudo: {
                hover: {
                    border: '2px white solid'
                },
                active: {
                    border: '2px white solid',
                    backgroundColor: '#555',
                    color: '#FFF'
                }
            }
        }
    });

    class ViewModel {
        constructor(params) {
            this.search = params.search;
            this.table = {
                rows: this.search.searchResults,
                columns: this.search.columns,
                isLoading: this.search.searching,
                pageSize: this.search.pageSize,
                state: this.search.searchState,
                sortBy: this.search.sortBy,
                env: {
                    removeJob: (...args) => {
                        return this.search.removeJob.apply(this.search, args);
                    }
                }
            };
            this.messages = {
                none: div([
                    p('No jobs to display')
                ]),
                notfound: div([
                    p('No jobs to display')
                ])
            };
        }
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            div({
                dataBind: {
                    component: {
                        name: TableComponent.quotedName(),
                        params: {
                            table: 'table',
                            messages: 'messages'
                        }
                    }
                },
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    flex: '1 1 0px'
                }
            })
        ]);
    }

    function component() {
        return {
            viewModel: {
                createViewModel: (params, componentInfo) => {
                    return new ViewModel(params, componentInfo);
                }
            },
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});
