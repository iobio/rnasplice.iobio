<template>

<div v-if="geneModel && genomeBuildHelper" style="margin-left:5px;margin-right:5px;" class="d-flex flex-column mt-1">
    <div class="tooltip"></div>

    <GeneCard  v-show="selectedGene" class="full-width-card"
    :selectedGene="selectedGene"
    :geneModel="geneModel"
     @reinit="$emit('reinit')"/>

    <v-card  v-show="selectedGene" class="full-width-card" style="padding-top:0px !important;min-height: calc(100vh + 20px);">

            <SpliceJunctionD3
            ref="ref_SpliceJunctionD3"
            :selectedGene="selectedGene"
            :geneStart="geneStart"
            :geneEnd="geneEnd"
            :genomeBuildHelper="genomeBuildHelper"
            :geneModel="geneModel"
            :geneSource="geneModel.geneSource"
            :spliceJunctionsForGene="spliceJunctionsForGene"
            :variants="variants"
            :tab="tab"
            :loadInProgress="loadInProgress"
            :donorSiteSeqRange="donorSiteSeqRange"
            :acceptorSiteSeqRange="acceptorSiteSeqRange"
            :donorSitePan="donorSitePan"
            :acceptorSitePan="acceptorSitePan"
            :variantHeight="variantHeight"
            :variantWidth="variantWidth"
            :vcf="vcf"
            :covData="covData"
            @reinit="$emit('reinit')"
            @object-selected="onObjectSelected"
            @transcript-selected="onTranscriptSelected"
            @splice-junction-selected="onSpliceJunctionSelected"
            @set-donor-site-zoom-factor="onSetDonorSiteZoomFactor"
            @set-acceptor-site-zoom-factor="onSetAcceptorSiteZoomFactor"
            @set-donor-site-pan="onSetDonorSitePan"
            @set-acceptor-site-pan="onSetAcceptorSitePan"
            @reset-donor-site-pan="$emit('reset-donor-site-pan')"
            @reset-acceptor-site-pan="$emit('reset-acceptor-site-pan')"
            @show-legend="$emit('show-legend')"/>


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
import MosaicSession     from '@/models/MosaicSession.js'

