import {ButtplugClientDevice} from 'buttplug';
import buttplug from '../buttplug.mjs';
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
			[
				'<div class="buttplug__info">',
				'  <div class="buttplug__info_body">',
				'    <div class="buttplug__info_device_count_statement">',
				'      接続されているButtplugデバイス:',
				'      <span class="buttplug__info_device_count">0</span>',
				'    </div>',
				'    <ul class="buttplug__info_devices"></ul>',
				'  </div>',
				'</div>',
			].join(''),
		);
		$info.css({
			left: `${x}px`,
			top: `${y}px`,
			width: `${width}px`,
			height: `${height}px`,
		});

		$layer.append($info);

		const $deviceCount = $info.find('.buttplug__info_device_count');
		const $devices = $info.find('.buttplug__info_devices');
		const deviceMap = new Map<number, JQuery<HTMLElement>>();

		for (const device of buttplug.devices) {
			const $device = $('<li class="buttplug__info_device"></li>');
			$device.text(device.name);
			$devices.append($device);
			deviceMap.set(device.index, $device);
			$deviceCount.text(deviceMap.size);
		}

		buttplug.on('deviceadded', (device: ButtplugClientDevice) => {
			const $device = $('<li class="buttplug__info_device"></li>');
			$device.text(device.name);
			$devices.append($device);
			deviceMap.set(device.index, $device);
			$deviceCount.text(deviceMap.size);
		});

		buttplug.on('deviceremoved', (device: ButtplugClientDevice) => {
			const $device = deviceMap.get(device.index);
			if ($device !== undefined) {
				$device.remove();
				deviceMap.delete(device.index);
				$deviceCount.text(deviceMap.size);
			}
		});

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
