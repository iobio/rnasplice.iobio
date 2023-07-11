<template>
    <v-layout class="bg-grey-lighten-3">

      <Navigation 
      ref="ref_Navigation"
      :genes="genes" 
      :alerts="appAlerts"
      :alertCounts="appAlertCounts"
      @gene-searched="onGeneSearched"
      @show-alert-panel="onShowAlertPanel"
      @show-genes-panel="onShowGenesPanel"
      @load-data="onLoadData"
      />

      <GenesPanel :show="showGenesPanel"
      :geneModel="geneModel"
      @close-genes-panel="onCloseGenesPanel"
      @clear-gene="onClearGene"
      @clear-all-genes="onClearAllGenes"
      @gene-clicked="onGeneClicked"/>

      <AlertPanel :show="showAlertPanel"
      :alerts="appAlerts"
      @close-alert-panel="onCloseAlertPanel"
      @clear-alert="onClearAlert"
      @clear-all-alerts="onClearAllAlerts"/>


      <v-main  >
         <SpliceJunctionHome 
          ref="ref_SpliceJunctionHome"
          :loadInfo="loadInfo"
          :genes="genes" 
          :searchedGene="searchedGene"
          :selectedGene="selectedGene"
          :alerts="appAlerts"
          :alertCounts="appAlertCounts"
          :geneToAlerts="geneToAppAlerts"
          :spliceJunctionsForGene="spliceJunctionsForGene"
          @add-alert="addAlert"
          @gene-selected="onGeneSelected"
          @reinit="onReinit"
          @gene-model-initialized="onGeneModelInitialized"
          @splice-junctions-loaded="onSpliceJunctionsLoaded"/>


      </v-main>

    </v-layout>

</template>

<script>
import SpliceJunctionHome from './components/SpliceJunctionHome.vue';
import Navigation         from './components/Navigation.vue';
import AlertPanel         from './components/AlertPanel.vue';
import GenesPanel         from './components/GenesPanel.vue';

import genesData          from '@/data/genes.json'


import  qs  from 'qs'


