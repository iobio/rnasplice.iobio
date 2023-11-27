<template>

<div style="margin-left:5px;margin-right:5px;" class="d-flex flex-column mt-1">
  
    <GeneCard  v-if="selectedGene" class="full-width-card"
    :selectedGene="selectedGene"
    :geneModel="geneModel"
     @gene-region-buffer-change="onGeneRegionBufferChange"
     @reinit="$emit('reinit')"/>

    <v-card  v-show="selectedGene" class="full-width-card" style="padding-top:0px !important;min-height: calc(100vh + 20px);">
        <v-tabs density="compact"
          v-model="tab" 
          align-tabs="center" class="mb-2"
        >
          <v-tab  color="#376daf" style="font-weight: 600" value="tab-1">IGV</v-tab>
          <v-tab  color="#376daf" style="font-weight: 600"  value="tab-2">Custom Data Viz</v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item value="tab-1">

            <SpliceJunctionViz 
            :loadInfo="loadInfo"
            :tab="tab"
            :selectedGene="selectedGene"
            :geneSource="geneModel.geneSource"
            :genomeBuildHelper="genomeBuildHelper"
            :geneModel="geneModel"
            @reinit="$emit('reinit')"
            />
         
          </v-window-item>
            
          <v-window-item value="tab-2" eager>

            <SpliceJunctionD3 
            ref="ref_SpliceJunctionD3"
            :selectedGene="selectedGene" 
            :genomeBuildHelper="genomeBuildHelper"
            :geneModel="geneModel"
            :geneSource="geneModel.geneSource"
            :spliceJunctionsForGene="spliceJunctionsForGene"
            :tab="tab"
            :loadInProgress="loadInProgress"
            :junctionSiteSeqRange="junctionSiteSeqRange"
            @reinit="$emit('reinit')"
            @object-selected="onObjectSelected"
            @transcript-selected="onTranscriptSelected"
            @splice-junction-selected="onSpliceJunctionSelected"
            @set-site-zoom-factor="onSetSiteZoomFactor"/>

          </v-window-item>
        </v-window>      
       
    </v-card>
    
      <v-snackbar
        v-model="snackbar"
        location="center"
        :timeout="snackbarTimeout"
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
import Endpoint          from '@/models/Endpoint.js'

