import originalLog from '../log.mjs';
import {defineTag} from '../utils.mjs';
import {parse as parseCsv} from '../csvParser.mjs';
import buttplugPatternController from '../buttplugPatternController.mjs';

// biome-ignore lint/suspicious/noExplicitAny: Arbitrary data is expected here
const log = (msg: string, data: any = null) => {
	originalLog(`buttplug_start_csv: ${msg}`, data);
};

defineTag('buttplug_start_csv', {
	async start(pm: Record<string, string>) {
		try {
			log('tag start:', pm);

			const params = Object.assign(
				{
					devices: '',
					groups: '',
					loop: 'true',
				},
				pm,
			);

			const path = `data/others/bpscripts/${params.storage}`;
			const csvData = await new Promise<string>((resolve, reject) => {
				window.$.loadText(path, (csv: string) => {
					if (csv === '') {
						reject('Error: CSV file not found');
						return;
					}
					resolve(csv);
				});
			});
			log('csv:', csvData);

			const patternData = parseCsv(csvData);
			buttplugPatternController.startPattern(
				params.devices,
				patternData,
				params.loop === 'true',
			);
		} catch (error) {
			log('error:', error);
		} finally {
			TYRANO.kag.ftag.nextOrder();
		}
	},
	vital: ['storage'],
	pm: {},
});
