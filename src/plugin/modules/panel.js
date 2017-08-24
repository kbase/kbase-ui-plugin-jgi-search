define([
    'bluebird',
    'knockout-plus',
    'numeral',
    'marked',
    'kb_common/html',
    'kb_common/jsonRpc/dynamicServiceClient',
    'kb_common/jsonRpc/genericClient',
    './policyViewerDialog',
    'yaml!./import.yml',
    'text!./jgiTerms.md'
], function (
    Promise,
    ko,
    numeral,
    marked,
    html,
    DynamicService,
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

            var showResults = ko.pureComputed(function () {
                return (searching() ||
                    (searchInput() && searchInput().length > 1));
            });
            var noSearch = ko.pureComputed(function () {
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

        function serviceCall(moduleName, functionName, params) {
            var override = runtime.config(['services', moduleName, 'url'].join('.'));
            console.log('overriding?', moduleName, override);
            var token = runtime.service('session').getAuthToken();
            var client;
            if (override) {
                client = new GenericClient({
                    module: moduleName,
                    url: override,
                    token: token
                });
            } else {
                client = new DynamicService({
                    url: runtime.config('services.service_wizard.url'),
                    token: token,
                    module: moduleName
                });
            }
            return client.callFunc(functionName, [
                params
            ]);
        }

        function fetchData(query, page, pageSize) {
            return serviceCall('jgi_gateway_eap', 'search_jgi', {
                    search_string: query,
                    limit: pageSize,
                    page: page - 1
                })
                .catch(function (err) {
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

        var extensionToDataType = {};
        Object.keys(Import.dataTypes).forEach(function (dataTypeId) {
            var dataType = Import.dataTypes[dataTypeId];
            dataType.extensions.forEach(function (extension) {
                extensionToDataType[extension] = dataType;
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

        function grokFileType(extension, indexedFileTypes) {
            // The file type provided by the metadata may be a string, 
            // array, or missing.
            if (!indexedFileTypes) {
                indexedFileTypes = [];
            } else if (typeof indexedFileTypes === 'string') {
                indexedFileTypes = [indexedFileTypes];
            }

            // Rely on the indexed file type to determine the data representation.
            // TODO: how is this determined?
            // Here we find the canonical types, and hopefully condensed down to one...

            var dataTypes = {};
            var encodings = {};

            // First we inspect the indexed file types as provided by JGI. If just 
            // all matching ones resolve to the same data type, we have a 
            // match.
            // At the same time, we get the encoding by the same method.
            // In some cases there is a base data type (e.g. fasta) and a 
            // encoded data type (e.g. fasta.gz) in the file types list provided
            // by jgi.
            indexedFileTypes.forEach(function (type) {
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
            if (Object.keys(dataTypes).length === 1) {
                var dataType = Object.keys(dataTypes)[0];
                var encoding = Object.keys(encodings)[0] || 'none';
                return {
                    dataType: dataType,
                    encoding: encoding
                };
            }

            // If we get here, the file type matching strategy didn't work.
            // Some file types are too generic (e.g. text for genbank).
            // In this case, we just trust the file extension.
            // TODO: we can also inspect other properties of the metadata to 
            // be sure, or to filter for certain properties which tell us we
            // can't import it.
            dataType = extensionToDataType[extension];
            if (dataType) {
                return {
                    dataType: dataType.name,
                    enconding: null
                };
            }
            return {
                dataType: null,
                encoding: null
            };
        }

        /*
            staging status is currently returned as a message string. 
            We unpack that here.
            {
                status: 'queued' || 'restoring' || 'copying' || 'complete'
            }
        */

        function grokStageStats(message) {
            // NOTE: yes the strings are quoted!
            var queuedRe = /^"In_Queue"$/;
            var progressRe = /^"In Progress\. Total files = ([\d]+)\. Copy complete = ([\d]+)\. Restore in progress = ([\d]+)\. Copy in progress = ([\d]+)"$/;
            var completedRe = /^"Transfer Complete\. Transfered ([\d]+) files\."$/;

            // console.log('progress?', message, typeof message, queuedRe.exec(message), completedRe.exec(message), progressRe.exec(message));

            if (queuedRe.exec(message)) {
                return {
                    status: 'queued'
                };
            }

            if (completedRe.exec(message)) {
                return {
                    status: 'completed'
                };
            }

            var m = progressRe.exec(message);
            // console.log('m', m, message, message.length, typeof message);
            if (!m) {
                return {
                    status: 'unknown(1)'
                };
            }

            // For now we just support one file at a time.
            // If we support more than one file, this logic will need to change to
            // support that.
            var totalFiles = parseInt(m[1]);
            var completed = parseInt(m[2]);
            var restoring = parseInt(m[3]);
            var copying = parseInt(m[4]);

            if (completed) {
                return {
                    status: 'completed'
                };
            }
            if (restoring) {
                return {
                    status: 'restoring'
                };
            }
            if (copying) {
                return {
                    status: 'copying'
                };
            }

            return {
                status: 'unknown(2)'
            };

        }

        var statusConfig = {
            queued: {
                color: 'orange',
                label: 'Queued'
            },
            restoring: {
                label: 'Restoring',
                color: 'gray'
            },
            copying: {
                label: 'Copying',
                color: 'green'
            },
            completed: {
                label: 'Completed',
                color: 'blue'
            }
        };

        function monitorProgress(jobId, progress, color) {
            function checkProgress() {
                return serviceCall('jgi_gateway_eap', 'stage_status', {
                        job_id: jobId
                    })
                    .spread(function (result, stats) {
                        // hmph, value comes back as a simple string.
                        var stageStats = grokStageStats(result.message);
                        if (!result) {
                            progress('hmm, no progress.');
                            return;
                        }
                        progress(stageStats.status);

                        color(statusConfig[stageStats.status].color);

                        if (stageStats.status === 'completed') {
                            return;
                        }

                        window.setTimeout(checkProgress, 1000);
                    })
                    .catch(function (err) {
                        progress(err.message);
                    });
            }
            checkProgress();
        }

        function doStage(stagingSpec) {
            return serviceCall('jgi_gateway_eap', 'stage_objects', {
                    ids: [stagingSpec.indexId]
                })
                .spread(function (result) {
                    if (result) {
                        stagingSpec.stagingStatus('Staging submitted with job id ' + result.job_id);
                        monitorProgress(result.job_id, stagingSpec.stagingProgress, stagingSpec.stagingProgressColor);
                    } else {
                        stagingSpec.stagingStatus('unknown - see console');
                    }
                    return result;
                })
                .catch(function (err) {
                    console.error('ERROR', err, stagingSpec);
                    stagingSpec.stagingStatus('error - ' + err.message);
                    throw err;
                });
        }

        function grokFastq(dataTypeDef, hit) {

            // determine the actual target type.
            var kbaseType;
            var error = null;
            var sequencingTech = getProp(hit._source.metadata, ['physical_run.platform_name', 'sow_segment.platform']);
            if (sequencingTech) {
                switch (sequencingTech) {
                case 'Illumina':
                    var multiplexType = getProp(hit._source.metadata, ['physical_run_unit.multiplex_type']);
                    switch (multiplexType) {
                    case 'Multiplex Paired-End':
                        kbaseType = dataTypeDef.kbaseTypes.pairedEnd;
                        break;
                    case 'Multiplex Single-Read':
                        kbaseType = dataTypeDef.kbaseTypes.singleEnd;
                        break;
                    default:
                        error = 'cannot determine kbase type - from Illumina metadata';
                    }
                    break;
                case 'PacBio':
                    kbaseType = dataTypeDef.kbaseTypes.singleEnd;
                    break;
                default:
                    error = 'cannot determine - unhandled tech: ' + sequencingTech;
                }

            } else {
                error = 'cannot determine - no sequencing tech provided';
            }


            // maybe it won't even work.
            return {
                metadata: [{
                    key: 'sequencing_technology',
                    value: getProp(hit._source.metadata, ['physical_run.platform_name', 'sow_segment.platform'])
                }, {
                    key: 'actual_insert_size_kb',
                    value: getProp(hit._source.metadata, ['sow_segment.actual_insert_size_kb'], 'n/a')
                }, {
                    key: 'mean_insert_size_kb',
                    value: getProp(hit._source.metadata, ['rqc.read_qc.illumina_read_insert_size_avg_insert'], 'n/a')
                }, {
                    key: 'stdev_insert_size_kb',
                    value: getProp(hit._source.metadata, ['rqc.read_qc.illumina_read_insert_size_std_insert'], 'n/a')
                }],
                kbaseType: kbaseType,
                error: error
            };
        }

        function grokImportMetadata(dataTypeDef, hit) {
            // do as switch, need to modularize this into objects...
            switch (dataTypeDef.name) {
            case 'fastq':
                return grokFastq(dataTypeDef, hit);
            case 'genbank':
                return (function () {
                    var scientificName = grokScientificName(hit);
                    var metadata = [{
                        key: 'scientific_name',
                        value: scientificName.scientificName
                    }];
                    return {
                        metadata: metadata,
                        kbaseType: dataTypeDef.kbaseType,
                        error: null
                    };
                }());
            case 'genefeatures':
                return (function () {
                    var scientificName = grokScientificName(hit);
                    var metadata = [{
                        key: 'scientific_name',
                        value: scientificName.scientificName
                    }];
                    return {
                        metadata: metadata,
                        kbaseType: dataTypeDef.kbaseType,
                        error: null
                    };
                }());
            case 'fasta':
                return (function () {
                    var scientificName = grokScientificName(hit);
                    var metadata = [{
                        key: 'scientific_name',
                        value: scientificName.scientificName
                    }];
                    return {
                        metadata: metadata,
                        kbaseType: dataTypeDef.kbaseType,
                        error: null
                    };
                }());
            default:
                var metadata = [{
                    key: 'someday',
                    value: 'it will work'
                }];
                return {
                    metadata: metadata,
                    // kbaseType: dataTypeDef.kbaseType,
                    kbaseType: null,
                    error: 'no import available'
                };
            }
        }

        function getImportInfo(dataType, indexId, fileName, hit) {
            // console.log('getting import info:', dataType, indexId);
            if (!dataType) {
                return null;
            }
            // get the import spec
            // for now a simple filter
            var dataTypeDef = Import.dataTypes[dataType];
            if (!dataTypeDef) {
                throw new Error('unsupported data type: ' + dataType);
            }
            var importMetadata = grokImportMetadata(dataTypeDef, hit);
            // console.log('grokked?', importMetadata);
            return {
                importSpec: dataTypeDef,
                kbaseType: importMetadata.kbaseType,
                error: importMetadata.error,
                importMetadata: importMetadata.metadata,
                stagingSpec: {
                    indexId: indexId,
                    doStage: function (data) {
                        doStage(data);
                    },
                    stagingStatus: ko.observable(),
                    stagingProgress: ko.observable(),
                    stagingProgressColor: ko.observable(),
                    fileName: ko.observable(fileName)
                }
            };
        }

        function grokTitle(hit, fileType) {
            switch (fileType.dataType) {
            case 'genbank':
                return getProp(hit._source.metadata, ['pmo_project.name'], hit._source.file_name);
            case 'fasta':
            case 'fastq':
            default:
                return getProp(hit._source.metadata, ['sequencing_project.sequencing_project_name'], hit._source.file_name);
            }
        }

        function grokScientificName(hit) {
            // var na = span({ style: { color: 'gray' } }, 'n/a');
            var genus = getProp(hit._source.metadata, [
                'genus',
                'sow_segment.genus',
                'pmo_project.genus'
            ]);
            var species = getProp(hit._source.metadata, [
                'species',
                'sow_segment.species',
                'pmo_project.species'
            ]);
            var strain = getProp(hit._source.metadata, [
                'strain',
                'sow_segment.strain',
                'pmo_project.strain'
            ]);
            var scientificName = (genus || '?') + ' ' + (species || '?') + (strain ? ' ' + strain : '');
            return {
                genus: genus,
                species: species,
                strain: strain,
                scientificName: scientificName
            };
        }

        function grokPI(hit, fileType) {
            var lastName = getProp(hit._source.metadata, 'proposal.pi.last_name');
            var firstName = getProp(hit._source.metadata, 'proposal.pi.first_name');
            if (lastName) {
                return lastName + ', ' + firstName;
            }
            var piName = getProp(hit._source.metadata, 'pmo_project.pi_name');
            if (piName) {
                var names = piName.split(/\s+/);
                if (names) {
                    return names[1] + ', ' + names[0];
                }
            }
            return '-';
        }

        function grokMetadata(hit, fileType) {
            switch (fileType.dataType) {
            case 'fasta':
                return 'lib: ' + getProp(hit._source.metadata, [
                    'library_names.0',
                    'sow_segment.library_name'
                ]);
            case 'fastq':
                return div([
                    div('lib: ' + getProp(hit._source.metadata, [
                        'library_name',
                        'sow_segment.library_name'
                    ])),
                    div('type: ' + getProp(hit._source.metadata, ['fastq_type']))
                ]);
            case 'genbank':
                return 'file: ' + getProp(hit._source, ['file_name'], '-');
            default:
                return normalizeFileType(hit._source.file_type);
            }
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

            // Massage search input:
            // For now, we just support terms, possibly double-quoted, which are all
            // anded together.
            var searchExpression = searchVM.searchInput().split(/\s+/).map(function (term) {
                if (term.length > 0) {
                    if (!/[\+\-]/.test(term.charAt(0))) {
                        return '+' + term;
                    }
                }
            }).join(' ');

            return currentSearch.search = fetchData(searchExpression, searchVM.page(), searchVM.pageSize())
                .spread(function (result, stats) {
                    if (thisSearch.cancelled) {
                        return;
                    }
                    var searchElapsed = new Date().getTime() - searchStart;
                    console.log('search results', result);
                    console.log('search service elapsed', searchElapsed);
                    searchVM.searchResults.removeAll();
                    searchVM.searchElapsed(stats.request_elapsed_time);
                    searchVM.searchServiceElapsed(searchElapsed);
                    searchVM.searchTotal(result.search_result.total);
                    result.search_result.hits.forEach(function (hit, index) {
                        // var project = hit._source.metadata;
                        var rowNumber = (searchVM.page() - 1) * searchVM.pageSize() + 1 + index;
                        var projectId;
                        if (hit._source.metadata.sequencing_project_id) {
                            projectId = hit._source.metadata.sequencing_project_id;
                        } else {
                            projectId = 'n/a';
                        }

                        var proposalId = getProp(hit._source.metadata, ['proposal_id'], '-');

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

                        // Title
                        var title = grokTitle(hit, fileType);

                        var scientificName = grokScientificName(hit, fileType);

                        // scientific name may be in different places.

                        // By type metadata.
                        var metadata = grokMetadata(hit, fileType);

                        var pi = grokPI(hit, fileType);

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
                            proposalId: proposalId,
                            projectId: projectId,
                            pi: pi,
                            metadata: metadata,
                            scientificName: scientificName.scientificName,
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
                            importSpec: getImportInfo(fileType.dataType, hit._id, hit._source.file_name, hit),
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
                .catch(function (err) {
                    searchVM.errors.push({
                        message: err.message
                    });
                })
                .finally(function () {
                    currentSearch = {
                        search: null,
                        cancelled: false
                    };
                    searchVM.searching(false);
                });
        }
        searchVM.doSearch = doSearch;
        searchVM.searchInput.subscribe(function (newValue) {
            if (newValue.length > 1) {
                doSearch();
            } else {
                doClearSearch();
            }
        });
        searchVM.page.subscribe(function () {
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
            return Promise.try(function () {
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
        make: function (config) {
            return factory(config);
        }
    };
});