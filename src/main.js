/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */
import './main.scss'

import 'bootstrap/dist/css/bootstrap.min.css'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'


const app = createApp(App)

registerPlugins(app)

import * as uiv from 'uiv'

app.use(uiv)



import jQuery               from 'jquery'
const $ = jQuery;
window.$ = $;

import GlobalApp     from '@/globals/GlobalApp.js'
import Util          from '@/globals/Util.js'


// define a globals mixin object
app.mixin({
  data: function() {
    return {
      utility: new Util(),
      globalApp: new GlobalApp()
    };
  },
  created: function(){
    this.utility.globalApp = this.globalApp;
    this.globalApp.utility = this.utility;

  }
})





app.mount('#app')
