import Hls from "hls.js";

var attachVideojsStreamrootProvider = function (window, videojs) {
    function StreamrootProviderHLS (source, tech) {
        tech.name_ = 'streamrootHLS';

        var playerConfig = tech.playerConfig;
        var _video = tech.el();
        var _hls;

        function _loadHls(url) {
            var hlsjsConfig = playerConfig.hlsjsConfig || {};

            _hls = new Hls(hlsjsConfig);
            _hls.on(Hls.Events.MANIFEST_PARSED, _onMetaData);
            _hls.on(Hls.Events.ERROR, function (event, data) {
                console.error('HLS.js error: ' + data.type + ' - fatal: ' + data.fatal + ' - ' + data.details);
            });

            _hls.loadSource(url);
            _hls.attachMedia(_video);
        }

        function load(source) {
            _loadHls(source.src);
        }

        function switchQuality(qualityId, trackType) {
            _hls.nextLevel = qualityId;
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

                tech.playerConfig = this.options;

                return new StreamrootProviderHLS(source, tech);
            },

            options: videojs.options

        }, 0);

    } else {
        console.error("Hls.js is not supported in this browser!");
    }

    videojs.StreamrootProviderHLS = StreamrootProviderHLS;
};

attachVideojsStreamrootProvider(window, window.videojs);
