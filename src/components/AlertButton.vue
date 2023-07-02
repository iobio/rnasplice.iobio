 <template>

    <div id="alert-button-container" style="display:flex">

      <v-btn  class="navbar-icon-button" v-if="alerts" id="alert-button"  @click="showAlertPanel" text 
        >
        <v-badge right  >
          <v-icon id="alert-button-icon">mdi-bell</v-icon>
        </v-badge>
      </v-btn>
      <v-icon class="navbar-icon-button" v-if="(alertCounts && alertCounts.error && alertCounts.error > 0)"  id="error-badge" >
       mdi-alert-octagon
      </v-icon>
      <v-icon class="navbar-icon-button" v-if="(alertCounts && alertCounts.warning && alertCounts.warning > 0)"  id="warning-badge" >
        mdi-alert
      </v-icon>
    </div>
</template>

<script>

  export default {
    name: 'AlertButton',
    components: {
      
    },
    props: {
      alerts: Array,
      alertCounts: Object
    },
    data: () => ({
      
    }),
    methods: {
      showAlertPanel: function() {
        this.$emit("show-alert-panel", true)
      }
    },
    watch: {
      alerts: function() {
      }
    }
  }
</script>


<style lang="sass">
@import '../styles/variables.sass'
#alert-button-container

  #alert-button-icon
    font-size: 26px

  #error-badge 
    color: $badge-error-color  !important

  #warning-badge
    color:  $badge-warning-color  !important

  #alert-button
    padding-right: 0px
    padding-left:  0px
    margin-right: -23px
    background-color: transparent
    .v-badge__badge
      background-color: transparent !important

  #error-badge, #warning-badge
    padding-left: 0px
    padding-right: 0px
    margin-left: -0px
    margin-top: -4px
    font-size: 20px
    min-width: 20px !important
</style>
