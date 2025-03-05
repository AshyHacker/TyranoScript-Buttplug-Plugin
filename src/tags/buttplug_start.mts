import originalLog from '../log.mjs';
import buttplug from '../buttplug.mjs';
import {
	defineTag,
	getMatchingFeatures,
	invalidParameterError,
	assert,
} from '../utils.mjs';
import {
	LinearCmd,
	RotateCmd,
	RotateSubcommand,
	ScalarCmd,
	ScalarSubcommand,
	VectorSubcommand,
} from 'buttplug';

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
				const matchingFeatures = getMatchingFeatures(
					buttplug.devices,
					params.devices,
				);
				log('matchingFeatures:', matchingFeatures);

				for (const [device, messageType, commandIndexes] of matchingFeatures) {
					log('starting device:', device);

					switch (messageType) {
						case 'rotate': {
							const message = new RotateCmd(
								commandIndexes.map(
									(index) => new RotateSubcommand(index, speed, clockwise),
								),
								device.index,
							);
							log('sending message:', message);
							device.send(message);
							break;
						}
						case 'linear': {
							const message = new LinearCmd(
								commandIndexes.map(
									(index) => new VectorSubcommand(index, position, duration),
								),
								device.index,
							);
							log('sending message:', message);
							device.send(message);
							break;
						}
						case 'scalar': {
							const message = new ScalarCmd(
								commandIndexes.map((index) => {
									const actuatorType = device.messageAttributes.ScalarCmd?.find(
										(attribute) => attribute.Index === index,
									)?.ActuatorType;
									assert(actuatorType !== undefined);
									return new ScalarSubcommand(index, value, actuatorType);
								}),
								device.index,
							);
							log('sending message:', message);
							device.send(message);
							break;
						}
						default: {
							log('unknown messageType:', messageType);
							break;
						}
					}
				}
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
