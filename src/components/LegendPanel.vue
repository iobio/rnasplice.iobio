<template>
  <div id="legend" >

    <h3 class="mt-4">Splice Junctions</h3>

    <div style="text-align:left;width:200px;margin-right:15px;margin-bottom:10px">

      <legend-icon style="margin-top: 10px"
       icon="junction-non-mane-transcript"
       level="none"
       width="25"
       label="  Not MANE transcript">
      </legend-icon>

      <legend-icon
       icon="junction-strand-mismatch"
       level="none"
       width="25"
       label="  Opposite strand of gene">
      </legend-icon>
    </div>

    <h3 class="mt-4">Variants</h3>

    <div style="display:flex;flex-wrap:wrap;justify-content:flex-start;margin-top:10px;">


      <div style="text-align:left;width:80px;margin-right:15px;margin-bottom:10px">

        <div  class="legend-label">Splicing
         <info-popup name="impact"></info-popup>
        </div>


        <legend-icon
         icon="splice-variant"
         level="none"
         width="18"
         height="18"
         label="Splice site">
        </legend-icon>
      </div>



      <div style="text-align:left;width:80px;margin-right:15px;margin-bottom:10px">

        <div  class="legend-label">Impact
         <info-popup name="impact"></info-popup>
        </div>

        <legend-icon
         icon="impact"
         type="snp"
         clazz="impact_HIGH"
         width="14"
         height="14"
         label="High">
        </legend-icon>
        <legend-icon
         icon="impact"
         type="snp"
         clazz="impact_MODERATE"
         width="14"
         height="14"
         label="Moderate">
        </legend-icon>
        <legend-icon
         icon="impact"
         type="snp"
         clazz="impact_MODIFIER"
         width="14"
         height="14"
         label="Modifier">
        </legend-icon>
        <legend-icon
         icon="impact"
         type="snp"
         clazz="impact_LOW"
         width="14"
         height="14"
         label="Low">
        </legend-icon>
        
      </div>


      <!--      Variant Type-->
      <div style="text-align:left;width:150px;">
          <div class="legend-label">Variant type
            <info-popup name="variantType"></info-popup>
          </div>

        <div style="display:flex">
          <legend-icon
           style="display:inline-block;fill:lightgray"
           icon="impact"
           type="snp"
           level="none"
           width="14"
           height="14"
           label="SNP">
          </legend-icon>
        </div>

        <legend-icon
         icon="impact"
         style="fill:lightgray"
         type="del"
         level="none"
         width="16"
         height="16"
         label="Deletion">
        </legend-icon>

        <legend-icon
         icon="impact"
         style="fill:lightgray"
         type="ins"
         level="none"
         width="16"
         height="16"
         label="Insertion">
        </legend-icon>

        <legend-icon
         icon="impact"
         style="fill:lightgray"
         type="complex"
         level="none"
         width="18"
         height="18"
         label="Complex">
        </legend-icon>

      </div>

    </div>


  </div>
</template>

<script>

import LegendIcon from "./LegendIcon.vue"
import AppIcon from "./AppIcon.vue"
import InfoPopup from "./InfoPopup.vue"

export default {
  name: 'legend-panel',
  components: {
    AppIcon,
    LegendIcon,
    InfoPopup
  },
  props: {
    isBasicMode: null,
    isSimpleMode: null,
    showLegendTitle: true,
    allowMinimize: false,
    activeTab: null
  },
  data () {
      return {
        isExpanded: true
      }
  },
  watch: {
    activeTab: function() {
      let self = this;
      // For Nebula simplified mode, minimize the legend panel
      // on the variants tab.
      if (self.isSimpleMode) {
        if (self.activeTab && self.activeTab == 1) {
          if (self.isExpanded) {
            setTimeout(function() {
              self.onMinimize()
            }, 100)
          }
        }
      }
    }
  },
  computed: {
  },
  methods: {
    onMinimize: function() {
      this.isExpanded = false;
      $('#side-panel-container').addClass("minimized-legend")
    },
    onMaximize: function() {
      this.isExpanded = true;
      $('#side-panel-container').removeClass("minimized-legend")
    },
  },
  mounted: function() {
  }
}

</script>

<style lang="sass">
@import '../styles/variables.sass'

#legend
  margin-left: 10px
  margin-right: 10px
  margin-top: 5px
  margin-bottom: 5px

#legend-tooltip.tooltip
  font-size: 11px

#legend-placeholder.level-basic
  display: block !important

#legend.level-basic
  display: block !important
  margin-top: 40px
  margin-bottom: 40px


.legend-help-link
  font-size: 12px
  display: inline-block
  vertical-align: top

.legend-help
  font-size: 11px

.legend-symbol
  stroke: #000 !important
  stroke-width: 1.5px !important
  stroke-opacity: 0.3 !important

#close-legend
  float: right
  font-size: 15px
  color: $text-color !important

#show-legend
  color: $text-color !important
  font-size: 13px
  margin-left: 80px
  float: left


#close-legend
  float: right
  color: $text-color
  font-size: 18px

#legend
  .legend-element
    cursor: auto
    padding: 1px

    text
      cursor: auto
      fill:  $text-color
      font-size: 12px


  .legend-text
    color:  $text-color
    font-size: 12px
    cursor: auto
    vertical-align: top


  .legend-label
    font-size: 13px
    color: $text-color
    margin-bottom: 5px
    cursor: auto
    line-height: 15px


#legend

  .legend-symbol.exon
    cursor: pointer
    fill: rgba(93, 128, 157, 0.63)
    stroke: rgb(93, 128, 157)

  .exon-symbol
    text
      font-size: 12px
      fill: $text-color


.legend-wrap-text
  display: inline-block !important
  line-height: 12px !important

.clinvar-legend
  width: 150px
  margin-right:  10px
  margin-bottom:  15px

  &.narrow
    width: 115px
    margin-bottom: 0px

  .legend-text
    padding-top: 2px
    display: inline-block

.legend-title
  color:  $app-color
  display: flex
  font-size: 15px
  align-items: center

#legend-title-icon
  color: $app-color
  font-size: 18px
  padding-right: 5px

</style>