export default {
  name: 'App',

  components: {
    SpliceJunctionHome,
    Navigation,
    AlertPanel,
    GenesPanel
  },

  data: () => ({
    genes:       genesData,

    geneModel: null,

    searchedGene: null,
    selectedGene: null,
    spliceJunctionsForGene: null,

    loadInfo: null,
    isLoaded: false,

    appAlerts: [],
    appAlertCounts: {'total': 0, 'success': 0, 'info': 0, 'warning': 0, 'error': 0},
    geneToAppAlerts: {},

    showAlertPanel: false,
    showGenesPanel: false

    
  }),
  created: function() {
    let idx = window.location.hash.indexOf("#access_token")
    if (idx == 0) {
      let queryParams = qs.parse(window.location.hash.substring(1));
      let { access_token, expires_in, token_type, ...otherQueryParams } = queryParams;
      localStorage.setItem('hub-iobio-tkn', token_type + ' ' + access_token);
      let urlPath = window.location.origin + "?" + qs.stringify(otherQueryParams)
      window.history.pushState({},"", urlPath);
    } 
    d3.select("body")
  },
  methods: {
    onGeneModelInitialized: function(geneModel) {
      this.geneModel = geneModel;
    },
    onGeneClicked: function(geneName) {
      this.onGeneSearched({'gene_name': geneName})
      if (this.$refs && this.$refs.ref_Navigation) {
        this.$refs.ref_Navigation.setGeneSearchField(geneName)
      }
    },
    onGeneSearched: function(gene) {
      this.searchedGene = gene;
    },
    onGeneSelected: function(gene) {
      this.selectedGene = gene;
      this.addAlert("info", "gene <pre>" + gene.gene_name + "</pre> loaded", gene.gene_name)

      if (this.geneModel.geneNames.length > 1) {
        this.onShowGenesPanel();
      }
    },
    onLoadData: function(loadInfo) {
      this.loadInfo = loadInfo;
    },
    onReinit: function() {
      let self = this;
      let geneNameToReload = self.selectedGene ? self.selectedGene.gene_name : null;
      self.selectedGene = null;
      self.searchedGene = null;
      if (self.$refs && self.$refs.ref_SpliceJunctionHome) {
        self.$refs.ref_SpliceJunctionHome.clearAndReload(geneNameToReload);
      }
      self.addAlert("info", "reloaded data")
    },
    onSpliceJunctionsLoaded: function(spliceJunctionData) {
      this.spliceJunctionsForGene = spliceJunctionData;
    },
    addAlert: function(type, message, genes=null, details=null) {
      let self = this;

      let matching = self.appAlerts.filter(function(alert) {
        if (alert.type == type && 
            alert.message == message &&
            alert.genes == genes && 
            alert.details == details) {
          return true;
        } else {
          return false;
        }
      })

      if (matching.length == 0) {
        let pad2 = function(n) { return n < 10 ? '0' + n : n }
        let pad3 = function(n) { 
          if (n < 10) {
            return '00' + n;
          } else if (n < 100) {
            return '0' + n;
          } else {
            return n;
          }
        }
        let date = new Date();
        let timestamp = date.getFullYear().toString() 
         + pad2(date.getMonth() + 1) 
         + pad2( date.getDate())
         + pad2( date.getHours() ) 
         + pad2( date.getMinutes() ) 
         + pad2( date.getSeconds() )
         + pad3( date.getMilliseconds() );

        let theAlert = {'type': type, 
        'message': message, 
        'genes': genes, 
        'timestamp': timestamp, 
        'key': timestamp + "-" + this.appAlerts.length, 
        'showDetails': false}
        if (details) {
          theAlert.details = details;
        }
        this.appAlerts.push(theAlert)

        if (genes && genes.length > 0) {
          genes.split(", ").forEach(function(theGeneName) {
            let theAlerts = self.geneToAppAlerts[theGeneName];
            if (theAlerts == null) {
              theAlerts = [];
              self.geneToAppAlerts[theGeneName] = theAlerts;
            }
            theAlerts.push(alert)
          }) 
        }

        this.appAlertCounts[type] += 1 
        this.appAlertCounts.total += 1
        
      } 
    },
    onClearAlert: function(key) {
      let self = this;

      let matching = self.appAlerts.filter(function(alert) {
        if (alert.key == key) {
          return true;
        } else {
          return false;
        }
      })

      matching.forEach(function(alertToRemove) {
        let index = self.appAlerts.indexOf(alertToRemove);
        if (index >= 0) {
          self.appAlertCounts[alertToRemove.type] -= 1 
          self.appAlertCounts.total -= 1;

          self.appAlerts.splice(index, 1)
        }
      })
    },
    onClearAllAlerts: function(type) {
      let self = this;

      if (type == null) {
        self.appAlerts = []
        self.appAlertCounts = {'total': 0, 'success': 0, 'info': 0, 'warning': 0, 'error': 0};
        return;
      }

      let matching = self.appAlerts.filter(function(alert) {
        if (alert.type == type) {
          return true;
        } else {
          return false;
        }
      })

      matching.forEach(function(alertToRemove) {
        let index = self.appAlerts.indexOf(alertToRemove);
        if (index >= 0) {
          self.appAlertCounts[alertToRemove.type] -= 1 
          self.appAlertCounts.total -= 1;

          self.appAlerts.splice(index, 1)
        }
      })
    },
    onShowAlertPanel: function() {
      this.showAlertPanel = true;
    },
    onCloseAlertPanel: function() {
      this.showAlertPanel = false;
    },
    onShowGenesPanel: function() {
      this.showGenesPanel = true;
    },
    onCloseGenesPanel: function() {
      this.showGenesPanel = false;
    },
    onClearAllGenes: function() {
      this.searchedGene = null;
      this.selectedGene = null;
      this.geneModel.clearAllGenes();
      
    },
    onClearGene: function(geneName) {
      this.geneModel.removeGene(geneName)
      if (this.searchedGene.gene_name == geneName) {
        this.searchedGene = null;
        this.selectedGene = null;
        if (this.$refs && this.$refs.ref_Navigation) {
          this.$refs.ref_Navigation.setGeneSearchField("")
        }

      }

    }
  }


};
</script>


<style lang="sass">
@import './styles/variables.sass'

.v-app-bar
  background-color: $nav-color !important
</style>


<style>


.application, .v-application, body {
  font-family: 'Poppins' !important;
  font-size: 15px;
  color: #494949;
}
.v-application .text-body-1, 
.v-application .text-body-2{
  font-family: 'Poppins' !important;
  font-size: 15px;
  color: #494949;
}

.v-card--variant-elevated, .v-card--variant-flat {
  color: #494949;
}

.v-app-bar {
  font-size:  16px;
  overflow: visible;
}
.v-app-bar .v-btn {
  font-size: 18px;
}
.v-toolbar__content {
  color: white;
}


.v-btn.v-size--default {
    font-size: 15px;
}
.v-btn {
    letter-spacing: initial;
    text-transform: initial;
}
.v-chip.v-size--default {
  height: 24px;
  font-size: 13px;
  padding: 5px ;
  border-radius: 5px;
}
h1, .h1 {
    font-size: 20px !important;
    margin-top: 0px !important;
    margin-bottom: 5px !important;
}
h2, .h2 {
    font-size: 18px !important;
    margin-top: 0px !important;
    margin-bottom: 5px !important;
}
.v-card {
  padding: 10px !important;
}
.v-card.full-width-card {
  margin-left:   5px !important;
  margin-right:  5px !important;
  margin-top:    0px !important;
  margin-bottom: 5px !important;
}

.v-input--center-affix .v-input__prepend, .v-input--center-affix .v-input__append {
  margin-right: 2px;
}
.v-switch .v-label {
  font-size: 13px;
  padding-top: 4px;
  padding-left: 6px;
}
</style>
