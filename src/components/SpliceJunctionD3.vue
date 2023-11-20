<template>

<div style="padding-bottom: 10px">
	<div class="text-center" v-if="showLoading">
    <v-progress-circular v-if="showLoading"
      indeterminate
      color="primary"
    ></v-progress-circular>
  </div>

      <div id="panel-heading" class="d-flex flex-row justify-space-between align-center mb-1" >
          <h2 class="mr-16" style="margin-top: 0px !important;margin-bottom: 0px !important;min-width: 150px;">
            Splice Junctions
          </h2>
          <div id="label-cb" class="mr-5" >
						<v-checkbox 
						  hide-details="true"
				      v-model="showLabels"
				      label="Show read counts"
				    ></v-checkbox>
			    </div>

          <div id="show-noncanonical-only-cb" class="mr-5" >
						<v-checkbox 
						  hide-details="true"
				      v-model="showNonCanonicalOnly"
				      label="Hide canonical splice junctions"
				    ></v-checkbox>
			    </div>

          <div id="show-matching-strand-only-cb" class="mr-5" >
						<v-checkbox 
						  hide-details="true"
				      v-model="showSameStrandOnly"
				      label="Hide junctions not matching gene strand"
				    ></v-checkbox>
			    </div>
          <div style="width:195px" class="mr-5">
            <v-text-field 
            density="compact"
            hide-details="auto" 
            label="Min read count" 
            v-model="minUniquelyMappedReads"/>
          </div>
          <div style="width:155px" class="mr-5">
            <v-select 
              v-model="colorBy"
              hide-details="auto"
              label="Color by"
              density="compact"
              :items="['none', 'strand', 'motif']"
            ></v-select>
          </div>
          

          
          
      </div>

	<div id="diagrams">
	  <div  class="d-flex flex-row align-center">
	    <div id="brushable-axis">
	      <svg/>
	    </div>

    	<div v-if="!showLoading && selectedGene" style="max-width:150px">
        <div class="instruction-box" v-if="!regionIsSelected">
        	Click and drag to zoom into a region
        </div>
        <div class="instruction-box" v-if="regionIsSelected">
        	Click outside of bounding box to zoom out
        </div>
    	</div>      
    </div>

	  <div id="arc-diagram" class="hide-labels" style="margin-top:-11px">
	  </div>

    <div id="selected-transcript-panel" style="margin-top:-11px">

		  <div id="transcript-diagram" >
		    <svg/>
		  </div>
	  </div>
	  <div class="d-flex" v-show="selectedGene && !showLoading" style="padding-right:30px">
	    <v-spacer/>
		  <v-btn variant="tonal" style="margin-top: -45px;margin-left: -5px !important;" 
      color="#094792" density="compact">
	     Select a transcript
	      <v-menu eager bottom activator="parent">
	         <v-list id="list-for-transcript-menu">
	          <v-list-item>
	            <div id="transcript-menu-panel">
		        		<div id="transcript-diagram" class="multiple" style="margin-right:-10px;">
		        			<svg/>
		        	  </div>
		        	</div>
	        	</v-list-item>
	         </v-list>
				
	      </v-menu>
	    </v-btn>
    </div>
	  
	  


	</div>

	<div id="zoomed-diagrams" style="z-index:1000">
	  <div id="arc-diagram" class="hide-labels">
	    <svg/>
	  </div>
	  <div id="transcript-diagram">
	    <svg/>
	  </div>

	</div>


 <div id="site-diagrams" class="d-flex plus" 
   v-if="selectedGene && selectedGene.strand == '+'" >
  	<div class="donor-site" v-if="showDonorPanel" style="width:50%">
      <div class="d-flex">
  		  <h2 style="margin-bottom: 20px !important">Donor site</h2>
        <btn @click="zoomOutSite" style="margin-left:20px;" density="compact" size="x-small" variant="tonal">-</btn>
      </div>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  	<div class="acceptor-site" v-if="showAcceptorPanel">
	  	<h2 style="margin-bottom: 20px !important">Acceptor site</h2>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  </div>
  <div id="site-diagrams" class="d-flex minus" v-if="selectedGene && selectedGene.strand == '-'" >
  	<div class="acceptor-site" v-if="showAcceptorPanel" style="width:50%">
	  	<h2 style="margin-bottom: 20px !important">Acceptor site</h2>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  	<div class="donor-site" style="width:50%" v-if="showDonorPanel" >
  		<h2 style="margin-bottom: 20px !important">Donor site</h2>
		  <div id="sequence">
        <svg/>
  	  </div>
  	</div>
  </div>

  