import GeneCard          from './GeneCard.vue'
import SpliceJunctionViz from './SpliceJunctionViz.vue'
import SpliceJunctionD3  from './SpliceJunctionD3.vue'

  export default {
    name: 'SpliceJunctionHome',
    components: {
      GeneCard,
      SpliceJunctionViz,
      SpliceJunctionD3
    },
    props: { 
      loadInfo: Object,
      genes: Array,
      genomeBuild: Array,

      
      searchedGene: Object,
      selectedGene: Object,
      spliceJunctionsForGene: Object,


      alerts: Array,
      alertCounts: Object,
      geneToAlerts: Object,

      junctionSiteSeqRange: Number
    },
    data: () => ({
      urlParams: null,
      launchedFromMosaic: null,
      geneModel: null,
      endpoint: null,
      loadInProgress: false,

      snackbar: false,
      snackbarText: "",
      snackbarTimeout: 3000,

      tab: 'tab-2',

      selectedTranscript: null


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

        this.endpoint = new Endpoint(self.globalApp, self.genomeBuildHelper)

       

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
      onSetSiteZoomFactor: function(factor) {
        this.$emit("set-site-zoom-factor", factor)
      },
      clearAndReload: function(geneNameToLoad) {
        let self = this;

        let geneNames = [];
        if (self.geneModel.sortedGeneNames) {
          geneNames = self.geneModel.sortedGeneNames.filter(function(geneName) {
            return geneNameToLoad == null || geneName != geneNameToLoad;
          });
        }
        
        self.geneModel.clearAllGenes();
        geneNames.forEach(function(geneName) {
          self.loadGene(geneName);
        })

        if (geneNameToLoad) {
          self.loadGene(geneNameToLoad);
        }
      },
      getSpliceJunctionRecords: function() {
        let self = this;
        let spliceJunctionRecords = self.geneModel.geneToSpliceJunctionRecords[self.selectedGene.gene_name];
        if (spliceJunctionRecords && spliceJunctionRecords.length > 0) {
          let spliceJunctions  = {'gene': self.selectedGene.gene_name, 
                                  'spliceJunctions': spliceJunctionRecords}
          self.$emit('splice-junctions-loaded', spliceJunctions)
        } else {
          self.loadInProgress = true;
          let region = {'refName': self.selectedGene.chr, 
                         'start':   self.selectedGene.start,
                         'end':     self.selectedGene.end };
          self.endpoint.promiseGetBedRegion(self.loadInfo.bedURL, 
                                            self.loadInfo.bedIndexURL, 
                                            region)
          .then(function(spliceJunctionRecords) {
            self.loadInProgess = false;
            self.geneModel.geneToSpliceJunctionRecords[self.selectedGene.gene_name] = spliceJunctionRecords;
            let spliceJunctions  = {'gene': self.selectedGene.gene_name, 
                                    'spliceJunctions': spliceJunctionRecords}
            self.$emit('splice-junctions-loaded', spliceJunctions, )
          })
          .catch(function(error) {
            self.loadInProgress = false;
            self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
          })

        }

      },
      onSpliceJunctionSelected: function(spliceJunction) {
        let self = this;
        let promises = [];
        let p = self.promiseGetReferenceSequence('donor', 
          self.selectedGene.chr, 
          spliceJunction.donor.pos - self.junctionSiteSeqRange, 
          spliceJunction.donor.pos + self.junctionSiteSeqRange)
        .then(function(sequenceData) {
          self.donorReferenceSequence = sequenceData;
        })
        promises.push(p)
        p = self.promiseGetReferenceSequence('acceptor', 
          self.selectedGene.chr, 
          spliceJunction.acceptor.pos - self.junctionSiteSeqRange, 
          spliceJunction.acceptor.pos + self.junctionSiteSeqRange)
        .then(function(sequenceData) {
          self.acceptorReferenceSequence = sequenceData;
        })

        promises.push(p)
        Promise.all(promises)
        .then(function() {
          if (self.$refs.ref_SpliceJunctionD3) {
            self.$refs.ref_SpliceJunctionD3.drawSiteSequences(self.donorReferenceSequence, 
              self.acceptorReferenceSequence)
          }
        })
        .catch(function(error) {

        })


      },
      promiseGetReferenceSequence: function(junctionEnd, refName, start, end) {
        let self = this;
        return new Promise(function(resolve, reject) {
          self.loadInProgress = true;
          let region = {'refName': refName, 
                         'start':  start,
                         'end':    end };
          self.endpoint.promiseGetReferenceSequence(refName, 
                                                    region)
          .then(function(fastaRecords) {
            self.loadInProgess = false;
            let sequence  = fastaRecords.length > 1 ? fastaRecords[1] : "";
            resolve(sequence)
          })
          .catch(function(error) {
            self.loadInProgress = false;
            self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
            reject(error)
          })

        })
      },
      onObjectSelected: function(selectedObject) {
        this.$emit('object-selected', selectedObject)
      },
      onTranscriptSelected: function(transcript) {
        this.selectedTranscript = transcript;
      },

      selectSpliceJunction: function(spliceJunction) {
        // this is called when the user clicked on a non-canonical
        // splice junction in the genes panel. This should result in
        // the splice junction being selected in the main arc diagram
        if (this.$refs.ref_SpliceJunctionD3) {
          this.$refs.ref_SpliceJunctionD3.selectSpliceJunction(spliceJunction)
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

        if (self.loadInfo != null ) {
          self.snackbarText = "Type in a gene name to display splice junctions."
          self.snackbar = true;
        }

      },
      selectedTranscript: function() {
        let self = this;
        if (self.loadInfo && self.selectedGene) {
          self.getSpliceJunctionRecords()
        }
      }
    }

  }
</script>
