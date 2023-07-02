<template>
  <v-navigation-drawer 
      id="alert-panel"
      v-model="showAlertPanel"
      permanent
      location="right"
      style="margin-left: 5px; margin-right: 5px; padding: 5px;height: calc(100% - 65px);">

    <div style="padding-top:0px;padding-left:5px" >


      <div class="d-flex flex-row align-center">
        <h2>
          Alerts
        </h2>
        <v-spacer/>
        <v-btn small id="close-button" variant="text" density="compact" @click.stop="onCloseAlertPanel">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="d-flex flex-row mb-4">
        <v-spacer/>
        <v-btn v-if="alerts && alerts.length > 0" id="clear-all-button" variant="tonal" @click="clearAllAlerts">
          Clear all
        </v-btn>
      </div>

      <v-alert v-for="alert in alerts"
        class="alert-item"
        :key="alert.key"
        :type="getType(alert)"
        :icon="getIcon(alert)"
        variant="outlined"
        density="compact"
      >
        <v-btn  id="clear-alert-button" variant="text" @click="clearAlert(alert)">
          <v-icon icon="mdi-close"></v-icon>
        </v-btn>

        <div v-html="alert.message"></div>

        <div v-if="alert.details" style="padding-right:0px ;margin-top:-2px;display:flex;justify-content:flex-end" >
          <v-btn v-if="!alert.showDetails" class="show-details-button" text @click="alert.showDetails = true">
            Show details
          </v-btn>
          <v-btn v-if="alert.showDetails" class="hide-details-button" text @click="alert.showDetails = false">
            Hide details
          </v-btn>
        </div>
        <div v-if="alert.showDetails" >
          <div v-for="detail, detailIndex in alert.details" :key="detailIndex" v-html="detail">
          </div>
        </div>
      </v-alert>
      

    </div>

    <ConfirmDialog
      :showIt="showConfirmDialog"
      :message="confirmMessage"
      :title="confirmTitle"
      @confirmed="onConfirmed"/>

  </v-navigation-drawer>
</template>

<script>

import ConfirmDialog from './ConfirmDialog.vue'

export default {
  name: 'AlertPanel',
  components: {
    ConfirmDialog
    
  },
  props: {
    alerts: Array,
    show: Boolean
  },
  data: () => ({
    showAlertPanel: true,

    showConfirmDialog: false,
    confirmMessage: "",
    confirmTitle: ""
    
  }),
  methods: {

    getIcon: function(alert) {
      if (alert.type == 'success') {
        return 'mdi-check-circle-outline'
      } else if (alert.type == 'info') {
        return 'mdi-information-outline'
      } else if (alert.type == 'warning') {
        return 'mdi-alert'
      } else if (alert.type == 'error') {
        return 'mdi-alert-octagon'
      } 
    },
    getType: function(alert) {
      if (alert.type == 'success') {
        return 'success'
      } else if (alert.type == 'info') {
        return 'info'
      } else if (alert.type == 'warning') {
        return 'warning'
      } else if (alert.type == 'coverage') {
        return 'info-coverage'
      } else if (alert.type == 'error') {
        return 'error'
      } 
    },
    clearAlert: function(alert) {
      this.$emit("clear-alert", alert.key)
    },
    clearAllAlerts: function(alert) {
      let self = this;
      let msg = "Are you sure you want to clear all notifications?"
      self.confirmMessage = msg;
      self.confirmTitle = "Confirm"
      self.showConfirmDialog = true;

    },
    onCloseAlertPanel: function() {
      this.$emit('close-alert-panel')
    },
    onConfirmed: function(answer) {
      this.showConfirmDialog = false;
      this.$emit('clear-all-alerts');
    }
  },
  watch: {
    alerts: function() {
    },
    show: function() {
      this.showAlertPanel = this.show;
    }
  },
  created: function() {
    this.showAlertPanel = false;
  }
}
</script>


<style lang="sass">
@import '../styles/variables.sass'
#alert-panel
  #close-button
    margin-right: -15px
    margin-top: 0px
    min-width: 20px
    margin-bottom: 5px

  margin-left: 10px
  margin-right: 10px
  margin-top: 5px
  margin-bottom: 0px

  .alert-item
    clear: both

  #clear-all-button
    margin: 0px
    height: 20px
    padding-left: 3px 
    padding-right: 3px
    margin-right: 0px

    .v-btn__content
      color: $link-color
      font-size: 13px

  #clear-alert-button
    max-width: 20px
    min-width: 20px
    max-height: 20px
    margin: 0
    float: right
    padding-left: 3px 
    padding-right: 3px
    color: $text-color !important

    .v-btn__content
      padding-right: 0px !important

      i.material-icons
        color: $text-color !important
        font-size: 13px

  pre 
    display: inline-block
    vertical-align: top
    padding-top: 0px
    padding-bottom: 0px
    font-size: 11px
    color: black
    margin-bottom: 0px
    padding-left: 2px 
    padding-right: 2px
    white-space: normal

  .alert-title
    color:  $app-color
    font-size: 15px
    margin-bottom: 10px

  .v-alert 
    font-size: 12px 
    padding: 0px 0px 10px 0px
    border: none !important

    .v-alert__prepend
      margin-right: 4px !important
      .v-icon
        font-size: 18px !important
        width:     18px !important
        height:    18px !important
    div 
      padding-right: 0px
      max-width: 280px
      overflow-wrap: break-word

    &.text-success
      .v-alert__content
        div
          color: $text-color !important
    &.text-info
      .v-alert__content
        div
          color: $text-color !important
      i.v-icon
        color: #6c6c6c !important    

    &.text-warning
      .v-alert__content
        div
          color: $text-color !important
    &.error--text
      border-color: #b32f2f !important
      border-style: solid !important
      border-width: 0.5px !important
      color: $danger-color !important
      div
        color: $text-color !important
        font-weight: 500 !important

    .show-details-button, .hide-details-button
      margin: 0px
      margin-top: 0px
      height: 20px
      font-size: 11px
      max-width: 56px
      .v-btn__content
        padding-right: 0px
        color: $link-color !important      
</style>