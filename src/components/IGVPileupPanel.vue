<template>

  <div id="igv-pileup-panel" class="d-flex flex-column" >

    <div>
      <RNASeqIGV
        ref="ref_IGVPileup"
        heading="Pileup"
        :visible="show"
        :genome="genome"
        :reference="reference"
        :locus="coord"
        :tracks="tracks"
        genomeBuild="hg38"
      />

    </div>
  </div>



</template>

<script>
import RNASeqIGV   from './RNASeqIGV.vue'

export default {
  name: 'IGVPileupPanel',
  components: {
    RNASeqIGV,
  },
  props: {
    coordinates: String,
    selectedGene: Object,
    genomeBuildHelper: Object,
    geneModel: Object,
    loadInfo: Object,
    geneSource: String,
    show: Boolean
  },
  data() {
    let self = this;
    return {
      coord: null,
      genome: null,
      reference: null,

      tracks:  [

        {
          name: "Gencode",
          order: 2,
          type: "annotation",
          format: "gff3",
          displayMode: "squished",
          height: 70,
          url: null,
          indexURL: null,
          visibilityWindow: 1000000,
        },

      ],

      spliceJunctionTrack:  {
            type: 'merged',
            order: 1,
            name: 'Splice Junctions',
            height: 60,
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
                  hideMotifs: ['GT/AT', 'cryptic-site'], //options: 'GT/AG', 'CT/AC', 'GC/AG', 'CT/GC', 'AT/AC', 'GT/AT', 'cryptic-site'
              }

            ]
        },

      buildMap: {
        GRCh37: 'hg19',
        GRCh38: 'hg38'
      },

      referenceMap: {
        hg38: {
          "id": "hg38",
          "name": "Human (GRCh38/hg38)",
          "fastaURL": "https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa",
          "indexURL": "https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/hg38/hg38.fa.fai",
          "cytobandURL": "https://s3.amazonaws.com/igv.broadinstitute.org/annotations/hg38/cytoBandIdeo.txt"
        },
        hg19: {
          "id":           "hg19",
          "name":         "Human (GRCh37/hg19)",
          "fastaURL":     'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/1kg_v37/human_g1k_v37_decoy.fasta',
          "indexURL":     'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/1kg_v37/human_g1k_v37_decoy.fasta.fai',
          "cytobandURL":  'https://s3.amazonaws.com/igv.broadinstitute.org/genomes/seq/b37/b37_cytoband.txt'
        },

      },

      annotationMap: {
        hg38: {
          gencode:              'https://s3.amazonaws.com/igv.org.genomes/hg38/gencode.v40.annotation.gff3.gz',
          gencode_othr:         'https://s3.amazonaws.com/igv.org.genomes/hg38/Homo_sapiens.GRCh38.94.chr.gff3.gz',
          refseq:               'https://hgdownload.soe.ucsc.edu/goldenPath/hg38/database/ncbiRefSeq.txt.gz'
        },
        hg19: {
          gencode:              'https://s3.amazonaws.com/igv.org.genomes/hg19/annotations/gencode.v28lift37.basic.annotation.gtf.gz',
          refseq:               'https://hgdownload.soe.ucsc.edu/goldenPath/hg19/database/ncbiRefSeq.txt.gz'
        }
      }
    }
  },
  created: function() {
    let self = this;
    if (this.loadInfo) {
      this.initTrackURLs();
    }
    if (this.coordinates) {
      this.coord = this.coordinates;
    } else if (this.selectedGene && this.selectedGene.gene_name) {
      this.coord = this.selectedGene.chr + ":" + this.selectedGene.start + "-" + this.selectedGene.end;
    }
  },
  watch: {
    show: function() {
      let self = this;
      if (this.show) {
        this.initTrackURLs();
      }

    },
    selectedGene: function() {
      let self = this;


    },
    coordinates: function() {
      let self = this;
      self.coord = self.coordinates;

    },
    loadInfo: function() {
      let self = this;
    },
    geneSource: function() {
      if (this.show && this.geneModel && this.$refs.ref_IGVPileup) {
        this.setGeneAnnotationsTrack();
        this.$refs.ref_IGVPileup.reinit();
      }
    }
  },
  methods: {
    initTrackURLs: function() {
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

        let firstTime = false;
        if (this.tracks[0].url == null) {
          firstTime = true;
        }

        this.setReference();
        this.setSpliceJunctionTrack();
        this.setGeneAnnotationsTrack();
        this.setVariantsTrack();
        this.setPileupTrack();

        //this.tracks[0].order = this.tracks.length; // gene transcripts
        for (let i = 0; i < this.tracks.length; i++) {
          this.tracks[i].order = i+1;
        }


        if (!firstTime) {
          if (this.$refs && this.$refs.ref_IGVPileup) {
            this.coord = null;
          }
        }
      }

    },
    onSettingsChange: function() {
      let firstTime = false;
      if (this.tracks[0].url == null) {
        firstTime = true;
      }
      if (!firstTime) {
        if (this.$refs && this.$refs.ref_IGVPileup) {
          this.$refs.ref_IGVPileup.onRefreshTracks();
        }
      }
    },
    setReference: function() {
      let self = this;
      this.reference = this.referenceMap[this.genome];
    },
    setVariantsTrack: function() {
      let self = this;
      if (this.loadInfo && this.loadInfo.vcfURL && this.loadInfo.vcfURL.length > 0) {
        let tbiURL = self.loadInfo.tbiURL && self.loadInfo.tbiURL.length > 0 ? self.loadInfo.tbiURL.replaceAll("api/i", "api/v1") : null;
        let variantTrack = {
          name: "Variants",
          order: 1,
          type: "variant",
          format: "vcf",
          displayMode: "expanded",
          showGenotypes: false,
          colorBy: "ALT",
          colorTable: {
              "A": "#00b107",
              "G": "#dca500",
              "C": "#486dd7",
              "T": "#f60909",
              "*": "#858585"
          },
          samples: [self.loadInfo.sampleName],
          height: 30,
          url: self.loadInfo.vcfURL.replaceAll("api/i", "api/v1"),
          indexURL: tbiURL
        }

        this.tracks.push(variantTrack);
      }
    },
    setPileupTrack: function() {
      let self = this;
      if (this.loadInfo && this.loadInfo.alignmentURL && this.loadInfo.alignmentURL.length > 0
          && this.loadInfo.alignmentIndexURL && this.loadInfo.alignmentIndexURL.length > 0) {

        let pileupTrack = {
          name:        "Alignment",
          order:       1,
          type:        "alignment",
          displayMode: "expanded",
          height:      250,
          url:         self.loadInfo.alignmentURL.replaceAll("api/i", "api/v1"),
          indexURL:    self.loadInfo.alignmentIndexURL.replaceAll("api/i", "api/v1")
        }

        this.tracks.push(pileupTrack);
      }
    },
    setGeneAnnotationsTrack: function() {
      let self = this;
      let annotationURL = this.annotationMap[this.genome][this.geneModel.geneSource];
      this.tracks[0].url = annotationURL;
      if (this.geneModel.geneSource == 'gencode') {
        this.tracks[0].name = 'Gencode genes ' + this.genome
        this.tracks[0].indexURL = annotationURL + ".tbi";
        this.tracks[0].format = 'gff3'
        this.tracks[0].displayMode = 'expanded';
        this.tracks[0].colorBy = 'transcript_type';
        this.tracks[0].colorTable = {
           "antisense": "blueviolet",
           "protein_coding": "blue",
           "retained_intron": "rgb(0, 150, 150)",
           "processed_transcript": "purple",
           "processed_pseudogene": "#7fff00",
           "unprocessed_pseudogene": "#d2691e",
           "*": "black"
        };
      } else {
        this.tracks[0].name = 'RefSeq genes ' + this.genome
        this.tracks[0].format = 'refgene'
        delete this.tracks[0].indexURL;
        delete this.tracks[0].colorBy;
        delete this.tracks[0].colorTable;
      }

    },
    setSpliceJunctionTrack: function() {
      let self = this;
      if (this.loadInfo &&
          this.loadInfo.hasOwnProperty('bedURL') &&
          this.loadInfo.hasOwnProperty('bedIndexURL')) {

          // This is a workaround for 'downloadable links' URLs from Mosaic hitting CORS issues.
          // We replace api/i in the URL with api/v1
          this.spliceJunctionTrack.tracks[1].url      = this.loadInfo.bedURL.replaceAll("api/i", "api/v1");
          this.spliceJunctionTrack.tracks[1].urlIndex = this.loadInfo.bedIndexURL.replaceAll("api/i", "api/v1");
          if (this.loadInfo.bigwigURL) {
            this.spliceJunctionTrack.tracks[0].url    = this.loadInfo.bigwigURL.replaceAll("api/i", "api/v1");
          }
          this.tracks.push(this.spliceJunctionTrack)
        }
    }
  }
}
</script>

