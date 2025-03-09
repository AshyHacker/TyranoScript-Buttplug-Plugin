import {
	type ButtplugClientDevice,
	ActuatorType,
	type GenericDeviceMessageAttributes,
} from 'buttplug';
import log from './log.mjs';
import {inspect} from 'node:util';

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
export type MessageType = 'rotate' | 'linear' | 'scalar';

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

const parseDeviceString = (deviceString: string) => {
	const deviceSpecifications: DeviceSpecification[] = [];
	for (const deviceStringUnit of deviceString.split(',')) {
		const trimmed = deviceStringUnit.trim();
		if (trimmed.length === 0) {
			continue;
		}

		const [name, actuatorString = null] = trimmed.split(':');
		if (actuatorString) {
			const matches = actuatorString.match(ACTUATOR_STRING_REGEX);
			if (matches) {
				const actuatorTypeString = matches.groups?.type;
				const actuatorIndex = matches.groups?.index
					? Number.parseInt(matches.groups.index)
					: null;
				deviceSpecifications.push({
					name,
					actuatorType: actuatorTypeString
						? actuatorStringToActuatorType(actuatorTypeString)
						: null,
					actuatorIndex,
				});
				continue;
			}
		}

		deviceSpecifications.push({name, actuatorType: null, actuatorIndex: null});
	}

	return deviceSpecifications;
};

export const getMatchingFeatures = (
	devices: ButtplugClientDevice[],
	deviceString: string,
): [ButtplugClientDevice, MessageType, number[]][] => {
	const deviceSpecifications = parseDeviceString(deviceString);
	const matchingFeatures: [ButtplugClientDevice, MessageType, number[]][] = [];

	for (const deviceSpecification of deviceSpecifications) {
		const matchingDevices = devices.filter((d) => {
			const normalizedDeviceName1 = d.name.toLowerCase().replace(/\s/g, '');
			const normalizedDeviceName2 = deviceSpecification.name
				.toLowerCase()
				.replace(/\s/g, '');
			return normalizedDeviceName1 === normalizedDeviceName2;
		});

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
			addMatchingFeatures(rotateCommands, 'rotate');

			const linearCommands = device.messageAttributes.LinearCmd ?? [];
			addMatchingFeatures(linearCommands, 'linear');

			const scalarCommands = device.messageAttributes.ScalarCmd ?? [];
			addMatchingFeatures(scalarCommands, 'scalar');
		}
	}

	return matchingFeatures;
};

type RecursiveMap<K extends readonly unknown[], V> = Map<
	K[number],
	RecursiveMap<K, V> | V
>;
export class MultiKeyMap<K extends readonly unknown[], V> {
	#map: RecursiveMap<K, V> = new Map();
	#size = 0;

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

	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `MultiKeyMap(${this.size}) { ${inspect(this.#map)} }`;
	}
}
