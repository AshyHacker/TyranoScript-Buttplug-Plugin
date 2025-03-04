import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';
import log from './log.mjs';

class ButtplugManager {
	#client: ButtplugClient;

	constructor() {
		log('buttplug plugin loading...');

		this.#client = new ButtplugClient('TyranoScript-Buttplug-Plugin');
		const connector = new ButtplugBrowserWebsocketClientConnector(
			'ws://127.0.0.1:12345/buttplug',
		);

		this.#client.addListener('deviceadded', (device) => {
			log('Device added:', device);
		});

		this.#client.addListener('deviceremoved', (device) => {
			log('Device removed:', device);
		});

		this.#client.connect(connector).then(() => {
			log('Connected to Buttplug server');
		});
	}

	get devices() {
		return this.#client.devices;
	}
}

const buttplug = new ButtplugManager();

export default buttplug;
