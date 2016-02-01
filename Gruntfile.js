module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');

    grunt.registerTask('default', ['browserify']);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        browserify: {
            main: {
                src: 'lib/vjs-hls.js',
                dest: 'debug/vjs-hls.js'
            }
        },
        watch: {
            files: 'lib/vjs-hls.js',
            tasks: ['browserify']
        }
    });
}
