define([
    'knockout-plus',
    'jquery',
    'kb_common/html',
    '../lib/utils',
    '../componentDialog'
], function (
    ko,
    $,
    html,
    utils,
    ComponentDialog
) {
    'use strict';

    var t = html.tag,
        div = t('div');

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
                padding: '2px 4px',
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
        var searchResults = search.searchResults;
        var searching = search.searching;

        var infoTopics = {
            fromFile: {
                tip: 'The information below identifies the file you will be copying into your Staging Area.',
            },
            toStaging: {
                tip: 'Your Staging Area is your personal file folder into which you may copy files, and from which you may import files to database objects.'
            }
        };

        function doShowInfo(data) {
            // select row. Row will stay selected when info is closed,
            // but will be removed when another row is selected.
            data.selected(true);
            if (search.currentlySelected) {
                search.currentlySelected.selected(false);
            }
            search.currentlySelected = data;
            search.getDetail(data.id)
                .then(function (item) {
                    ComponentDialog.showDialog({
                        title: 'Inspector',
                        component: 'jgi-search/quick-view',
                        params: {
                            item: item,
                            search: params.search
                        }
                    });
                });
            // alert('info');
        }


        // end auto sizing

        function doShowTip(id) {
            var tipNode = document.getElementById(id);
            if (!tipNode) {
                return;
            }
            if (!tipNode.classList.contains('-hidden')) {
                return;
            }

            tipNode.classList.remove('-hidden');
            var skip = true;
            var fun = function () {
                if (skip) {
                    skip = false;
                    return;
                }
                tipNode.classList.add('-hidden');
                document.body.removeEventListener('click', fun);
            };
            document.body.addEventListener('click', fun);
        }

        function doAddProject(data) {
            // console.log('filtering on ', data);
            params.search.seqProjectFilter(data.value);
        }

        function doAddProposal(data) {
            params.search.proposalFilter(data.value);
        }

        function doAddPi(data) {
            params.search.piFilter(data.last);
        }

        function doStage(item) {
            // spawn the staging request
            // the search vm takes care of the rest...

            // stagingStatus('requesting');

            // TODO: need to work on the detail item structure!
            //console.log('going to stage ...', data);

            params.search.doStage(item.id)
                .then(function (result) {
                    if ('jobId' in result) {
                        // we need to do this manually since main.js just
                        // sets it in the results not the detail.
                        // TODO: cache detail items in the main vm so that the
                        // transfer job status will still be there if the user
                        // closes and re-opens the detail.
                        // TODO: restore job status whenever user scrolls through
                        // data or pull s up detail...
                        item.transferJob(result);
                        // stagingStatus('sent');
                    } else {
                        console.error('ERROR', result);
                        // stagingStatus('error');
                        // error(result);
                    }
                })
                .catch(function (err) {
                    console.error('ERROR', err);
                    // stagingStatus('error');
                    // error({
                    //     message: err.message,
                    //     error: err
                    // });
                });
        }

        var columns = [
            {
                name: 'title',
                label: 'Title',
                type: 'string',
                sort: null,
                // width is more like a weight... for all current columns the
                // widths are summed, and each column's actual width attribute
                // is set as the percent of total.
                width: 35
            },
            {
                name: 'pi',
                label: 'PI',
                type: 'string',
                sort: null,
                width:15,
                action: {
                    fn: doAddPi
                }
            },
            {
                name: 'proposalId',
                label: 'Proposal ID',
                type: 'number',
                format: '#',
                width: 8,
                rowStyle: {
                    fontFamily: 'monospace'
                },
                action: {
                    fn: doAddProposal
                },
                sort: {
                    keyName: 'metadata.proposal_id',
                    direction: ko.observable('ascending'),
                    active: ko.observable(false)
                }
            },
            {
                name: 'sequencingProjectId',
                label: 'Project ID',
                type: 'number',
                format: '#',
                width: 8,                
                rowStyle: {
                    fontFamily: 'monospace'
                },
                action: {
                    fn: doAddProject
                },
                sort: {
                    keyName: 'metadata.sequencing_project_id',
                    direction: ko.observable('ascending'),
                    active: ko.observable(false)
                }
            },
            {
                name: 'date',
                label: 'Date',
                type: 'date',
                format: 'MM/DD/YYYY',
                sort: {
                    keyName: 'modified',
                    direction: ko.observable('ascending'),
                    active: ko.observable(true)
                },
                width: 10
            },
            {
                name: 'scientificName',
                label: 'Scientific Name',
                type: 'string',
                width: 21,
                sort: null
            },
            {
                name: 'dataType',
                label: 'Type',
                type: 'string',
                width: 5,
                sort: {
                    keyName: 'file_type',
                    direction: ko.observable('ascending'),
                    active: ko.observable(false)
                }
            },
            {
                name: 's1',
                label: 'S1',
                type: 'string',
                width: 5
            },
            {
                name: 's2',
                label: 'S2',
                type: 'string',
                width: 5
            },
            {
                name: 'fileSize',
                label: 'Size',
                type: 'number',
                format: '0.0 b',
                width: 8,
                sort: {
                    keyName: 'file_size',
                    direction: ko.observable('ascending'),
                    active: ko.observable(false)
                },
                rowStyle: {
                    textAlign: 'right'
                }
            },
            {
                name: 'inspect',
                label: 'Inspect',
                type: 'action',
                width: 5,
                component: 'jgi-search/inspect-control',
                rowStyle: {
                    textAlign: 'center'
                },
                headerStyle: {
                    textAlign: 'center'
                }
            },
            {
                name: 'copy',
                label: 'Copy',
                type: 'action',
                width: 5,
                component: 'jgi-search/stage-control',
                rowStyle: {
                    textAlign: 'center'
                },
                headerStyle: {
                    textAlign: 'center'
                }
            }
        ];

        columns.forEach(function (column) {
            if (column.sort && column.sort.active()) {
                search.sortBy(column);
            }
        });

        return {
            search: params.search,
            searchResults: searchResults,
            table: {
                rows: searchResults,
                columns: columns,
                isLoading: search.searching,
                pageSize: search.pageSize,
                state: search.searchState,
                // rowAction: doShowInfo,
                // try this: thread an environment through, like
                // runtime...
                env: {
                    search: params.search
                },
                sortBy: search.sortBy
            },
            searching: searching,
            infoTopics: infoTopics,
            doShowTip: doShowTip,
            doShowInfo: doShowInfo,
            doAddProject: doAddProject,
            doAddPi: doAddPi,
            doStage: doStage,
            doAddProposal: doAddProposal
        };
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            div({
                dataBind: {
                    component: {
                        name: '"generic/table"',
                        params: {
                            table: 'table'
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
            viewModel: viewModel,
            template: template()
        };
    }

    return component;
});
