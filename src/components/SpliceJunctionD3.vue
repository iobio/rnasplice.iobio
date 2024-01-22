<template>

<div style="padding-top:10px;padding-bottom: 10px">
	<div class="text-center" v-if="showLoading">
    <v-progress-circular v-if="showLoading"
      indeterminate
      color="primary"
    ></v-progress-circular>
  </div>

      <div id="panel-heading" class="d-flex flex-row align-start flex-wrap mb-1" >
          <h2 class="mr-5" style="margin-top: 0px !important;margin-bottom: 0px !important;min-width: 150px;">
            Splice Junctions
          </h2>

          <div style="width:155px" class="">
            <v-select 
              v-model="colorBy"
              hide-details="auto"
              label="Color by"
              density="compact"
              :items="colorByItems"
            ></v-select>
          </div>

          <div id="arc-color-legend">
          </div>

          <div id="label-cb" class="" style="" >
						<v-checkbox 
						  hide-details="true"
              density="compact"
				      v-model="showLabels"
				      label="Show read count labels"
				    ></v-checkbox>
			    </div>

      </div>

      <div class="d-flex flex-wrap" style="margin-left:0px;margin-top:10px;margin-bottom:10px;justify-content:flex-start">
          <div>
            <h3>Read counts</h3>
            <div class="d-flex">
              <div style="width:80px"  >
                <v-text-field
                density="compact"
                hide-details="auto"
                label="Min"
                v-model="minUniquelyMappedReads"/>
              </div>
              <div style="width:80px" class="ml-2 mr-5" >
                <v-text-field
                density="compact"
                hide-details="auto"
                label="Max"
                v-model="maxUniquelyMappedReads"/>
              </div>
            </div>
          </div>

          <div  v-show="!showLoading && selectedGene">
            <div v-if="readCountRange == null" class="hint-box">
              <v-icon>mdi-select-drag</v-icon>
              <div>Drag to zoom into histogram region</div>
            </div>
            <div v-if="readCountRange != null" class="hint-box">
              <v-icon>mdi-restore</v-icon>
              <div>Click outside selection to restore</div>
            </div>
            <div id="all-histogram" class="d-flex ml-1 mt-1">
              <div id="read-count-histogram" style="margin-left: 0px">
              </div>
            </div>
          </div>



          <div class="d-flex flex-column">


            <div class="d-flex justify-center">

             <v-btn-toggle id="hist-button-group"
                v-show="!showLoading && selectedGene"
                v-model="scaleYHist"
                color="primary"
                mandatory divided
                variant="elevated"

              >
                <v-btn density="compact" value="normal">Normal</v-btn>
                <v-btn density="compact" value="log">Log</v-btn>
                <v-btn density="compact" value="density">Density</v-btn>
              </v-btn-toggle>
            </div>

            <div class="d-flex">
              <div id="canonical-histogram" class="d-flex ml-1">
                <div id="read-count-histogram" style="margin-left: 0px">
                </div>
              </div>

              <div id="exon-skipping-histogram" class="d-flex ml-1">
                <div id="read-count-histogram" style="margin-left: 0px">
                </div>
              </div>

              <div id="cryptic-site-histogram" class="d-flex ml-1">
                <div id="read-count-histogram" style="margin-left: 0px">
                </div>
              </div>
            </div>
          </div>
      </div>

	<div id="diagrams">
	  <div  class="d-flex flex-column align-start">
      <div v-if="!showLoading && selectedGene" style="margin-top:-30px;margin:auto">
          <div v-if="!regionIsSelected" class="hint-box">
            <v-icon>mdi-select-drag</v-icon>
            <div>Drag to zoom into gene region</div>
          </div>
          <div v-if="regionIsSelected" class="hint-box">
            <v-icon>mdi-restore</v-icon>
            <div>Click outside selection to restore</div>
          </div>
      </div>      
	    <div id="brushable-axis">
	      <svg/>
	    </div>
    </div>

    <div id="variant-diagram"  style="margin-top: -10px">      
      <svg/>
    </div>

	  <div id="arc-diagram" class="hide-labels" style="margin-top:-7px">
	  </div>

    <div id="selected-transcript-panel" v-show="showTranscriptMenu" style="margin-top:-7px">

		  <div id="transcript-diagram" >
		    <svg/>
		  </div>
	  </div>
	  <div class="d-flex"  style="margin-top:-70px">
      <v-spacer/>
      <v-btn variant="tonal"  id="transcript-menu-button" style="margin-left:10px;" 
            icon="mdi-dots-vertical" color="#094792" density="compact">

          </v-btn>
        <v-menu eager bottom activator="#transcript-menu-button">
           
           <v-list id="list-for-transcript-menu" style="margin-right:20px">
            <v-list-item>
              <div id="transcript-menu-panel">
                <div id="transcript-menu-diagram" class="multiple" style="margin-right:0px;">
                  <svg/>
                </div>
              </div>
            </v-list-item>
           </v-list>
        
        </v-menu>
    </div>
    <div class="d-flex" style="margin-top:10px;" v-if="selectedTranscript">
      <v-spacer/>
      <h3 style="font-size:14px !important">
        {{ selectedTranscript.transcript_id}} {{ selectedTranscript.is_mane_select ? `MANE SELECT` : `` }} 
      </h3>
    </div>
	  
	  


	</div>

	<div id="zoomed-diagrams"  style="margin-top:20px;z-index:1000;border-top: solid 4px #e7e7e7">
    <h2 v-if="clickedObject || regionIsSelected" style="margin-bottom:20px !important;margin-top:10px !important">Selected Region</h2>
    <div id="variant-diagram">
      <svg/>
    </div>
    <div id="arc-diagram" class="hide-labels">
	    <svg/>
	  </div>
	  <div id="transcript-diagram">
	    <svg/>
	  </div>

	</div>

 
 <div class="d-flex" v-if="showDonorPanel || showAcceptorPanel" style="justify-content: center;padding:10px;border-top: solid 4px #e7e7e7;margin-top:20px">
   <v-btn class="zoom-button" @click="zoomOutSite" density="compact" size="medium" variant="tonal" color="#094792" >Zoom out
          </v-btn>
  <v-btn class="zoom-button" @click="zoomInSite" density="compact" size="medium" variant="tonal" color="#094792" >Zoom in
  </v-btn>
 </div>

 <div id="site-diagrams" class="d-flex plus" 
   v-if="selectedGene && selectedGene.strand == '+'" >
  	<div class="donor-site" v-if="showDonorPanel" style="width:50%">
      <div class="d-flex" style="justify-content:center;margin-bottom: 20px !important;margin-top:-34px" >
  		  <h2 >Donor site</h2>
      </div>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  	<div class="acceptor-site" v-if="showAcceptorPanel">
      <div class="d-flex" style="justify-content:center;margin-bottom: 20px !important;margin-top:-34px" >
        <h2 >Acceptor site</h2>
      </div>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  </div>
  <div id="site-diagrams" class="d-flex minus" v-if="selectedGene && selectedGene.strand == '-'" >
  	<div class="acceptor-site" v-if="showAcceptorPanel" style="width:50%">
	  	<div class="d-flex" style="justify-content:center;margin-bottom: 20px !important;margin-top:-34px" >
        <h2 >Acceptor site</h2>
      </div>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  	<div class="donor-site" style="width:50%" v-if="showDonorPanel" >
  		<div class="d-flex" style="justify-content:center;margin-bottom: 20px !important;margin-top:-34px" >
        <h2 >Donor site</h2>
      </div>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  </div>

  <v-snackbar
      v-model="snackbarShow"
      location="top"
      multi-line
      timeout="4000"
  >
    {{ snackbarText }}

    <template v-slot:actions>
      <v-btn
        color="red"
        variant="text"
        @click="snackbarShow = false"
      >
        Close
      </v-btn>
    </template>
  </v-snackbar>
  
</div>

</template>
<script>

