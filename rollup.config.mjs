import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import nodeResolve from '@rollup/plugin-node-resolve';
import polyfillNode from 'rollup-plugin-polyfill-node';

/** @type {import('rollup').RollupOptions} */
export default {
	input: 'src/index.mts',
	output: {
		file: 'dist/index.js',
		format: 'cjs',
	},
	plugins: [
		typescript(),
		commonjs(),
		nodeResolve(),
		alias({
			entries: [{find: /^node:(.*)/, replacement: '$1'}],
		}),
		polyfillNode(),
	],
};
