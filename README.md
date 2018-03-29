# video.js HLS Source Handler

Adds HLS playback support to [video.js 5.0+](https://github.com/videojs/video.js) using [hls.js library](https://github.com/video-dev/hls.js/).

## Installation

Clone the repository.
Install the dependcies `npm install`.
Use `npm run build` to build the dist scripts.

## Usage

Include video.js and videojs-hlsjs-source-handler.js in your page:

```html
<head>
    <link href="http://vjs.zencdn.net/5.0/video-js.min.css" rel="stylesheet">
    <script src="http://vjs.zencdn.net/5.0/video.min.js"></script>
    <script src="videojs-hlsjs-source-handler.js"></script>
</head>

<body>
    <video id=example-video width=600 height=300 class="video-js vjs-default-skin" controls>
        <source src="http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8" type="application/x-mpegURL">
    </video>
    <script>
        var player = videojs('example-video');
    </script>
</script>
</body>
</html>
```

There are several ways of getting video.js files, you can read about them [in official documentation](http://videojs.com/getting-started/) and choose the one that match your needs best.

### Passing configuration options to hls.js

Define `hlsjsConfig` property in `html5` field of video.js options object and pass it as second param to videojs constructor. List of available hls.js options [is here](https://github.com/video-dev/hls.js/blob/master/docs/API.md#fine-tuning):

```javascript
<script>
    var options = {
        html5: {
            hlsjsConfig: {
                debug: true
            }
        }
    };
    var player = videojs('example-video', options);
</script>
```

### Initialization Hook

Sometimes you may need to extend hls.js, or have access to the hls.js before playback starts. For these cases, you can register a function to the `beforeinitialize` hook, which will be called right after hls.js instance is created.

Your function should have two parameters:
 1. The video.js Player instance
 2. The hls.js instance

```javascript
var callback = function(videojsPlayer, hlsjs) {
  // do something
};

videojs.Html5Hlsjs.addHook('beforeinitialize', callback);
```

You can remove the hook by:
```javascript
videojs.Html5Hlsjs.removeHook('beforeinitialize', callback);
```

You can add as many `beforeinitialize` hooks as necessary by calling `videojs.Html5Hlsjs.addHook` several times.