export default {
  name: 'SpliceJunctionD3',
  components: {
  },
  props: {
    selectedGene: Object,
    spliceJunctionsForGene: Object,
    geneSource: String,
    genomeBuildHelper: Object,
    geneModel: Object,
    tab: String,
    loadInProgress: Boolean,
    junctionSiteSeqRange: Number,
    variants: Array,
    variantHeight: Number,
    variantWidth: Number,
    vcf: Object
  },
  data: () => ({
		// GLOBALS
		REGION_BUFFER: 1000,
		UTR_HEIGHT: 10,
		CDS_HEIGHT: 20,

		clickedObject: null,

    selectedSpliceKind: null,

		regionIsSelected: false,

		selectedTranscript: null,
		filteredSpliceJunctions: null,

		xArcDiagram: null,
		xTranscriptChart: null,
		xTranscriptChartZoomed: null,
    xSeqChart: null,
		ySitePointer: null,
		tooltip: null,

    xBrushable: null,

    xBrushableHist: null,
    scaleYHist: 'normal',
    readCountRange: null,

		showLabels: false,
		junctionsToShow: null,
    showTranscriptMenu: false,

    geneStart: null,
    geneEnd: null,

		brush: null,
    brushHist: null,

		showLoading: false,

    minUniquelyMappedReads: 1,
    maxUniquelyMappedReads: null,
    colorBy: 'spliceKind',
    arcColorScale: null,

    arcPointerWidth: 15,
    arcPointerHeight: 13,

    arcPointerSmallWidth: 10,
    arcPointerSmallHeight: 8,

    sitePointerWidth: 15,
    sitePointerHeight: 13,

    sitePointerSmallWidth: 10,
    sitePointerSmallHeight: 8,

    MIN_ARC_HEIGHT: 50,
    ARC_FACTOR:     2,

    showDonorPanel: false,
    showAcceptorPanel: false,

    zoomFactor: 1,

    showZoomPanel: false,


    readCountMean: null,
    readCountStd: null,
    readCountMin: null,
    readCountMax: null,

    readCountMeanNoncan: null,
    readCountStdNoncan: null,
    readCountMinNoncan: null,
    readCountMaxNoncan: null,

    colorByItems: [
    { title: 'n/a',         props: {subtitle: ''}, 'value': 'none' }, 
    { title: 'Strand',      props: {subtitle: ''}, 'value': 'strand' }, 
    { title: 'Motif',       props: {subtitle: ''}, 'value': 'motif' }, 
    { title: 'Splice kind', props: {subtitle: 'Canonical, Exon-skipping, Cryptic-site'}, 'value': 'spliceKind' }
    ],

    snackbarText: '',
    snackbarShow: false

	}),
  methods: {

  	onDataChanged: function() {
  		let self = this;
  		if (this.tab == 'tab-2' && this.selectedGene) {
  			self.$nextTick(function() {
          self.showDonorPanel = false;
          self.showAcceptorPanel = false;
	  			self.onGeneSelected();
	  			if (self.spliceJunctionsForGene) {
	  				self.showLoading = false;
	  				self.loadDiagram();
	  			} else {
	  				d3.selectAll('#diagrams svg').remove();
				    d3.selectAll('#zoomed-diagrams svg').remove();
            d3.selectAll('#site-diagrams svg').remove();
				    self.showLoading = true;

	  			}

  			})
  		}
  	},

  	onSettingsChanged: function() {
  		let self = this;
  		if (this.tab == 'tab-2' && this.selectedGene) {
  			self.$nextTick(function() {
		  		self.filteredSpliceJunctions = self.filterSpliceJunctions()

			    self.geneStart = self.selectedGene.start - self.REGION_BUFFER;
			    self.geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

			    self.xArcDiagram = null;

			    d3.selectAll('#diagrams #arc-diagram svg').remove();
			    d3.selectAll('#zoomed-diagrams #arc-diagram svg').remove();
          self.showZoomPanel = false;
			    self.drawArcDiagram('#diagrams', self.filteredSpliceJunctions, self.geneStart, self.geneEnd,
			    	{'createBrush': false, 'isZoomedRegion': false});	
          self.drawArcColorLegend('#arc-color-legend')

  			})
  		}
  	},

  	onGeneSelected: function() {
  		let self = this;

		  this.determineExons(this.selectedGene);
      self.selectedTranscript = null;
		  this.selectedGene.transcripts.forEach(function(transcript) {
		    if (transcript.is_mane_select) {
		      transcript.isSelected = true;
		      self.selectedTranscript = transcript;
		      self.$emit('transcript-selected', self.selectedTranscript);
		    }
      })
      if (this.selectedTranscript == null) {
        this.selectedTranscript = this.geneModel.getCanonicalTranscript(self.selectedGene);
        if (this.selectedTranscript) {
          this.selectedTranscript.isSelected = true;
          self.$emit('transcript-selected', self.selectedTranscript);
        }
      }

    },


  	loadDiagram: function() {
  		let self = this;
      self.showZoomPanel = false;
      self.showTranscriptMenu = false;

      d3.selectAll("#read-count-histogram svg").remove();
      self.readCountMean = null;
      self.readCountStd = null;
      self.readCountMin = null;
      self.readCountMax = null;
      self.readCountMeanNocan = null;
      self.readCountStdNocan = null;
      self.readCountMinNocan = null;
      self.readCountMaxNocan = null;

  		if (self.spliceJunctionsForGene) {

        self.maxUniquelyMappedReads = d3.max(self.spliceJunctionsForGene, function(d) {
          return +d.readCount;
        })

				self.filteredSpliceJunctions = self.filterSpliceJunctions()

        
		    self.geneStart = self.selectedGene.start - self.REGION_BUFFER;
		    self.geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

		    self.xArcDiagram = null;

		    d3.selectAll('#diagrams svg').remove();
		    d3.selectAll('#zoomed-diagrams svg').remove();

		    self.drawBrushableAxis("#diagrams", self.geneStart, self.geneEnd)
        self.showZoomPanel = false;
		    self.drawArcDiagram('#diagrams', self.filteredSpliceJunctions, self.geneStart, self.geneEnd,
		    	{'createBrush': false, 'isZoomedRegion': false});
        self.drawArcColorLegend('#arc-color-legend')

		    self.drawTranscriptDiagram("#diagrams #selected-transcript-panel #transcript-diagram", self.selectedGene, self.geneStart, self.geneEnd,  
		      {'selectedTranscriptOnly': true, 'allowSelection': false, 'showBoundingBox': true})


		    d3.selectAll("#transcript-menu-panel #transcript-menu-diagram svg").remove();
		    self.drawTranscriptDiagram('#transcript-menu-panel #transcript-menu-diagram', self.selectedGene, self.geneStart, self.geneEnd, 
		    	{'selectedTranscriptOnly': false, 'allowSelection': true});	
        self.showTranscriptMenu = true;


        self.drawBrushableHistAxis('#all-histogram');

        self.drawReadCountHistogram('#canonical-histogram', 'canonical', 'Canonical', {}, self.readCountRange);

        self.drawReadCountHistogram('#exon-skipping-histogram', 'exon-skipping', 'Exon-skipping', {}, self.readCountRange);

        self.drawReadCountHistogram('#cryptic-site-histogram', 'cryptic-site', 'Cryptic-site', {}, self.readCountRange);

  		} else {
  			console.log("Problem encountered. Splice junctions gene does not match selected gene.")
  		}
  	},

		determineExons: function(gene) {
		  gene.transcripts.forEach(function(transcript) {

		  	// Exons are what we use the number the features. Each exon is assigned 
		  	// a number sequentially. For forward strand, we number exons from
		  	// first to last exon; For reverse strand, we number from last to 
		  	// first exon. 
		    let exons = transcript.features.filter(function(feature) {
		    	return feature.feature_type.toLowerCase() == 'exon';
		    })
		    .sort(function(a,b) {
		      if (gene.strand == "+") {
		        return a.start - b.start;
		      } else {
		        return (a.start - b.start) * -1;
		      }
		    })

		    // These are the features (UTRs and CDSs for protein coding transcripts, 
		    // EXONs for non-protein coding transcripts) that we treat as exons, that we 
		    // will draw on the trascript diagram
		    let exonicFeatures  = transcript.features.filter(function(feature) {
		      if ( transcript.transcript_type == 'protein_coding'
		      	  || transcript.transcript_type == 'UNIONED'
		          || feature.transcript_type == 'mRNA'
		          || feature.transcript_type == 'transcript'
		          || feature.transcript_type == 'primary_transcript') {
		        return feature.feature_type.toLowerCase() == 'utr' || feature.feature_type.toLowerCase() == 'cds';
		      } else {
		        return feature.feature_type.toLowerCase() == 'exon';
		      }
		    })
		    .sort(function(a,b) {
		      if (gene.strand == "+") {
		        return a.start - b.start;
		      } else {
		        return (a.start - b.start) * -1;
		      }
		    })

		    // Assign the exon number sequentially
		    let count = 1;
		    exons.forEach(function(exon) {
		      exon.number = count++;
		      exon.name = 'Exon ' + exon.number + ' (of ' + exons.length + ')'
		    })

		    let getEncapsulatingExon = function(feature) {
		    	let matched = exons.filter(function(exon) {
		    		return exon.start <= feature.start && exon.end >= feature.end;
		    	})
		    	if (matched.length > 0) {
		    		return matched[0];
		    	} else {
		    		return null;
		    	}
		    }

		   	// Number the UTR and CDS according to the encapsulating EXON.
		    exonicFeatures.forEach(function(feature) {
		    	if (!feature.hasOwnProperty("number")) {
			    	let theExon = getEncapsulatingExon(feature, exons)
			    	if (theExon) {
			    		feature.number = theExon.number;
			    	} else {
			    		console.log("Unable to find encapsulating exon in gene " + 
			    			gene.gene_name + " for feature " + 
			    			feature.feature_type + " " + 
			    			feature.start + "-" + feature.end + 
			    			". Feature will not numbered.")
			    	}

		    	}
		    })


		    transcript.exons = exonicFeatures;
		    transcript.exonsOnly = exons;

		  })
		  return gene;
		},


		locateExon: function(bedPos) {
		  var matched = this.selectedTranscript.exons.filter(function(exon) {
		    let exonStart = +exon.start - 1;
		    let exonEnd   = +exon.end;
		    return exonStart <= +bedPos && exonEnd >= +bedPos;
		  })
		  if (matched.length > 0) {
		    return matched[0];
		  } else {
		    return null;
		  }
		},

		filterSpliceJunctions: function() {
		  let self = this;
      if (self.selectedGene) {
        let spliceJunctions = self.geneModel.geneToSpliceJunctionObjects[self.selectedGene.gene_name]
        let spliceJunctionsFiltered = spliceJunctions.filter(function(spliceJunction) {
          let meetsBottomRange =  self.minUniquelyMappedReads == null || self.minUniquelyMappedReads == "" || +spliceJunction.readCount >= self.minUniquelyMappedReads
          let meetsTopRange = self.maxUniquelyMappedReads == null || self.maxUniquelyMappedReads == "" || +spliceJunction.readCount <= self.maxUniquelyMappedReads
          let matchesSpliceKind = self.selectedSpliceKind == null  || spliceJunction.spliceKind == self.selectedSpliceKind;
          let matchesStrand = spliceJunction.strand == null || spliceJunction.strand == 'undefined' || self.selectedGene.strand == spliceJunction.strand

          return meetsBottomRange && meetsTopRange && matchesSpliceKind && matchesStrand;
        });
        return spliceJunctionsFiltered;        
      } else {
        return [];
      }
		},

		// Function that is triggered when brushing above arc diagram is performed
		onBrush:  function(event) {
			let self = this;

		  // Get the selection coordinate
		  let extent = event.selection 
		  if (extent && extent.length == 2 && extent[0] != extent[1]) {
		  	self.regionIsSelected = true;
		    let regionStart = self.xBrushable.invert(extent[0]);
		    let regionEnd   = self.xBrushable.invert(extent[1]);

		    self.showSelectionBox("#diagrams #arc-diagram svg", regionStart, regionEnd, 
		    	                    self.xArcDiagram )
		    self.showSelectionBox("#diagrams #transcript-diagram svg", regionStart, regionEnd, 
		    	                    self.xTranscriptChart )
        self.showSelectionBox("#diagrams #variant-diagram svg", regionStart, regionEnd, 
                              self.xTranscriptChart )
		    
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();
        
		    if (event.type == 'end') {
			    let filteredEdges = self.filteredSpliceJunctions.filter(function(edge) {
			       return (edge.donor.pos >= regionStart && edge.donor.pos <=regionEnd) ||
                    (edge.acceptor.pos >= regionStart && edge.acceptor.pos <=regionEnd)
			    })
			    let filteredEdgesClone = [];
			    filteredEdges.forEach(function(d) {
			    	let edge = $.extend({}, d)
			    	filteredEdgesClone.push(edge);
			    })
          self.showZoomPanel = true;
			    self.drawArcDiagram("#zoomed-diagrams", filteredEdgesClone, regionStart, regionEnd, 
            {'createBrush': false, 
             'allEdges': self.filteredSpliceJunctions,
             'showXAxis': true,
             'marginRight': 0,
             'showJunctionArrow': true,
             'isZoomedRegion': true})

			    self.drawTranscriptDiagram("#zoomed-diagrams #transcript-diagram", self.selectedGene, regionStart, regionEnd, 
			      {'selectedTranscriptOnly': true, 'allowSelection': false, 'marginRight': 0})

          if (self.variants && self.variants.length > 0) {
            let filteredVariants = self.variants.filter(function(d) {
              return d.start >= regionStart && d.start <= regionEnd
            }).map(function(d) {
              let variant = $.extend({}, d)
              variant.level = 0;
              return variant;
            })
            self.vcf.pileupVariants(filteredVariants, regionStart, regionEnd, self.$el.offsetWidth - 20)
            self.drawVariantDiagram("#zoomed-diagrams #variant-diagram", regionStart, regionEnd, filteredVariants)

          }

		    }
		  } else {
        self.showZoomPanel = false;
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();
        d3.select("#zoomed-diagrams").select("#variant-diagram svg").remove();
		    self.regionIsSelected = false;
		    d3.select("#diagrams #arc-diagram svg .bounding-box.active").classed("active", false)
		    d3.select("#diagrams #transcript-diagram svg .bounding-box.active").classed("active", false)
        d3.select("#diagrams #variant-diagram svg .bounding-box.active").classed("active", false)

		  }
		},

    // Function that is triggered when brushing on histogram is performed
    onBrushHist:  function(event) {
      let self = this;

      let container = "#all-histogram #read-count-histogram"

      // Get the selection coordinate
      let extent = event.selection
      if (extent && extent.length == 2 && extent[0] != extent[1]) {
        let binStart = Math.round(self.xBrushableHist.invert(extent[0]));
        let binEnd   = Math.round(self.xBrushableHist.invert(extent[1]));
        self.readCountRange = [binStart, binEnd]

        // Setting these variables will cause the arcs to be filtered based
        // on the read count range from this brush event
        self.minUniquelyMappedReads = binStart;
        self.maxUniquelyMappedReads = binEnd;

        let x1   = self.xBrushableHist(binStart);
        let x2   = self.xBrushableHist(binEnd);
        let width = x2 - x1;
        let height = d3.select(container).node().getBoundingClientRect().height
        let boundingBox = d3.select(container).select('.bounding-box');
        boundingBox.attr("x", x1)
        boundingBox.attr("y", 0)
        boundingBox.attr("width", width)
        boundingBox.attr("height", height)
        boundingBox.classed("active", true)

        if (event.type == 'end') {

          d3.select("#canonical-histogram #read-count-histogram svg").remove();
          d3.select("#exon-skipping-histogram #read-count-histogram svg").remove();
          d3.select("#cryptic-site-histogram #read-count-histogram svg").remove();

          self.drawReadCountHistogram('#canonical-histogram', 'canonical', 'Canonical', {}, self.readCountRange);
          self.drawReadCountHistogram('#exon-skipping-histogram', 'exon-skipping', 'Exon-skipping', {}, self.readCountRange);
          self.drawReadCountHistogram('#cryptic-site-histogram', 'cryptic-site', 'Cryptic-site', {}, self.readCountRange);
        }
      } else {
        self.readCountRange = null;
        self.brushHist.extent([0,0])

        self.minUniquelyMappedReads = 1;
        self.maxUniquelyMappedReads = d3.max(self.spliceJunctionsForGene, function(d) {
          return +d.readCount;
        })


        d3.select("#canonical-histogram #read-count-histogram svg").remove();
        d3.select("#exon-skipping-histogram #read-count-histogram svg").remove();
        d3.select("#cryptic-site-histogram #read-count-histogram svg").remove();

        self.drawReadCountHistogram('#canonical-histogram', 'canonical', 'Canonical', {}, null);
        self.drawReadCountHistogram('#exon-skipping-histogram', 'exon-skipping', 'Exon-skipping', {}, null);
        self.drawReadCountHistogram('#cryptic-site-histogram', 'cryptic-site', 'Cryptic-site', {}, null);

        d3.select(container).select(".bounding-box.active").classed("active", false)

      }
    },

		showSelectionBox: function(container, regionStart, regionEnd, x) {
			let self = this;

      if (d3.select(container).empty()) {
        return;
      }

			let x1   = x(regionStart);
		  let x2   = x(regionEnd);
		  let width = x2 - x1;

      let height = d3.select(container).node().getBoundingClientRect().height
      
	  	let boundingBox = d3.select(container).select('.bounding-box');
	  	boundingBox.attr("x", x1)
	  	boundingBox.attr("y", 0)
	  	boundingBox.attr("width", width)
	  	boundingBox.attr("height", height)
	  	boundingBox.classed("active", true)

	  },

		clearZoom: function() {
			let self = this;
			self.brush.extent([0,0])

			d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		  d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();

		  d3.select("#diagrams").select(".brush").remove();
		  d3.select("#diagrams").select(".overlay").remove();
		  d3.select("#diagrams").select(".selection").remove();
		  d3.select("#diagrams").selectAll(".handle").remove();
		  
		  self.regionIsSelected = false;
		},

		addBrushing: function() {
			let self = this;
			let width = +d3.select("#diagrams").select("#brushable-axis svg").attr("width");
			let height = +d3.select("#diagrams").select("#brushable-axis svg").attr("height");
			d3.select("#diagrams").select("brushable-axis svg")
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,height] ] )
		        .on("start end", self.onBrush)    
		      )   
		},

		drawTranscriptDiagram: function(container, gene, regionStart, regionEnd, options) {
			let self = this;
		  // dimensions
		  var margin = {top: (options && options.selectedTranscriptOnly ? 0 : 5), 
		  	            right: (options && options.hasOwnProperty('marginRight') ? options.marginRight : 5), 
		  	            bottom: (options && options.selectedTranscriptOnly ? 50 : 30), 
		  	            left: 0};

		  var width = self.$el.offsetWidth - 20;
		  if (options.width) {
		  	width = options.width;
		  }

		  var transcriptCount = options && options.selectedTranscriptOnly ? 1 : gene.transcripts.length;
		  var transcriptPadding = options && options.selectedTranscriptOnly ? 0 : 25;
		  var transcriptHeight = self.CDS_HEIGHT;

		  var height = null;
		  if (transcriptCount == 1) {
		  	height = self.CDS_HEIGHT + margin.top + margin.bottom;
		  } else {
			  height = (transcriptCount * (transcriptHeight+transcriptPadding)) + margin.top + margin.bottom
		  }

		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;

		  // Determine the starting y position for the site pointers, positioned on mouseover or 
		  // click over arc or exon 
		  if (options && options.selectedTranscriptOnly) {
				self.ySitePointer = height - margin.top - transcriptHeight;		  	
		  }



		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth + margin.left]);
		  var y = d3.scalePoint();
		  y.domain(gene.transcripts)
		  y.range([margin.bottom, height-margin.top-margin.bottom])

		  // We need to access the x scale outside of this method
		  // Keep track of x according to container (e.g. diagrams and zoomed-diagrams)
		  if (container.indexOf('#zoomed-diagrams') >= 0) {
		  	self.xTranscriptChartZoomed = x;
		  } else {
		  	self.xTranscriptChart = x;
		  }

		  // append the svg object to the body of the page
		  var svg = d3.select(container)
		  .append("svg")
		    .attr("width", width)
		    .attr("height", height)
		  .append("g")
		    .attr("transform",
		          "translate(" + margin.left + "," + margin.top + ")");

		  // TODO: Need to order transcripts descending (most important should be at top)
		  var transcripts = svg
		      .selectAll("g.transcript")
		      .data(options && options.selectedTranscriptOnly ? [self.selectedTranscript] : gene.transcripts, 
		        function(d) {
		        return d.transcript_id;
		      })
		      .enter()
		      .append('g')
		      .attr("class", function(d) {
		        return "transcript" + (d.isSelected ? " selected" : "");
		      })
		      .attr("transform", function(d) {
		      	if (options && options.selectedTranscriptOnly) {
		      		return `translate(${margin.left},0)`
		      	} else {
			        return `translate(${margin.left},${d.y = y(d) - transcriptHeight})`
		      	}
		      })
		     
		  if (options && options.allowSelection) {
				transcripts.selectAll(".selection-box").remove();
	      transcripts.selectAll(".selection-box")
        .data(function(d) {
          return [d]
        })
        .enter().append('rect')
        .attr('class', 'selection-box')
        .attr('x', margin.left + 2)
        .attr('y', transcriptHeight/2)
        .attr('width', width - margin.left - 5)
        .attr('height', transcriptHeight)
        .on("mouseover", function(d) {
          svg.selectAll('.transcript.selected').classed("current", false);
          d3.select(this.parentNode).classed("current", true);
        })
        .on("mouseout", function(d) {
          d3.select(this.parentNode).classed("current", false);
        })
        .on("click", function(d) {
          svg.selectAll('.transcript.selected').classed("selected", false);
          d3.select(this.parentNode).classed("selected", true);

          d3.select("#diagrams #selected-transcript-panel #transcript-diagram svg").remove();

          let selectedTranscriptId = this.parentNode.__data__.transcript_id;
          gene.transcripts.forEach(function(transcript) {
          	if (transcript.transcript_id == selectedTranscriptId) {
          		self.selectedTranscript = transcript;
          		self.selectedTranscript.isSelected = true;
          	} else {
          		transcript.isSelected = false;
          	}
          })


          self.drawTranscriptDiagram("#diagrams #selected-transcript-panel #transcript-diagram", self.selectedGene, regionStart, regionEnd, 
		      {'selectedTranscriptOnly': true, 'allowSelection': false})
          
        })
     	}


      transcripts.selectAll("line.gene").remove();
      transcripts.selectAll("line.gene")
      .data(function(d) {
        return [{'start': d.start, 'end': d.end}]
      })
      .enter()
      .append('line')
      .attr("class", "gene")
      .attr("x1", function(d) {
        return x(Math.min(regionStart, d.start))
      })
      .attr("x2", function(d) {
        return x(Math.min(regionEnd, d.end))
      })
      .attr("y1", self.CDS_HEIGHT)
      .attr("y2", self.CDS_HEIGHT)

      if (options && options.allowSelection) {
        transcripts.selectAll(".transcript-label").remove();
        transcripts.selectAll(".transcript-label")
        .data(function(d) {
  	       return [d];
        })
        .enter()
        .append('text')
  			.attr("class", "transcript-label")
  			.attr("text-anchor", 'start')
  			.attr("x", 5)
  			.attr("y", 0)
  			.attr("dy", "0.35em")
  			.text(function(d) {
  			  return d.transcript_id + (d.is_mane_select ? " MANE" : "");
  			})
      }



		 
		  var nodes = transcripts
		    .selectAll("rect.exon")
		    .data(function(d) { 
		        return d['exons'].filter(function(exon) {
		          return +exon.start >= +regionStart && +exon.end <= +regionEnd
		        })
		    }, 
		          function(d) {return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;}
		    )
		    .enter()
		    .append("rect")
		      .attr("x", function(d){ return(x(d.start))})
		      .attr("y", function(d,i) {
		        if (d.feature_type.toLowerCase() == 'utr') {
		          return transcriptHeight - (self.UTR_HEIGHT/2);
		        } else {
		          return transcriptHeight - (self.CDS_HEIGHT/2);
		        }
		      })
		      .attr("width", function(d) { 
		        return Math.max(1, Math.round(x(d.end) - x(d.start))+1)
		      })
		      .attr("height", function(d) { 
		        if (d.feature_type.toLowerCase() == 'utr') {
		          return self.UTR_HEIGHT;
		        } else {
		          return self.CDS_HEIGHT
		        }
		      })
		      .attr("class", function(d) {
		        return 'transcript-feature ' +
		               d.feature_type + 
		               (" exon-" + d.number) + 
		               (options && options.allowSelection ? " no-pointer" : "");
		      })
		      .on("click", function(event,d) {
		      	self.onSelectExon(d, {'click': true});
		      	self.clickedObject = d;
		     	})
		      .on("mouseover", function(event,d) {
		      	self.onSelectExon(d, {'click': false});
		      })
		     .on("mouseout", function(d) {

		     		d3.selectAll('#transcript-diagram .transcript.selected .exon-' + d.number).classed("exon-highlight",false);
		      });

		  if (options && options.selectedTranscriptOnly) {

		  	let exons = self.selectedTranscript.features.filter(function(feature) {
          let matchesRegion = +feature.start >= +regionStart && +feature.end <= +regionEnd;
        	return feature.feature_type.toLowerCase() == 'exon' && matchesRegion;
		  	})
		  	let factor = exons.length / 50 > 1 ? Math.round(exons.length/25) : 1
		  	let count = 0;
		  	let exonsToLabel = exons.filter(function(exon) {
		  		count++;
		  		if (count % factor == 0) {
		  			return true;
		  		} else {
		  			return false;
		  		}
		  	})
		    let exonLabels = transcripts.insert("g", "*")
				  .attr("class", "exon-labels")
				  .attr("transform", "translate(0," + (height - margin.top - transcriptHeight - 10) + ")")
				  .selectAll("text.exon-label")
					.data(function(d) 
				     { 
				        return exonsToLabel;
		    		 }, 
			       function(d) {
			        	return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;
			       }
			    )
			    .join("text")
			      .attr("class", "exon-label")
			      .attr("x", function(d) {
			      	return x(d.start) + ( Math.abs((x(d.start) - x(d.end))) / 2 )
			      })
			      .attr("y", function(d) {
			      	return 0;
			      })
			      .text(function(d,i) {
			      	return d.number;
			      })

		  }

		  	
		      

		  if (options && options.showBoundingBox) {  
			  svg.selectAll("rect.bounding-box").remove();
			  svg
				 .append("rect")
				 .attr("class", "bounding-box")
				 .attr("x", 0)
				 .attr("y", 0)
				 .attr("width", 0)
				 .attr("height", 0)
		  }

		  // Draw draw triangles to point out donor and acceptor sites
		  if (options && options.selectedTranscriptOnly) {
		  	if (!options || !options.exonsOnly) {
				 svg
				 .append("polygon")
				 .attr("class", "donor-pointer-small")
				 .attr("points", function(d) {
				 		return self.sitePointerSmallWidth + ",0 "
				 		       + (self.sitePointerSmallWidth/2) + ",-" + self.sitePointerSmallHeight 
				 		       + " 0,0"
				 	})
				 .style("opacity", "0")

		  	 svg.selectAll(".acceptor-pointer-small").remove();
				 svg
				 .append("polygon")
				 .attr("class", "acceptor-pointer-small")
				 .attr("points", function(d) {
				 		return self.sitePointerSmallWidth + ",0 "
				 		       + (self.sitePointerSmallWidth/2) + ",-" + self.sitePointerSmallHeight 
				 		       + " 0,0"
				 	})
				 .style("opacity", "0")

		  	 svg.selectAll(".donor-pointer").remove();
				 svg
				 .append("polygon")
				 .attr("class", "donor-pointer")
				 .attr("points", function(d) {
				 		return self.sitePointerWidth + ",0 "
				 		       + (self.sitePointerWidth/2) + ",-" + self.sitePointerHeight 
				 		       + " 0,0"
				 	})
				 .style("opacity", "0")
				 .on("click", function(d) {
		      	
		      })

		  	 svg.selectAll(".acceptor-pointer").remove();
				 svg
				 .append("polygon")
				 .attr("class", "acceptor-pointer")
				 .attr("points", function(d) {
				 		return self.sitePointerWidth + ",0 "
				 		       + (self.sitePointerWidth/2) + ",-" + self.sitePointerHeight 
				 		       + " 0,0"
				 	})
				 .style("opacity", "0")
				 .on("click", function(d) {
				 		self.showAcceptorDetails()
				 	})


				 svg.selectAll(".donor-problem").remove();
				 svg
				 .append("text")
				 .attr("class", "donor-problem")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("!")

				 svg.selectAll(".acceptor-problem").remove();
				 svg
				 .append("text")
				 .attr("class", "acceptor-problem")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("!")

				 svg.selectAll(".donor-problem-small").remove();
				 svg
				 .append("text")
				 .attr("class", "donor-problem-small")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("!")

				 svg.selectAll(".acceptor-problem-small").remove();
				 svg
				 .append("text")
				 .attr("class", "acceptor-problem-small")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("!")


				 if (self.clickedObject && self.clickedObject.type == 'splice-junction') {

			     let donorExon      = self.locateExon(self.clickedObject.donor.pos);
			     let acceptorExon   = self.locateExon(self.clickedObject.acceptor.pos);
			     if (donorExon) {
			      	svg.selectAll('.exon-' + donorExon.number).classed("exon-highlight",true);
			      	svg.selectAll('.exon-' + donorExon.number).classed("clicked",true);
			     }
			     if (acceptorExon) {
			        svg.selectAll('.exon-' + acceptorExon.number).classed("exon-highlight", true);
			        svg.selectAll('.exon-' + acceptorExon.number).classed("clicked", true);
			     }

  				 self.hideSitePointersOnTranscriptChart("select")
  				 self.hideSitePointersOnTranscriptChart("click")
			     self.showSitePointersOnTranscriptChart(self.clickedObject, 
																						     	self.ySitePointer - 2,
																						     	"click")

				 }
				}
			}

		},


		onSelectExon: function(exon, options={'click': false}) {

			let self = this;
			d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight.selected').classed("exon-highlight", false)
    	d3.selectAll('#transcript-diagram .transcript.selected .exon-' + exon.number).classed("exon-highlight",true);
    	d3.selectAll('#transcript-diagram .transcript.selected .exon-' + exon.number).classed("selected",true);
    	d3.selectAll('#transcript-diagram .transcript.selected .exon-' + exon.number).classed("clicked",options.click);

    	let count = 0;
    	let donorSpliceJunctions = self.filteredSpliceJunctions.filter(function(edge) {
    		if (edge.donor.exon && edge.donor.exon.number == exon.number) {
    			return true;
    		} else {
    			return false;
    		}
    	}).map(function(spliceJunction) {
    		let donorExon = self.locateExon(spliceJunction.donor.pos);
		    let acceptorExon   = self.locateExon(spliceJunction.acceptor.pos);
		    let sj = {'key': count++,
    			        'donorExon': donorExon,
    			        'acceptorExon': acceptorExon}
    		return $.extend(sj, spliceJunction)
    	})
    	count = 0;
    	let acceptorSpliceJunctions = self.filteredSpliceJunctions.filter(function(edge) {
    		if (edge.acceptor.exon && edge.acceptor.exon.number == exon.number) {
    			return true;
    		} else {
    			return false;
    		}
    	}).map(function(spliceJunction) {
    		let donorExon = self.locateExon(spliceJunction.donor.pos);
		    let acceptorExon   = self.locateExon(spliceJunction.acceptor.pos);
		    let sj = {'key': count++,
    			        'donorExon': donorExon,
    			        'acceptorExon': acceptorExon}
    		return $.extend(sj, spliceJunction)
    	})

    	let selectedExon = $.extend({
      		'type': 'exon', 
      		'click': options.click, 
      		'donorSpliceJunctions':    donorSpliceJunctions,
      		'acceptorSpliceJunctions': acceptorSpliceJunctions}, exon);

    	if (options.click == true) {
    		self.clickedObject = exon;
				self.$emit('object-selected', selectedExon)
    	} else if (self.clickedObject == null) {
    		self.$emit('object-selected', selectedExon)
    	}

  	},

		drawBrushableAxis: function(container, regionStart, regionEnd) {
			let self = this;


		  // dimensions
		  var margin = {top: 40, right: 5, bottom: 5, left: 0};
		  var width = self.$el.offsetWidth - 20,
		      height = 60;



		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;

		  var center = innerWidth / 2;

		  // scales
		  self.xBrushable = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth+margin.left]);
		  
		  var tickFormatter = function(d) {
				return d3.format(",")(d)
		  }

		  // axis
		  var xAxis = d3.axisTop(self.xBrushable)
		                .tickFormat(tickFormatter);		                   

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#brushable-axis")
		  .append("svg")
		    .attr("width", innerWidth)
		    .attr("height", height)
		  .append("g")
		    .attr("class", "gene")
		    .attr("transform",
		          "translate(" + margin.left + "," + margin.top + ")")
		  .call(xAxis);

		  
      svg.selectAll(".arrow").remove();
      svg.selectAll('.arrow').data([
      	{'gene': self.selectedGene, 'x': center - center/2},
      	{'gene': self.selectedGene, 'x': center},
      	{'gene': self.selectedGene, 'x': center + center/2},
      ])
          .enter().append('path')
          .attr('class', 'arrow')
          .attr('d', function(d) {
            return self.centerArrow(d, innerHeight, 15)
          })
          .style('transform', 'translate(-10px, -8px)')


		  svg
      .call( self.brush = d3.brushX()                  
        .extent( [ [0,-40], [width,innerHeight+1] ] )
        .on("start brush end", self.onBrush)    
      )      

		},


	  centerArrow: function(d, height, arrowHeight) {
	    var arrowHead = parseInt(d.gene.strand + '5');
	    var pathStr = "M ";
	    pathStr += d.x + ' ' + (height - arrowHeight)/2;
	    pathStr += ' L ' + parseInt(d.x+arrowHead) + ' ' + height/2;
	    pathStr += ' L ' + d.x + ' ' + parseInt(height + arrowHeight)/2;
	    return pathStr;
	  },
		
		drawArcDiagram: function(container, edges, regionStart, regionEnd, options) {
			let self = this;
		  let maxReadCount = null;
		  if (options.allEdges) {
		  	// We want to maintain the scaling of arc thickness based on all arcs,
		  	// not just the ones we selected via brush
		  	maxReadCount = d3.max(options.allEdges, function(d) {
		    	return d.readCount;
		  	})
		  } else {
		  	maxReadCount = d3.max(edges, function(d) {
		    	return d.readCount;
		  	})
		  }

		  // dimensions
		  var margin = {top: (options.showXAxis ? 35 : 10), 
                   right: (options.hasOwnProperty('marginRight') ? options.marginRight : 5), 
                   bottom: 0, 
                   left: 0};
		  var width = self.$el.offsetWidth - 20,
		      height = 100;

		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;



		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth+margin.left]);
		  if (self.xArcDiagram == null) { 
		    // need this class variable so we can invert scale from screen coord to genome coords
		    self.xArcDiagram = x;   
		  }

		        
		  var y = d3.scaleLinear()
		            .domain([0, 1])
		            .range([height - margin.top - margin.bottom , 0]);

		  var scaleArcWidth = d3.scaleLinear()
		                    .domain([self.minUniquelyMappedReads, maxReadCount])
		                    .range([1.5, 10])


		           

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#arc-diagram")
		  .append("svg")
		    .attr("width", innerWidth)
		    .attr("height", height)

      var arcGroup = svg  
		  .append("g")
		  .attr("transform",
		        "translate(" + margin.left + "," + margin.top + ")")

      var axisGroup = svg  
      .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + (margin.top - 10) + ")")

      if (options.showXAxis) {
        var tickFormatter = function(d) {
          return d3.format(",")(d);
        }

        // axis
        var xAxis = d3.axisTop(x)
                      .tickFormat(tickFormatter);  

        axisGroup.call(xAxis)   
        
        var center = innerWidth / 2;
        axisGroup.selectAll(".arrow").remove();
        axisGroup.selectAll('.arrow').data([
          {'gene': self.selectedGene, 'x': center - center/2},
          {'gene': self.selectedGene, 'x': center},
          {'gene': self.selectedGene, 'x': center + center/2},
        ])
            .enter().append('path')
            .attr('class', 'arrow')
            .attr('d', function(d) {
              return self.centerArrow(d, innerHeight, 15)
            })
            .style('transform', 'translate(-10px, -' + (margin.top - 3) + 'px)') 
      }

		  if (options && options.createBrush) {
		    svg
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,10] ] )
		        .on("start end", self.onBrush)    
		      )       
		  }


      var arcColors = ['#7ba852', '#59749e', '#6491cb', '#db9625', '#FD7049' ]

		  if (self.colorBy == 'motif') {
			  let motifMap = {};
			  edges.forEach(function(edge) {
			  	motifMap[edge.motif] = edge.motif
			  })
			  self.arcColorScale = d3.scaleOrdinal()
	                   .domain(Object.keys(motifMap))
	                   .range(arcColors);
		  } else if (self.colorBy == 'strand') {
				let strandMap = {};
					edges.forEach(function(edge) {
					strandMap[edge.strand] = edge.strand
				})
	      self.arcColorScale = d3.scaleOrdinal()
	                   .domain(['+', '-', 'undefined'])
	                   .range(arcColors);
		  } else if (self.colorBy == 'exon span') {
			  self.arcColorScale = d3.scaleOrdinal()
	                   .domain([true, false])
	                   .range(arcColors);
		  } else if (self.colorBy == 'spliceKind') {
        self.arcColorScale = d3.scaleOrdinal()
                     .domain(['canonical', 'exon-skipping', 'cryptic-site'])
                     .range(['steelblue', '#db9625', '#7ba852']);
      }  else {
        self.arcColorScale = null;
      }

			let arc = function(d, theInnerHeight) {
				

		    let start = x(d.donor.pos);  // X position of start node on the X axis
		    let end   = x(d.acceptor.pos);   // X position of end node
		    let distance = Math.abs(end - start)
		    let currentArcHeight = (1/2*distance)

		    let rx = 1;
		    let ry = 1;
		    let maxArcHeight = innerHeight - 20;
		    let minArcHeight = theInnerHeight / 5;

		    // Arc is shorter than min arc height 
		    // Need arc to be stretched on y axis
		    if (currentArcHeight < minArcHeight) {
		    	ry = minArcHeight/currentArcHeight;
		    	rx = 1;
		    	d.arcYTop = margin.top + innerHeight - (currentArcHeight * ry)
		    } else if (currentArcHeight >= maxArcHeight) {
		    	// Arc is taller than chart
		    	// Need arc to be stretched on x axis

		    	// shuffle the height randomly by 30 pixels 
		    	let rando = Math.floor(Math.random() * 31);
		    	let newMaxArcHeight = maxArcHeight - rando;

		    	rx = currentArcHeight/newMaxArcHeight
		    	ry = 1;
		    	d.arcYTop = margin.top + innerHeight - (newMaxArcHeight)
		    } else {
		    	rx = 1;
		    	ry = 1;
		    	d.arcYTop = margin.top + innerHeight - currentArcHeight;
		    }
		    d.arcXCenter = Math.min(start,end) + (Math.abs(distance)/2)




		    return ['M', start, innerHeight, // the arc starts at the coord x=start
		      'A',                   // build an elliptical arc
		      rx, ',',               // rx
		      ry,                    // ry 
		      0,                     // rotation 
		      0,                     // large arc
		      ',',
		      start < end ? 1 : 0,   // sweep 
		      end, ',',              // end x
		      innerHeight]           // end y
		      .join(' ');
		  }


		  var arcs =  arcGroup.insert("g", "*")
		  .attr("class", "arcs")
		  .selectAll("path.junction")
		  .data(edges,function(d) {
		  	// The key to edges is the label
		  	return d.key;
		  })
		  .join("path")
		    .attr("d", function(d) {
		    	return arc(d, innerHeight)
		    })
		    .attr("class", function(d) {
		    	let clazz = "junction" + " " + d.spliceKind + " " +
		    	(d.countSkippedExons > 0 ? " exon-spanned" : "") + 
		    	(d.strand == "undefined" || d.strand == self.selectedGene.strand ? " strand-matches" : " strand-mismatches");

		    
		    	if (container.indexOf('#zoomed-diagrams') >= 0 && 
		    		self.clickedObject && 
		    		self.clickedObject.type == 'splice-junction' && 
		    		self.clickedObject.key == d.key) {
		    		clazz += " selected clicked"
		    	}
		    	return clazz;
		    })
		    .attr("stroke-width", function(d) {
		      return scaleArcWidth(d.readCount);
		    })
		    .attr("stroke", function(d) {
          if (options && options.isZoomedRegion) {
            return d.color;
          } else {
            if (self.colorBy == '' || self.colorBy == 'none') {
              return "#9f9f9f";
            } else {
              d.color = self.arcColorScale(d[self.colorBy])
              return d.color;           
            }            
          }
		    })
		    .on("click", function(event,d) {

		     if (self.clickedObject && self.clickedObject.type == 'splice-junction') {
		     	 if (self.clickedObject.key == d.key) {
		     	 		self.unclickSpliceJunction()
		     	 	  return;
		     	 }
		     }

				 d3.selectAll("text.junction.selected").classed("selected", false)
				 d3.selectAll("text.junction.clicked").classed("clicked", false)
		     let matchedLabelNode = d3.selectAll("text.junction").filter(function(edge) {
		     		return edge.key == d.key;
		     })
		     if (matchedLabelNode && !matchedLabelNode.empty()) {
		       matchedLabelNode.classed("clicked", true)
		     }


		     // If this is the zoomed diagram, find the counterpart arc in the main chart
		     let junctionParentChart = null;
		     let nodeParentChart = null;
		     
		     if (options.allEdges) {
		     	let matched = options.allEdges.filter(function(edge) {
		     		return edge.key == d.key;
		     	})
		     	if (matched.length > 0) {
		     		junctionParentChart = matched[0];
		     		nodeParentChart = d3.selectAll("#diagrams #arc-diagram g.arcs path.junction")
		     		                    .filter(function(spliceJunction) { 
		     	                   		  return spliceJunction.key == d.key
		     	                      })
		     	}
		     }
		     

		     let arcXCenter = d.arcXCenter;
		     let arcYTop    = d.arcYTop;

		     d3.selectAll("#arc-diagram path.junction").classed("selected", false);
		     d3.selectAll("#arc-diagram path.junction").classed("clicked", false);

		     d3.select(this).classed("clicked", true)
		     d3.select(this).classed("selected", true)
		     if (nodeParentChart && !nodeParentChart.empty()) {
	     	  	nodeParentChart.classed("selected", true)
	     	  	nodeParentChart.classed("clicked", true)
		     }

		     svg.select(".arc-pointer")
		        .attr("transform", function(d) {
		        	return "translate(" + (arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
		        	+ "," 
		        	+ (arcYTop - self.arcPointerHeight) + ")"
		         })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 
			   svg.select(".arc-pointer-small")
			      .style("opacity", 0)

			   // If we are drawing the zoom chart and there is a selected splice junction,
			   // set the arc pointer in the zoom chart to the counterpart splice junction
			   if (junctionParentChart) {
			     d3.select("#diagrams #arc-diagram .arc-pointer")
			       .attr("transform", function(d) {
			        	return "translate(" + (junctionParentChart.arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
			        	+ "," 
			        	+ (junctionParentChart.arcYTop - self.arcPointerHeight) + ")"
			         })
				     .transition()
				     .duration(200)
				     .style("opacity", .9); 
				    d3.select("#diagrams #arc-diagram .arc-pointer-small")
				      .style("opacity", 0)
			   }

		     d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)
		     d3.selectAll('#transcript-diagram .transcript.selected .clicked').classed("clicked", false)


		     let donorExon      = self.locateExon(d.donor.pos);
		     let acceptorExon   = self.locateExon(d.acceptor.pos);
		     if (donorExon) {
		      	d3.selectAll('#transcript-diagram .exon-' + donorExon.number).classed("exon-highlight",true);
		      	d3.selectAll('#transcript-diagram .exon-' + donorExon.number).classed("clicked",true);
		     }
		     if (acceptorExon) {
		        d3.selectAll('#transcript-diagram .exon-' + acceptorExon.number).classed("exon-highlight", true);
		        d3.selectAll('#transcript-diagram .exon-' + acceptorExon.number).classed("clicked", true);
		     }

				 self.hideSitePointersOnTranscriptChart("select")
				 self.hideSitePointersOnTranscriptChart("click")
		     self.showSitePointersOnTranscriptChart(d, self.ySitePointer +2, "click")

		     let spliceJunctionObject = $.extend({
																     	'type': 'splice-junction', 
																     	'clicked': true, 
																     	'donorExon': donorExon,
																     	'acceptorExon': acceptorExon
																     	}, d)

		     self.$emit("object-selected", spliceJunctionObject)
		     self.clickedObject = spliceJunctionObject;

		     self.selectSpliceJunction(d)

		  })
		  .on("mouseover", function(event,d) {

				 if (self.clickedObject && self.clickedObject.type == 'splice-junction') {
		     	 if (self.clickedObject.key == d.key) {
		     	 	  return;
		     	 }
		     }

		     // If this is the zoomed diagram, find the counterpart arc in the main chart
		     let junctionParentChart = null;
		     let nodeParentChart = null;
		     
		     if (options.allEdges) {
		     	let matched = options.allEdges.filter(function(edge) {
		     		return edge.key == d.key;
		     	})
		     	if (matched.length > 0) {
		     		junctionParentChart = matched[0];
		     		nodeParentChart = d3.selectAll("#diagrams #arc-diagram g.arcs path.junction")
		     		                    .filter(function(spliceJunction) { 
		     	                   		  return spliceJunction.key == d.key
		     	                      })
		     	}
		     }


		     d3.selectAll("text.junction.selected").classed("selected", false)
		     let matchedLabelNode = d3.selectAll("text.junction").filter(function(edge) {
		     		return edge.key == d.key;
		     })
		     if (matchedLabelNode && !matchedLabelNode.empty()) {
		       matchedLabelNode.classed("selected", true)
		     }


		     let arcXCenter = d.arcXCenter;
		     let arcYTop    = d.arcYTop;

		     d3.selectAll("#arc-diagram path.junction").classed("selected", false);

		     d3.select(this).classed("selected", true)
		     if (nodeParentChart && !nodeParentChart.empty()) {
	     	  	nodeParentChart.classed("selected", true)
		     }

		     svg.select(".arc-pointer-small")
		        .attr("transform", function(d) {
		        	return "translate(" + (arcXCenter - self.arcPointerSmallWidth/self.ARC_FACTOR) 
		        	+ "," 
		        	+ (arcYTop - self.arcPointerSmallHeight) + ")"
		         })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

			   // If we are drawing the zoom chart and there is a selected splice junction,
			   // set the arc pointer in the zoom chart to the counterpart splice junction
			   if (junctionParentChart) {
			     d3.select("#diagrams #arc-diagram .arc-pointer-small")
			       .attr("transform", function(d) {
			        	return "translate(" + (junctionParentChart.arcXCenter - self.arcPointerSmallWidth/self.ARC_FACTOR) 
			        	+ "," 
			        	+ (junctionParentChart.arcYTop - self.arcPointerSmallHeight) + ")"
			         })
				     .transition()
				     .duration(200)
				     .style("opacity", .9); 
			   }

		     d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight.selected').classed("exon-highlight", false)
		     d3.selectAll('#transcript-diagram .transcript.selected .selected').classed("selected", false)


		     let donorExon      = self.locateExon(d.donor.pos);
		     let acceptorExon   = self.locateExon(d.acceptor.pos);
		     if (donorExon) {
		      	d3.selectAll('#transcript-diagram .exon-' + donorExon.number).classed("exon-highlight",true);
		      	d3.selectAll('#transcript-diagram .exon-' + donorExon.number).classed("selected",true);
		     }
		     if (acceptorExon) {
		        d3.selectAll('#transcript-diagram .exon-' + acceptorExon.number).classed("exon-highlight", true);
		        d3.selectAll('#transcript-diagram .exon-' + acceptorExon.number).classed("selected", true);
		     }

		     self.showSitePointersOnTranscriptChart(d, self.ySitePointer, "select")

		     let spliceJunctionObject = $.extend({
																     	'type': 'splice-junction', 
																     	'clicked': false, 
																     	'donorExon': donorExon,
																     	'acceptorExon': acceptorExon
																     	}, d)

		     if (!self.clickedObject) {
			     self.$emit("object-selected", spliceJunctionObject)
		     }

		  })
		 .on("mouseout", function(d) {

		 	
		    d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)    
		    d3.selectAll('#transcript-diagram .transcript.selected .clicked').classed("exon-highlight", true)    

		    d3.selectAll("#arc-diagram path.junction.selected").classed("selected", false);
		    d3.selectAll("#arc-diagram path.junction.clicked").classed("selected", true);

		    svg.select(".arc-pointer-small")
			      .transition()
			      .duration(500)
			      .style("opacity", 0); 

			  self.hideSitePointersOnTranscriptChart("select")
			  
		  });


	   let arcLabels = arcGroup.insert("g", "*")
			  .attr("class", "arc-labels")
			  .selectAll("text.junction")
			  .data(edges)
		    .join("text")
		      .attr("class", function(d) {
			    	let clazz = "junction" + " " + d.spliceKind + " " +
			    	(d.countSkippedExons > 0 ? " exon-spanned" : "") + 
			    	(d.strand == "undefined" || d.strand == self.selectedGene.strand ? " strand-matches" : " strand-mismatches");

			    	if (container.indexOf('#zoomed-diagrams') >= 0 && 
		    			self.clickedObject && 
		    			self.clickedObject.type == 'splice-junction' && 
		    			self.clickedObject.key == d.key) {
		    			clazz += " clicked"
		    		}
		    		return clazz;


		    	})
		      .attr("x", function(d) {
		      	return d.arcXCenter
		      })
		      .attr("y", function(d) {
		      	let rando = Math.floor(Math.random() * 31);
		      	let position = d.arcYTop - 40 - rando;
		      	return position < 5 ? 5 : position;
		      })
		      .text(function(d) {
		      	let counts = d.readCount;
		      	if ((counts / 1000000) >= 1)
				      return Math.round(counts / 1000000) + "M";
				    else if ((counts / 1000) >= 1)
				      return Math.round(counts / 1000) + "K";
				    else 
				      return counts;
		      })

		 svg.selectAll("rect.bounding-box").remove();
		 svg
		 .append("rect")
		 .attr("class", "bounding-box")
		 .attr("x", 0)
		 .attr("y", 0)
		 .attr("width", 0)
		 .attr("height", 0)

     svg.selectAll(".arc-pointer").remove();
		 svg
		 .append("polygon")
		 .attr("class", "arc-pointer")
		 .attr("points", function(d) {
		 		return self.arcPointerWidth + ",0 "
		 		       + (self.arcPointerWidth/2) + "," + self.arcPointerHeight 
		 		       + " 0,0"
		 	})
		 .style("opacity", "0")
		 .on('click', function(d) {
		 	  self.unclickSpliceJunction()
		 	}) 

    
    

		 if (container.indexOf('#zoomed-diagrams') >= 0 && self.clickedObject && self.clickedObject.type == 'splice-junction') {
		 	// find the coinciding arc 
		 	let matched = edges.filter(function(d) {
		 		return d.key == self.clickedObject.key;
		 	})
		 	// position to arc-pointer and set opacity to 9
		 	if (matched.length > 0) {
		 		let theClicked = matched[0];
		 		 svg.select(".arc-pointer")
		        .attr("transform", function(d) {
		        	return "translate(" + (theClicked.arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
		        	+ "," 
		        	+ (theClicked.arcYTop - self.arcPointerHeight) + ")"
		         })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 
		 	}

		 }

     svg.selectAll(".arc-pointer-small").remove();
		 svg
		 .append("polygon")
		 .attr("class", "arc-pointer-small")
		 .attr("points", function(d) {
		 		return self.arcPointerSmallWidth + ",0 "
		 		       + (self.arcPointerSmallWidth/2) + "," + self.arcPointerSmallHeight 
		 		       + " 0,0"
		 	})
		 .style("opacity", "0")

		 if (container.indexOf('#zoomed-diagrams') >= 0 && self.clickedObject && self.clickedObject.type == 'splice-junction') {
	     
		 }

		 
		},

    drawArcColorLegend: function(container) {
      let self = this;

      if (!d3.select(container).select('svg').empty()) {
        d3.select(container).select('svg').remove()
      }

      if (self.arcColorScale) {
        let svg = d3.select(container).append('svg')
        .attr("width", "120")
        svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(20,10)");

        var legendOrdinal = d3Legend.legendColor()
        .shape("path", d3.symbol().type(d3.symbolSquare).size(150)())
        .scale(self.arcColorScale)
        .shapePadding(2)


        svg.select(".legendOrdinal")
          .call(legendOrdinal);

        let count = svg.selectAll("path").size()
        svg.attr("height", count*17)

        if (self.colorBy == 'spliceKind') {
          let coords = []
          const regex = /translate\(\s(\d+.\d*)\,\s(\d+.\d*)\)/gm;
          d3.select(".legendCells").selectAll(".cell text")
          .each(function(d,i) {
            let str = d3.select(this).attr("transform")
            let m;
            while ((m = regex.exec(str)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                if (m.length == 3) {
                  let x = m[1];
                  let y = m[2];
                  coords.push({'x': +x + 100, 'y': +y})
                }
            }
          })

          d3.select(container).selectAll("svg .legendCells .cell")
          .each(function(d,i) {
            d3.select(this).classed("hiding", function(d,i) {
              if (self.selectedSpliceKind == null) {
                return false;
              } else if (d == self.selectedSpliceKind ) {
                return false;
              } else {
                return true;
              }
            })
            d3.select(this).classed("showing", function(d,i) {
              if (self.selectedSpliceKind == null) {
                return false;
              } else if (d == self.selectedSpliceKind ) {
                return true;
              } else {
                return false;
              }
            })
            d3.select(this).append("text")
            .attr("transform", function(d1,i1) {
              let coord = coords[i]
              return "translate(" + coord.x + "," + coord.y + ")";
            })
            .attr("class", "legend-cell-show")
            .text(function(d,i) {
              if (self.selectedSpliceKind && d == self.selectedSpliceKind) {
                return 'showing';
              } else {
                return 'show';
              }
            })
            .on("click", function(event, spliceKindToShow) {
              let clicked = d3.select(this);
              d3.select(container).selectAll(".legendCells .legend-cell-show")
              .each(function(legendCellText) {
                if (legendCellText == clicked.datum()) {
                  if (clicked.text() == 'show') {
                    self.selectedSpliceKind = spliceKindToShow;
                  } else {
                    self.selectedSpliceKind = null;
                  }
                }
              })
            })

          })
          let newWidth = +d3.select(container).select('svg').attr('width')
          newWidth += 75
          d3.select(container).select('svg').attr("width", newWidth)
          let newHeight = +d3.select(container).select('svg').attr('height')
          newHeight += 5
          d3.select(container).select('svg').attr("height", newHeight)
        }

      }

    },

		unclickSpliceJunction: function() {
			let self = this;
	    d3.selectAll("#arc-diagram .junction").classed("selected", false);
 	 	  d3.selectAll("#arc-diagram .junction").classed("clicked", false);
 	 	  d3.selectAll("#transcript-diagram .transcript.selected .selected")
 	 	    .classed("selected",false);
 	 	  d3.selectAll("#transcript-diagram .transcript.selected .clicked")
 	 	    .classed("clicked",false);
 	 	  d3.selectAll("#transcript-diagram .transcript.selected .exon-highlight")
 	 	    .classed("exon-highlight",false);
 	 	  d3.selectAll(".arc-pointer")
         .style("opacity", 0)
      d3.selectAll(".arc-pointer-small")
         .style("opacity", 0)
			self.hideSitePointersOnTranscriptChart("select")         
			self.hideSitePointersOnTranscriptChart("click")         
      
 	 	  self.clickedObject = false;
		},


		/*
		 * This method is called when the user clicks on a splice junction 
		 * from main sashimi plot or the genes panel (left side panel)
		 */
    selectSpliceJunction: function(d) {
    	let self = this;

      var delaySelection = false;
      self.snackbarText = ""
      // Turn off the splice kind filter if it is set to exclude cryptic-site
      if (self.selectedSpliceKind != null && self.selectedSpliceKind != 'cryptic-site') {
        self.selectedSpliceKind = null;
        self.snackbarText = "Removing splice junction kind filter in order to show selected splice junction."
        delaySelection = true;

      }
      if (self.minUniquelyMappedReads != null || self.minUniquelyMappedReads > 0 || self.maxUniquelyMappedReads != null || self.maxUniquelyMappedReads > 0) {
        let meetsBottomRange =  self.minUniquelyMappedReads == null || self.minUniquelyMappedReads == "" || +d.readCount >= self.minUniquelyMappedReads
        let meetsTopRange = self.maxUniquelyMappedReads == null || self.maxUniquelyMappedReads == "" || +d.readCount <= self.maxUniquelyMappedReads
        if (!meetsBottomRange || !meetsTopRange) {
          self.minUniquelyMappedReads = meetsBottomRange ? self.minUniquelyMappedReads : 1;
          self.maxUniquelyMappedReads = meetsTopRange ? self.maxUniquelyMappedReads : "";
          self.readCountRange = null;
          self.brushHist.extent([0,0])
          d3.select("#all-histogram").select(".bounding-box.active").classed("active", false)

          self.snackbarText += "\n\nRemoving splice junction read count filter in order to show selected splice junction."
          delaySelection = true;

        }
      }

      if (delaySelection) {
        self.snackbarShow = true;
        self.$nextTick(function() {
          setTimeout(function() {
            self._selectSpliceJunctionImpl(d)
          }, 1000)
        })
      } else {
        self._selectSpliceJunctionImpl(d)
      }
    },

    _selectSpliceJunctionImpl: function(d) {
      let self = this;
      self.showZoomPanel = true;

      // If this is the zoomed diagram, find the counterpart arc in the main chart
      let junctionMainChart = null;
      let nodeMainChart = null;

      let theSpliceJunctions = self.filteredSpliceJunctions;
      if (theSpliceJunctions) {
     	  let matched = theSpliceJunctions.filter(function(edge) {
     		  return edge.key == d.key;
     	  })
     	  if (matched.length > 0) {
     		  junctionMainChart = matched[0];
     		  nodeMainChart = d3.selectAll("#diagrams #arc-diagram g.arcs path.junction")
     		                    .filter(function(spliceJunction) { 
     	                   		  return spliceJunction.key == d.key
     	                      })
     	  }
      }
     
     	if (nodeMainChart && !nodeMainChart.empty()) {
        d3.selectAll("#arc-diagram path.junction").classed("selected", false);
        d3.selectAll("#arc-diagram path.junction").classed("clicked", false);
	  
	      let arcXCenter = junctionMainChart.arcXCenter;
	      let arcYTop    = junctionMainChart.arcYTop;

   	  	nodeMainChart.classed("selected", true)
   	  	nodeMainChart.classed("clicked", true)


				 d3.selectAll("text.junction.selected").classed("selected", false)
				 d3.selectAll("text.junction.clicked").classed("clicked", false)
		     let matchedLabelNode = d3.selectAll("text.junction").filter(function(edge) {
		     		return edge.key == d.key;
		     })
		     if (matchedLabelNode && !matchedLabelNode.empty()) {
		       matchedLabelNode.classed("clicked", true)
		     }


			  d3.selectAll("#diagrams #arc-diagram").select(".arc-pointer")
          .attr("transform", function(d) {
        	  return "translate(" + (arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
        	  + "," 
        	  + (arcYTop - self.arcPointerHeight) + ")"
          })
	      .transition()
	      .duration(200)
	      .style("opacity", .9); 

	   	  d3.selectAll("#diagrams #arc-diagram").select(".arc-pointer-small")
	         .style("opacity", 0)   

	      d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)
	      d3.selectAll('#transcript-diagram .transcript.selected .clicked').classed("clicked", false)

	      if (d.donor.exon) {
	      	d3.selectAll('#transcript-diagram .exon-' + d.donor.exon.number).classed("exon-highlight",true);
	      	d3.selectAll('#transcript-diagram .exon-' + d.donor.exon.number).classed("clicked",true);
	      }
	      if (d.acceptor.exon) {
	        d3.selectAll('#transcript-diagram .exon-' + d.acceptor.exon.number).classed("exon-highlight", true);
	        d3.selectAll('#transcript-diagram .exon-' + d.acceptor.exon.number).classed("clicked", true);
	      }	     
			  self.hideSitePointersOnTranscriptChart("select")
			  self.hideSitePointersOnTranscriptChart("click")
	      self.showSitePointersOnTranscriptChart(d, self.ySitePointer +2, "click")

	      let spliceJunctionObject = $.extend({
															     	'type': 'splice-junction', 
															     	'clicked': true, 
															     	'donorExon': d.donor.exon,
															     	'acceptorExon': d.acceptor.exon
															     	}, d)

	      self.$emit("object-selected", spliceJunctionObject)
	      self.clickedObject = spliceJunctionObject;

	      let regionStart = null;
	      let regionEnd = null;
	      if (self.selectedGene.strand == '-') {
	      	regionStart = d.acceptor.pos - 1000;
	      	regionEnd = d.donor.pos + 1000;
      	} else {
	      	regionStart = d.donor.pos - 1000;
	      	regionEnd = d.acceptor.pos + 1000;
      	}
	      self.selectZoomedSpliceJunction(d, theSpliceJunctions, regionStart, regionEnd)

    		self.showDonorPanel = true;
    		self.showAcceptorPanel = true;
	     	
	     	self.$nextTick(function() {
		     	self.$emit("splice-junction-selected", d)
	     	})


      }

    },

    zoomOutSite: function() {
      let self = this;
      //self.zoomFactor = self.zoomFactor + 10
      self.$emit("set-site-zoom-factor", +10)
      self.$nextTick(function() {
        self.$emit("splice-junction-selected", self.clickedObject)
      })
    },
    

    zoomInSite: function() {
      let self = this;
      //self.zoomFactor = self.zoomFactor - 10
      self.$emit("set-site-zoom-factor", -10)
      self.$nextTick(function() {
        self.$emit("splice-junction-selected", self.clickedObject)
      })
    },
   

    drawAcceptorAndDonorSites: function(donorSequence, acceptorSequence, donorVariants, acceptorVariants) {
    	let self = this;
      let strandStr = self.selectedGene.strand == "+" ? 'plus' : 'minus'
      let donorSiteContainer    = "#site-diagrams." + strandStr + " .donor-site #sequence"
      let acceptorSiteContainer = "#site-diagrams." + strandStr + " .acceptor-site #sequence"
      

      let regionStart = self.clickedObject.donor.pos - self.junctionSiteSeqRange;
      let regionEnd   = self.clickedObject.donor.pos + self.junctionSiteSeqRange;
			let donorExons  = self.selectedTranscript.exons.filter(function(exon) {
      	return (regionStart <= exon.end && regionEnd >= exon.end) ||
               (regionStart <= exon.start && regionEnd >= exon.start) ||
              (exon.start <= regionStart && exon.end >= regionEnd);
      })

      self.drawSiteSequenceDiagram(
        'donor',
        donorSiteContainer, 
      	donorSequence, 
      	self.clickedObject.donor.pos - self.junctionSiteSeqRange, 
      	self.clickedObject.donor.pos + self.junctionSiteSeqRange,
      	self.selectedGene.strand == "+" ? self.clickedObject.donor.pos+1 : self.clickedObject.donor.pos,
      	self.selectedGene.strand == "+" ? self.clickedObject.donor.pos+2 : self.clickedObject.donor.pos-1,
      	donorExons,
        donorVariants)

      regionStart = self.clickedObject.acceptor.pos - self.junctionSiteSeqRange;
      regionEnd = self.clickedObject.acceptor.pos + self.junctionSiteSeqRange;
			let acceptorExons = self.selectedTranscript.exons.filter(function(exon) {
      	return (regionStart <= exon.end && regionEnd >= exon.end) ||
               (regionStart <= exon.start && regionEnd >= exon.start) ||
              (exon.start <= regionStart && exon.end >= regionEnd);
      })

      self.drawSiteSequenceDiagram(
        'acceptor',
        acceptorSiteContainer, 
      	acceptorSequence, 
      	self.clickedObject.acceptor.pos - self.junctionSiteSeqRange,
      	self.clickedObject.acceptor.pos + self.junctionSiteSeqRange,
      	self.selectedGene.strand == "+" ? self.clickedObject.acceptor.pos-1 : self.clickedObject.acceptor.pos+1,
      	self.selectedGene.strand == "+" ? self.clickedObject.acceptor.pos : self.clickedObject.acceptor.pos+2,
      	acceptorExons,
        acceptorVariants)

    },

    drawSiteSequenceDiagram: function(junctionSite, container, sequence, regionStart, regionEnd, siteStart, siteEnd, exons, variants) {
			let self = this;

		  // dimensions
			var width =  self.$el.offsetWidth/2;
		  var height = 100;
		  var margin = {top: 20, right: 10, bottom: 0, left: 15};

		  var innerWidth  = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;

		  var center = innerWidth / 2;

		  // scales
		  let x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth+margin.left]);
		  self.xSeqChart = x;

      var tickFormatter = function(d,i) {
        if (i == 0 ) {
          return d3.format(",")(d)
        } else {
          let tokens = d3.format(",")(d).split(",");
          return tokens[tokens.length-1]
        }
      }

      // x axis
      var xAxis = d3.axisTop(x)
                    .tickFormat(tickFormatter);                      


		  // append the svg object to the body of the page
		  d3.select(container).select("svg").remove();
      var svg = d3.select(container)
      .append("svg")
      .attr("width", innerWidth)
      .attr("height", height);

      var groupAxis = svg
      .append("g")
      .attr("class", "axis")
      .attr("transform",
           "translate(" + margin.left + "," + margin.top + ")")
      .call(xAxis);

      // Strand arrow
      groupAxis.selectAll(".arrow").remove();
      groupAxis.selectAll('.arrow')
      .data([
          {'gene': self.selectedGene, 'x': center - center/2},
          {'gene': self.selectedGene, 'x': center},
          {'gene': self.selectedGene, 'x': center + center/2},
      ])
      .enter().append('path')
      .attr('class', 'arrow')
      .attr('d', function(d) {
        return self.centerArrow(d, innerHeight, 15)
      })
      .style('transform', 'translate(-10px, -39px)')         


      var groupAltSeq = svg
      .append("g")
      .attr("class", "alt-seq")
      .attr("transform",
           "translate(" + margin.left + "," + (margin.top) + ")")

      var groupSeq = svg
      .append("g")
      .attr("class", "ref-seq")
      .attr("transform",
           "translate(" + margin.left + "," + (margin.top+15) + ")")

      var groupExon = svg
      .append("g")
      .attr("class", "exon-seq")
      .attr("transform",
           "translate(" + margin.left + "," + (margin.top+15) + ")")
       
      // Reference sequence
      let seqWidth = x(regionStart+1) - x(regionStart)
      if (seqWidth > 6) {
        // Nucleotide sequence
        groupSeq
        .selectAll("text.seq")
        .data(Array.from(sequence))
        .enter()
        .append("text")
        .attr("class", function(d,i) {
          if (regionStart+i == siteStart) { 
            return "seq site " + d.toUpperCase();
          } else if (regionStart+i == siteEnd) {
            return "seq site " + d.toUpperCase();
          } else {
            return "seq " + d.toUpperCase();
          }
        })
        .attr("x", function(d,i) {
          return x(regionStart+i)
        })
        .attr("y", "30")
        .text(function(d) {
          return d;
        })

      } else {
        // We have narrow width to show sequence, so show colored rectangles
        // instead
        groupSeq
        .selectAll("rect.seq")
        .data(Array.from(sequence))
        .enter()
        .append("rect")
        .attr("class", function(d,i) {
          if (regionStart+i == siteStart) { 
            return "seq site " + d.toUpperCase();
          } else if (regionStart+i == siteEnd) {
            return "seq site " + d.toUpperCase();
          } else {
            return "seq " + d.toUpperCase();
          }
        })
        .attr("x", function(d,i) {
          return x(regionStart+i)
        })
        .attr("y", "10")
        .attr("width", seqWidth)
        .attr("height", 12)

      }

      // Alt sequence
      if (seqWidth > 6) {
        let altSequence = [];
        let altCaretSequence = [];
        variants.forEach(function(variant) {
          let bases = variant.type == 'DEL' ? Array.from(variant.ref) : Array.from(variant.alt)
          let startPos = variant.type == 'INS' || variant.type == 'DEL' ? 1 : 0;
          for (var i = startPos; i < bases.length; i++) {
            let altObj = {'variant': variant, 'index': i, 'altNucleotide': bases[i]};
            if (variant.type == 'DEL') {
              altObj.lineThrough = true
            }
            altSequence.push(altObj)
            if (variant.type == 'INS' && i == startPos) {
              altCaretSequence.push(altObj)
            }
          }
        })

        // Nucleotide sequence
        groupAltSeq
        .selectAll("text.seq.alt")
        .data(altSequence)
        .enter()
        .append("text")
        .attr("class", function(d,i) {
          return "seq alt " + d.altNucleotide.toUpperCase()
        })
        .attr("x", function(d,i) {
          if (d.variant.type == 'INS') {
            return x(d.variant.start+d.index) - ((x(d.variant.start+1) - x(d.variant.start))/2)
          } else {
            return x(d.variant.start + d.index)
          }
        })
        .attr("y", "30")
        .text(function(d) {
          return d.altNucleotide;
        })
        .style('text-decoration', function(d) {
          if (d.variant.type == 'DEL') {
            return 'line-through';
          } else {
            return 'initial'
          }
        })

        // Nucleotide sequence
        groupAltSeq
        .selectAll("text.seq.alt.caret")
        .data(altCaretSequence)
        .enter()
        .append("text")
        .attr("class", function(d,i) {
          return "seq alt caret";
        })
        .attr("x", function(d,i) {
          return x(d.variant.start+d.index) - ((x(d.variant.start+1) - x(d.variant.start))/2)
        })
        .attr("y", "40")
        .text(function(d) {
          if (d.variant.type == 'INS') {
            return "^"
          }          
        })

      } else {
        // We have narrow width to show sequence, so show colored rectangles
        // instead
        groupAltSeq
        .selectAll("rect.seq.alt")
        .data(variants)
        .enter()
        .append("rect")
        .attr("class", function(d,i) {
          return "seq alt " + d.alt.toUpperCase()
        })
        .attr("x", function(d,i) {
          return x(d.start)
        })
        .attr("y", "10")
        .attr("width", seqWidth)
        .attr("height", 12)

      }


      // Exon on or near donor/acceptor site
      groupExon
      .selectAll("rect.exon")
      .data(function(d) { 
          return exons
      }, 
        function(d) {return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;}
      )
      .enter()
      .append("rect")
      .attr("x", function(d){ return(x(d.start))})
      .attr("y", function(d,i) {
        if (d.feature_type.toLowerCase() == 'utr') {
          return 30 + 7;
        } else {
          return 30 + 5;
        }
      })
      .attr("width", function(d) { 
        return Math.max(1, Math.round(x(d.end) - x(d.start))+1)
      })
      .attr("height", function(d) { 
        if (d.feature_type.toLowerCase() == 'utr') {
          return 7;
        } else {
          return 10;
        }
      })
      .attr("class", function(d) {
        return 'transcript-feature ' +
               d.feature_type + 
               (" exon-" + d.number) + 
               " no-pointer selected exon-highlight";
      })

      let sitePos = siteStart + ((siteEnd-siteStart)/2);


      // Exon label
      groupExon
      .selectAll("text.exon-label")
      .data(function(d) { 
          return exons
      }, 
          function(d) {return d.feature_type + "-" + d.seq_id + "-" + d.start + "-" + d.end;}
      )
      .enter()
      .append("text")
      .attr("class", "exon-label")
      .attr("x", function(d) { 
        if (x(d.start) >= 0 && (x(d.start) < innerWidth - 20) ) {
          return x(d.start) + 20
        } else if (x(d.end) >= 0 && (x(d.end) < innerWidth - 20) ) {
          return x(d.end) - 20
        } else {
          return x(sitePos) - 20;
        }
      })
      .attr("y", function(d,i) {
        return 60;
      })  
      .style("text-anchor", function(d) {
        if (x(d.start) >= 0) {
          return "start"
        } else if (x(d.end) >= 0) {
          return "end"
        }
      })
      .text(function(d) {
        return 'Exon ' + d.number;
      })

      // Site pointers 
      let ySitePointer = 65;
      if (junctionSite == 'donor') {
        groupExon.selectAll(".donor-pointer").remove();
        groupExon
        .append("polygon")
        .attr("class", "donor-pointer")
        .attr("points", function(d) {
          return self.sitePointerWidth + ",0 "
                 + (self.sitePointerWidth/2) + ",-" + self.sitePointerHeight 
                 + " 0,0"
        })
        .style("opacity", "0")

        groupExon.selectAll(".donor-problem").remove();
        groupExon
        .append("text")
        .attr("class", "donor-problem")
        .attr("x", 0)
        .attr("y", 0)
        .style("opacity", "0")
        .text(function(d1) {
          return self.clickedObject.donor.delta ? self.clickedObject.donor.delta : "!"
        })

        // position the donor pointers
        groupExon.select(".donor-pointer")
        .attr("transform", function(d1) {
        return "translate(" + 
               (x(sitePos) - (self.sitePointerWidth/2))  + 
               "," + ySitePointer + ")"
        })
        .transition()
        .duration(200)
        .style("opacity", .9); 

        // Show marker below donor pointer if site is cryptic-site
        if (self.clickedObject.donor.status && self.clickedObject.donor.status == 'cryptic-site') {
          groupExon
          .select(".donor-problem")
          .attr("x", function(d1) {
              return (x(sitePos) ) 
          })
          .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
          .transition()
          .duration(200)
          .style("opacity", .9); 


        }       

      }

      // Pointers
      if (junctionSite == 'acceptor') {
        groupSeq.selectAll(".acceptor-pointer").remove();
        groupSeq
        .append("polygon")
        .attr("class", "acceptor-pointer")
        .attr("points", function(d) {
          return self.sitePointerWidth + ",0 "
                 + (self.sitePointerWidth/2) + ",-" + self.sitePointerHeight 
                 + " 0,0"
        })
        .style("opacity", "0")  

        groupSeq.selectAll(".acceptor-problem").remove();
        groupSeq
        .append("text")
        .attr("class", "acceptor-problem")
        .attr("x", 0)
        .attr("y", 0)
        .style("opacity", "0")
        .text(function(d1) {
          return self.clickedObject.acceptor.delta ? self.clickedObject.acceptor.delta : "!"
        })

        // position the acceptor pointers
        groupSeq.select(".acceptor-pointer")
        .attr("transform", function(d1) {
          return "translate(" + 
                 (x(sitePos) - (self.sitePointerWidth/2))  + 
                 "," + ySitePointer + ")"
        })
        .transition()
        .duration(200)
        .style("opacity", .9); 

        // Show marker below acceptor pointer if acceptor site is cryptic-site
        if (self.clickedObject.acceptor.status && self.clickedObject.acceptor.status == 'cryptic-site') {
          groupSeq
          .select(".acceptor-problem")
          .attr("x", function(d1) {
              return (x(sitePos) ) 
          })
          .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
          .transition()
          .duration(200)
          .style("opacity", .9); 
        }       
      }

    },

    selectZoomedSpliceJunction: function(d, theSpliceJunctions, regionStart, regionEnd) {
    	let self = this;

			let filteredEdges = theSpliceJunctions.filter(function(edge) {
	      return (edge.donor.pos >= regionStart && edge.donor.pos <=regionEnd) ||
               (edge.acceptor.pos >= regionStart && edge.acceptor.pos <=regionEnd) 
	    })
	    let filteredEdgesClone = [];
	    filteredEdges.forEach(function(d) {
	    	let edge = $.extend({}, d)
	    	filteredEdgesClone.push(edge);
	    })
      self.showZoomPanel = true;
	    d3.selectAll("#zoomed-diagrams svg").remove()
	    self.drawArcDiagram("#zoomed-diagrams", filteredEdgesClone, regionStart, regionEnd, 
          {'createBrush': false, 
           'allEdges': self.filteredSpliceJunctions,
           'showXAxis': true, 
           'marginRight': 0,
           'showJunctionArrow': true,
           'isZoomedRegion': true})

	    self.drawTranscriptDiagram("#zoomed-diagrams #transcript-diagram", self.selectedGene, regionStart, regionEnd, 
	      {'selectedTranscriptOnly': true, 'allowSelection': false, marginRight: 0})



      if (self.variants && self.variants.length > 0) {
        let filteredVariants = self.variants.filter(function(d) {
          return d.start >= regionStart && d.start <= regionEnd
        }).map(function(d) {
          let variant = $.extend({}, d)
          variant.level = 0;
          return variant;
        })
        self.vcf.pileupVariants(filteredVariants, regionStart, regionEnd, self.$el.offsetWidth - 20)
        self.drawVariantDiagram("#zoomed-diagrams #variant-diagram", regionStart, regionEnd, filteredVariants)       
      }
		},
				 

		showSitePointersOnTranscriptChart: function(d, ySitePointer, action="select") {
			let self = this;
      // Show the pointers on the transcript chart
      if (action == "select") {
	      if (self.xTranscriptChart) {
	      	// Show a pointer below donor site
	      	d3.selectAll("#diagrams #transcript-diagram .donor-pointer-small")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChart(d.donor.pos) - (self.sitePointerSmallWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		      // Show an * below donor pointer if donor site is cryptic-site
		      if (d.donor.status && d.donor.status == 'cryptic-site') {
		     		d3.selectAll("#diagrams #transcript-diagram .donor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
              .text(function(d1) {
                return d.donor.delta && d.donor.delta != 0 ? ((d.donor.delta > 0 ? '+' : '') + d.donor.delta) : "!";
              })
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
		      }

			    // Show a pointer below acceptor site
	      	d3.selectAll("#diagrams #transcript-diagram .acceptor-pointer-small")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChart(d.acceptor.pos) - (self.sitePointerSmallWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		      // Show an * below acceptor pointer if acceptor site is cryptic-site
		      if (d.acceptor.status && d.acceptor.status == 'cryptic-site') {
		     		d3.selectAll("#diagrams #transcript-diagram .acceptor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
              .text(function(d1) {
                return d.acceptor.delta && d.acceptor.delta != 0 ? ((d.acceptor.delta > 0 ? '+' : '') + d.acceptor.delta) : "!";
              })
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
		      }

	      }
	      // Now show the pointers on the zoomed transcript chart (if it is present)
	      if (self.xTranscriptChartZoomed) {

	      	// donor site pointer
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-pointer-small")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChartZoomed(d.donor.pos) - (self.sitePointerSmallWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		      // Show an * below donor pointer if donor site is cryptic-site
		      if (d.donor.status && d.donor.status == 'cryptic-site') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
              .text(function(d1) {
                return d.donor.delta && d.donor.delta != 0 ? ((d.donor.delta > 0 ? '+' : '') + d.donor.delta) : "!";
              })							
              .transition()
		      		.duration(200)
		      		.style("opacity", .9); 
		      }


			    // acceptor site pointer
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-pointer-small")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChartZoomed(d.acceptor.pos) - (self.sitePointerSmallWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		      // Show an * below acceptor pointer if acceptor site is cryptic-site
		      if (d.acceptor.status && d.acceptor.status == 'cryptic-site') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
              .text(function(d1) {
                return d.acceptor.delta && d.acceptor.delta != 0 ? ((d.acceptor.delta > 0 ? '+' : '') + d.acceptor.delta) : "!";
              })							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
		      }

	      }
      	
      } else if (action == "click") {
      	//
      	// When a splice junction is clicked 
      	//

      	// Donor pointer
	      if (self.xTranscriptChart) {
	      	d3.selectAll("#diagrams #transcript-diagram .donor-pointer")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChart(d.donor.pos) - (self.sitePointerWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 


		      // Show an * below donor pointer if donor site is cryptic-site
		      if (d.donor.status && d.donor.status == 'cryptic-site') {
		     		d3.selectAll("#diagrams #transcript-diagram .donor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.donor.pos)) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 2)
              .text(function(d1) {
                return d.donor.delta && d.donor.delta != 0 ? ((d.donor.delta > 0 ? '+' : '') + d.donor.delta) : "!";
              })
							.transition()
		      		.duration(200)
		      		.style("opacity", .9) 
		      	
		      }

			    // Acceptor pointer
	      	d3.selectAll("#diagrams #transcript-diagram .acceptor-pointer")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChart(d.acceptor.pos) - (self.sitePointerWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 


		      // Show an * below acceptor pointer if acceptor site is cryptic-site
		      if (d.acceptor.status && d.acceptor.status == 'cryptic-site') {
		     		d3.selectAll("#diagrams #transcript-diagram .acceptor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 2)
              .text(function(d1) {
                return d.acceptor.delta && d.acceptor.delta != 0 ? ((d.acceptor.delta > 0 ? '+' : '') + d.acceptor.delta) : "!";
              })
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
		      }

	      }
	      // Show the pointers on the zoomed transcript chart
	      if (self.xTranscriptChartZoomed) {
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-pointer")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChartZoomed(d.donor.pos) - (self.sitePointerWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9);


		      // Show an * below donor pointer if donor site is cryptic-site
		      if (d.donor.status && d.donor.status == 'cryptic-site') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 2)
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
            d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem") 
              .text(function(d1) {
                return d.donor.delta && d.donor.delta != 0 ? ((d.donor.delta > 0 ? '+' : '') + d.donor.delta) : "!";
              })
		      }

	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-pointer")
	      	  .attr("transform", function(d1) {
		        	return "translate(" + 
		        	       (self.xTranscriptChartZoomed(d.acceptor.pos) - (self.sitePointerWidth/2))  + 
		        	       "," + ySitePointer + ")"
		        })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		      // Show an * below acceptor pointer if acceptor site is cryptic-site
		      if (d.acceptor.status && d.acceptor.status == 'cryptic-site') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 2)
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
            d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem") 
            .text(function(d1) {
              return d.acceptor.delta && d.acceptor.delta != 0 ? ((d.acceptor.delta > 0 ? '+' : '') + d.acceptor.delta) : "!";
            })
  
		      }
	      }

      }

		},
		hideSitePointersOnTranscriptChart: function(action="select") {
			let self = this;
      // Show the pointers on the transcript chart
      if (action == "select") {
	      if (self.xTranscriptChart) {
	      	d3.selectAll("#diagrams #transcript-diagram .donor-pointer-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#diagrams #transcript-diagram .acceptor-pointer-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
					d3.selectAll("#diagrams #transcript-diagram .donor-problem-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 			      
					d3.selectAll("#diagrams #transcript-diagram .acceptor-problem-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 			      
	      }
	      // Hide the pointers on the zoomed transcript chart
	      if (self.xTranscriptChartZoomed) {
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-pointer-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-pointer-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem-small")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      }
      	
      } else if (action == "click") {
	      if (self.xTranscriptChart) {
	      	d3.selectAll("#diagrams #transcript-diagram .donor-pointer")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#diagrams #transcript-diagram .acceptor-pointer")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#diagrams #transcript-diagram .donor-problem")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#diagrams #transcript-diagram .acceptor-problem")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      }
	      // Hide the pointers on the zoomed transcript chart
	      if (self.xTranscriptChartZoomed) {
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-pointer")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-pointer")
			      .transition()
			      .duration(200)
			      .style("opacity", .0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem")
			      .transition()
			      .duration(200)
			      .style("opacity", 0); 
	      	d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem")
			      .transition()
			      .duration(200)
			      .style("opacity", .0); 
	      }

      }

		},
    classifyByImpact(d) {
      let self = this;
      var colorimpacts = "";


      var colorImpactList = d.vepImpact
      for (var key in colorImpactList) {
        colorimpacts += " " + 'impact_'+key;
      }
      if (colorimpacts == "") {
        colorimpacts = "impact_none";
      }
      let matchedSplice = Object.keys(d.vepConsequence).filter(function(consequence) {
            return consequence.indexOf('splice') >= 0;
      })

      return  'variant ' + d.type.toLowerCase()  + ' ' + colorimpacts + ' ' + (matchedSplice.length > 0 ? ' splicing' : '');
    },
   
    drawVariantDiagram: function(container, regionStart, regionEnd, variants) {
      let self = this;
      let data = variants;
      let width = self.$el.offsetWidth - 20

      let margin = {top: self.arcPointerSmallHeight, bottom: 0, left: 0, right: 5}

      let variantHeight = self.variantHeight;
      let variantWidth  = self.variantWidth;
      let verticalPadding = 3;

      let borderRadius = 1;

      let maxLevel = d3.max(data, function(d) {
        return d.level;
      });
      // Recalculate the height based on the number of levels.
      let height = (maxLevel+1) * (variantHeight + verticalPadding);
      height += margin.top + margin.bottom;

      // determine inner height (w/o margins)
      var innerHeight = height - margin.top - margin.bottom;
      var innerWidth  = width - margin.left - margin.right;

      // scales
      var x = d3.scaleLinear();
      x.domain([regionStart, regionEnd]);
      x.range([0, innerWidth]);


      var symbolScaleCircle = d3.scaleOrdinal()
                    .domain([3,4,5,6,7,8,10,12,14,15,16])
                    .range([9,15,25,38,54,58,70,100,130,220,260]);
      var symbolSizeCircle = symbolScaleCircle(variantHeight);

      var symbolScale = d3.scaleOrdinal()
                    .domain([3,4,5,6,7,8,10,12,14,15,16])
                    .range([9,15,20,25,32,58,70,100,130,140,160]);

      var symbolSize = symbolScale(variantHeight);

      var symbolScaleWye = d3.scaleOrdinal()
                    .domain([3,4,5,6,7,8,10,12,14,15,16])
                    .range([11,17,22,27,32,58,70,100,130,140,160]);

      var symbolSizeWye = symbolScaleWye(variantHeight*1.5);

    
      // Select the svg element, if it exists.
      d3.select(container).select("svg").remove();
      var svg = d3.select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

      svg.append("text")
      .attr("x", 5)
      .attr("y", 12)
      .text("Variants")

      let group = svg
        .append("g")
        .attr("class", "group")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
     

      var variantGroup = group
      .append('g')
      .attr('class', 'track variants')

      // Insert symbols for variants
      variantGroup.selectAll('path.variant')
      .data(data)
      .enter()
      .append('path')
      .attr("d", function(d,i) {
        let matchedSplice = Object.keys(d.vepConsequence).filter(function(consequence) {
            return consequence.indexOf('splice') >= 0;
        })
        if (matchedSplice.length > 0) {
           return d3.symbol(d3.symbolWye)
                   .size(symbolSizeWye)();

        } else if (d.type.toUpperCase() == 'INS') {
          
          return d3.symbol(d3.symbolCircle)
                   .size(symbolSizeCircle)();

        } else if (d.type.toUpperCase() == 'DEL') {
          return d3.symbol(d3.symbolTriangle)
                   .size(symbolSize)();

        } else if (d.type.toUpperCase() == 'COMPLEX') {
          return d3.symbol(d3.symbolDiamond)
                   .size(symbolSize)();
        } else if (d.type.toUpperCase() == 'SNP' || d.type.toUpperCase() == 'MNP') {
          return d3.symbol(d3.symbolSquare)
                   .size(symbolSize)();
        }
      })
      .attr('class', function(d) { return self.classifyByImpact(d); })
      .attr("transform", function(d) {
        var xCoord = Math.round(x(d.start) + (variantWidth/2));
        var yCoord = innerHeight - ((d.level + 1) * (variantHeight + verticalPadding));
        var tx = "translate(" + xCoord + "," + yCoord + ")";
        
        // Keep track of position of variant symbol. We will use these 
        // coordinates when drawing a circle around a variant or 
        // drawing a pointer above the variant
        d.x = xCoord;
        d.y = yCoord;
        return tx;
       });

      variantGroup.selectAll("path.variant")
      .on("click", function(event, d) {
         let matchedSplice = Object.keys(d.vepConsequence).filter(function(consequence) {
            return consequence.indexOf('splice') >= 0;
         })
         let variantObject = {'type': 'variant', 'clicked': true, 'variant': d, 'isSpliceVariant': matchedSplice.length > 0};

         self.$emit("object-selected", variantObject)
         self.clickedObject = variantObject;

      })

      // draw a circle around splice variants
      /*
      variantGroup.selectAll('circle.splicing')
      .data(function(d) {
        return data.filter( function(d) { 
          let matchedSplice = Object.keys(d.vepConsequence).filter(function(consequence) {
            return consequence.indexOf('splice') >= 0;
          })
          return matchedSplice.length > 0;
        }) ;
      })
      .enter()
      .append('circle')
      .attr('class', "splicing")
      .attr('r', variantHeight )
      .attr("transform", function(d) {
        var xCoord = d.x;
        var yCoord = d.y
        var tx = "translate(" + xCoord + "," + yCoord + ")";
        return tx;
       });
       */


      variantGroup.exit().remove();




      variantGroup.selectAll(".variant")
      .on("click", function(event, d) {
        /*
        if (self.clickedObject && self.clickedObject.type == 'variant' && self.clickedObject.variant == d) {

          self.clickedObject = null;
          svg.select(".variant-pointer")
          .transition()
          .duration(200)
          .style("opacity", .0); 
          return;
        }

        let matchedSplice = Object.keys(d.vepConsequence).filter(function(consequence) {
          return consequence.indexOf('splice') >= 0;
        })
        let variantObject = {'type': 'variant', 'clicked': true, 'variant': d, 'isSpliceVariant': matchedSplice.length > 0};

        self.$emit("object-selected", variantObject)
        self.clickedObject = variantObject;


        svg.select(".variant-pointer-small")
          .transition()
          .duration(100)
          .style("opacity", 0);           
        svg.select(".variant-pointer")
          .attr("transform", function(d1) {
            return "translate(" + (d.x - (self.arcPointerWidth/2))
            + "," 
            + (d.y  - self.arcPointerHeight - 4) + ")"
           })
          .transition()
          .duration(200)
          .style("opacity", .9); 
          */

      })
      .on('mouseover', function(event, d) {

          svg.select(".variant-pointer-small")
          .attr("transform", function(d1) {
            return "translate(" + (d.x  - (self.arcPointerSmallWidth/2))
            + "," 
            + (d.y - self.arcPointerSmallHeight - 4) + ")"
           })
          .transition()
          .duration(150)
          .style("opacity", .9); 

          let tooltipContent = d.type + " " + d.chrom + ":" + d.start + " " + d.ref + " > " + d.alt + "<br>" + "Impact " + Object.keys(d.vepImpact).join(", ") + "<br>" + Object.keys(d.vepConsequence).join(", ").split("_").join(" ");

          d3.select('.tooltip')
          .html(tooltipContent)

          let tooltipWidth = d3.select('.tooltip').node().getBoundingClientRect().width
          let tooltipHeight = d3.select('.tooltip').node().getBoundingClientRect().height

          let offsetY = d3.select(container).node().getBoundingClientRect().y
          let offsetX = d3.select(container).node().getBoundingClientRect().x

          let scrollOffset = $('html').scrollTop()


          let tooltipY =  offsetY + margin.top + d.y - self.arcPointerSmallHeight - 4 - tooltipHeight + scrollOffset;
          let tooltipX =  offsetX + d.x  - (self.arcPointerSmallWidth/2)
          d3.select('.tooltip')
          .style("top",+ tooltipY + 'px') 
          .style("left",  tooltipX + 'px')
          .transition()
          .duration(150)
          .style("opacity", .9); 

      })
      .on('mouseout', function(event, d) {
        svg.select(".variant-pointer-small")
          .transition()
          .duration(150)
          .style("opacity", 0); 
        d3.select('.tooltip')
          .transition()
          .duration(150)
          .style("opacity", 0); 

      })


      svg.selectAll("rect.bounding-box").remove();
        svg
         .append("rect")
         .attr("class", "bounding-box")
         .attr("x", 0)
         .attr("y", 0)
         .attr("width", 0)
         .attr("height", 0)      

      variantGroup.selectAll(".variant-pointer").remove();
      variantGroup
      .append("polygon")
      .attr("class", "variant-pointer")
      .attr("points", function(d) {
        return self.arcPointerWidth + ",0 "
               + (self.arcPointerWidth/2) + "," + self.arcPointerHeight 
               + " 0,0"
      })
      .style("opacity", "0")
      .on('click', function(d) {
        //self.unclickVariant()
      }) 	

      variantGroup.selectAll(".variant-pointer-small").remove();
      variantGroup
      .append("polygon")
      .attr("class", "variant-pointer-small")
      .attr("points", function(d) {
        return self.arcPointerSmallWidth + ",0 "
               + (self.arcPointerSmallWidth/2) + "," + self.arcPointerSmallHeight 
               + " 0,0"
      })
      .style("opacity", "0")
      
    },

    getMaxLocal: function(data, numberBins) {
      let self = this;

      let groupedData = d3.group(data, function(d) {
        return d.spliceKind;
      })
      let histData = []
      for (let d of groupedData.entries()) {
        let key        = d[0];
        let group      = d[1];
        let groupCount = group.length;

        var localMin = d3.min(group, function(d) {
          return d.readCount;
        });
        var localMax = d3.max(group, function(d) {
          return d.readCount;
        });

        let histogram = d3.histogram()
          .domain([0, localMax])
          .thresholds(numberBins)
          .value(function(d) { return d.readCount; })
        let bins = histogram(group)

        var obj = {};
        obj["key"]       = key;
        obj["bins"]      = bins;
        obj["maxFreq"]       = d3.max(bins, function(d) {
          return d.length;
        });
        obj["maxReadCount"]  = d3.max(bins, function(d) {
          return d.x1;
        });

        histData.push(obj)
      }
      let maxFreq = d3.max(histData, function(d) {
        return d.maxFreq;
      })
      let maxReadCount = d3.max(histData, function(d) {
        return d.maxReadCount;
      })
      return {'maxFreq': maxFreq, 'maxReadCount': maxReadCount }
    },

    drawReadCountHistogram: function(container, spliceKind, title, options, readCountRange) {
      let self = this;
      let spliceJunctions = self.geneModel.geneToSpliceJunctionObjects[self.selectedGene.gene_name]
      if (spliceJunctions == null) {
        return;
      }


      let data = spliceJunctions.filter(function(spliceJunction) {
        let isKind = spliceKind == null || spliceKind == spliceJunction.spliceKind;
        let withinRange = readCountRange ? (spliceJunction.readCount >= readCountRange[0] && spliceJunction.readCount < readCountRange[1]) : true;
        return isKind && withinRange;
      })
      let dataForRange = spliceJunctions.filter(function(spliceJunction) {
        let withinRange = readCountRange ? (spliceJunction.readCount >= readCountRange[0] && spliceJunction.readCount < readCountRange[1]) : true;
        return withinRange;
      })
      let dataForSpliceKind = spliceJunctions.filter(function(spliceJunction) {
        let isKind = spliceKind == null || spliceKind == spliceJunction.spliceKind;
        return isKind;
      })


      let count = dataForSpliceKind.length;
      let mean = Math.round(d3.mean(dataForSpliceKind, function(d) {
        return d.readCount;
      }))
      let median = Math.round(d3.median(dataForSpliceKind, function(d) {
        return d.readCount;
      }))
      let std = Math.round(d3.deviation(dataForSpliceKind, function(d) {
        return d.readCount;
      }))

      let numberBins = 30;

      // We set the max y to the highest frequency across all
      // bins across all three splice kinds. That will allow
      // a uniform y axis across the three histograms.
      let maxLocal     =  self.getMaxLocal(dataForRange, numberBins)
      let maxY         = maxLocal.maxFreq;
      let maxReadCount = maxLocal.maxReadCount;


      // set the dimensions and margins of the graph
      var margin = {top: 20, right: 10, bottom: 45, left: 35},
          width = 220 - margin.left - margin.right,
          height = 120 - margin.top - margin.bottom;

      
      // append the svg object to the body of the page
      var svg = d3.select(container).select("#read-count-histogram")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

      // X axis: scale and draw:
      var x = d3.scaleLinear()
          .domain([0, maxReadCount])   
          .range([0, width]);

      if (options && options.createBrush) {
        self.xBrushableHist = x;
      }

      var tickFormatter = function(d) {
        if ((d / 1000000) >= 1)
          return Math.round(d / 1000000) + "M";
        else if ((d / 1000) >= 1)
          return Math.round(d / 1000) + "K";
        else
          return d;
      }
      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(x).ticks(6).tickFormat(tickFormatter));

      svg.append("text")
         .attr("class", "histogram-text")
         .attr("x", (width / 2))
         .attr("y", -10)
         .style("text-anchor", "middle")
         .text(title + " (" + count + ")")


      svg.append("text")
         .attr("class", "histogram-text")
         .attr("x", (width / 2))
         .attr("y", height + margin.top + 10)
         .style("text-anchor", "middle")
         .text("Read count")

      svg.append("text")
         .attr("class", "histogram-text")
         .attr("x", (width / 2))
         .attr("y", height + margin.top + 20)
         .style("text-anchor", "middle")
         .style("font-size", "10px")
         .html('mean:&nbsp;' + mean + "&nbsp;&nbsp;" + '&#x3C3;&nbsp;:' + std)

      svg.append("text")
         .attr("class", "histogram-text")
         .attr("x", 0)
         .attr("y", height)
         .style("text-anchor", "middle")
         .style("transform", "translate(-112px, 30px)rotate(-90deg)")
         .text(function(d) {
            if (self.scaleYHist == 'density') {
              return 'Density %'
            } else {
              return 'Frequency'
            }
          })



      // set the parameters for the histogram
      var histogram = d3.histogram()
          .domain(x.domain())  // then the domain of the graphic
          .thresholds(x.ticks(numberBins)) // then the numbers of bins
          .value(function(d) { return d.readCount; })   // I need to give the vector of value

      // And apply this function to data to get the bins
      var bins = histogram(data);

      // Calculate cumulative density
      if (self.scaleYHist == 'density') {
        var last = 0;
        let n = data.length;
        for(var i=0; i < bins.length; i++){
          bins[i]['cum'] = last + bins[i].length;
          last = bins[i]['cum'];
          bins[i]['cum'] = bins[i]['cum']/n;
        }
      }


      // Y axis: scale and draw:
      var y = null;
      if (self.scaleYHist == 'log') {
        y = d3.scaleLog()
            .range([height, 0])
            .domain([.01,maxY]);   // d3.hist has to be called before the Y axis obviously
      } else if (self.scaleYHist == 'normal') {

        y = d3.scaleLinear()
            .range([height, 0])
            .domain([0,maxY]);   // d3.hist has to be called before the Y axis obviously

      } else if (self.scaleYHist == 'density') {
        y = d3.scaleLinear()
              .range([height, 0])
              .domain([0, 1]);
      }
      svg.append("g")
          .attr("class", "y-axis")
          .call(d3.axisLeft(y).ticks(5));


      let getBarMinValue = function(val, max) {
        if (val > 0 && maxY * .05 > val) {
            val = maxY * .05;
        }
        return val;
      }

      // Add a rect for each bin.
      svg.append("g")
        .attr("class", "histogram-bars")
        .selectAll()
        .data(bins)
        .join("rect")
          .attr("class", "histogram-bar")
          .attr("x", (d) => x(d.x0) + 1)
          .attr("width", (d) => Math.max(1, x(d.x1) - x(d.x0) - 1))
          .attr("y", function(d) {
            if (self.scaleYHist == 'density') {
              return y(d.cum)
            } else {
              return  y(getBarMinValue(d.length));
            }
          })
          .attr("height", function(d) {
            if (self.scaleYHist == 'density') {
              return height - y(d.cum);
            } else {
              return height - y(getBarMinValue(d.length));
            }
          });

      if (self.scaleYHist == 'density') {
        // Draw CDF (cumulative density function) line
        var guide = d3.line()
                      .x(function(d){ return x(d.x0) + 1 })
                      .y(function(d){ return y(d.cum) })
                      .curve(d3.curveBasis);

        var line = svg.append("g")
                      .attr("class", "cdf")
                      .append('path')
                      .datum(bins)
                      .attr('d', guide)
                      .attr('class', 'line');

      }

      // draw vertical line for mean
      svg.append("line")
      .attr("class", "mean-line")
      .attr("x1", x(mean))
      .attr("x2", x(mean))
      .attr("y1", -5)
      .attr("y2", height + 15)

      if (options && options.createBrush) {
        svg
        .call( self.brushHist = d3.brushX()
          .extent( [ [0,-40], [width,height] ] )
          .on("start brush end", self.onBrushHist)
        )
      }

    },
    drawBrushableHistAxis: function(container) {
      let self = this;
      let spliceJunctions = self.geneModel.geneToSpliceJunctionObjects[self.selectedGene.gene_name]
      if (spliceJunctions == null) {
        return;
      }

      let data = spliceJunctions;
      let groupedData = d3.group(data, function(d) {
        return d.spliceKind;
      })


      let boxQuartiles = function(d) {
        let values = d.map(function(d) {
          return d.readCount
        })
        return [
          d3.quantile(values, .25),
          d3.quantile(values, .5),
          d3.quantile(values, .75)
        ]
      };
      let sortNumber = function(a,b) {
        return a.readCount - b.readCount;
      };

      let boxPlotData = []
      for (let d of groupedData.entries()) {
        let key        = d[0];
        let group      = d[1];
        group      = group.sort(sortNumber);
        let groupCount = group.length;

        var localMin = d3.min(group, function(d) {
          return d.readCount;
        });
        var localMax = d3.max(group, function(d) {
          return d.readCount;
        });

        var obj = {};
        obj["key"]       = key;
        obj["counts"]    = groupCount;
        obj["quartile"]  = boxQuartiles(group);
        obj["whiskers"]  = [localMin, localMax];
        obj["max"]       = localMax;
        obj["min"]       = localMin;

        boxPlotData.push(obj)
      }
      let maxReadCount = d3.max(data, function(d) {
        return +d.readCount;
      })


      // set the dimensions and margins of the graph
      var margin = {top: 5, right: 0, bottom: 35, left: 80},
          width = 250 - margin.left - margin.right,
          height = 120 - margin.top - margin.bottom;

      var barHeight = 22;

      // append the svg object to the body of the page
      var svg = d3.select(container).select("#read-count-histogram")
        .append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
        .append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

       svg.append("text")
             .attr("class", "histogram-text")
             .attr("x", (width / 2))
             .attr("y", height + margin.top + 25)
             .style("text-anchor", "middle")
             .text("Read count")

      // X axis: scale and draw:
      self.xBrushableHist = d3.scaleLinear()
                    .domain([0, maxReadCount])
                    .range([0, width]);


      let y = d3.scaleBand()
        .domain(['canonical', 'exon-skipping', 'cryptic-site'])
        .rangeRound([0, height])
        .paddingInner(.1)
        .align(.5)

      var tickFormatter = function(d) {
        if ((d / 1000000) >= 1)
          return Math.round(d / 1000000) + "M";
        else if ((d / 1000) >= 1)
          return Math.round(d / 1000) + "K";
        else
          return d;
      }

      svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(d3.axisBottom(self.xBrushableHist).ticks(5).tickFormat(tickFormatter));

      svg.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))

      // Draw the box plot vertical lines
      var verticalLines = svg.selectAll(".verticalLines")
        .data(boxPlotData)
        .enter()
        .append("line")
        .attr("x1", function(d){ return self.xBrushableHist(d.whiskers[0]); })
        .attr("y1", function(d){ return y(d.key) + (barHeight/2); })
        .attr("x2", function(d){ return self.xBrushableHist(d.whiskers[1]); })
        .attr("y2", function(d){ return y(d.key) + (barHeight/2); })
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("fill", "none");

      // Draw the boxes of the box plot, filled and on top of vertical lines
      var rects = svg.selectAll("rect")
        .data(boxPlotData)
        .enter()
        .append("rect")
        .attr("height", barHeight)
        .attr("width", function(d) {
          var quartiles = d.quartile;
          var width =  self.xBrushableHist(quartiles[2]) - self.xBrushableHist(quartiles[0]);
          return Math.max(width, 4);
        })
        .attr("x", function(d) { return self.xBrushableHist(d.quartile[0]); })
        .attr("y", function(d) { return y(d.key);})
        .attr("fill", function(d) {
          let keyToColor = {'canonical': 'steelblue',
                            'exon-skipping': '#db9625',
                            'cryptic-site': '#7ba852'};
          return keyToColor[d.key]
        })
        .attr("stroke", "#000")
        .attr("stroke-width", 1);


      // Now render all the vertical lines at once - the whiskers and the median
      var vertLineConfigs = [
        // Top whisker
        {
          y1: function(d) { return y(d.key)},
          x1: function(d) { return self.xBrushableHist(d.whiskers[0]) },
          y2: function(d) { return y(d.key) + barHeight },
          x2: function(d) { return self.xBrushableHist(d.whiskers[0]) }
        },
        // Median line
        {
          y1: function(d) { return y(d.key)  },
          x1: function(d) { return self.xBrushableHist(d.quartile[1]) },
          y2: function(d) { return y(d.key) + barHeight },
          x2: function(d) { return self.xBrushableHist(d.quartile[1]) }
        },
        // Bottom whisker
        {
          y1: function(d) { return y(d.key) },
          x1: function(d) { return self.xBrushableHist(d.whiskers[1]) },
          y2: function(d) { return y(d.key) + barHeight },
          x2: function(d) { return self.xBrushableHist(d.whiskers[1]) }
        }
      ];

      for(var i=0; i < vertLineConfigs.length; i++) {
        var lineConfig = vertLineConfigs[i];

        // Draw the whiskers at the min for this series
        var vertLine = svg.selectAll(".whiskers")
          .data(boxPlotData)
          .enter()
          .append("line")
          .attr("x1", lineConfig.x1)
          .attr("y1", lineConfig.y1)
          .attr("x2", lineConfig.x2)
          .attr("y2", lineConfig.y2)
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("fill", "none");
      }

      svg
      .call( self.brushHist = d3.brushX()
        .extent( [ [0,-40], [width,height] ] )
        .on("start brush end", self.onBrushHist)
      )

    }
  },


  watch: {
  	selectedGene: function() {
  		this.onDataChanged();
  	},
  	tab: function() {
      if (this.tab == 'tab-2') {
        this.onDataChanged();
      } else {
        this.clickedObject = null;
        this.$emit("object-selected", null)

      }
  	},
  	geneSource: function() {
			this.$emit("reinit");
  	},
    spliceJunctionsForGene: function() {
  		this.onDataChanged();
  	},
    selectedSpliceKind: function() {
      this.onSettingsChanged();
    },
    minUniquelyMappedReads: function() {
      this.onSettingsChanged();
    },
    maxUniquelyMappedReads: function() {
      this.onSettingsChanged();
    },
    colorBy: function() {
      this.onSettingsChanged();
    },
    showLabels: function() {
    	d3.selectAll("#arc-diagram").classed("hide-labels", !this.showLabels)
    },
    variants: function() {
      let self = this;
      if (this.variants && this.variants.length > 0) {
        self.$nextTick(function() {
          setTimeout(function() {
            self.drawVariantDiagram('#diagrams #variant-diagram', self.geneStart, self.geneEnd, self.variants)

          }, 2000)
        })
      }
    },
    scaleYHist: function() {
      let self = this;
      d3.selectAll("#canonical-histogram #read-count-histogram svg").remove();
      d3.selectAll("#exon-skipping-histogram #read-count-histogram svg").remove();
      d3.selectAll("#cryptic-site-histogram #read-count-histogram svg").remove();

      self.drawReadCountHistogram('#canonical-histogram', 'canonical', 'Canonical', {}, self.readCountRange);
      self.drawReadCountHistogram('#exon-skipping-histogram', 'exon-skipping', 'Exon-skipping', {}, self.readCountRange);
      self.drawReadCountHistogram('#cryptic-site-histogram', 'cryptic-site', 'Cryptic-site', {}, self.readCountRange);
    }
  }
}
</script>

<style>
.instruction-box {
	background-color: #f6eccd !important;
  border: thin solid #a7a3a3 !important;
  font-weight: 500;
  font-style: italic;
  font-size: 12px;
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  width: 300px;
  margin: auto;
}

#brushable-axis  text { 
	font-size: 11px; 
	font-family: 'Poppins';
}
#arc-diagram, #transcript-diagram {
	padding: 0px;
}

