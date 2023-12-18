<template>
  <v-card v-if="selectedGene" id="gene-card" class="main">
 
    <div class="d-flex flex-column">
    
      <div class="d-flex flex-row justify-start align-center">

        <div  id="gene-name" style="padding-top:4px">
          <h2> Gene {{ selectedGene.gene_name }} </h2>
        </div>

        <div class="pl-6 pr-3 flex-grow-0 flex-shrink-0">
          {{ selectedGene.chr }}
        </div>

        <div class="pr-3 flex-grow-0 flex-shrink-0">
          {{ formatRegion(selectedGene.startOrig) }} - {{ formatRegion(selectedGene.endOrig) }}
        </div>

        <div class="pr-3 d-flex flex-row align-center flex-grow-0 flex-shrink-0">
          <div  id="gene-plus-minus-label"  class="ml-2 mr-1">+  -</div>

          <div style="width:70px">
            <v-text-field  density="compact" hide-details="auto"
                    id="gene-region-buffer-input"
                    v-model="regionBuffer"
                    v-on:change="onGeneRegionBufferChange">
            </v-text-field>
          </div>
        </div>


        <v-chip   class="ml-2 mr-5 pr-3 flex-grow-0 flex-shrink-0" id="minus-strand" 
         size="x-small">
          {{ selectedGene.strand == '-' ? `reverse strand` : `forward strand` }}
        </v-chip>

        <div style="width:155px" class="ml-3">
            <v-select id="strand-combo"
              v-model="theGeneSource"
              hide-details="auto"
              label="Gene annotations"
              density="compact"
              :items="['gencode', 'refseq',]"
            ></v-select>
        </div>

       

        <div id="read-count-histogram" style="margin-left: 30px">
        </div>

        <div v-if="readCountMean">
          <div  class="read-stat">mean: {{ readCountMean }} </div>
          <div  class="read-stat">&#x3C3;:  {{ readCountStd }}  </div> 
        </div>

      </div>


    </div>
  </v-card>
</template>

<script>

  export default {
    name: 'GeneCard',
    components: {
      
    },
    props: {
      selectedGene: Object,
      geneModel: Object
    },
    data: () => ({
      regionBuffer: 1000,
      theGeneSource: 'gencode',

      readCountMean: null,
      readCountStd: null,
      readCountMin: null,
      readCountMax: null

    }),
    created: function() {
      if (this.selectedGene) {
        this.drawReadCountHistogram();
      }
    },
    methods: {
      onGeneRegionBufferChange: function (event) {
        this.$emit('gene-region-buffer-change', parseInt(this.regionBuffer));
      },
      formatRegion: function (value) {
        return !value ? '' : value.toLocaleString('en-US');
      },
      formatTranscriptType: function(transcript) {
        if (transcript && transcript.transcript_type.indexOf("transcript") < 0) {
          return transcript.transcript_type + " transcript";
        } else if (transcript) {
          return transcript.transcript_type;
        } else {
          return "";
        }
      },
      drawReadCountHistogram: function() {
        let self = this;

        

        let spliceJunctions = self.geneModel.geneToSpliceJunctionObjects[self.selectedGene.gene_name]
        if (spliceJunctions == null) {
          return;
        }

        let summary = self.geneModel.geneToSpliceJunctionSummary[self.selectedGene.gene_name]
        if (summary) {
          self.readCountMean = summary.meanReadCountCanonical;
          self.readCountStd =  summary.stdReadCountCanonical;
          self.readCountMin =  summary.minReadCountCanonical;
          self.readCountMax =  summary.maxReadCountCanonical;          
        }


        let data = spliceJunctions.filter(function(spliceJunction) {
          return spliceJunction.spliceKind == 'canonical';
        })

        // set the dimensions and margins of the graph
        var margin = {top: 10, right: 10, bottom: 30, left: 40},
            width = 250 - margin.left - margin.right,
            height = 120 - margin.top - margin.bottom;

        
        // append the svg object to the body of the page
        var svg = d3.select("#read-count-histogram")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        let maxReadCount = d3.max(data, function(d) {
          return +d.readCount;
        })
        // X axis: scale and draw:
        var x = d3.scaleLinear()
            .domain([0, maxReadCount])   
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5));

        svg.append("text")
           .attr("class", "histogram-text")
           .attr("x", (width / 2))
           .attr("y", 0)
           .style("text-anchor", "middle")
           .text("Canonical splice junctions")

        svg.append("text")
           .attr("class", "histogram-text")
           .attr("x", (width / 2))
           .attr("y", height + margin.top + margin.bottom - 10)
           .style("text-anchor", "middle")
           .text("Read count")

        svg.append("text")
           .attr("class", "histogram-text")
           .attr("x", 0)
           .attr("y", height)
           .style("text-anchor", "middle")
           .style("transform", "translate(-110px, 40px)rotate(-90deg)")
           .text("Frequency")

        // set the parameters for the histogram
        var histogram = d3.histogram()
            .value(function(d) { return d.readCount; })   // I need to give the vector of value
            .domain(x.domain())  // then the domain of the graphic
            .thresholds(x.ticks(30)); // then the numbers of bins

        // And apply this function to data to get the bins
        var bins = histogram(data);

        // Y axis: scale and draw:
        var y = d3.scaleLinear()
            .range([height, 0]);
            y.domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
        svg.append("g")
            .call(d3.axisLeft(y).ticks(5));

        // Add a rect for each bin.
        svg.append("g")
            .attr("fill", "steelblue")
          .selectAll()
          .data(bins)
          .join("rect")
            .attr("x", (d) => x(d.x0) + 1)
            .attr("width", (d) => Math.max(1, x(d.x1) - x(d.x0) - 1))
            .attr("y", (d) => y(d.length))
            .attr("height", (d) => y(0) - y(d.length));


      }
    },
    watch: {
      alerts: function() {
      },
      theGeneSource: function() {
        if (this.geneModel) {
          this.geneModel.geneSource = this.theGeneSource;
        //  this.$emit("reinit")
        }
      },
      selectedGene: function() {
        let self = this;
        self.$nextTick(function() {
          if (!d3.select("#read-count-histogram svg").empty()) {
            d3.select("#read-count-histogram svg").remove();
          }
          self.readCountMean = null;
          self.readCountStd = null;
          self.readCountMin = null;
          self.readCountMax = null;
          if (self.selectedGene) {
            setTimeout(function() {
              self.drawReadCountHistogram();
            }, 3000)            
          }

        })
      }
    }
  }
</script>


<style lang="sass">
@import '../styles/variables.sass'

#gene-card
  padding: 5px 10px !important
  #gene-region-buffer-input
    font-size: 13px

  #region-buffer-box
    .input-group--text-field, .v-text-field__slot
      input
        font-size: 14px
        color: $text-color
        fill:  $text-color
  #minus-strand
    font-size: 13px


  .read-stat 
    font-size: 11px
    color: rgb(73, 73, 73)
    font-style: italic

  .v-select
    .v-field
      font-size: 13px
  .histogram-text
    font-size: 11px
    fill: rgb(73, 73, 73)

</style>