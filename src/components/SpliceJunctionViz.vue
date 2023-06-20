<template>

		<RNASeqIGV  class="" id="splice-junction-viz-container"
          heading="Splice junctions" 
      		:locus="coord"
      		:tracks="tracksSpliceJunctions"
      		genomeBuild="hg38"
        />

</template>

<script>
import RNASeqIGV   from './RNASeqIGV.vue'

  export default {
    name: 'SpliceJunctionViz',
    components: {
      RNASeqIGV,
    },
    props: {
    	selectedGene: Object
    },
    data: () => ({
      coord: null,
    	tracksSpliceJunctions:  [
        {
          type: 'merged',
          name: 'Splice Junctions',
          height: 200,
          tracks: [
            {
                type: 'junction',
                name: 'Junctions',
                format: 'bed',
                //url: `https://s3.amazonaws.com/tony.splicejunction.bed/1099.junc.sorted.bed.gz`,
                //indexURL: `https://s3.amazonaws.com/tony.splicejunction.bed/1099.junc.sorted.bed.gz.tbi`,
                url: `https://www.dropbox.com/s/nvmy55hhe24plpv/splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.SJ.out.bed.gz?dl=0`,
                indexURL: `https://www.dropbox.com/s/iv5tcg3t8v3xu23/splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.SJ.out.bed.gz.tbi?dl=0`,
                displayMode: 'COLLAPSED',
                //minUniquelyMappedReads: 1,
                minTotalReads: 1,
                maxFractionMultiMappedReads: 1,
                minSplicedAlignmentOverhang: 0,
                thicknessBasedOn: 'numUniqueReads', //options: numUniqueReads (default), numReads, isAnnotatedJunction
                bounceHeightBasedOn: 'random', //options: random (default), distance, thickness
                colorBy: 'isAnnotatedJunction', //options: numUniqueReads (default), numReads, isAnnotatedJunction, strand, motif
                labelUniqueReadCount: true,
                labelMultiMappedReadCount: true,
                labelTotalReadCount: false,
                labelMotif: false,
                labelIsAnnotatedJunction: " [A]",
                hideAnnotatedJunctions: false,
                hideUnannotatedJunctions: false,
                hideMotifs: ['GT/AT', 'non-canonical'], //options: 'GT/AG', 'CT/AC', 'GC/AG', 'CT/GC', 'AT/AC', 'GT/AT', 'non-canonical'
            },
            {
                type: 'wig',
                name: 'Coverage',
                format: "bigwig",
                url: 'https://www.dropbox.com/s/8j2uf0hsqprusnc/splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.bigWig?dl=0',
            }
          ]          
        } 
      ]  
    }),
    watch: {
      selectedGene: function() {
        if (this.selectedGene && this.selectedGene.gene_name) {
          this.coord = this.selectedGene.chr + ":" + this.selectedGene.start + "-" + this.selectedGene.end;

        } else {
          this.coord = "chr15:92835700-93031800";
        }
      }
    },
    methods: {
    }
  }
</script>

<style lang="sass">
#splice-junction-viz-container
	margin:    0px !important
	padding-left:     0px !important
	padding-right:    0px !important
	padding-top:      0px !important
	padding-bottom:   10px !important
	max-width: calc(100% - 0px)

	.v-card
		padding: 20px !important
</style>
