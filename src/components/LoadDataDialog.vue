<template>
  <div class="text-center">
    <v-dialog 
      v-model="show"
      width="auto">

      <v-form v-model="isFormValid" @submit.prevent fast-fail>

        <v-card style="width:900px">
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
                  :rules="bedRules"
                  density="compact" 
                  label="Splice Junction URL (.bed.gz)">
                </v-text-field>
              </div>


              <div class="pt-4">
                <v-text-field id="bigwig-url-text" 
                  v-model="bigwigURL"
                  density="compact" 
                  :rules="bigwigRules"
                  label="Coverage URL (.bw or .bigWig)">
                </v-text-field>
              </div>

              <v-divider/>

              <div class="pt-4">
                <v-text-field id="vcf-url-text" 
                  v-model="vcfURL"
                  :rules="vcfRules"
                  density="compact" 
                  label="VCF URL (.vcf.gz)">
                </v-text-field>
              </div>

              <div class="pt-4">
                <v-text-field id="tbi-url-text" 
                  v-model="tbiURL"
                  :rules="tbiRules"
                  density="compact" 
                  label="tbi URL (.vcf.gz.tbi)">
                </v-text-field>
              </div>

              <div style="width:255px" class="pt-4">
                <v-select 
                  v-model="selectedSampleName"
                  :rules="sampleNameRules"
                  hide-details="auto"
                  label="Sample name"
                  density="compact"
                  :items="sampleNames"
                ></v-select>
              </div>

            </div>
            
          </v-card-text>
          <v-card-actions  class="mt-4">
            <v-btn type="submit" class="mt-1" v-if="false" density="compact" size="medium" color="primary" variant="tonal" @click="onTryDemoBed">Load demo data</v-btn>

            <v-spacer/>
            <v-btn elevation="2" variant="flat" :disabled="!isFormValid" density="compact" color="blue-darken-4" size="large"  @click="onLoad">Load</v-btn>
            <v-btn  elevation="2" density="compact" size="large" @click="onCancel">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </div>
</template>

<script>
export default {
    name: 'LoadDataDialog',
    props: {
      showIt: Boolean,
      sampleNames: Array
    },
    data () {
      let self = this;
      return {
        show: false,
        isFormValid: null,
        buildName: 'GRCh38',
        bedURL: null,
        bigwigURL: null,
        vcfURL: null,
        tbiURL: null,
        selectedSampleName: null,

        urlRegExp: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi,
            

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
        },

        bedRules: [
          v => { if (v) {
              return true;
            } else {
              return 'bed URL is required'
            }
          },
          v => {
            if (v && v.indexOf('bed.gz') > 0) {
              return true;
            } else {
              return 'The bed file must be bgzipped (.bed.gz)'
            } 
          },
          v => {
            if (v && v.match(new RegExp(self.urlRegExp))) {
              return true;
            } else {
              return 'Invalid URL';
            } 
          }
        ],
        bigwigRules: [
          v => {
            if (v && v.toLowerCase().indexOf('.bigwig') > 0 || v.toLowerCase().indexOf('.bw') > 0 ) {
              return true;
            } else if (v) {
              return 'The bigwig file must have the extension .bw or .bigwig'
            } else {
              return true;
            }
          },
          v => {
            if (v && v.match(new RegExp(self.urlRegExp))) {
              return true;
            } else if (v) {
              return 'Invalid URL';
            } else {
              return true;
            }
          }
        ],
        vcfRules: [
          v => {
            if (v && v.toLowerCase().indexOf('.vcf.gz') > 0) {
              return true;
            } else if (v) {
              return 'The vcf file must be bgzipped (.vcf.gz)'
            } else {
              return true;
            }
          },
          v => {
            if (v && v.match(new RegExp(self.urlRegExp))) {
              return true;
            } else if (v) {
              return 'Invalid URL';
            } else {
              return true;
            }
          }
        ],
        tbiRules: [
          v => {
            if (v && v.toLowerCase().indexOf('.vcf.gz.tbi') > 0) {
              return true;
            } else if (v) {
              return 'The index file file must have extension .vcf.gz.tbi'
            } else {
              return true;
            }
          },
          v => {
            if (v && v.match(new RegExp(self.urlRegExp))) {
              return true;
            } else if (v) {
              return 'Invalid URL';
            } else {
              return true;
            }
          }
        ],
        sampleNameRules: [
          v => {
            if (self.vcf == null) {
              return true;
            } 
            if (self.sampleNames && self.samples.length > 0) {
              if (v) {
                return true;
              } else {
                return 'Sample name must be selected'
              }
            } else if (self.vcfURL == null) {
              return true;
            } else {
              return 'Unable to get sample names from VCF'
            }
          }
        ]
      }
    },
    mounted: function() {
      let self = this;
      // TODO - Remove. Temporary code to default to demo data on load.
      this.onTryDemoBed();
      
    },
    methods: {
      onLoad: function() {
        let loadInfo = {'buildName': this.buildName, 
                        'bedURL': this.bedURL.trim(), 
                        'bedIndexURL': this.bedURL.trim() + '.tbi',
                        'bigwigURL': this.bigwigURL ? this.bigwigURL.trim() : null,
                        'vcfURL': this.vcfURL ? this.vcfURL.trim() : null,
                        'tbiURL': this.tbiURL ? this.tbiURL.trim() : null,
                        'sampleName': this.selectedSampleName}
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
      },
      vcfURL: function() {
        if (this.vcfURL) {
          this.$emit("vcf-url-entered", this.vcfURL, this.tbiURL)
        }
      },
      tbiURL: function(){
        if (this.vcfURL) {
          this.$emit("vcf-url-entered", this.vcfURL, this.tbiURL)
        }
      }

    }
}
</script>

<style>
#load-data-dialog-content #bed-url-text,
#load-data-dialog-content #bigwig-url-text,
#load-data-dialog-content #vcf-url-text,
#load-data-dialog-content #tbi-url-text
 {
  font-size: 13px;
}
</style>