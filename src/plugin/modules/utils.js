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

    function makeStyles(styleDefs) {
        var classes = {};

        // generate unique class names
        Object.keys(styleDefs).forEach(function (key) {
            var id = key + '_' + html.genId();

            classes[key] = id;

            if (!styleDefs[key].css) {
                styleDefs[key] = {
                    css: styleDefs[key]
                }
            }

            styleDefs[key].id  = id;
        });

        var sheet = [];
        Object.keys(styleDefs).forEach(function (key) {
            var style = styleDefs[key];
            var pseudo = '';
            sheet.push([
                '.',
                style.id + pseudo,
                '{',
                makeStyleAttribs(style.css),
                '}'
            ].join(''));
            if (style.pseudo) {
                Object.keys(style.pseudo).forEach(function (key) {
                    sheet.push([
                        '.',
                        style.id + ':' + key,
                        '{',
                        makeStyleAttribs(style.pseudo[key]),
                        '}'
                    ].join(''));
                })
            }
        });
        return {
            classes: classes,
            def: styleDefs,
            sheet: style(sheet.join('\n'))
        };
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
        switch (fileType.dataType) {
        case 'genbank':
            return getProp(hit.source.metadata, ['sequencing_project.sequencing_project_name', 'pmo_project.name'], hit.source.file_name);
        case 'fasta':
        case 'fastq':
        default:
            return getProp(hit.source.metadata, ['sequencing_project.sequencing_project_name'], hit.source.file_name);
        }
    }

    function grokScientificName(hit) {
        // var na = span({ style: { color: 'gray' } }, 'n/a');
        var genus = getProp(hit.source.metadata, [
            'genus',
            'sow_segment.genus',
            'pmo_project.genus',
            'gold_data.genus'
        ], '', function(v) {
            return (v === null || (typeof(v) === 'string' && v.length === ''));
        });
        var species = getProp(hit.source.metadata, [
            'species',
            'sow_segment.species',
            'pmo_project.species',
            'gold_data.species'
        ], '', function(v) {
            return (v === null || (typeof(v) === 'string' && v.length === ''));
        });
        var strain = getProp(hit.source.metadata, [
            'strain',
            'sow_segment.strain',
            'pmo_project.strain',
            'gold_data.strain'
        ], '', function(v) {
            return (v === null || (typeof(v) === 'string' && v.length === ''));
        });

        // for gold_data (and perhaps others) the species is actually Genus species.
        // handle the general case of the genus being a prefix of the species and fix
        // species.
        console.log('species', species);
        if (species.indexOf(genus) === 0) {
            species = species.substr(genus.length + 1);
        }

        // same for strain.
        if (strain) {
            var strainPos = species.lastIndexOf(strain);
            if (strainPos >= 0 && strainPos === (species.length - strain.length)) {
                species = species.substr(0, strainPos);
            }
        }

        var scientificName = (genus || '-') + ' ' + (species || '-') + (strain ? ' ' + strain : '');
        // console.log('sci name', hit.source);
        return {
            genus: genus,
            species: species,
            strain: strain,
            scientificName: scientificName
        };
    }

    function grokPI(hit, fileType) {
        var lastName = getProp(hit.source.metadata, 'proposal.pi.last_name');
        var firstName = getProp(hit.source.metadata, 'proposal.pi.first_name');
        if (lastName) {
            return lastName + ', ' + firstName;
        }
        var piName = getProp(hit.source.metadata, 'pmo_project.pi_name');
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

        console.log('progress?', message, typeof message, queuedRe.exec(message), completedRe.exec(message), progressRe.exec(message));

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
            return {
                status: 'unknown1'
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
        termsLoop: for (var i = 0; i < terms.length; i++) {
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

    return {
        komponent: komponent,
        makeStyles: makeStyles,
        grokTitle: grokTitle,
        grokScientificName: grokScientificName,
        grokPI: grokPI,
        grokImportMetadata:grokImportMetadata,
        grokMetadata: grokMetadata,
        grokField: grokField,
        grokFileType: grokFileType,
        grokStageStats: grokStageStats,
        normalizeFileType: normalizeFileType,
        usDate: usDate,
        getProp: getProp,
        parseSearchExpression: parseSearchExpression,
        isEqual: isEqual
    };
});
