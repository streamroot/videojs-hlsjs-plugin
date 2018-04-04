# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Dev]
### Added
- ESLint
- CircleCI build file to automatize build deployment to CDN and NPM.
- Hls.js pre init hook.

### Changed
- `uglify-js` version bumped to `2.6.0` to fix security vulnerability.
- Freezed versions of most `devDependencies` to avoid potential CI issues.

## [Unreleased]

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
