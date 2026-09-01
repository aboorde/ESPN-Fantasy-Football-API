const common = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  // Reads the `browserslist` field in package.json, so webpack's emitted runtime targets exactly
  // the environments Babel already compiles for rather than webpack's own separate defaults.
  target: 'browserslist'
};

const output = {
  // NOTE: this is the repository root, because the bundles are committed so consumers can install
  // straight from git. Never enable webpack's `clean` option here: it deletes every file in the
  // output directory that the build does not emit, which here means the whole repository.
  path: __dirname,
  library: { name: 'espn-fantasy-football-api', type: 'umd' },
  // Binds the UMD wrapper to `this` instead of `self`, which is what lets a single bundle load
  // under both Node and a browser. With webpack's default a web-targeted build throws
  // `ReferenceError: self is not defined` the moment Node requires it.
  globalObject: 'this'
};

// One universal bundle serves both environments. The `node` filenames are historical -- they are
// kept so existing `espn-fantasy-football-api/node.js` imports keep resolving.
module.exports = [
  {
    ...common,
    mode: 'production',
    devtool: 'source-map',
    output: { ...output, filename: 'node.js' }
  },
  {
    ...common,
    mode: 'development',
    // The dev bundle is unminified, so a source map would only map readable code onto readable
    // code. The production bundle is the one worth mapping.
    devtool: false,
    output: { ...output, filename: 'node-dev.js' }
  }
];
