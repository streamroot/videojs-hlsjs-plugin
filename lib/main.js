var Hls = require('hls.js');
var attachVideojsStreamrootProvider = require('./videojs-hlsjs-source-handler.js');

attachVideojsStreamrootProvider(window, window.videojs, Hls);
