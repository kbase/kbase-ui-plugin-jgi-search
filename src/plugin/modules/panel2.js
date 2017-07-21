/*
A search interface directly to JGI genome portal...
http://genome.jgi.doe.gov/ext-api/search-service/solrGenomeSearch?core=genome&query=coli&searchIn=JGI%20Projects&searchType=Keyword&showAll=false&externallySequenced=true&sortBy=displayNameStr&showRestricted=false&showOnlyPublished=false&showSuperseded=true&sortOrder=asc&rawQuery=false&showFungalOnly=false&activateHighlights=false&programName=all&programYear=all&superkingdom=--any--&scientificProgram=--any--&productCategory=--any--&start=0&rows=50
*/
define([
    'bluebird',
    'kb_common/html',
    'kb_common_ts/httpClient'
], function(
    Promise,
    html,
    HttpClient
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        tr = t('tr'),
        th = t('th'),
        td = t('td');

    function factory(config) {
        var runtime = config.runtime;
        var hostNode, container;

        //var url = 'https://genome.jgi.doe.gov/ext-api/search-service/solrGenomeSearch';
        var url = 'https://ci.kbase.us/jgi-search';

        var pageSize = 10;

        var results = [{
            title: 'test',
            projectId: 'project id',
            fileType: 'file type'
        }];

        var searchTerm = 'thermophilic';


        var searchWithinValues = [
            'JGI Projects',
            'Proposals',
            'Genome Portals',
            'Groups'
        ];
        var searchWithin = searchWithinValues.map(function(value) {
            return {
                value: value,
                label: value
            };
        });

        var searchByValues = [
            'Name',
            'Taxonomy ID',
            'NCBI BioProject ID',
            'JGI Project ID',
            'Proposal Name',
            'Proposal ID',
            'Principal Investigator',
            'Genbank Accession',
            'Genus',
            'Species',
            'Strain'
        ];

        var searchBy = searchByValues.map(function(value) {
            return {
                label: value,
                value: value
            };
        });



        // hmm, a generic rest client?
        // var jgiSearchClient = new RestClient({
        // url: url
        // });


        var productNamesValues = [
            'Combined Assembly',
            'Draft Assembly',
            'Exome Capture',
            'Fosmids',
            'Finished Genome',
            'Genome Assembly from Metagenome',
            'Metatrinscriptome',
            'Methylation',
            'Resequencing',
            'RnD',
            'Bisulphite-Seq',
            'Ribosomal Sequencing (16S/188S)',
            'Single Cell',
            'Synthetic Biology',
            'Transcriptome',
            'Transposon Mutagenisis'
        ];
        var productNames = productNamesValues.map(function(value) {
            return {
                value: value,
                label: value
            };
        });

        function query(queryString, start, limit) {

            var q = {
                // search input
                query: queryString,
                start: start,
                rows: limit,
                // major controls
                //searchIn: 'JGI Projects',
                searchIn: 'Anything',
                sortOrder: 'asc',
                sortBy: 'displayNameStr',
                searchType: 'Keyword',
                externallySequenced: true,
                showRestricted: false,
                showOnlyPublished: false,
                showSuperseded: true,
                rawQuery: false,
                showFungalOnly: false,
                activityHighlights: false,
                programName: 'all',
                programYear: 'all',
                superKingdom: '--any--',
                scientificProgram: '--any--',
                productCategory: '--any--',

                // hardcoded controls
                showAll: false,
                core: 'genome'
            };

            return q;
        }
        /*
        http: //genome.jgi.doe.gov/ext-api/search-service/solrGenomeSearch?core=genome&query=termite&searchIn=Anything&searchType=Keyword&showAll=false&externallySequenced=true&sortBy=displayNameStr&showRestricted=false&showOnlyPublished=false&showSuperseded=true&sortOrder=asc&rawQuery=false&showFungalOnly=false&activateHighlights=false&programName=all&programYear=2016&superkingdom=--any--&scientificProgram=--any--&productCategory=--any--&start=0&rows=50
        */
        function fetchData(queryString, page) {
            var httpClient = new HttpClient.HttpClient();
            return httpClient.request({
                    url: url,
                    method: 'GET',
                    query: query(queryString, page - 1, 10)
                })
                .then(function(result) {
                    // console.log('result', result.response);
                    try {
                        return JSON.parse(result.response);
                    } catch (err) {
                        throw new Error('Error parsing jgi search response: ' + err.message);
                    }
                })
                .catch(function(err) {
                    console.log('ERROR', err);
                    throw new Error('Search error:' + err.message);
                });
        }

        // render here for now.
        function renderData() {
            var dataNode = container.querySelector('[data-element="data"]');
            dataNode.innerHTML = html.loading();
            return fetchData(searchTerm, 1)
                .then(function(data) {
                    console.log('data', data);
                    // The results are actually wrapped in an array...
                    dataNode.innerHTML = div({}, [
                        div(['Hits: ', data.total]),
                        div(['Search term: ', searchTerm]),
                        table({
                            class: 'table table-striped'
                        }, [
                            tr([
                                td('Score'),
                                td('Product'),
                                td('Category'),
                                th('Proposal'),
                                th('Project Id'),
                                th('Project status'),
                                th('Project status date')
                            ])
                        ].concat(data.results.map(function(row) {
                            return tr([
                                td(row.score),
                                td(row.productName),
                                td(row.productCategory),
                                td(row.proposalName),
                                td(row.jgiProjectId),
                                td(row.projectStatus),
                                td(row.projectStatusDate)
                            ]);
                        })))
                    ]);
                });
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
                        dataElement: 'data'
                    })
                ])
            ]);
        }

        function render() {
            return Promise.try(function() {
                container.innerHTML = buildLayout();
            });
        }

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            runtime.send('ui', 'setTitle', 'JGI Search');
            return render()
                .then(function() {
                    return renderData();
                });
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