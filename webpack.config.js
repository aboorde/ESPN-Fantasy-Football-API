const merge = require('lodash/merge');
const path = require('path');

const baseConfig = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      }
    ]
  },
  output: {
    path: __dirname,
    library: 'espn-fantasy-football-api',
    libraryTarget: 'umd'
  },
  target: 'web',
  devtool: 'source-map',
  mode: 'development'
};

module.exports = [
  merge({}, baseConfig, {
    output: {
      filename: 'web.js'
    },
    mode: 'production',
    devtool: undefined,
  }),
  merge({}, baseConfig, {
    output: {
      filename: 'web-dev.js'
    }
  }),
  merge({}, baseConfig, {
    output: {
      filename: 'node.js'
    },
    mode: 'production',
    devtool: undefined,
    target: 'node'
  }),
  merge({}, baseConfig, {
    output: {
      filename: 'node-dev.js'
    },
    target: 'node'
  })
];
