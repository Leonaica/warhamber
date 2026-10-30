// Rating scale for Aspects and Functions
export type RatingValue = -20 | -15 | -10 | -5 | 0 | 5 | 10 | 15 | 20 | 25 | 30;

export const RATING_SCALE: RatingValue[] = [
  -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30
];

export const RATING_LABELS: Record<RatingValue, string> = {
  [-20]: '⛓️‍💥 Poor Human',
  [-15]: '🚶 Typical Human',
  [-10]: '🧗 Talented Human',
  [-5]: '🏆 Peak Human',
  0: '💪 Amberite Norm',
  5: '🐅 Primeval Beast',
  10: '🐉 Supernatural',
  15: '👑 Legend',
  20: '✨ Mythic',
  25: '🪽 Paragon',
  30: '🔥 Incarnation',
};

// Aspects (What you are)
export type AspectName = 'Form' | 'Flesh' | 'Mind' | 'Spirit';

interface Aspect {
  id: AspectName;
  name: string;
  emoji: string;
  description: string;
}

export const ASPECTS: Aspect[] = [
  {
    id: 'Form',
    name: 'Form',
    emoji: '🧱',
    description: 'The mechanical structure and shape of a thing — its solid, physical framework in the world.',
  },
  {
    id: 'Flesh',
    name: 'Flesh',
    emoji: '🧬',
    description: 'The living biological essence of a being, shaping how it endures, adapts, perceives, and influences.',
  },
  {
    id: 'Mind',
    name: 'Mind',
    emoji: '🧠',
    description: 'The incorporeal realm of logic, reason, and knowledge that governs formal magic and technology.',
  },
  {
    id: 'Spirit',
    name: 'Spirit',
    emoji: '🔥',
    description: 'The incorporeal identity of the soul — the self-aware life force.',
  },
];

// Functions (What you do)
export type FunctionName = 'Resist' | 'Finesse' | 'Perceive' | 'Force';

interface Function {
  id: FunctionName;
  name: string;
  emoji: string;
  description: string;
}

export const FUNCTIONS: Function[] = [
  {
    id: 'Resist',
    name: 'Resist',
    emoji: '🛡️',
    description: 'The ability to withstand hardship, damage, and pressure.',
  },
  {
    id: 'Finesse',
    name: 'Finesse',
    emoji: '🎯',
    description: 'The capacity to move, change, and respond with speed and precision.',
  },
  {
    id: 'Perceive',
    name: 'Perceive',
    emoji: '👁️',
    description: 'The skill of sensing and understanding the world.',
  },
  {
    id: 'Force',
    name: 'Force',
    emoji: '💪',
    description: 'The power to act upon and influence others.',
  },
];

// Attributes (derived from Function + Aspect)
export type AttributeName =
  | 'Toughness' | 'Endurance' | 'Willpower' | 'Resilience'
  | 'Agility' | 'Reflexes' | 'Intelligence' | 'Inspiration'
  | 'Perception' | 'Intuition' | 'Memory' | 'Wisdom'
  | 'Strength' | 'Magnetism' | 'Charisma' | 'Presence';

interface Attribute {
  id: AttributeName;
  name: string;
  func: FunctionName;
  aspect: AspectName;
  description: string;
}

export const ATTRIBUTES: Attribute[] = [
  // Resist
  { id: 'Toughness', name: 'Toughness', func: 'Resist', aspect: 'Form', description: 'Resistance to physical harm or degradation' },
  { id: 'Endurance', name: 'Endurance', func: 'Resist', aspect: 'Flesh', description: 'Biological stamina, fatigue resistance, healing' },
  { id: 'Willpower', name: 'Willpower', func: 'Resist', aspect: 'Mind', description: 'Mental discipline, focus, and resistance to control' },
  { id: 'Resilience', name: 'Resilience', func: 'Resist', aspect: 'Spirit', description: 'Spiritual strength and emotional resilience' },
  // Finesse
  { id: 'Agility', name: 'Agility', func: 'Finesse', aspect: 'Form', description: 'Mechanical movement, speed, and balance' },
  { id: 'Reflexes', name: 'Reflexes', func: 'Finesse', aspect: 'Flesh', description: 'Instinctive reaction, evasion, bodily coordination' },
  { id: 'Intelligence', name: 'Intelligence', func: 'Finesse', aspect: 'Mind', description: 'Problem-solving, logic, processing speed' },
  { id: 'Inspiration', name: 'Inspiration', func: 'Finesse', aspect: 'Spirit', description: 'Spontaneity, artistic improvisation, spiritual flow' },
  // Perceive
  { id: 'Perception', name: 'Perception', func: 'Perceive', aspect: 'Form', description: 'Accuracy of external physical senses' },
  { id: 'Intuition', name: 'Intuition', func: 'Perceive', aspect: 'Flesh', description: 'Subconscious awareness of danger or emotional states' },
  { id: 'Memory', name: 'Memory', func: 'Perceive', aspect: 'Mind', description: 'Perception of mental constructs — learned experience and knowledge' },
  { id: 'Wisdom', name: 'Wisdom', func: 'Perceive', aspect: 'Spirit', description: 'Moral understanding, spiritual insight' },
  // Force
  { id: 'Strength', name: 'Strength', func: 'Force', aspect: 'Form', description: 'Capacity to exert physical power on the world' },
  { id: 'Magnetism', name: 'Magnetism', func: 'Force', aspect: 'Flesh', description: 'Physical attractiveness, magnetism, biological influence' },
  { id: 'Charisma', name: 'Charisma', func: 'Force', aspect: 'Mind', description: 'Mental persuasion, rhetoric, leadership' },
  { id: 'Presence', name: 'Presence', func: 'Force', aspect: 'Spirit', description: 'Spiritual gravitas, emotional impact on others' },
];

