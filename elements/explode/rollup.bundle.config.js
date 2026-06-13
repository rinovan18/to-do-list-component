import nodeResolve from '@rollup/plugin-node-resolve';

// Bundle todo-list + explode-quiz sekaligus agar shared deps (lit, d-d-d, dll) hanya sekali
// Jalankan dari folder elements/explode/:
//   node node_modules/.bin/rollup -c rollup.bundle.config.js
// Lalu copy output ke pen-todo/pen-todo/custom/build/custom.es6.js
export default {
  input: 'rollup.entry.js',
  output: {
    file: '../../pen-todo/pen-todo/custom/build/custom.es6.js',
    format: 'es',
    sourcemap: false,
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve(),
  ],
};