rect.bounding-box {
	fill: #75abffab;
	fill-opacity: 0.3; 
	stroke: #fff;
	visibility: hidden;
}
rect.bounding-box.active {
	visibility: visible;
}
rect.selection {
  fill: #75abffab;
}


svg rect.UTR, svg rect.CDS, svg rect.exon {
  fill:   #bdc0c5;
  stroke: #6c6f74;
  stroke-width: 1;
}

.exon-label {
	font-size: 10px;
	text-anchor: middle;
}

svg path.junction {
  
  fill: none;
}


svg .junction.selected {
  opacity: 1;
  fill: #fed3574d;
}
svg .junction.selected.clicked {
  fill: #fcc10059;
  opacity: 1;
}

svg .junction.clicked {
  fill: #fcc10059;
  opacity: 1;
}


#zoomed-diagrams svg .junction.clicked {
  fill: #fcc10059 !important;
  opacity: 1;
}
#zoomed-diagrams svg .junction.selected {
  fill: #fed3574d;
  opacity: 1;
}

svg text.junction.selected {
  font-weight: 600;
  fill: #03a9f4;
  font-size: 12px;
}
svg text.junction.clicked {
  font-weight: 600;
  fill: #03a9f4;
  font-size: 13px;
}


.hide-strand-mismatches svg path.junction.strand-mismatches {
	display: none !important;
}

