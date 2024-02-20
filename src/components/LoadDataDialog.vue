<template>
  <div class="text-center">
    <v-dialog 
      v-model="show"
      width="auto">

      <v-form ref="ref_Form" v-model="isFormValid" @submit.prevent fast-fail>

        <v-card style="width:900px">
          <v-card-title> 
              <div class="d-flex" style="align-items:center">
                Load data files
                <v-btn style="margin-left:40px" variant="text" density="compact" @click="demoNumber='demo1';onTryDemoBed()">Load 1099</v-btn>
                <v-btn variant="text" density="compact" @click="demoNumber='demo3';onTryDemoBed()">Load R2003</v-btn>
              </div>
          </v-card-title>
          <v-card-text id="load-data-dialog-content">

            <div class="d-flex flex-column">

              <div class="d-flex">
                <div style="max-width:180px">
                  <v-select
                    label="Genome build"
                    v-model="buildName"
                    :items="['GRCh37', 'GRCh38']">
                  </v-select>
                </div>

                <div class="ml-9" style="flex-grow: 2;">
                  <v-textarea id="copy-paste-urls"
                   rows="5"
                   density="compact"
                   label="Copy/paste URLs"
                   v-model="copyPasteURLs">
                  </v-textarea>
                </div>
              </div>


              <div class="pt-4">
                <v-text-field id="bed-url-text" 
                  v-model="bedURL"
                  :rules="bedRules"
                  density="compact" 
                  label="Splice Junction BED URL (.bed.gz)">
                </v-text-field>
              </div>
              <div class="pt-4">
                <v-text-field id="bed-index-url-text"
                  v-model="bedIndexURL"
                  :rules="bedIndexRules"
                  density="compact"
                  label="Splice Junction BED Index URL (.bed.gz.tbi)">
                </v-text-field>
              </div>

              <v-divider/>

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
      sampleNames: Array,
      preLoadInfo: Object
    },
    data () {
      let self = this;
      return {
        show: false,
        isFormValid: null,
        buildName: 'GRCh38',
        bedURL: null,
        bedIndexURL: null,
        bigwigURL: null,
        vcfURL: null,
        tbiURL: null,
        selectedSampleName: null,
        copyPasteURLs: null,
        demoNumber: 'demo1',

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
          },
          'demo3': {
            'bedURL': "https://s3.amazonaws.com/tony.splicejunction.bed/R2003-01.SJ.out.bed.gz",
            "bedIndexURL": "https://s3.amazonaws.com/tony.splicejunction.bed/R2003-01.SJ.out.bed.gz.tbi",
            'bigwigURL': "https://s3.amazonaws.com/tony.splicejunction.bed/R2003-01.Aligned.out.bw"
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
        bedIndexRules: [
          v => {
            if (v && v.toLowerCase().indexOf('.bed.gz.tbi') > 0) {
              return true;
            } else if (v) {
              return 'The index file file must have extension .bed.gz.tbi'
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
        bigwigRules: [
          v => {
            if (v && (v.toLowerCase().indexOf('.bigwig') > 0 || v.toLowerCase().indexOf('.bw') > 0) ) {
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
      if (this.preLoadInfo && Object.keys(this.preLoadInfo).length > 0) {
        this.init();
      } else {
        //this.onTryDemoBed();
      }
      
    },
    methods: {
      init: function() {
        if (this.preLoadInfo) {
          if (this.bedURL == null && this.preLoadInfo.bedURL) {
            this.bedURL = this.preLoadInfo.bedURL;
          }
          if (this.bedIndexURL == null && this.preLoadInfo.bedIndexURL) {
            this.bedIndexURL = this.preLoadInfo.bedIndexURL;
          }
          if (this.bigwigURL == null && this.preLoadInfo.bigwigURL) {
            this.bigwigURL = this.preLoadInfo.bigwigURL;
          }
          if (this.vcfURL == null && this.preLoadInfo.vcfURL) {
            this.vcfURL = this.preLoadInfo.vcfURL;
          }
          if (this.tbiURL == null && this.preLoadInfo.tbiURL) {
            this.tbiURL = this.preLoadInfo.tbiURL;
          }
          if (this.selectedSampleName == null && this.preLoadInfo.sampleName) {
            this.selectedSampleName = this.preLoadInfo.sampleName;
          }
        }
      },
      onLoad: function() {
        if (this.vcfURL != null  && this.vcfURL.trim() != "" && this.selectedSampleName == null || this.selectedSampleName == "") {
          alert("Select a sample name from the dropdown")
          return;
        }
        let loadInfo = {'buildName': this.buildName, 
                        'bedURL': this.bedURL.trim(), 
                        'bedIndexURL': this.bedIndexURL ? this.bedIndexURL.trim() : this.bedURL.trim() + '.tbi',
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
        let self = this;
        this.bedURL = this.demoInfo[self.demoNumber].bedURL;
        this.bigwigURL = this.demoInfo[self.demoNumber].bigwigURL;
      },
      parseCopyPasteURLs: function() {
        let self = this;
        let urls = this.copyPasteURLs.split("\n");
        urls.forEach(function(url) {
          if (url.endsWith('.bed.gz')) {
            self.bedURL = url;
          } else if (url.endsWith('bed.gz.tbi')) {
            self.bedIndexURL = url;
          } else if (url.endsWith('.bw') || url.toLowerCase().endsWith('.bigwig')) {
            self.bigwigURL = url;
          } else if (url.endsWith('vcf.gz')) {
            self.vcfURL = url;
          } else if (url.endsWith('vcf.gz.tbi')) {
            self.tbiURL = url;
          }
        })
        this.$refs.ref_Form.validate();
      }
    },
    watch: {
      showIt: function() {
        this.show = this.showIt;
        if (this.show) {
          this.init();
        }

      },
      show: function() {
        if (!this.show) {
          this.$emit("cancel")
        }
      },
      vcfURL: function() {
        if (this.vcfURL) {
          this.vcfURL = this.vcfURL.trim();
          if (this.tbiURL) {
            this.tbiURL = this.tbiURL.trim();
          }
          if (this.vcfURL && this.tbiURL) {
            this.$emit("vcf-url-entered", this.vcfURL, this.tbiURL)
          }
        }
      },
      tbiURL: function(){
        if (this.vcfURL) {
          this.vcfURL = this.vcfURL.trim();
          if (this.tbiURL) {
            this.tbiURL = this.tbiURL.trim();
          }
          if (this.vcfURL && this.tbiURL) {
            this.$emit("vcf-url-entered", this.vcfURL, this.tbiURL)
          }
        }
      },
      copyPasteURLs: function() {
        if (this.copyPasteURLs && this.copyPasteURLs.length > 0) {
          this.parseCopyPasteURLs()
        }
      }

    }
}
</script>

<style>
#load-data-dialog-content #bed-url-text,
#load-data-dialog-content #bed-index-url-text,
#load-data-dialog-content #bigwig-url-text,
#load-data-dialog-content #vcf-url-text,
#load-data-dialog-content #tbi-url-text
 {
  font-size: 13px;
}

#copy-paste-urls {
  font-size: 12px !important;
}
</style>