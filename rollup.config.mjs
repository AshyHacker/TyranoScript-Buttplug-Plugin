import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').RollupOptions} */
export default {
	input: 'src/index.mts',
	output: {
		file: 'dist/index.mjs',
		format: 'esm',
	},
	plugins: [
		typescript(),
	],
};