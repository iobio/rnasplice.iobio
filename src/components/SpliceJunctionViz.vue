<template>

		<RNASeqIGV v-if="loadInfo && coord"  class="" id="splice-junction-viz-container"
          ref="ref_RNASeqIGV"
          heading="Splice junctions" 
          :genome="genome"
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
    	selectedGene: Object,
      genomeBuildHelper: Object,
      loadInfo: Object
    },
    data() {
      let self = this;
      return {
        genome: null,
        bedURL: null,
        bedIndexURL: null,
        coord: null,
        order: 1,
      	tracksSpliceJunctions:  [
          {
            type: 'merged',
            order: 1,
            name: 'Splice Junctions',
            height: 100,
            tracks: [
              {
                  type: 'junction',
                  name: 'Junctions',
                  format: 'bed',
                  url: null,
                  indexURL: null,
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
              }
            ]          
          },
          
          {
            name: "Gencode",
            order: 2,
            type: "annotation",
            format: "gff3",
            displayMode: "expanded",
            height: 100,
            url: null,
            indexURL: null,
            visibilityWindow: 1000000,
            colorBy: "biotype",
            colorTable: {
               "antisense": "blueviolet",
               "protein_coding": "blue",
               "retained_intron": "rgb(0, 150, 150)",
               "processed_transcript": "purple",
               "processed_pseudogene": "#7fff00",
               "unprocessed_pseudogene": "#d2691e",
               "*": "black"
            }
          }, 
        ],

        buildMap: {
          GRCh37: 'hg19',
          GRCh38: 'hg38'
        },

        annotationMap: {
          hg38: {
            gencode: 'https://s3.amazonaws.com/igv.org.genomes/hg38/gencode.v40.annotation.gff3.gz',
            gencode_othr: 'https://s3.amazonaws.com/igv.org.genomes/hg38/Homo_sapiens.GRCh38.94.chr.gff3.gz',
            refseq: 'https://hgdownload.soe.ucsc.edu/goldenPath/hg38/database/ncbiRefSeq.txt.gz'
          },
          hg19: {
            gencode: 'https://s3.amazonaws.com/igv.org.genomes/hg19/annotations/gencode.v28lift37.basic.annotation.gtf.gz',
            refseq: 'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/ncbiRefSeq.txt.gz'
          }
        }
      }
    },
    watch: {
      selectedGene: function() {
        if (this.selectedGene && this.selectedGene.gene_name) {
          this.coord = this.selectedGene.chr + ":" + this.selectedGene.start + "-" + this.selectedGene.end;

        } 
      },

      loadInfo: function() {
        let self = this;
        if (this.loadInfo.hasOwnProperty("buildName")) {
          if (this.buildMap[this.loadInfo.buildName]) {
            this.genome = null;
            this.genome = this.buildMap[this.loadInfo.buildName];
            this.genomeBuildHelper.setCurrentBuild(this.loadInfo.buildName)
          } else {
            this.$emit('alert-issued', 'error', 
                       'Invalid genome ' + this.loadInfo.buildName + ' specified');
          }
        }
        if (this.loadInfo && 
          this.loadInfo.hasOwnProperty('bedURL') && 
          this.loadInfo.hasOwnProperty('bedIndexURL')) {

          this.bedURL     = this.loadInfo.bedURL;
          this.bedIndexURL = this.loadInfo.bedIndexURL

          let firstTime = false;
          if (this.tracksSpliceJunctions[0].tracks[0].url == null) {
            firstTime = true;
          }

          this.tracksSpliceJunctions[0].tracks[0].url = this.bedURL;
          this.tracksSpliceJunctions[0].tracks[0].indexURL = this.bedIndexURL;

          let annotationURL = this.annotationMap[this.genome]['gencode'];
          this.tracksSpliceJunctions[1].url = annotationURL;
          this.tracksSpliceJunctions[1].indexURL = annotationURL + ".tbi";

  
          if (!firstTime) {
            if (this.$refs && this.$refs.ref_RNASeqIGV) {
              this.coord = null;
              this.$refs.ref_RNASeqIGV.reinit();
              this.$emit("reinit")
            }
          }
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
