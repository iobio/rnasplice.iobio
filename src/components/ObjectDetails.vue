 <template>
  <v-card id="object-details-card">

    <div v-if="selectedObject">

      <div style="margin-bottom: 10px">
        <h2 v-if="selectedObject.type == 'splice-junction'"> 
          Splice Junction
        </h2>
        <h2 v-if="selectedObject.type == 'exon'"> 
          Exon
        </h2>
      </div>
      <div class="selected-details" v-if="selectedObject.type == 'splice-junction'">
        <div class="d-flex flex-row" style="height:30px;">
          <v-chip color="red"  size="small" v-if="!selectedObject.isCanonicalSplice">Non-canonical splice</v-chip>
          <v-chip color="primary"  size="small" v-if="selectedObject.isAlternateSplice">Alernate splice</v-chip>
        </div>
        <div class="d-flex flex-row">
          <div class="so-label">{{ startLabel(selectedObject) }}</div>
          <div class="so-value">{{ startValue(selectedObject) }}</div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.fromPos }}</div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label">Start exon boundary</div>
          <div class="so-value">{{ selectedObject.startExon ? selectedObject.startExon.start : '' }}-{{ selectedObject.startExon ? selectedObject.startExon.end : '' }}
          </div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label">{{ endLabel(selectedObject) }}</div>
          <div class="so-value">{{ endValue(selectedObject) }}</div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label"></div>
          <div class="so-value">{{ selectedObject.toPos }}</div>
        </div>


        <div class="d-flex flex-row">
          <div class="so-label">End exon boundary</div>
          <div class="so-value">{{ selectedObject.endExon ? selectedObject.endExon.start : '' }}-{{ selectedObject.endExon ? selectedObject.endExon.end : '' }}
          </div>
        </div>

        <div class="d-flex flex-row">
          <div class="so-label">Number unique reads</div>
          <div class="so-value">{{ selectedObject.numUniqueReads }}</div>
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

        <div v-if="selectedObject.spliceJunctionsEntering && selectedObject.spliceJunctionsExiting.length > 0">
          <h3 style="margin-top: 10px !important">Splice Junctions Entering</h3>
          <div v-for="spliceJunction in selectedObject.spliceJunctionsEntering" :key="spliceJunction.key" class="d-flex flex-row" style="flex-wrap:nowrap;margin-bottom: 10px">

              <div style="width:90px;">{{ startValue(spliceJunction, {'withLabel': true}) }}</div>
              <div style="width:16px;margin-left:2px;margin-right:2px">-></div>
              <div style="width:90px;margin-right:5px;">{{ endValue(spliceJunction,   {'withLabel': true}) }}</div>
              <div style="width:90px">{{ spliceJunction.numUniqueReads }} reads</div>
          </div>
        </div>

        <div v-if="selectedObject.spliceJunctionsExiting && selectedObject.spliceJunctionsExiting.length > 0">
          <h3 style="margin-top: 10px !important">Splice Junctions Exiting</h3>
          <div v-for="spliceJunction in selectedObject.spliceJunctionsExiting" :key="spliceJunction.key" class="d-flex flex-row" style="flex-wrap:nowrap;margin-bottom: 10px">

              <div style="width:94px;">{{ startValue(spliceJunction, {'withLabel': true}) }}</div>
              <div style="width:16px;margin-left:2px;margin-right:2px">-></div>
              <div style="width:94px">{{ endValue(spliceJunction,   {'withLabel': true}) }}</div>
              <div style="width:94px">{{ spliceJunction.numUniqueReads }} reads</div>
              <div >{{ spliceJunction.strand }}</div>
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
    selectedObject: Object
  },
  data: () => ({
  }),
  methods: {
    startLabel: function(spliceJunction) {
      if (spliceJunction) {
        if (spliceJunction.startExon) {
          return 'Start exon'
        } else {
          return 'Start pos'
        }
      } else {
        return "";
      }
    },
    startValue: function(spliceJunction, options={'withLabel': false}) {
      if (spliceJunction) {
        if (spliceJunction.startExon) {
          return (options.withLabel ? 'Exon ' : '') + spliceJunction.startExon.number;
        } else {
          return (options.withLabel ? 'Pos  '  : '') + spliceJunction.fromPos;
        }
      } else {
        return "";
      }
    },
    endLabel: function(spliceJunction) {
      if (spliceJunction) {
        if (spliceJunction.endExon) {
          return 'End exon'
        } else {
          return 'End pos'
        }
      } else {
        return "";
      }
    },
    endValue: function(spliceJunction, options={'withLabel': false}) {
      if (spliceJunction) {
        if (spliceJunction.endExon) {
          return (options.withLabel ? 'Exon ' : '') + spliceJunction.endExon.number
        } else {
          return (options.withLabel ? 'Pos  ' : '') + spliceJunction.toPos;
        }
      } else {
        return "";
      }
    }
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
    width: 220px 
  .so-value   
    width: calc(100% - 220px)
</style>