import GeneCard          from './GeneCard.vue'
import SpliceJunctionViz from './SpliceJunctionViz.vue'
import SpliceJunctionD3  from './SpliceJunctionD3.vue'
import { reject } from 'async'

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

      donorSiteSeqRange: Number,
      acceptorSiteSeqRange: Number,
      donorSitePan: Number,
      acceptorSitePan: Number,

    },
    data: () => ({
      urlParams: null,

      launchedFromMosaic: null,
      mosaicSession: null,
      user: null,
      geneSet: null,
      project: null,

      genomeBuildHelper: null,

      geneModel: null,
      vcf: null,
      endpoint: null,
      loadInProgress: false,

      sampleNames: [],

      snackbar: false,
      snackbarText: "",
      snackbarTimeout: 3000,

      tab: 'tab-2',

      selectedTranscript: null,

      showIGVPopup: false,

      geneRegionStart: null,
      geneRegionEnd: null,

      geneStart: null,
      geneEnd: null,

      variants: null,

      variantHeight: 8,
      variantWidth:  8,

      stripChrForBed: false,
      stripChrForBigWig: false,
      covData: []


    }),
    created: function() {
      let self = this;
      self.init()
    },
    methods: {
      init: function() {
        let self = this;
        window.globalSpliceJunctionHome = self;

        self.loadURLParameters();

        if (localStorage.getItem('hub-iobio-tkn') && localStorage.getItem('hub-iobio-tkn').length > 0) {
          self.launchedFromMosaic = true;
        }

        self.globalApp.initServices(self.launchedFromMosaic)

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

        if (localStorage.getItem('hub-iobio-tkn') && localStorage.getItem('hub-iobio-tkn').length > 0) {
          self.promiseInitMosaicSession()
          .then(function(loadInfo) {
            if (self.project) {
              self.addAppAlert("info", "initialized session from Mosaic project " + self.project.name)
            }
            self.$emit('load-data-from-mosaic', loadInfo)
          })
        }
      },

      promiseInitMosaicSession: function() {
        let self = this;
        return new Promise(function(resolve, reject) {
          let loadInfo = null;

          self.mosaicSession =  new MosaicSession(self.urlParams.get('client_application_id'));
          self.mosaicSession.globalApp = self.globalApp;
          self.mosaicSession.promiseInit(
            self.urlParams.get('sample_id'),
            self.urlParams.get('source'),
            self.urlParams.get('project_id'),
            self.urlParams.get('gene_set_id'),
            self.urlParams.get('experiment_id'),
            self.urlParams.get('build')
          )
          .then(data => {
            self.geneSet = data.geneSet;
            self.user = data.user;
            loadInfo = data.loadInfo;

            let genes = [];
            let genesString = self.urlParams.get('genes')
            if (genesString && genesString.length > 0) {
              genes = genesString.split(",");
              if (genes.length === 1 && genes[0] === "") {
                genes = [];
              }
            }
            if (self.geneSet && self.geneSet.genes && self.geneSet.genes.length > 0) {
              self.addAppAlert("info", 'loading gene set <pre>' + self.geneSet.name + "</pre>")
              self.geneSet.genes.forEach(function(gene) {
                genes.push(gene);
              })
            }
            loadInfo.genes = genes;
            let promises = []
            if (genes && genes.length > 0) {
              genes.forEach(function(geneName){
                if (self.geneModel.isKnownGene(geneName)) {
                  let p = self.geneModel.promiseAddGeneName(geneName)
                  promises.push(p)
                } else {
                  self.addAppAlert("warn", "Bypassing unknown gene <pre>" + geneName + "</pre>.")
                }
              })
              return Promise.all(promises)
            } else {
              return Promise.resolve();
            }
          })
          .then(function() {
            self.projectId = self.urlParams.get('project_id')
            if (self.projectId && self.projectId != "") {
              return self.mosaicSession.promiseGetProject(self.projectId)
            } else {
              throw Error('Mosaic project id missing from URL parameters')
            }
          })
          .then(project => {
            self.project = project;
            loadInfo.project = project;
            resolve(loadInfo);
          })
          .catch(function (error) {
            self.addAppAlert('error', 'Unable to intialize Mosaic session', null, [error])
            reject(error)
          })
        })
      },

      loadURLParameters: function() {
        let self = this;
        self.urlParams = new URLSearchParams(window.location.search);

        let theLoadInfo = {};
        ['bedURL', 'bedIndexURL', 'bigwigURL', 'vcfURL', 'tbiURL',
         'alignmentURL', 'alignmentIndexURL', 'sampleName', 'buildName']
        .forEach(function(param) {
          if (self.urlParams.has(param)) {
            theLoadInfo[param] = self.urlParams.get(param)
          }
        })
        if (theLoadInfo.bedURL) {
          self.$emit('load-data-from-url-params', theLoadInfo)
        }

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

      setGeneRegion: function() {
        let self = this;

        // In cases where splice junctions have a donor or acceptor site in the
        // gene region but extend beyone that gene region for the other end of the
        // junction, we need to extend the gene region so that these splice junctions
        // are visible and selectable in the diagrams.
        if (self.spliceJunctionsForGene) {
          self.spliceJunctionsForGene.forEach(function(junction) {
            if (junction.strand == null || junction.strand == "" || self.selectedGene.start == junction.strand ) {
              if (junction.donor.pos < self.selectedGene.start) {
                self.selectedGene.start = junction.donor.pos - 100;
              }
              if (junction.acceptor.pos < self.selectedGene.start) {
                self.selectedGene.start = junction.acceptor.pos - 100;
              }
              if (junction.donor.pos > self.selectedGene.end) {
                self.selectedGene.end = junction.donor.pos + 100;
              }
              if (junction.acceptor.pos > self.selectedGene.end) {
                self.selectedGene.end = junction.acceptor.pos + 100;
              }

            }
          })
        }
        self.geneStart = self.selectedGene.start;
        self.geneEnd   = self.selectedGene.end;
      },

      addAppAlert: function(type, message, genes, details) {
        this.$emit("add-alert", type, message, genes, details)
      },
      onSetDonorSiteZoomFactor: function(factor) {
        this.$emit("set-donor-site-zoom-factor", factor)
      },
      onSetAcceptorSiteZoomFactor: function(factor) {
        this.$emit("set-acceptor-site-zoom-factor", factor)
      },
      onSetDonorSitePan: function(factor) {
        this.$emit("set-donor-site-pan", factor)
      },
      onSetAcceptorSitePan: function(factor) {
        this.$emit("set-acceptor-site-pan", factor)
      },
      clearAndReload: function(geneNameToLoad) {
        let self = this;

        self.variants = null;

        if (self.$refs.ref_SpliceJunctionD3) {
          self.$refs.ref_SpliceJunctionD3.clearAndReload();
        }

        let geneNames = [];
        if (self.geneModel.sortedGeneNames) {
          self.geneModel.sortedGeneNames.forEach(function(geneName) {
            geneNames.push(geneName)
          });
        }

        self.geneModel.clearAllGenes();
        let promises = [];
        geneNames.forEach(function(geneName) {
          let p = self.geneModel.promiseAddGeneName(geneName);
          promises.push(p)
        })
        Promise.all(promises)
        .then(function(){
          if (geneNameToLoad) {
            self.loadGene(geneNameToLoad);
          }
        })


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

          // We have encountered the empty results on a previous request, so we know
          // that we need to strip 'chr' from reference
          let chr = self.selectedGene.chr;
          if (self.selectedGene.chr.indexOf('chr') == 0 && self.stripChrForBed) {
            chr = self.selectedGene.chr.split("chr")[1]
          }
          let region = {'refName':  chr,
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
            if (error && error.message && error.message == 'No data returned from backend service bedRegion') {
              self.loadInProgress = true;
              // strip chr
              let chr = self.selectedGene.chr.split("chr")[1]
              let region = {'refName': chr,
                             'start':   self.selectedGene.start,
                             'end':     self.selectedGene.end };
              self.endpoint.promiseGetBedRegion(self.loadInfo.bedURL,
                                                self.loadInfo.bedIndexURL,
                                                region)
              .then(function(bedRecords) {
                self.loadInProgess = false;
                self.stripChrForBed = true;
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

            } else {
              self.loadInProgress = false;
              self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
            }
          })


        }

      },
      promiseGetVariants: function() {
        let self = this;

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
          spliceJunction.donor.pos - self.donorSiteSeqRange + self.donorSitePan,
          spliceJunction.donor.pos + self.donorSiteSeqRange + self.donorSitePan)
        .then(function(sequenceData) {
          self.donorReferenceSequence = sequenceData;
        })
        promises.push(p)
        p = self.promiseGetReferenceSequence('acceptor',
          self.selectedGene.chr,
          spliceJunction.acceptor.pos - self.acceptorSiteSeqRange + self.acceptorSitePan,
          spliceJunction.acceptor.pos + self.acceptorSiteSeqRange + self.acceptorSitePan)
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
              return d.start >= spliceJunction.donor.pos - self.donorSiteSeqRange + self.donorSitePan &&
                     d.start <= spliceJunction.donor.pos + self.donorSiteSeqRange + self.donorSitePan
            })
            acceptorVariants = self.variants.filter(function(d) {
              return d.start >= spliceJunction.acceptor.pos - self.acceptorSiteSeqRange + self.acceptorSitePan &&
                     d.start <= spliceJunction.acceptor.pos + self.acceptorSiteSeqRange + self.acceptorSitePan
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
        // this is called when the user clicked on a cryptic-site
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
        self.sampleNames = [];
        self.vcf.promiseOpenVcfUrl(vcfURL, tbiURL)
        .then(function() {
          self.vcf.promiseGetSampleNames()
          .then(function(sampleNames) {
            self.sampleNames = sampleNames;
            self.$emit('sample-names-loaded', self.sampleNames)
          })
          .catch(function(error) {
            self.addAppAlert('warning', 'Unable to get samples from VCF URL', null, [error])
          })

        })
        .catch(function(error) {
          self.addAppAlert('warning', 'Unable to read VCF URL', null, [error])
        })


      },
      onVcfURLCleared: function() {
        this.vcf.clearVcfURL();
      },
      getCoverage() {
        let self = this;

        let chr = self.selectedGene.chr;
        if (self.selectedGene.chr.indexOf('chr') == 0 && self.stripChrForBigWig) {
          chr = self.selectedGene.chr.split("chr")[1]
        }

        self.endpoint.promiseGetBigWigCoverage(self.loadInfo.bigwigURL,
                                              chr,
                                              self.selectedGene.start,
                                              self.selectedGene.end)
        .then(function(covData) {
          self.covData = covData;
          //self.$emit('coverage-loaded', self.selectedGene.gene_name, covData.coverageForRegion)
        })
        .catch(function(error) {
          if (error && error.message && error.message == 'No data returned from backend service bigWigDepther') {
            // strip chr
            let chr = self.selectedGene.chr.split("chr")[1]
            self.endpoint.promiseGetBigWigCoverage(self.loadInfo.bigwigURL,
                                            chr,
                                            self.selectedGene.start,
                                            self.selectedGene.end)
            .then(function(covData) {
              self.covData = covData;
              self.stripChrForBigWig = true;
              //self.$emit('coverage-loaded', self.selectedGene.gene_name, covData.coverageForRegion)
            })
            .catch(function(error) {
              self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
            })

          } else {
            self.$emit("add-alert", 'error', error.message, self.selectedGene.gene_name, error.details ? [error.details] : null)
          }
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
      spliceJunctionsForGene: function() {
        let self = this;
        if (self.spliceJunctionsForGene && self.selectedGene) {

          // We need to extend the gene region to emcompass the splice junctions with an end in the
          // gene region, but with the other end extending beyond the gene region.
          self.setGeneRegion()

          // Now that the gene region is established, we can get the coverage data from the bigwig
          // and the variants from the vcf.
          self.getCoverage();
          self.promiseGetVariants();
        }
      },
      loadInfo: function() {
        let self = this;

        if (self.loadInfo != null &&
           (self.geneModel.sortedGeneNames == null || self.geneModel.sortedGeneNames.length == 0) ) {

          self.snackbarText = "Type in a gene name to display splice junctions."
          self.snackbar = true;
        }

      },
      selectedTranscript: function() {
        let self = this;
        if (self.loadInfo && self.selectedGene) {
          self.covData = [];
          self.variants = [];

          self.getSpliceJunctionRecords();
        }
      },
      showIGV: function() {
        this.showIGVPopup = this.showIGV;
      }
    }

  }
</script>
