import { describe, it, expect } from 'vitest';
import { sortTagRefs, sortWeaponTags } from './weaponTags';
import type { CharacterWeapon, WeaponTagDefinition } from '../types/character';

const def = (id: string, label: string): WeaponTagDefinition =>
  ({ id, label, category: 'Test', kind: 'flavor' });

const customTags = [def('tag-zzz', 'Zap'), def('tag-aaa', 'Alpha')];

const weapon = (tags: { tagId: string }[]): CharacterWeapon => ({
  id: 'w1',
  name: 'Sword',
  attacks: [],
  category: 'Melee',
  handedness: 'One-handed',
  tags,
});

describe('sortTagRefs', () => {
  it('orders by label, not by the order tags were added', () => {
    const out = sortTagRefs([{ tagId: 'tag-zzz' }, { tagId: 'tag-aaa' }], customTags, {});
    expect(out.map(r => r.tagId)).toEqual(['tag-aaa', 'tag-zzz']);
  });

  it('leaves the input array untouched', () => {
    const input = [{ tagId: 'tag-zzz' }, { tagId: 'tag-aaa' }];
    sortTagRefs(input, customTags, {});
    expect(input[0].tagId).toBe('tag-zzz');
  });

  it('falls back to the tag id for an unresolvable ref', () => {
    const out = sortTagRefs([{ tagId: 'tag-missing' }, { tagId: 'tag-aaa' }], customTags, {});
    expect(out.map(r => r.tagId)).toEqual(['tag-aaa', 'tag-missing']);
  });
});

describe('sortWeaponTags', () => {
  it('sorts legacy tagIds and keeps the :x suffix', () => {
    const [out] = sortWeaponTags(
      [{ ...weapon([]), tagIds: ['tag-zzz', 'tag-aaa:2'] }],
      customTags,
    );
    expect(out.tagIds).toEqual(['tag-aaa:2', 'tag-zzz']);
  });

  it('leaves a weapon with no tags alone', () => {
    const [out] = sortWeaponTags([weapon([])], customTags);
    expect(out.tags).toEqual([]);
    expect(out.tagIds).toBeUndefined();
  });
});
