import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';
import log from './log.mjs';

class ButtplugManager {
	#client: ButtplugClient;
	#connector: ButtplugBrowserWebsocketClientConnector;

	constructor() {
		log('buttplug plugin loading...');

		this.#client = new ButtplugClient('TyranoScript-Buttplug-Plugin');
		this.#connector = new ButtplugBrowserWebsocketClientConnector(
			'ws://127.0.0.1:12345/buttplug',
		);

		this.#client.addListener('deviceadded', (device) => {
			log('Device added:', device);
		});

		this.#client.addListener('deviceremoved', (device) => {
			log('Device removed:', device);
		});

		this.#client.addListener('disconnect', () => {
			this.onDisconnected();
		});

		this.connect();
	}

	get connected() {
		return this.#client.connected;
	}

	get devices() {
		return this.#client.devices;
	}

	async onDisconnected() {
		log('ButtplugManager: disconnected');

		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			log('ButtplugManager: trying to reconnect...');

			try {
				await this.connect();
				break;
			} catch (error) {
				log('ButtplugManager: connection error:', error);
			}
		}
	}

	// biome-ignore lint/suspicious/noExplicitAny: event emitter
	on(eventName: string, listener: (...args: any[]) => void) {
		this.#client.addListener(eventName, listener);
	}

	async connect() {
		await this.#client.connect(this.#connector);

		log('ButtplugManager: connected');
		this.#client.emit('connect');
		await this.#client.startScanning();
	}

	startScanning() {
		return this.#client.startScanning();
	}
}

const buttplug = new ButtplugManager();

export default buttplug;
