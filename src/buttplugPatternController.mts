import type {ButtplugClientDevice} from 'buttplug';
import type {PatternData} from './csvParser.mjs';
import log from './log.mjs';
import {
	assert,
	binarySearch,
	getMatchingFeatures,
	MessageType,
	MultiKeyMap,
} from './utils.mjs';
import buttplug from './buttplugManager.mjs';
import {chunk} from 'lodash-es';

interface PatternDataConfiguration {
	patternData: PatternData;
	startTime: number;
	loop: boolean;
}

interface RotateDeviceStatus {
	type: MessageType.Rotate;
	clockwise: boolean;
	speed: number;
}

interface LinearDeviceStatus {
	type: MessageType.Linear;
	position: number;
	speed: number;
}

interface ScalarDeviceStatus {
	type: MessageType.Scalar;
	value: number;
}

type DeviceStatus =
	| RotateDeviceStatus
	| LinearDeviceStatus
	| ScalarDeviceStatus;

const getDefaultDeviceStatus = (messageType: MessageType): DeviceStatus => {
	if (messageType === MessageType.Rotate) {
		return {clockwise: true, speed: 0, type: MessageType.Rotate};
	}
	if (messageType === MessageType.Linear) {
		return {position: 0, speed: 0, type: MessageType.Linear};
	}
	if (messageType === MessageType.Scalar) {
		return {value: 0, type: MessageType.Scalar};
	}
	throw new Error(`Unknown message type: ${messageType}`);
};

const isDeviceStatusEqual = (a: DeviceStatus, b: DeviceStatus): boolean => {
	if (a.type !== b.type) {
		return false;
	}
	if (a.type === MessageType.Rotate && b.type === MessageType.Rotate) {
		return a.clockwise === b.clockwise && a.speed === b.speed;
	}
	if (a.type === MessageType.Linear && b.type === MessageType.Linear) {
		return a.position === b.position && a.speed === b.speed;
	}
	if (a.type === MessageType.Scalar && b.type === MessageType.Scalar) {
		return a.value === b.value;
	}
	throw new Error(`Unknown message type: ${a.type}`);
};

const parseValues = (
	values: number[],
	messageType: MessageType,
	frameIndex: number,
): DeviceStatus[] => {
	const result: DeviceStatus[] = [];

	if (messageType === MessageType.Rotate) {
		for (const valueChunk of chunk(values, 2)) {
			if (valueChunk.length !== 2) {
				log(`Insufficient values for rotate at frame ${frameIndex}`, values);
				continue;
			}
			const [clockwise, speed] = valueChunk;
			result.push({
				clockwise: clockwise === 0,
				speed: speed / 100,
				type: MessageType.Rotate,
			});
		}
	} else if (messageType === MessageType.Linear) {
		for (const valueChunk of chunk(values, 2)) {
			if (valueChunk.length !== 2) {
				log(`Insufficient values for linear at frame ${frameIndex}`, values);
				continue;
			}
			const [position, speed] = valueChunk;
			result.push({position: position / 200, speed, type: MessageType.Linear});
		}
	} else if (messageType === MessageType.Scalar) {
		for (const value of values) {
			result.push({value: value / 100, type: MessageType.Scalar});
		}
	} else {
		throw new Error(`Unknown message type: ${messageType}`);
	}

	return result;
};

class ButtplugPatternController {
	// singleton
	static #instance: ButtplugPatternController | null = null;
	static get instance() {
		if (ButtplugPatternController.#instance === null) {
			ButtplugPatternController.#instance = new ButtplugPatternController();
		}
		return ButtplugPatternController.#instance;
	}

	#patternDataConfigurations: MultiKeyMap<
		[ButtplugClientDevice, MessageType, number],
		PatternDataConfiguration
	> = new MultiKeyMap();

	#deviceStatuses: MultiKeyMap<
		[ButtplugClientDevice, MessageType, number],
		DeviceStatus
	> = new MultiKeyMap();

	constructor() {
		this.log('initialized');
		setInterval(() => {
			this.onTick();
		}, 10);
	}

	// biome-ignore lint/suspicious/noExplicitAny: data
	private log(text: string, data: any = null) {
		log(`ButtplugPatternController: ${text}`, data);
	}

	private onTick() {
		const now = Date.now();

		const messageTypeCountMap = new Map<MessageType, number>();

		for (const [
			[device, messageType, actuatorIndex],
			{patternData, startTime, loop},
		] of this.#patternDataConfigurations.entries()) {
			const currentStatus = this.#deviceStatuses.get([
				device,
				messageType,
				actuatorIndex,
			]);
			assert(currentStatus !== undefined);

			const messageTypeCount = messageTypeCountMap.get(messageType) ?? 0;

			const elapsedTime = (now - startTime) / 1000;
			const time = loop ? elapsedTime % patternData.length : elapsedTime;
			const frameIndex = binarySearch(
				patternData.frames,
				(frame) => frame.timestamp > time,
			);

			let newStatus = getDefaultDeviceStatus(messageType);
			if (frameIndex !== 0) {
				const validFrameIndex =
					frameIndex === null ? patternData.frames.length - 1 : frameIndex - 1;
				const frame = patternData.frames[validFrameIndex];
				assert(frame !== undefined);

				const deiceStatuses = parseValues(
					frame.values,
					messageType,
					validFrameIndex,
				);
				newStatus = deiceStatuses[messageTypeCount % deiceStatuses.length];
				assert(newStatus.type === messageType);
			}

			if (!isDeviceStatusEqual(currentStatus, newStatus)) {
				this.log('sending message:', {
					device,
					messageType,
					actuatorIndex,
					newStatus,
				});
				buttplug
					.sendCommand([[device, messageType, [actuatorIndex]]], newStatus)
					.catch((error) => {
						this.log('error:', error);
					});

				this.#deviceStatuses.set(
					[device, messageType, actuatorIndex],
					newStatus,
				);
			}

			messageTypeCountMap.set(messageType, messageTypeCount + 1);
		}
	}

	startPattern(devicesString: string, patternData: PatternData, loop: boolean) {
		const now = Date.now();
		this.log('startPattern:', {devicesString, patternData, loop});

		const matchingFeatures = getMatchingFeatures(
			buttplug.devices,
			devicesString,
		);
		this.log('matchingFeatures:', matchingFeatures);

		for (const [device, messageType, actuatorIndexes] of matchingFeatures) {
			for (const actuatorIndex of actuatorIndexes) {
				this.#patternDataConfigurations.set(
					[device, messageType, actuatorIndex],
					{patternData, startTime: now, loop},
				);

				if (!this.#deviceStatuses.has([device, messageType, actuatorIndex])) {
					this.#deviceStatuses.set(
						[device, messageType, actuatorIndex],
						getDefaultDeviceStatus(messageType),
					);
				}
			}
		}
	}

	stopPattern(devicesString: string) {
		this.log('stopPattern:', devicesString);

		const matchingFeatures = getMatchingFeatures(
			buttplug.devices,
			devicesString,
		);
		this.log('matchingFeatures:', matchingFeatures);

		for (const [device, messageType, actuatorIndexes] of matchingFeatures) {
			for (const actuatorIndex of actuatorIndexes) {
				this.#patternDataConfigurations.delete([
					device,
					messageType,
					actuatorIndex,
				]);
			}
		}
	}
}

export default ButtplugPatternController.instance;
