import type { AspectName, DiePool, ArmorAttributeName, AttackType, WeaponAttack } from './character';

// Weapon categories
export type WeaponCategory = 'Pistol' | 'Gun' | 'Heavy' | 'Mounted' | 'Melee' | 'Thrown';
export type WeaponHandedness = 'One-handed' | 'Two-handed';

export interface Weapon {
  id: string;
  name: string;
  attacks: WeaponAttack[];
  category: WeaponCategory;
  handedness: WeaponHandedness;
  ammo?: string;
  notes?: string[];
}

export interface DamageResult {
  weaponDamage: number;
  weaponRollDetails: {
    dice: number[];
    explosions: { dieIndex: number; rolls: number[] }[];
  };
  resistanceReduction: number;
  resistanceRollDetails?: {
    dice: number[];
    explosions: { dieIndex: number; rolls: number[] }[];
  };
  armorReduction: number;
  effectiveArmor: number;
  penetration: number;
  sizeReduction: number;
  finalDamage: number;
  woundLevel: number;
  woundLabel: string;
  woundEmoji: string;
  woundPenalty: number;
}

export interface DamageMagnitudeEntry {
  magnitude: number;
  label: string;
  pool: DiePool;
  averageDamage: number;
  examples: string;
}

export interface WoundLevelInfo {
  level: number;
  label: string;
  emoji: string;
  minDamage: number;
  maxDamage: number;
  penalty: number;
  description: string;
}