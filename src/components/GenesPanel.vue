<template>
 
    <v-card id="genes-panel">

      <div class="d-flex flex-row align-center mb-1">
        <h2>Genes
        </h2>
        <v-spacer/>

        <v-btn v-if="geneModel && geneModel.geneNames && geneModel.geneNames.length > 0" id="clear-all-button" variant="tonal" @click="onClearAllGenes">
          Clear all
        </v-btn>

        <v-btn small id="close-button" variant="text" density="compact" @click.stop="onCloseGenesPanel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

    

      <v-expansion-panels v-if="geneModel && geneModel.sortedGeneNames.length > 0"
       v-model="expandGene">
        <v-expansion-panel v-for="geneName in geneModel.geneNames"  :key="geneName"
          :title="geneName" :value="geneName" >
          <template v-slot:title>
            <div :id="geneName + `-expansion-title`"
            :class="`d-flex gene-expansion-title` + (selectedGene && selectedGene.gene_name == geneName ? ` selected` : ``)">
              <v-btn class="gene-button" variant="tonal" 
                @click.stop="onGeneClicked(geneName)" size="medium" 
                style="margin-left:0px;padding-left: 5px;padding-right:5px;padding-top: 1px;padding-bottom: 1px;font-size: 13px; width:110px"  
                color="#094792" density="compact">{{ geneName }}</v-btn>

            </div>
                  <v-chip v-if="getSummary(geneName)" color="red" class="ml-4" size="small" >
                      {{ getSummary(geneName).noncanonical.length }}
                  </v-chip>
             
             <v-spacer/>
             <v-btn  id="clear-gene-button" variant="text" @click="onClearGene(geneName)">
                <v-icon icon="mdi-close"></v-icon>
              </v-btn>
          </template>
          <template v-slot:text>
            <div v-if="getSummary(geneName)">
              <h3>Non-canonical splice junctions                     
              </h3>

              <div class="d-flex flex-column" style="max-height:160px;overflow-y:scroll">
                <div  v-for="spliceJunction, idx in getSummary(geneName).noncanonical"
                  :key="spliceJunction.key" 
                  :class="`d-flex splice-junction-entry` + (selectedObject && selectedObject.key == spliceJunction.key ? ` selected` : ``)"
                   @click="onSelectSpliceJunction(spliceJunction, geneName)" flat density="compact">
                  <div style="width: 35px">{{ idx+1 }}.</div>
                  <div style="width: 255px;">{{ spliceJunction.label}}</div>
                  <div style="width: 50px">{{ spliceJunction.readCount }}</div>
                  <div>{{ (spliceJunction.strand && spliceJunction.strand != 'undefined' ? spliceJunction.strand : `?`)}}</div>  
                </div>
              </div>
   
            </div>
          </template>

        </v-expansion-panel>
      </v-expansion-panels>


    <ConfirmDialog 
      :showIt="showConfirmDialog"
      :message="confirmMessage"
      :title="confirmTitle"
      @confirmed="onConfirmed"/>

    


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
    selectedObject: Object,
    selectedGene: Object
  },
  data: () => ({
    showGenesPanel: true,

    showConfirmDialog: false,
    confirmMessage: "",
    confirmTitle: "",
    expandGene: null

    
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
      //this.expandGene = geneName;
      d3.select("#genes-panel .gene-expansion-title.selected").classed("selected", false);
      d3.select("#genes-panel #" + geneName + "-expansion-title").classed("selected", true)
      this.$emit('gene-clicked', geneName)
    },
    getSummary: function(geneName) {
      return this.geneModel.geneToSpliceJunctionSummary[geneName];
    },
    onSelectSpliceJunction: function(spliceJunction, geneName) {
      let self = this;
      if (geneName != this.selectedGene.gene_name) {
        self.onGeneClicked(geneName)
        setTimeout(function() {
          self.$emit("select-splice-junction", spliceJunction)
        }, 500)
      } else {
        self.$emit("select-splice-junction", spliceJunction)
      }
    }
  },
  watch: {
    selectedGene: function() {
      if (this.selectedGene) {
        this.expandGene = this.selectedGene.gene_name;
      }
    },
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
  margin-bottom: 5px
  padding-top:   0px
  padding-left:  5px
  flex-grow: 1
  height: calc(100% - 360px)

  
   
  .gene-expansion-title
    justify-content: space-between
    &.selected
      border: thin solid #094792

  .v-expansion-panel--active:not(:first-child)
    margin-top: 4px !important
  .v-expansion-panels
    overflow-y: scroll

  .v-expansion-panel-title
    padding: 0px 8px
    min-height: 30px
  .v-expansion-panel-text__wrapper
    padding: 4px 4px
    margin-bottom: 80px

  .splice-junction-entry
    margin-bottom: 10px
    cursor:        pointer
    text-align:    left
    padding-left: 4px
    &.selected
      border: thin solid #094792


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
    margin-top: -5px

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