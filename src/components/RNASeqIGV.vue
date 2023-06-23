<template>
  <v-container>
    <div class="d-flex flex-column">
      <div id="igv-heading" class="d-flex flex-row justify-space-between align-center mb-1" >
          <h2>
            {{heading}}
          </h2>
          <v-spacer/>
          <div>
            <v-btn id="igv-launch-button" @click='launchFullIGV'>
              <v-icon class="igv-zoom-icon  mr-1" size="16" icon="mdi-launch"></v-icon>
              Full screen
          </v-btn>
          </div>
      </div>
      <div>
        <div id='igv-content'></div>
      </div>
    </div>
  </v-container>
</template>

<script>

import igv from 'igv'

export default {
  name: 'RNASeqIGV',
  props: {
    heading: String,
    referenceURL: String,
    genomeBuild: String,
    locus: String,
    showLabels: {
      type: Boolean,
      default: false,
    },
    tracks: null
  },
  data () {
    return {
      browser: null,
    }
  },
  mounted: function () {
    this.init();
  },
  methods: {
    init: function() {
      let self = this;
      const igvDiv = this.$el.querySelector('#igv-content');

      var options = {
        locus: this.locus,
        genome: 'hg38',
        loadDefaultGenomes: true,
        tracks: self.tracks,
        queryParametersSupported: true
      };


      igv.createBrowser(igvDiv, options).then((browser) => {
        this.browser = browser;
      })
    },
    search: function() {
      if (this.browser && this.locus) {
        this.browser.search(this.locus)
      }
    },
    zoomOut: function() {
      this.browser.zoomOut();
    },
    zoomIn: function() {
      this.browser.zoomIn();
    },
    launchFullIGV: function() {
      launchIGV(this.referenceURL, this.locus, this.tracks);
    },
    reinit: function() {
      if (!this.browser) {
        this.init();
      }
      else {
        igv.removeBrowser(this.browser);
        this.browser = null;
        this.init();
      }
    }
  },
  watch: {
    locus: function() {
      this.search();
    },
    genome: function() {
      if (this.genome && this.tracks) {
        this.reinit();
      }
    },
    tracks: function() {
      if (this.genome && this.tracks) {
        this.reinit();
      }
    },
  }
}

function launchIGV(referenceURL, locus, tracks) {

  var options = {
    loadDefaultGenomes: true,
    locus: this.locus,
    genome: this.genomeBuild,
    tracks: tracks,
  };

  

  const url = 'https://s3.amazonaws.com/static.iobio.io/dev/igv.iobio.io/index.html?config=' + JSON.stringify(options)
  window.open(url, '_blank')
}

</script>

<style>

#igv-heading {
}
#igv-title {
  font-size: 18px;
  font-weight: 600;
  color: #494949
}
.igv-zoom-icon {
  color: #737373;
}
#igv-launch-button {
  font-weight: 600;
  color: #494949;
}

.igv-right-hand-gutter {
  right: initial;
  left: -10px;
}



</style>