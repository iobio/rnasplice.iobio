<template>
  <div class="text-center">
    <v-dialog 
      v-model="show"
      width="auto">
      <v-card style="width:700px">
        <v-card-title> 
          Load data files
        </v-card-title>
        <v-card-text id="load-data-dialog-content">

          <div class="d-flex flex-column">

            <div style="max-width:180px">
              <v-select
                label="Genome build"
                v-model="buildName"
                :items="['GRCh37', 'GRCh38']">
              </v-select>
            </div>

            <div class="pt-4">
              <v-text-field id="bed-url-text" 
                v-model="bedURL"
                hide-details 
                density="compact" 
                label="Splice Junction URL (.bed.gz)">
              </v-text-field>
              <v-btn class="mt-1" density="compact" size="medium" color="primary" variant="text" @click="onTryDemoBed">Load demo data</v-btn>
            </div>


            <div class="pt-4">
              <v-text-field id="bigwig-url-text" 
                v-model="bigwigURL"
                hide-details 
                density="compact" 
                label="Coverage URL (.bw or .bigWig)">
              </v-text-field>

            </div>

          </div>
          
        </v-card-text>
        <v-card-actions class="mt-4">
          <v-spacer/>
          <v-btn  elevation="2" size="large" density="comfortable" @click="onLoad">Load</v-btn>
          <v-btn  elevation="2" size="large" density="comfortable" @click="onCancel">Cancel</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
    name: 'LoadDataDialog',
    props: {
      showIt: Boolean
    },
    data () {
      return {
        show: false,
        buildName: 'GRCh38',
        bedURL: null,
        bigwigURL: null,

        demoInfo: {
          'demo1': {
            'bedURL': "https://s3.amazonaws.com/tony.splicejunction.bed/1099_SJ.out.bed.gz",
            'bedIndexURL': "https://s3.amazonaws.com/tony.splicejunction.bed/1099_SJ.out.bed.gz.tbi",
            'bigwigURL': "https://s3.amazonaws.com/tony.splicejunction.bed/1099_RNA.bigWig"
          },
          'demo2': {
            'bedURL': "splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.SJ.out.bed.gz?dl=0",
            'bedIndexURL': "https://www.dropbox.com/s/iv5tcg3t8v3xu23/splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.SJ.out.bed.gz.tbi?dl=0",
            'bigwigURL': "https://www.dropbox.com/s/8j2uf0hsqprusnc/splice_junction_track_test_cases_sampleA.chr15-92835700-93031800.bigWig?dl=0"
          }
        }
      }
    },
    methods: {
      onLoad: function() {
        let loadInfo = {'buildName': this.buildName, 
                        'bedURL': this.bedURL, 
                        'bedIndexURL': this.bedURL + '.tbi',
                        'bigwigURL': this.bigwigURL}
        this.$emit("load", loadInfo)
      },
      onCancel: function() {
        this.$emit("cancel" )
      },
      onTryDemoBed: function() {
        this.bedURL = this.demoInfo.demo1.bedURL;
        this.bigwigURL = this.demoInfo.demo1.bigwigURL;
      }
    },
    watch: {
      showIt: function() {
        this.show = this.showIt;
      },
      show: function() {
        if (!this.show) {
          this.$emit("cancel")
        }
      }
    }
}
</script>

<style>
#load-data-dialog-content #bed-url-text,
#load-data-dialog-content #bigwig-url-text {
  font-size: 13px;
}
</style>