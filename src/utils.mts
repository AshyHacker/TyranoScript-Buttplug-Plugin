import {
	type ButtplugClientDevice,
	ActuatorType,
	type GenericDeviceMessageAttributes,
} from 'buttplug';
import log from './log.mjs';
import {inspect} from 'node:util';
import {get} from 'jquery';

type ValueOf<T> = T[keyof T];
export type Tag = ValueOf<typeof TYRANO.kag.ftag.master_tag>;

function assert(condition: boolean, message?: string): asserts condition {
	if (!condition) {
		throw new Error(message ?? 'Assertion failed');
	}
}

export {assert};

export const defineTag = (name: string, tag: Tag) => {
	if ({}.hasOwnProperty.call(TYRANO.kag.ftag.master_tag, name)) {
		log('tag already defined:', name);
		return;
	}

	log('defining tag:', name);
	TYRANO.kag.ftag.master_tag[name] = tag;
};

export const invalidParameterError = (
	params: Record<string, string>,
	key: string,
) => {
	TYRANO.kag.error(
		`タグ「${params._tag}」のパラメータ「${key}」が不正です: ${params[key]}`,
		{},
	);
	TYRANO.kag.ftag.nextOrder();
};

// https://github.com/buttplugio/buttplug/blob/buttplug-9.0.7/buttplug/buttplug-device-config/device-config-v3/buttplug-device-config-schema-v3.json#L263
export enum MessageType {
	Rotate = 'rotate',
	Linear = 'linear',
	Scalar = 'scalar',
}

const ACTUATOR_STRING_REGEX =
	/^(?<type>vibrate|rotate|oscillate|constrict|inflate|position)(?<index>\d*)$/;

export interface DeviceSpecification {
	name: string;
	actuatorType: ActuatorType | null;
	actuatorIndex: number | null;
}

const actuatorStringToActuatorType = (specification: string): ActuatorType => {
	switch (specification) {
		case 'vibrate':
			return ActuatorType.Vibrate;
		case 'rotate':
			return ActuatorType.Rotate;
		case 'oscillate':
			return ActuatorType.Oscillate;
		case 'constrict':
			return ActuatorType.Constrict;
		case 'inflate':
			return ActuatorType.Inflate;
		case 'position':
			return ActuatorType.Position;
		default:
			throw new Error(`Unknown actuator type: ${specification}`);
	}
};

const specialDeviceNames = new Set(
	['all', 'ungrouped'].flatMap((s) => [
		s,
		`${s}_vibrate`,
		`${s}_rotate`,
		`${s}_oscillate`,
		`${s}_constrict`,
		`${s}_inflate`,
		`${s}_position`,
	]),
);

const allDeviceSpecifications = new Map([
	['all_vibrate', ActuatorType.Vibrate],
	['all_rotate', ActuatorType.Rotate],
	['all_oscillate', ActuatorType.Oscillate],
	['all_constrict', ActuatorType.Constrict],
	['all_inflate', ActuatorType.Inflate],
	['all_position', ActuatorType.Position],
]);

const normalizeDeviceName = (name: string) =>
	name.toLowerCase().replace(/\s/g, '');

const parseDeviceString = (deviceString: string) => {
	const deviceSpecifications: DeviceSpecification[] = [];
	for (const deviceStringUnit of deviceString.split(',')) {
		const trimmed = deviceStringUnit.trim();
		if (trimmed.length === 0) {
			continue;
		}

		const [name, actuatorString = null] = trimmed.split(':');
		const normalizedName = normalizeDeviceName(name);
		if (actuatorString) {
			if (specialDeviceNames.has(normalizedName)) {
				TYRANO.kag.error(
					`「${normalizedName}」は特別なデバイス名です。アクチュエーターの指定はできません`,
					{},
				);
			} else {
				const matches = actuatorString.match(ACTUATOR_STRING_REGEX);
				if (matches) {
					const actuatorTypeString = matches.groups?.type;
					const actuatorIndex = matches.groups?.index
						? Number.parseInt(matches.groups.index)
						: null;
					deviceSpecifications.push({
						name: normalizedName,
						actuatorType: actuatorTypeString
							? actuatorStringToActuatorType(actuatorTypeString)
							: null,
						actuatorIndex,
					});
					continue;
				}

				TYRANO.kag.error(
					`「${actuatorString}」は不正なアクチュエーターの指定です`,
					{},
				);
			}
		}

		deviceSpecifications.push({
			name: normalizedName,
			actuatorType: null,
			actuatorIndex: null,
		});
	}

	return deviceSpecifications;
};

const getMatchingDevice = (
	devices: ButtplugClientDevice[],
	deviceSpecification: DeviceSpecification,
) => {
	const normalizedDeviceName = normalizeDeviceName(deviceSpecification.name);
	return devices.filter((d) => {
		if (
			normalizedDeviceName === 'all' ||
			allDeviceSpecifications.has(normalizedDeviceName)
		) {
			return true;
		}

		return normalizeDeviceName(d.name) === normalizedDeviceName;
	});
};

