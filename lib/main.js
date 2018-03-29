var Hlsjs = require('hls.js');
var attachVideojsHtml5Hlsjs = require('./videojs-hlsjs-source-handler.js');

attachVideojsHtml5Hlsjs(window.videojs, Hlsjs);
