var Hlsjs = require('hls.js');

var registerSourceHandler = function (videojs) {
    var hooks = {};

    function Html5Hlsjs(source, tech) {
        tech.name_ = 'StreamrootHlsjs';

        var _video = tech.el();
        var _hls;
        var _errorCounts = {};
        var _duration = null;
        var _metadata = null;
        var _isLive = null;
        var _dvrDuration = null;
        var _edgeMargin = null;
        var _hlsjsConfig = null;
        var _player = videojs(tech.options_.playerId);
        var qualityLevels = _player.qualityLevels && _player.qualityLevels();

        // The `videojs-hls-quality-selector` plugin only activates when tech.hls is defined.
        if (qualityLevels && _player.hlsQualitySelector) {
            tech.hls = {};
        }

        var _uiTextTrackHandled = false;

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

        function _levelLabel(level) {
            if (level.height) return level.height + 'p';
            else if (level.width) return Math.round(level.width * 9 / 16) + 'p';
            else if (level.bitrate) return (level.bitrate / 1000) + 'kbps';
            return 0;
        }

        function _relayQualityChange() {
            // Determine if it is "Auto" (all tracks enabled)
            var isAuto = true;
            for (var i = 0; i < qualityLevels.length; i++) {
                if (!qualityLevels[i]._enabled) {
                    isAuto = false;
                    break;
                }
            }

            // Interact with ME
            if (isAuto) {
                _hls.currentLevel = -1;
            } else {
                // Find ID of highest enabled track
                var selectedTrack;
                for (selectedTrack = qualityLevels.length - 1; selectedTrack >= 0; selectedTrack--) {
                    if (qualityLevels[selectedTrack]._enabled) {
                        break;
                    }
                }
                _hls.currentLevel = selectedTrack;
            }
        }

        function _toggleLevel(level, toggle) {
            // NOTE: Brightcove switcher works TextTracks-style (enable tracks that it wants to ABR on)
            if (qualityLevels) {
                if (typeof toggle === 'boolean') {
                    qualityLevels[level]._enabled = toggle;
                    _relayQualityChange();
                }
                return qualityLevels[level]._enabled;
            }
            return false;
        }

        function _handleQualityLevels() {
            if (_metadata) {
                qualityLevels = _player.qualityLevels && _player.qualityLevels();
                if (qualityLevels) {
                    tech.hls = {};
                    for (var i = 0; i < _metadata.levels.length; i++) {
                        var details = _metadata.levels[i];
                        var name = 'hlsjs-' + i;
                        var representation = {
                            id: name,
                            label: name,
                            width: details.width,
                            height: details.height,
                            bandwidth: details.bitrate,
                            bitrate: details.bitrate,
                            _enabled: false
                        };
                        representation.enabled = _toggleLevel.bind(this, i);
                        qualityLevels.addQualityLevel(representation);
                    }
                }
            }
        }

        function _syncQualityLevels(event, data) {
            if (qualityLevels) {
                qualityLevels.selectedIndex_ = data.level;
                qualityLevels.trigger({
                    selectedIndex: data.level,
                    type: 'change'
                });
            }
        }

        function _notifyVideoQualities() {
            if (_metadata) {
                var cleanTracklist = [];

                if (_metadata.levels.length > 1) {
                    var autoLevel = {
                        id: -1,
                        label: 'auto',
                        selected: _hls.manualLevel === -1
                    };
                    cleanTracklist.push(autoLevel);
                }

                _metadata.levels.forEach(function (level, index) {
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

                // Self-de-register so we don't raise the payload multiple times
                _video.removeEventListener('playing', _notifyVideoQualities);
            }
        }

        function _updateSelectedAudioTrack() {
            var playerAudioTracks = tech.audioTracks();
            for (var j = 0; j < playerAudioTracks.length; j++) {
                if (playerAudioTracks[j].enabled) {
                    _hls.audioTrack = j;
                    break;
                }
            }
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
                playerAudioTracks.addEventListener('change', _updateSelectedAudioTrack);
            }
        }

        function _getTextTrackLabel(textTrack) {
            // NOTE: label here is readable label and is optional (used in the UI so if it is there it should be different)
            var label = textTrack.label ? textTrack.label : textTrack.language;
            return label;
        }

        function _isSameTextTrack(track1, track2) {
            return _getTextTrackLabel(track1) === _getTextTrackLabel(track2) && track1.kind === track2.kind;
        }

        function _updateSelectedTextTrack() {
            var playerTextTracks = _player.textTracks();
            var activeTrack = null;
            for (var j = 0; j < playerTextTracks.length; j++) {
                if (playerTextTracks[j].mode === 'showing') {
                    activeTrack = playerTextTracks[j];
                    break;
                }
            }

            var hlsjsTracks = _video.textTracks;
            for (var k = 0; k < hlsjsTracks.length; k++) {
                if (hlsjsTracks[k].kind === 'subtitles' || hlsjsTracks[k].kind === 'captions') {
                    hlsjsTracks[k].mode = activeTrack && _isSameTextTrack(hlsjsTracks[k], activeTrack) ? 'showing' : 'disabled';
                }
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

        function _filterDisplayableTextTracks(textTracks) {
            var displayableTracks = [];

            // Filter out tracks that is displayable (captions or subtitltes)
            for (var idx = 0; idx < textTracks.length; idx++) {
                if (textTracks[idx].kind === 'subtitles' || textTracks[idx].kind === 'captions') {
                    displayableTracks.push(textTracks[idx]);
                }
            }

            return displayableTracks;
        }

        function _updateTextTrackList() {
            var displayableTracks = _filterDisplayableTextTracks(_video.textTracks);
            var playerTextTracks = _player.textTracks();

            // Add stubs to make the caption switcher shows up
            // NOTE: Adding the Hls.js text track in will make us have double captions
            for (var idx = 0; idx < displayableTracks.length; idx++) {
                var isAdded = false;
                for (var jdx = 0; jdx < playerTextTracks.length; jdx++) {
                    if (_isSameTextTrack(displayableTracks[idx], playerTextTracks[jdx])) {
                        isAdded = true;
                        break;
                    }
                }

                if (!isAdded) {
                    var hlsjsTextTrack = displayableTracks[idx];
                    _player.addRemoteTextTrack({
                        kind: hlsjsTextTrack.kind,
                        label: _getTextTrackLabel(hlsjsTextTrack),
                        language: hlsjsTextTrack.language,
                        srclang: hlsjsTextTrack.language
                    }, false);
                }
            }

            // Handle UI switching
            _updateSelectedTextTrack();
            if (!_uiTextTrackHandled) {
                playerTextTracks.addEventListener('change', _updateSelectedTextTrack);
                _uiTextTrackHandled = true;
            }
        }

        function _onMetaData(event, data) {
            // This could arrive before 'loadedqualitydata' handlers is registered, remember it so we can raise it later
            _metadata = data;
            _handleQualityLevels();
        }

        function _createCueHandler(captionConfig) {
            return {
                newCue: function (track, startTime, endTime, captionScreen) {
                    var row;
                    var cue;
                    var text;
                    var VTTCue = window.VTTCue || window.TextTrackCue;

                    for (var r = 0; r < captionScreen.rows.length; r++) {
                        row = captionScreen.rows[r];
                        text = '';
                        if (!row.isEmpty()) {
                            for (var c = 0; c < row.chars.length; c++) {
                                text += row.chars[c].uchar;
                            }
                            cue = new VTTCue(startTime, endTime, text.trim());

                            // NOTE: typeof null === 'object'
                            if (captionConfig != null && typeof captionConfig === 'object') {
                                // Copy client overridden property into the cue object
                                var configKeys = Object.keys(captionConfig);
                                for (var k = 0; k < configKeys.length; k++) {
                                    cue[configKeys[k]] = captionConfig[configKeys[k]];
                                }
                            }
                            track.addCue(cue);
                            if (endTime === startTime) track.addCue(new VTTCue(endTime + 5, ''));
                        }
                    }
                }
            };
        }

        function _initHlsjs() {
            var hlsjsConfigRef = _player.srOptions_ && _player.srOptions_.hlsjsConfig || tech.options_.hlsjsConfig;
            // NOTE: Hls.js will write to the reference thus change the object for later streams
            _hlsjsConfig = hlsjsConfigRef ? _oneLevelObjClone(hlsjsConfigRef) : {};

            if (['', 'auto'].indexOf(_video.preload) === -1 && !_video.autoplay && _hlsjsConfig.autoStartLoad === undefined) {
                _hlsjsConfig.autoStartLoad = false;
            }

            var captionConfig = _player.srOptions_ && _player.srOptions_.captionConfig || tech.options_.captionConfig;
            if (captionConfig) {
                _hlsjsConfig.cueHandler = _createCueHandler(captionConfig);
            }

            // If the user explicitely sets autoStartLoad to false, we're not going to enter the if block above, that's why we have a separate if block here to set the 'play' listener
            if (_hlsjsConfig.autoStartLoad === false) {
                _video.addEventListener('play', _startLoad);
            }

            // _notifyVideoQualities sometimes runs before the quality picker event handler is registered -> no video switcher
            _video.addEventListener('playing', _notifyVideoQualities);

            _hls = new Hlsjs(_hlsjsConfig);

            _executeHooksFor('beforeinitialize');

            _hls.on(Hlsjs.Events.ERROR, function (event, data) { _onError(event, data, tech, _errorCounts); });
            _hls.on(Hlsjs.Events.AUDIO_TRACKS_UPDATED, _onAudioTracks);
            _hls.on(Hlsjs.Events.MANIFEST_PARSED, _onMetaData);
            _hls.on(Hlsjs.Events.LEVEL_LOADED, function (event, data) {
                // The DVR plugin will auto seek to "live edge" on start up
                if (_hlsjsConfig.liveSyncDuration) {
                    _edgeMargin = _hlsjsConfig.liveSyncDuration;
                } else if (_hlsjsConfig.liveSyncDurationCount) {
                    _edgeMargin = _hlsjsConfig.liveSyncDurationCount * data.details.targetduration;
                }
                _isLive = data.details.live;
                _dvrDuration = data.details.totalduration;
                _duration = _isLive ? Infinity : data.details.totalduration;
            });
            _hls.once(Hlsjs.Events.FRAG_LOADED, function () {
                // Emit custom 'loadedmetadata' event for parity with `videojs-contrib-hls`
                // Ref: https://github.com/videojs/videojs-contrib-hls#loadedmetadata
                tech.trigger('loadedmetadata');
            });
            _hls.on(Hlsjs.Events.LEVEL_SWITCHED, _syncQualityLevels);

            _hls.attachMedia(_video);
            _video.textTracks.addEventListener('addtrack', _updateTextTrackList);
            _hls.loadSource(source.src);
        }

        function initialize() {
            _initHlsjs();
        }

        this.duration = function () {
            return _duration || _video.duration || 0;
        };

        this.seekable = function () {
            if (_hls.media) {
                if (!_isLive) {
                    return videojs.createTimeRanges(0, _hls.media.duration);
                }
                // Video.js doesn't seem to like floating point timeranges
                var startTime = Math.round(_hls.media.duration - _dvrDuration);
                var endTime = Math.round(_hls.media.duration - _edgeMargin);
                return videojs.createTimeRanges(startTime, endTime);
            }
            return videojs.createTimeRanges();
        };

        // See comment for `initialize` method.
        this.dispose = function () {
            _video.removeEventListener('play', _startLoad);
            _video.textTracks.removeEventListener('addtrack', _updateTextTrackList);
            _video.removeEventListener('playing', _notifyVideoQualities);

            _player.textTracks().removeEventListener('change', _updateSelectedTextTrack);
            _uiTextTrackHandled = false;
            _player.audioTracks().removeEventListener('change', _updateSelectedAudioTrack);

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
                var hlsTypeRE = /^application\/x-mpegURL|application\/vnd\.apple\.mpegurl$/i;
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


    if (!player.srOptions_) {
        player.srOptions_ = {};
    }

    if (!player.srOptions_.hlsjsConfig) {
        player.srOptions_.hlsjsConfig = options.hlsjsConfig;
    }

    if (!player.srOptions_.captionConfig) {
        player.srOptions_.captionConfig = options.captionConfig;
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
