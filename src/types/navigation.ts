import type { AspectName } from './character';

/**
 * Navigation state for the `/combat` route.
 *
 * Built by PlaysheetPage (attacker via a weapon/attack, defender via an aspect
 * or an armor piece) and by ResolverPage's Resolve Damage hand-off, which adds
 * `successes`.
 */
export interface CombatPageState {
  mode?: 'attacker' | 'defender';
  weaponId?: string;
  attackIndex?: number;
  defenderAspect?: AspectName;
  armorId?: string;
  /** Successes carried over from an attack roll; drives the raise damage bonus. */
  successes?: number;
}