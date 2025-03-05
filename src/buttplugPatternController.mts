import log from './log.mjs';

class ButtplugPatternController {
	// singleton
	static #instance: ButtplugPatternController | null = null;
	static get instance() {
		if (ButtplugPatternController.#instance === null) {
			ButtplugPatternController.#instance = new ButtplugPatternController();
		}
		return ButtplugPatternController.#instance;
	}

	constructor() {
		this.log('initialized');
	}

	// biome-ignore lint/suspicious/noExplicitAny: data
	private log(text: string, data: any = null) {
		log(`ButtplugPatternController: ${text}`, data);
	}
}

export default ButtplugPatternController.instance;
