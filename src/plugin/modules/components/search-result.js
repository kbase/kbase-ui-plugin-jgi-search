define([
    'knockout-plus',
    'jquery',
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function (
    ko,
    $,
    html,
    BS
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span'),
        p = t('p'),
        button = t('button'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3'),
        br = t('br');

    function viewModel(params) {
        var searchResults = params.search.searchResults;
        var searching = params.search.searching;

        var infoTopics = {
            fromFile: {
                tip: 'The information below identifies the file you will be copying into your Staging Area.',
            },
            toStaging: {
                tip: 'Your Staging Area is your personal file folder into which you may copy files, and from which you may import files to database objects.'
            }
        };

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
            doAddProject: doAddProject
        };
    }

    function buildDestinationFileInfo() {
        return div({
            dataBind: {
                with: 'importSpec'
            }
        }, [
            div({
                class: 'section-header'
            }, 'File Info'),
            p([
                'After the files are copied, two files will appear in your Staging Directory. ',
                'The original data file, prefixed with a unique id; and a "metadata file", ',
                'containing the same metadata you can find in the metadata tab.'
            ]),
            table({
                class: 'table form',
                dataBind: {
                    with: 'stagingSpec'
                }
            }, [
                tr([
                    th('Data file'),
                    td([
                        span({
                            dataBind: {
                                text: 'indexId'
                            }
                        }),
                        '.',
                        span({
                            dataBind: {
                                text: 'fileName'
                            },
                            style: {
                                fontWeight: 'bold'
                            }
                        })
                    ])
                ]),
                tr([
                    th('Metadata file'),
                    td([
                        span({
                            dataBind: {
                                text: 'indexId'
                            }
                        }),
                        '.metadata'
                    ])
                ])
            ])
        ]);
    }

    function buildImportForm() {
        return div({
            dataBind: {
                with: 'stagingSpec'
            }
        }, [
            div({
                class: 'section-header'
            }, 'Copy operation'),
            div({
                style: {
                    width: '20em',
                    margin: '10px auto'
                }
            }, [
                div({
                    class: 'button-group'
                }, [
                    button({
                        dataBind: {
                            click: 'doStage'
                        },
                        class: 'btn btn-primary'
                    }, 'Copy JGI File -> Your KBase Staging Area')
                ]),
                table({
                    class: 'table table-striped form'
                }, [
                    tr([
                        th('Status'),
                        td({
                            dataBind: {
                                text: 'stagingStatus'
                            }
                        })
                    ]),
                    tr([
                        th('Progress'),
                        td({
                            dataBind: {
                                text: 'stagingProgress',
                                style: {
                                    color: 'stagingProgressColor'
                                }
                            }
                        })
                    ])
                ])
            ])
        ]);
    }

    function buildImporter() {
        return [
            '<!-- ko if: !importSpec -->',
            div('No import available for this file type'),
            '<!-- /ko -->',
            '<!-- ko if: importSpec -->',

            '<!-- ko if: !$component.search.jgiTerms.agreed() -->',
            div({
                style: {
                    margin: '4px 0 ',
                    border: '2px red solid',
                    padding: '4px',
                    textAlign: 'center'
                },
                dataBind: {
                    with: '$component.search.jgiTerms'
                }
            }, [
                p([
                    'To copy or import public JGI data files into KBase, ',
                    br(),
                    'you must agree to the JGI Data Usage and Download Policy.'
                ]),
                button({
                    class: 'btn btn-primary',
                    dataBind: {
                        click: 'doView'
                    }
                }, 'View and (Possibly) Agree')
            ]),
            '<!-- /ko -->',

            '<!-- ko if: $component.search.jgiTerms.agreed() -->',
            div({
                dataBind: {
                    with: 'importSpec'
                }
            }, [
                buildImportForm(),
            ]),
            '<!-- /ko -->',

            '<!-- /ko -->'
        ];
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
                    class: 'section-header'
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
                class: 'section-header'
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

    function buildImportView() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    div({

                    }, [
                        span({
                            style: {
                                fontWeight: 'bold',
                                fontSize: '120%',
                                marginRight: '4px'
                            }
                        }, 'Source - JGI'),
                        buildInfoLink('fromFile'),
                    ]),
                    p([
                        'The file is stored at the JGI Archive and Metadata Organizer (JAMO) and ',
                        'may be copied into your KBase File Staging Area.'
                    ]),
                    buildSourceFileInfo(),
                    buildSourceImportMetadata()
                ]), div({
                    class: 'col-md-6'
                }, [
                    div({

                    }, [
                        span({
                            style: {
                                fontWeight: 'bold',
                                fontSize: '120%',
                                marginRight: '4px'
                            }
                        }, 'Destination - KBase'),
                        buildInfoLink('toStaging')
                    ]),
                    p([
                        'The JGI JAMO file will be copied into your KBase Staging Area ',
                        'from where it may be imported into one or more KBase Narratives for ',
                        'further analysis and inspection.'
                    ]),
                    buildImporter()
                ])
            ])
        ]);
    }

    function buildImportMegaView() {
        return div({
            class: 'container-fluid'
        }, [
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-12'
                }, [
                    buildImporter()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    span({
                        style: {
                            fontWeight: 'bold',
                            fontSize: '120%',
                            marginRight: '4px'
                        }
                    }, 'Source - JGI'),
                    buildInfoLink('fromFile')
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    span({
                        style: {
                            fontWeight: 'bold',
                            fontSize: '120%',
                            marginRight: '4px'
                        }
                    }, 'Destination - KBase'),
                    buildInfoLink('toStaging')
                ])
            ]),

            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    p([
                        'The file is stored at the JGI Archive and Metadata Organizer (JAMO) and ',
                        'may be copied into your KBase File Staging Area.'
                    ])
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    p([
                        'The JGI JAMO file will be copied into your KBase Staging Area ',
                        'from where it may be imported into one or more KBase Narratives for ',
                        'further analysis and inspection.'
                    ])
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    buildSourceFileInfo()
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    buildDestinationFileInfo()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [
                    buildSourceImportMetadata()
                ]),
                div({
                    class: 'col-md-6'
                }, [
                    buildDestImportInfo()
                ])
            ]),
            div({
                class: 'row'
            }, [
                div({
                    class: 'col-md-6'
                }, [

                ]),
                div({
                    class: 'col-md-6'
                }, [

                ])
            ]),

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


    function buildTabs(arg) {
        var tabsId = arg.id || html.genId(),
            tabsAttribs = {},
            tabClasses = ['nav', 'nav-tabs'],
            tabStyle = {},
            activeIndex, tabTabs,
            tabs = arg.tabs.filter(function (tab) {
                return (tab ? true : false);
            }),
            selectedTab = arg.initialTab || 0,
            events = [],
            content,
            tabMap = {},
            panelClasses = ['tab-pane'];

        if (arg.fade) {
            panelClasses.push('fade');
        }

        if (tabsId) {
            tabsAttribs.id = tabsId;
        }

        tabs.forEach(function (tab, index) {
            tab.panelId = html.genId();
            tab.tabId = html.genId();
            if (tab.name) {
                tabMap[tab.name] = tab.tabId;
            }
            if (tab.selected === true && selectedTab === undefined) {
                selectedTab = index;
            }
            if (tab.events) {
                tab.events.forEach(function (event) {
                    events.push({
                        id: tab.tabId,
                        jquery: true,
                        type: event.type + '.bs.tab',
                        handler: event.handler
                    });
                });
            }
        });
        if (arg.alignRight) {
            tabTabs = tabs.reverse();
            tabStyle.float = 'right';
            if (selectedTab !== undefined) {
                activeIndex = tabs.length - 1 - selectedTab;
            }
        } else {
            tabTabs = tabs;
            if (selectedTab !== undefined) {
                activeIndex = selectedTab;
            }
        }
        content = div(tabsAttribs, [
            ul({ class: tabClasses.join(' '), role: 'tablist' },
                tabTabs.map(function (tab, index) {
                    var tabAttribs = {
                            role: 'presentation'
                        },
                        linkAttribs = {
                            href: '#', //  + tab.panelId,
                            dataElement: 'tab',
                            ariaControls: tab.panelId,
                            role: 'tab',
                            id: tab.tabId,
                            dataPanelId: tab.panelId,
                            dataToggle: 'tab',
                            dataBind: {
                                attr: {
                                    'data-target': '"#' + tab.panelId + '_row_"+rowNumber'
                                }
                            }
                        },
                        // nb accept label or title for the tab label. Title is more in line
                        // with the panel builder, and this makes conversion easier.
                        icon,
                        label = span({ dataElement: 'label' }, tab.label || tab.title);
                    if (tab.icon) {
                        icon = buildIcon({ name: tab.icon });
                    } else {
                        icon = '';
                    }

                    if (tab.name) {
                        linkAttribs.dataName = tab.name;
                    }
                    if (index === activeIndex) {
                        tabAttribs.class = 'active';
                    }
                    tabAttribs.style = tabStyle;
                    return li(tabAttribs, [a(linkAttribs, [icon, label].join(' '))]);
                })),
            div({ class: 'tab-content' },
                tabs.map(function (tab, index) {
                    var attribs = {
                        role: 'tabpanel',
                        class: panelClasses.join(' '),
                        // id: tab.panelId,
                        style: arg.style || {},
                        dataBind: {
                            attr: {
                                id: '"' + tab.panelId + '_row_" + rowNumber'
                            }
                        }
                    };
                    if (tab.name) {
                        attribs.dataName = tab.name;
                    }
                    if (index === 0) {
                        attribs.class += ' active';
                    }
                    // ditto on accepting content or body.
                    return div(attribs, tab.content || tab.body);
                }))
        ]);
        return {
            content: content,
            events: events,
            map: tabMap
        };
    }


    function buildResult() {
        return div({
            class: '-result',
            dataBind: {
                css: {
                    '-active': 'showDetail'
                }
            }
        }, [
            div({
                dataBind: {
                    click: 'function (data) {data.showDetail(!data.showDetail());}',
                    // css: {
                    //     '-active': 'showDetail'
                    // }
                },
                class: '-summary-row'
            }, [
                div({
                    dataBind: {
                        text: 'rowNumber'
                    },
                    style: {
                        width: '5%'
                    },
                    class: '-cell'
                }),
                // div({
                //     dataBind: {
                //         text: 'score'
                //     },
                //     style: {
                //         width: '5%'
                //     },
                //     class: '-cell'
                // }),
                div({

                    style: {
                        width: '5%'
                    },
                    class: '-cell'
                }, span({
                    dataBind: {
                        text: 'proposalId',
                        clickBubble: false,
                        click: '$component.search.doAddToSearch.bind($data, $data, "proposalId")'
                    },
                    class: '-search-link'
                })),
                div({
                    style: {
                        width: '10%'
                    },
                    class: '-cell'
                }, span({
                    dataBind: {
                        text: 'projectId',
                        clickBubble: false,
                        click: '$component.doAddProject'
                            // click: '$component.search.doAddToSearch.bind($data, $data, "projectId")'
                    },
                    class: '-search-link'
                })),
                div({
                    dataBind: {
                        text: 'title'
                    },
                    style: {
                        width: '25%'
                    },
                    class: '-cell'
                }),
                div({
                    style: {
                        width: '10%'
                    },
                    class: '-cell'
                }, span({
                    dataBind: {
                        text: 'pi',
                        // click: 'function (data) {doAddToSearch(data, "pi"); return false;}',
                        click: '$component.search.doAddToSearch.bind($data, $data, "pi")',
                        clickBubble: false
                    },
                    class: ' -search-link'
                })),
                div({
                    dataBind: {
                        text: 'modified'
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'scientificName'
                    },
                    style: {
                        width: '15%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'dataType'
                    },
                    style: {
                        width: '5%'
                    },
                    class: '-cell'
                }),

                div({
                    dataBind: {
                        html: 'metadata'
                    },
                    style: {
                        width: '15%'
                    },
                    class: '-cell'
                })
            ]),
            '<!-- ko if: showDetail -->',
            div({
                class: '-detail'
            }, buildTabs({
                tabs: [{
                    name: 'project',
                    label: 'Project',
                    body: div({
                        style: {
                            margin: '4px',
                            // border: '1px silver solid',
                            padding: '4px'
                        }
                    }, buildProjectView())
                }, {
                    name: 'import',
                    label: 'Import',
                    body: div({
                        style: {
                            margin: '4px',
                            // border: '1px silver solid',
                            padding: '4px'
                        }
                    }, [
                        '<!-- ko if: importSpec -->',
                        buildImportMegaView(),
                        '<!-- /ko -->',
                        '<!-- ko if: !importSpec -->',
                        div({

                        }, [
                            p('Import not available for this file')
                        ]),
                        '<!-- /ko -->'
                    ])
                }, {
                    name: 'metadata',
                    label: 'Metadata',
                    body: div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: '$data.detail.metadata',
                                    open: true
                                }
                            }
                        },
                        style: {
                            margin: '4px',
                            // border: '1px silver solid',
                            padding: '4px'
                        }
                    })
                }, {
                    name: 'alldata',
                    label: 'All Data',
                    body: div({
                        dataBind: {
                            component: {
                                name: '"jgisearch/json-viewer"',
                                params: {
                                    value: '$data.data'
                                }
                            }
                        },
                        style: {
                            margin: '4px',
                            // border: '1px silver solid',
                            padding: '4px'
                        }
                    })
                }, {
                    name: 'rawdata',
                    label: 'Raw Data',
                    body: div({
                        class: '-raw-data',
                        dataBind: {
                            text: 'detailFormatted'
                        }
                    })
                }]
            }).content),
            '<!-- /ko -->'
        ]);
    }

    function template() {
        return div({
            class: 'component-jgi-search-search-result'
        }, [
            div({}, [
                div({
                    class: '-results'
                }, [
                    div({
                        class: '-header'
                    }, [
                        div({
                            style: {
                                width: '5%'
                            },
                            class: '-cell'
                        }, '#'),
                        // div({
                        //     style: {
                        //         width: '5%'
                        //     },
                        //     class: '-cell'
                        // }, 'Score'),
                        div({
                            style: {
                                width: '5%'
                            },
                            class: '-cell'
                        }, 'Prop. ID'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'Proj. ID'),
                        div({
                            style: {
                                width: '25%'
                            },
                            class: '-cell'
                        }, 'Title'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'PI'),
                        div({
                            style: {
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'Date'),
                        div({
                            style: {
                                width: '15%'
                            },
                            class: '-cell'
                        }, 'Scientific name'),
                        div({
                            style: {
                                width: '5%'
                            },
                            class: '-cell'
                        }, 'Type'),

                        div({
                            style: {
                                width: '15%'
                            },
                            class: '-cell'
                        }, 'Metadata')
                    ]),
                    '<!-- ko if: searchResults().length > 0 -->',
                    '<!-- ko foreach: searchResults -->',
                    buildResult(),
                    '<!-- /ko -->',
                    '<!-- /ko -->',
                    '<!-- ko if: searchResults().length === 0 -->',
                    '<!-- ko if: searching() -->',
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
                    '<!-- ko if: !searching() -->',
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
                    '<!-- /ko -->'

                ])
            ])
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