export interface DiePool {
  dice: number[];
  notation: string; // e.g., "2d12 + d6" or "d4÷2"
  min: number;
  max: number;
  divisor?: number; // For d4÷2 case
}

// Skill ratings
export type SkillRating = 'Terrible' | 'Poor' | 'Average' | 'Good' | 'Great' | 'Exceptional' | 'Extraordinary';

export const SKILL_RATINGS: { rating: SkillRating; modifier: number; cost: number }[] = [
  { rating: 'Terrible', modifier: -2, cost: -10 },
  { rating: 'Poor', modifier: -1, cost: -5 },
  { rating: 'Average', modifier: 0, cost: 0 },
  { rating: 'Good', modifier: 1, cost: 0 },
  { rating: 'Great', modifier: 2, cost: 0 },
  { rating: 'Exceptional', modifier: 3, cost: 5 },
  { rating: 'Extraordinary', modifier: 4, cost: 10 },
];

// Skills
export type SkillName =
  | 'SilverTongue' | 'WhisperersWeb' | 'LeadersMantle' | 'UnseenHand'
  | 'WayOfTheWarrior' | 'WayOfTheRogue' | 'EngineersPen' | 'WayOfTheExplorer'
  | 'HeartsFire' | 'ArtisansCraft' | 'MachinesMind' | 'ScholarsMind';

export interface Skill {
  id: SkillName;
  name: string;
  emoji: string;
  category: 'Social' | 'Physical' | 'Abstract';
  description: string;
}

// Power categories
export type PowerCategory = 'Substance' | 'Semi-Substance' | 'Shadow';

interface PowerLevel {
  name: string;
  cost: number;
}

export interface Power {
  id: string;
  name: string;
  emoji: string;
  category: PowerCategory;
  description: string;
  requirements: string;
  keyAttributes: AttributeName[];
  levels: PowerLevel[];
  prerequisites?: PowerPrerequisite[];
  repeatable?: boolean; // Can the power be taken multiple times?
  subPowers?: string[]; // Psionic Disciplines, Artifice Sciences, etc.
  practitioner?: string;
  subPowerAdjectives?: Record<string, string>; // Maps subpower to adjective form
}

// Prerequisites to use a power
interface PowerPrerequisite {
  type: 'attribute' | 'aspect' | 'function' | 'power';
  // For attribute prerequisites
  attribute?: AttributeName;
  // For aspect prerequisites
  aspect?: AspectName;
  // For function prerequisites
  func?: FunctionName;
  // Minimum value required
  minimum?: number;
  // For power prerequisites
  powerId?: string;
  powerPoints?: number;
  // Minimum rank for which a prerequsite applies
  appliesAtPoints?: number;
}

// Character state
export interface CharacterAspectRatings {
  Form: RatingValue;
  Flesh: RatingValue;
  Mind: RatingValue;
  Spirit: RatingValue;
}

export interface CharacterFunctionRatings {
  Resist: RatingValue;
  Finesse: RatingValue;
  Perceive: RatingValue;
  Force: RatingValue;
}

export interface CharacterSkill {
  skillId: SkillName;
  rating: SkillRating;
  specialty: string;
  specialtyExplanation: string; // Detailed description of how the skill is used for the avatar
}

