import originalLog from '../log.mjs';
import buttplug from '../buttplug.mjs';
import {defineTag, invalidParameterError} from '../utils.mjs';

// biome-ignore lint/suspicious/noExplicitAny: Arbitrary data is expected here
const log = (msg: string, data: any = null) => {
	originalLog(`buttplug_start: ${msg}`, data);
};

defineTag('buttplug_start', {
	start(pm: Record<string, string>) {
		try {
			log('tag start:', pm);

			const params = Object.assign(
				{
					devices: '',
					groups: '',
					speed: '0',
					direction: '0',
					position: '0',
					duration: '0',
					value: '0',
				},
				pm,
			);

			const position = Number.parseFloat(params.position) / 100;
			if (Number.isNaN(position) || position < 0 || position > 1) {
				invalidParameterError(params, 'position');
				return;
			}

			const duration = Number.parseInt(params.duration);
			if (Number.isNaN(duration) || duration < 0) {
				invalidParameterError(params, 'duration');
				return;
			}

			const value = Number.parseInt(params.value) / 100;
			if (Number.isNaN(value) || value < 0 || value > 1) {
				invalidParameterError(params, 'value');
				return;
			}

			const speed = Number.parseFloat(params.speed);
			if (Number.isNaN(speed) || speed < 0) {
				invalidParameterError(params, 'speed');
				return;
			}

			if (params.direction !== '0' && params.direction !== '1') {
				invalidParameterError(params, 'direction');
				return;
			}
			const clockwise = params.direction === '0';

			if (params.devices !== '') {
				buttplug.sendCommand(params.devices, {
					speed,
					clockwise,
					position,
					duration,
					value,
				});
			}
		} catch (error) {
			log('error:', error);
		} finally {
			TYRANO.kag.ftag.nextOrder();
		}
	},
	vital: [],
	pm: {},
});
