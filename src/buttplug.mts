import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
} from 'buttplug';
import log from './log.mjs';

class ButtplugManager {
	#client: ButtplugClient;
	#connector: ButtplugBrowserWebsocketClientConnector;

	constructor() {
		this.log('initializing...');

		this.#client = new ButtplugClient('TyranoScript-Buttplug-Plugin');
		this.#connector = new ButtplugBrowserWebsocketClientConnector(
			'ws://127.0.0.1:12345/buttplug',
		);

		this.#client.addListener('deviceadded', (device) => {
			this.log('Device added:', device);
		});

		this.#client.addListener('deviceremoved', (device) => {
			this.log('Device removed:', device);
		});

		this.#client.addListener('disconnect', () => {
			this.onDisconnected();
		});

		this.startConnectionLoop();
	}

	get connected() {
		return this.#client.connected;
	}

	get devices() {
		return this.#client.devices;
	}

	// biome-ignore lint/suspicious/noExplicitAny: event emitter
	on(eventName: string, listener: (...args: any[]) => void) {
		this.#client.addListener(eventName, listener);
	}

	// biome-ignore lint/suspicious/noExplicitAny: data
	private log(text: string, data: any = null) {
		log(`ButtplugManager: ${text}`, data);
	}

	private async onDisconnected() {
		this.log('disconnected');
		await this.startConnectionLoop();
	}

	private async startConnectionLoop() {
		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			this.log('trying to connect...');

			try {
				await this.connect();
				break;
			} catch (error) {
				this.log('connection error:', error);
			}
		}
	}

	private async connect() {
		await this.#client.connect(this.#connector);

		this.log('connected');
		this.#client.emit('connect');
		await this.#client.startScanning();
	}
}

const buttplug = new ButtplugManager();

export default buttplug;
