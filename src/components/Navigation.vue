<template>
  <v-app-bar
      dark height="60"
      style="padding-top:2px"
    >

      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="onShowGenesPanel"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>rnasplice.iobio</v-app-bar-title>
      <div class="app-version">v{{ appVersion }}</div>


      <div v-if="buildName" class="app-label ml-8 mr-5" >{{ buildName }}</div>
      <div id="project-name" v-if="projectName" class="app-label mr-5" >Project {{ projectName }}</div>
      <div id="sample-name"  v-if="sampleName" class="app-label" >Sample {{ sampleName }}</div>

      <v-spacer></v-spacer>

      <div id="search-gene-box" style="min-width:200px">
        <v-text-field id="search-gene-input" class="pl-2"
        hide-details
        v-model="searchedGeneInput"
        density="compact"
        label="Gene"
        prepend-icon="mdi-magnify"
        />
        <Typeahead  v-model="searchedGene"
        target="#search-gene-input"
        :data="genes"
        item-key="gene_name" />
      </div>
      <v-spacer></v-spacer>




      <v-btn id="load-data-button" @click="onShowLoadDataDialog" class="navbar-icon-button mr-9" text>
        <v-icon  class="mr-1">mdi-open-in-new</v-icon>
        Load data
      </v-btn>



      <AlertButton
      class="mr-4"
      :alerts="alerts"
      :alertCounts="alertCounts"
      @show-alert-panel="onShowAlertPanel"/>




      <v-btn id="legend-button"
      @click="$emit('show-legend')"
      v-tooltip.bottom-left="{content: 'Show legend'}">
        <v-icon class="mr-1">mdi-map</v-icon>
      </v-btn>

      <template v-slot:append >
        <v-btn icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>

        <v-menu activator="parent">
          <v-list>
            <v-list-item>
              <v-list-item-title>Version {{ appVersion }}</v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title @click="showDisclaimer=true">Disclaimer</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <LoadDataDialog
      :showIt="showLoadDataDialog"
      :sampleNames="sampleNames"
      :preLoadInfo="preLoadInfo"
      @load="onLoadData"
      @cancel="onCancelLoadData"
      @vcf-url-entered="onVcfURLEntered"/>


      <v-dialog v-model="showDisclaimer" max-width="400" min-height="400">
        <v-card class="main-card">
          <v-card-title class="headline">Disclaimer</v-card-title>
          <v-card-text>

                  The University of Utah makes no claims that iobio applications, including gene.iobio are approved for clinical use. All users of iobio applications including gene.iobio understand and accept that any information gained by using these applications, whether the information comes from visualization, processing, internal or external databases, or analysis, may not in any way be used for clinical purposes. The University of Utah makes no representation that iobio or gene.iobio is either safe or effective for any intended use for which research may currently be performed.
                  <br><br>
                  iobio, or any iobio applications ARE TO BE USED FOR RESEARCH PURPOSES ONLY. USE FOR CLINICAL PURPOSES IS EXPRESSLY FORBIDDEN. Approval of iobio applications for clinical use has neither been applied for, nor received, in any country, including the United States of America.
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn   @click.native="showDisclaimer = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>


    </v-app-bar>

</template>

<script>


import AlertButton    from '../components/AlertButton.vue'
import LoadDataDialog from '../components/LoadDataDialog.vue'
import { Typeahead } from 'uiv'

  export default {
    name: 'Navigation',
    components: {
      AlertButton,
      Typeahead,
      LoadDataDialog
    },
    props: {
      appVersion: String,
      genes: Array,
      genomeBuild: Array,
      alerts: Array,
      alertCounts: Object,
      sampleNames: Array,
      selectedGene: Object,
      preLoadInfo: Object,
      loadInfo: Object
    },
    data: () => ({
      searchedGene: null,
      searchedGeneInput: null,
      showLoadDataDialog: false,
      showDisclaimer: false,
    }),
    watch: {
      searchedGene: function() {
        if (this.searchedGene && this.searchedGene.gene_name) {
          this.$emit("gene-searched", this.searchedGene)
        }
      },

    },
    methods: {
      onShowAlertPanel: function() {
        this.$emit('show-alert-panel', true);
      },
      onShowLoadDataDialog: function() {
        this.showLoadDataDialog = true;
      },
      onLoadData: function(loadInfo) {
        this.$emit('load-data', loadInfo)
        this.showLoadDataDialog = false;
      },
      onCancelLoadData: function() {
        this.showLoadDataDialog = false;
      },
      onVcfURLEntered: function(vcfURL, tbiURL) {
        this.$emit('vcf-url-entered', vcfURL, tbiURL)
      },
      onShowGenesPanel: function() {
        this.$emit('show-genes-panel')
      },
      setGeneSearchField: function(theValue) {
        this.searchedGeneInput = theValue;
      }
    },
    computed: {
      sampleName: function() {
        if (this.loadInfo && this.loadInfo.sampleName) {
          return this.loadInfo.sampleName;
        } else {
          return null;
        }
      },
      buildName: function() {
        if (this.loadInfo && this.loadInfo.buildName) {
          return this.loadInfo.buildName;
        } else {
          return null;
        }
      },
      projectName: function() {
        if (this.loadInfo && this.loadInfo.project) {
          if (false && this.loadInfo.project.nickname && this.loadInfo.project.nickname != "" ) {
            return this.loadInfo.project.nickname;
          } else {
            let name = this.loadInfo.project.name;
            name = name.replaceAll("-", " ")
            name = name.replaceAll("_", " ")
            if (name.length > 30) {
              let endPos = Math.min(30, name.length)
              name = name.slice(0,endPos) + "..."
            }
            return name;
          }
        } else {
          return null;
        }
      }
    }
  }
</script>

<style>

#search-gene-box .dropdown {
  margin-left: 32px;
}

</style>

<style lang="sass">

@import '../styles/variables.sass'

.navbar-icon-button
  background-color: transparent !important

.v-app-bar
  .v-btn
    font-size: 16px !important
    font-weight: 500

  .v-toolbar-title.v-app-bar-title
    max-width:  150px

  .app-label
    font-size: 12px
    font-style: italic
    font-weight: 500
    color:  $nav-label-color
    margin-top: 3px

  #sample-name
    max-width: 50px
    overflow-y: hidden
    font-size: 12px
    line-height: 13px
    white-space: break-spaces
    max-height: 38px

  #project-name
    max-width: 90px
    overflow-y: hidden
    font-size: 12px
    line-height: 13px
    white-space: break-spaces
    max-height: 38px

.app-version
  font-size: 15px
  padding-top: 4px
</style>
