var registerSourceHandler = require('./videojs-hlsjs-source-handler.js');

if (window.videojs) {
    registerSourceHandler(window.videojs);
}

module.exports = { register: registerSourceHandler };
