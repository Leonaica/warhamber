import type { DiePool } from '../types/character';

export interface DamageMagnitudeEntry {
  magnitude: number;
  label: string;
  pool: DiePool;
  averageDamage: number;
  examples: string;
}

export const DAMAGE_MAGNITUDE_TABLE: DamageMagnitudeEntry[] = [
  {
    magnitude: 1,
    label: 'Deterrence',
    pool: { dice: [4], notation: 'd4', min: 1, max: 4 },
    averageDamage: 3,
    examples: 'Police baton, unarmed, whip, TASER, .22 Short, hold-out pistol',
  },
  {
    magnitude: 2,
    label: 'Light',
    pool: { dice: [4, 6], notation: 'd4 + d6', min: 2, max: 10 },
    averageDamage: 7,
    examples: 'Dagger, shortsword, light crossbow, baseball bat, knife, .38 Special, SMG',
  },
  {
    magnitude: 3,
    label: 'Standard',
    pool: { dice: [4, 6, 8], notation: 'd4 + d6 + d8', min: 3, max: 18 },
    averageDamage: 12,
    examples: 'Longsword, battleaxe, longbow, 5.56mm NATO, 12-gauge (birdshot), SMG burst',
  },
  {
    magnitude: 4,
    label: 'Heavy',
    pool: { dice: [4, 6, 8, 10], notation: 'd4 + d6 + d8 + d10', min: 4, max: 28 },
    averageDamage: 18,
    examples: 'Halberd, pike, heavy crossbow, .30-06, 7.62mm NATO, 12-gauge (buckshot)',
  },
  {
    magnitude: 5,
    label: 'Lethal',
    pool: { dice: [4, 6, 8, 10, 12], notation: 'd4 + d6 + d8 + d10 + d12', min: 5, max: 40 },
    averageDamage: 25,
    examples: 'Greatsword, maul, lance, .338 Lapua sniper rifle, 12-gauge (slug, close), bolter',
  },
  {
    magnitude: 6,
    label: 'Support',
    pool: { dice: [4, 6, 8, 10, 12, 12], notation: 'd4 + d6 + d8 + d10 + 2d12', min: 6, max: 52 },
    averageDamage: 32,
    examples: 'Assault cannon, heavy machine gun, heavy bolter',
  },
  {
    magnitude: 7,
    label: 'Anti-Armor',
    pool: { dice: [4, 6, 8, 10, 12, 12, 12], notation: 'd4 + d6 + d8 + d10 + 3d12', min: 7, max: 64 },
    averageDamage: 39,
    examples: 'Lascannon',
  },
  {
    magnitude: 8,
    label: 'Armored',
    pool: { dice: [4, 6, 8, 10, 12, 12, 12, 12], notation: 'd4 + d6 + d8 + d10 + 4d12', min: 8, max: 76 },
    averageDamage: 46,
    examples: 'Battle cannon, multi-melta',
  },
  {
    magnitude: 9,
    label: 'Siege',
    pool: { dice: [4, 6, 8, 10, 12, 12, 12, 12, 12], notation: 'd4 + d6 + d8 + d10 + 5d12', min: 9, max: 88 },
    averageDamage: 54,
    examples: 'Demolisher, vanquisher cannon',
  },
  {
    magnitude: 10,
    label: 'Titanic',
    pool: { dice: [4, 6, 8, 10, 12, 12, 12, 12, 12, 12], notation: 'd4 + d6 + d8 + d10 + 6d12', min: 10, max: 100 },
    averageDamage: 61,
    examples: 'Volcano cannon, hellstorm cannon, Yamoto cannon',
  },
  {
    magnitude: 11,
    label: 'Apocalyptic',
    pool: { dice: [4, 6, 8, 10, 12, 12, 12, 12, 12, 12, 12], notation: 'd4 + d6 + d8 + d10 + 7d12', min: 11, max: 112 },
    averageDamage: 68,
    examples: '',
  },
];