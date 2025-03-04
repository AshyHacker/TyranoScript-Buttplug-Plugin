import log from './log.mjs';
import buttplugClient from './buttplug.mjs';

type ValueOf<T> = T[keyof T];
type Tag = ValueOf<typeof window.TYRANO.kag.ftag.master_tag>;

const defineTag = (name: string, tag: Tag) => {
	if (Object.hasOwn(window.TYRANO.kag.ftag.master_tag, name)) {
		log('tag already defined:', name);
		return;
	}

	log('defining tag:', name);
	window.TYRANO.kag.ftag.master_tag[name] = tag;
};

defineTag('buttplug_start', {
	async start(pm: Record<string, string>) {
		try {
			log('buttplug tag start:', pm);
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
			window.TYRANO.kag.ftag.nextOrder();
		}
	},
	vital: [],
	pm: {},
});
