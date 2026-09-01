// Babel exists here for exactly one reason: Jest cannot load `src/`'s ESM syntax directly, so
// babel-jest rewrites `import`/`export` to CommonJS for the test run.
//
// It plays no part in the build. webpack's `browserslist` target resolves to Chrome 109 and newer,
// which supports every syntax this package uses -- static class fields, optional chaining, nullish
// coalescing -- so `@babel/preset-env` transformed nothing, and dropping babel-loader left the
// bundles byte-for-byte identical. Adding a preset back here would silently reintroduce that.
module.exports = {
  plugins: ['@babel/plugin-transform-modules-commonjs']
};
