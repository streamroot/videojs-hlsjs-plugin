require("videojs-quality-picker");

var attachVideojsStreamrootProvider = function (window, videojs, Hls) {
    function StreamrootProviderHLS (source, tech) {
        tech.name_ = 'streamrootHLS';

        var _video = tech.el();
        var _hls;
        var _errorCounts = {};

        function initialize() {
            var hlsjsConfig = tech.options_.hlsjsConfig || {};

            _hls = new Hls(hlsjsConfig);
            _hls.on(Hls.Events.ERROR, function(event, data) { _onError(event, data, tech, _errorCounts) });
            _hls.on(Hls.Events.MANIFEST_PARSED, _onMetaData);

            _hls.attachMedia(_video);
        }

        this.dispose = function () {
            _hls.destroy();
        };

        function load(source) {
            _hls.loadSource(source.src);
        }

        function switchQuality(qualityId, trackType) {
            _hls.nextLevel = qualityId;
        }

        function _onError(event, data, tech, errorCounts) {
            var error = {
              message: ('HLS.js error: ' + data.type + ' - fatal: ' + data.fatal + ' - ' + data.details),
            };
            console.error(error.message);

            // increment/set error count
            errorCounts[data.type] ? errorCounts[data.type] += 1 : errorCounts[data.type] = 1;
            
            // implement simple error handling based on hls.js documentation (https://github.com/dailymotion/hls.js/blob/master/API.md#fifth-step-error-handling)
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.info("bubbling network error up to VIDEOJS");
                        error.code = 2;
                        tech.error = function() { return error; };
                        tech.trigger('error');
                        break;

                    case Hls.ErrorTypes.MEDIA_ERROR:
                        if (errorCounts[data.type] === 1) {
                          console.info("trying to recover media error");
                          _hls.recoverMediaError();
                        } else if (errorCounts[data.type] === 2) {
                          console.info("2nd try to recover media error (by swapping audio codec");
                          _hls.swapAudioCodec();
                          _hls.recoverMediaError();
                        } else if (errorCounts[data.type] > 2) {
                          console.info("bubbling media error up to VIDEOJS");
                          error.code = 3;
                          tech.error = function() { return error; };
                          tech.trigger('error');
                        }
                        break;

                    default:
                        // cannot recover
                        _hls.destroy();
                        console.info("bubbling error up to VIDEOJS");
                        tech.error = function() { return error; };
                        tech.trigger('error');
                        break;
                }
            }
        }

        function _onMetaData(event, data) {
            var cleanTracklist = [];

            if (data.levels.length > 1) {
                var autoLevel = {
                    id: -1,
                    label: "auto",
                    selected: -1 === _hls.manualLevel
                };
                cleanTracklist.push(autoLevel);
            }

            data.levels.forEach(function(level, index) {
                var quality = {}; // Don't write in level (shared reference with Hls.js)
                quality.id = index;
                quality.selected = index === _hls.manualLevel;
                quality.label = _levelLabel(level);

                cleanTracklist.push(quality);
            });

            var payload = {
                qualityData: {video: cleanTracklist},
                qualitySwitchCallback: switchQuality
            };

            tech.trigger('loadedqualitydata', payload);

            function _levelLabel(level) {
                if (level.height) return level.height + "p";
                else if (level.width) return Math.round(level.width * 9 / 16) + "p";
                else if (level.bitrate) return (level.bitrate / 1000) + "kbps";
                else return 0;
            }
        }

        initialize();
        load(source);
    }

    if (Hls.isSupported()) {
        videojs.getComponent('Html5').registerSourceHandler({

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

                tech.hlsProvider = new StreamrootProviderHLS(source, tech);

                return tech.hlsProvider;
            }

        }, 0);

    } else {
        console.error("Hls.js is not supported in this browser!");
    }

    videojs.StreamrootProviderHLS = StreamrootProviderHLS;
};

module.exports = attachVideojsStreamrootProvider;