export interface CharacterPower {
  id: string;
  powerId: string;
  points: number;
  label: string; // Display name (defaults to tier name, editable)
  customTitle?: string;
  description: string; // How this power manifests for the avatar
}

export interface Artifact {
  id: string;
  name: string;
  description: string;
  cost: number;
  quantity: number;
}

export interface Ally {
  id: string;
  name: string;
  description: string;
  cost: number;
  loyalty: number; // 1-6 positive = ally, -1 to -6 = nemesis
}

export interface PersonalShadow {
  id: string;
  name: string;
  description: string;
  cost: number;
}

type SizeValue = -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const SIZE_OPTIONS: { value: SizeValue; label: string; description: string }[] = [
  { value: -3, label: 'Minuscule', description: 'to 500g' },
  { value: -2, label: 'Puny', description: 'to 4kg' },
  { value: -1, label: 'Weedy', description: 'to 30kg' },
  { value: 0, label: 'Average', description: 'to 200kg' },
  { value: 1, label: 'Hulking', description: 'to 2 tons' },
  { value: 2, label: 'Enormous', description: 'to 16 tons' },
  { value: 3, label: 'Massive', description: 'to 125 tons' },
  { value: 4, label: 'Immense', description: 'to 1000 tons' },
  { value: 5, label: 'Monumental', description: 'to 10k tons' },
  { value: 6, label: 'Titanic', description: 'to 100k tons' },
];

// === ATTACK TYPES ===

type FormAttackType =
  | 'Annihilation' | 'Slashing' | 'Piercing' | 'Distortion' | 'Shockwave';

type FleshAttackType =
  | 'Poisoning' | 'Infection' | 'Asphyxiation' | 'Burnout' | 'Decay';

type MindAttackType =
  | 'Shattering' | 'Degradation' | 'Erasure' | 'Dissolution' | 'Subversion';

type SpiritAttackType =
  | 'Despair' | 'Severing' | 'Corruption' | 'Unmaking' | 'Desecration' | 'Doubt';

export type AttackType = FormAttackType | FleshAttackType | MindAttackType | SpiritAttackType;

// Convenience unions per aspect 
const FORM_ATTACK_TYPES: FormAttackType[] = [
  'Annihilation', 'Slashing', 'Piercing', 'Distortion', 'Shockwave',
];

const FLESH_ATTACK_TYPES: FleshAttackType[] = [
  'Poisoning', 'Infection', 'Asphyxiation', 'Burnout', 'Decay',
];

const MIND_ATTACK_TYPES: MindAttackType[] = [
  'Shattering', 'Degradation', 'Erasure', 'Dissolution', 'Subversion',
];

const SPIRIT_ATTACK_TYPES: SpiritAttackType[] = [
  'Despair', 'Severing', 'Corruption', 'Unmaking', 'Desecration', 'Doubt',
];

export const ATTACK_TYPES_BY_ASPECT: Record<AspectName, AttackType[]> = {
  Form: FORM_ATTACK_TYPES,
  Flesh: FLESH_ATTACK_TYPES,
  Mind: MIND_ATTACK_TYPES,
  Spirit: SPIRIT_ATTACK_TYPES,
};

// === WEAPON CATEGORIES ===

export type WeaponCategory = 
  | 'Innate' | 'Melee' | 'Pistol' | 'Ranged' | 'Heavy' | 'Mounted' | 'Thrown'
  | 'Natural' | 'Unarmed'
  | 'Spell' | 'Innate';

export const getAttackTypesForAspect = (aspect: AspectName): AttackType[] =>
  ATTACK_TYPES_BY_ASPECT[aspect];

export type TagValueSource =
  | { kind: 'attributeRank'; attribute: AttributeName }
  | { kind: 'immaterialSize' }
  | { kind: 'size' }
  | { kind: 'surge' }
  | { kind: 'stuff' };

export interface TagResolveContext {
  attributeDiePools?: Partial<Record<AttributeName, { rank: number }>>;
  immaterialSize?: number;
  size?: number;
  surge?: number;
  stuff?: number;
}
  
/**
 * Stage an effect acts on. Mirrors the resolution pipeline.
 */
export type TagStage =
  | 'attack' | 'parry' | 'raises' | 'raiseDamage' | 'magnitude'
  | 'penetration' | 'resistance' | 'armor' | 'damageModifier'
  | 'reroll' | 'override' | 'flag';

export type TagTarget = 'parry' | 'pen' | 'magnitude' | 'resistance' | 'armor' | 'woundLevel';

