module.exports = {
  presets: ['@babel/preset-env'],
  // Babel 8 removed plugin-level `loose`; `setPublicClassFields` is its replacement and preserves
  // the assignment semantics the static class fields in `src/` were written against.
  assumptions: {
    setPublicClassFields: true
  },
  env: {
    test: {
      plugins: ['@babel/plugin-transform-runtime']
    }
  }
};
