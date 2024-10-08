<template>
    <v-layout class="bg-grey-lighten-2">

      <Navigation
      ref="ref_Navigation"
      :geneModel="geneModel"
      :appVersion="appVersion"
      :alerts="appAlerts"
      :alertCounts="appAlertCounts"
      :sampleNames="sampleNames"
      :selectedGene="selectedGene"
      :preLoadInfo="preLoadInfo"
      :loadInfo="loadInfo"
      @gene-searched="onGeneSearched"
      @show-alert-panel="onShowAlertPanel"
      @show-genes-panel="onShowLeftNavDrawer"
      @load-data="onLoadData"
      @vcf-url-entered="onVcfURLEntered"
      @show-legend="onShowLegend(true)"
      />

       <v-navigation-drawer style="margin-left:5px"
        id="left-nav-drawer"
        width="400"
        v-model="showLeftNavDrawer"
        permanent
        class="bg-grey-lighten-2"
        location="left">

            <GenesPanel
              class="d-flex flex-column"
              :show="showLeftNavDrawer"
              :geneModel="geneModel"
              :selectedObject="selectedObject"
              :selectedGene="selectedGene"
              @close-genes-panel="onCloseLeftNavDrawer"
              @clear-gene="onClearGene"
              @clear-all-genes="onClearAllGenes"
              @gene-clicked="onGeneClicked"
              @select-splice-junction="selectSpliceJunction"
            />

<!--
            <ObjectDetails :show="selectedGene && selectedObject"
              class="d-flex flex-column"
              :selectedObject="selectedObject"
              :selectedGene="selectedGene"
            />
-->

      </v-navigation-drawer>

      <AlertPanel :show="showAlertPanel"
      :alerts="appAlerts"
      @close-alert-panel="onCloseAlertPanel"
      @clear-alert="onClearAlert"
      @clear-all-alerts="onClearAllAlerts"/>

      <v-navigation-drawer
      v-model="showLegendDrawer"
      absolute
      location="right"
      width="200"
      temporary
      scrim="false"
      >
        <v-btn id="legend-drawer-close-button" class="toolbar-button" flat @click="showLegendDrawer = false">
          <v-icon >mdi-close</v-icon>
        </v-btn>

        <legend-panel
           :showLegendTitle="false"
           :isBasicMode="false"
           :isSimpleMode="false">
        </legend-panel>

      </v-navigation-drawer>

      <v-main  >
         <SpliceJunctionHome
          ref="ref_SpliceJunctionHome"
          :loadInfo="loadInfo"
          :searchedGene="searchedGene"
          :selectedGene="selectedGene"
          :alerts="appAlerts"
          :alertCounts="appAlertCounts"
          :geneToAlerts="geneToAppAlerts"
          :spliceJunctionsForGene="spliceJunctionsForGene"
          :donorSiteSeqRange="donorSiteSeqRange"
          :acceptorSiteSeqRange="acceptorSiteSeqRange"
          :donorSitePan="donorSitePan"
          :acceptorSitePan="acceptorSitePan"
          @add-alert="addAlert"
          @gene-selected="onGeneSelected"
          @reinit="onReinit"
          @gene-model-initialized="onGeneModelInitialized"
          @splice-junctions-loaded="onSpliceJunctionsLoaded"
          @object-selected="onObjectSelected"
          @set-donor-site-zoom-factor="onSetDonorSiteZoomFactor"
          @set-acceptor-site-zoom-factor="onSetAcceptorSiteZoomFactor"
          @set-donor-site-pan="onSetDonorSitePan"
          @set-acceptor-site-pan="onSetAcceptorSitePan"
          @reset-donor-site-pan="donorSitePan = 0"
          @reset-acceptor-site-pan="acceptorSitePan = 0"
          @sample-names-loaded="onSampleNamesLoaded"
          @load-data-from-url-params="onLoadDataFromURL"
          @load-data-from-mosaic="onLoadDataFromMosaic"
          @show-legend="showLegendDrawer=true"/>


      </v-main>

    </v-layout>


</template>

<script>
import SpliceJunctionHome from './components/SpliceJunctionHome.vue';
import Navigation         from './components/Navigation.vue';
import AlertPanel         from './components/AlertPanel.vue';
import GenesPanel         from './components/GenesPanel.vue';
import ObjectDetails      from './components/ObjectDetails.vue';
import LegendPanel        from './components/LegendPanel.vue';


import  qs  from 'qs'


