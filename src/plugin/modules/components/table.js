define([
    'knockout-plus',
    'kb_common/html'
], function (
    ko,
    html
) {
    'use strict';
    var t = html.tag,
        div = t('div'),
        span = t('span'),
        a = t('a');

    var styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        header: {
            flex: '0 0 50px'
        },
        body: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
        },
        headerRow: {
            flex: '0 0 35px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'gray',
            color: 'white'
        },
        tableBody: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        itemRows: {
            css: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        },
        itemRow: {
            css: {
                flex: '0 0 35px',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            },
            pseudo: {
                hover: {
                    backgroundColor: '#CCC',
                    cursor: 'pointer'
                }
            }
        },
        itemRowActive: {
            backgroundColor: '#DDD'
        },
        searchLink: {
            css: {
                textDecoration: 'underline'
            },
            pseudo: {
                hover: {
                    textDecoration: 'underline',
                    backgroundColor: '#EEE',
                    cursor: 'pointer'
                }
            }
        },
        // cell: {
        //     styles: {
        //         flex: '1 1 0px'
        //     }
        // },
        cell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            // textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        },
        headerCell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            // textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
        },
        innerCell: {
            flex: '1 1 0px',
            // display: 'flex',
            // flexDirection: 'column',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        },
        // titleCell: {
        //     flexBasis: '22%'
        // },
        // piCell: {
        //     css: {
        //         flexBasis: '10%'
        //     }
        // },
        // cellLink: {
        //     pseudo: {
        //         hover: {
        //             textDecoration: 'underline',
        //             backgroundColor: '#EEE',
        //             cursor: 'pointer'
        //         }
        //     }
        // },
        // proposalId: {
        //     flexBasis: '5%',
        //     textAlign: 'right',
        //     paddingRight: '3px'
        // },
        // sequencingProjectId: {
        //     css: {
        //         flexBasis: '5%',
        //         textAlign: 'right',
        //         paddingRight: '3px'
        //     },
        //     pseudo: {
        //         hover: {
        //             textDecoration: 'underline',
        //             backgroundColor: '#EEE',
        //             cursor: 'pointer'
        //         }
        //     }
        // },
        // pmoProjectId: {
        //     css: {
        //         flexBasis: '5%',
        //         textAlign: 'right',
        //         paddingRight: '3px',
        //         fontStyle: 'italic',
        //         color: 'gray'
        //     }
        // },
        // // analysisProjectId: {
        // //     flexBasis: '7%',
        // //     textAlign: 'right',
        // //     paddingRight: '3px'
        // // },

        // dateCell: {
        //     flexBasis: '10%'
        // },
        // scientificNameCell: {
        //     flexBasis: '17%'
        // },
        // dataTypeCell: {
        //     flexBasis: '5%'
        // },
        // s1Cell: {
        //     flexBasis: '7%'
        // },
        // s2Cell: {
        //     flexBasis: '7%'
        // },
        // // s3Cell: {
        // //     flexBasis: '5%'
        // // },
        // fileSizeCell: {
        //     flexBasis: '7%'
        // },
        // transferCell: {
        //     flexBasis: '5%',
        //     textAlign: 'center'
        // },
        sectionHeader: {
            padding: '4px',
            fontWeight: 'bold',
            color: '#FFF',
            backgroundColor: '#888'
        },
        selected: {
            backgroundColor: '#CCC'
        },
        private: {
            backgroundColor: 'green'
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

    function viewModel(params, componentInfo) {
        var table = params.table;
        var columns = table.columns;
        // calculate widths...
        var totalWidth = columns.reduce(function (tw, column) {
            return tw + column.width;
        }, 0);
        var columnsMap = columns.reduce(function (map, column) {
            var width = String(100 * column.width / totalWidth) + '%';

            // Header column style
            var s = column.headerStyle || {};
            s.flexBasis = width;
            column.headerStyle = s;

            // Row column style
            s = column.rowStyle || {};
            s.flexBasis = width;
            column.rowStyle = s;

            map[column.name] = column;
            return map;
        }, {});


        var sortColumn = ko.observable('timestamp');

        var sortDirection = ko.observable('descending');

        function doSort(data) {
            console.log('woudl sort...', data);
        }

        // function doSort(data) {
        //     var columnName = data.name;
        //     if (columnName === sortColumn()) {
        //         if (sortDirection() === 'ascending') {
        //             sortDirection('descending');
        //         } else {
        //             sortDirection('ascending');
        //         }
        //     } else {
        //         sortColumn(columnName);
        //         sortDirection(columnsMap[columnName].sort.direction);
        //     }

        //     var column = columnsMap[columnName];

        //     // Maybe do this through a subscription to the individual 
        //     // observables...
        //     var sortRule = {
        //         is_timestamp: column.sort.isTimestamp ? 1 : 0,
        //         is_object_name: column.sort.isObjectName ? 1 : 0,
        //         key_name: column.sort.keyName,
        //         descending: sortDirection() === 'descending' ? 1 : 0
        //     };
        //     params.search.sortingRules.removeAll();
        //     params.search.sortingRules.push(sortRule);
        // }

        // AUTO SIZING

        // we hinge upon the height, which is updated when we start and when the ...
        var height = ko.observable();
        
        
        function calcHeight() {
            return componentInfo.element.querySelector('.' + styles.classes.tableBody).clientHeight;
        }
        
        // A cheap delay to avoid excessive resizing.
        var resizerTimeout = 200;
        var resizerTimer = null;
        function resizer() {
            if (resizerTimer) {
                return;
            }
            window.setTimeout(function () {
                resizerTimer = null;
                height(calcHeight());
            }, resizerTimeout);
        }
        window.addEventListener('resize', resizer, false);

        var rowHeight = 35;

        height.subscribe(function (newValue) {
            if (!newValue) {
                table.pageSize(null);
            }            
            var rows = Math.floor(newValue / rowHeight);
            table.pageSize(rows);
        });        

        // Calculate the height immediately upon component load
        height(calcHeight());

        table.rows.subscribe(function () {
            // console.log('table rows??', table.rows());
            
        });

        function doOpenUrl(data) {
            if (!data.url) {
                console.warn('No url for this column, won\'t open it');
                return;
            }
            window.open(data.url, '_blank');
        }

        function doRowAction(data) {
            if (table.rowAction) {
                table.rowAction(data);
            } else {
                console.warn('No row action...', table, data);
            }
        }
        
        return {
            rows: table.rows,
            isLoading: table.isLoading,
            columns: columns,
            doSort: doSort,
            sortColumn: sortColumn,
            sortDirection: sortDirection,
            state: table.state,
            doOpenUrl: doOpenUrl,
            doRowAction: doRowAction
        };
    }

    function buildResultsHeader() {
        return  div({
            class: styles.classes.headerRow,
            dataBind: {
                foreach: {
                    data: '$component.columns',
                    as: '"column"'
                }
            }
        }, div({
            dataBind: {
                style: 'column.headerStyle'
            },
            class: [styles.classes.headerCell]
        }, [
            div({
                class: [styles.classes.innerCell]
            }, [
                '<!-- ko if: column.sort -->',
                
                '<!-- ko if: $component.sortColumn() !== column.name -->',
                span({
                    class: 'fa fa-sort'
                }),
                '<!-- /ko -->',
                '<!-- ko if: $component.sortColumn() === column.name -->',
                '<!-- ko if: $component.sortDirection() === "descending" -->',
                span({
                    class: 'fa fa-sort-desc'
                }),
                '<!-- /ko -->',
                '<!-- ko if: $component.sortDirection() === "ascending" -->',
                span({
                    class: 'fa fa-sort-asc'
                }),
                '<!-- /ko -->',
                '<!-- /ko -->',

                span({
                    dataBind: {
                        text: 'column.label',
                        click: '$component.doSort'
                    },
                    style: {
                        cursor: 'pointer',
                        marginLeft: '2px'
                    },
                }),
                '<!-- /ko -->',
                '<!-- ko if: !column.sort -->',
                span({
                    dataBind: {
                        text: 'column.label'
                    }
                }),
                '<!-- /ko -->'
            ])
        ]));
    }

    function buildColValue() {
        return [
            '<!-- ko if: row[column.name].action -->',
            span({
                dataBind: {
                    typedText: {
                        value: 'row[column.name].value',
                        type: 'column.type',
                        format: 'column.format',
                        click: '$component[rowl[column.name].action]'
                    },
                    attr: {
                        title: 'row[column.name].info'
                    }
                }
            }),
            '<!-- /ko -->',

            '<!-- ko ifnot: row[column.name].action -->',

            '<!-- ko if: row[column.name].url -->',
            a({
                dataBind: {
                    typedText: {
                        value: 'row[column.name].value',
                        type: 'column.type',
                        format: 'column.format'
                    },
                    attr: {
                        title: 'row[column.name].info'
                    },
                    click: 'function () {$component.doOpenUrl(row[column.name]);}',
                    clickBubble: 'false'
                }
            }),            
            '<!-- /ko -->',
            
            '<!-- ko ifnot: row[column.name].url -->',
            span({
                dataBind: {
                    typedText: {
                        value: 'row[column.name].value',
                        type: 'column.type',
                        format: 'column.format'
                    },
                    attr: {
                        title: 'row[column.name].info'
                    }
                }
            }),
            '<!-- /ko -->',
            
            '<!-- /ko -->',
        ];
    }

    function buildResultsRows() {
        var rowClass = {};
        rowClass[styles.classes.selected] = 'selected()';
        rowClass[styles.classes.private] = '!isPublic';
        return div({
            dataBind: {
                foreach: {
                    data: 'rows',
                    as: '"row"'
                }
            },
            class: styles.classes.itemRows
        }, [
            div({
                dataBind: {
                    foreach: {
                        data: '$component.columns',
                        as: '"column"'
                    },
                    css: rowClass,
                    click: '$component.doRowAction'
                },
                class: styles.classes.itemRow
            }, [
                div({
                    dataBind: {
                        style: 'column.rowStyle'
                    },
                    class: [styles.classes.cell]
                },  div({
                    class: [styles.classes.innerCell]
                }, [
                    // ACTION COLUMN
                    '<!-- ko if: column.action -->',

                    '<!-- ko if: row[column.name] -->',
                    a({
                        dataBind: {
                            typedText: {
                                value: 'row[column.name].value',
                                type: 'column.type',
                                format: 'column.format'
                            },
                            click: 'function () {column.action.fn(row);}',
                            clickBubble: false,
                            attr: {
                                title: 'row[column.name].info'
                            }
                        },
                        style: {
                            cursor: 'pointer'
                        }
                    }),
                    '<!-- /ko -->',

                    // NO column value, show the column action label or icon
                    '<!-- ko ifnot: row[column.name] -->',


                    '<!-- ko if: column.action.label -->',
                    a({
                        dataBind: {
                            text: 'column.action.label',
                            // click: 'function () {column.action(row);}',
                            // clickBubble: false
                        },
                        style: {
                            cursor: 'pointer'
                        }
                    }),
                    '<!-- /ko -->',

                    '<!-- ko ifnot: column.action.label -->',
                    a({
                        dataBind: {
                            css: 'column.action.icon',
                            click: 'function () {column.action.fn(row);}',
                            clickBubble: false,
                            // attr: {
                            //     title: 'row[column.name].info'
                            // }
                        },
                        style: {
                            cursor: 'pointer'
                        },
                        class: 'fa'
                    }),
                    '<!-- /ko -->',




                    '<!-- /ko -->',

                    '<!-- /ko -->',

                    // NOT ACTION COLUMN
                    // (but maybe has action invocation in the col value!)
                    '<!-- ko ifnot: column.action -->',

                    // COMPONENT
                    '<!-- ko if: column.component -->',
                    div({
                        dataBind: {
                            component: {
                                name: 'column.component',
                                params: {
                                    field: 'row[column.name]',
                                    row: 'row',
                                    search: '$component.search'
                                }
                            }
                            // text: 'column.component'
                        },
                        style: {
                            flex: '1 1 0px',
                            display: 'flex',
                            flexDirection: 'column'
                        }
                    }),
                    '<!-- /ko -->',


                    '<!-- ko ifnot: column.component -->',

                    '<!-- ko if: row[column.name]  -->',                    
                    buildColValue(),                    
                    '<!-- /ko -->',

                    // '<!-- ko ifnot: column.type -->',
                    // span({
                    //     dataBind: {
                    //         text: 'row[column.name].value',
                    //         attr: {
                    //             title: 'row[column.name].info'
                    //         }
                    //     }
                    // }),
                    '<!-- /ko -->',
                    
                    '<!-- /ko -->',
                    // '<!-- ko ifnot: typeof row[column.name] === "object" && row[column.name] !== null  -->',
                    // span({
                    //     dataBind: {
                    //         text: 'row[column.name]'
                    //     }
                    // }),
                    // '<!-- /ko -->',
                    '<!-- /ko -->'
                ]))
            ])
        ]);
    }

    function buildLoading() {
        // return tbody({}, [
        //     tr([
        //         td({
        //             dataBind: {
        //                 attr: {
        //                     colspan: 'columns.length'
        //                 }
        //             }
        //         }, html.loading())
        //     ])
        // ]);
        return html.loading();
    }

    // function buildError() {
    //     return div({}, [
    //         BS.buildPanel({
    //             title: 'Error',
    //             type: 'danger',
    //             classes: ['kb-panel-light'],
    //             body: div([
    //                 p('There was an error fetching the data for this search results page:'),
    //                 p({
    //                     dataBind: {
    //                         text: 'search.error'
    //                     }
    //                 }),
    //                 p('You may continue to browse through search results.')
    //             ])
    //         })
    //     ]);
    // }


    function template() {
        return div({
            class: styles.classes.body
        }, [
            styles.sheet,
            buildResultsHeader(),
            // '<!-- ko if: search.isError -->',
            // buildError(),
            // '<!-- /ko -->',

            div({
                class: styles.classes.tableBody
            }, [
                // Handle case of a search having been run, but nothing found.
                '<!-- ko if: $component.state() === "notfound" -->',
                div({
                    style: {
                        padding: '12px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, 'no results, keep trying!'),
                '<!-- /ko -->',

                // Handle case of no active search. We don't want to confuse the user 
                // by indicating that nothing was found.
                '<!-- ko if: $component.state() === "none" -->',
                div({
                    style: {
                        padding: '12px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, 'no active search'), // buildNoActiveSearch()),
                '<!-- /ko -->',

                // Handle case of a search being processed
                // '<!-- ko if: $component.isLoading() -->',
                // buildLoading(),
                // '<!-- /ko -->',

                // '<!-- ko ifnot: $component.isLoading() -->',
                // We have results!
                '<!-- ko if: $component.rows().length > 0 -->',
                buildResultsRows(),
                '<!-- /ko -->',
                // '<!-- /ko -->'
            ])
            

        ]);
    }
    function component() {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template()
        };
    }

    return component;
});