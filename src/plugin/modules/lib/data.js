define([
    './rpc',
    './utils'
], function (
    Rpc,
    utils
) {
    'use strict';

    function factory(config) {

        var rpc = Rpc.make({
            runtime: config.runtime
        });

        // Fetch details for a given search result item.
        function fetchDetail(id) {
            var query = {
                _id: id
            };
            var param = {
                query: query,
                filter: null,
                fields: null,
                limit: 1,
                page: 1,
                include_private: 0
            };
            return rpc.call('jgi_gateway_eap', 'search', param)
                .catch(function (err) {
                    console.error('ERROR', err, query, typeof page, typeof pageSize);
                    throw err;
                })
                .spread(function (result, err) {
                    if (result) {
                        return result;
                    }
                    if (err) {
                        console.error('error fetching search detail ', err);
                        throw new Error('Need to handle this error: ' + err.message);
                    } else {
                        throw new Error('Hmm, should have a result or an error!');
                    }
                });
        }

        function getDetail(id) {
            return fetchDetail(id)
                .then(function (result) {
                    // var project = hit.source.metadata;
                    var hit = result.hits[0];
                    // var rowNumber = (page() - 1) * pageSize() + 1 + index;
                    var projectId;
                    if (hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id) {
                        projectId = hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id;
                    } else {
                        projectId = 'n/a';
                    }

                    var proposalId = utils.getProp(hit.source.metadata, ['proposal_id'], '-');

                    // actual file suffix.
                    var fileExtension;
                    var reExtension = /^(.*)\.(.*)$/;
                    var fileName = hit.source.file_name;
                    var m = reExtension.exec(fileName);
                    if (m) {
                        fileExtension = m[2];
                    } else {
                        fileExtension = null;
                    }
                    var fileType = utils.grokFileType(fileExtension, hit.source.file_type);

                    // Title
                    var title = utils.grokTitle(hit, fileType);

                    var scientificName = utils.grokScientificName(hit, fileType);

                    // scientific name may be in different places.

                    // By type metadata.
                    var metadata = utils.grokMetadata(hit, fileType);

                    var pi = utils.grokPI(hit, fileType);

                    // have a current transfer job?

                    var jobs = stagingJobs().filter(function (job) {
                        return job.dbId === hit.id;
                    });
                    var transferJob = jobs[0];
                    // console.log('HIT', hit);
                    var analysisProject;
                    if (utils.hasProp(hit.source.metadata, 'analysis_project')) {
                        analysisProject = {
                            name: utils.getProp(hit.source.metadata, 'analysis_project.analysisProjectName'),
                            assemblyMethod: utils.getProp(hit.source.metadata, 'analysis_project.assemblyMethod'),
                            genomeType: utils.getProp(hit.source.metadata, 'analysis_project.genomeType'),
                            id: utils.getProp(hit.source.metadata, 'analysis_project.itsAnalysisProjectId'),
                            modificationDate: utils.getProp(hit.source.metadata, 'analysis_project.modDate'),
                            comments: utils.getProp(hit.source.metadata, 'analysis_project.comments')
                        };
                    }
                    var sequencingProject;
                    if (utils.hasProp(hit.source.metadata, 'sequencing_project')) {
                        sequencingProject = {
                            name: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_name'),
                            id: utils.getProp(hit.source.metadata, 'sequencing_project.sequencing_project_id'),
                            status: utils.getProp(hit.source.metadata, 'sequencing_project.current_status'),
                            statusDate: utils.getProp(hit.source.metadata, 'sequencing_project.status_date'),
                            comments: utils.getProp(hit.source.metadata, 'sequencing_project.comments')
                        };
                    }
                    return {
                        // rowNumber: rowNumber,
                        id: hit.id,
                        score: hit.score, // numeral(hit.score).format('00.00'),
                        type: hit.type,
                        title: title,
                        date: utils.usDate(hit.source.file_date),
                        modified: utils.usDate(hit.source.modified),
                        fileExtension: fileExtension,
                        fileType: utils.normalizeFileType(hit.source.file_type),
                        // TODO: these should all be in just one place.
                        dataType: fileType.dataType,
                        proposalId: proposalId,
                        projectId: projectId,
                        pi: pi,
                        metadata: metadata,
                        scientificName: scientificName.scientificName,
                        file: {
                            name: hit.source.file_name,
                            extension: fileExtension,
                            dataType: fileType.dataType,
                            encoding: fileType.encoding,
                            indexedType: utils.normalizeFileType(hit.source.file_type),
                            size: numeral(hit.source.file_size).format('0.0 b'),
                            added: utils.usDate(hit.source.added_date),
                            status: hit.source.file_status,
                            types: utils.normalizeFileType(hit.source.file_type)
                        },
                        proposal: hit.source.metadata.proposal,
                        sequencingProject: sequencingProject,
                        analysisProject: analysisProject,
                        importSpec: getImportInfo(fileType.dataType, hit.id, hit.source.file_name, hit),
                        showInfo: ko.observable(false),
                        detailFormatted: JSON.stringify(hit.source, null, 4),
                        source: hit.source,
                        data: hit,
                        // UI
                        transferJob: ko.observable(transferJob)
                    };
                });
        }

        return {
            getDetail: getDetail
        };
    }

    return {
        make: factory
    };
});