</div>

</template>

<script>
export default {
  name: 'SpliceJunctionD3',
  props: {
    selectedGene: Object,
    spliceJunctionsForGene: Object,
    geneSource: String,
    genomeBuildHelper: Object,
    geneModel: Object,
    tab: String,
    loadInProgress: Boolean,
    junctionSiteSeqRange: Number
  },
  data: () => ({
		// GLOBALS
		REGION_BUFFER: 1000,
		UTR_HEIGHT: 10,
		CDS_HEIGHT: 20,

		clickedObject: null,

		regionIsSelected: false,

		selectedTranscript: null,
		edgesForGene: null,

		xArcDiagram: null,
		xBrushable: null,
		xTranscriptChart: null,
		xTranscriptChartZoomed: null,
		ySitePointer: null,
		tooltip: null,

		showLabels: false,
		showSameStrandOnly: false, 
		junctionsToShow: null,
		showNonCanonicalOnly: false,

		brush: null,

		showLoading: false,

    minUniquelyMappedReads: 1,
    colorBy: 'strand',

    arcPointerWidth: 13,
    arcPointerHeight: 13,

    arcPointerSmallWidth: 8,
    arcPointerSmallHeight: 8,

    sitePointerWidth: 13,
    sitePointerHeight: 13,

    sitePointerSmallWidth: 8,
    sitePointerSmallHeight: 8,

    MIN_ARC_HEIGHT: 50,
    ARC_FACTOR:     2,

    showDonorPanel: false,
    showAcceptorPanel: false,

    zoomFactor: 1


	}),
  methods: {

  	onDataChanged: function() {
  		let self = this;
  		if (this.tab == 'tab-2' && this.selectedGene) {
  			self.$nextTick(function() {
          self.showDonorPanel = false;
          self.showAcceptorPanel = false;
	  			self.onGeneSelected();
	  			if (self.spliceJunctionsForGene && self.spliceJunctionsForGene.gene == self.selectedGene.gene_name) {
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
		  		self.edgesForGene = self.createEdges(self.spliceJunctionsForGene.spliceJunctions)

			    let geneStart = self.selectedGene.start - self.REGION_BUFFER;
			    let geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

			    self.xArcDiagram = null;

			    d3.selectAll('#diagrams #arc-diagram svg').remove();
			    d3.selectAll('#zoomed-diagrams #arc-diagram svg').remove();

			    self.drawArcDiagram('#diagrams', self.edgesForGene, geneStart, geneEnd, 
			    	{'createBrush': false});	

  			})
  		}
  	},

  	onGeneSelected: function() {
  		let self = this;

  		if (this.tooltip == null) {
  			this.tooltip = d3.select("body").append("div")
				  .attr("class", "tooltip")
				  .style("opacity", 0);
  		}
		  this.determineExons(this.selectedGene);

		  this.selectedGene.transcripts.forEach(function(transcript) {
		    if (transcript.is_mane_select) {
		      transcript.isSelected = true;
		      self.selectedTranscript = transcript;
		      self.$emit('transcript-selected', self.selectedTranscript);
		    }
		  })
  	},

  	loadDiagram: function() {
  		let self = this;
  		if (self.spliceJunctionsForGene.gene == self.selectedGene.gene_name) {

				self.edgesForGene = self.createEdges(self.spliceJunctionsForGene.spliceJunctions)

		    let geneStart = self.selectedGene.start - self.REGION_BUFFER;
		    let geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

		    self.xArcDiagram = null;

		    d3.selectAll('#diagrams svg').remove();
		    d3.selectAll('#zoomed-diagrams svg').remove();

		    self.drawBrushableAxis("#diagrams", geneStart, geneEnd)

		    self.drawArcDiagram('#diagrams', self.edgesForGene, geneStart, geneEnd, 
		    	{'createBrush': false});

		    self.drawTranscriptDiagram("#diagrams #selected-transcript-panel", self.selectedGene, geneStart, geneEnd,  
		      {'selectedTranscriptOnly': true, 'allowSelection': false, 'showBoundingBox': true})


		    d3.selectAll("#transcript-menu-panel #transcript-diagram svg").remove();
		    self.drawTranscriptDiagram('#transcript-menu-panel', self.selectedGene, geneStart, geneEnd, 
		    	{'selectedTranscriptOnly': false, 'allowSelection': true});	


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

		createEdges: function(bedRecords) {
		  let self = this;
		  let bedRecordsFiltered = bedRecords.filter(function(bedRow) {
		    return +bedRow.score >= self.minUniquelyMappedReads
		  });

		  let spliceJunctions = self.geneModel.createSpliceJunctions(bedRecordsFiltered, self.selectedGene, self.selectedTranscript);
		  return spliceJunctions;
		},

		// Function that is triggered when brushing is performed
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
		    
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();

		    if (event.type == 'end') {
			    let filteredEdges = self.edgesForGene.filter(function(edge) {
			      if (edge.donor.pos < edge.acceptor.pos) {
			        return edge.donor.pos >= regionStart || edge.acceptor.pos <= regionEnd;
			      } else {
			        return edge.acceptor.pos >= regionStart || edge.donor.pos <= regionEnd;
			      }
			    })
			    let filteredEdgesClone = [];
			    filteredEdges.forEach(function(d) {
			    	let edge = $.extend({}, d)
			    	filteredEdgesClone.push(edge);
			    })
			    self.drawArcDiagram("#zoomed-diagrams", filteredEdgesClone, regionStart, regionEnd, {'createBrush': false, 'allEdges': self.edgesForGene})

			    self.drawTranscriptDiagram("#zoomed-diagrams", self.selectedGene, regionStart, regionEnd, 
			      {'selectedTranscriptOnly': true, 'allowSelection': false})

		    }
		  } else {
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();
		    self.regionIsSelected = false;
		    d3.select("#diagrams #arc-diagram svg .bounding-box.active").classed("active", false)
		    d3.select("#diagrams #transcript-diagram svg .bounding-box.active").classed("active", false)

		  }
		},

		showSelectionBox: function(container, regionStart, regionEnd, x) {
			let self = this;

			let x1   = x(regionStart);
		  let x2   = x(regionEnd);
		  let width = x2 - x1;


      let height = parseInt(d3.select(container).style("height"));

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
		  	            right: 170, 
		  	            bottom: (options && options.selectedTranscriptOnly ? 50 : 30), 
		  	            left: 0};
		  if (options.margin) {
		  	margin = options.margin;
		  }
		  var width = self.$el.offsetWidth - 20;
		  if (options.width) {
		  	width = options.width;
		  }

		  var transcriptCount = options && options.selectedTranscriptOnly ? 1 : gene.transcripts.length;
		  var transcriptPadding = options && options.selectedTranscriptOnly ? 0 : 5;
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
		  if (container == '#zoomed-diagrams') {
		  	self.xTranscriptChartZoomed = x;
		  } else {
		  	self.xTranscriptChart = x;
		  }

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#transcript-diagram")
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


          self.drawTranscriptDiagram("#diagrams #selected-transcript-panel", self.selectedGene, regionStart, regionEnd, 
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

      transcripts.selectAll(".transcript-label").remove();
      transcripts.selectAll(".transcript-label")
      .data(function(d) {
	       return [d];
      })
      .enter()
      .append('text')
			.attr("class", "transcript-label")
			.attr("text-anchor", 'start')
			.attr("x", width - margin.right)
			.attr("y", self.CDS_HEIGHT)
			.attr("dy", "0.35em")
			.text(function(d) {
			  return d.transcript_id + (d.is_mane_select ? " MANE" : "");
			})



		 
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
				 .text("x")

				 svg.selectAll(".acceptor-problem").remove();
				 svg
				 .append("text")
				 .attr("class", "acceptor-problem")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("x")

				 svg.selectAll(".donor-problem-small").remove();
				 svg
				 .append("text")
				 .attr("class", "donor-problem-small")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("x")

				 svg.selectAll(".acceptor-problem-small").remove();
				 svg
				 .append("text")
				 .attr("class", "acceptor-problem-small")
				 .attr("x", 0)
				 .attr("y", 0)
				 .style("opacity", "0")
				 .text("x")


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
    	let donorSpliceJunctions = self.edgesForGene.filter(function(edge) {
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
    	let acceptorSpliceJunctions = self.edgesForGene.filter(function(edge) {
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
		  var margin = {top: 40, right: 170, bottom: 5, left: 0};
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
				if ((d / 1000000) >= 1)
		      d = d / 1000000 + "M";
		    else if ((d / 1000) >= 1)
		      d = d / 1000 + "K";
		    return d;
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
        .extent( [ [0,-40], [width,height] ] )
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
		  var margin = {top: 5, right: 170, bottom: 5, left: 0};
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
		                    .range([2.5, 15])


		           

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#arc-diagram")
		  .append("svg")
		    .attr("width", innerWidth)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform",
		          "translate(" + margin.left + "," + margin.top + ")")
		    
		  if (options && options.createBrush) {
		    svg
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,10] ] )
		        .on("start end", self.onBrush)    
		      )       
		  }

		  var arcColors = ['#80A1D4','#7F627A','#39A329','#FACB0F','#FD7049']
		  let arcColor = null;

		  if (self.colorBy == 'motif') {
			  let motifMap = {};
			  edges.forEach(function(edge) {
			  	motifMap[edge.motif] = edge.motif
			  })
			  arcColor = d3.scaleOrdinal()
	                   .domain(Object.keys(motifMap))
	                   .range(arcColors);
		  } else if (self.colorBy == 'strand') {
				let strandMap = {};
					edges.forEach(function(edge) {
					strandMap[edge.strand] = edge.strand
				})
	      arcColor = d3.scaleOrdinal()
	                   .domain(['+', '-', 'undefined'])
	                   .range(arcColors);
		  } else if (self.colorBy == 'exon span') {
			  arcColor = d3.scaleOrdinal()
	                   .domain([true, false])
	                   .range(arcColors);

		  } 

			let arc = function(d, theInnerHeight) {
				

		    let start = x(d.donor.pos);  // X position of start node on the X axis
		    let end   = x(d.acceptor.pos);   // X position of end node
		    let distance = Math.abs(end - start)
		    let currentArcHeight = (1/2*distance)

		    let rx = 1;
		    let ry = 1;
		    let maxArcHeight = innerHeight - 10;
		    let minArcHeight = theInnerHeight / 5;

		    // Arc is shorter than min arc height 
		    // Need arc to be stretched on y axis
		    if (currentArcHeight < minArcHeight) {
		    	ry = minArcHeight/currentArcHeight;
		    	rx = 1;
		    	d.arcYTop = innerHeight - (currentArcHeight * ry)
		    } else if (currentArcHeight >= maxArcHeight) {
		    	// Arc is taller than chart
		    	// Need arc to be stretched on x axis

		    	// shuffle the height randomly by 30 pixels 
		    	let rando = Math.floor(Math.random() * 31);
		    	let newMaxArcHeight = maxArcHeight - rando;

		    	rx = currentArcHeight/newMaxArcHeight
		    	ry = 1;
		    	d.arcYTop = innerHeight - (newMaxArcHeight)
		    } else {
		    	rx = 1;
		    	ry = 1;
		    	d.arcYTop = innerHeight - currentArcHeight;
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


		  var arcs =  svg.insert("g", "*")
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

		    
		    	if (container == '#zoomed-diagrams' && 
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
		    	if (self.colorBy == '' || self.colorBy == 'none') {
		    		return "#9f9f9f";
		    	} else {
			    	return arcColor(d[self.colorBy]);		    		
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

	   let arcLabels = svg.insert("g", "*")
			  .attr("class", "arc-labels")
			  .selectAll("text.junction")
			  .data(edges)
		    .join("text")
		      .attr("class", function(d) {
			    	let clazz = "junction" + " " + d.spliceKind + " " +
			    	(d.countSkippedExons > 0 ? " exon-spanned" : "") + 
			    	(d.strand == "undefined" || d.strand == self.selectedGene.strand ? " strand-matches" : " strand-mismatches");

			    	if (container == '#zoomed-diagrams' && 
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
		      	let position = d.arcYTop - 20 - rando;
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

		 if (container == '#zoomed-diagrams' && self.clickedObject && self.clickedObject.type == 'splice-junction') {
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

		 if (container == '#zoomed-diagrams' && self.clickedObject && self.clickedObject.type == 'splice-junction') {
	     
		 }

		 
		},

		unclickSpliceJunction: function() {
			let self = this;
	    d3.selectAll("#arc-diagram path.junction").classed("selected", false);
 	 	  d3.selectAll("#arc-diagram path.junction").classed("clicked", false);
	    d3.selectAll("#arc-diagram text.junction").classed("selected", false);
 	 	  d3.selectAll("#arc-diagram text.junction").classed("clicked", false);
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


      // If this is the zoomed diagram, find the counterpart arc in the main chart
      let junctionMainChart = null;
      let nodeMainChart = null;
     
      let theSpliceJunctions = self.geneModel.geneToSpliceJunctionObjects[self.selectedGene.gene_name]
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
      self.zoomFactor = self.zoomFactor + 10
      self.$emit("set-site-zoom-factor", self.zoomFactor)
      self.$nextTick(function() {
        self.$emit("splice-junction-selected", self.clickedObject)
      })
    },
   

    drawSiteSequences: function(donorSequence, acceptorSequence) {
    	let self = this;
      let strandStr = self.selectedGene.strand == "+" ? 'plus' : 'minus'
      let donorSiteContainer    = "#site-diagrams." + strandStr + " .donor-site #sequence"
      let acceptorSiteContainer = "#site-diagrams." + strandStr + " .acceptor-site #sequence"
      

      let regionStart = self.clickedObject.donor.pos - self.junctionSiteSeqRange;
      let regionEnd   = self.clickedObject.donor.pos + self.junctionSiteSeqRange;
			let donorExons  = self.selectedTranscript.exons.filter(function(exon) {
      	if (self.selectedGene.strand == "+") {
      		return regionStart <= exon.end && regionEnd >= exon.end ||
                 (exon.start <= regionStart && exon.end >= regionEnd);
      	} else {
      		return regionStart <= exon.start && regionEnd >= exon.start ||
                 (exon.start <= regionStart && exon.end >= regionEnd);
      	}
      })

      self.drawSiteSequence(donorSiteContainer, 
      	donorSequence, 
      	self.clickedObject.donor.pos - self.junctionSiteSeqRange, 
      	self.clickedObject.donor.pos + self.junctionSiteSeqRange,
      	self.selectedGene.strand == "+" ? self.clickedObject.donor.pos+1 : self.clickedObject.donor.pos,
      	self.selectedGene.strand == "+" ? self.clickedObject.donor.pos+2 : self.clickedObject.donor.pos-1,
      	donorExons)

      regionStart = self.clickedObject.acceptor.pos - self.junctionSiteSeqRange;
      regionEnd = self.clickedObject.acceptor.pos + self.junctionSiteSeqRange;
			let acceptorExons = self.selectedTranscript.exons.filter(function(exon) {
      	if (self.selectedGene.strand == "+") {
      		return regionStart <= exon.start && regionEnd >= exon.start ||
                 (exon.start <= regionStart && exon.end >= regionEnd);
      	} else {
      		return regionStart <= exon.end && regionEnd >= exon.end ||
                 (exon.start <= regionStart && exon.end >= regionEnd);
      	}
      })

      self.drawSiteSequence(acceptorSiteContainer, 
      	acceptorSequence, 
      	self.clickedObject.acceptor.pos - self.junctionSiteSeqRange,
      	self.clickedObject.acceptor.pos + self.junctionSiteSeqRange,
      	self.selectedGene.strand == "+" ? self.clickedObject.acceptor.pos-1 : self.clickedObject.acceptor.pos+1,
      	self.selectedGene.strand == "+" ? self.clickedObject.acceptor.pos : self.clickedObject.acceptor.pos+2,
      	acceptorExons)

    },

    drawSiteSequence: function(container, sequence, regionStart, regionEnd, siteStart, siteEnd, exons) {
			let self = this;

		  // dimensions
			var width =  self.$el.offsetWidth/2;
		  var height = 90;
		  var margin = {top: 20, right: 10, bottom: 0, left: 15};

		  var innerWidth  = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;

		  var center = innerWidth / 2;

		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth+margin.left]);
		  

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
                  .attr("height", height)
                  .append("g")
                         .attr("class", "axis")
                         .attr("transform",
                               "translate(" + margin.left + "," + margin.top + ")")
                         .call(xAxis);

      // Strand arrow
      svg.selectAll(".arrow").remove();
      svg.selectAll('.arrow')
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
          .style('transform', 'translate(-10px, -36px)')                

      // Nucleotide sequence
      svg.selectAll("text.seq")
      .data(Array.from(sequence))
      .enter()
      .append("text")
      .attr("class", function(d,i) {
      	if (regionStart+i == siteStart) { 
      		return "seq site " 
      	} else if (regionStart+i == siteEnd) {
      		return "seq site "
      	} else {
      		return "seq"
      	}
      })
      .attr("x", function(d,i) {
      	return x(regionStart+i)
      })
      .attr("y", "30")
      .text(function(d) {
      	return d;
      })

      // Exon on or near donor/acceptor site
      svg
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

      // Exon label
      svg
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
          if (x(d.start) >= 0) {
            return x(d.start)
          } else if (x(d.end) >= 0) {
            return x(d.end)
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
         
    },

    selectZoomedSpliceJunction: function(d, theSpliceJunctions, regionStart, regionEnd) {
    	let self = this;

			let filteredEdges = theSpliceJunctions.filter(function(edge) {
	      if (edge.donor.pos < edge.acceptor.pos) {
	        return edge.donor.pos >= regionStart || edge.acceptor.pos <= regionEnd;
	      } else {
	        return edge.acceptor.pos >= regionStart || edge.donor.pos <= regionEnd;
	      }
	    })
	    let filteredEdgesClone = [];
	    filteredEdges.forEach(function(d) {
	    	let edge = $.extend({}, d)
	    	filteredEdgesClone.push(edge);
	    })
	    d3.selectAll("#zoomed-diagrams svg").remove()
	    self.drawArcDiagram("#zoomed-diagrams", filteredEdgesClone, regionStart, regionEnd, {'createBrush': false, 'allEdges': self.edgesForGene})

	    self.drawTranscriptDiagram("#zoomed-diagrams", self.selectedGene, regionStart, regionEnd, 
	      {'selectedTranscriptOnly': true, 'allowSelection': false})
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

		      // Show an * below donor pointer if donor site is noncanonical
		      if (d.donor.status && d.donor.status == 'noncanonical') {
		     		d3.selectAll("#diagrams #transcript-diagram .donor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
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

		      // Show an * below acceptor pointer if acceptor site is noncanonical
		      if (d.acceptor.status && d.acceptor.status == 'noncanonical') {
		     		d3.selectAll("#diagrams #transcript-diagram .acceptor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
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

		      // Show an * below donor pointer if donor site is noncanonical
		      if (d.donor.status && d.donor.status == 'noncanonical') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
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

		      // Show an * below acceptor pointer if acceptor site is noncanonical
		      if (d.acceptor.status && d.acceptor.status == 'noncanonical') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem-small")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerSmallHeight + 6)
							.transition()
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


		      // Show an * below donor pointer if donor site is noncanonical
		      if (d.donor.status && d.donor.status == 'noncanonical') {
		     		d3.selectAll("#diagrams #transcript-diagram .donor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.donor.pos)) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 5)
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


		      // Show an * below acceptor pointer if acceptor site is noncanonical
		      if (d.acceptor.status && d.acceptor.status == 'noncanonical') {
		     		d3.selectAll("#diagrams #transcript-diagram .acceptor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChart(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 5)
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

		      // Show an * below donor pointer if donor site is noncanonical
		      if (d.donor.status && d.donor.status == 'noncanonical') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .donor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.donor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 5)
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
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

		      // Show an * below acceptor pointer if acceptor site is noncanonical
		      if (d.acceptor.status && d.acceptor.status == 'noncanonical') {
		     		d3.selectAll("#zoomed-diagrams #transcript-diagram .acceptor-problem")
		     		  .attr("x", function(d1) {
									return (self.xTranscriptChartZoomed(d.acceptor.pos) ) 
		     		  })
		     		  .attr("y", ySitePointer + self.sitePointerHeight + 5)
							.transition()
		      		.duration(200)
		      		.style("opacity", .9); 
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

		}		
  },



  watch: {
  	selectedGene: function() {
  		this.onDataChanged();
  	},
  	tab: function() {
  		this.onDataChanged();
  	},
  	geneSource: function() {
			this.$emit("reinit");
  	},
    spliceJunctionsForGene: function() {
  		this.onDataChanged();
  	},
  	loadInProgress: function() {
  		this.showLoading = this.loadInProgress;
  	},
    minUniquelyMappedReads: function() {
      this.onSettingsChanged();
    },
    colorBy: function() {
      this.onSettingsChanged();
    },
    showLabels: function() {
    	d3.selectAll("#arc-diagram").classed("hide-labels", !this.showLabels)
    },
    showSameStrandOnly: function() {
    	d3.selectAll("#arc-diagram").classed("hide-strand-mismatches", this.showSameStrandOnly)
    },
    showNonCanonicalOnly: function() {
    	d3.selectAll("#arc-diagram").classed("hide-canonical", this.showNonCanonicalOnly)
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
  height: 40px;
  justify-content: center;
  margin-left: 10px;
  width: 175px;
}

#brushable-axis  text { 
	font-size: 13px; 
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



svg path.junction.selected {
	stroke: #f65b5b;
}
svg path.junction.selected.clicked {
	stroke: #FE0101;
}
svg path.junction.clicked {
	stroke: #FE0101;
}
svg text.junction.selected {
	font-weight: 600;
	fill: #f65b5b;
	font-size: 12px;
}
svg text.junction.clicked {
	font-weight: 600;
	fill: #FE0101;
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
div.tooltip1 {
  position: absolute;
  text-align: center;
  width:  200px;
  height: 75px;
  padding: 2px;
  font-size: 12px;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  padding: 5px;
}

.arrow {
	stroke: #494949;
	stroke-width: 1.5;
}

#transcript-menu-panel #transcript-diagram {
	overflow-y: scroll;
	max-height: 150px;
}

#transcript-diagram .exon-highlight,
#sequence .exon-highlight {
  stroke: black;
  fill: #f65b5b;
}
#transcript-diagram .exon-highlight.clicked {
  stroke: black;
  fill: #FE0101;
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

.arc-pointer, .donor-pointer, .acceptor-pointer {
	fill: #FE0101;
	stroke: black; 
	stroke-width: 1;
}

.arc-pointer-small, .acceptor-pointer-small, .donor-pointer-small {
	fill: #FA8072;
	stroke: black; 
	stroke-width: 1;
}



.donor-problem, .acceptor-problem {
	fill: #ca231d;
	font-weight: 600;
	font-size: 20px;
	text-anchor: middle;
}

.donor-problem-small, .acceptor-problem-small {
	fill: #ca231d;
	font-weight: 600;
	font-size: 16px;
	text-anchor: middle;
}

text.junction {
	text-anchor: middle;
	fill: black;
	font-size: 11px;
}

.hide-labels text.junction {
	display: none;
}

#label-cb, #show-matching-strand-only-cb, #show-noncanonical-only-cb {
	height: 45px;
}
#show-matching-strand-only-cb {
	width: 190px;
}
#label-cb label, #show-matching-strand-only-cb label, #show-noncanonical-only-cb label  {
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

#sequence text {
	fill: black;
	font-size: 13px;
}

#sequence text.site {
	fill: red;
	font-weight: 600;
}

#sequence .tick text {
  font-size: 11px;
}

#zoomed-diagrams .transcript-label {
  display: none;
}


</style>
