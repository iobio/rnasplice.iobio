<template>
  <v-card v-if="selectedGene" id="gene-card" class="main">
 
    <div class="d-flex flex-column">
    
      <div class="d-flex flex-row justify-start align-center">

        <div  id="gene-name" style="padding-top:4px">
          <h2> Gene {{ selectedGene.gene_name }} </h2>
        </div>

        <div class="pl-6 pr-3 flex-grow-0 flex-shrink-0">
          {{ selectedGene.chr }}
        </div>

        <div class="pr-3 flex-grow-0 flex-shrink-0">
          {{ formatRegion(selectedGene.startOrig) }} - {{ formatRegion(selectedGene.endOrig) }}
        </div>

        <div class="pr-3 d-flex flex-row align-center flex-grow-0 flex-shrink-0">
          <div  id="gene-plus-minus-label"  class="ml-2 mr-1">+  -</div>

          <div style="width:70px">
            <v-text-field  density="compact" hide-details="auto"
                    id="gene-region-buffer-input"
                    v-model="regionBuffer"
                    v-on:change="onGeneRegionBufferChange">
            </v-text-field>
          </div>
        </div>


        <v-chip   class="ml-2 mr-5 pr-3 flex-grow-0 flex-shrink-0" id="minus-strand" 
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
      regionBuffer: 1000,
      theGeneSource: 'gencode',


    }),
    created: function() {
      
    },
    methods: {
      onGeneRegionBufferChange: function (event) {
        this.$emit('gene-region-buffer-change', parseInt(this.regionBuffer));
      },
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
 
</style>