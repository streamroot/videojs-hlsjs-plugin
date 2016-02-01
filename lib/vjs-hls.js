var Hls = require("./media-engine/hlsjs-bundle");
var VideoEventPolyfill = require("videoEventPolyfill");
var QoSAnalytics = require("streamroot-qos-analytics");

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
        var _qosAnalytics;

        function _loadHls(url) {
            //STREAMROOT
            if (_hls === undefined || _hls.url !== url) {

                if(_hls) {
                    _hls.destroy();
                }

                var p2pConfig = playerConfig.p2pConfig || {};
                var hlsjsConfig = playerConfig.hlsjsConfig || {};

                console.log("p2pConfig=", p2pConfig);
                console.log("hlsjsConfig=", hlsjsConfig);

                _qosAnalytics = new QoSAnalytics(_video, {ID_CLIENT: p2pConfig.streamrootKey, ANALYTICS_SERVER_URL: p2pConfig.analyticsUrl, MPD_URL: url});

                _hls = new Hls(hlsjsConfig, p2pConfig);
                _hls.on(Hls.Events.MANIFEST_PARSED, _onMetaData);

                _hls.on(Hls.Events.ERROR, function (event, data) {
                    console.error('HLS.js error: ' + data.type + ' - fatal: ' + data.fatal + ' - ' + data.details);
                });

                var polyfill = new VideoEventPolyfill(_video);
                polyfill.on(VideoEventPolyfill.Events.WAITING, function () {
                    console.log("onVideoEventPolyfill(): WAITING");
                });
                polyfill.on(VideoEventPolyfill.Events.PLAYING, function () {
                    console.log("onVideoEventPolyfill(): PLAYING");
                });
                polyfill.on(VideoEventPolyfill.Events.ENDED, function () {
                    console.log("onVideoEventPolyfill(): ENDED");
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

        function _onMetaData(event, data) {
            console.log("_onMetaData(): data=", data, tech);
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
