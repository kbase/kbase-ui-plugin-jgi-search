define([
    'knockout-plus',
    'kb_common/html',
    '../../components/table'
], function (
    ko,
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

    function viewModel(params) {
        var search = params.search;

        // console.log('in result?', params);

        // function sortBy(column) {
        //     // fake for now...
        //     if (!column.sort) {
        //         return;
        //     }
        //     if (!column.sort.active()) {
        //         column.sort.active(true);
        //     }

        //     if (column.sort.direction() === 'ascending') {
        //         column.sort.direction('descending');
        //     } else {
        //         column.sort.direction('ascending');
        //     }
           
        //     search.sortBy(column.sort);
        // }

        // search.searchResults.subscribe(function (newValue) {
        //     console.log('got the change...', newValue);
        // });

        return {
            table: {
                rows: search.searchResults,
                columns: search.columns,
                isLoading: search.searching,
                pageSize: search.pageSize,
                state: search.searchState,
                sortBy: search.sortBy,
                env: {
                    removeJob: search.removeJob
                }
            },
            messages: {
                none: div([
                    p('No jobs to display')
                ]),
                notfound: div([
                    p('No jobs to display')
                ])
            }
        };
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
                createViewModel: viewModel
            },
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});
