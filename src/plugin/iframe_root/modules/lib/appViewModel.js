define([
    'knockout',
    'numeral',
    './model',
    './utils'
], function (
    ko,
    numeral,
    Model,
    utils
) {
    'use strict';

    class AppViewModel {
        constructor({runtime}) {
            this.model = new Model({
                runtime: runtime
            });
        }

        getDetail(id) {
            return this.model.fetchDetail(id)
                .then((result) => {
                    const hit = result.hits[0];
                    let projectId;
                    if (hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id) {
                        projectId = hit.source.metadata.sequencing_project_id || hit.source.metadata.pmo_project_id;
                    } else {
                        projectId = 'n/a';
                    }

                    const proposalId = utils.getProp(hit.source.metadata, ['proposal_id'], '-');
                    // actual file suffix.
                    const fileParts = utils.grokFileParts(hit.source.file_name);
                    const fileType = utils.grokFileType(hit.source.file_type, fileParts);
                    // Title
                    const title = utils.grokTitle(hit, fileType);
                    const scientificName = utils.grokScientificName(hit, fileType);
                    // By type metadata.
                    const metadata = utils.grokMetadata(hit, fileType);
                    const pi = utils.grokPI(hit, fileType);

                    // have a current transfer job?
                    // const jobs = this.stagingJobsVm.stagingJobs().filter((job) => {
                    //     return job.dbId === hit.id;
                    // });
                    // const transferJob = jobs[0];
                    let analysisProject;
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
                    let sequencingProject;
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
                        score: numeral(hit.score).format('00.00'),
                        type: hit.type,
                        title: title,
                        date: utils.usDate(hit.source.file_date),
                        modified: utils.usDate(hit.source.modified),
                        // fileExtension: fileExtension,
                        fileType: utils.normalizeFileType(hit.source.file_type),
                        // TODO: these should all be in just one place.
                        dataType: fileType.dataType,
                        proposalId: proposalId,
                        projectId: projectId,
                        pi: pi,
                        metadata: metadata,
                        scientificName: scientificName.scientificName,
                        file: {
                            parts: fileParts,
                            name: hit.source.file_name,
                            // baseName: fileBaseName,
                            // extension: fileExtension,
                            dataType: fileType.dataType,
                            encoding: fileType.encoding,
                            indexedType: utils.normalizeFileType(hit.source.file_type),
                            size: numeral(hit.source.file_size).format('0.0 b'),
                            added: utils.usDate(hit.source.added_date),
                            status: hit.source.file_status,
                            types: utils.normalizeFileType(hit.source.file_type),
                            typing: fileType,
                            md5sum: hit.source.md5sum
                        },
                        proposal: hit.source.metadata.proposal,
                        sequencingProject: sequencingProject,
                        analysisProject: analysisProject,
                        // importSpec: getImportInfo(fileType.dataType, hit.id, hit.source.file_name, hit),
                        showInfo: ko.observable(false),
                        detailFormatted: JSON.stringify(hit.source, null, 4),
                        source: hit.source,
                        data: hit,
                        // UI
                        // transferJob: ko.observable(transferJob)
                    };
                });
        }
    }

    return AppViewModel;
});