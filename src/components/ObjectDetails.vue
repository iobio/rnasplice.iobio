 <template>
  <v-card id="object-details-card">

    <div v-if="selectedObject">

      <div style="margin-bottom: 10px">
        <h2 v-if="selectedObject.type == 'splice-junction'">
          <div class="d-flex flex-row align-center"> 
            Splice Junction
            <div class="d-flex flex-row ml-4" style="height:26px;">
              <v-chip color="#e66a7f"  size="small" v-if="selectedObject.spliceKind == 'cryptic-site'">Cryptic-site splice</v-chip>
              <v-chip color="#c57a02"  size="small" v-if="selectedObject.spliceKind=='exon-skipping'">Exon-skipping</v-chip>
            </div>
          </div>
        </h2>
        <h2 v-if="selectedObject.type == 'exon'"> 
          Exon
        </h2>
        <h2 v-if="selectedObject.type == 'variant'"> 
          <div class="d-flex flex-row align-center"> 
            Variant
            <div class="d-flex flex-row ml-4" style="height:26px;">
              <v-chip color="primary"  size="small" v-if="selectedObject.isSpliceVariant">Splice Variant</v-chip>
            </div>
          </div>
        </h2>


      </div>
      <div class="selected-details" v-if="selectedObject.type == 'splice-junction'">
        <div class="d-flex flex-row mb-5" >
          {{ selectedObject.label }}
        </div>


        <div class="d-flex flex-row">
          <div class="so-label">
            Donor
            <v-chip size="x-small" color="#e66a7f" v-if="selectedObject.donor.status == 'cryptic-site'">{{ `cryptic-site`}}
             </v-chip>
          </div>
          <div class="so-value">
             {{ selectedObject.donor.label }}
             <span v-if="debug && selectedObject.donor.exon && selectedObject.donor.status == 'cryptic-site' ">
                 <span :style="selectedGene.strand == `-` ? `font-style:italic;color:red` : ``">                 
                  {{ selectedObject.donor.exon.start }}
                 </span>
                 <span>-</span>
                 <span :style="selectedGene.strand == `+` ? `font-style:italic;color:red` : ``">
                  {{ selectedObject.donor.exon.end }}
                 </span>
             </span>
          </div>
        </div>
        <div v-if="selectedObject.isPreferredTranscript == false && selectedObject.donor.transcript" class="d-flex flex-row">
          <div class="so-label indent">Transcript</div>
          <div class="so-value">{{ selectedObject.donor.transcript.transcript_id }}</div>
        </div>

        <div v-if="selectedObject.donor.exon" class="d-flex flex-row">
          <div class="so-label indent">Position</div>
          <div class="so-value">{{ selectedObject.donor.pos }} </div>
        </div>
        <div v-if="selectedObject.donor.delta && selectedObject.donor.delta != 0" class="d-flex flex-row">
          <div class="so-label indent ">Pos relative to exon boundary</div>
          <div class="so-value">{{ selectedObject.donor.delta }}{{ selectedObject.donor.delta  > 0 ? ' (donor site is upstream the exon boundary)': ' donor site is downstream the exon boundary)'}}</div>
        </div>
        <div v-if="selectedObject.donor.exonClosest" class="d-flex flex-row">
          <div class="so-label indent">Closest exon to donor</div>
          <div class="so-value">Exon {{ selectedObject.donor.exonClosest.number }}</div>
        </div>

        <v-divider style="border-top-color:black"/>

        <div class="d-flex flex-row">
          <div class="so-label">
             Acceptor
             <v-chip size="x-small" color="#e66a7f" v-if="selectedObject.acceptor.status == 'cryptic-site'">{{ `cryptic-site`}}
             </v-chip>
          </div>
          <div class="so-value">
             {{ selectedObject.acceptor.label }}
             <span v-if="debug && selectedObject.acceptor.exon && selectedObject.acceptor.status == 'cryptic-site'">
                 <span :style="selectedGene.strand == `+` ? `font-style:italic;color:red` : ``">                 
                  {{ selectedObject.acceptor.exon.start }}
                 </span>
                 <span>-</span>
                 <span :style="selectedGene.strand == `-` ? `font-style:italic;color:red` : ``">
                  {{ selectedObject.acceptor.exon.end }}
                 </span>
             </span>
          </div>
        </div>
        <div v-if="selectedObject.isPreferredTranscript == false && selectedObject.acceptor.transcript" class="d-flex flex-row">
          <div class="so-label indent">Transcript</div>
          <div class="so-value">{{ selectedObject.acceptor.transcript.transcript_id }}</div>
        </div>
        <div v-if="selectedObject.acceptor.exon" class="d-flex flex-row">
          <div class="so-label indent">Position</div>
          <div class="so-value">{{ selectedObject.acceptor.pos }}</div>
        </div>
        <div v-if="selectedObject.acceptor.delta && selectedObject.acceptor.delta != 0" class="d-flex flex-row">
          <div class="so-label indent">Pos relative to exon boundary</div>
          <div class="so-value">{{ selectedObject.acceptor.delta }}{{ selectedObject.acceptor.delta  > 0 ? ' (acceptor site is  upstream exon boundary)': '  (acceptor site is downstream the exon boundary)'}}</div>
        </div>

        <div v-if="selectedObject.acceptor.exonClosest" class="d-flex flex-row">
          <div class="so-label indent">Closest exon to acceptor</div>
          <div class="so-value">Exon {{ selectedObject.acceptor.exonClosest.number }}</div>
        </div>

        <v-divider style="border-top-color:black"/>


        <div class="d-flex flex-row">
          <div class="so-label">Number unique reads</div>
          <div class="so-value">{{ selectedObject.readCount }}</div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label">Strand</div>
          <div class="so-value">{{ selectedObject.strand }}</div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label">Motif</div>
          <div class="so-value">{{ selectedObject.motif }}</div>
        </div>

      </div>

      <div class="selected-details" v-if="selectedObject.type == 'exon'">
        <div class="d-flex flex-row">
          <div class="so-label">Exon</div>
          <div class="so-value">{{ selectedObject.name }}</div>
        </div>

        <div v-if="selectedObject.donorSpliceJunctions && selectedObject.donorSpliceJunctions.length > 0">
          <h3 style="margin-top: 10px !important">Donor Splice Junctions</h3>
          <div v-for="spliceJunction in selectedObject.donorSpliceJunctions" :key="spliceJunction.key" class="d-flex flex-row" style="flex-wrap:nowrap;margin-bottom: 10px">
             {{ spliceJunction.label }}
          </div>
        </div>

        <div v-if="selectedObject.acceptorSpliceJunctions && selectedObject.acceptorSpliceJunctions.length > 0">
          <h3 style="margin-top: 10px !important">Acceptor Splice Junctions</h3>
          <div v-for="spliceJunction in selectedObject.acceptorSpliceJunctions" :key="spliceJunction.key" class="d-flex flex-row" style="flex-wrap:nowrap;margin-bottom: 10px">
             {{ spliceJunction.label }}
          </div>
        </div>

      </div>

      <div class="selected-details" v-if="selectedObject.type == 'variant'">
        <div class="d-flex flex-row mb-5" >
          {{ selectedObject.variant.type }} {{ selectedObject.variant.chrom }}:{{ selectedObject.variant.start }} {{ selectedObject.variant.ref }} > {{ selectedObject.variant.alt }}
        </div>

        <div class="d-flex flex-row">
          <div class="so-label indent">Impact</div>
          <div class="so-value">{{ Object.keys(selectedObject.variant.vepImpact).join(", ").replaceAll("_", " ") }}</div>
        </div>        

        <div class="d-flex flex-row">
          <div class="so-label indent">Consequence</div>
          <div class="so-value">{{ Object.keys(selectedObject.variant.vepConsequence).join(", ").replaceAll("_", " ") }}</div>
        </div>        
      </div>      

    </div>

  </v-card>
</template>


<script>


export default {
  name: 'ObjectDetails',
  components: {
    
    
  },
  props: {
    selectedObject: Object,
    selectedGene: Object
  },
  data: () => ({
    debug: false
  }),
  methods: {
  },
  computed: {
  }
}
</script>

<style lang="sass">
@import '../styles/variables.sass'

#object-details-card
  flex-grow:    0
  height:      355px
  overflow-y:  scroll

  .selected-details
    >div
      margin-bottom: 5px
  .so-label
    width: 200px 
    &.indent
      padding-left: 10px
  .so-value   
    width: calc(100% - 170px)
</style>


