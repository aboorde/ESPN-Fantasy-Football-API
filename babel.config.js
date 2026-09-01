module.exports = {
  presets: ['@babel/preset-env'],

  // BaseObject exposes `responseMap` as a static getter/setter pair whose setter merges into
  // `_responseMap`, and every model subclass declares `static responseMap = {...}` expecting that
  // setter to run. Native class fields use [[Define]] semantics, which shadow the inherited
  // accessor instead of invoking it, so the merge never happens and every mapped property comes
  // back undefined. Forcing the transform keeps the [[Set]] semantics the class hierarchy is
  // built on, independent of what the browserslist targets support natively.
  plugins: ['@babel/plugin-transform-class-properties'],
  assumptions: {
    setPublicClassFields: true
  },

  env: {
    test: {
      plugins: ['@babel/plugin-transform-runtime']
    }
  }
};
