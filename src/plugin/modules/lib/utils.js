define([
    'kb_common/html',
    'yaml!./import.yml',

], function (
    html,
    Import
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        style = t('style');

    function komponent(componentDef) {
        return '<!-- ko component: {name: "' + componentDef.name +
            '", params: {' +
            Object.keys(componentDef.params).map(function (key) {
                return key + ':' + componentDef.params[key];
            }).join(',') + '}}--><!-- /ko -->';
    }

    function camelToHyphen(s) {
        return s.replace(/[A-Z]/g, function (m) {
            return '-' + m.toLowerCase();
        });
    }

    function makeStyleAttribs(attribs) {
        if (attribs) {
            return Object.keys(attribs)
                .map(function (rawKey) {
                    var value = attribs[rawKey],
                        key = camelToHyphen(rawKey);

                    if (typeof value === 'string') {
                        return key + ': ' + value;
                    }
                    // just ignore invalid attributes for now
                    // TODO: what is the proper thing to do?
                    return '';
                })
                .filter(function (field) {
                    return field ? true : false;
                })
                .join('; ');
        }
        return '';
    }

    function grokFastq(dataTypeDef, hit) {

        // determine the actual target type.
        var kbaseType;
        var error = null;
        var sequencingTech = getProp(hit.source.metadata, ['physical_run.platform_name', 'sow_segment.platform']);
        if (sequencingTech) {
            switch (sequencingTech) {
            case 'Illumina':
                var multiplexType = getProp(hit.source.metadata, ['physical_run_unit.multiplex_type']);
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
                value: getProp(hit.source.metadata, ['physical_run.platform_name', 'sow_segment.platform'])
            }, {
                key: 'actual_insert_size_kb',
                value: getProp(hit.source.metadata, ['sow_segment.actual_insert_size_kb'], 'n/a')
            }, {
                key: 'mean_insert_size_kb',
                value: getProp(hit.source.metadata, ['rqc.read_qc.illumina_read_insert_size_avg_insert'], 'n/a')
            }, {
                key: 'stdev_insert_size_kb',
                value: getProp(hit.source.metadata, ['rqc.read_qc.illumina_read_insert_size_std_insert'], 'n/a')
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

    function grokTitle(hit, fileType) {
        var sp = getProp(hit.source.metadata, ['sequencing_project.sequencing_project_name']);
        var pp = getProp(hit.source.metadata, ['pmo_project.name']);
        var fn = hit.source.file_name;
        switch (fileType.dataType) {
        case 'genbank':
            return getProp(hit.source.metadata, ['sequencing_project.sequencing_project_name', 'pmo_project.name'], hit.source.file_name);
        case 'fasta':
        case 'fastq':
        default:
            if (sp) {
                return {
                    value: sp,
                    info: sp + '\n(sequencing project name)'
                };
            }
            if (pp) {
                return {
                    value: pp,
                    info: pp + '\n(PMO project name)'
                };
            }
            return {
                value: fn,
                info: fn + '\n(no project name - showing the file name)'
            };
            // return getProp(hit.source.metadata, ['sequencing_project.sequencing_project_name'], hit.source.file_name);
        }
    }

    function properCase(s) {
        if (!s || s.length === 0) {
            return;
        }
        return s[0].toUpperCase() + s.slice(1).toLowerCase();
    }

    function grokScientificName(hit) {
        var org = {};
        if (hasProp(hit.source.metadata, 'genus')) {
            org.info = 'Scientific name';
            ['genus', 'species', 'strain'].forEach(function (key) {
                org[key] = getProp(hit.source.metadata, key, '');
            });
        } else if (hasProp(hit.source.metadata, 'sow_segment.genus')) {
            org.info = 'from SOW Segment';
            ['genus', 'species', 'strain'].forEach(function (key) {
                org[key] = getProp(hit.source.metadata, 'sow_segment.' + key, '');
            });
        } else if (hasProp(hit.source.metadata, 'pmo_project.genus')) {
            org.info = 'from PMO Project';
            ['genus', 'species', 'strain'].forEach(function (key) {
                org[key] = getProp(hit.source.metadata, 'pmo_project.' + key, '');
            });
        } else if (hasProp(hit.source.metadata, 'gold_data.genus')) {
            org.info = 'from GOLD';
            ['genus', 'species', 'strain'].forEach(function (key) {
                org[key] = getProp(hit.source.metadata, 'gold_data.' + key, '');
            });
        } else if (hasProp(hit.source.metadata, 'analysis_project.ncbiSpecies')) {
            ['genus', 'species', 'strain'].forEach(function (key) {
                org[key] = getProp(hit.source.metadata, 'analysis_project.ncbi' + properCase(key), '');
            });
            org.value = org['species']; // ??
            org.info = org.value + '\n(from NCBI Species)';
            return org;
        }

        if (!(org.genus || org.species || org.strain)) {
            org.info = 'No scientific name available';
            org.value = '-';
            return org;
        } 

        // for gold_data (and perhaps others) the species is actually Genus species.
        // handle the general case of the genus being a prefix of the species and fix
        // species.
        if (org.species.indexOf(org.genus) === 0) {
            org.species = org.species.substr(org.genus.length + 1);
        }

        // same for strain.
        if (org.strain) {
            var strainPos = org.species.lastIndexOf(org.strain);
            if (strainPos >= 0 && strainPos === (org.species.length - org.strain.length)) {
                org.species = org.species.substr(0, strainPos);
            }
        }
       
        var scientificName = (org.genus || '-') + ' ' + (org.species || '-') + (org.strain ? ' ' + org.strain : '');
        org.value = scientificName;
        org.info = scientificName + '\n(' + org.info + ')';
        return org;
    }

    function grokPI(hit, fileType) {
        var lastName = getProp(hit.source.metadata, 'proposal.pi.last_name');
        var firstName = getProp(hit.source.metadata, 'proposal.pi.first_name');
        if (lastName) {
            return {                
                value: lastName + ', ' + firstName,
                info: 'The PI name as provided in the proposal',            
                first: firstName,
                last: lastName
            };
        }
        var piName = getProp(hit.source.metadata, 'pmo_project.pi_name');
        var names;
        if (piName) {
            names = piName.split(/\s+/);
            if (names) {
                return {
                    value: names[1] + ', ' + names[0],
                    info: 'The PI name as provided in the proposal',            
                    first: names[0],
                    last: names[1]
                };
            }
        }
        piName = getProp(hit.source.metadata, 'analysis_project.piName');
        if (piName) {
            names = piName.split(/\s+/);
            if (names) {
                return {
                    value: names[1] + ', ' + names[0],
                    info: 'The PI name as provided in the analysis project',            
                    first: names[0],
                    last: names[1]
                };
            }
        }
        return {
            value: null,
            info: 'The PI name could not be found'
        };
    }

    function grokMetadata(hit, fileType) {
        switch (fileType.dataType) {
        case 'fasta':
            return 'lib: ' + getProp(hit.source.metadata, [
                'library_names.0',
                'sow_segment.library_name'
            ]);
        case 'fastq':
            return div([
                div('lib: ' + getProp(hit.source.metadata, [
                    'library_name',
                    'sow_segment.library_name'
                ])),
                div('type: ' + getProp(hit.source.metadata, ['fastq_type']))
            ]);
        case 'genbank':
            return 'file: ' + getProp(hit.source, ['file_name'], '-');
        default:
            return normalizeFileType(hit.source.file_type);
        }
    }

    function parseBool(value, defaultValue) {
        if (value === undefined) {
            return defaultValue;
        }
        switch (typeof(value)) {
        case 'boolean':
            return value;
        case 'number':
            if (value === 0) {
                return false;
            }
            return true;
        case 'string':
            switch (value.toLowerCase()) {
            case 'true':
            case 't':
            case 'yes':
            case 'y':
                return true;
            default:
                return false;
            }
        }
    }

    function grokField(term) {
        var fieldMatch = /^(.+?):(.+?)$/.exec(term);
        if (!fieldMatch) {
            return;
        }
        var name = fieldMatch[1];
        var value = fieldMatch[2];
        // Common top level ones
        switch (name) {
        case 'md5':
            return 'md5sum';
        case 'file':
            return 'file_name';
        case 'type':
            return {
                type: 'filter',
                name: 'file_type',
                value: value
            };
        case 'species':
            return 'metadata.sow_segment.species';
        case 'genus':
            return {
                type: 'filter',
                name: 'metadata.sow_segment.genus',
                value: value
            };
        case 'project':
            return {
                type: 'filter',
                name: 'project_id',
                value: parseInt(value)
            };
        case 'library':
            return {
                type: 'filter',
                name: 'metadata.library_name',
                value: value
            };
        case 'portal': {
            return {
                type: 'query',
                name: 'metadata.portal.display_location',
                value: value
            };
        }
        case 'public': {
            return {
                type: 'query',
                name: '_es_public_data',
                value: parseBool(value)
            };
        }
        default:
            console.warn('Unsupported field: ' + fieldMatch[1]);
        }
    }

    var extensionToDataType = {};
    Object.keys(Import.dataTypes).forEach(function (dataTypeId) {
        var dataType = Import.dataTypes[dataTypeId];
        dataType.extensions.forEach(function (extension) {
            extensionToDataType[extension] = dataType;
        });
    });

    function grokFileTypex(extension, indexedFileTypes) {
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

    var supportedTypes = {
        fasta: {
            name: 'fasta',
            extensions: ['fasta', 'fna'],
            excludedExtensions: [{
                extension: 'faa',
                name: 'FASTA Amino Acid'
            }]
        },
        fastq: {
            name: 'fastq',
            extensions: ['fastq'],
            excludedExtensions: []
        },
        bam: {
            name: 'bam',
            extensions: ['bam'],
            excludedExtensions: []
        }
    };
    var extToType = {};
    Object.keys(supportedTypes).forEach(function (key) {
        var type = supportedTypes[key];
        type.extensions.forEach(function (ext) {
            extToType[ext] = type;
        });
    });
    var blacklistExtToType = {};
    Object.keys(supportedTypes).forEach(function (key) {
        var type = supportedTypes[key];
        type.excludedExtensions.forEach(function (ext) {
            blacklistExtToType[ext.extension] = type;
        });
    });
    var supportedEncodings = {
        gzip: {
            name: 'gzip',
            extensions: ['gz']
        },
        zip: {
            name: 'zip',
            extensions: ['zip']
        }
    };
    var extToEncoding = {};
    Object.keys(supportedEncodings).forEach(function (key) {
        var encoding = supportedEncodings[key];
        encoding.extensions.forEach(function (ext) {
            extToEncoding[ext] = encoding;
        });        
    });
    
    /*
        grokFileParts has the job of taking a file name and determing the type extension,
        the encoding extension, the full extension, and the basename.
        The type extension is the file extension which matches one of the supported types.
        You see, since a file name is often composed of dots, it is impossible to know what is a file
        extension and what is a dotted file name component. Many files end in two extensions, the fineal
        one being the compression, and the penultimate one being the actual data type extension.
        But we can't distinguish that case unless we can match the data type extension with one
        of the supported ones, either in the whitelist of supported extensions or the blacklist of
        non-supported ones.
    */
    function grokFileParts(filename) {
        var base = null, 
            type = null, 
            blacklisted = false,
            unsupported = false,
            typeExt = null,
            encoding = null,
            encodingExt = null,
            extension = null;

        var parts = filename.split(/\./);
        var pos = parts.length - 1;
        var ext = parts[pos];

        if (pos >= 2) {
            // we _may_ have a file type and compression extension.
            if (extToEncoding[ext]) {
                encoding = extToEncoding[ext].name;
                encodingExt = ext;
                pos -= 1;
                ext = parts[pos];

                if (extToType[ext]) {
                    typeExt = ext;
                    type = extToType[ext].name;
                    base = parts.slice(0, pos).join('.');
                } else if (blacklistExtToType[ext]) {
                    blacklisted = true;
                    typeExt = ext;
                    type = blacklistExtToType[ext].name;
                    base = parts.slice(0, pos).join('.');
                } else {
                    unsupported = true;
                    base = parts.slice(0, pos + 1).join('.');
                }
            // Just type, possibly.            
            } else if (extToType[ext]) {
                typeExt = ext;
                type = extToType[ext].name;
                base = parts.slice(0, pos).join('.');
            } else if (blacklistExtToType[ext]) {
                blacklisted = true;
                typeExt = ext;
                type = blacklistExtToType[ext].name;
                base = parts.slice(0, pos).join('.');                
            } else {
                unsupported = true;
                base = filename;
            }
        } else if (pos === 1) {
            // assume just a file type
            if (extToType[ext]) {
                typeExt = ext;
                type = parts[1];
                base = parts[0];
            } else if (blacklistExtToType[ext]) {
                blacklisted = true;
                typeExt = ext;
                type = parts[1];
                base = parts[0];                
            } else {
                unsupported = true;
                base = filename;
            }
        } else if (pos === 0) {
            // assume just a file with no type
            unsupported = true;
            base = filename;
        } else {
            unsupported = true;
            // no file name at all!
        }

        extension = [typeExt, encodingExt].filter(function (x) {return x;}).join('.');

        return {
            name: filename,
            base: base,
            type: type,
            typeExt: typeExt,
            blacklisted: blacklisted,
            unsupported: unsupported,
            encoding: encoding,
            encodingExt: encodingExt,
            extension: extension
        };
    }

    function grokFileType(fileTypes, fileParts) {
        // var supportedTypes = ['fasta', 'fastq', 'bam'];
        var encodings = ['gz', 'zip'];
        var error = null;
        // var encodings = {
        //     'fastq.gz': 'gz',
        // }
        

        // Should be a list, but you never know...
        if (typeof fileTypes === 'string') {
            fileTypes = [fileTypes];
        }

        var fileType, encoding;

        // is file type in supported types?
        // may be more than one item in file type, if so the non-matching 
        // should be an encoding (compression)
        var matchingTypes = fileTypes
            .map(function (type) {
                return supportedTypes[type];
            })
            .filter(function (type) {
                return type ? true : false;
            });
        if (matchingTypes.length > 1) {
            // too many matching types -- what to do?
            throw new Error('Too many matching file types for ' + fileTypes.join(','));
        } else if (matchingTypes.length === 1) {
            fileType = matchingTypes[0].name;
        } else {
            fileType = null;
        }

        if (fileType) {
            var fileTypeEncodings = fileTypes.filter(function (type) {
                return (type !== fileType);
            }).map(function (type) {
                return type.split(/\./)[1];
            });
            if (fileTypeEncodings.length === 1) {
                var matchingEncodings = extToEncoding[fileTypeEncodings[0]];
                // encoding = fileTypeEncodings[0];
                // var matchingEncodings = encodings.filter(function (enc) {
                //     return enc === encoding;
                // });
                if (matchingEncodings) {                    
                    encoding = matchingEncodings.name;
                } else {
                    encoding = null;
                }
            } else if (fileTypeEncodings.length > 1) {
                console.error('too many file type encodings!', fileTypeEncodings);
                error = {
                    code: 'too-many-encodings', 
                    message: 'Too many file type encodings: ' + fileTypeEncodings.join(','),
                    info: {
                        encodings: encodings,
                        matching: fileTypeEncodings
                    }
                };
                // throw new Error('Too many file type encodings: ' + fileTypeEncodings.join(','));
            } else {
                encoding = null;
            }
        } else {
            encoding = null;
        }

        if (fileParts.blacklisted) {
            error = {
                code: 'excluded-extension',
                message: 'The file type "' + fileType + '" does not support extension "' + fileParts.extension + '"',
                info: {
                    fileTypes: fileTypes,
                    fileParts: fileParts
                }
            };
        } else if (fileParts.unsupported) {
            error = {
                code: 'unsupported-extension',
                message: 'The file type "' + fileType + '" does not recognize the extension of this file "' + fileParts.name + '"',
                info: {
                    fileTypes: fileTypes,
                    fileParts: fileParts
                }
            };
        } else {
            if (fileType !== fileParts.type) {
                console.error('file type and part mismatch', fileType, fileParts.type, fileTypes, fileParts);
                error = {
                    code: 'file-type-part-mismatch',
                    message: 'File type does not match file part for type',
                    info: {
                        fileTypes: fileTypes,
                        fileParts: fileParts
                    }
                };
                // throw new Error('File type does not match file part for type');
            }
        }

        if (encoding !== fileParts.encoding) {
            console.error('file encoding and part mismatch', fileTypes, encoding, fileParts);
            error = {
                code: 'file-encoding-part-mismatch',
                message: 'File encoding does not match file part for type',
                info: {
                    fileTypes: fileTypes,
                    fileParts: fileParts
                }
            };
            // throw new Error('File encoding does not match file part for type');
        }

        // ensure that the file type matches the extensions
        return {
            dataType: fileType,
            encoding: encoding,
            error: error
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
        var queuedRe = /^In_Queue$/;
        var progressRe = /^In Progress\. Total files = ([\d]+)\. Copy complete = ([\d]+)\. Restore in progress = ([\d]+)\. Copy in progress = ([\d]+)$/;
        var completedRe = /^Transfer Complete\. Transfered ([\d]+) files\.$/;
        var errorRe = /^Transfer Complete. Transfered ([\d]+) files. Scp failed for files = \[u'(.*?)'\]$/;

        if (queuedRe.test(message)) {
            return {
                status: 'queued'
            };
        }

        if (completedRe.test(message)) {
            return {
                status: 'completed'
            };
        }

        var m = progressRe.exec(message);
        // console.log('m', m, message, message.length, typeof message);
        if (!m) {
            var em = errorRe.test(message);

            if (!em) {
                console.log('unknown1...', message);
                return {
                    status: 'unknown1'
                };
            }

            return {
                status: 'error'
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
            status: 'unknown2'
        };

    }


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

    function getProp(obj, props, defaultValue, isMissing) {
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
            if (value === null) {
                return;
            }
            return getit(value, p);
        }
        for (var i = 0; i < props.length; i += 1) {
            var prop = props[i].split('.');
            var value = getit(obj, prop.reverse());
            if (value === undefined || (isMissing && isMissing(value))) {
                continue;
            }
            return value;
        }
        return defaultValue;
    }

    function hasProp(obj, props) {
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
            if (value === null) {
                return;
            }
            return getit(value, p);
        }
        for (var i = 0; i < props.length; i += 1) {
            var prop = props[i].split('.');
            var value = getit(obj, prop.reverse());
            if (value === undefined) {
                continue;
            }
            return true;
        }
        return false;
    }

    /*
    A user input search expression is converted to an elasticsearch
    simple query string.
    - multiple terms in sequence are anded by inserting a + between them
    - the term and and or are converted to + and |
    - the term not is converted to -
    - a +, |, or - as part of a word are esecaped, alone are ignored
    - a ( or ) is preserved but split off and re-inserted
    */
    function parseSearchExpression(input) {
        var allTerm;
        var fieldTerms = {};
        var filter = {};

        if (!input) {
            return {
                query: {},
                filter: {}
            };
        }

        var terms = input.split(/\s+/);
        var expression = [];
        var termCount = 0;
        // True if there is an operator already active (previously inserted)
        var operator = null;
        // True if there is a modifier applied to this term (previously inserted)
        var modifier = null;
        for (var i = 0; i < terms.length; i++) {
            // var term = terms[i].toLowerCase();
            var term = terms[i];

            // DISABLE THIS FOR NOW
            // // convert word operators to real operators
            // switch (term) {
            // case 'and':
            //     //expression.push('+');
            //     // hasOperator = true;
            //     operator = '+';
            //     continue termsLoop;
            // case 'or':
            //     // expression.push('|');
            //     // hasOperator = true;
            //     operator = '|';
            //     continue termsLoop;
            // case 'not':
            //     // expression.push('-');
            //     // hasModifier = true;
            //     modifier = '-';
            //     continue termsLoop;
            //     // preserve standalone operators
            // case '+':
            // case '|':
            //     // expression.push(term);
            //     // hasOperator = true;
            //     operator = term;
            //     continue termsLoop;
            // case '-':
            //     // expression.push(term);
            //     // hasModifier = true;
            //     modifier = '-';
            //     continue termsLoop;
            // case '(':
            // case ')':
            //     expression.push(term);
            //     continue termsLoop;
            // }

            // any very short word is tossed
            if (term.length < 3) {
                if (term !== '*') {
                    continue;
                }
            }

            // escape any special chars stuck to or within the word
            term.replace(/[+-/|()]/g, '\\$&');

            // TODO: split out an operator or modifier from the front of the term
            // itself so we don't double them.

            // if (!operator) {
            //     operator = '+';
            // }
            // // Skip the operator if this is the first term inserted; pointless.
            // if (termCount > 0) {
            //     expression.push(operator);
            // }

            // if (modifier) {
            //     term = modifier + term;
            // }

            // detect fields.
            var field = grokField(term);
            if (field) {
                // simple for now.
                switch (field.type) {
                case 'query':
                    fieldTerms[field.name] = field.value;
                    break;
                case 'filter':
                    filter[field.name] = field.value;
                    break;
                }
            } else {
                expression.push(term);
            }
            termCount += 1;
            modifier = null;
            operator = null;
        }
        if (expression.length > 0) {
            fieldTerms._all = expression.join(' + ');
        }

        return {
            query: fieldTerms,
            filter: filter
        };
    }

    // deep equality comparison
    function isEqual(v1, v2) {
        function iseq(v1, v2) {
            var t1 = typeof v1;
            var t2 = typeof v2;
            if (t1 !== t2) {
                return false;
            }
            switch (t1) {
            case 'string':
            case 'number':
            case 'boolean':
                if (v1 !== v2) {
                    return false;
                }
                break;
            case 'undefined':
                if (t2 !== 'undefined') {
                    return false;
                }
                break;
            case 'object':
                if (v1 instanceof Array) {
                    if (v1.length !== v2.length) {
                        return false;
                    } else {
                        for (var i = 0; i < v1.length; i++) {
                            if (!iseq(v1[i], v2[i])) {
                                return false;
                            }
                        }
                    }
                } else if (v1 === null) {
                    if (v2 !== null) {
                        return false;
                    }
                } else if (v2 === null) {
                    return false;
                } else {
                    var k1 = Object.keys(v1);
                    var k2 = Object.keys(v2);
                    if (k1.length !== k2.length) {
                        return false;
                    }
                    for (var i = 0; i < k1.length; i++) {
                        if (!iseq(v1[k1[i]], v2[k1[i]])) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        return iseq(v1, v2);
    }

    function JGISearchError(source, code, message, detail, info) {
        this.source = source;
        this.code = code;
        this.message = message;
        this.detail = detail;
        this.info = info;
    }
    JGISearchError.prototype = Object.create(Error.prototype);
    JGISearchError.prototype.constructor = JGISearchError;
    JGISearchError.prototype.name = 'JGISearchError';

    return {
        komponent: komponent,
        grokTitle: grokTitle,
        grokScientificName: grokScientificName,
        grokPI: grokPI,
        grokImportMetadata:grokImportMetadata,
        grokMetadata: grokMetadata,
        grokField: grokField,
        grokFileType: grokFileType,
        grokFileParts: grokFileParts,
        grokStageStats: grokStageStats,
        normalizeFileType: normalizeFileType,
        usDate: usDate,
        getProp: getProp,
        hasProp: hasProp,
        parseSearchExpression: parseSearchExpression,
        isEqual: isEqual,
        JGISearchError: JGISearchError
    };
});
