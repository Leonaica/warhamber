import type { AspectName, AttributeName } from '../types/character';
import type { ReactionPoolKey } from '../context/GameStateContext';

/**
 * The attribute used to soak damage of each Aspect. This is also the attribute
 * rolled for a Parry — but NOT the attribute that sizes the Parry pool, which
 * is PARRY_POOL_ATTRIBUTES below. The two are easy to confuse.
 */
export const SOAK_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Toughness',
  Flesh: 'Endurance',
  Mind: 'Willpower',
  Spirit: 'Resilience',
};

/**
 * The Finesse attribute whose *dice count* sets how many Parries are available
 * per round for each Aspect (p. 56). The Parry roll itself uses SOAK_ATTRIBUTES.
 */
export const PARRY_POOL_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Agility',
  Flesh: 'Reflexes',
  Mind: 'Intelligence',
  Spirit: 'Inspiration',
};

/** The Finesse attribute rolled for a Dodge. null = this Aspect cannot Dodge. */
export const DODGE_ATTRIBUTES: Record<AspectName, AttributeName | null> = {
  Form: 'Agility',
  Flesh: null,
  Mind: 'Intelligence',
  Spirit: 'Inspiration',
};

/** The attribute rolled for a natural healing test, per Aspect. */
export const HEALING_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Endurance',
  Flesh: 'Endurance',
  Mind: 'Willpower',
  Spirit: 'Resilience',
};

/** Reaction-pool counter for a Dodge; null wherever DODGE_ATTRIBUTES is null. */
export const DODGE_POOL_KEYS: Record<AspectName, ReactionPoolKey | null> = {
  Form: 'formDodge',
  Flesh: null,
  Mind: 'mindDodge',
  Spirit: 'spiritDodge',
};

/** Reaction-pool counter for a Parry. */
export const PARRY_POOL_KEYS: Record<AspectName, ReactionPoolKey> = {
  Form: 'formParry',
  Flesh: 'fleshParry',
  Mind: 'mindParry',
  Spirit: 'spiritParry',
};