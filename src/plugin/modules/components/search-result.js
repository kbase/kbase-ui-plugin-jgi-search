define([
    'knockout-plus',
    'jquery',
    'kb_common/html',
    '../utils',
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
        div = t('div'),
        span = t('span'),
        blockquote = t('blockquote'),
        p = t('p'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3');

    var styles = utils.makeStyles({
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
        // result: {
        //     flex: '0 0 35px',
        //     display: 'flex',
        //     flexDirection: 'column'
        // },
        // resultActive: {
        //     backgroundColor: '#DDD'
        // },
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
        // cell: {
        //     styles: {
        //         flex: '1 1 0px'
        //     }
        // },
        cell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
        },
        headerCell: {
            flex: '0 0 0px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            border: '1px silver solid',
            height: '35px',
            padding: '2px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center'
        },
        innerCell: {
            flex: '1 1 0px',
            display: 'block',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
        },
        titleCell: {
            flexBasis: '28%'
        },
        piCell: {
            flexBasis: '10%'
        },
        proposalId: {
            flexBasis: '5%',
            textAlign: 'right',
            paddingRight: '3px'
        },
        sequencingProjectId: {
            css: {
                flexBasis: '5%',
                textAlign: 'right',
                paddingRight: '3px'
            },
            pseudo: {
                hover: {
                    textDecoration: 'underline',
                    backgroundColor: '#EEE',
                    cursor: 'pointer'
                }
            }
        },
        analysisProjectId: {
            flexBasis: '5%',
            textAlign: 'right',
            paddingRight: '3px'
        },

        dateCell: {
            flexBasis: '10%'
        },
        scientificNameCell: {
            flexBasis: '17%'
        },
        dataTypeCell: {
            flexBasis: '5%'
        },
        s1Cell: {
            flexBasis: '5%'
        },
        s2Cell: {
            flexBasis: '5%'
        },
        s3Cell: {
            flexBasis: '5%'
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
        }
    });

    function viewModel(params, componentInfo) {
        console.log('search result vm', params, componentInfo);
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

        // Auto Sizing:

        // we hinge upon the height, which is updated when we start and when the ...
        var height = ko.observable();

        height.subscribe(function (newValue) {
            console.log('new height?', newValue);
            search.availableRowHeight(newValue);
        });

        var resizerTimeout = 200;
        var resizerTimer = null;

        function calcHeight() {
            console.log('body?', styles.classes.body);
            var tableHeight = componentInfo.element.querySelector('.' + styles.classes.body).clientHeight;
            // // TODO: switch to getBoundingClientRect()
            // var headerHeight = componentInfo.element.querySelector('.-header').offsetHeight;
            //
            // return tableHeight - headerHeight;

            var headerHeight = 50;

            console.log('table height', tableHeight);

            return tableHeight;
        }

        // A cheap delay to avoid excessive resizing.
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
        height(calcHeight());

        // TODO: trigger resizer upon search results?
        // search.fetchingFeatures.subscribe(function (newValue) {
        //     if (newValue) {
        //         resizer();
        //     }
        // });


        function doShowInfo(data) {
            console.log('show info with ', data);
            // select row. Row will stay selected when info is closed,
            // but will be removed when another row is selected.
            data.selected(true);
            if (search.currentlySelected) {
                search.currentlySelected.selected(false);
            }
            search.currentlySelected = data;
            search.getDetail(data.id)
                .then(function (item) {
                    console.log('detail', item);
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
            params.search.projectFilter.push(data.projectId);
        }
        return {
            search: params.search,
            searchResults: searchResults,
            searching: searching,
            infoTopics: infoTopics,
            doShowTip: doShowTip,
            doShowInfo: doShowInfo,
            doAddProject: doAddProject
        };
    }

    function buildDestImportInfo() {
        return [
            '<!-- ko if: !importSpec -->',
            div('No import available for this file type'),
            '<!-- /ko -->',
            '<!-- ko if: importSpec -->',
            div({
                dataBind: {
                    with: 'importSpec'
                }
            }, [
                '<!-- ko if: kbaseType -->',
                div({
                    class: styles.classes.sectionHeader
                }, 'Import information'),
                p([
                    'After copying the file to your Staging Folder, you will be able to import the file into a Narrative as a',
                    ' data object of type ',
                    span({
                        style: {
                            fontWeight: 'bold',
                        },
                        dataBind: {
                            with: 'kbaseType'
                        }
                    }, [
                        span({
                            dataBind: {
                                text: 'module'
                            }
                        }),
                        '.',
                        span({
                            dataBind: {
                                text: 'name'
                            }
                        }),
                        '-',
                        span({
                            dataBind: {
                                text: 'version'
                            }
                        })
                    ])
                ]),
                '<!-- /ko -->',
                '<!-- ko if: error -->',
                div({
                    dataBind: {
                        text: 'error'
                    },
                    class: 'text-danger'
                }),
                '<!-- /ko -->'
            ]),
            '<!-- /ko -->',
        ];
    }

    function buildSourceFileInfo() {
        return div([
            div({
                class: styles.classes.sectionHeader
            }, 'File info'),
            table({
                class: 'table table-striped',
                dataBind: {
                    with: 'file'
                }
            }, [
                tr([
                    th('Filename'),
                    td({
                        dataBind: {
                            text: 'name'
                        }
                    })
                ]),
                // tr([
                //     th('Extension'),
                //     td({
                //         dataBind: {
                //             text: 'extension'
                //         }
                //     })
                // ]),
                tr([
                    th('Data type'),
                    td({
                        dataBind: {
                            text: 'dataType'
                        }
                    })
                ]),
                tr([
                    th('Encoding'),
                    td({
                        dataBind: {
                            text: 'encoding'
                        }
                    })
                ]),
                // tr([
                //     th('Indexed Type'),
                //     td({
                //         dataBind: {
                //             text: 'indexedType'
                //         }
                //     })
                // ]),
                tr([
                    th('Size'),
                    td({
                        dataBind: {
                            text: 'size'
                        }
                    })
                ]),
                // tr([
                //     th('Status'),
                //     td({
                //         dataBind: {
                //             text: 'status'
                //         }
                //     })
                // ]),

                tr([
                    th('Date added'),
                    td({
                        dataBind: {
                            text: 'added'
                        }
                    })
                ])
            ])
        ]);
    }

    function buildProposalInfo() {
        return table({
            class: 'table table-striped',
            dataBind: {
                with: 'proposal'
            }
        }, [
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
        ]);
    }

    function buildProjectInfo() {
        return table({
            class: 'table table-striped',
            dataBind: {
                with: 'project'
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

    function buildProjectView() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    h3('Proposal'),
                    buildProposalInfo()
                ]), div({
                    class: 'col-md-6'
                }, [
                    h3('Sequencing Project'),
                    buildProjectInfo()
                ])
            ])
        ]);
    }

    function buildInfoLink(tip) {
        var tipId = html.genId();
        return div({
            style: {
                position: 'relative',
                display: 'inline-block'
            }
        }, [
            span({
                class: 'fa fa-info info-tooltip',
                dataBind: {
                    click: '$component.doShowTip.bind(null, "' + tipId + '")'
                },
            }),
            div({
                class: 'kb-tooltip -hidden',
                id: tipId,
                dataBind: {
                    text: '$component.infoTopics["' + tip + '"].tip'
                }
            })
        ]);
    }

    function buildSourceImportMetadata() {
        return div({
            dataBind: {
                with: 'importSpec'
            }
        }, [

            '<!-- ko if: kbaseType -->',
            div({
                class: 'section-header'
            }, 'File import metadata'),
            p([
                'This information may be required when importing the data into KBase.'
            ]),
            table({
                class: 'table',
                dataBind: {
                    foreach: 'importMetadata'
                }
            }, [
                tr([
                    th({
                        dataBind: {
                            text: 'key'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'value'
                        }
                    })
                ])
            ]),

            '<!-- /ko -->',
            '<!-- ko if: !kbaseType -->',
            div([
                p([
                    'Sorry, this file is not importable into KBase.'
                ])
            ]),
            '<!-- /ko -->'
        ]);
    }

    function buildIcon(arg) {
        var klasses = ['fa'],
            style = { verticalAlign: 'middle' };
        klasses.push('fa-' + arg.name);
        if (arg.rotate) {
            klasses.push('fa-rotate-' + String(arg.rotate));
        }
        if (arg.flip) {
            klasses.push('fa-flip-' + arg.flip);
        }
        if (arg.size) {
            if (typeof arg.size === 'number') {
                klasses.push('fa-' + String(arg.size) + 'x');
            } else {
                klasses.push('fa-' + arg.size);
            }
        }
        if (arg.classes) {
            arg.classes.forEach(function (klass) {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach(function (key) {
                style[key] = arg.style[key];
            });
        }
        if (arg.color) {
            style.color = arg.color;
        }

        return span({
            dataElement: 'icon',
            style: style,
            class: klasses.join(' ')
        });
    }

    // function buildTabs(arg) {
    //     var tabsId = arg.id || html.genId(),
    //         tabsAttribs = {},
    //         tabClasses = ['nav', 'nav-tabs'],
    //         tabStyle = {},
    //         activeIndex, tabTabs,
    //         tabs = arg.tabs.filter(function (tab) {
    //             return (tab ? true : false);
    //         }),
    //         selectedTab = arg.initialTab || 0,
    //         events = [],
    //         content,
    //         tabMap = {},
    //         panelClasses = ['tab-pane'];
    //
    //     if (arg.fade) {
    //         panelClasses.push('fade');
    //     }
    //
    //     if (tabsId) {
    //         tabsAttribs.id = tabsId;
    //     }
    //
    //     tabs.forEach(function (tab, index) {
    //         tab.panelId = html.genId();
    //         tab.tabId = html.genId();
    //         if (tab.name) {
    //             tabMap[tab.name] = tab.tabId;
    //         }
    //         if (tab.selected === true && selectedTab === undefined) {
    //             selectedTab = index;
    //         }
    //         if (tab.events) {
    //             tab.events.forEach(function (event) {
    //                 events.push({
    //                     id: tab.tabId,
    //                     jquery: true,
    //                     type: event.type + '.bs.tab',
    //                     handler: event.handler
    //                 });
    //             });
    //         }
    //     });
    //     if (arg.alignRight) {
    //         tabTabs = tabs.reverse();
    //         tabStyle.float = 'right';
    //         if (selectedTab !== undefined) {
    //             activeIndex = tabs.length - 1 - selectedTab;
    //         }
    //     } else {
    //         tabTabs = tabs;
    //         if (selectedTab !== undefined) {
    //             activeIndex = selectedTab;
    //         }
    //     }
    //     content = div(tabsAttribs, [
    //         ul({ class: tabClasses.join(' '), role: 'tablist' },
    //             tabTabs.map(function (tab, index) {
    //                 var tabAttribs = {
    //                         role: 'presentation'
    //                     },
    //                     linkAttribs = {
    //                         href: '#', //  + tab.panelId,
    //                         dataElement: 'tab',
    //                         ariaControls: tab.panelId,
    //                         role: 'tab',
    //                         id: tab.tabId,
    //                         dataPanelId: tab.panelId,
    //                         dataToggle: 'tab',
    //                         dataBind: {
    //                             attr: {
    //                                 'data-target': '"#' + tab.panelId + '_row_"+rowNumber'
    //                             }
    //                         }
    //                     },
    //                     // nb accept label or title for the tab label. Title is more in line
    //                     // with the panel builder, and this makes conversion easier.
    //                     icon,
    //                     label = span({ dataElement: 'label' }, tab.label || tab.title);
    //                 if (tab.icon) {
    //                     icon = buildIcon({ name: tab.icon });
    //                 } else {
    //                     icon = '';
    //                 }
    //
    //                 if (tab.name) {
    //                     linkAttribs.dataName = tab.name;
    //                 }
    //                 if (index === activeIndex) {
    //                     tabAttribs.class = 'active';
    //                 }
    //                 tabAttribs.style = tabStyle;
    //                 return li(tabAttribs, [a(linkAttribs, [icon, label].join(' '))]);
    //             })),
    //         div({ class: 'tab-content' },
    //             tabs.map(function (tab, index) {
    //                 var attribs = {
    //                     role: 'tabpanel',
    //                     class: panelClasses.join(' '),
    //                     // id: tab.panelId,
    //                     style: arg.style || {},
    //                     dataBind: {
    //                         attr: {
    //                             id: '"' + tab.panelId + '_row_" + rowNumber'
    //                         }
    //                     }
    //                 };
    //                 if (tab.name) {
    //                     attribs.dataName = tab.name;
    //                 }
    //                     attribs.class += ' active';
    //                 }
    //                 // ditto on accepting content or body.
    //                 return div(attribs, tab.content || tab.body);
    //             }))
    //     ]);
    //     return {
    //         content: content,
    //         events: events,
    //         map: tabMap
    //     };
    // }

    function buildResult() {
        var rowClass = {};
        rowClass[styles.classes.selected] = 'selected()';
        rowClass[styles.classes.private] = '!isPublic';
        return div({
            dataBind: {
                //click: 'function (data) {data.showInfo(!data.showInfo());}',
                click: '$component.doShowInfo',
                // css: {
                //     '-active': 'showInfo'
                // }
                css: rowClass
            },
            class: styles.classes.itemRow
        }, [
            div({
                class: [styles.classes.cell, styles.classes.titleCell]
            }, div({
                dataBind: {
                    text: 'title'
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.piCell]
            }, div({
                class: [styles.classes.innerCell]
            }, span({
                dataBind: {
                    text: 'pi',
                    // click: '$component.search.doAddToSearch.bind($data, $data, "pi")',
                    clickBubble: false
                },
                class: '-search-link'
            }))),
            div({
                dataBind: {
                    text: 'proposalId'
                },
                class: [styles.classes.cell, styles.classes.proposalId]
            }),
            div({
                dataBind: {
                    text: 'sequencingProjectId.value',
                    click: 'sequencingProjectId.addToSearch',
                    clickBubble: false
                    // click: '$component.search.doAddToSearch.bind($data, $data, "sequencingProjectId")'
                },
                class: [styles.classes.cell, styles.classes.sequencingProjectId]
            }),
            div({
                dataBind: {
                    text: 'analysisProjectId'
                },
                class: [styles.classes.cell, styles.classes.analysisProjectId]
            }),
            div({
                dataBind: {
                    text: 'modified'
                },
                class: [styles.classes.cell, styles.classes.dateCell]
            }),
            div({
                dataBind: {
                    text: 'scientificName'
                },
                class: [styles.classes.cell, styles.classes.scientificNameCell]
            }),
            div({
                dataBind: {
                    text: 'dataType'
                },
                class: [styles.classes.cell, styles.classes.dataTypeCell]
            }),
            div({
                class: [styles.classes.cell, styles.classes.s1Cell]
            }, div({
                dataBind: {
                    text: 's1.value',
                    attr: {
                        title: 's1.info'
                    }
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.s2Cell]
            }, div({
                dataBind: {
                    text: 's2',
                    attr: {
                        title: 's2'
                    }
                },
                class: [styles.classes.innerCell]
            })),
            div({
                class: [styles.classes.cell, styles.classes.s3Cell]
            }, div({
                dataBind: {
                    text: 's3',
                    attr: {
                        title: 's3'
                    }
                },
                class: [styles.classes.innerCell]
            })),
        ]);
    }

    function buildSortControl() {
        return span({
            class: 'fa fa-sort',
            style: {
                marginRight: '2px'
            }
        });
    }

    function buildExample(text) {
        return span({
            style: {
                fontFamily: 'monospace',
                backgroundColor: 'rgba(247, 242, 225, 0.5)',
                fontWeight: 'bold',
                border: '1px gray solid',
                padding: '4px'
            }
        }, text);
    }

    function buildNoActiveSearch() {
        return div({
            style: {
                textAlign: 'left',
                maxWidth: '50em',
                margin: '0 auto'
            }
        }, [
            p('Hi, you don\'t have an active search, so there isn\'t anything to show you.'),
            p([
                'To start a search, simply type into the search box above. '
            ]),
            p([
                'To get back to this page any time, just remove all search conditions above!'
            ]),
            blockquote([
                'Try a very simple search: ', buildExample('coli'), '.'
            ]),
            p([
                'The search matches whole words against the entire ',
                a({
                    href: ''
                }, 'JAMO'),
                ' record. To search by just part of a word, use an asterisk wildcard (*) at the',
                ' beginning or end (or both!).'
            ]),
            blockquote([
                'Try ', buildExample('Escher'), '. No results? Just add an asterisk to the end ', buildExample('Escher*'), '.'
            ]),
            p([
                'All search terms are applied to narrow your search.'
            ]),
            blockquote([
                'Try ', buildExample('coli MG1655'),
            ]),
            p([
                'You may use one or more filters to additionally narrow down the search'
            ])
        ]);
    }

    function template() {
        return div({
            class: styles.classes.component
        }, [
            styles.sheet,
            div({
                class: styles.classes.headerRow
            }, [
                div({
                    class: [styles.classes.headerCell, styles.classes.titleCell]
                }, [buildSortControl('title'), 'Title']),
                div({
                    class: [styles.classes.headerCell, styles.classes.piCell]
                }, [buildSortControl('pi'), 'PI']),
                div({
                    class: [styles.classes.headerCell, styles.classes.proposalId]
                }, [buildSortControl('proposalId'), 'Prop.']),
                div({
                    class: [styles.classes.headerCell, styles.classes.sequencingProjectId]
                }, [buildSortControl('sequencingProjectId'), 'Seq.']),
                div({
                    class: [styles.classes.headerCell, styles.classes.analysisProjectId]
                }, [buildSortControl('analysisProjectId'), 'Ana.']),
                div({
                    class: [styles.classes.headerCell, styles.classes.dateCell]
                }, [buildSortControl('date'), 'Date']),
                div({
                    class: [styles.classes.headerCell, styles.classes.scientificNameCell]
                }, [buildSortControl('scientific-name'), 'Scientific name']),
                div({
                    class: [styles.classes.headerCell, styles.classes.dataTypeCell]
                }, [buildSortControl('type'), 'Type']),
                div({
                    class: [styles.classes.headerCell, styles.classes.s1Cell]
                }, 'S1'),
                div({
                    class: [styles.classes.headerCell, styles.classes.s2Cell]
                }, 'S2'),
                div({
                    class: [styles.classes.headerCell, styles.classes.s3Cell]
                }, 'S3')
            ]),
            div({
                class: styles.classes.body
            }, [
                '<!-- ko if: searchResults().length > 0 -->',
                '<!-- ko foreach: searchResults -->',
                buildResult(),
                '<!-- /ko -->',
                '<!-- /ko -->',
                '<!-- ko if: searchResults().length === 0 -->',
                '<!-- ko if: search.searchState() === "inprogress" -->',
                div({
                    style: {
                        margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, html.loading('Searching...')),
                '<!-- /ko -->',
                '<!-- ko if: search.searchState() === "notfound" -->',
                div({
                    style: {
                        margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, 'no results, keep trying!'),
                '<!-- /ko -->',
                '<!-- ko if: search.searchState() === "none" -->',
                div({
                    style: {
                        margin: '10px',
                        border: '1px silver solid',
                        padding: '8px',
                        backgroundColor: 'silver',
                        textAlign: 'center'
                    }
                }, buildNoActiveSearch()),
                '<!-- /ko -->',
                '<!-- /ko -->'
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
