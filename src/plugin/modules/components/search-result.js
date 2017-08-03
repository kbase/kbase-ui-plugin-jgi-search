define([
    'knockout-plus',
    'jquery',
    'kb_common/html',
    'kb_common/bootstrapUtils'
], function(
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
        input = t('input'),
        button = t('button'),
        ul = t('ul'),
        li = t('li'),
        a = t('a'),
        table = t('table'),
        ul = t('ul'),
        tr = t('tr'),
        th = t('th'),
        td = t('td'),
        h3 = t('h3'),
        h4 = t('h4');

    function viewModel(params) {
        var searchResults = params.searchVM.searchResults;
        var searching = params.searchVM.searching;

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
            var fun = function() {
                if (skip) {
                    skip = false;
                    return;
                }
                tipNode.classList.add('-hidden');
                document.body.removeEventListener('click', fun);
            };
            document.body.addEventListener('click', fun);
        }
        return {
            searchVM: params.searchVM,
            searchResults: searchResults,
            searching: searching,
            infoTopics: infoTopics,
            doShowTip: doShowTip
        };
    }

    function buildImportForm() {
        return div({}, table({
            class: 'table table-striped form',
            dataBind: {
                with: 'stagingSpec'
            }
        }, [
            tr([
                th('File name'),
                td(
                    input({
                        dataBind: {
                            value: 'fileName'
                        },
                        class: 'form-control'
                    }))
            ]),
            tr([
                th('Status'),
                td({
                    dataBind: {
                        text: 'stagingStatus'
                    }
                })
            ]),
            tr([
                th(''),
                td(button({
                    dataBind: {
                        click: 'doStage'
                    },
                    class: 'btn btn-primary'
                }, 'Copy to Staging Area'))
            ])
        ]));
    }

    function buildImporter() {
        return [
            '<!-- ko if: !$component.searchVM.jgiTerms.agreed() -->',
            p([
                'To import public JGI data files into KBase, you must agree to the JGI Data Usage and Download Policy.'
            ]),
            div({
                style: {
                    margin: '4px',
                    border: '1px silver solid',
                    padding: '4px',
                    textAlign: 'center'
                },
                dataBind: {
                    with: '$component.searchVM.jgiTerms'
                }
            }, [
                button({
                    class: 'btn btn-primary',
                    dataBind: {
                        click: 'doView'
                    }
                }, 'View and (Possibly) Agree')
            ]),
            '<!-- /ko -->',
            '<!-- ko if: $component.searchVM.jgiTerms.agreed() -->',
            '<!-- ko if: importSpecs.length === 0 -->',
            div('No import available for this file type'),
            '<!-- /ko -->',
            '<!-- ko if: importSpecs.length > 0 -->',
            div({
                dataBind: {
                    foreach: 'importSpecs'
                }
            }, [
                buildImportForm(),
                div({
                    style: {
                        fontWeight: 'bold'
                    }
                }, 'Import information'),
                p([
                    'After copying the file to staging, you will be able to import the file into a Narrative as a',
                    ' data object of type ',
                    span({
                        style: {
                            fontWeight: 'bold',
                        },
                        dataBind: {
                            with: 'importSpec.kbaseType'
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
                ])
            ]),
            '<!-- /ko -->',
            '<!-- /ko -->'
        ];
    }

    function buildFileInfo() {
        return table({
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
            tr([
                th('Extension'),
                td({
                    dataBind: {
                        text: 'extension'
                    }
                })
            ]),
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
            tr([
                th('Indexed Type'),
                td({
                    dataBind: {
                        text: 'indexedType'
                    }
                })
            ]),
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
                        }, 'From File'),
                        buildInfoLink('fromFile')
                    ]),
                    buildFileInfo()
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
                        }, 'To Staging'),
                        buildInfoLink('toStaging')
                    ]),
                    buildImporter()
                ])
            ])
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
            arg.classes.forEach(function(klass) {
                klasses.push(klass);
            });
        }
        if (arg.style) {
            Object.keys(arg.style).forEach(function(key) {
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
            tabs = arg.tabs.filter(function(tab) {
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

        tabs.forEach(function(tab, index) {
            tab.panelId = html.genId();
            tab.tabId = html.genId();
            if (tab.name) {
                tabMap[tab.name] = tab.tabId;
            }
            if (tab.selected === true && selectedTab === undefined) {
                selectedTab = index;
            }
            if (tab.events) {
                tab.events.forEach(function(event) {
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
                tabTabs.map(function(tab, index) {
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
                tabs.map(function(tab, index) {
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
            class: '-result'
        }, [
            div({
                dataBind: {
                    click: 'function (data) {data.showDetail(!data.showDetail());}',
                    css: {
                        '-active': 'showDetail'
                    }
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
                    dataBind: {
                        text: 'projectId',
                        clickBubble: false,
                        click: '$component.searchVM.doAddToSearch.bind($data, $data, "projectId")'
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell -search-link'
                }),
                div({
                    dataBind: {
                        text: 'title'
                    },
                    style: {
                        width: '30%'
                    },
                    class: '-cell'
                }),
                div({
                    dataBind: {
                        text: 'pi',
                        // click: 'function (data) {doAddToSearch(data, "pi"); return false;}',
                        click: '$component.searchVM.doAddToSearch.bind($data, $data, "pi")',
                        clickBubble: false
                    },
                    style: {
                        width: '10%'
                    },
                    class: '-cell -search-link'
                }),
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
                        text: 'dataType'
                    },
                    style: {
                        width: '5%'
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
                        text: 'metadata'
                    },
                    style: {
                        width: '15%'
                    },
                    class: '-cell'
                })
            ]),
            '<!-- ko if: showDetail -->',
            buildTabs({
                tabs: [{
                    name: 'project',
                    label: 'Project',
                    body: div({
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    }, buildProjectView())
                }, {
                    name: 'import',
                    label: 'Import',
                    body: div({
                        style: {
                            margin: '4px',
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    }, buildImportView())
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
                            border: '1px silver solid',
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
                            border: '1px silver solid',
                            padding: '4px'
                        }
                    })
                }, {
                    name: 'rawdata',
                    label: 'Raw Data',
                    body: div({
                        class: '-detail',
                        dataBind: {
                            text: 'detailFormatted'
                        }
                    })
                }]
            }).content,
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
                                width: '10%'
                            },
                            class: '-cell'
                        }, 'Project ID'),
                        div({
                            style: {
                                width: '30%'
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
                                width: '5%'
                            },
                            class: '-cell'
                        }, 'Type'),
                        div({
                            style: {
                                width: '15%'
                            },
                            class: '-cell'
                        }, 'Scientific name'),
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

    ko.components.register('jgisearch/search-result', component());
});