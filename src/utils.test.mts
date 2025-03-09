import {describe, it, expect, beforeEach, beforeAll, vi} from 'vitest';
import {MultiKeyMap, type Tag, binarySearch, defineTag} from './utils.mjs';
import {inspect} from 'node:util';

// Mock global TYRANO object
const TYRANO = {
	kag: {
		ftag: {
			// biome-ignore lint/style/useNamingConvention: External library
			master_tag: {} as Record<string, Tag>,
			nextOrder: () => {},
		},
		error: (_message: string) => {},
	},
};

beforeAll(() => {
	vi.stubGlobal('TYRANO', TYRANO);
});

beforeEach(() => {
	TYRANO.kag.ftag.master_tag = {};
});

describe('defineTag', () => {
	it('should define a new tag', () => {
		const tag = {start: () => {}, vital: [], pm: {}};
		defineTag('new_tag', tag);
		expect(TYRANO.kag.ftag.master_tag.new_tag).toBe(tag);
	});

	it('should not redefine an existing tag', () => {
		const tag = {start: () => {}, vital: [], pm: {}};
		TYRANO.kag.ftag.master_tag.existing_tag = tag;
		defineTag('existing_tag', {start: () => {}, vital: [], pm: {}});
		expect(TYRANO.kag.ftag.master_tag.existing_tag).toBe(tag);
	});
});

describe('MultiKeyMap', () => {
	it('should set and get values correctly', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		map.set(['key1', 'key3'], 43);
		map.set(['key1', 'key4'], 44);
		map.set(['key2', 'key3'], 45);
		map.set(['key2', 'key4'], 46);
		expect(map.get(['key1', 'key2'])).toBe(42);
		expect(map.get(['key1', 'key3'])).toBe(43);
		expect(map.get(['key1', 'key4'])).toBe(44);
		expect(map.get(['key2', 'key3'])).toBe(45);
		expect(map.get(['key2', 'key4'])).toBe(46);
	});

	it('should support arbitrary length keys', () => {
		const map = new MultiKeyMap<
			[
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
				string,
			],
			number
		>();
		map.set(
			[
				'key1',
				'key2',
				'key3',
				'key4',
				'key5',
				'key6',
				'key7',
				'key8',
				'key9',
				'key10',
			],
			42,
		);
		expect(
			map.get([
				'key1',
				'key2',
				'key3',
				'key4',
				'key5',
				'key6',
				'key7',
				'key8',
				'key9',
				'key10',
			]),
		).toBe(42);
	});

	it('should return true for existing keys', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		expect(map.has(['key1', 'key2'])).toBe(true);
		expect(map.has(['key1', 'key3'])).toBe(false);
		expect(map.has(['key2', 'key2'])).toBe(false);
	});

	it('should return undefined for non-existent keys', () => {
		const map = new MultiKeyMap<[string, string], number>();
		expect(map.get(['non', 'existent'])).toBeUndefined();
	});

	it('should overwrite existing keys', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		map.set(['key1', 'key2'], 43);
		expect(map.get(['key1', 'key2'])).toBe(43);
	});

	it('should delete keys correctly', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		expect(map.delete(['key1', 'key2'])).toBe(true);
		expect(map.get(['key1', 'key2'])).toBeUndefined();
	});

	it('should return false when deleting non-existent keys', () => {
		const map = new MultiKeyMap<[string, string], number>();
		expect(map.delete(['non', 'existent'])).toBe(false);
	});

	it('should update size correctly', () => {
		const map = new MultiKeyMap<[string, string], number>();
		expect(map.size).toBe(0);

		map.set(['key1', 'key2'], 42);

		expect(map.get(['key1', 'key2'])).toBe(42);
		expect(map.size).toBe(1);

		map.delete(['key1', 'key2']);

		expect(map.get(['key1', 'key2'])).toBeUndefined();
		expect(map.size).toBe(0);
	});

	it('supports multiple keys with different types', () => {
		const map = new MultiKeyMap<[string, number], number>();
		map.set(['key1', 1], 42);
		expect(map.get(['key1', 1])).toBe(42);
	});

	it('should support initializing with an iterable', () => {
		const map = new MultiKeyMap<[string, string], number>([
			[['key1', 'key2'], 42],
			[['key1', 'key3'], 43],
			[['key1', 'key4'], 44],
			[['key2', 'key3'], 45],
			[['key2', 'key4'], 46],
		]);
		expect(map.get(['key1', 'key2'])).toBe(42);
		expect(map.get(['key1', 'key3'])).toBe(43);
		expect(map.get(['key1', 'key4'])).toBe(44);
		expect(map.get(['key2', 'key3'])).toBe(45);
		expect(map.get(['key2', 'key4'])).toBe(46);
	});

	it('should iterate over entries correctly', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		map.set(['key1', 'key3'], 43);
		map.set(['key1', 'key4'], 44);
		map.set(['key2', 'key3'], 45);
		map.set(['key2', 'key4'], 46);

		const entries = Array.from(map.entries());
		expect(entries).toHaveLength(5);
		expect(entries).toContainEqual([['key1', 'key2'], 42]);
		expect(entries).toContainEqual([['key1', 'key3'], 43]);
		expect(entries).toContainEqual([['key1', 'key4'], 44]);
		expect(entries).toContainEqual([['key2', 'key3'], 45]);
		expect(entries).toContainEqual([['key2', 'key4'], 46]);
	});

	it('should print the map correctly', () => {
		const map = new MultiKeyMap<[string, string], number>();
		map.set(['key1', 'key2'], 42);
		expect(inspect(map)).toBe(
			"MultiKeyMap(1) { Map(1) { 'key1' => Map(1) { 'key2' => 42 } } }",
		);

		map.set(['key1', 'key3'], 43);
		expect(inspect(map)).toBe(
			"MultiKeyMap(2) { Map(1) { 'key1' => Map(2) { 'key2' => 42, 'key3' => 43 } } }",
		);
	});
});

describe('binarySearch', () => {
	it('should return the correct index for a value in the middle', () => {
		const values = [10, 20, 30, 40, 50];
		const index = binarySearch(values, (value) => value > 25);
		expect(index).toBe(2);
	});

	it('should return the correct index for a value at the start', () => {
		const values = [10, 20, 30, 40, 50];
		const index = binarySearch(values, (value) => value > 5);
		expect(index).toBe(0);
	});

	it('should return the correct index for a value at the end', () => {
		const values = [10, 20, 30, 40, 50];
		const index = binarySearch(values, (value) => value > 45);
		expect(index).toBe(4);
	});

	it('should return the correct index for a value not in the array', () => {
		const values = [10, 20, 30, 40, 50];
		const index = binarySearch(values, (value) => value > 100);
		expect(index).toBe(null);
	});
});
