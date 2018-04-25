define([
    'knockout-plus',
    'kb_common/html',
    '../../lib/utils',
    '../schema',
    '../../components/table'
], function (
    ko,
    html,
    utils,
    schema,
    TableComponent
) {
    'use strict';

    var t = html.tag,
        p = t('p'),
        hr = t('hr'),
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
            params.search.seqProjectFilter(data.col.value);
        }

        function doAddProposal(data) {
            // console.log('adding proposal...', row, col);
            params.search.proposalFilter(data.col.value);
        }

        function doAddPi(data) {
            params.search.piFilter(data.col.last);
        }

        function doStage(item) {
            // spawn the staging request
            // the search vm takes care of the rest...

            // stagingStatus('requesting');

            // TODO: need to work on the detail item structure!
            //console.log('going to stage ...', data);

            return params.search.doStage(item.id)
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
                });
        }

        var messages = {
            none: div([
                p('No active search.'),
                hr({style: {width: '50%'}}),
                p('Enter one or more terms above to search for reads and assemblies contained in the Joint Genome Institute (JGI) Genomes Online Database (GOLD) to use in KBase.')
                p('Multiple search terms are treated as “AND”  statements. The search will find objects or text that include all of the terms you submit. Terms are matched against whole words; no partial matches will be listed. Wildcards are supported--use an asterisk (*) as a wildcard (for example, “lacto*” would match “lactobacillus” and “lactococcus”). Other search operators are not currently supported.')
            ]),
            notfound: div([
                p('Sorry, nothing was found with this search.'),
                hr({style: {width: '50%'}}),
                p('Try reducing the number of search terms and/or filters.'),
                p('tip: You can use a wildcard search to find more stuff. E.g. rhodo*'),
            ])
        };

        return {
            search: params.search,
            searchResults: searchResults,
            table: {
                rows: searchResults,
                columns: schema.columns,
                isLoading: search.searching,
                pageSize: search.pageSize,
                state: search.searchState,
                // rowAction: doShowInfo,
                // try this: thread an environment through, like
                // runtime...
                env: {
                    search: params.search
                },
                actions: {
                    doAddProject: doAddProject,
                    doAddPi: doAddPi,
                    doStage: doStage,
                    doAddProposal: doAddProposal
                },
                sortBy: search.sortBy
            },
            messages: messages,
            searching: searching,
            infoTopics: infoTopics,
            doShowTip: doShowTip,
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
            viewModel: viewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return ko.kb.registerComponent(component);
});