export default {
  name: 'App',

  components: {
    SpliceJunctionHome,
    Navigation,
    AlertPanel,
    GenesPanel,
    ObjectDetails,
    LegendPanel
  },

  data: () => ({
    appVersion:  import.meta.env.PACKAGE_VERSION,

    geneModel: null,

    searchedGene: null,
    selectedGene: null,
    spliceJunctionsForGene: null,

    loadInfo: null,
    preLoadInfo: null,
    isLoaded: false,
    sampleNames: [],

    appAlerts: [],
    appAlertCounts: {'total': 0, 'success': 0, 'info': 0, 'warning': 0, 'error': 0},
    geneToAppAlerts: {},

    showAlertPanel: false,
    showLeftNavDrawer: false,


    selectedObject: null,
    donorReferenceSequence: null,
    acceptorReferenceSequence: null,


    donorSiteSeqRange:         30,
    acceptorSiteSeqRange:      30,
    donorSitePan:               0,
    acceptorSitePan:            0,

    showLegendDrawer: false



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
      let self = this;
      this.geneModel = geneModel;

      // TODO - Remove. This is temporary code until we have worked out
      // how the app is launched
      if (self.loadInfo == null && !localStorage.getItem('hub-iobio-tkn')) {
        setTimeout(function() {
          if (self.$refs && self.$refs.ref_Navigation) {
            self.$refs.ref_Navigation.onShowLoadDataDialog()
          }
        }, 1000)
      }

    },
    onGeneClicked: function(geneName) {
      this.onGeneSearched({'gene_name': geneName})
      if (this.$refs && this.$refs.ref_Navigation) {
        this.$refs.ref_Navigation.setGeneSearchField(geneName)
      }
    },
    onGeneSearched: function(gene) {
      this.searchedGene = gene;
      this.selectedObject = null;
      this.spliceJunctionsForGene = null;
    },
    onGeneSelected: function(gene) {
      this.selectedGene = gene;
      this.addAlert("info", "gene <pre>" + gene.gene_name + "</pre> loaded", gene.gene_name)
      this.showLeftNavDrawer = true;
    },
    onShowLegend: function(show) {
      this.showLegendDrawer = show;
    },
    onLoadDataFromMosaic: function(loadInfo) {
      let self = this;
      this.loadInfo = loadInfo;
      self.preLoadInfo = $.extend({}, loadInfo);
      if (self.loadInfo.vcfURL && self.loadInfo.tbiURL) {
        self.$nextTick(function() {
          self.onVcfURLEntered(self.loadInfo.vcfURL, self.loadInfo.tbiURL)

          if (self.preLoadInfo.genes != null && self.preLoadInfo.genes.length > 0) {
            self.$nextTick(function(){
              self.onShowLeftNavDrawer();
              let genes = self.geneModel.sortedGeneNames;
              if (genes && genes.length > 0) {
                  self.onGeneClicked(genes[0])
              }
            })
          }

        })
      } else {
        if (self.preLoadInfo.genes != null && self.preLoadInfo.genes.length > 0) {
          self.$nextTick(function(){
            self.onShowLeftNavDrawer();
            self.$nextTick(function() {
              self.onGene
            })
          })
        }
      }

    },
    onLoadData: function(loadInfo) {
      let self = this;
      let reload = self.loadInfo == null ? false : true;
      self.loadInfo = loadInfo;

      // The user has specified the URLs for the splice junctions (bed), and optionally,
      // the URLs for coverage (bigwig) and variants (vcf). If the user
      // provided the vcf URL, the user would have selected a sample name from a dropdown.
      // Create query parameters to capture this.
      let queryObject = {};
      ['bedURL', 'bedIndexURL', 'bigwigURL', 'alignmentURL', 'alignmentIndexURL',
       'vcfURL', 'tbiURL', 'sampleName', 'buildName']
      .forEach(function(param) {
        if (loadInfo[param]) {
          queryObject[param] = loadInfo[param];
        } else {
          delete queryObject[param]
        }
      })
      let urlPath = window.location.origin + "?" + qs.stringify(queryObject)
      window.history.pushState({},"", urlPath);

      if (reload) {
        self.$nextTick(function() {
          if (self.loadInfo.vcfURL && self.loadInfo.tbiURL) {
            self.onVcfURLEntered(self.loadInfo.vcfURL, self.loadInfo.tbiURL)
          } else {
            self.sampleNames = [];
            self.onVcfURLCleared();
          }
          self.onReinit();
        })
      }


    },
    onLoadDataFromURL: function(theLoadInfo) {
      let self = this;

      self.loadInfo = theLoadInfo;
      self.preLoadInfo = $.extend({}, theLoadInfo);
      self.$nextTick(function() {
        if (self.loadInfo.vcfURL && self.loadInfo.tbiURL) {
          self.onVcfURLEntered(self.loadInfo.vcfURL, self.loadInfo.tbiURL)
        } else {
          self.sampleNames = [];
          self.onVcfURLCleared();
        }
      })
    },
    onReinit: function() {
      let self = this;
      let geneNameToReload = self.selectedGene ? self.selectedGene.gene_name : null;
      self.selectedGene = null;
      self.searchedGene = null;
      self.spliceJunctionsForGene = null;
      self.selectedObject = null;
      if (self.$refs && self.$refs.ref_SpliceJunctionHome) {
        self.$refs.ref_SpliceJunctionHome.clearAndReload(geneNameToReload);
      }
      self.addAlert("info", "reloaded data")
    },
    onSpliceJunctionsLoaded: function(geneName, spliceJunctions, summary) {
      let self = this;
      if (geneName == self.selectedGene.gene_name) {
        self.spliceJunctionsForGene = spliceJunctions;
      }
    },
    onDonorReferenceSequenceLoaded: function(referenceSequenceData) {
      this.donorReferenceSequence = referenceSequenceData;
    },
    onAcceptorReferenceSequenceLoaded: function(referenceSequenceData) {
      this.acceptorReferenceSequence = referenceSequenceData;
    },
    onSetDonorSiteZoomFactor: function(factor) {
      this.donorSiteSeqRange = this.donorSiteSeqRange + factor;
      if (this.donorSiteSeqRange <= 0) {
        this.donorSiteSeqRange = 1;
      }
    },
    onSetAcceptorSiteZoomFactor: function(factor) {
      this.acceptorSiteSeqRange = this.acceptorSiteSeqRange + factor;
      if (this.acceptorSiteSeqRange <= 0) {
        this.acceptorSiteSeqRange = 1;
      }
    },
    onSetDonorSitePan: function(pan) {
      this.donorSitePan = this.donorSitePan + pan;
    },
    onSetAcceptorSitePan: function(pan) {
      this.acceptorSitePan = this.acceptorSitePan + pan;
    },
    onSampleNamesLoaded: function(sampleNames) {
      this.sampleNames = sampleNames;
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

        // Open notifications side panel if this is
        // the first time we have encountered a particular
        // error or warning.
        if (type == 'error' || type == 'warning') {
          this.onShowAlertPanel();
        }
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
    onShowLeftNavDrawer: function() {
      this.showLeftNavDrawer = true;
    },
    onCloseLeftNavDrawer: function() {
      this.showLeftNavDrawer = false;
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
        this.selectedObject = null;

      }

    },
    onObjectSelected: function(selectedObject) {
      this.selectedObject = selectedObject;

    },
    selectSpliceJunction: function(spliceJunction) {
      // this is called when the user clicked on a cryptic-site
      // splice junction in the genes panel. This should result in
      // the splice junction being selected in the main arc diagram
      if (this.$refs.ref_SpliceJunctionHome) {
        this.$refs.ref_SpliceJunctionHome.selectSpliceJunction(spliceJunction)
      }
    },
    onVcfURLEntered: function(vcfURL, tbiURL) {
      // This is called when the user enters a vcf URL and optionally a tbi URL.
      // Here we call a method on SpliceJunctionHome to indicate that
      // we are ready to read the VCF header to get the sample names
      if (this.$refs.ref_SpliceJunctionHome) {
        this.$refs.ref_SpliceJunctionHome.onVcfURLEntered(vcfURL, tbiURL)
      }
    },
    onVcfURLCleared: function() {
      if (this.$refs.ref_SpliceJunctionHome) {
        this.$refs.ref_SpliceJunctionHome.onVcfURLCleared()
      }
    }
  }


};
</script>


