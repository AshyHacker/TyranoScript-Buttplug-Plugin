import Papa from 'papaparse';

export interface PatternData {
	length: number;
	frames: {
		timestamp: number;
		values: number[];
	}[];
}

export const parse = (csv: string): PatternData => {
	const result = Papa.parse<string[]>(csv, {
		header: false,
		skipEmptyLines: true,
	});
	if (result.errors.length > 0) {
		throw new Error(result.errors[0].message);
	}

	const frames: PatternData['frames'] = [];

	for (const row of result.data) {
		if (row.length < 2) {
			continue;
		}

		const timestamp = Number.parseFloat(row[0]);
		if (Number.isNaN(timestamp)) {
			throw new Error(`Invalid timestamp: ${row[0]}`);
		}

		const values = row.slice(1).map((value) => {
			const parsed = Number.parseFloat(value);
			if (Number.isNaN(parsed)) {
				throw new Error(`Invalid value: ${value}`);
			}
			return parsed;
		});

		frames.push({
			timestamp: timestamp / 10,
			values,
		});
	}

	frames.sort((a, b) => a.timestamp - b.timestamp);

	return {
		length: frames[frames.length - 1].timestamp,
		frames,
	};
};