.hide-strand-mismatches svg .arc-labels .junction.strand-mismatches {
	display: none !important;
}

.hide-canonical svg path.junction.canonical, 
.hide-canonical svg .arc-labels .junction.canonical {
	display: none;
}

.show-canonical svg path.junction.canonical, 
.show-canonical svg .arc-labels .junction.canonical {
	display: initial;
}

svg line.gene {
  stroke: black;
  stroke-width: 1;
}

svg text.transcript-label {
  font-size: 12px;
  pointer-events: none;
  cursor: pointer;
}
div.tooltip {
  position: absolute;
  text-align: center;
  padding: 2px;
  background: #ffffff;
  border-width: 1.5px;
  border-radius: 8px;
  pointer-events: none;
  padding: 5px;
  border-color: #2196F3;
  border-style: solid;
  color: #525252;
  font-size: 13px;
  font-weight: 500;
  line-height: 17px;
  min-height: 50px;
  max-height: 500px;
  min-width: 100px;
  max-width: 300px;
}

.arrow {
	stroke: #494949;
	stroke-width: 1.5;
}
.cdf path {
  stroke: #59638c9c;
  stroke-width: 1;
  fill: none;
}
.y-axis.right text {
  color: #59638c9c;
}
.histogram-text.cdf {
  fill: #59638c9c;
}


