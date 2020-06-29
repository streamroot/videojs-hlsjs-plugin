# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [1.0.15] - 2020-06-29
### Fixed
- Supports `videojs-hls-quality-selector` plugin.

## [1.0.14] - 2020-06-08
### Changed
- Update `hls.js` to `0.13.2`.

## [1.0.13] - 2019-07-26
### Added
- Emulation of `videojs-contrib-hls` emitting `loadedmetadata` after loading first segment for plugin compatability.

## [1.0.12] - 2019-05-10
### Fixed
- Export as regular web library to avoid compatability problem with `require.js`.

## [1.0.11] - 2019-04-24
### Changed
- Bump bunded `hls.js` version to `0.12.4`.

### Fixed
- Missing module exports after `webpack` update.

## [1.0.10] - 2019-02-26
### Fixed
- Plugin-style configuration not applied when plugin is activated before `tech` is attached.

## [1.0.9] - 2019-02-19
### Added
- Capability to override Hls.js `caption` position.

## [1.0.8] - 2019-01-24
### Fixed
- `TextTracks` added after video starts playing is not updated properly.

## [1.0.7] - 2019-01-17
### Changed
- Move text track bridge initialization to `playing` where all `TextTrack` are populated to media element by `Hls.js`.

### Fixed
- Missing `captions` track on switcher because `hls.subtitleTracks` does not contain them.
- Same-label same-language `caption` and `subtitle` track get switched together.

## [1.0.6] - 2019-01-08
### Changed
- Bump bunded `hls.js` version to `0.12.2`.

## [1.0.5] - 2018-10-31
### Fixed
- Subtitle and audio picker not showing up on some streams.

## [1.0.4] - 2018-09-17
### Added
- Support for `videojs-contrib-quality-levels` plugin.

## [1.0.3] - 2018-09-12
### Fixed
- Seeking issues with Brightcove's DVRUX plugin.

## [1.0.2] - 2018-09-06
### Changed
- Synchronize tooling with other plugins.

## [1.0.1] - 2018-08-24
### Fixed
- Alternative MIME-type `application/vnd.apple.mpegurl` for HLS manifest not matched.

## [1.0.0] - 2018-08-14
### CI
- Deploy with new depenencies and version number.

## [0.4.0] - 2018-08-14
### Changed
- Replace CI v1 script with new CI v2 toolkit.

## [0.3.4] - 2018-06-07
### Added
- Handle multiple audio switching.

### Changed
- Delay emitting `loadedqualitydata` until the video starts playing.

### Fixed
- Subtitles working but is impossible to turn off or switching.
- Video quality data is reported before handlers is registered in `videojs-quality-picker`.

## [0.3.3] - 2018-05-29
### Added
- Allow Hls.js config to be passed through VideoJS plugin config. (For Brightcove where we don't pass options directly)

## [0.3.2] - 2018-04-19
### Added
- Pre-built script link.

## [0.3.1] - 2018-04-05
### Fixed
- Video.js >=5.0.0 < 5.3.0 compatibility (missing `getTech` method).

## [0.3.0] - 2018-04-04
### Added
- ESLint
- CircleCI build file to automatize build deployment to CDN and NPM.
- Hls.js pre init hook.

### Changed
- `uglify-js` version bumped to `2.6.0` to fix security vulnerability.
- Freezed versions of most `devDependencies` to avoid potential CI issues.

## [0.2.1] - 2018-03-07
### Fixed
- Infinite recursion loop in provider `dispose`.

## [0.2.0] - 2018-03-06
### Changed
- Use `Webpack` as build tool.
- Update provider codes.

### Removed
- Bundled `videojs-quality-picker`.

## [0.1.2] - 2017-06-27
### Changed
- `console.error` replaced by `console.warn` for logging lack of hls.js support.

## [0.1.0] - 2017-04-10
### Changed
- Depend on hls.js v0.6.21

## [0.0.8] - 2016-08-11
### Changed
- Dumping full dependencies tree to package.lock

### Fixed
- Starting loading before play (now loads when media element requests data)

## [0.0.7] - 2016-08-11
### Fixed
- Fix ci tools

## [0.0.6] - 2016-08-11
### Changed
- Distribute preprod build in a specific no p2p bucket

[0.1.2]: https://github.com/streamroot/videojs5-hlsjs-source-handler/compare/v0.1.0...v0.1.2
[0.1.3]: https://github.com/streamroot/videojs5-hlsjs-source-handler/compare/v0.1.2...v0.1.3
[0.3.0]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.2.1...v0.3.0
[0.3.1]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.3.0...v0.3.1
[0.3.2]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.3.1...v0.3.2
[0.3.3]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.3.2...v0.3.3
[0.3.4]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.3.3...v0.3.4
[0.4.0]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.3.4...v0.4.0
[1.0.0]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v0.4.0...v1.0.0
[1.0.1]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.0...v1.0.1
[1.0.2]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.1...v1.0.2
[1.0.3]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.2...v1.0.3
[1.0.4]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.3...v1.0.4
[1.0.5]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.4...v1.0.5
[1.0.6]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.5...v1.0.6
[1.0.7]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.6...v1.0.7
[1.0.8]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.7...v1.0.8
[1.0.9]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.8...v1.0.9
[1.0.10]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.9...v1.0.10
[1.0.11]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.10...v1.0.11
[1.0.12]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.11...v1.0.12
[1.0.13]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.12...v1.0.13
[1.0.14]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.13...v1.0.14
[1.0.15]: https://github.com/streamroot/videojs-hlsjs-plugin/compare/v1.0.14...v1.0.15
