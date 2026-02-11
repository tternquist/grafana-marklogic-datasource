import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

export default {
  input: 'src/module.ts',
  output: {
    file: 'dist/module.js',
    format: 'amd',
    amd: { id: 'grafana-marklogic-datasource' },
  },
  external: [
    'react',
    'react-dom',
    '@grafana/data',
    '@grafana/ui',
    '@grafana/runtime',
  ],
  plugins: [
    peerDepsExternal(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    copy({
      targets: [
        { src: 'plugin.json', dest: 'dist' },
        { src: 'img/*', dest: 'dist/img' },
      ],
    }),
  ],
};
