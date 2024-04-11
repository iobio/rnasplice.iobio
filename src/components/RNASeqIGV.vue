<template>
  <div>
    <div id='igv-content'></div>
  </div>
</template>

<script>

import igv from 'igv'

export default {
  name: 'RNASeqIGV',
  props: {
    visible: Boolean,
    heading: String,
    reference: Object,
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
    let self = this;

  },
  created: function() {

  },
  methods: {
    init: function() {
      let self = this;
      const igvDiv = this.$el.querySelector('#igv-content');

      var options = {
        locus: this.locus,
        reference: this.reference,
        loadDefaultGenomes: false,
        tracks: self.tracks,
        queryParametersSupported: true
      };


      igv.createBrowser(igvDiv, options).then((browser) => {
        self.browser = browser;
        self.removeTrackByName("Refseq Genes")
      })
    },
    search: function() {
      let self = this;
      if (this.browser && this.locus) {
        self.browser.search(self.locus);
      }
    },
    closeBrowser: function() {
      if (igv && this.browser) {
        //igv.removeBrowser(this.browser);
        igv.removeAllBrowsers();
        this.browser = null;
      }
    },
    onRefreshTracks: function() {
      let self = this;
      if (this.browser) {
        let locus = this.browser.currentLoci()
        this.browser.doSearch(locus)
      }
    },
    zoomOut: function() {
      this.browser.zoomOut();
    },
    zoomIn: function() {
      this.browser.zoomIn();
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
    },
    removeTrackByName: function(trackName) {
      let self = this;
      for (var i = 0, l = self.browser.trackViews.length; i < l; i++) {
        var trackView = self.browser.trackViews[i];
        if (trackView.track.name === trackName) {
          self.browser.removeTrack(trackView.track);
          return;
        }
      }
    }
  },
  watch: {
    visible: function() {
      if (!this.visible && this.browser)  {
        igv.removeBrowser(this.browser);
        this.browser = null;
      } else if (this.visible && !this.browser) {
        this.init();
      }
    },
    locus: function() {
      if (this.locus) {
        this.search();
      }
    },
    tracks: function() {
      if (this.tracks) {
        this.reinit();
      }
    },
  }
}

</script>

<style>


.igv-right-hand-gutter {
  right: initial;
  left: -10px;
}



</style>