import HlsjsWrapper from "hlsjs-wrapper";
import Hls from "hls.js";
import XhrLoader from '../../node_modules/hls.js/src/utils/xhr-loader.js'; //TODO: is other a cleaner way to access 'non-main' classes in hls.js dependency?

var UAParser = require('ua-parser-js');
var parser = new UAParser();
parser.setUA(window.navigator.userAgent);
var uaObject = parser.getResult();

class HlsjsBundle {
    constructor (hlsConfig, p2pConfig) {
        var hlsjsWrapper = new HlsjsWrapper(XhrLoader);

        hlsConfig.loader = hlsjsWrapper.P2PLoader;
        hlsConfig.xhrSetup = hlsjsWrapper.setRange;

        //Set buffer configuration params, unless they're specified
        hlsConfig.maxBufferSize = hlsConfig.maxBufferSize || 0;
        hlsConfig.maxBufferLength = hlsConfig.maxBufferLength || 30;

        var hls = new Hls(hlsConfig);

        hls.on(Hls.Events.MANIFEST_LOADING, (event, data) => {
            hlsjsWrapper.createSRModule(p2pConfig, hls, Hls.Events);
        });

        return hls;
    }
}

//Inheriting static properties from Hls. Quite dirty but it does the trick. ES6 Proxies might help here, but there'll be no polyfill

function inheritStaticProperty(staticProperty) {
  Object.defineProperty(HlsjsBundle, staticProperty, {
    get: function () {
      return Hls[staticProperty];
    },
    set: undefined
  });
}

for (var staticProperty of Object.getOwnPropertyNames(Hls)) {
  if (["prototype", "name", "length", "caller", "arguments", "isSupported"].indexOf(staticProperty) === -1) {
    inheritStaticProperty(staticProperty);
  }
}

HlsjsBundle.isSupported = function(){
    var isSafari = uaObject.browser.name === "Safari";

    // Exclude mobile devices (careful: device properties aren't always defined, as in chrome for example, check mobile OS too).
    var isMobile = uaObject.device.type === "mobile" ||
                   uaObject.device.type === "tablet" ||
                   uaObject.device.type === "console" ||
                   uaObject.os.name === "Android" ||
                   uaObject.os.name === "iOS";

    return Hls.isSupported() && !isSafari && !isMobile;
};

HlsjsBundle.getBrowserName = function() {
    return uaObject.browser.name;
};

export default HlsjsBundle;