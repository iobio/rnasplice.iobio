/*  These app.global variables.  This entire .js can be replaced or modified to suit the
    specific iobio deployment environment.
*/
class GlobalApp {
  constructor() {

    this.cacheHelper           = null;
    this.launchedFromUtahMosaic = false;
    this.DEFAULT_IOBIO_BACKEND  = "backend.iobio.io"
    this.IOBIO_SERVICES         = null;
    this.HTTP_SERVICES          = null;
    this.useSSL                = true;
    this.geneInfoServer        = null;
    this.genomeBuildServer     = null;

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
  scrollToBottom(container) {

    if ($(container) && $(container).length > 0) {
      let el = $(container)[0]
      const { top, left, bottom, right } = el.getBoundingClientRect();
      const { innerHeight, innerWidth } = window;
      let isVisible = top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
      if (!isVisible) {
        let y = window.scrollY + (bottom - innerHeight);
        let parentElem = $('html')[0]
        parentElem.scrollTo({top: y, behavior: 'smooth'})
      }

    }

  }
  scrollToTop(container) {

    if ($(container) && $(container).length > 0) {
      let el = $(container)[0]
      const { top, left, bottom, right } = el.getBoundingClientRect();
      const { innerHeight, innerWidth } = window;
      let isVisible = top >= 0 && left >= 0 && bottom <= innerHeight && right <= innerWidth;
      if (!isVisible) {
        let y = window.scrollY + (top - 40);
        let parentElem = $('html')[0]
        parentElem.scrollTo({top: y, behavior: 'smooth'})
      }

    }

  }


  doArcsIntersect(path0, path1) {
    let self = this;

    let strokeWidth  = +path0.style("stroke-width").replace("px", "")
    let strokeWidth1 = +path1.style("stroke-width").replace("px", "")

    let minXGap = Math.max(50, strokeWidth, strokeWidth1);
    let minYGap = Math.max(2, strokeWidth, strokeWidth1);

    let arcYTop = path0.data()[0].arcYTop;
    let bb = path0.node().getBBox();
    let [left, top, right, bottom] = [bb.x, bb.y, bb.x + bb.width, bb.y + bb.height];

    let arcYTop1 = path1.data()[0].arcYTop;
    let bb1 = path1.node().getBBox();
    let [left1, top1, right1, bottom1] = [bb1.x, bb1.y, bb1.x + bb1.width, bb1.y + bb1.height];

    let intersects =
      Math.abs(arcYTop - arcYTop1) < minYGap &&
      Math.abs(left - left1)       < minXGap &&
      Math.abs(right - right1)     < minXGap ?
      true : false;

    return intersects;
  }





}

export default GlobalApp