<style lang="sass">
@import './styles/variables.sass'

.v-app-bar
  background-color: $nav-color !important

#left-nav-drawer
  margin-left: 0px !important
  margin-right: 0px !important
  padding: 5px
  border: none


#legend-drawer-close-button
    position: absolute
    padding-right: 0px
    position: absolute
    right: 0px
    display: inline-block
    margin-left: 0px
    min-width: 22px
    margin-top: 0px
    top: 0px
    z-index: 1

h1, .h1
  font-size: 20px !important
  margin-top: 0px !important
  margin-bottom: 5px !important
  color: $link-color !important
  font-weight: 500 !important

h2, .h2
  font-size: 20px !important
  margin-top: 0px !important
  margin-bottom: 5px !important
  color: $link-color !important
  font-weight: 500 !important

h3, .h3
  font-size: 13px !important
  margin-top: 0px !important
  margin-bottom: 5px !important
  color: $link-color !important
  font-weight: 500 !important


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

.v-card {
  padding: 10px !important;
  font-size: 13px;
}
.v-card.app-card {
  margin-left:   5px !important;
  margin-right:  5px !important;
  margin-top:    0px !important;
  margin-bottom: 10px !important;
}

.v-input--center-affix .v-input__prepend, .v-input--center-affix .v-input__append {
  margin-right: 2px;
}
.v-switch .v-label {
  font-size: 13px;
  padding-top: 4px;
  padding-left: 6px;
}


.dropdown.open .dropdown-menu {
  max-height: 400px !important;
  overflow-y: scroll !important;
}

</style>
