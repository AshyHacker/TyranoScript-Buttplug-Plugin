import 'tyrano_voicevox_plugin/src/types/tyranoscript.d.ts';
import type JQueryStatic from '@types/jquery';

declare global {
	interface Window {
		$: JQueryStatic & {
			loadText(filePath: string, callback: (text: string) => void): void;
		};
	}
	var TYRANO: typeof window.TYRANO;
	var $: string;
}
