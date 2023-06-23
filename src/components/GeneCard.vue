<template>
  <v-card v-if="selectedGene" id="gene-card" class="main">
 
    <div class="d-flex flex-column">
    
      <div id="gene-name">
        <h2> Gene {{ selectedGene.gene_name }} </h2>
      </div>

      <div class="d-flex flex-row justify-start align-center">

        <div class="pr-3 flex-grow-0 flex-shrink-0">
          {{ selectedGene.chr }}
        </div>

        <div class="pr-3 flex-grow-0 flex-shrink-0">
          {{ formatRegion(selectedGene.startOrig) }} - {{ formatRegion(selectedGene.endOrig) }}
        </div>

        <div class="pr-3 d-flex flex-row align-center flex-grow-0 flex-shrink-0">
          <div  id="gene-plus-minus-label"  class="mr-3">+  -</div>

          <div style="width:70px">
            <v-text-field density="compact" hide-details
                    id="gene-region-buffer-input"
                    v-model="regionBuffer"
                    v-on:change="onGeneRegionBufferChange">
            </v-text-field>
          </div>
        </div>


        <v-chip class="pr-3 flex-grow-0 flex-shrink-0" id="minus-strand" 
        v-if="selectedGene.strand == '-'">
          reverse strand
        </v-chip>

    
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
    },
    data: () => ({
      regionBuffer: 1000,

    }),
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
      alerts: function() {
      }
    }
  }
</script>


<style lang="sass">
@import '../styles/variables.sass'

#gene-card
  #gene-region-buffer-input
    font-size: 13px

  #region-buffer-box
    .input-group--text-field, .v-text-field__slot
      input
        font-size: 14px
        color: $text-color
        fill:  $text-color

</style>