#transcript-menu-panel #transcript-menu-diagram {
	overflow-y: scroll;
	max-height: 150px;
}

#transcript-diagram .exon-highlight,
#sequence .exon-highlight {
  stroke: black;
  fill: #03a9f4;
}
#transcript-diagram .exon-highlight.clicked {
  stroke: black;
  fill: #03a9f4;
}
#zoomed-diagrams svg {
	z-index: 1000;
}
.transcript .selection-box {
    fill: transparent;
}
.transcript.selected .selection-box {
		stroke: #2383d1;
    stroke-width: 2.5px;  
}
.transcript.current .selection-box {
	stroke: #2383d1;
  stroke-width: 1px;  
	fill: #ddf0ff;
}
.transcript.current.selected .selection-box {
	stroke: #2383d1;
  stroke-width: 2.5px;  
	fill: #ddf0ff;
}

.transcript .transcript-feature.no-pointer {
	pointer-events: none;
}

.transcript.selected .transcript-label {
	font-weight: 600;
}

.utr:hover,
.cds:hover,
.exon:hover,
{
    cursor: pointer;
}

.arc-pointer, .donor-pointer, .acceptor-pointer, .variant-pointer, .variant-pointer-small {
	fill: #03a9f4;
	stroke: black; 
	stroke-width: 1;
}

