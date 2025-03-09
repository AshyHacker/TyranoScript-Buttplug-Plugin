import {describe, it, expect} from 'vitest';
import {MultiKeyMap} from './utils.mjs';
import {inspect} from 'node:util';

describe('MultiKeyMap', () => {
	it('should set and get values correctly', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
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
			readonly [
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

	it('should return undefined for non-existent keys', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
		expect(map.get(['non', 'existent'])).toBeUndefined();
	});

	it('should overwrite existing keys', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
		map.set(['key1', 'key2'], 42);
		map.set(['key1', 'key2'], 43);
		expect(map.get(['key1', 'key2'])).toBe(43);
	});

	it('should delete keys correctly', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
		map.set(['key1', 'key2'], 42);
		expect(map.delete(['key1', 'key2'])).toBe(true);
		expect(map.get(['key1', 'key2'])).toBeUndefined();
	});

	it('should return false when deleting non-existent keys', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
		expect(map.delete(['non', 'existent'])).toBe(false);
	});

	it('should update size correctly', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
		expect(map.size).toBe(0);

		map.set(['key1', 'key2'], 42);

		expect(map.get(['key1', 'key2'])).toBe(42);
		expect(map.size).toBe(1);

		map.delete(['key1', 'key2']);

		expect(map.get(['key1', 'key2'])).toBeUndefined();
		expect(map.size).toBe(0);
	});

	it('supports multiple keys with different types', () => {
		const map = new MultiKeyMap<readonly [string, number], number>();
		map.set(['key1', 1], 42);
		expect(map.get(['key1', 1])).toBe(42);
	});

	it('should print the map correctly', () => {
		const map = new MultiKeyMap<readonly [string, string], number>();
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