<style>




</style>

<style lang="sass">
@import '../styles/variables.sass'

#igv-pileup-panel
  #panel-heading
    .v-select__selection-text
      font-size: 13px
    v-field__field
      label
        font-size: 13px

  .igv-container
    border: none
    padding-top: 0px
    margin-top: 10px


    .igv-navbar
      margin-top: 0px
      margin-bottom: 0px
      border-style: none
      border-radius: 0px
      background-color: white

      .igv-zoom-widget
        svg
          path
            fill: $primary-button-color
      .igv-navbar-button
        font-family: Poppins
        border-radius: 4px
        color: $button-text-color
        background-color: $button-color
        padding-left: 10px
        padding-right: 10px
        height: 28px
        font-size: 12px
        font-weight: 600
        line-height: 28px
        margin-right: 15px !important
        border: none !important

      .igv-current-genome
        display: none
      .igv-chromosome-select-widget-container
        display: none !important

      .igv-search-container
        width: initial !important
        input.igv-search-input
          font-size: 14px
          font-family: Poppins
          font-weight: 500
          padding: 5px 10px 5px 10px
          height: 28px
          min-width: 210px !important

      .igv-windowsize-panel-container
        font-size: 14px
        margin-left: 15px
        font-family: Poppins
        font-weight: 400



  .igv-column-container
    margin-top: -10px
    justify-content: center !important
    width: calc(100%) !important

    .igv-ideogram-canvas
      display: none

    .igv-axis-column
      display: none

    .igv-sample-name-column
      display: none



</style>
