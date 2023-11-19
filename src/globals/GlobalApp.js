/*  These app.global variables.  This entire .js can be replaced or modified to suit the
    specific iobio deployment environment.
*/
class GlobalApp {
  constructor() {

    this.cacheHelper           = null;
    this.launchedFromUtahMosaic = false;
    this.version               = "1.0.0";
    this.DEFAULT_IOBIO_BACKEND  = "backend.iobio.io"
    this.IOBIO_SERVICES         = null;
    this.HTTP_SERVICES          = null;
    this.useSSL                = true;
    this.geneInfoServer        = null;
    this.genomeBuildServer     = null;

    this.isDirty               = false;

    this.JUNCTION_SITE_SEQ_RANGE      = 15;

  }

  initBackendSource(iobioSource) {
      this.IOBIO_SERVICES = (this.useSSL ? "https://" : "http://") + iobioSource;
      this.HTTP_SERVICES  = (this.useSSL ? "https://" : "http://") + iobioSource;
      if (this.IOBIO_SERVICES.indexOf('mosaic.chpc.utah.edu') >= 0 && this.IOBIO_SERVICES.indexOf("gru-dev") < 0) {
        this.launchedFromUtahMosaic = true;
      }

      this.geneInfoServer            = this.HTTP_SERVICES + "/geneinfo/";
      this.genomeBuildServer         = this.HTTP_SERVICES + "/genomebuild/"
  }

  initServices(useMosaicBackend) {
    if (import.meta.env.ENV_USE_SSL) {
      this.useSSL = import.meta.env.ENV_USE_SSL === 'true' ? true : false;
    }

    // These are the public services.
    if (useMosaicBackend && import.meta.env.ENV_IOBIO_BACKEND_MOSAIC ) {
      this.initBackendSource(import.meta.env.ENV_IOBIO_BACKEND_MOSAIC)
    } else if (import.meta.env.ENV_IOBIO_BACKEND) {
      this.initBackendSource(import.meta.env.ENV_IOBIO_BACKEND)
    } else {
      console.log("No backend specified")
    }

  }

  getCloseMessage() {
    if (this.isDirty) {
      return "Unsaved work. Do you really want to close?";
    } else {
      return null;
    }
  }





}

export default GlobalApp

