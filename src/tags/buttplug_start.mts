import log from '../log.mjs';
import buttplugClient from '../buttplug.mjs';
import {defineTag} from '../utils.mjs';

defineTag('buttplug_start', {
	async start(pm: Record<string, string>) {
		try {
			log('[buttplug_start] tag start:', pm);
			for (const device of buttplugClient.devices) {
				const rotateFeatures = device.messageAttributes.RotateCmd ?? [];
				if (rotateFeatures.length === 0) {
					log('Device does not support rotation:', device);
					continue;
				}

				log('Rotating Device:', device);
				await device.rotate(rotateFeatures.map(() => [1, true]));
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await device.rotate(rotateFeatures.map(() => [0, true]));
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
