define([
    'numeral',
    'knockout-plus',
    '../lib/utils',
    './components/controls/inspectControl',
    './components/controls/stageControl',
    './components/controls/stageStatus',
], function (
    numeral,
    ko,
    utils,
    InspectControl,
    StageControl,
    StageStatus
) {
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
                name: 'doAddPi'
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
                name: 'doAddProposal'
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
                name: 'doAddProject'
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
            component: InspectControl.name(),
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
            width: 6,
            component: StageControl.name(),
            rowStyle: {
                textAlign: 'center'
            },
            headerStyle: {
                textAlign: 'center'
            }
        }
        // {
        //     name: 'status',
        //     label: 'Status',
        //     width: 5,
        //     component: StageStatus.name(),
        //     rowStyle: {
        //         textAlign: 'center'
        //     },
        //     headerStyle: {
        //         textAlign: 'center'
        //     }
        // }
    ];

    var columnsMap = columns.reduce(function (acc, col) {
        acc[col.name] = col;
        return acc;
    }, {});

    function validateFilename(filename) {
        if (!filename || filename.length === 0) {
            return 'A filename may not be blank';
        } 
        if (!filename.trim(' ').length === 0) {
            return 'A filename not consist entirely of spaces';
        }
        if (/^\..*$/.test(filename)) {
            return 'Dot files not allowed';
        }
        if (/^[\s]+\..*$/.test(filename)) {
            return 'A filename with only spaces before the first dot not allowed';
        }
        if (/\//.test(filename)) {
            return 'Invalid character in filename: /';
        }
        if (/[\\/:*?"<>|]/.test(filename)) {
            return 'Invalid character in filename: \\ / : * ? " < > | ';
        }
        if (/[[\\u0000-\\u001F\\u007F\\u0080-\\u009F]]/.test(filename)) {
            return 'File contains non-printable characters';
        }
        return null;
    }

    function hitsToRows(hits, doStage) {
    // function hitsToRows(hits, doStage, jobMap) {
        return hits.map(function (hit, index) {
            // var rowNumber = (page() - 1) * pageSize() + 1 + index;

            var sequencingProjectId = (function (id) {
                return {
                    value: id,
                    info: 'Sequencing project id'
                };
            }(utils.getProp(hit.source.metadata, ['sequencing_project_id'])));

            var pmoProjectId = (function (id) {
                return {
                    value: id
                };
            }(utils.getProp(hit.source.metadata, ['pmo_project_id'])));

            var analysisProjectId = utils.getProp(hit.source.metadata, ['analysis_project_id'], '-');

            var proposalId = {
                value: utils.getProp(hit.source.metadata, ['proposal_id']),
                info: utils.getProp(hit.source.metadata, ['proposal.title'], 'Proposal title unavailable')
            };

            var fileParts = utils.grokFileParts(hit.source.file_name);
            
            var fileType = utils.grokFileType(hit.source.file_type, fileParts);

            var title = utils.grokTitle(hit, fileType);

            var scientificName = utils.grokScientificName(hit, fileType);

            var pi = utils.grokPI(hit, fileType);

            // TODO move this out to a function:
            var s1;
            var portalLocation = utils.getProp(hit, 'source.metadata.portal.display_location');
            if (portalLocation && portalLocation instanceof Array) {
                if (portalLocation.length > 0) {
                    if (portalLocation.length > 1) {
                        console.warn('more than one portal display location');
                    }
                    switch (fileType.dataType) {
                    case 'fastq':
                        switch (portalLocation[0]) {
                        case 'Raw Data':
                            s1 = {
                                value: 'raw',
                                info: 'Raw Data'
                            };
                            break;
                        case 'QC Filtered Raw Data':
                            s1 = {
                                // value: 'QCFil',
                                value: 'filtered',
                                info: 'QC Filtered Raw Data'
                            };
                            break;
                        case 'QA Filtered Raw Data':
                            s1 = {
                                // value: 'QAFil',
                                value: 'filtered',
                                info: 'QA Filtered Raw Data'
                            };
                            break;
                        case 'Metatranscriptome Filtered Data':
                            s1 = {
                                value: 'MetaFil',
                                info: 'Metatranscriptome Filtered Data'
                            };
                            break;
                        case 'QC and Genome Assembly':
                            s1 = {
                                value: 'QCGenAss',
                                info: 'QC and Genome Assembly'
                            };
                            break;
                        default:
                            if (portalLocation[0]) {
                                s1 = {
                                    value: '?',
                                    info: 'Unrecognized reads type "' + utils.getProp(hit, 'source.metadata.portal.display_location', '-')
                                };
                            } else {
                                s1 = {
                                    value: '?',
                                    info: 'No reads type defined'
                                };
                            }
                            s1 = '*' + utils.getProp(hit, 'source.metadata.portal.display_location', '-');
                        }
                        break;
                    }
                } else if (portalLocation.length === 0) {
                    console.warn('empty portal location');
                }
            }
            if (!s1) {
                s1 = {
                    value: '-',
                    info: ''
                };
            }

            var s2;
            switch (fileType.dataType) {
            case 'fastq':
                // s2 = utils.getProp(hit, 'source.metadata.sow_segment.index_sequence', '-');
                if (utils.hasProp(hit, 'source.metadata.gold_data')) {
                    var goldLabel;
                    var goldUrl;
                    if (utils.hasProp(hit, 'source.metadata.gold_data.gold_url')) {
                        goldUrl = utils.getProp(hit, 'source.metadata.gold_data.gold_url');
                        goldLabel = 'GOLD';
                    } else if (utils.hasProp(hit, 'source.metadata.gold_data.gold_stamp_id')) {
                        var goldId = utils.getProp(hit, 'source.metadata.gold_data.gold_stamp_id');
                        goldUrl = 'https://gold.jgi.doe.gov/projects?id=' + goldId;
                        if (!/^Gp/.test(goldId)) {
                            goldLabel = 'GOLD?';
                        } else {
                            goldLabel = 'GOLD*';
                        }
                    }
                    if (goldUrl) {
                        s2 = {
                            value: goldLabel,
                            info: 'Link to gold record',
                            url: goldUrl
                        };
                    } 
                }                           
                break;                        
            }

            var stagingInfo;
        
            if (fileType.error) {
                stagingInfo = fileType.error.message;
            } else {
                stagingInfo = 'Copy this file to your staging area';
            }

            return {
                id: hit.id,
                // rowNumber: rowNumber,
                title: title,
                pi: pi,
                proposalId: proposalId,
                analysisProjectId: analysisProjectId,
                pmoProjectId: pmoProjectId,
                sequencingProjectId: sequencingProjectId,
                date: {
                    value: new Date(hit.source.file_date),
                    info: 'The file date'
                },
                scientificName: scientificName,
                dataType: {
                    value: fileType.dataType,
                    info: 'The file format'
                },
                s1: s1,
                s2: s2,
                fileSize: {
                    value: hit.source.file_size,
                    info: numeral(hit.source.file_size).format('0.0 b') + '\n(the size of the file)'
                },
                // view stuff
                selected: ko.observable(false),
                isPublic: utils.getProp(hit, 'source._es_public_data', false),
                // doTransfer: function () {
                //     try {
                //         doStage(hit.id, hit.source.file_name);
                //     } catch (ex) {
                //         console.error('ERROR staging', ex);
                //     }
                // },
                stage: {
                    value: hit.source.file_name,
                    info: stagingInfo,
                    fileName: hit.source.file_name
                },
                // For reference, not direct display
                // transferJob: ko.observable(jobMap[hit.id]),
                transferJob: ko.observable(),
                fileType: fileType
            };

        });
    }

    return {
        columns: columns,
        columnsMap: columnsMap,
        validateFilename: validateFilename,
        hitsToRows: hitsToRows
    };
});