/** A numeric source. Literals are fixed values; strings read a live value. */
export type Amount = number | 'x' | 'strength' | 'presence' | 'armorValue' | 'deathBlow';

/**
 * Facts a condition may reference.
 *
 * INVARIANT: produced by the roll itself. Never add scene state here.
 */
export interface TagWhen {
  raisesAtLeast?: number;
  allLow?: boolean;
}

/**
 * The closed vocabulary of effects. Each stage accepts only its own verbs,
 * so an illegal combination is a compile error rather than a silent no-op.
 */
export interface EffectByStage {
  attack: { op: 'add' | 'subtract'; amount: Amount };
  parry: { op: 'add' | 'subtract' | 'deny'; amount?: Amount };
  raises: { op: 'multiply' | 'add'; amount: Amount };
  raiseDamage: { op: 'set' | 'add' | 'subtract'; amount: Amount };
  magnitude: { op: 'add' | 'subtract'; amount: Amount };
  penetration: { op: 'add' | 'subtract' | 'multiply' | 'set'; amount: Amount };
  resistance: { op: 'add' | 'subtract' | 'set'; amount: Amount };
  armor: { op: 'set'; amount: Amount };
  damageModifier: { op: 'add' | 'subtract'; amount: Amount };
  reroll: { op: 'flag' };
  override: { op: 'set'; target: 'woundLevel'; amount: 'deathBlow' };
  flag: { op: 'flag'; note: string };
}

export type TagEffect = {
  [S in keyof EffectByStage]: { stage: S } & EffectByStage[S] & {
    per?: 'flat' | 'success' | 'raise';
    when?: TagWhen;
    child?: string;
    /** Short label for the child's sub-toggle, e.g. 'Medium+'. */
    childLabel?: string;
    /** Short qualifier shown beside the effect, e.g. 'When aiming'. */
    note?: string;
  };
}[keyof EffectByStage];

/**
 * Interaction kind. 'flavor' has no effects; 'narrative' and 'secondTest'
 * produce a card instead of arithmetic.
 */
export type TagKind = 'arithmetic' | 'conditional' | 'narrative' | 'secondTest' | 'flavor';

interface WeaponTagVariable {
  min: number;
  max: number;
  default: number;
  unit?: string;          // e.g. 'd' for die-type tags, '' or omitted for plain numbers
  step?: number;          // defaults to 1; use 2 for even-only ranges, etc.
  derivedFrom?: TagValueSource;
  sourceLabel?: string;
}

export interface WeaponTagDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
  effect?: string;
  variable?: WeaponTagVariable;
  /** Interaction kind. Required; flavor tags carry no effects. */
  kind: TagKind;
  effects?: TagEffect[];
  /** Applied on selection: penalties, weapon facts, near-always-relevant only. */
  defaultActive?: boolean;
}

/**
 * A reference to a tag in a weapon's tag list.
 * If the referenced tag definition has a `variable`, `x` carries the chosen value.
 * For tags without a variable, `x` is omitted/undefined.
 *
 * The `id` format is intentionally the same as before for back-compat:
 *   "tag-felling"  (no variable, or variable with x = default)
 *   "tag-felling:2" (variable, x = 2)
 *
 * `tagId` is always the bare definition id (no colon suffix).
 */
export interface WeaponTagRef {
  tagId: string;
  x?: number;
}


export type WeaponHandedness = 'One-handed' | 'Two-handed' | 'Hands free' | 'Extra limb';

export type WeaponRange = 
  | 'Touch' | 'Close' | 'Reach' | 'PointBlank' | 'Short' 
  | 'Medium' | 'Long' | 'Extended' | 'Extreme' | 'Horizon'
  | 'BeyondHorizon' | 'Standoff' | 'Vehicle' | 'HeavyVehicle' | 'Theater'
  | 'Strategic' | 'Emplacement' | 'HeavyEmplacement' | 'Regional' | 'Continental';

