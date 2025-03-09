import originalLog from '../log.mjs';
import buttplug from '../buttplugManager.mjs';
import buttplugPatternController from '../buttplugPatternController.mjs';
import {defineTag} from '../utils.mjs';

// biome-ignore lint/suspicious/noExplicitAny: Arbitrary data is expected here
const log = (msg: string, data: any = null) => {
	originalLog(`buttplug_stop: ${msg}`, data);
};

defineTag('buttplug_stop', {
	async start(pm: Record<string, string>) {
		try {
			log('tag start:', pm);

			const params = Object.assign(
				{
					devices: '',
					groups: '',
				},
				pm,
			);

			if (params.devices !== '') {
				buttplugPatternController.stopPattern(params.devices);
				if (buttplug.mode === 'webBluetooth') {
					log('waiting for 2 seconds...');
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}
				buttplug.sendCommandWithDevicesString(params.devices, {
					speed: 0,
					clockwise: true,
					position: 0,
					duration: 0,
					value: 0,
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
