module.exports = function(grunt) {
    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask('default', ['browserify']);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            main: {
                src: 'lib/vjs-hls.js',
                dest: 'debug/vjs-hls.js',
                options:  {
                  transform: ['babelify'],
                  browserifyOptions: {
                      debug: true
                  },
                  watch: true,
                  keepAlive: true
               }
            }
        }
    });
}
