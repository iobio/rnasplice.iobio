<template>
  <v-app-bar 
       color="#0D47A1" dark 
      style="padding-top:2px"
    >

      <template v-slot:prepend>
        <v-app-bar-nav-icon></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>splicejunction.iobio</v-app-bar-title>

      <v-spacer></v-spacer>


      <div id="search-gene-box" style="min-width:200px">
        <v-text-field id="input" class="pl-2"
        hide-details 
        density="compact" 
        label="Gene" 
        prepend-icon="mdi-magnify" 
        />
        <Typeahead  v-model="searchedGene" 
        target="#input" 
        :data="genes" 
        item-key="gene_name" /> 
      </div>


      <v-spacer></v-spacer>

      <v-btn id="load-data-button" class="navbar-icon-button mr-9" text>
        <v-icon  class="mr-1">mdi-open-in-new</v-icon>
        Load data
      </v-btn>

      <AlertButton 
      class="mr-9"
      :alerts="alerts" 
      :alertCounts="alertCounts"
      @show-alert-panel="onShowAlertPanel"/>

      <template v-slot:append >
        <v-btn icon>
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

    </v-app-bar>
</template>

<script>


import AlertButton   from '../components/AlertButton.vue'
import { Typeahead } from 'uiv'

  export default {
    name: 'Navigation',
    components: {
      AlertButton,
      Typeahead
    },
    props: {
      genes: Array,
      genomeBuild: Array,
      alerts: Array,
      alertCounts: Object
    },
    data: () => ({
      searchedGene: null
    }),
    watch: {
      searchedGene: function() {
        if (this.searchedGene && this.searchedGene.gene_name) {
          this.$emit("gene-searched", this.searchedGene)
        }
      }
    },
    methods: {
      onShowAlertPanel: function() {
        this.$emit('show-alert-panel', true);
      }
    }
  }
</script>

<style>

#search-gene-box .dropdown {
  margin-left: 32px;
}

</style>

<style lang="sass">
.navbar-icon-button
  background-color: transparent !important
</style>
