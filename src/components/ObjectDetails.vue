 <template>
  <v-card id="object-details-card">

    <div v-if="selectedObject">

      <div style="margin-bottom: 10px">
        <h2 v-if="selectedObject.type == 'splice-junction'">
          <div class="d-flex flex-row align-center"> 
            Splice Junction
            <div class="d-flex flex-row ml-4" style="height:26px;">
              <v-chip color="red"  size="small" v-if="!selectedObject.isCanonicalSplice">Non-canonical splice</v-chip>
              <v-chip color="primary"  size="small" v-if="selectedObject.isAlternateSplice">Alternate splice</v-chip>
            </div>
          </div>
        </h2>
        <h2 v-if="selectedObject.type == 'exon'"> 
          Exon
        </h2>


      </div>
      <div class="selected-details" v-if="selectedObject.type == 'splice-junction'">
        <div class="d-flex flex-row mb-5" >
          {{ selectedObject.label }}
        </div>


        <div class="d-flex flex-row">
          <div class="so-label">
            Donor
            <v-chip size="x-small" color="red" v-if="selectedObject.donor.status == 'noncanonical'">{{ `noncanonical`}}
             </v-chip>
          </div>
          <div class="so-value">
             {{ selectedObject.donor.label }}
             <span v-if="selectedObject.donor.exon && selectedObject.donor.status == 'noncanonical' "> 
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
        <div v-if="selectedObject.donor.exon" class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.donor.pos }}</div>
        </div>
        <div v-if="selectedObject.donor.exonClosest" class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.donor.exonClosest }}</div>
        </div>



        <div class="d-flex flex-row">
          <div class="so-label">
             Acceptor
             <v-chip size="x-small" color="red" v-if="selectedObject.acceptor.status == 'noncanonical'">{{ `noncanonical`}}
             </v-chip>
          </div>
          <div class="so-value">
             {{ selectedObject.acceptor.label }}
             <span v-if="selectedObject.acceptor.exon && selectedObject.acceptor.status == 'noncanonical'"> 
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
        <div v-if="selectedObject.acceptor.exon" class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.acceptor.pos }}</div>
        </div>
        <div v-if="selectedObject.acceptor.exonClosest" class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.acceptor.exonClosest }}</div>
        </div>


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
  .selected-details
    >div
      margin-bottom: 5px
  .so-label
    width: 170px 
  .so-value   
    width: calc(100% - 170px)
</style>


