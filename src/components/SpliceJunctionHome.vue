<template>

<div style="margin-left:5px;margin-right:5px;" class="d-flex flex-column mt-1">
  
    <GeneCard  v-if="selectedGene" class="full-width-card"
    :selectedGene="selectedGene"
     @gene-region-buffer-change="onGeneRegionBufferChange"/>

    <v-card  v-show="selectedGene" class="full-width-card" style="min-height: calc(100vh + 20px);">
        
        <SpliceJunctionViz 
        :loadInfo="loadInfo"
        :selectedGene="selectedGene"
        :genomeBuildHelper="genomeBuildHelper"
        :geneModel="geneModel"
        @reinit="$emit('reinit')"
        />

    </v-card>
    
      <v-snackbar
        v-model="snackbar"
        location="center"
        transition="fade-transition">
        {{ snackbarText }}

        <template v-slot:actions>
          <v-btn
            color="pink"
            variant="text"
            @click="snackbar = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>

</div>

</template>

<script>
import GenomeBuildHelper from '@/models/GenomeBuildHelper.js'
import GeneModel         from '@/models/GeneModel.js'

import GeneCard          from './GeneCard.vue'
import SpliceJunctionViz from './SpliceJunctionViz.vue'

  export default {
    name: 'SpliceJunctionHome',
    components: {
      GeneCard,
      SpliceJunctionViz
    },
    props: { 
      loadInfo: Object,
      genes: Array,
      genomeBuild: Array,
      searchedGene: Object,
      selectedGene: Object,
      alerts: Array,
      alertCounts: Object,
      geneToAlerts: Object
    },
    data: () => ({
      urlParams: null,
      launchedFromMosaic: null,
      geneModel: null,

      snackbar: false,
      snackbarText: "",
      snackbarTimeout: 5000


    }),
    created: function() {
      let self = this;
      self.init()
    },
    methods: {
      init: function() {
        let self = this;
        window.globalSpliceJunctionHome = self;


        if (localStorage.getItem('hub-iobio-tkn') && localStorage.getItem('hub-iobio-tkn').length > 0) {
          self.launchedFromMosaic = true;
        } else {
          self.launchedFromMosaic = false;
        }

        self.globalApp.initServices(self.launchedFromMosaic)

        self.urlParams = new URLSearchParams(window.location.search);

        self.genomeBuildHelper = new GenomeBuildHelper(self.globalApp, 
                                                       true, 
                                                       { DEFAULT_BUILD: 'GRCh38' });
        self.geneModel =         new GeneModel(self.globalApp, 
                                               self.genomeBuildHelper)
        self.geneModel.setAllKnownGenes(self.genes)
        self.geneModel.addEventListener("alertIssued", function(eventArgs) {
          let [type, message, genes, details] = eventArgs
          self.addAppAlert(type, message, genes, details)
        })
        self.$emit("gene-model-initialized", self.geneModel)

        self.addAppAlert('success', 'app initialized')


      },
      loadGene: function(geneName) {
        let self = this;
        self.geneModel.promiseAddGeneName(geneName)
        .then(function() {
          self.geneModel.promiseGetGeneObject(geneName)
          .then(function(theGeneObject) {
            self.geneModel.adjustGeneRegion(theGeneObject);
            self.geneRegionStart = theGeneObject.start;
            self.geneRegionEnd   = theGeneObject.end;
            self.$emit("gene-selected", theGeneObject)    

            if (self.loadInfo == null) {
              self.snackbarText = "Click on 'Load data' to continue."
              self.snackbar = true;
            }
          })
        })
        .catch(function(error) {
          console.log("Unable to add gene")
          console.log(error)
        })
      },
      addAppAlert: function(type, message, genes, details) {
        this.$emit("add-alert", type, message, genes, details)
      },
      onGeneRegionBufferChange: function(theGeneRegionBuffer) {
        let self = this;
        self.geneModel.geneRegionBuffer = theGeneRegionBuffer;
        self.geneModel.adjustGeneRegion(self.selectedGene);
      },
      clearAndReload: function(geneNameToLoad) {
        let self = this;
        self.geneModel.clearAllGenes();
        if (geneNameToLoad) {
          self.loadGene(geneNameToLoad);
        }
      }
    },
    watch: {
      searchedGene: function() {
        let self = this;
        if (self.searchedGene) {
          self.loadGene(self.searchedGene.gene_name);
        }
      },
      loadInfo: function() {
        let self = this;
        if (self.loadInfo != null && self.searchedGene == null) {
          self.snackbarText = "Type in a gene name to display splice junctions."
          self.snackbar = true;
        }
      }
    }
  }
</script>