export const WEAPON_RANGES: { step: number; value: WeaponRange; label: string; distance: string; description: string }[] = [
  { step: 1,  value: 'Touch',            label: 'Touch',              distance: '~1 m',       description: 'Unarmed, grappling, touch spells' },
  { step: 2,  value: 'Close',            label: 'Close',              distance: '~2 m',       description: 'Swords, axes, maces' },
  { step: 3,  value: 'Reach',            label: 'Reach',              distance: '~5 m',       description: 'Polearms, whips, spears' },
  { step: 4,  value: 'PointBlank',       label: 'Point Blank',        distance: '~10 m',      description: 'Thrown weapons' },
  { step: 5,  value: 'Short',            label: 'Short',              distance: '~20 m',      description: 'Pistols, shotguns, flamethrowers' },
  { step: 6,  value: 'Medium',           label: 'Medium',             distance: '~50 m',      description: 'SMGs, shortbows, slings' },
  { step: 7,  value: 'Long',             label: 'Long',               distance: '~100 m',     description: 'Crossbows, longbows' },
  { step: 8,  value: 'Extended',         label: 'Extended',           distance: '~200 m',     description: 'Marksman rifles, heavy crossbows' },
  { step: 9,  value: 'Extreme',          label: 'Extreme',            distance: '~500 m',     description: 'Assault rifles, carbines, battle rifles' },
  { step: 10, value: 'Horizon',          label: 'Horizon',            distance: '~1 km',      description: 'Sniper rifles, heavy machine guns' },
  { step: 11, value: 'BeyondHorizon',    label: 'Beyond Horizon',     distance: '~2 km',      description: 'Anti-materiel rifles' },
  { step: 12, value: 'Standoff',         label: 'Standoff',           distance: '~5 km',      description: 'Heavy ATGMs, man-portable SAMs' },
  { step: 13, value: 'Vehicle',          label: 'Vehicle',            distance: '~10 km',     description: 'Field guns, light howitzers, attack helicopter weapons' },
  { step: 14, value: 'HeavyVehicle',     label: 'Heavy Vehicle',      distance: '~20 km',     description: 'Heavy howitzers, light MLRS' },
  { step: 15, value: 'Theater',          label: 'Theater',            distance: '~50 km',     description: 'Heavy MLRS, short-range ballistic missiles' },
  { step: 16, value: 'Strategic',        label: 'Strategic',          distance: '~100 km',    description: 'Medium-range ballistic missiles' },
  { step: 17, value: 'Emplacement',      label: 'Emplacement',        distance: '~200 km',    description: 'Intermediate-range missiles, fixed artillery' },
  { step: 18, value: 'HeavyEmplacement', label: 'Heavy Emplacement',  distance: '~500 km',    description: 'Suborbital ballistic weapons' },
  { step: 19, value: 'Regional',         label: 'Regional',           distance: '~1,000 km',  description: 'Long-range ballistic missiles' },
  { step: 20, value: 'Continental',      label: 'Continental',        distance: '~2,000 km',  description: 'Intercontinental-range missiles' },
];

export interface WeaponAttack {
  id: string;
  aspect: AspectName;
  type: AttackType;
  magnitude: number;
  penetration: number | [number, number];
  range: WeaponRange;
  isConditional?: boolean;
  condition?: string;
}

export type WeaponCapacity = 'Single-shot' | 'Limited' | 'Standard' | 'Extended' | 'Continuous';
export type WeaponReloadTime = 'Reflexive' | 'Quick' | 'Standard' | 'Slow' | 'Extended';

export interface CharacterWeapon {
  id: string;
  name: string;
  attacks: WeaponAttack[];
  category: WeaponCategory;
  handedness: WeaponHandedness;
  capacity?: { min: WeaponCapacity; max?: WeaponCapacity };
  reloadTime?: WeaponReloadTime;
  tagIds?: string[];          // LEGACY — still readable for back-compat. Remove after updating all saves.
  tags?: WeaponTagRef[];      // NEW — preferred. Migrate on next save.
}

export interface CharacterArmor {
  id: string;
  name: string;
  aspects: ArmorAspect[];
  armor: number;
  location: string;
  notes?: string[];
}

export type ArmorAspect = 'Form' | 'Flesh' | 'Mind' | 'Spirit';

export interface Character {
  name: string;
  campaignLimit: number;
  
  // Step 1: Attributes
  aspects: CharacterAspectRatings;
  functions: CharacterFunctionRatings;
  
  // Step 2: Skills
  skills: CharacterSkill[];
  
  // Step 3: Powers
  powers: CharacterPower[];
  
  // Step 4: Artifacts, Allies, Shadows
  artifacts: Artifact[];
  allies: Ally[];
  personalShadows: PersonalShadow[];
  
  // Step 5: Equipment
  weapons: CharacterWeapon[];
  customTags: WeaponTagDefinition[];
  armor: CharacterArmor[];
  size: number;
  
  // Derived values (computed)
  attributes: Record<AttributeName, number>;
  diePools: Record<AttributeName, DiePool>;
  skillCap: number;
  skillMaximum: number;
  totalPointsSpent: number;
  stuff: number; // positive = Good Stuff, negative = Bad Stuff
  surge: number;
}
