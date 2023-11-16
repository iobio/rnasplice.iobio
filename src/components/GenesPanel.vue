<template>
 
    <v-card id="genes-panel" style="padding-top:0px;padding-left:5px" >

      <div class="d-flex flex-row align-center">
        <h2>Genes
        </h2>
        <v-spacer/>
        <v-btn small id="close-button" variant="text" density="compact" @click.stop="onCloseGenesPanel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="d-flex flex-row mb-4">
        <v-spacer/>
        <v-btn v-if="geneModel && geneModel.geneNames && geneModel.geneNames.length > 0" id="clear-all-button" variant="tonal" @click="onClearAllGenes">
          Clear all
        </v-btn>
      </div>


      <v-expansion-panels v-if="geneModel && geneModel.sortedGeneNames.length > 0">
        <v-expansion-panel v-for="geneName in geneModel.geneNames"  :key="geneName"
          :title="geneName" style="min-height:10px;max-height:300px;overflow-y:scroll"
        >
          <template v-slot:title>
            <v-btn class="gene-button" @click="onGeneClicked(geneName)" size="medium" 
              style="margin-left:0px;padding-left: 5px;padding-right:5px;padding-top: 1px;padding-bottom: 1px;font-size: 13px; width:110px"  density="compact">{{ geneName }}</v-btn>
           
            <v-btn  id="clear-gene-button" variant="text" @click="onClearGene(geneName)">
                <v-icon icon="mdi-close"></v-icon>
              </v-btn>
          </template>
          <template v-slot:text>
            <div v-if="getSummary(geneName)">
              <div 
                v-for="spliceJunction in getSummary(geneName).noncanonical"
                :key="spliceJunction.key"
                
              >
              <div class="d-flex" style="margin-bottom:10px;cursor:pointer;text-align: left"  @click="onSelectSpliceJunction(spliceJunction)" flat density="compact">
                <div style="width: 310px;">{{ spliceJunction.label}}</div>
                <div style="width: 50px">{{ spliceJunction.readCount }}</div>
                <div>{{ (spliceJunction.strand && spliceJunction.strand != 'undefined' ? spliceJunction.strand : `?`)}}</div>  
              </div>
              </div>
            </div>
          </template>

        </v-expansion-panel>
      </v-expansion-panels>


    


    </v-card>

   
  
</template>

<script>
import ConfirmDialog      from '../components/ConfirmDialog.vue'


export default {
  name: 'GenesPanel',
  components: {
    ConfirmDialog
  },
  props: {
    geneModel: Object,
    show: Boolean,
    selectedObject: Object
  },
  data: () => ({
    showGenesPanel: true,

    showConfirmDialog: false,
    confirmMessage: "",
    confirmTitle: "",

    
  }),
  methods: {


    onClearGene: function(geneName) {
      this.$emit("clear-gene", geneName)
    },
    onClearAllGenes: function(alert) {
      let self = this;
      let msg = "Are you sure you want to clear all genes?"
      self.confirmMessage = msg;
      self.confirmTitle = "Confirm"
      self.showConfirmDialog = true;

    },
    onCloseGenesPanel: function() {
      this.$emit('close-genes-panel')
    },
    onConfirmed: function(answer) {
      this.showConfirmDialog = false;
      this.$emit('clear-all-genes');
    },
    onGeneClicked: function(geneName) {
      this.$emit('gene-clicked', geneName)
    },
    getSummary: function(geneName) {
      return this.geneModel.geneToSpliceJunctionSummary[geneName];
    },
    onSelectSpliceJunction: function(spliceJunction) {
      this.$emit("select-splice-junction", spliceJunction)
    }
  },
  watch: {
    
    show: function() {
      this.showGenesPanel = this.show;
    }
  },
  created: function() {
    this.showGenesPanel = false;
  }
}
</script>


<style lang="sass">
@import '../styles/variables.sass'
#genes-panel
  margin-bottom: 10px

  .gene-button
    justify-content: flex-start
    margin-left: 5px

  #close-button
    margin-right: -15px
    margin-top: 0px
    min-width: 20px
    margin-bottom: 5px

  .alert-item
    clear: both

  #clear-all-button
    margin: 0px
    height: 20px
    padding-left: 3px 
    padding-right: 3px
    margin-right: 0px

    .v-btn__content
      color: $link-color
      font-size: 13px

  #clear-gene-button
    max-width: 20px
    min-width: 20px
    max-height: 20px
    margin: 0
    float: right
    padding-left: 3px 
    padding-right: 3px
    color: $text-color !important

    .v-btn__content
      padding-right: 0px !important

      i
        color: $text-color !important
        font-size: 13px

</style>