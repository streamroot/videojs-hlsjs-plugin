module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['browserify', 'watch']);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            main: {
                src: 'lib/videojs.hls.js',
                dest: 'debug/videojs.hls.js'
            }
        },
        watch: {
            files: 'lib/videojs.hls.js',
            tasks: ['default']
        }
    });
}
