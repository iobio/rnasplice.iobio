<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
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

      <v-card id="multi-gene-input-content" >
       
        <v-card-text style="width: 420px">

          
          <div id="enter-genes-input">
            <v-textarea
              id="copy-paste-genes"
              multi-line
              rows="12"
              variant="filled"
              :label="STARTING_INPUT"
              v-model="genesToApply"
              :rules="geneRules"
              :success="isValidForm"
              :success-messages="successMessage">
            </v-textarea>

            <div class="v-text-field__details" style="margin-top:-30px">
              <div class="v-messages theme--light">
                <div id="gene-count" class="v-messages__wrapper" style="float: right">
                  {{ geneCount }}
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4" style="min-height:60px">
            <div  v-for="msg in validateMessages"  :key="msg.text"  :class="`d-flex gene-warning-` + msg.type">
              <v-icon>{{ msg.icon }}</v-icon>
              <div v-html="msg.text" ></div>
            </div>
          </div>
          
        </v-card-text>


        <v-card-actions>
          <v-spacer></v-spacer>

          
          <v-btn
            color="primary" :dark="!disableApplyBtn" id="apply-button" :disabled="disableApplyBtn"
            variant="flat" elevation="2" density="compact" size="large"
            @click="onApplyGenes"
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
  data: (vm) => (
  
  {
    //self: this,  
    menu: null,

    HARD_MAX_GENE_COUNT: 5,
    SOFT_MAX_GENE_COUNT: 3,
    STARTING_INPUT: 'Enter gene names (<50 recommended)',
    
    genesToApply: null,
    showTooltipFlag: false,
    tooltipContent: null,
    validateInProgress: false,
    validateMessages: [],
    validGenesMap: {},
    isValidForm: false,
    successMessage: '',
    disableApplyBtn: false,
    geneCount: 0,
    geneRules: [
    v => {
        let numGenes = v ? v.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i && v && v != '').length : 0;
        let isValid = numGenes <= vm.HARD_MAX_GENE_COUNT;
        if (!isValid) {
          vm.disableApplyBtn = true;
          vm.isValidForm = false;
          vm.successMessage = '';
          return isValid || 'The maximum number of genes (' +  vm.HARD_MAX_GENE_COUNT + ') of genes has been exceeded.'
        } else {
          vm.disableApplyBtn = false;
          let withinRecommendedLimit = numGenes <= vm.SOFT_MAX_GENE_COUNT;
          vm.isValidForm = true;
          return withinRecommendedLimit || 'For optimal performance, the number of genes should not exceed ' + vm.SOFT_MAX_GENE_COUNT;
        }
        
      },
      v => {
        if (vm.showWarning) {
          let numGenes = v ? v.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i && v && v != '').length : 0;
          let withinRecommendedLimit = numGenes <= vm.SOFT_MAX_GENE_COUNT;
          vm.showWarning = !withinRecommendedLimit;
          return withinRecommendedLimit || vm.warningMessage;
        } else {
          return true || '';
        }
      },
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
            if (isValid) {
              self.disableApplyBtn = false;
            }
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

    onApplyGenes: function() {
      let self = this;
      let options = {}
      options.replace = true;
      options.warnOnDup = false;
      self.$emit("apply-genes", self.replaceGeneAliases(self.genesToApply), options);
      self.menu = false;
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
      self.menu = false;
    },
    onClearAllGenes: function() {
      this.$emit("clear-all-genes");
    },
  },
  computed: {
    
  },
  watch: {
    menu: function() {
      let self = this;
      if (self.menu) {
        this.genesToApply = self.geneModel.geneNames.join(", ");
      }
    },
    genesToApply: function () {
      if (this.genesToApply === this.STARTING_INPUT || this.genesToApply === '') {
        this.geneCount = 0;
      } else {
        this.geneCount = this.genesToApply.toUpperCase().split(/[\s,\n]+/).filter((v, i, a) => a.indexOf(v) === i && v && v != '').length;
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

.v-app-bar
  .v-btn
    font-size: 16px !important
    font-weight: 500
    
#multi-gene-input-content
  #gene-count 
    font-weight: 500
    font-size: 13px
    
  #enter-genes-input
    .v-label.v-field-label
      font-size: 13px
    .v-field--variant-filled.v-field--focused 
      .v-field__overlay
        opacity: 0.08
    #copy-paste-genes
      max-width: 400px
      min-width: 400px
      font-size: 13px
      font-weight: 500
      
    #copy-paste-genes-messages
      min-height: 30px

  .gene-warning-error, .gene-warning-info 
    font-size: 13px
    line-height: 14px
    max-width: 400px
    min-width: 350px
    white-space: break-spaces
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


</style>