.variant.splicing {
  fill: #d70000 !important;
  stroke-width: 2 !important;
}

.arc-pointer-small, .acceptor-pointer-small, .donor-pointer-small {
	fill: #03a9f4;
	stroke: black; 
	stroke-width: 1;
}



.donor-problem, .acceptor-problem, .donor-problem-small, .acceptor-problem-small  {
	fill: #03a9f4 !important;
	font-weight: 600 !important;
	font-size: 13px !important;
	text-anchor: middle !important;
}

.donor-problem-small, .acceptor-problem-small  {
  font-weight: 500 !important;
  font-size: 12px !important;
}

text.junction {
	text-anchor: middle;
	fill: black;
	font-size: 11px;
}

.hide-labels text.junction {
	display: none;
}

#label-cb, #show-matching-strand-only-cb, #show-cryptic-site-only-cb {
	height: 45px;
}
#show-matching-strand-only-cb {
	width: 200px;
}
#label-cb label, #show-matching-strand-only-cb label, #show-cryptic-site-only-cb label  {
	font-size: 13px !important;
  padding-top: 3px !important;
  line-height: 15px !important
}


#list-for-transcript-menu .v-list-item {
	padding: 0;
}

#axis {
	display: flex;
	justify-content: flex-start;
}

text.seq {
	fill: black;
	font-size: 13px;
  font-weight: 600;
}
text.seq.A, rect.seq.A {
  fill: #00b107;
}
text.seq.G {
  fill: #dca500;
}
rect.seq.G {
  fill: #ffc52b
}
text.seq.C, rect.seq.C {
  fill: #486dd7;
}
text.seq.T, rect.seq.T {
  fill: #f60909;
}

