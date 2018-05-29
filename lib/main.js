var vjsPlugin = require('./videojs-hlsjs-plugin.js');

if (window.videojs) {
    vjsPlugin.registerConfigPlugin(window.videojs);
    vjsPlugin.registerSourceHandler(window.videojs);
}

module.exports = { register: vjsPlugin.registerSourceHandler };
