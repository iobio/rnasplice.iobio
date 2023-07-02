<template>
  <v-navigation-drawer 
      id="genes-panel"
      width="165"
      v-model="showGenesPanel"
      permanent
      location="left"
      style="margin-left: 5px;margin-right: 5px;padding: 5px;height: calc(100% - 65px);">

    <div style="padding-top:0px;padding-left:5px" >


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

      <div v-if="geneModel && geneModel.sortedGeneNames.length > 0">
        <div v-for="geneName in geneModel.geneNames"
          class="gene-item mb-2"
          :key="geneName" style="display: flex"

        >
          <v-btn class="gene-button" @click="onGeneClicked(geneName)" size="medium" variant="flat"
          style="font-size: 13px; width:110px" density="compact">{{ geneName }}</v-btn>
          
          <v-btn  id="clear-gene-button" variant="text" @click="onClearGene(geneName)">
            <v-icon icon="mdi-close"></v-icon>
          </v-btn>

        </div>
      </div>

    </div>

    <ConfirmDialog
      :showIt="showConfirmDialog"
      :message="confirmMessage"
      :title="confirmTitle"
      @confirmed="onConfirmed"/>

  </v-navigation-drawer>
</template>

<script>

import ConfirmDialog from './ConfirmDialog.vue'

export default {
  name: 'GenesPanel',
  components: {
    ConfirmDialog
    
  },
  props: {
    geneModel: Object,
    show: Boolean
  },
  data: () => ({
    showGenesPanel: true,

    showConfirmDialog: false,
    confirmMessage: "",
    confirmTitle: ""
    
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

  .gene-button
    justify-content: flex-start
    margin-left: 20px

  #close-button
    margin-right: -15px
    margin-top: 0px
    min-width: 20px
    margin-bottom: 5px

  margin-left: 10px
  margin-right: 10px
  margin-top: 5px
  margin-bottom: 0px

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