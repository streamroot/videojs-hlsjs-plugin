var attachVideojsStreamrootProvider = function (window, videojs) {

    function StreamrootProviderHLS (source, tech) {

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

                console.log("canHandleSource(): source=", source, "result=", result);

                return result;
            },

            handleSource: function (source, tech) {
                return new StreamrootProviderHLS(source, tech);
            }

        }, 0);

    } else {
        console.log("ERROR: MediaSourceExtensions are not supported in this browser!");
    }

    videojs.StreamrootProviderHLS = StreamrootProviderHLS;

};

attachVideojsStreamrootProvider(window, window.videojs);
