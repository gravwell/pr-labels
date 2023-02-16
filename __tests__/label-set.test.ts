import { expect, test } from '@jest/globals';
import { LabelSet } from '../src/lib/label-set';

test('adds stuff', () => {
	const s = new LabelSet();
	s.addLabel('a');
	s.addLabel('b');
	s.addLabel('b');
	s.addLabel('c');

	expect(s.toAdd()).toEqual(new Set(['a', 'b', 'c']));
	expect(s.toRemove()).toEqual(new Set([]));
	expect(s.toAddAndRemove()).toEqual(new Set([]));
});

test('removes stuff', () => {
	const s = new LabelSet();
	s.addLabel('a');
	s.addLabel('c');
	s.removeLabel('b');

	expect(s.toAdd()).toEqual(new Set(['a', 'c']));
	expect(s.toRemove()).toEqual(new Set(['b']));
	expect(s.toAddAndRemove()).toEqual(new Set([]));
});

test('detects add/remove', () => {
	const s = new LabelSet();
	s.addLabel('a');
	s.addLabel('c');
	s.removeLabel('a');

	expect(s.toAdd()).toEqual(new Set(['a', 'c']));
	expect(s.toRemove()).toEqual(new Set(['a']));
	expect(s.toAddAndRemove()).toEqual(new Set(['a']));
});

test('merges', () => {
	const s = new LabelSet();
	s.addLabel('a');
	s.addLabel('b');
	s.addLabel('c');
	s.removeLabel('d');
	s.removeLabel('e');
	s.removeLabel('f');
	s.removeLabel('honk');

	const t = new LabelSet();
	t.addLabel('1');
	t.addLabel('2');
	t.addLabel('3');
	t.addLabel('honk');
	t.removeLabel('4');
	t.removeLabel('5');
	t.removeLabel('6');

	const merged = LabelSet.merge([s, t]);

	expect(merged.toAdd()).toEqual(new Set(['a', 'b', 'c', '1', '2', '3', 'honk']));
	expect(merged.toRemove()).toEqual(new Set(['d', 'e', 'f', '4', '5', '6', 'honk']));
	expect(merged.toAddAndRemove()).toEqual(new Set(['honk']));
});
