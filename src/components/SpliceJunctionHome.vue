<template>

<div style="margin-left:5px;margin-right:5px;" class="d-flex flex-column mt-1">
    <div class="tooltip"></div>

    <GeneCard  v-show="selectedGene" class="full-width-card"
    :selectedGene="selectedGene"
    :geneModel="geneModel"
     @gene-region-buffer-change="onGeneRegionBufferChange"
     @reinit="$emit('reinit')"
     @show-igv="onShowIGV"/>

    <v-card  v-show="selectedGene" class="full-width-card" style="padding-top:0px !important;min-height: calc(100vh + 20px);">

            <SpliceJunctionD3 
            ref="ref_SpliceJunctionD3"
            :selectedGene="selectedGene" 
            :genomeBuildHelper="genomeBuildHelper"
            :geneModel="geneModel"
            :geneSource="geneModel.geneSource"
            :spliceJunctionsForGene="spliceJunctionsForGene"
            :variants="variants"
            :tab="tab"
            :loadInProgress="loadInProgress"
            :junctionSiteSeqRange="junctionSiteSeqRange"
            :variantHeight="variantHeight"
            :variantWidth="variantWidth"
            :vcf="vcf"
            @reinit="$emit('reinit')"
            @object-selected="onObjectSelected"
            @transcript-selected="onTranscriptSelected"
            @splice-junction-selected="onSpliceJunctionSelected"
            @set-site-zoom-factor="onSetSiteZoomFactor"/>

       
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

<v-dialog v-model="showIGVPopup" persistent fullscreen >
  <v-card class="full-width">
    <div style="margin-right: 5px">
      <v-btn variant="tonal" color="#094792" size="large" 
      style="float:right;margin-bottom:10px;" @click="onShowIGV(false)">Close</v-btn>
    </div>
    <SpliceJunctionViz 
    ref="ref_SpliceJunctionViz"
    :loadInfo="loadInfo"
    :tab="tab"
    :showIGVPopup="showIGVPopup"
    :selectedGene="selectedGene"
    :geneSource="geneModel.geneSource"
    :genomeBuildHelper="genomeBuildHelper"
    :geneModel="geneModel"
    @reinit="$emit('reinit')"
    />
  </v-card>
</v-dialog>

</div>

</template>

<script>
import GenomeBuildHelper from '@/models/GenomeBuildHelper.js'
import GeneModel         from '@/models/GeneModel.js'
import Endpoint          from '@/models/Endpoint.js'
import Vcf               from '@/models/Vcf.js'

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

      junctionSiteSeqRange: Number,

    },
    data: () => ({
      urlParams: null,
      launchedFromMosaic: null,
      geneModel: null,
      vcf: null,
      endpoint: null,
      loadInProgress: false,

      sampleNames: null,

      snackbar: false,
      snackbarText: "",
      snackbarTimeout: 3000,

      tab: 'tab-2',

      selectedTranscript: null,

      showIGVPopup: false,

      geneRegionStart: null,
      geneRegionEnd: null,

      variants: null,

      variantHeight: 8,
      variantWidth:  8


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

        self.endpoint = new Endpoint(self.globalApp, self.genomeBuildHelper)

        self.vcf = new Vcf(self.globalApp)
        self.vcf.setEndpoint(self.endpoint)
        self.vcf.setGenomeBuildHelper(self.genomeBuildHelper)
        
       

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
          .then(function(bedRecords) {
            self.loadInProgess = false;
            let spliceJunctions = self.geneModel.createSpliceJunctions(bedRecords, self.selectedGene, self.selectedTranscript);
            let summary = self.geneModel.geneToSpliceJunctionSummary[self.selectedGene.gene_name]


            //self.geneModel.geneToSpliceJunctionRecords[self.selectedGene.gene_name] = spliceJunctionRecords;
            //let spliceJunctions  = {'gene': self.selectedGene.gene_name, 
             //                       'spliceJunctions': spliceJunctions}
            self.$emit('splice-junctions-loaded', self.selectedGene.gene_name, spliceJunctions, summary)
          })
          .catch(function(error) {
            self.loadInProgress = false;
            self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
          })

        }

      },
      promiseGetVariants: function() {
        let self = this;

        self.variants = [];

        if (self.vcf.getVcfURL() == null) {
          return;
        }

        let regions = [];
        regions.push({'name': self.selectedGene.chr, 'start': self.selectedGene.start, 'end': self.selectedGene.end})        
        let isMultiSample = true;
        let samplesToRetrieve = [{'vcfSampleName': self.loadInfo.sampleName, 
                                  'sampleName': self.loadInfo.sampleName}]

        self.vcf.promiseGetVariants(self.selectedGene.chr, self.selectedGene, self.selectedTranscript, regions,isMultiSample, samplesToRetrieve)
        .then(function(data) {
          let width = self.$el.offsetWidth - 420;
          let variants = data.results[0].features
          self.vcf.pileupVariants(variants, self.geneRegionStart, self.geneRegionEnd, width)
          self.variants = variants;
          console.log(self.variants)
        })
        .catch(function(error) {
          console.log(error)
        })
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

          let donorVariants = null;
          let acceptorVariants = null;
          if (self.variants) {
            donorVariants = self.variants.filter(function(d) {
              return d.start >= spliceJunction.donor.pos - self.junctionSiteSeqRange && 
                     d.start <= spliceJunction.donor.pos + self.junctionSiteSeqRange
            })
            acceptorVariants = self.variants.filter(function(d) {
              return d.start >= spliceJunction.acceptor.pos - self.junctionSiteSeqRange && 
                     d.start <= spliceJunction.acceptor.pos + self.junctionSiteSeqRange
            })

          }
          if (self.$refs.ref_SpliceJunctionD3) {
            self.$refs.ref_SpliceJunctionD3.drawAcceptorAndDonorSites(self.donorReferenceSequence, 
              self.acceptorReferenceSequence, donorVariants, acceptorVariants)
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
      },
      onShowIGV: function(show) {
        this.showIGVPopup = show;
      },
      onVcfURLEntered: function(vcfURL, tbiURL) {
        let self = this;
        self.vcf.promiseOpenVcfUrl(vcfURL, tbiURL)
        .then(function() {
          self.vcf.promiseGetSampleNames()
          .then(function(sampleNames) {
            self.sampleNames = sampleNames;
            self.$emit('sample-names-loaded', self.sampleNames)
          })

        })


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
          self.promiseGetVariants()
        }
      },
      showIGV: function() {
        this.showIGVPopup = this.showIGV;
      }
    }

  }
</script>
