import 'tyrano_voicevox_plugin/src/types/tyranoscript.d.ts';
import type JQueryStatic from '@types/jquery';

declare global {
	const $: JQueryStatic;
	const TYRANO: typeof window.TYRANO;
}
