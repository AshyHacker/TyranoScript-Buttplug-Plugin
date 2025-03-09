import type { ButtplugClientDevice, } from "buttplug";
import type { PatternData } from "./csvParser.mjs";
import log from "./log.mjs";
import {
	getMatchingFeatures,
	type MessageType,
	MultiKeyMap,
} from "./utils.mjs";
import buttplug from "./buttplugManager.mjs";

interface PatternDataConfiguration {
	patternData: PatternData;
	startTime: number;
	loop: boolean;
}

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

	constructor() {
		this.log("initialized");
		setInterval(this.onTick, 10);
	}

	// biome-ignore lint/suspicious/noExplicitAny: data
	private log(text: string, data: any = null) {
		log(`ButtplugPatternController: ${text}`, data);
	}

	private onTick() {
		const now = Date.now();
	}

	startPattern(devicesString: string, patternData: PatternData, loop: boolean) {
		const now = Date.now();
		this.log("startPattern:", { devicesString, patternData, loop });

		const matchingFeatures = getMatchingFeatures(
			buttplug.devices,
			devicesString,
		);
		this.log("matchingFeatures:", matchingFeatures);

		for (const [device, messageType, actuatorIndexes] of matchingFeatures) {
			for (const actuatorIndex of actuatorIndexes) {
				this.#patternDataConfigurations.set(
					[device, messageType, actuatorIndex],
					{ patternData, startTime: now, loop },
				);
			}
		}

		this.log("patternDataConfigurations:", this.#patternDataConfigurations);
	}
}

export default ButtplugPatternController.instance;
