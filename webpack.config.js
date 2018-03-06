const webpack = require('webpack');
const { version } = require('./package.json');

const isDev = process.env.NODE_ENV === 'development';

const plugins = [
    new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(`v${version}`)
    })
];

const rules = [{
    exclude: /node_modules/,
    use: 'babel-loader',
    test: /\.js$/
}];

if (!isDev) {
    plugins.push(
        new webpack.optimize.OccurrenceOrderPlugin(true),
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
                drop_console: true,
            },
            mangle: true,
            output: {
                comments: false,
            },
        })
    );
}

module.exports = {
    entry: './lib/main.js',
    output: {
        path: __dirname + '/dist',
        filename: 'videojs5-hlsjs-source-handler.js',
        publicPath: '/dist',
    },
    module: {
        rules
    },
    plugins,
    performance: !isDev && {
        hints: 'warning',
    },
    stats: {
        colors: {
            green: '\u001b[32m'
        }
    },

    devServer: {
        contentBase: __dirname,
        historyApiFallback: true,
        port: 8080,
        compress: false,
        inline: true,
        stats: {
            assets: true,
            children: true,
            chunks: false,
            hash: false,
            modules: false,
            publicPath: false,
            timings: true,
            version: false,
            warnings: true,
            colors: {
                green: '\u001b[32m'
            }
        }
    }
};
