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
          <div id="show-matching-strand-only-cb" class="mr-5" >
						<v-checkbox 
						  hide-details="true"
				      v-model="showSameStrandOnly"
				      label="Show junctions when strand matches gene"
				    ></v-checkbox>
			    </div>
          <div style="width:195px" class="mr-5">
            <v-text-field 
            density="compact"
            hide-details="auto" 
            label="Min Uniquely Mapped Reads" 
            v-model="minUniquelyMappedReads"/>
          </div>
          <div style="width:155px" class="mr-5">
            <v-select 
              v-model="colorBy"
              hide-details="auto"
              label="Color by"
              density="compact"
              :items="['none', 'strand', 'motif', 'exon span']"
            ></v-select>
          </div>
          

          
          <div class="ml-6 mr-5 d-flex align-center">
	          <div class="instruction-box" v-if="!regionIsSelected">
	          	Click and drag to zoom into a region
	          </div>
	          <div class="instruction-box" v-if="regionIsSelected">
	          	Click outside of bounding box to zoom out
	          </div>
        	</div>
        	<v-spacer/>

      </div>

	<div id="diagrams">
    <div id="brushable-axis">
      <svg/>
    </div>

	  <div id="arc-diagram" class="hide-labels">
	  </div>

    <div id="selected-transcript-panel">

		  <div id="transcript-diagram" >
		    <svg/>
		  </div>
	  </div>
	  <div class="d-flex" style="padding-right:20px">
	    <v-spacer/>
		  <v-btn variant="tonal" color="primary" density="compact">
	     Select a transcript
	      <v-menu eager bottom activator="parent">
	         <v-list id="list-for-transcript-menu">
	          <v-list-item>
	            <div id="transcript-menu-panel">
		        		<div id="transcript-diagram" class="multiple">
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
	  <div id="arc-diagram">
	    <svg/>
	  </div>
	  <div id="transcript-diagram">
	    <svg/>
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
    loadInProgress: Boolean
  },
  data: () => ({
		// GLOBALS
		REGION_BUFFER: 1000,

		UTR_HEIGHT: 10,
		CDS_HEIGHT: 20,

		regionIsSelected: false,

		selectedTranscript: null,
		edgesForGene: null,

		xArcDiagram: null,
		xBrushable: null,
		xTranscriptDiagram: null,
		tooltip: null,

		showLabels: false,
		showSameStrandOnly: false, 

		brush: null,

		showLoading: false,

    minUniquelyMappedReads: 1,
    colorBy: 'exon span',

    arcPointerWidth: 16,
    arcPointerHeight: 16,

    MIN_ARC_HEIGHT: 30,
    ARC_FACTOR:     2


	}),
  methods: {

  	onDataChanged: function() {
  		let self = this;
  		if (this.tab == 'tab-2' && this.selectedGene) {
  			self.$nextTick(function() {
	  			self.onGeneSelected();
	  			if (self.spliceJunctionsForGene && self.spliceJunctionsForGene.gene == self.selectedGene.gene_name) {
	  				self.showLoading = false;
	  				self.loadDiagram();
	  			} else {
	  				d3.selectAll('#diagrams svg').remove();
				    d3.selectAll('#zoomed-diagrams svg').remove();
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
		    
		    let exons = transcript.features.filter(function(feature) {
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
		    let count = 1;
		    exons.forEach(function(exon) {
		      exon.number = count++;
		      exon.name = 'Exon ' + exon.number + ' (of ' + exons.length + ')'
		    })
		    transcript.exons = exons;
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
		    	                    self.xTranscriptDiagram )
		    
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();

		    if (event.type == 'end') {
			    let filteredEdges = self.edgesForGene.filter(function(edge) {
			      if (edge.fromPos < edge.toPos) {
			        return edge.fromPos >= regionStart || edge.toPos <= regionEnd;
			      } else {
			        return edge.toPos >= regionStart || edge.fromPos <= regionEnd;
			      }
			    })
			    let filteredEdgesClone = [];
			    filteredEdges.forEach(function(d) {
			    	let edge = $.extend({}, d)
			    	filteredEdgesClone.push(edge);
			    })
			    self.drawArcDiagram("#zoomed-diagrams", filteredEdgesClone, regionStart, regionEnd, {'createBrush': false})

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
			let height = +d3.select("#diagrams").select("#rushable-axis svg").attr("height");
			d3.select("#diagrams").select("rushable-axis svg")
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,height] ] )
		        .on("start end", self.onBrush)    
		      )   
		},

		drawTranscriptDiagram: function(container, gene, regionStart, regionEnd, options) {
			let self = this;
		  // dimensions
		  var margin = {top: 5, right: 170, bottom: 10, left: 0};
		  var width = self.$el.offsetWidth - 20;

		  var transcriptCount = options && options.selectedTranscriptOnly ? 1 : gene.transcripts.length;
		  var transcriptPadding = 5;
		  var transcriptHeight = self.CDS_HEIGHT;

		  var height = null;
		  if (transcriptCount == 1) {
		  	height = self.CDS_HEIGHT + margin.top;
		  } else {
			  height = (transcriptCount * (transcriptHeight+transcriptPadding)) + margin.top + margin.bottom
		  }

		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;


		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth + margin.left]);
		  var y = d3.scalePoint();
		  y.domain(gene.transcripts)
		  y.range([margin.bottom, height-margin.top-margin.bottom])

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
		        return `translate(${margin.left},${d.y = y(d) - transcriptHeight})`
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
		        return Math.max(1, Math.round(x(d.end) - x(d.start)))
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
		     	})
		      .on("mouseover", function(event,d) {
		      	self.onSelectExon(d, {'click': false});
		      })
		     .on("mouseout", function(d) {
		        self.tooltip.transition()
		         .duration(500)
		         .style("opacity", 0);
		      });
		      

		  if (options && options.showBoundingBox) {  
		    self.xTranscriptDiagram = x;	
			  svg.selectAll("rect.bounding-box").remove();
			  svg
				 .append("rect")
				 .attr("class", "bounding-box")
				 .attr("x", 0)
				 .attr("y", 0)
				 .attr("width", 0)
				 .attr("height", 0)
		  }

		},



		onSelectExon: function(exon, options={'click': false}) {

			let self = this;
			d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)
    	d3.selectAll('#transcript-diagram .transcript.selected .exon-' + exon.number).classed("exon-highlight",true);

    	let count = 0;
    	let spliceJunctionsStarting = self.edgesForGene.filter(function(edge) {
    		if (edge.from && edge.from == exon.number) {
    			return true;
    		} else {
    			return false;
    		}
    	}).map(function(spliceJunction) {
    		let startExon = self.locateExon(spliceJunction.fromPos);
		    let endExon = self.locateExon(spliceJunction.toPos);
		    let sj = {'key': count++,
    			        'startExon': startExon,
    			        'endExon': endExon}
    		return $.extend(sj, spliceJunction)
    	})
    	count = 0;
    	let spliceJunctionsEnding = self.edgesForGene.filter(function(edge) {
    		if (edge.to && edge.to == exon.number) {
    			return true;
    		} else {
    			return false;
    		}
    	}).map(function(spliceJunction) {
    		let startExon = self.locateExon(spliceJunction.fromPos);
		    let endExon = self.locateExon(spliceJunction.toPos);
		    let sj = {'key': count++,
    			        'startExon': startExon,
    			        'endExon': endExon}
    		return $.extend(sj, spliceJunction)
    	})

    	let selectedExon = $.extend({
      		'type': 'exon', 
      		'click': options.click, 
      		'spliceJunctionsExiting':  spliceJunctionsStarting,
      		'spliceJunctionsEntering': spliceJunctionsEnding}, exon);

			self.$emit('object-selected', selectedExon)
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
		  let maxScore = d3.max(edges, function(d) {
		    return d.score;
		  })

		  // dimensions
		  var margin = {top: 5, right: 170, bottom: 5, left: 0};
		  var width = self.$el.offsetWidth - 20,
		      height = 150;

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
		                    .domain([self.minUniquelyMappedReads, maxScore])
		                    .range([2, 12])


		           

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

		  var arcColor = null;
		  let motifColors = ["#4e79a7","#f28e2c","#bcbd22","#76b7b2","#59a14f","#edc949","#af7aa1","#ff9da7","#9c755f","#bab0ab"]
		  let strandColors = ["#1b9e77","#d95f02","#666666"]
		  let exonSpanColors = ["#4e79a7","#f28e2c"]

		  if (self.colorBy == 'motif') {
			  let motifMap = {};
			  edges.forEach(function(edge) {
			  	motifMap[edge.motif] = edge.motif
			  })
			  arcColor = d3.scaleOrdinal()
	                   .domain(Object.keys(motifMap))
	                   .range(d3.schemeTableau10);
		  } else if (self.colorBy == 'strand') {
				let strandMap = {};
					edges.forEach(function(edge) {
					strandMap[edge.strand] = edge.strand
				})
	      arcColor = d3.scaleOrdinal()
	                   .domain(['+', '-', 'undefined'])
	                   .range(d3.schemeTableau10);
		  } else if (self.colorBy == 'exon span') {
			  arcColor = d3.scaleOrdinal()
	                   .domain([true, false])
	                   .range(d3.schemeTableau10);

		  } 

		  let arc_old = function(d) {
		    let start = x(d.fromPos);  // X position of start node on the X axis
		    let end  = x(d.toPos);   // X position of end node
		    let distance = Math.round(end - start)
		    
		    let inflectionRatio = 2;
		    let inflectionPoint = Math.round(distance/inflectionRatio);
		    let inflectionPoint2 = inflectionPoint*inflectionRatio;
		    if (inflectionPoint2 > innerHeight-20) {
		    	inflectionPoint = innerHeight-20;
		      inflectionPoint2 = Math.round(inflectionPoint/2.5);
		    } 

		    d.arcYTop = innerHeight - Math.max(inflectionPoint, inflectionPoint2)
		    d.arcXCenter = start + (distance/2)


		    return ['M', start, innerHeight, // the arc starts at the coord x=start
		      'A',                   // build an elliptical arc
		      inflectionPoint, ',',  // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
		      inflectionPoint2, 0, 0, ',',
		      start < end ? 1 : 0, end, ',', innerHeight] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
		      .join(' ');
		  }

			let arc = function(d) {
				

		    let start = x(d.fromPos);  // X position of start node on the X axis
		    let end  = x(d.toPos);   // X position of end node
		    let distance = Math.round(end - start)

		    let rx = null;
		    let ry = null;
		    let maxHeight = innerHeight - 10;
		    
		    if (distance/self.ARC_FACTOR <= self.MIN_ARC_HEIGHT) {
		    	rx = distance/self.ARC_FACTOR;
		    	ry = self.MIN_ARC_HEIGHT;

		    } else  {
		    	if (distance/self.ARC_FACTOR <= maxHeight) {
		    		rx = distance/self.ARC_FACTOR;
		    		ry = distance/self.ARC_FACTOR;
	    		} else {
	    			rx = distance/self.ARC_FACTOR;
	    			ry = maxHeight;
	    		}
		    }

				d.arcYTop = innerHeight - Math.max(rx, ry)
				if (d.arcYTop < 0) {
					d.arcYTop = 10;
				}
		    d.arcXCenter = start + (distance/self.ARC_FACTOR)

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
		  .data(edges)
		  .join("path")
		    .attr("d", arc)
		    .attr("class", function(d) {
		    	return "junction" + 
		    	(d.exonSpanned ? " exon-spanned" : "") + 
		    	(d.strand == "undefined" || d.strand == self.selectedGene.strand ? " strand-matches" : " strand-mismatches");
		    })
		    .attr("stroke-width", function(d) {
		      //return scaleArcWidth(d.score);
		      return 2;
		    })
		    .attr("stroke", function(d) {
		    	if (self.colorBy == '') {
		    		return "#9f9f9f";

		    	} else {
			    	let colorField = null;
			    	if (self.colorBy == 'exon span') {
			    		colorField = 'exonSpanned'
			    	} else {
			    		colorField = self.colorBy;
			    	}
			    	return arcColor(d[colorField]);		    		
		    	}
		    })
		  .on("click", function(event,d) {
		     let arcXCenter = d.arcXCenter;
		     let arcYTop    = d.arcYTop;

		     let startExon = self.locateExon(d.fromPos);
		     let endExon = self.locateExon(d.toPos);

		     d3.selectAll("#arc-diagram path.junction").classed("selected", false);
		     d3.select(this).classed("selected", true)

		     svg.select(".arc-pointer")
		        .attr("transform", function(d) {
		        	return "translate(" + (arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
		        	+ "," 
		        	+ (arcYTop - self.arcPointerHeight) + ")"
		         })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		     d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)

		     if (startExon) {
		      d3.selectAll('#transcript-diagram .transcript.selected .exon-' + startExon.number).classed("exon-highlight",true);
		     }
		     if (endExon) {
		       d3.selectAll('#transcript-diagram .transcript.selected .exon-' + endExon.number).classed("exon-highlight", true);
		     }


		     let spliceJunctionObject = $.extend({
																     	'type': 'splice-junction', 
																     	'clicked': true, 
																     	'startExon': startExon,
																     	'endExon': endExon
																     	}, d)
		     self.$emit("object-selected", spliceJunctionObject)


		  })
		  .on("mouseover", function(event,d) {

		     let arcXCenter = d.arcXCenter;
		     let arcYTop    = d.arcYTop;

		     let startExon = self.locateExon(d.fromPos);
		     let endExon = self.locateExon(d.toPos);

		     d3.selectAll("#arc-diagram path.junction").classed("selected", false);
		     d3.select(this).classed("selected", true)

		     svg.select(".arc-pointer")
		        .attr("transform", function(d) {
		        	return "translate(" + (arcXCenter - self.arcPointerWidth/self.ARC_FACTOR) 
		        	+ "," 
		        	+ (arcYTop - self.arcPointerHeight) + ")"
		         })
			      .transition()
			      .duration(200)
			      .style("opacity", .9); 

		     d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)

		     if (startExon) {
		      d3.selectAll('#transcript-diagram .transcript.selected .exon-' + startExon.number).classed("exon-highlight",true);
		     }
		     if (endExon) {
		       d3.selectAll('#transcript-diagram .transcript.selected .exon-' + endExon.number).classed("exon-highlight", true);
		     }


		     let spliceJunctionObject = $.extend({
																     	'type': 'splice-junction', 
																     	'clicked': false, 
																     	'startExon': startExon,
																     	'endExon': endExon
																     	}, d)
		     self.$emit("object-selected", spliceJunctionObject)


		  })
		 .on("mouseout", function(d) {
		    d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)    

		     d3.selectAll("#arc-diagram path.junction.selected").classed("selected", false);

		    self.tooltip.transition()
		     .duration(500)
		     .style("opacity", 0);

		    svg.select(".arc-pointer")
			      .transition()
			      .duration(500)
			      .style("opacity", 0); 
		  });

	   let arcLabels = svg.insert("g", "*")
			  .attr("class", "arc-labels")
			  .selectAll("text.junction")
			  .data(edges)
		    .join("text")
		      .attr("class", "junction")
		      .attr("x", function(d) {
		      	return d.arcXCenter
		      })
		      .attr("y", function(d) {
		      	return d.arcYTop - 2
		      })
		      .text(function(d) {
		      	let counts = d.numUniqueReads;
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
  		//this.showLoading = this.loadInProgress;
  	},
    minUniquelyMappedReads: function() {
      this.onSettingsChanged();
    },
    colorBy: function() {
      this.onSettingsChanged();
    },
    showLabels: function() {
    	d3.select("#arc-diagram").classed("hide-labels", !this.showLabels)
    },
    showSameStrandOnly: function() {
    	d3.select("#arc-diagram").classed("hide-strand-mismatches", this.showSameStrandOnly)
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
  font-size: 13px;
  padding-left: 10px;
  padding-right: 10px;
  display: flex;
  align-items: center;
  padding-top: 5px;
  padding-bottom: 5px;
  height: 40px;
  width: 320px;
  justify-content: center;
}

#brushable-axis  text{ 
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

svg path.junction {
  
  fill: transparent;
}



svg path.junction.selected {
	stroke: red;
}

.hide-strand-mismatches svg path.junction.strand-mismatches {
	display: none;
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

#transcript-diagram .exon-highlight {
  stroke: red;
  fill: red;
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

.arc-pointer {
	fill: red;
	stroke: black; 
	stroke-width: 1;
}

text.junction {
	text-anchor: middle;
	fill: black;
	font-size: 11px;
}

.hide-labels text.junction {
	display: none;
}

#label-cb, #show-matching-strand-only-cb {
	height: 45px;
}
#show-matching-strand-only-cb {
	width: 190px;
}
#label-cb label, #show-matching-strand-only-cb label {
	font-size: 13px !important;
  padding-top: 3px !important;
  line-height: 15px !important
}


#list-for-transcript-menu .v-list-item {
	padding: 0;
}
</style>
