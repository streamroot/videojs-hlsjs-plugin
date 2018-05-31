var Hlsjs = require('hls.js');

var registerSourceHandler = function (videojs) {
    var hooks = {};

    function Html5Hlsjs(source, tech) {
        tech.name_ = 'StreamrootHlsjs';

        var _video = tech.el();
        var _hls;
        var _errorCounts = {};
        var _duration = null;
        var _player = videojs(tech.options_.playerId);

        function _executeHooksFor(type) {
            if (hooks[type] === undefined) {
                return;
            }

            // ES3 and IE < 9
            for (var i = 0; i < hooks[type].length; i++) {
                hooks[type][i](_player, _hls);
            }
        }

        function _handleMediaError(error) {
            if (_errorCounts[Hlsjs.ErrorTypes.MEDIA_ERROR] === 1) {
                console.info('trying to recover media error');
                _hls.recoverMediaError();
            } else if (_errorCounts[Hlsjs.ErrorTypes.MEDIA_ERROR] === 2) {
                console.info('2nd try to recover media error (by swapping audio codec');
                _hls.swapAudioCodec();
                _hls.recoverMediaError();
            } else if (_errorCounts[Hlsjs.ErrorTypes.MEDIA_ERROR] > 2) {
                console.info('bubbling media error up to VIDEOJS');
                tech.error = function () { return error; };
                tech.trigger('error');
            }
        }

        function _onError(event, data) {
            var error = {
                message: ('HLS.js error: ' + data.type + ' - fatal: ' + data.fatal + ' - ' + data.details)
            };
            console.error(error.message);

            // increment/set error count
            if (_errorCounts[data.type]) {
                _errorCounts[data.type] += 1;
            } else {
                _errorCounts[data.type] = 1;
            }

            // implement simple error handling based on hls.js documentation (https://github.com/dailymotion/hls.js/blob/master/API.md#fifth-step-error-handling)
            if (data.fatal) {
                switch (data.type) {
                    case Hlsjs.ErrorTypes.NETWORK_ERROR:
                        console.info('bubbling network error up to VIDEOJS');
                        error.code = 2;
                        tech.error = function () { return error; };
                        tech.trigger('error');
                        break;

                    case Hlsjs.ErrorTypes.MEDIA_ERROR:
                        error.code = 3;
                        _handleMediaError(error);
                        break;

                    default:
                        // cannot recover
                        _hls.destroy();
                        console.info('bubbling error up to VIDEOJS');
                        tech.error = function () { return error; };
                        tech.trigger('error');
                        break;
                }
            }
        }

        function switchQuality(qualityId) {
            _hls.nextLevel = qualityId;
        }

        function _onMetaData(event, data) {
            function _levelLabel(level) {
                if (level.height) return level.height + 'p';
                else if (level.width) return Math.round(level.width * 9 / 16) + 'p';
                else if (level.bitrate) return (level.bitrate / 1000) + 'kbps';
                return 0;
            }

            var cleanTracklist = [];

            if (data.levels.length > 1) {
                var autoLevel = {
                    id: -1,
                    label: 'auto',
                    selected: _hls.manualLevel === -1
                };
                cleanTracklist.push(autoLevel);
            }

            data.levels.forEach(function (level, index) {
                var quality = {}; // Don't write in level (shared reference with Hls.js)
                quality.id = index;
                quality.selected = index === _hls.manualLevel;
                quality.label = _levelLabel(level);

                cleanTracklist.push(quality);
            });

            var payload = {
                qualityData: { video: cleanTracklist },
                qualitySwitchCallback: switchQuality
            };

            tech.trigger('loadedqualitydata', payload);
        }

        function _onAudioTracks() {
            var hlsAudioTracks = _hls.audioTracks;
            var playerAudioTracks = tech.audioTracks();
            if (hlsAudioTracks.length > 1 && playerAudioTracks.length === 0) {
                // Add Hls.js audio tracks if not added yet
                for (var i = 0; i < hlsAudioTracks.length; i++) {
                    playerAudioTracks.addTrack(new videojs.AudioTrack({
                        id: i,
                        kind: 'alternative',
                        label: hlsAudioTracks[i].name || hlsAudioTracks[i].lang,
                        language: hlsAudioTracks[i].lang,
                        enabled: i === _hls.audioTrack
                    }));
                }

                // Handle audio track change event
                playerAudioTracks.addEventListener('change', function () {
                    for (var j = 0; j < playerAudioTracks.length; j++) {
                        if (playerAudioTracks[j].enabled) {
                            _hls.audioTrack = j;
                            break;
                        }
                    }
                });
            }
        }

        function _startLoad() {
            _hls.startLoad(-1);
            _video.removeEventListener('play', _startLoad);
        }

        function _oneLevelObjClone(obj) {
            var result = {};
            var objKeys = Object.keys(obj);
            for (var i = 0; i < objKeys.length; i++) {
                result[objKeys[i]] = obj[objKeys[i]];
            }
            return result;
        }

        function _initHlsjs() {
            var hlsjsConfigRef = tech.options_.hlsjsConfig;
            // NOTE: Hls.js will write to the reference thus change the object for later streams
            var hlsjsConfig = hlsjsConfigRef ? _oneLevelObjClone(hlsjsConfigRef) : {};

            if (['', 'auto'].indexOf(_video.preload) === -1 && !_video.autoplay && hlsjsConfig.autoStartLoad === undefined) {
                hlsjsConfig.autoStartLoad = false;
            }

            // If the user explicitely sets autoStartLoad to false, we're not going to enter the if block above, that's why we have a separate if block here to set the 'play' listener
            if (hlsjsConfig.autoStartLoad === false) {
                _video.addEventListener('play', _startLoad);
            }

            _hls = new Hlsjs(hlsjsConfig);

            _executeHooksFor('beforeinitialize');

            _hls.on(Hlsjs.Events.ERROR, function (event, data) { _onError(event, data, tech, _errorCounts); });
            _hls.on(Hlsjs.Events.MANIFEST_PARSED, _onMetaData);
            _hls.on(Hlsjs.Events.AUDIO_TRACK_LOADED, _onAudioTracks);
            _hls.on(Hlsjs.Events.LEVEL_LOADED, function (event, data) { _duration = data.details.live ? Infinity : data.details.totalduration; });

            _hls.attachMedia(_video);
            _hls.loadSource(source.src);
        }

        function initialize() {
            _initHlsjs();
        }

        this.duration = function () {
            return _duration || _video.duration || 0;
        };

        // See comment for `initialize` method.
        this.dispose = function () {
            _video.removeEventListener('play', _startLoad);

            _hls.destroy();
        };

        _video.addEventListener('error', function (evt) {
            var errorTxt,
                mediaError = evt.currentTarget.error;

            switch (mediaError.code) {
                case mediaError.MEDIA_ERR_ABORTED:
                    errorTxt = 'You aborted the video playback';
                    break;
                case mediaError.MEDIA_ERR_DECODE:
                    errorTxt = 'The video playback was aborted due to a corruption problem or because the video used features your browser did not support';
                    _handleMediaError(mediaError);
                    break;
                case mediaError.MEDIA_ERR_NETWORK:
                    errorTxt = 'A network error caused the video download to fail part-way';
                    break;
                case mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                    errorTxt = 'The video could not be loaded, either because the server or network failed or because the format is not supported';
                    break;

                default:
                    errorTxt = mediaError.message;
            }

            console.error('MEDIA_ERROR: ', errorTxt);
        });

        initialize();
    }

    Html5Hlsjs.addHook = function (type, callback) {
        hooks[type] = hooks[type] || [];
        hooks[type].push(callback);
    };

    Html5Hlsjs.removeHook = function (type, callback) {
        if (hooks[type] === undefined) {
            return false;
        }

        var index = hooks[type].indexOf(callback);

        if (index === -1) {
            return false;
        }

        hooks[type].splice(index, 1);

        return true;
    };

    if (Hlsjs.isSupported()) {
        var html5;

        if (typeof videojs.getTech === 'function') {
            html5 = videojs.getTech('Html5');
        } else if (typeof videojs.getComponent === 'function') {
            html5 = videojs.getComponent('Html5');
        } else {
            console.error('Not supported version if video.js');

            return;
        }

        if (!html5) {
            console.error('Not supported version if video.js');

            return;
        }

        html5.registerSourceHandler({
            canHandleSource: function (source) {
                var hlsTypeRE = /^application\/x-mpegURL$/i;
                var hlsExtRE = /\.m3u8/i;
                var result;

                if (hlsTypeRE.test(source.type)) {
                    result = 'probably';
                } else if (hlsExtRE.test(source.src)) {
                    result = 'maybe';
                } else {
                    result = '';
                }

                return result;
            },
            handleSource: function (source, tech) {
                if (tech.hlsProvider) {
                    tech.hlsProvider.dispose();
                }

                tech.hlsProvider = new Html5Hlsjs(source, tech);

                return tech.hlsProvider;
            }
        }, 0);

        videojs.Html5Hlsjs = Html5Hlsjs;
    } else {
        console.warn('Hls.js is not supported in this browser!');
    }
};

function streamrootHlsjsConfigHandler(options) {
    var player = this;

    if (!options) {
        return;
    }

    if (!player.options_.html5) {
        player.options_.html5 = {};
    }

    if (!player.options_.html5.hlsjsConfig) {
        player.options_.html5.hlsjsConfig = options.hlsjsConfig;
    }
}

var registerConfigPlugin = function (videojs) {
    // Used in Brightcove since we don't pass options directly there
    var registerVjsPlugin = videojs.registerPlugin || videojs.plugin;
    registerVjsPlugin('streamrootHls', streamrootHlsjsConfigHandler);
};

module.exports = {
    registerSourceHandler: registerSourceHandler,
    registerConfigPlugin: registerConfigPlugin
};
