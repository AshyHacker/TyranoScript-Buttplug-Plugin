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
} from 'buttplug';
import log from './log.mjs';
import {getMatchingFeatures, assert, type MessageType} from './utils.mjs';

export interface MotionCommand {
	speed?: number;
	clockwise?: boolean;
	position?: number;
	duration?: number;
	value?: number;
}

class ButtplugManager {
	#client: ButtplugClient;
	#connector: ButtplugBrowserWebsocketClientConnector;

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

		ButtplugLogger.Logger.MaximumEventLogLevel = ButtplugLogLevel.Trace;
		ButtplugLogger.Logger.addListener('log', (msg: LogMessage) => {
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

	sendCommandWithDevicesString(devicesString: string, command: MotionCommand) {
		const matchingFeatures = getMatchingFeatures(
			this.#client.devices,
			devicesString,
		);
		this.log('matchingFeatures:', matchingFeatures);

		this.sendCommand(matchingFeatures, command);
	}

	sendCommand(
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
					this.log('sending message:', message);
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
					this.log('sending message:', message);
					device.send(message);
					break;
				}
				default: {
					this.log('unknown messageType:', messageType);
					break;
				}
			}
		}
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

		this.log('connected to Buttplug server');
		this.#client.emit('connect');
		this.#client.startScanning();
	}
}

export default ButtplugManager.instance;
