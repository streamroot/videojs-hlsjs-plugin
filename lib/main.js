var registerSourceHandler = require('./videojs-hlsjs-plugin.js');

if (window.videojs) {
    registerSourceHandler(window.videojs);
}

module.exports = { register: registerSourceHandler };
