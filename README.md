# video.js HLS Source Handler

Adds HLS playback support to [video.js 5.0+](https://github.com/videojs/video.js) using [Dailymotion's hls.js library](https://github.com/dailymotion/hls.js).

## Installation

Use Grunt to build vjs-hls.js from the sources.

## Usage

Include video.js and vjs-hls.js in your page:

```html
<head>
    <link href="http://vjs.zencdn.net/5.0/video-js.min.css" rel="stylesheet">
    <script src="http://vjs.zencdn.net/5.0/video.min.js"></script>
    <script src="vjs-hls.js"></script>
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

Define `hlsjsConfig` property in `videojs.options` and assign an object with configuration options to it. List of available options [is here](https://github.com/dailymotion/hls.js/blob/master/API.md#fine-tuning):

```javascript
<script>
    videojs.options.hlsjsConfig = {
        debug: true
    };
    var player = videojs('example-video');
</script>
```
