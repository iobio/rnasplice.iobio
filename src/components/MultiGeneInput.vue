<template>
  <div class="text-center">
    <v-menu
      v-model="showGenesMenu"
      :close-on-content-click="false"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn class="navbar-icon-button"
          v-bind="props"
        >
          <v-icon>mdi-text-box-search</v-icon>   
          
          <v-tooltip
            activator="parent"
            location="top"
          >Enter multiple genes</v-tooltip>
        </v-btn>
      </template>

      <v-card min-width="450">
       
        <v-card-text>

          
          <div id="enter-genes-input">
            <v-textarea
              id="copy-paste-genes"
              multi-line
              rows="12"
              variant="filled"
              :label="STARTING_INPUT"
              v-model="genesToApply"
              :rules="geneRules"
              :success="showWarning"
              :success-messages="warningMessage">
            </v-textarea>

            <div class="v-text-field__details" style="margin-top: -18px">
              <div class="v-messages theme--light">
                <div class="v-messages__wrapper" style="float: right">
                  {{ geneCount }}
                </div>
              </div>
            </div>
          </div>
          <div style="min-height:60px">
            <div  v-for="msg in validateMessages"  :key="msg.text"  :class="`d-flex gene-warning-` + msg.type">
              <v-icon>{{ msg.icon }}</v-icon>
              <div v-html="msg.text"></div>
            </div>
          </div>
          
        </v-card-text>


        <v-card-actions>
          <v-spacer></v-spacer>

          
          <v-btn
            color="primary"
            variant="flat" elevation="2" density="compact" size="large"
            @click="menu = false"
          >
            Apply
          </v-btn>
          <v-btn
            elevation="2" density="compact" size="large"
            @click="menu = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'MultiGeneInput',
  components: {
    
  },
  props: {
    geneModel: Object
  },
  data: () => (
  
  {
    self: this,  
    showGenesMenu: false,

    REC_GENE_NUMBER: 50,
    STARTING_INPUT: 'Enter gene names (<50 recommended)',
    
    genesToApply: null,
    showTooltipFlag: false,
    tooltipContent: null,
    validateInProgress: false,
    validateMessages: [],
    validGenesMap: {},
    showWarning: false,
    disableApplyBtn: false,
    geneCount: 0,
    geneRules: [
      v => {
        self.disableApplyBtn = false;
        let numGenes = v ? v.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i).length : 0;
        let isRec = numGenes <= self.REC_GENE_NUMBER;
        self.showWarning = !isRec;
        return isRec;
      },
      v => {
        let numGenes = v ? v.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i).length : 0;
        let isValid = numGenes <= 200;
        if (!isValid) {
          self.showWarning = false;
          self.disableApplyBtn = true;
        }
        return isValid || 'Error: maximum number of genes is 200';
      }
    ],
  }),
  methods: {
    handleNewHighlights () {
        // Ugly hack because chrome is stupid
        // https://stackoverflow.com/questions/26962323/what-is-this-insane-space-character-google-chrome
        var h = this.customHighlight.replace(new RegExp(String.fromCharCode(32),"g"),String.fromCharCode(160));
        if (h.length > 0)
          this.highlight.unshift(h)
        this.customHighlight = ""
    },

    promiseValidateGenes: function() {
      const self = this;
      if (self.validateInProgress) {
        Promise.resolve();
      } else {

        return new Promise(function(resolve, reject) {
          self.validateInProgress = true;
          self.validateMessages = [];
          let genes = self.genesToApply ? self.genesToApply.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i) : [];
          let invalids = [];
          let aliases = [];
          let promises = []
          genes.forEach((gene) => {
            if (gene && gene != "" && gene.length >= 3) {
              let p = self.promiseValidateGene(gene.toUpperCase())
              .then(function(lookupObject){
                if (!lookupObject) {
                  let item = {'geneName': gene.toUpperCase()}
                  invalids.push(item);
                } else if (lookupObject.hasOwnProperty('gene_alias')) {
                  aliases.push(lookupObject)
                }
              })
              promises.push(p)

            }
          });
          Promise.all(promises)
          .then(function() {
            let isValid = invalids.length === 0;
            let invalidMsg = ""
            if (!isValid) {
              self.showWarning = false;
              self.disableApplyBtn = true;
              invalids.forEach(function(item) {
                if (invalidMsg.length == 0) {
                  invalidMsg +=  'Correct or remove the following invalid gene names: ';
                } else {
                  invalidMsg += ", "
                }
                invalidMsg += '<pre>' + item.geneName + '</pre>';
              })
              self.validateMessages.push({'title': 'Invalid gene', 'type': 'error', 'icon': 'mdi-alert-circle', 'text': invalidMsg})
            }
            if (aliases.length > 0) {
              let aliasMsg = "";
              aliasMsg += 'The following gene symbols will be used:  ';
              let i = 0;
              aliases.forEach(function(alias) {
                if (i > 0) {
                  aliasMsg += ", "
                }
                aliasMsg +=  '<pre>' + alias.gene_name + '</pre>' +
                            " instead of " + '<pre>' + alias.gene_alias + '</pre>';
                i++;
              })
              aliasMsg += "."
              self.validateMessages.push({'title': 'Gene alias', 'type': 'info', 'icon': 'mdi-bell', 'text': aliasMsg})
            }
            self.validateInProgress = false;
            resolve(isValid)

          })
          .catch(function(error) {
            self.validateInProgress = false;
            console.log(error)
            reject(error)
          })

        })

      }
    },
    promiseValidateGene: function(geneName) {
      let self = this;
      return new Promise(function(resolve, reject) {
        let theGeneName = geneName;
        let theGeneNameUC = geneName.toUpperCase();
        let lookupObject = self.validGenesMap[theGeneNameUC]
        if (lookupObject) {
          resolve(lookupObject)
        } else {
          self.geneModel.promiseGetValidGeneName(theGeneName, false)
          .then(function(lookupObject) {
            let match = null;
            if (lookupObject && typeof(lookupObject) == 'string' && lookupObject.toUpperCase() == theGeneNameUC) {
              match = lookupObject;
              self.validGenesMap[theGeneNameUC] = lookupObject;
            } else if (lookupObject && lookupObject.hasOwnProperty('gene_alias') && lookupObject.gene_alias.toUpperCase() == theGeneNameUC) {
              match = lookupObject;
              self.validGenesMap[theGeneNameUC] = lookupObject;
            }
            if (match == null) {
              self.validGenesMap[theGeneNameUC] = false;
            }
            resolve(match)
          })
          .catch(function(error) {
            console.log("problem validating gene")
            console.log(error)
            reject(error)
          })

        }
      })
    },

    onApplyGenes: function(options) {
      let self = this;

      self.$emit("apply-genes", self.replaceGeneAliases(self.genesToApply));
      self.showGenesMenu = false;
    },
    replaceGeneAliases: function(genesString) {
      let self = this;
      let genes = genesString ? genesString.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i) : [];
      return genes.map(function(geneName) {
        let theGeneName = geneName;
        let lookupObject = self.validGenesMap[geneName.toUpperCase()];
        if (lookupObject && lookupObject.hasOwnProperty('gene_alias')) {
          theGeneName = lookupObject['gene_name']
        } else if (lookupObject && typeof(lookupObject) == "string") {
          theGeneName = lookupObject
        }
        return theGeneName;
      }).join(", ")
    },
    onCancel: function() {
      let self = this;
      self.showGenesMenu = false;
    },
    onClearAllGenes: function() {
      this.$emit("clear-all-genes");
    },
  },
  computed: {
    
    warningMessage: function() {
      if (this.showWarning) {
        return 'Warning: recommended gene count is <' + this.REC_GENE_NUMBER + ' for optimal performance';
      } else {
        return '';
      }
    }
  },
  watch: {
    showGenesMenu: function() {
      let self = this;
      if (self.showGenesMenu) {
        this.genesToApply = self.geneModel.geneNames.join(", ");
      }
    },
    genesToApply: function () {
      if (this.genesToApply === this.STARTING_INPUT || this.genesToApply === '') {
        this.geneCount = 0;
      } else {
        this.geneCount = this.genesToApply.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i).length;
        this.promiseValidateGenes();
      }
    }
  }
}
</script>

<style lang="sass">

@import '../styles/variables.sass'

.navbar-icon-button
  background-color: transparent !important

#enter-genes-input
  .v-label.v-field-label
    font-size: 13px
  .v-field--variant-filled.v-field--focused 
    .v-field__overlay
      opacity: 0.08
  #copy-paste-genes
    font-size: 13px
    font-weight: 500

.gene-warning-error, .gene-warning-info 
  font-size: 13px
  line-height: 14px
  width: 440px
  color: #595959
  align-items: flex-start
  
.gene-warning-error pre, .gene-warning-info pre
  display: inline-block
  vertical-align: middle
  padding-top: 0px
  padding-bottom: 0px
  font-size: 12px
  color: black
  margin-bottom: 0px
  padding-left: 2px
  padding-right: 2px
  white-space: normal

.gene-warning-error 
  .v-icon 
    color: #cd0c0c
    font-size: 19px
    margin-right: 10px
    max-width: 10px
.gene-warning-info
  margin-top: 10px
  margin-bottom: 5px
  .v-icon
    color: #0664b3
    font-size: 19px
    margin-right: 10px
    max-width: 10px

.v-app-bar
  .v-btn
    font-size: 16px !important
    font-weight: 500
</style>