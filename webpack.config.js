const path = require('path');
const webpack = require('webpack');

const { version } = require('./package.json');

const sourcePath = path.resolve(__dirname, 'lib/');
const distPath = path.resolve(__dirname, 'dist/');

module.exports = (env) => {
    let nodeEnv = 'production';

    if (env && env.development) {
        nodeEnv = 'development';
    } else if (env && env.staging) {
        nodeEnv = 'staging';
    } else if (env && env.features) {
        nodeEnv = 'features';
    }

    const isDev = nodeEnv === 'development';

    const plugins = [
        new webpack.DefinePlugin({
            _VERSION_: JSON.stringify(version),
        }),
    ];

    if (!isDev) {
        plugins.push(
            new webpack.LoaderOptionsPlugin({
                minimize: true,
                debug: false,
            }),
            new webpack.optimize.UglifyJsPlugin({
                compress: {
                    warnings: false,
                    screw_ie8: true,
                    conditionals: true,
                    unused: true,
                    comparisons: true,
                    sequences: true,
                    dead_code: true,
                    evaluate: true,
                    if_return: true,
                    join_vars: true,
                    pure_funcs: ['console.log', 'console.info', 'console.warn'],
                },
                mangle: true,
                output: {
                    comments: false,
                },
            })
        );
    }

    return {
        devtool: isDev && 'inline-source-map',
        entry: path.resolve(sourcePath, 'main.js'),
        target: 'web',
        output: {
            path: distPath,
            filename: 'videojs-hlsjs-source-handler.js',
            publicPath: '/dist',
            libraryTarget: 'umd',
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: [
                    /node_modules/,
                ],
                use: ['babel-loader'],
            }],
        },

        plugins,

        performance: !isDev && {
            hints: 'warning',
        },

        stats: {
            colors: {
                green: '\u001b[32m',
            },
        },
    };
};