#sequence text.site {
	font-weight: 900;
  text-decoration: underline
}

#sequence rect.site {
  stroke: black;
}

.tick text {
  font-size: 11px;
}

#zoomed-diagrams .transcript-label {
  display: none;
}

.zoom-button {
  height: 25px !important;
  margin-right: 20px;
  padding: 3px 8px;
  font-size: 13px;
}

#sequence .exon-label {
  font-size: 11px !important;
  fill: black;
}


#sequence .donor-problem, #sequence .acceptor-problem {
  font-weight: 500;
}

.variant {
  stroke: #00000061;
}

#zoomed-diagrams .junction {
  opacity: .7
}



</style>

<style lang="sass">
@import '../styles/variables.sass'

.impact_HIGH
  fill:  $high-impact-color !important
  color: $high-impact-color !important
  font-weight: bold

.impact_MODERATE
  fill:  $moderate-impact-color !important
  color: $moderate-impact-color !important
  font-weight: bold

.impact_MODIFIER
  fill:  $modifier-impact-color
  color: $modifier-impact-color

.impact_LOW
  fill:  $low-impact-color
  color: $low-impact-color

.impact_UNKNOWN
  fill:  $unremarkable-color
  color: $unremarkable-color

.impact_NOIMPACT, .impact_none, .effect_none
  fill: #e5e5e3
  stroke: #807D7D

