var Hls = require("hls.js");
var attachVideojsStreamrootProvider = require('./videojs5-hlsjs-source-handler');

attachVideojsStreamrootProvider(window, window.videojs, Hls);
