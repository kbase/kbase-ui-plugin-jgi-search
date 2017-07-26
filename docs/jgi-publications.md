A use case suggested by Roy is a user who encounters a publication which mentions data in JGI.

So the exercise is to review the top N publications on the jgi publications page

http://jgi.doe.gov/news-publications/publications/

and perform searchs at kbase jgi-search and the jgi genome portal.

By mention on the jgi publications page, it is implicit that the data may be available at jgi.

1. Ahn, A. C. et al. (2017) Genomic diversity within the haloalkaliphilic genus Thioalkalivibrio. PLoS One 12(3), e0173517. 10.1371/journal.pone.0173517
More Details

no mention of jgi specific data, but implictly in 

"Recently, the genomes of 76 Thioalkalivibrio strains were sequenced"


Search by genus "Thioalkalivibrio", 

kbase: 275 results, fastq files. although many are named similarly, (title in our results), there is no way to know they are from the same project (different project ids). Inspecting them, though, reveals a proposal title and pi name which match the paper. A search of the pi reveals just about the same number of results (263). Combining the two terms together (rather than oring them) would be most helpful. 

jgi portal: 122 results, but grouped by project or proposal. It was easy to find the proposal and the many individual projects which match the paper.

lesson: showing the PI could be very helpful in this context. Grouping less helpful in this context, since each assembly was a different project.



2. Aserse, A. A. et al. (2017) Draft genome sequence of type strain HBR26T and description of Rhizobium aethiopicum sp. nov. Stand Genomic Sci 12, 14. 10.1186/s40793-017-0220-z
More Details

The article specifically mentions:

The genome assembly and annotation data is deposited in the DOE JGI portal and also available at European Nucleotide Archive under accession numbers FMAJ01000001-FMAJ01000062.

Searching under the genus Rhizobium gave over 350 results, too many. The species gave two, but not Rhizobium. However, the proposed strain  HBR26 did work, revealing two results with one of the author names as the PI.

Reveals one problem -- from the author list for a paper not clear who the PI is on the proposal (it is not usually the first author)

jgi portal search also revealed too many hits under Genus to be useful; the strain worked 


3. Baltrus, D. A. et al. (2017) Absence of genome reduction in diverse, facultative endohyphal bacteria. Microb Genom 3(2), e000101. 10.1099/mgen.0.000101
More Details

No specific references to jgi data, project ids, etc. but the keywords section and the diagrams identify "Luteibacter" as the bacterial genus. 

kbase did not reveal this particular project, apparently. It does point out though that the inspector for a search result should perhaps first show a tab with more project details, rather than import. I keep finding myself digging into the metadata to look at the proposal or the project info to see if it is the same project. Good that it is there, but lots of clicks. And too much info, probably, to show on the search results page itself.

With 19 authors a bit difficult to identify the PI!!


jgi? found what appears to be the data or related, same genus, author. This time the pi is the first author. The jgi project ids did not turn up any hits at kbase, though, nor did the pi 



4. Browne, D. R. et al. (2017) Draft Nuclear Genome Sequence of the Liquid Hydrocarbon-Accumulating Green Microalga Botryococcus braunii Race B (Showa). Genome Announc 5(16). 10.1128/genomeA.00215-17
More Details

Very short description of the article, just really mentioning that a draft genome was being determined.

kbase search results by genus revealed 292 results, but luckily results for with a PI in the author list are in the first page. There were many from the same project, searching by project id revealed 122, of diverse file types.

This shows the need for:
- click on column value to start new search by that value (replace or add to search term?)
- need to filter by file type
- need for more information in the search results perhaps by file type. There are still many fasta and fastq files all with the same title. e.g. sample name, read_stats.file_bases, read_stats.file_num_reads


5. Browne, P. et al. (2017) Genomic composition and dynamics among Methanomicrobiales predict adaptation to contrasting environments. ISME J 11(1), 87-99. 10.1038/ismej.2016.104
More Details

No jgi references, so search by order Methanomicrobiales. Returned only 15, of which a few had a pi included in the author list. 

added search by column value for project id and author. This allowed easy navigation to all assets for the given project (which works in this case to reveal other files available.)


6. Chen, I. A. et al. (2017) IMG/M: integrated genome and metagenome comparative data analysis system. Nucleic Acids Res 45(D1), D507-D516. 10.1093/nar/gkw929
More Details

Not a research paper, more a review of IMG/M.

7. Contreras-Moreira, B. et al. (2017) Analysis of Plant Pan-Genomes and Transcriptomes with GET_HOMOLOGUES-EST, a Clustering Solution for Sequences of the Same Species. Front Plant Sci 8, 184. 10.3389/fpls.2017.00184
More Details


No specific jgi ref like project id, so look by genus. Arabidopsis has many results of course (2800) and Hordeum many too (376). The intersection? well, we can't do that now! Also Hordeum results dominated by one researcher, so difficult to scan through the multiple pages.

With page size of 100, just a few to scan through, but still a pain.

8. Daly, P. et al. (2017) Expression of Aspergillus niger CAZymes is determined by compositional changes in wheat straw generated by hydrothermal or ionic liquid pretreatments. Biotechnol Biofuels 10, 35. 10.1186/s13068-017-0700-9
More Details

It so happens that although genus Aspergillus produced many hits, the first ones were from this project, citing the PI which is one of the paper authors.

Still with 274 fastq files, all with identical titles, it raises the issue of surfacing domain-specific data, importing multiple files at once (e.g., staging directory, import all in directory), selecting muliple files from the ui.


9. Dore, J. et al. (2017) The ectomycorrhizal basidiomycete Hebeloma cylindrosporum undergoes early waves of transcriptional reprogramming prior to symbiotic structures differentiation. Environ Microbiol 19(3), 1338-1354. 10.1111/1462-2920.13670
More Details

The genus Hebeloma provided results which included the PI from the author list, so this was an easy one. Also the title was relevant to the paper (it mentions Pinus ...)

10. Doud, D. F. R. et al. (2017) Novel approaches in function-driven single-cell genomics. FEMS Microbiol Rev . 10.1093/femsre/fux009
More Details

No mention of specific organinisms in the abstract (other than microbes). Author search revealed none for one and over 9000 for the second. A date or topic-based search might help narrow this down, or a project/proposal view.


11. Fochi, V. et al. (2017) Fungal and plant gene expression in the Tulasnella calospora-Serapias vomeracea symbiosis provides clues about nitrogen pathways in orchid mycorrhizas. New Phytol 213(1), 365-379. 10.1111/nph.14279
More Details


searchon on genus Tulasnella revealed only hits on this project, so that was easy. Still, it does make one thing about what to show for search results, as all hits carry, at the moment, the project name as the title. It is putatively more helpful than the file name, but no help in distinguishing files from within a single project without drilling down. 

12. Gontang, E. A. et al. (2017) Major changes in microbial diversity and community composition across gut sections of a juvenile Panchlora cockroach. PLoS One 12(5), e0177189. 10.1371/journal.pone.0177189
More Details

