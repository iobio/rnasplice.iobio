<template>
  <div class="text-center">
    
      <v-dialog
        v-model="show"
        width="auto"
      >
        <v-card>
          <v-card-title> 
            {{ title }}
          </v-card-title>
          <v-card-text>
            {{ message }}
          </v-card-text>
          <v-card-actions>
            <v-btn  @click="onOkay">OK</v-btn>
            <v-btn  @click="onCancel">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
  </div>
</template>

<script>
export default {
    name: 'confirm-dialog',
    props: {
      title:   String,
      message: String,
      showIt: Boolean
    },
    data () {
      return {
        show: false
      }
    },
    methods: {
      onOkay: function() {
        this.$emit("confirmed")
      },
      onCancel: function() {
        this.show = false;
      },
    },
    watch: {
      showIt: function() {
        this.show = this.showIt;
      }
    }
}
</script>