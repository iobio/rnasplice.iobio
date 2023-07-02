<template>

    <div class="d-flex flex-column" v-if="loadInfo && coord">
      <div id="igv-heading" class="d-flex flex-row justify-space-between align-center mb-1" >
          <h2>
            Splice Junctions
          </h2>
          <v-spacer/>
          <div style="width:155px" class="mr-4">
            <v-select 
              v-model="theGeneSource"
              hide-details="auto"
              label="Gene annotations"
              density="compact"
              :items="['gencode', 'refseq',]"
            ></v-select>
          </div>
          <div style="width:195px" class="mr-4">
            <v-text-field 
            density="compact"
            hide-details="auto" 
            label="Min Uniquely Mapped Reads" 
            v-model="minUniquelyMappedReads"/>
          </div>
          <div style="width:155px" class="mr-4">
            <v-select 
              v-model="colorBy"
              hide-details="auto"
              label="Color by"
              density="compact"
              :items="['numUniqueReads', 'numReads', 'isAnnotatedJunction', 'strand', 'motif']"
            ></v-select>
          </div>

          <v-spacer/>

      </div>

      <div>
        <RNASeqIGV v-if="loadInfo && coord"  class="" id="splice-junction-viz-container"
          ref="ref_RNASeqIGV"
          heading="Splice junctions" 
          :genome="genome"
          :locus="coord"
          :tracks="tracksSpliceJunctions"
          genomeBuild="hg38"
        />

      </div>
    </div>

		

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
      geneModel: Object,
      loadInfo: Object
    },
    data() {
      let self = this;
      return {
        genome: null,
        bedURL: null,
        bedIndexURL: null,
        bigwigURL: null,
        coord: null,

        minUniquelyMappedReads: 1,
        colorBy: 'motif',
        theGeneSource: self.geneModel ? self.geneModel.geneSource : 'gencode',

      	tracksSpliceJunctions:  [
          {
            type: 'merged',
            order: 1,
            name: 'Splice Junctions',
            height: 270,
            tracks: [
              {
                  type: 'wig',
                  name: 'Coverage',
                  format: "bigwig",
                  url: null,
              },
              {
                  type: 'junction',
                  name: 'Splice Junctions',
                  format: 'bed',
                  url: null,
                  indexURL: null,
                  displayMode: 'COLLAPSED',
                  minUniquelyMappedReads: 1,
                  minTotalReads: 1,
                  maxFractionMultiMappedReads: 1,
                  minSplicedAlignmentOverhang: 0,
                  thicknessBasedOn: 'numUniqueReads', //options: numUniqueReads (default), numReads, isAnnotatedJunction
                  bounceHeightBasedOn: 'distance', //options: random (default), distance, thickness
                  colorBy: 'motif', //options: numUniqueReads (default), numReads, isAnnotatedJunction, strand, motif
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
            height: 200,
            url: null,
            indexURL: null,
            visibilityWindow: 1000000,
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
          this.bedIndexURL = this.loadInfo.bedIndexURL;
          this.bigwigURL   = this.loadInfo.bigwigURL;

          let firstTime = false;
          if (this.tracksSpliceJunctions[0].tracks[1].url == null) {
            firstTime = true;
          }

          this.tracksSpliceJunctions[0].tracks[1].url = this.bedURL;
          this.tracksSpliceJunctions[0].tracks[1].indexURL = this.bedIndexURL;

          this.tracksSpliceJunctions[0].tracks[0].url = this.bigwigURL;

          this.setGeneAnnotationsTrack();
  
          if (!firstTime) {
            if (this.$refs && this.$refs.ref_RNASeqIGV) {
              this.coord = null;
              this.$refs.ref_RNASeqIGV.reinit();
              this.$emit("reinit")
            }
          }

        }
      },
      minUniquelyMappedReads: function() {
        this.tracksSpliceJunctions[0].tracks[1].minUniquelyMappedReads = this.minUniquelyMappedReads;
        this.onSettingsChange();
      },
      colorBy: function() {
        this.tracksSpliceJunctions[0].tracks[1].colorBy = this.colorBy;
        this.onSettingsChange();
      },
      theGeneSource: function() {
        if (this.geneModel) {
          this.geneModel.geneSource = this.theGeneSource;
          this.setGeneAnnotationsTrack();
          this.$refs.ref_RNASeqIGV.reinit();
        }
      }
    },
    methods: {
      onSettingsChange: function() {
        let firstTime = false;
        if (this.tracksSpliceJunctions[0].tracks[1].url == null) {
          firstTime = true;
        }
        if (!firstTime) {
          if (this.$refs && this.$refs.ref_RNASeqIGV) {
            this.$refs.ref_RNASeqIGV.onRefreshTracks();
          }          
        }
      },
      setGeneAnnotationsTrack: function() {
        let self = this;
        let annotationURL = this.annotationMap[this.genome][this.geneModel.geneSource];
        this.tracksSpliceJunctions[1].url = annotationURL;
        if (this.geneModel.geneSource == 'gencode') {
          this.tracksSpliceJunctions[1].name = 'Gencode genes ' + this.genome
          this.tracksSpliceJunctions[1].indexURL = annotationURL + ".tbi";
          this.tracksSpliceJunctions[1].format = 'gff3'
          this.tracksSpliceJunctions[1].colorBy = 'transcript_type';
          this.tracksSpliceJunctions[1].colorTable = {
             "antisense": "blueviolet",
             "protein_coding": "blue",
             "retained_intron": "rgb(0, 150, 150)",
             "processed_transcript": "purple",
             "processed_pseudogene": "#7fff00",
             "unprocessed_pseudogene": "#d2691e",
             "*": "black"
          };
        } else {
          this.tracksSpliceJunctions[1].name = 'RefSeq genes ' + this.genome
          this.tracksSpliceJunctions[1].format = 'refgene'
          delete this.tracksSpliceJunctions[1].indexURL;
          delete this.tracksSpliceJunctions[1].colorBy;
          delete this.tracksSpliceJunctions[1].colorTable;
        }

      }     
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
  #igv-title
    font-size: 18px
    font-weight: 600
    color: #494949

    
</style>
