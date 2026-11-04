import { describe, expect, it } from 'vitest';
import { ASPECTS, ATTRIBUTES, type AspectName } from '../types/character';
import {
  ATTRIBUTE_ABBR, DODGE_ATTRIBUTES, DODGE_POOL_KEYS, HEALING_ATTRIBUTES,
  PARRY_POOL_ATTRIBUTES, PARRY_POOL_KEYS, SOAK_ATTRIBUTES, abbreviateAttribute,
} from './aspectAttributes';

const ASPECT_NAMES = ASPECTS.map(a => a.id);
const ATTR_IDS = new Set(ATTRIBUTES.map(a => a.id));
const funcOf = (id: string) => ATTRIBUTES.find(a => a.id === id)?.func;

describe('map coverage', () => {
  it.each([
    ['SOAK_ATTRIBUTES', SOAK_ATTRIBUTES],
    ['HEALING_ATTRIBUTES', HEALING_ATTRIBUTES],
    ['PARRY_POOL_ATTRIBUTES', PARRY_POOL_ATTRIBUTES],
    ['DODGE_ATTRIBUTES', DODGE_ATTRIBUTES],
    ['DODGE_POOL_KEYS', DODGE_POOL_KEYS],
    ['PARRY_POOL_KEYS', PARRY_POOL_KEYS],
  ] as const)('%s names every aspect', (_name, map) => {
    expect(Object.keys(map).sort()).toEqual([...ASPECT_NAMES].sort());
  });

  it('names only real attributes', () => {
    const bad = [
      ...Object.values(SOAK_ATTRIBUTES),
      ...Object.values(HEALING_ATTRIBUTES),
      ...Object.values(PARRY_POOL_ATTRIBUTES),
      ...Object.values(DODGE_ATTRIBUTES).filter((a): a is NonNullable<typeof a> => a !== null),
    ].filter(a => !ATTR_IDS.has(a));
    expect(bad).toEqual([]);
  });
});

describe('attribute roles', () => {
  it('soaks with Resist attributes', () => {
    expect(ASPECT_NAMES.filter(a => funcOf(SOAK_ATTRIBUTES[a as AspectName]) !== 'Resist')).toEqual([]);
  });

  it('heals with Resist attributes', () => {
    expect(ASPECT_NAMES.filter(a => funcOf(HEALING_ATTRIBUTES[a as AspectName]) !== 'Resist')).toEqual([]);
  });

  it('sizes parry pools from Finesse attributes', () => {
    expect(ASPECT_NAMES.filter(a => funcOf(PARRY_POOL_ATTRIBUTES[a as AspectName]) !== 'Finesse')).toEqual([]);
  });

  it('dodges with Finesse attributes', () => {
    const nonNull = ASPECT_NAMES.filter(a => DODGE_ATTRIBUTES[a as AspectName] !== null);
    expect(nonNull.filter(a => funcOf(DODGE_ATTRIBUTES[a as AspectName]!) !== 'Finesse')).toEqual([]);
  });

  // The two are easy to confuse and are never the same attribute.
  it('never sizes a parry pool from the soak attribute', () => {
    expect(ASPECT_NAMES.filter(a => SOAK_ATTRIBUTES[a as AspectName] === PARRY_POOL_ATTRIBUTES[a as AspectName]))
      .toEqual([]);
  });
});

describe('dodge availability', () => {
  it('cannot dodge Flesh', () => {
    expect(DODGE_ATTRIBUTES.Flesh).toBeNull();
    expect(DODGE_POOL_KEYS.Flesh).toBeNull();
  });

  it('has a counter exactly where it can dodge', () => {
    const mismatch = ASPECT_NAMES.filter(a =>
      (DODGE_ATTRIBUTES[a as AspectName] === null) !== (DODGE_POOL_KEYS[a as AspectName] === null));
    expect(mismatch).toEqual([]);
  });
});

describe('abbreviations', () => {
  it('covers every attribute in three letters', () => {
    expect(Object.keys(ATTRIBUTE_ABBR).sort()).toEqual([...ATTR_IDS].sort());
    expect(Object.values(ATTRIBUTE_ABBR).filter(v => v.length !== 3)).toEqual([]);
  });

  it('never repeats one', () => {
    const v = Object.values(ATTRIBUTE_ABBR);
    expect(new Set(v).size).toBe(v.length);
  });

  it('falls back to the first three letters', () => {
    expect(abbreviateAttribute('Nonsense')).toBe('Non');
  });

  it('passes a known attribute through', () => {
    expect(abbreviateAttribute('Toughness')).toBe('Tgh');
  });
});
