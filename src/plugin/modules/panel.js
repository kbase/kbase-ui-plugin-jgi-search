define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/dynamicServiceClient',
    './policyViewerDialog',
    'yaml!./import.yml',
    'text!./jgiTerms.md'
], function(
    Promise,
    ko,
    numeral,
    marked,
    html,
    GenericClient,
    PolicyViewerDialog,
    Import,
    JGITerms
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        button = t('button'),
        div = t('div');

    var jgiTermsText = marked(JGITerms);

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
        if (typeof props === 'string') {
            props = [props];
        }

        function getit(o, p) {
            if (p.length === 0) {
                return;
            }
            var value;
            if (o instanceof Array) {
                var index = parseInt(o.pop());
                if (isNaN(index)) {
                    return;
                }
                value = o[index];
            } else {
                value = o[p.pop()];
            }
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

        function JGITerms() {
            var text = jgiTermsText;
            var agreed = ko.observable(false);

            function doAgree() {
                agreed(true);
            }

            function doView() {
                // show viewer here
                PolicyViewerDialog.showDialog({
                    agreed: agreed
                });
                // showAgreementDialog()
                //     .then(function(answer) {
                //         console.log('answer is', answer);
                //     });
            }

            return {
                text: text,
                agreed: agreed,
                doAgree: doAgree,
                doView: doView
            };
        }

        // VM

        function SearchVM() {
            function doRemoveError(data) {
                vm.errors.remove(data);
            }

            var searchResults = ko.observableArray();

            var searchInput = ko.observable();

            var searching = ko.observable(false);

            var showResults = ko.pureComputed(function() {
                return (searching() ||
                    (searchInput() && searchInput().length > 1));
            });
            var noSearch = ko.pureComputed(function() {
                return (!searchInput() || searchInput().length < 2);
            });

            function doAddToSearch(data, field) {
                var newSearchInput = data[field];
                if (!data[field]) {
                    return;
                }
                switch (typeof newSearchInput) {
                    case 'string':
                        // normal, nothing to do.
                        break;
                    case 'number':
                        newSearchInput = String(newSearchInput);
                        break;
                    default:
                        errors.push('Search type not supported: ' + typeof newSearchInput);

                }
                searchInput(newSearchInput);
            }

            var vm = {
                searchInput: searchInput,
                searchResults: searchResults,
                searchTotal: ko.observableArray(),
                searchElapsed: ko.observable(),
                searchServiceElapsed: ko.observable(),
                searching: searching,
                showResults: showResults,
                noSearch: noSearch,
                doAddToSearch: doAddToSearch,

                // Defaults to 10, but the search component may sync this
                // with a page setting control
                pageSize: ko.observable(10),
                // Note, starts with 1.
                page: ko.observable(1),
                errors: ko.observableArray(),
                doRemoveError: doRemoveError,

                jgiTerms: JGITerms()
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
                module: 'jgi_gateway_eap'
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

        var extensionToType = {};
        Import.fileTypes.forEach(function(fileType) {
            fileType.extensions.forEach(function(extension) {
                extensionToType[extension] = fileType;
            });
        });

        /*
        getFileType determines the file type as we need to know it. 
        A file has a fundamental type, a specific format, and an encoding.
        e.g.:
        {
            type: 'fastq',
            encoding: 'gzip'
        }
        */
        var typeToRepresentation = {
            fastq: 'fastq'
        };

        function grokFileType(extension, fileTypes) {
            // console.log('grok', extension, fileTypes);
            if (!fileTypes) {
                fileTypes = [];
            } else if (typeof fileTypes === 'string') {
                fileTypes = [fileTypes];
            }

            // Rely on the indexed file type to determine the data representation.
            // TODO: how is this determined?
            // Here we find the canonical types, and hopefully condensed down to one...
            var dataTypes = {};
            var encodings = {};
            fileTypes.forEach(function(type) {
                var indexedType = Import.indexedTypes[type];
                // console.log('grokking...', type, indexedType);
                if (indexedType) {
                    if (indexedType.dataType) {
                        dataTypes[indexedType.dataType] = true;
                    }
                    if (indexedType.encoding) {
                        encodings[indexedType.encoding] = true;
                    }
                }
            });
            if (Object.keys(dataTypes).length > 1) {
                throw new Error('Too many types matched: ' + dataTypes.join(', '));
            }
            if (Object.keys(encodings).length > 1) {
                throw new Error('Too many encodings matched: ' + encodings.joins(', '));
            }
            var dataType = Object.keys(dataTypes)[0];
            var encoding = Object.keys(encodings)[0];

            return {
                dataType: dataType,
                encoding: encoding
            };
        }

        function doStage(importStagingSpec) {
            console.log('about to stage ...', importStagingSpec);
            var JGISearch = new GenericClient({
                url: runtime.config('services.service_wizard.url'),
                token: runtime.service('session').getAuthToken(),
                module: 'jgi_gateway_eap'
            });
            return JGISearch.callFunc('stage_objects', [{
                    ids: [importStagingSpec.stagingSpec.indexId]
                }])
                .then(function(result) {
                    console.log('staged?', result);
                    if (result[0] && result[0][importStagingSpec.stagingSpec.indexId]) {
                        var stagingResponse = result[0][importStagingSpec.stagingSpec.indexId];
                        importStagingSpec.stagingSpec.stagingStatus('Staging submitted with job id ' + stagingResponse.id);
                    } else {
                        importStagingSpec.stagingSpec.stagingStatus('unknown - see console');
                    }
                    return result[0];
                })
                .catch(function(err) {
                    console.error('ERROR', err, importStagingSpec);
                    throw err;
                });
        }

        function getImportInfo(dataType, indexId) {
            // console.log('getting import info:', dataType, indexId);
            if (!dataType) {
                return [];
            }
            // get the import spec
            // for now a simple filter
            var specs = Import.import.filter(function(item) {
                return (item.dataType === dataType);
            }).map(function(spec) {
                return {
                    importSpec: spec,
                    stagingSpec: {
                        indexId: indexId,
                        doStage: function(data) {
                            doStage(data);
                        },
                        stagingStatus: ko.observable()
                    }
                };
            });

            // do some transformation

            // return it...
            return specs;
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
            var searchStart = new Date().getTime();
            return currentSearch.search = fetchData(searchVM.searchInput(), searchVM.page(), searchVM.pageSize())
                .then(function(data) {
                    if (thisSearch.cancelled) {
                        return;
                    }
                    var searchElapsed = new Date().getTime() - searchStart;
                    console.log('search results', data);
                    console.log('search service elapsed', searchElapsed);
                    searchVM.searchResults.removeAll();
                    searchVM.searchElapsed(data.search_elapsed_time);
                    searchVM.searchServiceElapsed(searchElapsed);
                    searchVM.searchTotal(data.results.total);
                    data.results.hits.forEach(function(hit, index) {
                        // var project = hit._source.metadata;
                        var rowNumber = (searchVM.page() - 1) * searchVM.pageSize() + 1 + index;
                        var projectId;
                        if (hit._source.metadata.sequencing_project_id) {
                            projectId = hit._source.metadata.sequencing_project_id;
                        } else {
                            projectId = 'n/a';
                        }
                        var title = getProp(hit._source.metadata, ['sequencing_project.sequencing_project_name'], hit._source.file_name);

                        // actual file suffix.
                        var fileExtension;
                        var reExtension = /^(.*)\.(.*)$/;
                        var fileName = hit._source.file_name;
                        var m = reExtension.exec(fileName);
                        if (m) {
                            fileExtension = m[2];
                        } else {
                            fileExtension = null;
                        }
                        var fileType = grokFileType(fileExtension, hit._source.file_type);

                        // scientific name may be in different places.
                        var genus = getProp(hit._source.metadata, [
                            'genus',
                            'sow_segment.genus'
                        ]);
                        var species = getProp(hit._source.metadata, [
                            'species',
                            'sow_segment.species'
                        ]);
                        var scientificName = genus + ' ' + species;

                        // By type metadata.
                        var metadata = '';
                        switch (fileType.dataType) {
                            case 'fasta':
                                metadata += 'lib: ' + getProp(hit._source.metadata, [
                                    'library_names.0',
                                    'sow_segment.library_name'
                                ]);
                                break;
                            case 'fastq':
                                metadata += 'lib: ' + getProp(hit._source.metadata, [
                                    'library_name',
                                    'sow_segment.library_name'
                                ]);
                                break;
                            default:
                                metadata += normalizeFileType(hit._source.file_type);
                        }

                        var pi = getProp(hit._source.metadata, 'proposal.pi.last_name');
                        searchVM.searchResults.push({
                            rowNumber: rowNumber,
                            score: numeral(hit._score).format('00.00'),
                            type: hit._type,
                            title: title,
                            date: usDate(hit._source.file_date),
                            modified: usDate(hit._source.modified),
                            fileExtension: fileExtension,
                            fileType: normalizeFileType(hit._source.file_type),
                            // TODO: these should all be in just one place.
                            dataType: fileType.dataType,
                            projectId: projectId,
                            pi: pi,
                            metadata: metadata,
                            scientificName: scientificName,
                            file: {
                                name: hit._source.file_name,
                                extension: fileExtension,
                                dataType: fileType.dataType,
                                encoding: fileType.encoding,
                                indexedType: normalizeFileType(hit._source.file_type),
                                size: numeral(hit._source.file_size).format('0.0 b'),
                                added: usDate(hit._source.added_date),
                                status: hit._source.file_status,
                                types: normalizeFileType(hit._source.file_type)
                            },
                            proposal: hit._source.metadata.proposal,
                            project: {
                                name: getProp(hit._source.metadata, 'sequencing_project.sequencing_project_name'),
                                id: getProp(hit._source.metadata, 'sequencing_project.sequencing_project_id'),
                                status: getProp(hit._source.metadata, 'sequencing_project.current_status'),
                                statusDate: getProp(hit._source.metadata, 'sequencing_project.status_date'),
                                comments: getProp(hit._source.metadata, 'sequencing_project.comments')
                            },
                            importSpecs: getImportInfo(fileType.dataType, hit._id),
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
                                // doAddToSearch: doAddToSearch
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