import {
	ButtplugClient,
	ButtplugBrowserWebsocketClientConnector,
	ButtplugLogger,
	ButtplugLogLevel,
	type LogMessage,
	LinearCmd,
	RotateCmd,
	RotateSubcommand,
	ScalarCmd,
	ScalarSubcommand,
	VectorSubcommand,
	type ButtplugClientDevice,
	RequestServerInfo,
	MESSAGE_SPEC_VERSION,
} from 'buttplug';
import log from './log.mjs';
import {getMatchingFeatures, assert, type MessageType} from './utils.mjs';
import type {ButtplugWasmClientConnector} from 'buttplug-wasm/dist';

export interface MotionCommand {
	speed?: number;
	clockwise?: boolean;
	position?: number;
	duration?: number;
	value?: number;
}

class ButtplugManager {
	#client: ButtplugClient;
	mode: 'websocket' | 'webBluetooth' = 'websocket';
	websocketServerName: string | null = null;
	#websocketConnector: ButtplugBrowserWebsocketClientConnector;
	#webBluetoothConnector: ButtplugWasmClientConnector | null = null;

	// singleton
	static #instance: ButtplugManager | null = null;
	static get instance() {
		if (ButtplugManager.#instance === null) {
			ButtplugManager.#instance = new ButtplugManager();
		}
		return ButtplugManager.#instance;
	}

	constructor() {
		this.log('initializing...');

		this.#client = new ButtplugClient('TyranoScript-Buttplug-Plugin');
		this.#websocketConnector = new ButtplugBrowserWebsocketClientConnector(
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

		ButtplugLogger.Logger.MaximumEventLogLevel = ButtplugLogLevel.Trace;
		ButtplugLogger.Logger.addListener('log', (msg: LogMessage) => {
			const matches: RegExpMatchArray | null = msg.Message.match(
				/^ButtplugClient: Connected to Server (.*)/,
			);
			if (matches) {
				this.websocketServerName = matches[1];
			}

			log(msg.Message, msg);
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

	async sendCommandWithDevicesString(
		devicesString: string,
		command: MotionCommand,
	) {
		const matchingFeatures = getMatchingFeatures(
			this.#client.devices,
			devicesString,
		);
		this.log('matchingFeatures:', matchingFeatures);

		await this.sendCommand(matchingFeatures, command);
	}

	async sendCommand(
		devices: [ButtplugClientDevice, MessageType, number[]][],
		command: MotionCommand,
	) {
		const speed = command.speed ?? 0;
		const clockwise = command.clockwise ?? true;
		const position = command.position ?? 0;
		const duration = command.duration ?? 0;
		const value = command.value ?? 0;

		for (const [device, messageType, commandIndexes] of devices) {
			this.log('starting device:', device);

			switch (messageType) {
				case 'rotate': {
					const message = new RotateCmd(
						commandIndexes.map(
							(index) => new RotateSubcommand(index, speed, clockwise),
						),
						device.index,
					);
					this.log('sending message:', message);
					await device.send(message);
					break;
				}
				case 'linear': {
					const message = new LinearCmd(
						commandIndexes.map(
							(index) => new VectorSubcommand(index, position, duration),
						),
						device.index,
					);
					this.log('sending message:', message);
					await device.send(message);
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
					this.log('sending message:', message);
					await device.send(message);
					break;
				}
				default: {
					this.log('unknown messageType:', messageType);
					break;
				}
			}
		}
	}

	async switchToWebBluetooth() {
		if (this.mode !== 'webBluetooth') {
			this.mode = 'webBluetooth';
			const {ButtplugWasmClientConnector: ButtplugWasmClientConnectorImpl} =
				await import(
					// @ts-expect-error: no types
					'buttplug-wasm/dist/buttplug-wasm.mjs'
				);

			ButtplugWasmClientConnectorImpl.activateLogging();

			this.log('switching to WebBluetooth');
			if (this.#client.connected) {
				this.log('disconnecting from Buttplug server...');
				await this.#client.disconnect();
			}
			this.#webBluetoothConnector = new ButtplugWasmClientConnectorImpl();
			this.log('connecting to WebBluetooth...');
			assert(this.#webBluetoothConnector !== null);
			await this.#client.connect(this.#webBluetoothConnector);
			this.log('connected to WebBluetooth');
		}
		this.log('scanning for devices...');
		await this.#client.startScanning();
		this.log('scanning started');
	}

	// biome-ignore lint/suspicious/noExplicitAny: data
	private log(text: string, data: any = null) {
		log(`ButtplugManager: ${text}`, data);
	}

	private async onDisconnected() {
		this.log('disconnected from Buttplug server');
		await this.startConnectionLoop();
	}

	private async startConnectionLoop() {
		while (true) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			if (this.mode !== 'websocket') {
				this.log('not in WebBluetooth mode. Quitting connection loop.');
				break;
			}
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
		await this.#client.connect(this.#websocketConnector);

		this.log('connected to Buttplug server');
		this.#client.emit('connect');
		this.#client.startScanning();
	}
}

export default ButtplugManager.instance;
