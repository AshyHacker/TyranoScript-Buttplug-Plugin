import type {ButtplugClientDevice} from 'buttplug';
import buttplug from '../buttplugManager.mjs';
import log from '../log.mjs';
import {defineTag, invalidParameterError} from '../utils.mjs';
import type JQuery from 'jquery';

defineTag('buttplug_info', {
	start(pm: Record<string, string>) {
		const params = Object.assign(
			{
				layer: 'message0',
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

		$layer.css({
			'z-index': 1000000,
			'pointer-events': 'none',
		});

		const $info = $(
			[
				'<div class="buttplug__info event-setting-element">',
				'  <div class="buttplug__info_body">',
				'    <div class="buttplug__info_status">',
				'      接続状態: <span class="buttplug__info_status_text"></span><br>',
				'      接続先: <span class="buttplug__info_status_destination"></span>',
				'    </div>',
				'    <div class="buttplug__info_websocket_address">',
				'      <span class="buttplug__info_websocket_address_label">Buttplugサーバーアドレス:</span>',
				'      <input type="text" class="buttplug__info_websocket_address_input" value="ws://127.0.0.1:12345/buttplug">',
				'    </div>',
				'    <div class="buttplug__info_controls">',
				'      <button class="buttplug__info_websocket_button">WebSocket で接続</button>',
				'      <button class="buttplug__info_web_bluetooth_button">Web Bluetooth で接続 (非推奨)</button>',
				'    </div>',
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
			'margin-left': `${x}px`,
			'margin-top': `${y}px`,
			width: `${width}px`,
			height: `${height}px`,
		});

		$layer.append($info);

		const $websocketAddressInput = $info.find(
			'.buttplug__info_websocket_address_input',
		);
		const $status = $info.find('.buttplug__info_status_text');
		const $statusDestination = $info.find('.buttplug__info_status_destination');
		const $websocketButton = $info.find('.buttplug__info_websocket_button');
		const $deviceCount = $info.find('.buttplug__info_device_count');
		const $devices = $info.find('.buttplug__info_devices');
		const $webBluetoothButton = $info.find(
			'.buttplug__info_web_bluetooth_button',
		);
		const deviceMap = new Map<number, JQuery<HTMLElement>>();

		const addDeviceToList = (device: ButtplugClientDevice) => {
			const $device = $('<li class="buttplug__info_device"></li>');
			$device.text(device.name);

			const $deviceFeatures = $(
				'<ul class="buttplug__info_device_features"></ul>',
			);
			const featureNames: string[] = [];
			const features = [
				...(device.messageAttributes.ScalarCmd ?? []),
				...(device.messageAttributes.RotateCmd ?? []),
				...(device.messageAttributes.LinearCmd ?? []),
			];
			const actuatorCountMap = new Map<string, number>();
			for (const feature of features) {
				const actuatorCount = actuatorCountMap.get(feature.ActuatorType) ?? 0;
				const featureName = `${feature.ActuatorType.toLowerCase()}${actuatorCount + 1}`;
				featureNames.push(featureName);
				actuatorCountMap.set(feature.ActuatorType, actuatorCount + 1);
			}
			$deviceFeatures.html(`<li>${featureNames.join(', ')}</li>`);
			$device.append($deviceFeatures);

			$devices.append($device);
			deviceMap.set(device.index, $device);
			$deviceCount.text(deviceMap.size);
		};

		if (buttplug.connected) {
			$status.text('接続中');
			$statusDestination.text(
				buttplug.mode === 'webBluetooth'
					? 'Web Bluetooth API'
					: `WebSocket (${buttplug.websocketServerName})`,
			);
		} else {
			$status.text('未接続');
			$status.addClass('buttplug__info_status_text_disconnected');
		}

		buttplug.on('disconnect', () => {
			log('buttplug_info: disconnect');
			$status.text('未接続');
			$status.addClass('buttplug__info_status_text_disconnected');
			$statusDestination.text('');
			$deviceCount.text('0');
			$devices.empty();
			deviceMap.clear();
		});

		buttplug.on('connect', () => {
			log('buttplug_info: connect');
			$status.text('接続中');
			$statusDestination.text(
				buttplug.mode === 'webBluetooth'
					? 'Web Bluetooth API'
					: `WebSocket (${buttplug.websocketServerName})`,
			);
			$status.removeClass('buttplug__info_status_text_disconnected');
		});

		if (buttplug.connected) {
			for (const device of buttplug.devices) {
				log('device:', device);
				addDeviceToList(device);
			}
		}

		buttplug.on('deviceadded', (device: ButtplugClientDevice) => {
			if (deviceMap.has(device.index)) {
				return;
			}
			addDeviceToList(device);
		});

		buttplug.on('deviceremoved', (device: ButtplugClientDevice) => {
			const $device = deviceMap.get(device.index);
			if ($device !== undefined) {
				$device.remove();
				deviceMap.delete(device.index);
				$deviceCount.text(deviceMap.size);
			}
		});

		$webBluetoothButton.on('click', async () => {
			await buttplug.switchToWebBluetooth();
			$status.text('スキャン中⋯');
			$status.removeClass('buttplug__info_status_text_disconnected');
			$statusDestination.text('Web Bluetooth API');
		});

		$websocketButton.on('click', async () => {
			const serverAddress = $websocketAddressInput.val() as string;
			await buttplug.switchToWebSocket(serverAddress);
		});

		try {
			log('buttplug_info: tag start:', pm);
		} catch (error) {
			log('error:', error);
		} finally {
			TYRANO.kag.ftag.nextOrder();
		}
	},
	vital: [],
	pm: {},
});
