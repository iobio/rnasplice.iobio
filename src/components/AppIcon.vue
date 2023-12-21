<template>
  <div :style="containerStyle">

      <svg
       v-if="icon == 'impact' && (type == 'snp' || type == 'mnp')"
       :icon="icon"
       :type="type"
       :style="iconStyle"
       :class="getClassObject(['impact-badge'])">
        <g transform="translate(1,2)">
          <rect width="8" height="8"
          v-bind:class="clazz"
          style="pointer-events: none;"></rect>
        </g>
      </svg>

      <svg
       v-if="icon == 'impact' && type == 'del' "
       :icon="icon"
       :type="type"
       :style="iconStyle"
       :class="getClassObject(['impact-badge'])">
        <g transform="translate(5,6)">
          <path d="M0,-4.161791450287817L4.805622828269509,4.161791450287817 -4.805622828269509,4.161791450287817Z"
          v-bind:class="clazz">
          </path>
        </g>
      </svg>

      <svg
       v-if="icon == 'impact' && type == 'ins' "
       :style="iconStyle"
       :icon="icon"
       :type="type"
       :class="getClassObject(['impact-badge'])">
        <g transform="translate(5,6)">
          <path d="M0,3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,-3.5682482323055424A3.5682482323055424,3.5682482323055424 0 1,1 0,3.5682482323055424Z"
          v-bind:class="clazz">
          </path>
        </g>
      </svg>

      <svg
       v-if="icon == 'impact' && type == 'complex' "
       :style="iconStyle"
       :icon="icon"
       :type="type"
       :clazz="clazz"
       :class="getClassObject(['impact-badge'])">
        <g transform="translate(5,6)">
          <path d="M0,-5.885661912765424L3.398088489694245,0 0,5.885661912765424 -3.398088489694245,0Z"
          v-bind:class="clazz">
          </path>
        </g>
      </svg>


      <svg v-if="icon == 'question-mark'"  id="question-mark-symbol" :style="iconStyle" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
      </svg>


    

  </div>

</template>

<script>
export default {
  name: 'app-icon',
  components: {
  },
  props: {
    icon: null,
    iconClass: null,
    type: null,
    clazz: null,
    width: null,
    height: null,
    fill: null,
    level: null,
    significance: null,
    isSimpleMode: null
  },
  data () {
    return {
      clinvarLevels: {
        clinvar_path: 'high',
        clinvar_lpath: 'likely-high',
        clinvar_uc: "unknown",
        clinvar_benign: "low",
        clinvar_lbenign: "likely-low",
        clinvar_other: "other",
        clinvar_cd: "conflicting"
      }
    }
  },
  methods: {
    getClassObject: function(clazzes) {
      let theLevel = this.level
      if (this.icon == 'clinvar' && this.significance) {
        theLevel = this.clinvarLevels[this.significance];
      }
      var levelClass = theLevel ? 'level-' + theLevel : null;

      if (levelClass) {
        if (clazzes == null) {
          clazzes = [];
        }
        clazzes.push(levelClass);
      }

      return clazzes;

    },
    getContainerStyle: function() {
      let self = this;
      return {
        'display': 'inline-block',
        'min-width': self.width,
        'min-height': self.height
      }

    },
  },
  computed: {


    iconStyle: function() {
      return 'width:' + this.width + 'px;height:' + this.height + 'px';
    },
    containerStyle: function() {
      return 'display: inline-block;vertical-align: top; '
      + 'width:'  + this.width + 'px;'
      + 'height:' + this.height + 'px;';
      + 'min-width:'  + this.width + 'px;'
      + 'max-height:' + this.height + 'px;';
    }

  }
}
</script>

<style lang="sass" >
@import '../styles/variables.sass'



.impact-badge
  stroke: #a5a5a5
  stroke-width: 1px
  margin-top: 2px

.level-high
  fill: $high-impact-color

.level-likely-high
  fill:  $high-impact-color

.level-medium, .level-unknown-significance, .level-unknown
  fill: $moderate-impact-color

.level-insignificant, .level-unremarkable
  fill: #cfcdcd 

.level-blank
  fill: white

.level-low
  fill: $low-impact-color


#not-significant-symbol
  circle
    fill: $unremarkable-color
  path
    fill: white




</style>


