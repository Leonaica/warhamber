import { describe, it, expect } from 'vitest';
import { sortTagRefs, sortWeaponTags, tagDetailText, describeEffects, resolveTagRef, normalizeTagRefs } from './weaponTags';
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

describe('tagDetailText', () => {
  it('interpolates the effect prose when the tag has one', () => {
    expect(tagDetailText({ ...def('tag-x', 'X'), effect: '+{x} damage' }, 2)).toBe('+2 damage');
  });

  it('falls back to the description, which is all a custom tag ever has', () => {
    expect(tagDetailText({ ...def('tag-y', 'Y'), description: 'Coils like a serpent' })).toBe('Coils like a serpent');
  });

  it('returns undefined when there is neither', () => {
    expect(tagDetailText(def('tag-z', 'Z'))).toBeUndefined();
  });

  it('synthesises from effects ahead of the description', () => {
    const t = {
      ...def('tag-e', 'E'),
      description: 'lore only',
      effects: [{ stage: 'attack' as const, op: 'add' as const, amount: 1 }],
    };
    expect(tagDetailText(t)).toBe('+1 to attack');
  });
});

describe('describeEffects', () => {
  it('renders a flat modifier', () => {
    expect(describeEffects([{ stage: 'attack', op: 'add', amount: 2 }])).toBe('+2 to attack');
  });

  it('renders a per-success effect', () => {
    expect(describeEffects([{ stage: 'penetration', op: 'add', amount: 'x', per: 'success' }]))
      .toBe('+{x} Pen per success');
  });

  it('appends the condition', () => {
    expect(describeEffects([{ stage: 'attack', op: 'add', amount: 1, when: { raisesAtLeast: 2 } }]))
      .toBe('+1 to attack on 2+ Raises');
  });

  it('joins several effects', () => {
    expect(describeEffects([
      { stage: 'attack', op: 'add', amount: 2 },
      { stage: 'damageModifier', op: 'add', amount: 1 },
    ])).toBe('+2 to attack; +1 Damage Modifier');
  });

  it('returns undefined for an empty list', () => {
    expect(describeEffects([])).toBeUndefined();
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

describe('derived variables', () => {
  const derived = (max = 20): WeaponTagDefinition => ({
    id: 'tag-der', label: 'Der', category: 't', kind: 'arithmetic',
    variable: { min: 0, max, default: 8, derivedFrom: { kind: 'attributeRank', attribute: 'Agility' } },
    effects: [{ stage: 'parry', op: 'add', amount: 'x' }],
  });

  it('reads the value from the character', () => {
    expect(resolveTagRef({ tagId: 'tag-der' }, [derived()], { attributeDiePools: { Agility: { rank: 8 } } })?.x).toBe(8);
  });

  it('clamps to the variable maximum', () => {
    expect(resolveTagRef({ tagId: 'tag-der' }, [derived(5)], { attributeDiePools: { Agility: { rank: 12 } } })?.x).toBe(5);
  });

  it('clamps to the variable minimum', () => {
    const d = derived();
    d.variable!.min = 3;
    expect(resolveTagRef({ tagId: 'tag-der' }, [d], { attributeDiePools: { Agility: { rank: 1 } } })?.x).toBe(3);
  });

  it('falls back to the default when the source is absent', () => {
    expect(resolveTagRef({ tagId: 'tag-der' }, [derived()], {})?.x).toBe(8);
  });

  it('prefers an explicit ref value', () => {
    expect(resolveTagRef({ tagId: 'tag-der', x: 3 }, [derived()], { attributeDiePools: { Agility: { rank: 8 } } })?.x).toBe(3);
  });

  it('leaves a derived x unset when normalising', () => {
    expect(normalizeTagRefs([{ tagId: 'tag-der' }], [derived()])).toEqual([{ tagId: 'tag-der' }]);
  });

  it('returns nothing for an unknown tag', () => {
    expect(resolveTagRef({ tagId: 'nope' }, [], {})).toBeUndefined();
  });
});
