<template>

<div>
	<div class="text-center" v-if="showLoading">
    <v-progress-circular v-if="showLoading"
      indeterminate
      color="primary"
    ></v-progress-circular>
  </div>

      <div id="igv-heading" class="d-flex flex-row justify-space-between align-center mb-1" >
          <h2 class="mr-16">
            Splice Junctions
          </h2>
          <div class="ml-4 mr-5 d-flex align-center">
            <div style="width: 150px">
		          <v-switch v-model="zoomSwitch" label="Drag to zoom"  hide-details>
		          </v-switch>
		        </div>
	          <div class="instruction-box" v-if="zoomSwitch && regionIsSelected">
	          	Click outside of bounding box to zoom out
	          </div>
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
              :items="['numUniqueReads','strand', 'motif']"
            ></v-select>
          </div>
          <div style="width:155px" class="mr-5">
            <v-select 
              v-model="theGeneSource"
              hide-details="auto"
              label="Gene annotations"
              density="compact"
              :items="['gencode', 'refseq',]"
            ></v-select>
          </div>

          <v-spacer/>

      </div>

	<div id="diagrams">
	  <div id="arc-diagram">
	  </div>

    <div id="selected-transcript-panel">
		  <div id="transcript-diagram" >
		    <svg/>
		  </div>
	  </div>
	  
	  <v-expansion-panels density="compact">
		  <v-expansion-panel eager>
		    <v-expansion-panel-title>
		    	Select transcript
		    </v-expansion-panel-title>

		    <v-expansion-panel-text eager>
		    	<div id="transcript-menu-panel">
					  <div id="transcript-diagram" class="multiple">
					  </div>
					</div>
 				</v-expansion-panel-text>
 			</v-expansion-panel>
		</v-expansion-panels>


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

		zoomSwitch: false,
		regionIsSelected: false,

		selectedTranscript: null,
		selectedEdges: null,

		xArcDiagram: null,
		tooltip: null,

		brush: null,

		showLoading: false,

    minUniquelyMappedReads: 1,
    colorBy: 'motif',
    theGeneSource: self.geneModel ? self.geneModel.geneSource : 'gencode',


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
		  		self.selectedEdges = self.createEdges(self.spliceJunctionsForGene.spliceJunctions)

			    let geneStart = self.selectedGene.start - self.REGION_BUFFER;
			    let geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

			    self.xArcDiagram = null;

			    d3.selectAll('#diagrams #arc-diagram svg').remove();
			    d3.selectAll('#zoomed-diagrams #arc-diagram svg').remove();

			    self.drawArcDiagram('#diagrams', self.selectedEdges, geneStart, geneEnd, 
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

				self.selectedEdges = self.createEdges(self.spliceJunctionsForGene.spliceJunctions)

		    let geneStart = self.selectedGene.start - self.REGION_BUFFER;
		    let geneEnd   = self.selectedGene.end   + self.REGION_BUFFER;

		    self.xArcDiagram = null;

		    d3.selectAll('#diagrams svg').remove();
		    d3.selectAll('#zoomed-diagrams svg').remove();

		    self.drawArcDiagram('#diagrams', self.selectedEdges, geneStart, geneEnd, 
		    	{'createBrush': false});

		    self.drawTranscriptDiagram("#diagrams #selected-transcript-panel", self.selectedGene, geneStart, geneEnd,  
		      {'selectedTranscriptOnly': true, 'allowSelection': false})


		    self.drawTranscriptDiagram('#diagrams #transcript-menu-panel', self.selectedGene, geneStart, geneEnd, 
		    	{'selectedTranscriptOnly': false, 'allowSelection': true});			
  		} else {
  			console.log("Problem encountered. Splice junctions gene does not match selected gene.")
  		}
  	},

		determineExons: function(gene) {
		  gene.transcripts.forEach(function(transcript) {
		    
		    let exons = transcript.features.filter(function(feature) {
		      if ( transcript.transcript_type == 'protein_coding'
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

		createEdges: function(spliceJunctions) {
		  let self = this;
		  let edges = spliceJunctions.filter(function(bedRow) {
		    return +bedRow.score >= self.minUniquelyMappedReads
		  })
		  .map(function(bedRow) {
		    return {from:    null, 
		            to:      null, 
		            fromPos: +bedRow.start, 
		            toPos:   +bedRow.end, 
		            score:   +bedRow.score,
		            motif:   bedRow.annots.motif,
		            strand:  bedRow.strand,
		            numUniqueReads: +bedRow.score}
		  })
		  return edges;
		},

		// Function that is triggered when brushing is performed
		onBrush:  function(event) {
			let self = this;
		  // Get the selection coordinate
		  let extent = event.selection 
		  if (extent && extent.length == 2 && extent[0] != extent[1]) {
		  	self.regionIsSelected = true;
		    let regionStart = self.xArcDiagram.invert(extent[0]);
		    let regionEnd   = self.xArcDiagram.invert(extent[1]);
		    
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();

		    let filteredEdges = self.selectedEdges.filter(function(edge) {
		      if (edge.fromPos < edge.toPos) {
		        return edge.fromPos >= regionStart || edge.toPos <= regionEnd;
		      } else {
		        return edge.toPos >= regionStart || edge.fromPos <= regionEnd;
		      }
		    })
		    self.drawArcDiagram("#zoomed-diagrams", filteredEdges, regionStart, regionEnd, {'createBrush': false})

		    self.drawTranscriptDiagram("#zoomed-diagrams", self.selectedGene, regionStart, regionEnd, 
		      {'selectedTranscriptOnly': true, 'allowSelection': false})
		  } else {
		    d3.select("#zoomed-diagrams").select("#arc-diagram svg").remove();
		    d3.select("#zoomed-diagrams").select("#transcript-diagram svg").remove();
		    self.regionIsSelected = false;

		  }
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
			let width = +d3.select("#diagrams").select("#arc-diagram svg").attr("width");
			let height = +d3.select("#diagrams").select("#arc-diagram svg").attr("height");
			d3.select("#diagrams").select("#arc-diagram svg")
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,height] ] )
		        .on("start end", self.onBrush)    
		      )   
		},

		drawTranscriptDiagram: function(container, gene, regionStart, regionEnd, options) {
			let self = this;
		  // dimensions
		  var margin = {top: 0, right: 170, bottom: 10, left: 0};
		  var width = self.$el.offsetWidth - 20;

		  var transcriptCount = options && options.selectedTranscriptOnly ? 1 : gene.transcripts.length;
		  var transcriptPadding = 5;
		  var transcriptHeight = self.CDS_HEIGHT;
		  var height = ((transcriptCount * (self.CDS_HEIGHT + transcriptPadding)) - self.CDS_HEIGHT);

		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;


		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth + margin.left]);
		  var y = d3.scalePoint();
		  y.domain(gene.transcripts)
		  y.range([margin.bottom, height-margin.top])

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#transcript-diagram")
		  .append("svg")
		    .attr("width", width)
		    .attr("height", height + margin.top + margin.bottom + (gene.transcripts.length))
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
		      // TODO: Need to number and name exons (post filter)
		      /*
		      .on("mouseover", function(event,d) {
		        self.tooltip.transition()
		         .duration(200)
		         .style("opacity", .9);
		        self.tooltip.html('Exon ' + (d.number) + "<br/>" + gene.chr + ":" + d.start + "-" + d.end)
		         .style("left", (event.pageX) + "px")
		         .style("top", (event.pageY - 28) + "px");
		      })
		     .on("mouseout", function(d) {
		        self.tooltip.transition()
		         .duration(500)
		         .style("opacity", 0);
		      });
		      */

		},
		
		drawArcDiagram: function(container, edges, regionStart, regionEnd, options) {
			let self = this;
		  let maxScore = d3.max(edges, function(d) {
		    return d.score;
		  })

		  // dimensions
		  var margin = {top: 0, right: 170, bottom: 0, left: 0};
		  var width = self.$el.offsetWidth - 20,
		      height = 200;

		  var innerWidth = width - margin.left - margin.right;
		  var innerHeight = height - margin.top - margin.bottom;



		  // scales
		  var x = d3.scaleLinear()
		            .domain([regionStart, regionEnd])
		            .range([margin.left, innerWidth]);
		  if (self.xArcDiagram == null) { 
		    // need this class variable so we can invert scale from screen coord to genome coords
		    self.xArcDiagram = x;   
		  }
		        
		  var y = d3.scaleLinear()
		            .domain([0, 1])
		            .range([height - margin.top - margin.bottom , 0]);

		  var scaleArcWidth = d3.scaleLinear()
		                    .domain([self.minUniquelyMappedReads, maxScore])
		                    .range([1, 10])

		  // append the svg object to the body of the page
		  var svg = d3.select(container).select("#arc-diagram")
		  .append("svg")
		    .attr("width", innerWidth)
		    .attr("height", height + margin.top + margin.bottom)
		  .append("g")
		    .attr("transform",
		          "translate(" + margin.left + "," + margin.top + ")");


		  if (options && options.createBrush) {
		    svg
		      .call( self.brush = d3.brushX()                  
		        .extent( [ [0,10], [width,innerHeight] ] )
		        .on("start end", self.onBrush)    
		      )       
		  }

		  var arcColor = null;
		  if (self.colorBy == 'motif') {
			  let motifMap = {};
			  edges.forEach(function(edge) {
			  	motifMap[edge.motif] = edge.motif
			  })
			  arcColor = d3.scaleOrdinal()
	                   .domain(Object.keys(motifMap))
	                   .range(d3.schemeTableau10);
		  } else if (self.colorBy == 'strand') {
	       arcColor = d3.scaleOrdinal()
	                   .domain(Object.keys(['+', '-']))
	                   .range(d3.schemeTableau10);
		  } else if (self.colorBy == 'numUniqueReads') {
		  	let minReads = d3.min(edges, function(d) {
		  		return d.numUniqueReads;
		  	})
		  	let maxReads = d3.max(edges, function(d) {
		  		return d.numUniqueReads;
		  	})
		  	arcColor = d3.scaleSequential()
		  	             .domain([maxReads, minReads])
                     .interpolator(d3.interpolateCividis);
		  }

		  let arc = function(d) {
		    let start = x(d.fromPos);  // X position of start node on the X axis
		    let end  = x(d.toPos);   // X position of end node
		    let distance = end - start
		    let inflectionRatio = 2;
		    let inflectionPoint = distance/inflectionRatio;
		    let inflectionPoint2 = inflectionPoint*inflectionRatio;
		    if (inflectionPoint > (height/2)-10) {
		      inflectionPoint = height;
		      inflectionPoint2 = inflectionPoint/3;
		    } 
		    return ['M', start, height-self.CDS_HEIGHT, // the arc starts at the coord x=start
		      'A',                   // build an elliptical arc
		      inflectionPoint, ',',  // Next 2 lines are the coordinates of the inflexion point. Height of this point is proportional with start - end distance
		      inflectionPoint2, 0, 0, ',',
		      start < end ? 1 : 0, end, ',', height-self.CDS_HEIGHT] // We always want the arc on top. So if end is before start, putting 0 here turn the arc upside down.
		      .join(' ');
		  }


		  var edges =  svg.insert("g", "*")
		  .selectAll("path.junction")
		  .data(edges)
		  .join("path")
		    .attr("d", arc)
		    .attr("class", "junction")
		    .attr("stroke-width", function(d) {
		      return scaleArcWidth(d.score);
		    })
		    .attr("stroke", function(d) {
		    	return arcColor(d[self.colorBy]);
		    })
		  .on("mouseover", function(event,d) {
		    self.tooltip.transition()
		     .duration(200)
		     .style("opacity", .9);

		     let startExon = self.locateExon(d.fromPos);
		     let endExon = self.locateExon(d.toPos);

		     d3.selectAll("#arc-diagram path.junction").classed("selected", false);
		     d3.select(this).classed("selected", true)

		     d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)

		     if (startExon) {
		      d3.selectAll('#transcript-diagram .transcript.selected .exon-' + startExon.number).classed("exon-highlight",true);
		     }
		     if (endExon) {
		       d3.selectAll('#transcript-diagram .transcript.selected .exon-' + endExon.number).classed("exon-highlight", true);
		     }

		     if (startExon && endExon) {
		      self.tooltip.html('Exon ' + startExon.number  + " to " + endExon.number  + "<br/>" + d.score + " uniquely mapped reads")
		     } else if (startExon ) {
		      self.tooltip.html('Exon ' + startExon.number  + " to " + '?'  + "<br/>" + d.score + " uniquely mapped reads")
		     } else if (endExon) {
		      self.tooltip.html('Exon ' + '?'  + " to " + endExon.number  + "<br/>" + d.score + " uniquely mapped reads")
		     } else {
		      self.tooltip.html("Pos " + d.fromPos + " to " + d.toPos + "<br/>" + d.score + " uniquely mapped reads")
		     }
		     let x = (event.pageX - 100) < 0 ? 0 : (event.pageX - 100);
		     let y = (event.pageY -  75)  < 0 ? 0 : (event.pageY - 75);
		     self.tooltip.style("left", x + "px")
		            .style("top",  y + "px");

		  })
		 .on("mouseout", function(d) {
		    d3.selectAll('#transcript-diagram .transcript.selected .exon-highlight').classed("exon-highlight", false)    

		    self.tooltip.transition()
		     .duration(500)
		     .style("opacity", 0);


		  });

		}

  },
  watch: {
  	selectedGene: function() {
  		this.onDataChanged();
  	},
  	tab: function() {
  		this.onDataChanged();
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
    theGeneSource: function() {
      if (this.geneModel) {
        this.geneModel.geneSource = this.theGeneSource;
        this.$emit("reinit")
      }
    },
    zoomSwitch: function() {
    	if (this.zoomSwitch) {
    		this.addBrushing(); 
    	} else {
    		this.clearZoom();
    	}
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
}
#arc-diagram, #transcript-diagram {
	padding: 0px 10px 0px 10px;
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

svg line.gene {
  stroke: black;
  stroke-width: 1;
}

svg text.transcript-label {
  font-size: 12px;
}
div.tooltip {
  position: absolute;
  text-align: center;
  width: 200px;
  height: 50px;
  padding: 2px;
  font-size: 12px;
  background: lightsteelblue;
  border: 0px;
  border-radius: 8px;
  pointer-events: none;
  padding: 5px;
}

#transcript-diagram {
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

.v-expansion-panel-title {
	min-height: 30px !important;
	padding: 5px !important;
	font-size: 14px !important;
}
.v-expansion-panel-text__wrapper {
	padding: 10px 0 8px 0 !important;
}
</style>
