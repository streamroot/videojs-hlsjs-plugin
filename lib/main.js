var vjsPlugin = require('./videojs-hlsjs-plugin.js');

if (window.videojs) {
    vjsPlugin.registerConfigPlugin(window.videojs);
    vjsPlugin.registerSourceHandler(window.videojs);
}

var libObject = { register: vjsPlugin.registerSourceHandler };
var moduleName = 'hlsSourceHandler';
if (!window[moduleName]) {
    window[moduleName] = libObject;
}