export const getMatchingFeatures = (
	devices: ButtplugClientDevice[],
	deviceString: string,
): [ButtplugClientDevice, MessageType, number[]][] => {
	const deviceSpecifications = parseDeviceString(deviceString);
	const matchingFeatures: [ButtplugClientDevice, MessageType, number[]][] = [];

	for (const deviceSpecification of deviceSpecifications) {
		const matchingDevices = getMatchingDevice(devices, deviceSpecification);

		for (const device of matchingDevices) {
			const actuatorTypeCountMap = new Map<ActuatorType, number>();

			const addMatchingFeatures = (
				attributes: GenericDeviceMessageAttributes[],
				messageType: MessageType,
			) => {
				const acutatorIndexes: number[] = [];
				for (const attribute of attributes) {
					const actuatorType = attribute.ActuatorType;
					const count = actuatorTypeCountMap.get(actuatorType) ?? 0;
					actuatorTypeCountMap.set(actuatorType, count + 1);

					const allDeviceSpecification = allDeviceSpecifications.get(
						deviceSpecification.name,
					);
					if (allDeviceSpecification !== undefined) {
						if (allDeviceSpecification === actuatorType) {
							acutatorIndexes.push(attribute.Index);
						}
						continue;
					}

					if (
						deviceSpecification.actuatorType === null ||
						(deviceSpecification.actuatorType === actuatorType &&
							(deviceSpecification.actuatorIndex === null ||
								deviceSpecification.actuatorIndex === count + 1))
					) {
						acutatorIndexes.push(attribute.Index);
					}
				}
				if (acutatorIndexes.length > 0) {
					matchingFeatures.push([device, messageType, acutatorIndexes]);
				}
			};

			const rotateCommands = device.messageAttributes.RotateCmd ?? [];
			addMatchingFeatures(rotateCommands, MessageType.Rotate);

			const linearCommands = device.messageAttributes.LinearCmd ?? [];
			addMatchingFeatures(linearCommands, MessageType.Linear);

			const scalarCommands = device.messageAttributes.ScalarCmd ?? [];
			addMatchingFeatures(scalarCommands, MessageType.Scalar);
		}
	}

	return matchingFeatures;
};

type RecursiveMap<K extends readonly unknown[], V> = Map<
	K[number],
	RecursiveMap<K, V> | V
>;
export class MultiKeyMap<K extends unknown[], V> {
	#map: RecursiveMap<K, V> = new Map();
	#size = 0;

	constructor(initialEntries?: Iterable<[K, V]>) {
		if (initialEntries !== undefined) {
			for (const [keys, value] of initialEntries) {
				this.set(keys, value);
			}
		}
	}

	get(keys: K): V | undefined {
		let map = this.#map;
		for (const key of keys) {
			const nextMap = map.get(key);
			if (nextMap === undefined) {
				return undefined;
			}
			if (!(nextMap instanceof Map)) {
				return nextMap;
			}
			map = nextMap;
		}
		return undefined;
	}

	has(keys: K): boolean {
		let map = this.#map;
		for (const key of keys) {
			const nextMap = map.get(key);
			if (nextMap === undefined) {
				return false;
			}
			if (!(nextMap instanceof Map)) {
				return true;
			}
			map = nextMap;
		}
		return false;
	}

	set(keys: K, value: V): void {
		let map = this.#map;
		for (const key of keys.slice(0, -1)) {
			let nextMap = map.get(key);
			if (nextMap === undefined) {
				nextMap = new Map();
				map.set(key, nextMap);
			} else if (!(nextMap instanceof Map)) {
				throw new Error('Invalid state');
			}
			map = nextMap;
		}
		if (!map.has(keys[keys.length - 1])) {
			this.#size++;
		}
		map.set(keys[keys.length - 1], value);
	}

	delete(keys: K): boolean {
		let map = this.#map;
		const stack: [Map<unknown, unknown>, unknown][] = [];
		for (const key of keys) {
			const nextMap = map.get(key);
			if (nextMap === undefined) {
				return false;
			}
			stack.push([map, key]);
			if (!(nextMap instanceof Map)) {
				break;
			}
			map = nextMap;
		}

		while (stack.length > 0) {
			const mapInfo = stack.pop();
			assert(mapInfo !== undefined);
			const [map, key] = mapInfo;
			map.delete(key);
			if (map.size > 0) {
				break;
			}
		}

		this.#size--;
		return true;
	}

	get size(): number {
		return this.#size;
	}

	entries(): Iterable<[K, V]> {
		const stack: [Map<unknown, unknown>, K][] = [
			[this.#map, [] as unknown[] as K],
		];
		return {
			*[Symbol.iterator]() {
				while (stack.length > 0) {
					const mapInfo = stack.pop();
					assert(mapInfo !== undefined);
					const [map, keys] = mapInfo;
					for (const [key, value] of map) {
						if (value instanceof Map) {
							stack.push([value, [...keys, key] as K]);
						} else {
							yield [[...keys, key], value] as [K, V];
						}
					}
				}
			},
		};
	}

	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `MultiKeyMap(${this.size}) { ${inspect(this.#map)} }`;
	}
}

// Returns index of the first element in the array that satisfies the test function
// biome-ignore lint/complexity/noUselessTypeConstraint: Format issue
export const binarySearch = <T extends unknown>(
	array: T[],
	test: (element: T) => boolean,
): number | null => {
	let low = 0;
	let high = array.length;

	while (low < high) {
		const mid = (low + high) >>> 1;
		const result = test(array[mid]);
		if (result) {
			high = mid;
		} else {
			low = mid + 1;
		}
	}

	return low < array.length ? low : null;
};