.read-stat 
  font-size: 11px
  color: rgb(73, 73, 73)
  font-style: italic

.histogram-text
  font-size: 11px
  fill: rgb(73, 73, 73)

#hist-button-group
  height: 20px !important
  margin-top: 0px
  margin-bottom: 5px
  .v-btn
    height: 20px !important
    .v-btn__content
      font-size: 11px
      font-weight: 600

#all-histogram
  #read-count-histogram
    .histogram-bar
      fill: gray

#cryptic-site-histogram
  #read-count-histogram
    .histogram-bar
      fill: #7ba852

#canonical-histogram
  #read-count-histogram
    .histogram-bar
      fill: steelblue 

#exon-skipping-histogram
  #read-count-histogram
    .histogram-bar
      fill: #db9625

#read-count-histogram
  .mean-line
    stroke-width: 2
    stroke: black
    stroke-dasharray: 3

.legendCells
  .label 
    fill: #787878 !important
    font-size: 85% !important
  .legend-cell-show
    fill: rgb(24, 103, 192) !important
    font-size: 85% !important
    font-weight: 600 !important
    cursor: pointer !important
    font-style: normal !important


  .cell.hiding
    .label
      font-weight: 500 !important
      fill: #9c9b9b !important
    .legend-cell-show
      font-weight: 600 !important
      font-style: normal !important
  .cell.showing
    .legend-cell-show
      font-weight: 700 !important
      font-style: italic !important



.hint-box
  background-color: #f7eccd9e
  border: 0.5px #a7a7a7 solid
  width: max-content
  margin: auto
  padding: 2px 6px 2px 6px
  display: flex
  justify-content: center
  align-items: center
  i.mdi
    margin-right: 4px
    font-size: 17px
  div
    font-size: 11px
    font-style: italic

.v-input__control
  input
    font-size: 14px !important

</style>
