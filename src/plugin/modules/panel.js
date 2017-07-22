define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'kb_common/html',
    'kb_common/jsonRpc/dynamicServiceClient'
], function(
    Promise,
    ko,
    numeral,
    html,
    GenericClient
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        button = t('button'),
        div = t('div');

    function normalizeFileType(fileType) {
        if (!fileType) {
            return 'n/a';
        }
        if (typeof fileType === 'string') {
            return fileType;
        }
        if (fileType instanceof Array) {
            return fileType.join(', ');
        }
        return 'n/a';
    }

    function usDate(dateString) {
        var date = new Date(dateString);
        return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
        // return date.toLocaleString();
    }


    function getProp(obj, props, defaultValue) {
        function getit(o, p) {
            if (p.length === 0) {
                return;
            }
            var value = o[p.pop()];
            if (p.length === 0) {
                return value;
            }
            if (typeof value !== 'object') {
                return;
            }
            return getit(value, p);
        }
        for (var i = 0; i < props.length; i += 1) {
            var prop = props[i].split('.');
            var value = getit(obj, prop.reverse());
            if (value !== undefined) {
                return value;
            }
        }
        return defaultValue;
    }

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;

        // VM
        function SearchVM() {
            function doRemoveError(data) {
                vm.errors.remove(data);
            }
            var vm = {
                searchInput: ko.observable(),
                searchResults: ko.observableArray(),
                searchTotal: ko.observableArray(),
                searching: ko.observable(false),
                // Defaults to 10, but the search component may sync this
                // with a page setting control
                pageSize: ko.observable(10),
                // Note, starts with 1.
                page: ko.observable(1),
                errors: ko.observableArray(),
                doRemoveError: doRemoveError
            };
            return vm;
        }

        var searchVM = SearchVM();

        searchVM.searchInput.extend({
            rateLimit: {
                timeout: 150,
                method: 'notifyWhenChangesStop'
            }
        });

        function fetchData(query, page, pageSize) {
            var JGISearch = new GenericClient({
                url: runtime.config('services.service_wizard.url'),
                token: runtime.service('session').getAuthToken(),
                module: 'jgi_gateway'
            });
            return JGISearch.callFunc('search_jgi', [{
                    search_string: query,
                    limit: pageSize,
                    page: page - 1
                }])
                .then(function(result) {
                    return result[0];
                })
                .catch(function(err) {
                    console.error('ERROR', err, query, typeof page, typeof pageSize);
                    throw err;
                });
        }

        // TODO: our fancy search cancellation business.
        var currentSearch = {
            search: null,
            cancelled: false
        };

        function doClearSearch() {
            if (currentSearch.search) {
                currentSearch.search.cancel();
                currentSearch.cancelled = true;
            }
            searchVM.searchResults.removeAll();
            searchVM.searchTotal(0);
            currentSearch = {
                search: null,
                cancelled: false
            };
        }

        function doSearch() {
            if (currentSearch.search) {
                currentSearch.search.cancel();
                currentSearch.cancelled = true;
            }
            searchVM.searching(true);
            currentSearch = {
                search: null,
                cancelled: false
            };
            var thisSearch = currentSearch;
            return currentSearch.search = fetchData(searchVM.searchInput(), searchVM.page(), searchVM.pageSize())
                .then(function(data) {
                    if (thisSearch.cancelled) {
                        return;
                    }
                    searchVM.searchResults.removeAll();
                    searchVM.searchTotal(data.total);
                    data.hits.forEach(function(hit, index) {
                        // var project = hit._source.metadata;
                        var rowNumber = (searchVM.page() - 1) * searchVM.pageSize() + 1 + index;
                        var projectId;
                        if (hit._source.metadata.sequencing_project_id) {
                            projectId = hit._source.metadata.sequencing_project_id;
                        } else {
                            projectId = 'n/a';
                        }
                        var title = getProp(hit._source.metadata, ['sequencing_project.sequencing_project_name'], hit._source.file_name);

                        searchVM.searchResults.push({
                            rowNumber: rowNumber,
                            score: numeral(hit._score).format('00.00'),
                            type: hit._type,
                            title: title,
                            date: usDate(hit._source.file_date),
                            modified: usDate(hit._source.modified),
                            fileType: normalizeFileType(hit._source.file_type),
                            projectId: projectId,
                            file: {
                                name: hit._source.file_name,
                                size: numeral(hit._source.file_size).format('0,0'),
                                added: usDate(hit._source.added_date),
                                status: hit._source.file_status,
                                type: normalizeFileType(hit._source.file_type)
                            },
                            // projectId: project.projects.map(function(project) {
                            // return String(project.projectId);
                            // // }),
                            // domain: project.domain,
                            // genus: project.genus,
                            // species: project.species,
                            showDetail: ko.observable(false),
                            detailFormatted: JSON.stringify(hit._source, null, 4),
                            detail: hit._source,
                            data: hit
                        });
                    });
                })
                .catch(function(err) {
                    searchVM.errors.push({
                        message: err.message
                    });
                })
                .finally(function() {
                    currentSearch = {
                        search: null,
                        cancelled: false
                    };
                    searchVM.searching(false);
                });
        }
        searchVM.doSearch = doSearch;
        searchVM.searchInput.subscribe(function(newValue) {
            if (newValue.length > 1) {
                doSearch();
            } else {
                doClearSearch();
            }
        });
        searchVM.page.subscribe(function() {
            doSearch();
        });

        function buildErrorItem() {
            return div({
                class: 'alert alert-danger',
                role: 'alert'
            }, [
                span({
                    dataBind: {
                        text: 'message'
                    }
                }),
                button({
                    dataBind: {
                        click: '$parent.searchVM.doRemoveError'
                    },
                    type: 'button',
                    class: 'close',
                    ariaLabel: 'Close'
                }, span({
                    class: 'fa fa-times',
                    ariaHidden: 'true'
                }))
            ]);
        }

        function buildLayout() {
            return div({
                class: 'container-fluid'
            }, [
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12',
                    }, [
                        div({
                            dataElement: 'summary'
                        }),
                        '<!-- ko if: searchVM.errors().length > 0 -->',
                        '<!-- ko foreach: searchVM.errors -->',
                        buildErrorItem(),
                        '<!-- /ko -->',
                        '<!-- /ko -->',
                        div({
                            dataElement: 'data'
                        })
                    ])
                ]),
                div({
                    class: 'row'
                }, [
                    div({
                        class: 'col-md-12',
                    }, [
                        div({
                            dataBind: {
                                component: {
                                    name: '"jgisearch/search"',
                                    params: {
                                        searchVM: 'searchVM'
                                    }
                                }
                            }
                        })
                    ])
                ]),

            ]);
        }

        function render() {
            return Promise.try(function() {
                container.innerHTML = buildLayout();
                var vm = {
                    searchVM: searchVM
                };
                ko.applyBindings(vm, container);
            });
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'JGI Search');
            return render();
        }

        function stop() {
            // nothing yet.
        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
                container.innerHTML = '';
            }
        }

        return {
            attach: attach,
            start: start,
            stop: stop,
            detach: detach
        };
    }

    return {
        make: function(config) {
            return factory(config);
        }
    };
});