<template>
  <v-card v-if="selectedGene" id="gene-card" class="main">

    <div class="d-flex flex-column">

      <div class="d-flex flex-row justify-start align-center">

        <div  id="gene-name" style="padding-top:4px">
          <h2> Gene {{ selectedGene.gene_name }} </h2>
        </div>

        <div class="coord flex-grow-0 flex-shrink-0" style="margin-left:84px">
        {{ selectedGene.chr}}:{{ formatRegion(selectedGene.startOrig) }}-{{ formatRegion(selectedGene.endOrig) }}
        </div>
        <v-btn  @click="copyGeneCoord" density="compact" variant="text" size="medium"
        class="coord-button ml-1 flex-grow-0 flex-shrink-0">
          <v-icon icon="mdi-content-copy" ></v-icon>
        </v-btn>

        <v-chip   class="ml-6 mr-5 pr-3 flex-grow-0 flex-shrink-0" id="minus-strand"
         size="x-small">
          {{ selectedGene.strand == '-' ? `reverse strand` : `forward strand` }}
        </v-chip>

        <div style="width:155px" class="ml-3">
            <v-select id="strand-combo"
              v-model="theGeneSource"
              hide-details="auto"
              label="Gene annotations"
              density="compact"
              :items="['gencode', 'refseq',]"
            ></v-select>
        </div>



      </div>

    </div>
  </v-card>
</template>

<script>

  export default {
    name: 'GeneCard',
    components: {

    },
    props: {
      selectedGene: Object,
      geneModel: Object
    },
    data: () => ({

      theGeneSource: 'gencode',


    }),
    created: function() {

    },
    methods: {
      formatRegion: function (value) {
        return !value ? '' : value.toLocaleString('en-US');
      },
      formatTranscriptType: function(transcript) {
        if (transcript && transcript.transcript_type.indexOf("transcript") < 0) {
          return transcript.transcript_type + " transcript";
        } else if (transcript) {
          return transcript.transcript_type;
        } else {
          return "";
        }
      },

      copyGeneCoord: function() {
        let self = this;
        let coord = self.selectedGene.chr + ":" +
                    self.selectedGene.start + "-" + self.selectedGene.end;
        navigator.clipboard.writeText(coord)
        .then(function() {
          alert(coord)
        })
        .catch(function(error) {
        })
      }
    },
    watch: {
      theGeneSource: function() {
        if (this.geneModel) {
          this.geneModel.geneSource = this.theGeneSource;
        //  this.$emit("reinit")
        }
      }
    }
  }
</script>


<style lang="sass">
@import '../styles/variables.sass'

#gene-card
  padding: 5px 10px !important
  #gene-region-buffer-input
    font-size: 13px

  #region-buffer-box
    .input-group--text-field, .v-text-field__slot
      input
        font-size: 14px
        color: $text-color
        fill:  $text-color
  #minus-strand
    font-size: 13px


  .v-select
    .v-field
      font-size: 13px

  .coord
    font-size: 14px !important
    margin-top: 1px !important
    font-weight: 500


  .coord-button
    height: 28px
    margin-top: 0px
    color: #30638f


</style>