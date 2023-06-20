class Util {
  constructor() {
    this.globalApp = null;
    
  }


  decodeUrl(url) {
    if (url && (url.slice(0,14) == 'https%3A%2F%2F' || url.slice(0,13) == 'http%3A%2F%2F'))
      return decodeURIComponent(url)
    else
      return url;
  }

  formatDate(d) {
    var padMinutes = function(n) {
        return String("00" + n).slice(-2);
    }
    var formatHours = function(h) {
      if (+h > 12) {
        return +h - 12;
      } else {
        return h;
      }
    }
    var getAmPm = function(h) {
      if (+h > 12) {
        return 'pm';
      } else {
        return 'am';
      }
    }
    return d.getMonth() + "-" + d.getDay() + "-" + d.getFullYear() + " " + formatHours(d.getHours()) + ":" + padMinutes(d.getMinutes()) + " " + getAmPm(d.getHours());
  }



  getCurrentDateTime() {
    var dateObj = new Date();
    return dateObj.getTime();
  }

  formatCurrentDateTime(time) {
    var dateObject = new Date(time);
    return dateObject.toString();
  }

  isObject(val) {
    if (val === null) {
      return false;
    } else {
      return ( (typeof val === 'function') || (typeof val === 'object') );
    }
  }

  visibleHeight($el) {
      var elH = $el.outerHeight(),
          H = $(window).height(),
          r = $el[0].getBoundingClientRect(), t=r.top, b=r.bottom;
      return Math.max(0, t>0? Math.min(elH, H-t) : (b<H?b:H));
  }

 
  changeSiteStylesheet(cssHref) {

      var oldlink = $("#site-stylesheet")[0];

      var newlink = document.createElement("link");
      newlink.setAttribute("rel",  "stylesheet");
      newlink.setAttribute("id",   "site-stylesheet");
      newlink.setAttribute("type", "text/css");
      newlink.setAttribute("href", cssHref);

      document.getElementsByTagName("head").item(0).replaceChild(newlink, oldlink);
  }

  createDownloadLink(anchorSelector, str, fileName) {

    if(window.navigator.msSaveOrOpenBlob) {
      var fileData = [str];
      blobObject = new Blob(fileData);
      $(anchorSelector).click(function(){
        window.navigator.msSaveOrOpenBlob(blobObject, fileName);
      });
    } else {
      var url = "data:text/plain;charset=utf-8," + encodeURIComponent(str);
      $(anchorSelector).attr("download", fileName);
      $(anchorSelector).attr("href", url);
    }
  }

  endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  showStackTrace(e) {
    var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    console.log(stack);
  }


  formatCurrentDateYMD(delim="") {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd
    }
    if(mm<10){
        mm='0'+mm
    }
    return yyyy + delim + mm + delim + dd;
  }

  formatCurrentDateTime(delim) {
    var theDelim = delim ? delim : '-';
    var theTimeDelim = delim ? delim : ':';
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1; //January is 0!

    var yyyy = today.getFullYear();
    if(dd<10){
        dd='0'+dd
    }
    if(mm<10){
        mm='0'+mm
    }


    var hours = today.getHours();
    var minutes = today.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var theTime = hours + theTimeDelim + minutes + ampm;

    var today = mm + theDelim + dd + theDelim + yyyy + theDelim + theTime;
    return today;
  }

  
  stripRefName(refName) {
    var tokens = refName.split("chr");
    var strippedName = refName;
    if (tokens.length > 1) {
      strippedName = tokens[1];
    } else {
      tokens = refName.split("ch");
      if (tokens.length > 1) {
        strippedName = tokens[1];
      }
    }
    return strippedName;
  }


  uniq(theArray) {
     return Array.from(new Set(theArray));
  }


  capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
  }

  percentage(a, showSign=true) {
    let me = this;
    var pct = a * 100;
    var places = 0;
    if (pct < .001) {
      places = 4;
    } else if (pct < .01) {
      places = 3;
    } else if (pct < .1) {
      places = 2
    } else if (pct < 1) {
      places = 1;
    } else {
      places = 0;
    }
    return me.round(pct, places) + (showSign ? "%" : "");
  }

  round(value, places) {
    return +(Math.round(value + "e+" + places)  + "e-" + places);
  }

  splitArray(a, n) {
    var len = a.length,out = [], i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i + size));
        i += size;
    }
    return out;
  }


  getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    var hits = {};

    var matchExact = function(r, str) {
      var match = str.match(r);
      return match != null && str.indexOf(match[0]) == 0;
    }

    var getMatch = function(string, regex, index) {
      index || (index = 1); // default to the first capturing group
      var matches = [];
      var match = regex.exec(string);
      if (match && match.length > index && match[index]) {
        return match[index];
      } else {
        return null;
      }
    }


    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (typeof sParam == 'string' || sParam instanceof String) {
          if (sParameterName[0] == sParam)
          {
              return sParameterName[1];
          }
      } else {
        var match = getMatch(sParameterName[0], sParam)
        if ( match) {
          hits[sParameterName[0]] = sParameterName[1];
        }
      }
    }

    if (Object.keys(hits).length == 0)
      return undefined;
    else
      return hits;
  }


  addCommas(nStr) {
    nStr += '';
    let x = nStr.split('.');
    let x1 = x[0];
    let x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
      x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
  }


  updateUrl(paramName, value) {
    var params = {};
    // turn params into hash
    window.location.search.split('&').forEach(function(param){
      if (param != '') {
        param = param.split('?').length == 1 ? param : param.split('?')[1];
        var fields = param.split('=');
        params[fields[0]] = fields[1];
      }
    });
    params[paramName] = value;
    var search = [];
    Object.keys(params).forEach(function(key) {
      search.push(key + '=' + params[key]);
    })
      window.history.replaceState(null,null,'?'+search.join('&'));
  }

  removeUrl(paramName) {
    var params = {};
    // turn params into hash, but leave out the specified parameter
    window.location.search.split('&').forEach(function(param){
      if (param.indexOf(paramName) == 0) {

      } else if (param != '') {
        param = param.split('?').length == 1 ? param : param.split('?')[1];
        var fields = param.split('=');
        params[fields[0]] = fields[1];
      }
    });
    var search = [];
    Object.keys(params).forEach(function(key) {
      search.push(key + '=' + params[key]);
    })
    window.history.replaceState(null,null,'?'+search.join('&'));

  }


  isChrome() {
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

    var isChrome = /Chrome/.test(window.navigator.userAgent) && /Google Inc/.test(window.navigator.vendor);  

    if(isChrome) {
      return true;
    } else if (isIOSChrome) {
      return true;
    } else if (
      isChromium !== null &&
      typeof isChromium !== "undefined" &&
      vendorName === "Google Inc." &&
      isOpera === false &&
      isIEedge === false
    ) {
      return true;
    } else {
      return false;
    }
  }



  /**
   * detect IE
   * returns version of IE or false, if browser is not Internet Explorer
   */
  detectIE() {
      var ua = window.navigator.userAgent;

      var msie = ua.indexOf('MSIE ');
      if (msie > 0) {
          // IE 10 or older => return version number
          return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
      }

      var trident = ua.indexOf('Trident/');
      if (trident > 0) {
          // IE 11 => return version number
          var rv = ua.indexOf('rv:');
          return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
      }

      var edge = ua.indexOf('Edge/');
      if (edge > 0) {
         // IE 12 => return version number
         return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
      }

      // other browser
      return false;
  }

  detectSafari() {
    return (navigator.userAgent.indexOf('Safari') != -1 && !this.isChrome());
  }



  // Function from David Walsh: http://davidwalsh.name/css-animation-callback
  whichTransitionEvent() {
    var t,
        el = document.createElement("fakeelement");

    var transitions = {
      "transition"      : "transitionend",
      "OTransition"     : "oTransitionEnd",
      "MozTransition"   : "transitionend",
      "WebkitTransition": "webkitTransitionEnd"
    }

    for (t in transitions){
      if (el.style[t] !== undefined){
        return transitions[t];
      }
    }
  }


}
export default Util

