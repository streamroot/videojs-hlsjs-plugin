const path = require('path');
const webpack = require('webpack');

const { version } = require('./package.json');

const sourcePath = path.resolve(__dirname, 'lib/');
const distPath = path.resolve(__dirname, 'dist/');

module.exports = env => {
  let nodeEnv = 'production';

  if (env && env.development) {
      nodeEnv = 'development';
  } else if (env && env.staging) {
      nodeEnv = 'staging';
  } else if (env && env.features) {
      nodeEnv = 'features';
  }

  const isDev = nodeEnv === 'development';
  const isDebug = env && env.debug;

  const plugins = [
      new webpack.DefinePlugin({
          _VERSION_: JSON.stringify(version),
          _DEBUG_: isDebug,
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
              drop_console: !isDebug,
          },
          mangle: true,
          output: {
              comments: false,
          },
      })
    );
  }

  return {
    entry: path.resolve(sourcePath, 'main.js'),
    output: {
      path: distPath,
      filename: 'videojs-hlsjs-plugin.js'
    },
    module: {
      rules
    },

    plugins,

    performance: !isDev && {
      hints: 'warning'
    },

    stats: {
      colors: {
        green: '\u001b[32m'
      }
    },

    devServer: {
      contentBase: __dirname,
      historyApiFallback: true,
      port: '8080',
      compress: false,
      inline: true,
      publicPath: '/dist/',
      stats: {
        assets: true,
        children: true,
        chunks: false,
        hash: false,
        modules: false,
        timings: true,
        version: false,
        warnings: true,
        colors: {
          green: '\u001b[32m'
        }
      }
    }
  };
};
