import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import builtins from 'rollup-plugin-node-builtins';
import globals from 'rollup-plugin-node-globals';

/** @type {import('rollup').RollupOptions} */
export default {
	input: 'src/index.mts',
	output: {
		file: 'dist/index.js',
		format: 'cjs',
	},
	plugins: [typescript(), commonjs(), nodeResolve(), builtins(), globals()],
};
