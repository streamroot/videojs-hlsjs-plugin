import Hls from "hls.js";

var attachVideojsStreamrootProvider = function (window, videojs) {
    function StreamrootProviderHLS (source, tech) {
        tech.name_ = 'streamrootHLS';

        var playerConfig = tech.playerConfig;

        function onTechEvent(event) {
            console.log("onTechEvent(): event=", event);
        }

        tech.on('loadstart', onTechEvent);
        tech.on('suspend', onTechEvent);
        tech.on('abort', onTechEvent);
        tech.on('error', onTechEvent);
        tech.on('emptied', onTechEvent);
        tech.on('stalled', onTechEvent);
        tech.on('loadedmetadata', onTechEvent);
        tech.on('loadeddata', onTechEvent);
        tech.on('canplay', onTechEvent);
        tech.on('playing', onTechEvent);
        tech.on('waiting', onTechEvent);
        tech.on('canplay', onTechEvent);

        var _video = tech.el();
        var _hls;

        function _loadHls(url) {
            if (_hls === undefined || _hls.url !== url) {

                if(_hls) {
                    _hls.destroy();
                }

                var hlsjsConfig = playerConfig.hlsjsConfig || {};

                console.log("hlsjsConfig=", hlsjsConfig);
                _hls = new Hls(hlsjsConfig);
                _hls.on(Hls.Events.MANIFEST_PARSED, _onMetaData);

                _hls.on(Hls.Events.ERROR, function (event, data) {
                    console.error('HLS.js error: ' + data.type + ' - fatal: ' + data.fatal + ' - ' + data.details);
                });

                function onLevelLoaded (event, data) {
                    console.log("onLevelLoaded(): event=", event, "data=", data);
                }

                _hls.on(Hls.Events.LEVEL_LOADED, onLevelLoaded);

                _hls.loadSource(url);
                _hls.attachMedia(_video);
            } else {
                //TODO: seek to 0 ?
            }
        }

        function load(source) {
            var url = source.src;

            if (Hls !== undefined) {
                _loadHls(source.src);
            } else {
                console.error("Hls is not defined. Import Hls.js library");
            }
        }

        function switchQuality(qualityId, trackType) {
            console.log("switchQuality(): qualityId=", qualityId);

            _hls.nextLevel = qualityId;
        }

        function _onMetaData(event, data) {
            console.log("_onMetaData(): data=", data, tech);

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

    // Only add the SourceHandler if the browser supports MediaSourceExtensions
    if (!!window.MediaSource) {
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

                // TODO: investigate why this func in called 3 times
                console.log("canHandleSource(): source=", source, "result=", result);

                return result;
            },

            handleSource: function (source, tech) {

                tech.playerConfig = this.options;

                return new StreamrootProviderHLS(source, tech);
            },

            options: videojs.options

        }, 0);

    } else {
        console.log("ERROR: MediaSourceExtensions are not supported in this browser!");
    }

    videojs.StreamrootProviderHLS = StreamrootProviderHLS;
};

attachVideojsStreamrootProvider(window, window.videojs);
