import log from '../log.mjs';
import {defineTag, invalidParameterError} from '../utils.mjs';
import type JQuery from 'jquery';

defineTag('buttplug_info', {
	start(pm: Record<string, string>) {
		const params = Object.assign(
			{
				layer: 'base',
				x: '0',
				y: '0',
				width: '0',
				height: '0',
			},
			pm,
		);

		log('buttplug_info:', params);

		const x = Number.parseInt(params.x);
		if (Number.isNaN(x)) {
			invalidParameterError(params, 'x');
			return;
		}

		const y = Number.parseInt(params.y);
		if (Number.isNaN(y)) {
			invalidParameterError(params, 'y');
			return;
		}

		const width = Number.parseInt(params.width);
		if (Number.isNaN(width)) {
			invalidParameterError(params, 'width');
			return;
		}

		const height = Number.parseInt(params.height);
		if (Number.isNaN(height)) {
			invalidParameterError(params, 'height');
			return;
		}

		const $layer: JQuery<HTMLDivElement> | undefined =
			TYRANO.kag.layer.getLayer(params.layer, 'fore');
		log('layer:', $layer);
		if ($layer === undefined) {
			invalidParameterError(params, 'layer');
			return;
		}

		const $info = $(
			`<div class="buttplug__info" style="left: ${x}px; top: ${y}px; width: ${width}px; height: ${height}px;"></div>`,
		);

		$layer.append($info);

		$info.text('buttplug_info');

		try {
			log('[buttplug_info] tag start:', pm);
		} catch (error) {
			log('error:', error);
		} finally {
			TYRANO.kag.ftag.nextOrder();
		}
	},
	vital: [],
	pm: {},
});
