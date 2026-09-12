import type { WeaponTagDefinition, WeaponTagRef } from '../types/character';

export const WEAPON_TAG_CATEGORIES = [
  'Inherent',
  'Craftsmanship',
  'Enchantment',
  'Supernatural',
  'Legendary',
] as const;

export const WEAPON_TAG_LIBRARY: WeaponTagDefinition[] = [
  // === Inherent ===
  {
    id: 'tag-strength-bonus',
    label: 'Strength Bonus',
    category: 'Inherent',
    description: 'Damage depends in part on the Strength of the user',
    effect: 'Add the wielder\'s Strength Rank as a Damage Modifier',
  },
  {
    id: 'tag-defensive',
    label: 'Defensive',
    category: 'Inherent',
    description: 'shields, bucklers, and the like',
    effect: '+3 to parry, -2 to attack',
  },
  {
    id: 'tag-flexible',
    label: 'Flexible',
    category: 'Inherent',
    description: 'made of linked metal, rope, or other non-rigid materials that deny defensive counters',
    effect: 'Cannot be parried',
  },
  {
    id: 'tag-indirect',
    label: 'Indirect',
    category: 'Inherent',
    description: 'Can fire indirectly over obstacles',
    effect: 'Can fire at targets without line of sight using a spotter or arc calculation; target gains +2 to dodge if they see it coming',
  },
  {
    id: 'tag-spray',
    label: 'Spray',
    category: 'Inherent',
    description: 'Cone attack affecting all targets in area',
    effect: 'Attack affects all targets in a cone from the wielder; roll separately for each. Cone extends to weapon\'s Range rank',
  },
  {
    id: 'tag-nonlethal',
    label: 'Non-Lethal',
    category: 'Inherent',
    effect: 'Injuries lead to unconsciousness rather than death',
  },
  {
    id: 'tag-ensnaring',
    label: 'Ensnaring',
    category: 'Inherent',
    effect: 'Target must test each action to free themselves va TN {x} or remain immobilized',
    variable: { min: 4, max: 96, default: 4, step: 4 },
  },
  {
    id: 'tag-clumsy',
    label: 'Clumsy',
    category: 'Inherent',
    effect: '-2 to attack in tight spaces, grapples, or when prone',
  },
  {
    id: 'tag-throwing',
    label: 'Throwing',
    category: 'Inherent',
    description: 'Melee weapon balanced for throwing',
    effect: 'Melee weapon can be thrown at Short range without penalty',
  },
  {
    id: 'tag-cumbersome',
    label: 'Cumbersome',
    category: 'Inherent',
    effect: '-2 to physical actions while wielded due to weight/awkwardness',
  },
  {
    id: 'tag-blast',
    label: 'Blast',
    category: 'Inherent',
    description: 'Area-effect weapon; X is the blast radius in meters',
    effect: 'Attack hits all targets within {x}m of impact point; roll separately for each',
    variable: { min: 1, max: 100, default: 2, step: 1 },
  },
  {
    id: 'tag-silvered',
    label: 'Silvered',
    category: 'Inherent',
    description: 'Coated or alloyed with silver',
    effect: 'Deals full damage to creatures vulnerable to silver (lycanthropes, certain undead)',
  },
  {
    id: 'tag-cold-iron',
    label: 'Cold Iron',
    category: 'Inherent',
    description: 'Forged from cold-worked iron, worked without heat',
    effect: 'Bypasses damage resistance of fey and certain fiends',
  },
  {
    id: 'tag-adamantine',
    label: 'Adamantine',
    category: 'Inherent',
    description: 'Forged from adamantine alloy',
    effect: 'Treats all hits as criticals against objects; bypasses hardness',
  },
  {
    id: 'tag-mithral',
    label: 'Mithral',
    category: 'Inherent',
    description: 'Forged from mithral silver',
    effect: 'Half the weight of steel; non-magnetic; immune to rust',
  },
  {
    id: 'tag-integrated',
    label: 'Integrated',
    category: 'Inherent',
    effect: 'Cannot be disarmed; built into body/limb/nerve interface',
  },
  {
    id: 'tag-crippling',
    label: 'Crippling',
    category: 'Inherent',
    description: 'Injuries worsen with exertion',
    effect: 'Injuries caused by this weapon worsen 1 step each time Surge is used',
  },
  {
    id: 'tag-cruel',
    label: 'Cruel',
    category: 'Inherent',
    effect: 'Injuries automatically worsen by one level if not stabilized within the round',
  },
  {
    id: 'tag-devastating',
    label: 'Devastating',
    category: 'Inherent',
    description: 'Particularly deadly with critical hits',
    effect: '+{x} damage per Raise',
    variable: { min: 6, max: 20, default: 6, step: 2 },
  },
  {
    id: 'tag-suppressive',
    label: 'Suppressive',
    category: 'Inherent',
    effect: 'Designated zone causes -2 to all actions for targets within, even without hitting them',
  },
  {
    id: 'tag-scatter',
    label: 'Scatter',
    category: 'Inherent',
    description: 'Shotgun-style spread',
    effect: '+2 Magnitude at Touch/Close range; -2 Magnitude at Medium+ range',
  },
  {
    id: 'tag-melta',
    label: 'Melta',
    category: 'Inherent',
    description: 'Short-range high-penetration weapon',
    effect: 'Double Pen out to Short range',
  },
  {
    id: 'tag-tearing',
    label: 'Tearing',
    category: 'Inherent',
    description: 'Weapon tears flesh for maximum damage',
    effect: 'Reroll damage Magnitude; wielder keeps the higher result',
  },
  {
    id: 'tag-twin-linked',
    label: 'Twin-Linked',
    category: 'Inherent',
    description: 'Paired weapons linked to fire together',
    effect: 'Reroll failed attack rolls; may fire both barrels/systems as one action',
  },
  {
    id: 'tag-storm',
    label: 'Storm',
    category: 'Inherent',
    description: 'High rate of fire weapon',
    effect: 'Doubles shots per attack action; +2 Magnitude when firing full capacity',
  },
  // === Craftsmanship ===
  {
    id: 'tag-accurate',
    label: 'Accurate',
    category: 'Craftsmanship',
    effect: '+2 to aim, +2 to damage if a Raise is scored',
  },
  {
    id: 'tag-balanced',
    label: 'Balanced',
    category: 'Craftsmanship',
    effect: '+2 to parry',
  },
  {
    id: 'tag-razor-sharp',
    label: 'Razor Sharp',
    category: 'Craftsmanship',
    effect: 'Doubles penetration on a hit with a Raise',
  },
  {
    id: 'tag-reliable',
    label: 'Reliable',
    category: 'Craftsmanship',
    effect: 'Does not jam',
  },
  {
    id: 'tag-silent',
    label: 'Silent',
    category: 'Craftsmanship',
    effect: 'Makes no sound when fired/striking',
  },
  {
    id: 'tag-intimidating',
    label: 'Intimidating',
    category: 'Craftsmanship',
    effect: 'Merely displaying it causes nonlethal Spirit damage (fear) to witnesses',
  },
  {
    id: 'tag-fragile',
    label: 'Fragile',
    category: 'Craftsmanship',
    effect: 'Breaks on critical failure (fumble); requires repair/replacement',
  },
  {
    id: 'tag-inaccurate',
    label: 'Inaccurate',
    category: 'Craftsmanship',
    description: 'Poorly balanced or inherently uncontrollable trajectory (negative)',
    effect: 'Cannot aim; -2 to ranged attacks',
  },
  {
    id: 'tag-unbalanced',
    label: 'Unbalanced',
    category: 'Craftsmanship',
    effect: '-2 to parry attempts',
  },
  {
    id: 'tag-unreliable',
    label: 'Unreliable',
    category: 'Craftsmanship',
    effect: 'Jams if all 1s and 2s are rolled',
  },
  {
    id: 'tag-recoil',
    label: 'Recoil',
    category: 'Craftsmanship',
    description: 'Poor recoil management (negative)',
    effect: '-2 to attack if wielder is moving, prone, or firing one-handed without support',
  },
  {
    id: 'tag-overheats',
    label: 'Overheats',
    category: 'Craftsmanship',
    description: 'Overheats on failure (negative)',
    effect: 'If highest damge die explodes, weapon deals Magnitude 2 Form-Burning to wielder unless dropped',
  },

  // === Enchantment ===
  {
    id: 'tag-burning',
    label: 'Burning',
    category: 'Enchantment',
    description: 'Sets targets ablaze; X is the Magnitude of ongoing fire damage',
    effect: 'Target takes Mag {x} Form-Burning damage each round until extinguished',
    variable: { min: 1, max: 11, default: 2, step: 1 },
  },
  {
    id: 'tag-dancing',
    label: 'Dancing',
    category: 'Enchantment',
    description: 'Weapon fights independently',
    effect: 'Can be commanded to attack independently while wielder takes other actions',
  },
  {
    id: 'tag-oathbound',
    label: 'Oathbound',
    category: 'Enchantment',
    effect: 'Bound to specific wielder; others take -4 to use it; returns if thrown away',
  },
  // Corrosive — update to cover Shattering (merged)
  {
    id: 'tag-corrosive',
    label: 'Corrosive',
    category: 'Enchantment',
    description: 'Degrades target armor on hit',
    effect: 'Reduces target\'s armor by {X} per hit (permanent until repaired)',
    variable: { min: 1, max: 224, default: 1 },
  },
  {
    id: 'tag-ghost-touch',
    label: 'Ghost Touch',
    category: 'Enchantment',
    effect: 'Can strike immaterial targets (those without Form aspect) as if they were physical',
  },
  {
    id: 'tag-gravitic',
    label: 'Gravitic',
    category: 'Enchantment',
    description: 'Gravity-manipulating weapon',
    effect: 'Increase damage equal to Armor value of location hit',
  },
  {
    id: 'tag-power-field',
    label: 'Power Field',
    category: 'Enchantment',
    description: 'Disruptive energy field around the weapon',
    effect: '3-in-4 chance to destroy a parried melee weapon',
  },
  {
    id: 'tag-thundering',
    label: 'Thundering',
    category: 'Enchantment',
    description: 'Deafening strikes',
    effect: 'Deafens target on Raise (cannot hear commands, -2 to Perception)',
  },
  {
    id: 'tag-bane',
    label: 'Bane',
    category: 'Enchantment',
    description: 'Specific enemy slayer',
    effect: '+2 damage and Raises occur on 3-point difference against specific creature type',
  },
  {
    id: 'tag-vorpal',
    label: 'Vorpal',
    category: 'Enchantment',
    description: 'Severing weapon that decapitates on precision strikes',
    effect: 'On 2+ Raises against targets with necks/heads, inflicts a ⚰️ Death Blow',
  },
  {
    id: 'tag-disruptive',
    label: 'Disruptive',
    category: 'Enchantment',
    effect: 'Target cannot use Surge for 1 round after being hit',
  },
  {
    id: 'tag-reloading',
    label: 'Self Loading',
    category: 'Enchantment',
    description: 'Weapon reloads/recharges automatically',
    effect: 'The reloading action takes place by itself at the weapon\'s reload rate',
  },
  // Concussive — update to cover Knockdown (merged)
  {
    id: 'tag-concussive',
    label: 'Concussive',
    category: 'Enchantment',
    description: 'Stunning or knocking force on impact',
    effect: 'On hit, target tests Willpower vs. TN {x} to avoid being stunned or knocked prone for one round per degree of failure',
    variable: { min: 4, max: 96, default: 4, step: 4 },
  },
  {
    id: 'tag-haywire',
    label: 'Haywire',
    category: 'Enchantment',
    description: 'Disrupts electronics and machines (40K)',
    effect: 'Against technological targets: +4 Magnitude and disables target\'s tech for d6 rounds',
  },
  {
    id: 'tag-returning',
    label: 'Returning',
    category: 'Enchantment',
    description: 'Returns to wielder when thrown',
    effect: 'After thrown attack, weapon returns to wielder\'s hand at end of round',
  },
  {
    id: 'tag-seeking',
    label: 'Seeking',
    category: 'Enchantment',
    description: 'Guided to target',
    effect: 'Reroll any missed attack; ignores cover penalties',
  },
  {
    id: 'tag-speed',
    label: 'Speed',
    category: 'Enchantment',
    description: 'Grants additional attacks',
    effect: 'Wielder may make one additional attack with this weapon per round (on bottom beat)',
  },
  {
    id: 'tag-holy',
    label: 'Holy',
    category: 'Enchantment',
    description: 'Blessed against evil',
    effect: '+1 to attack and Magnitude against evil-aligned or corrupted targets; glows in presence of undead',
  },
  {
    id: 'tag-unholy',
    label: 'Unholy',
    category: 'Enchantment',
    description: 'Cursed against good',
    effect: '+1 to attack and Magnitude against good-aligned or sacred targets; corrupts wielder with extended use',
  },
  {
    id: 'tag-wounding',
    label: 'Wounding',
    category: 'Enchantment',
    description: 'Causes persistent bleeding',
    effect: 'Target loses 1 additional Injury level per round until healed (Flesh-Bleeding persists)',
  },
  {
    id: 'tag-guardian',
    label: 'Guardian',
    category: 'Enchantment',
    description: 'Protective when wielded',
    effect: '+2 to Resistance when wielded but not used to attack this round',
  },
  {
    id: 'tag-distance',
    label: 'Distance',
    category: 'Enchantment',
    description: 'Extended throwing range',
    effect: 'Doubles thrown range for this weapon (e.g., Short becomes Medium)',
  },
  {
    id: 'tag-felling',
    label: 'Felling',
    category: 'Enchantment',
    description: 'Cuts through dense tissue and bone with ease',
    effect: 'Reduces target\'s Resistance by {x} for damage reduction from this weapon',
    variable: { min: 4, max: 20, default: 4, step: 4 },
  },
  {
    id: 'tag-lance',
    label: 'Lance',
    category: 'Enchantment',
    description: 'A focused beam of devastating energy, piercing armor with ease',
    effect: '+{x} to Pen per success',
    variable: { min: 1, max: 100, default: 2, step: 1 },
  },

  // === Supernatural ===
  {
    id: 'tag-force',
    label: 'Force',
    category: 'Supernatural',
    description: 'Psyker weapon, applies only if character possesses Psionics or any Magic Power',
    effect: 'If charged (1 action), next hit adds wielder\'s Willpower rank to Damage + 1 Damage point per 5 development points spent on Psionics or Magic',
  },
  {
    id: 'tag-null',
    label: 'Null',
    category: 'Supernatural',
    description: 'Suppresses supernatural effects',
    effect: 'Supernatural Powers used within Point Blank range roll tests and damage at -6',
  },
  {
    id: 'tag-soul-drinking',
    label: 'Soul-Drinking',
    category: 'Supernatural',
    effect: 'Kills restore 1 Injury level from the wielder\'s most injured aspect',
  },
  {
    id: 'tag-evolutionary',
    label: 'Evolutionary',
    category: 'Supernatural',
    description: 'Bio-adaptation',
    effect: 'After killing an enemy, gains +1 Magnitude vs that species until it adapts to a different species',
  },
  {
    id: 'tag-anarchic',
    label: 'Anarchic',
    category: 'Supernatural',
    description: 'Chaos-aligned',
    effect: '+2 against lawful/ordered beings (modrons, devils, Amberites)',
  },
  {
    id: 'tag-axiomatic',
    label: 'Axiomatic',
    category: 'Supernatural',
    description: 'Lawful-aligned',
    effect: '+2 against chaotic beings (demons, slaadi, Chaosites)',
  },
  {
    id: 'tag-shapeshifting',
    label: 'Shapeshifting',
    category: 'Supernatural',
    description: 'Weapon can change its form',
    effect: 'Wielder may shift weapon between forms (e.g., sword to spear to whip) as an action',
  },
  {
    id: 'tag-energy',
    label: 'Energy',
    category: 'Supernatural',
    description: 'Energy blade',
    effect: 'Cannot be physically parried (must Dodge or use energy barrier)',
  },

  // === Legendary ===
  {
    id: 'tag-shadow-adaptive',
    label: 'Shadow-Adaptive',
    category: 'Legendary',
    description: 'Adjusts to local physics',
    effect: 'Automatically adjusts to local Shadow laws; never suffers "foreign tech" penalties',
  },
  {
    id: 'tag-pattern',
    label: 'Pattern-Etched',
    category: 'Legendary',
    description: 'Etched with the Pattern',
    effect: 'Deals additional Mag {x} Spirit-Unmaking damage to anything without Pattern-blood; touch disrupts magic, Logrus, and Tarot',
    variable: { min: 1, max: 11, default: 4 },
  },
  {
    id: 'tag-logrus',
    label: 'Logrus-Imbued',
    category: 'Legendary',
    description: 'Weapon\'s surface ripples and flows with the Logrus',
    effect: 'Inflicts Primal Chaos cancer (Mag d{x} Form-Disintegration damage each round) until cured or Mag 1 is rolled. Touch disrupts magic, Logrus, and Tarot',
    variable: { min: 4, max: 10, default: 4,  step: 2, unit: 'd' },
  },
];

// === Category colors for UI ===

export interface TagColorSet {
  bg: string;
  text: string;
  border: string;
  hover: string;
  selectedBg: string;
}

export const TAG_CATEGORY_COLORS: Record<string, TagColorSet> = {
  Inherent: {
    bg: 'bg-sky-900/40',
    text: 'text-sky-300',
    border: 'border-sky-700',
    hover: 'hover:bg-sky-800/60',
    selectedBg: 'bg-sky-700/50',
  },
  Craftsmanship: {
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
    hover: 'hover:bg-emerald-800/60',
    selectedBg: 'bg-emerald-700/50',
  },
  Enchantment: {
    bg: 'bg-red-900/40',
    text: 'text-red-300',
    border: 'border-red-700',
    hover: 'hover:bg-red-800/60',
    selectedBg: 'bg-red-700/50',
  },
  Supernatural: {
    bg: 'bg-amber-900/40',
    text: 'text-amber-300',
    border: 'border-amber-700',
    hover: 'hover:bg-amber-800/60',
    selectedBg: 'bg-amber-700/50',
  },
  Legendary: {
    bg: 'bg-purple-900/40',
    text: 'text-purple-300',
    border: 'border-purple-700',
    hover: 'hover:bg-purple-800/60',
    selectedBg: 'bg-purple-700/50',
  },
};

export const DEFAULT_TAG_COLOR: TagColorSet = {
  bg: 'bg-slate-700/40',
  text: 'text-slate-300',
  border: 'border-slate-600',
  hover: 'hover:bg-slate-600/60',
  selectedBg: 'bg-slate-600/50',
};

export function getTagColor(category: string): TagColorSet {
  return TAG_CATEGORY_COLORS[category] || DEFAULT_TAG_COLOR;
}

// === Resolution utilities ===

export function resolveTag(
  tagId: string,
  customTags: WeaponTagDefinition[]
): WeaponTagDefinition | undefined {
  const libraryTag = WEAPON_TAG_LIBRARY.find(t => t.id === tagId);
  if (libraryTag) return libraryTag;

  return customTags.find(t => t.id === tagId);
}

export function resolveWeaponTags(
  tagIds: string[],
  customTags: WeaponTagDefinition[]
): WeaponTagDefinition[] {
  return tagIds
    .map(id => resolveTag(id, customTags))
    .filter((t): t is WeaponTagDefinition => t !== undefined);
}

// Deduplicate by label — prevents the "same tag, different ID" bug
export function findTagByLabel(
  label: string,
  customTags: WeaponTagDefinition[]
): WeaponTagDefinition | undefined {
  const normalized = label.toLowerCase().trim();

  const libraryMatch = WEAPON_TAG_LIBRARY.find(t => t.label.toLowerCase() === normalized);
  if (libraryMatch) return libraryMatch;

  return customTags.find(t => t.label.toLowerCase() === normalized);
}

// Merge tag sources, deduplicating by ID (library shadows custom)
export function mergeTags(
  ...sources: WeaponTagDefinition[][]
): WeaponTagDefinition[] {
  const seen = new Set<string>();
  const result: WeaponTagDefinition[] = [];
  for (const source of sources) {
    for (const tag of source) {
      if (!seen.has(tag.id)) {
        seen.add(tag.id);
        result.push(tag);
      }
    }
  }
  return result;
}

// Get categories present in a tag list, ordered by WEAPON_TAG_CATEGORIES with unknowns last
export function getOrderedCategories(tags: WeaponTagDefinition[]): string[] {
  const known = WEAPON_TAG_CATEGORIES.filter(cat =>
    tags.some(t => t.category === cat)
  );
  const unknown = [...new Set(tags.map(t => t.category))].filter(
    cat => !WEAPON_TAG_CATEGORIES.includes(cat as typeof WEAPON_TAG_CATEGORIES[number])
  );
  return [...known, ...unknown];
}

// === Variable / WeaponTagRef utilities ===

/**
 * Parse a legacy tagId string into a WeaponTagRef.
 * Accepts "tag-id" or "tag-id:7".
 * Returns { tagId, x } — x is undefined if no suffix.
 */
export function parseTagRef(id: string): WeaponTagRef {
  const idx = id.indexOf(':');
  if (idx === -1) return { tagId: id };
  const tagId = id.slice(0, idx);
  const xStr = id.slice(idx + 1);
  const x = parseInt(xStr, 10);
  return Number.isFinite(x) ? { tagId, x } : { tagId };
}

/**
 * Serialize a WeaponTagRef back to a string id.
 * Tags without a variable, or with x === undefined, produce bare ids.
 */
export function serializeTagRef(ref: WeaponTagRef): string {
  return ref.x === undefined ? ref.tagId : `${ref.tagId}:${ref.x}`;
}

/**
 * Convenience: convert a list of refs to legacy string ids (for components
 * that haven't been migrated yet). Preserves the colon-suffix format.
 */
export function refsToIds(refs: WeaponTagRef[]): string[] {
  return refs.map(serializeTagRef);
}

/**
 * Convenience: convert legacy string ids to refs.
 */
export function idsToRefs(ids: string[]): WeaponTagRef[] {
  return ids.map(parseTagRef);
}

/**
 * Given a tag definition and an optional x, produce the display label
 * with the variable interpolated. e.g. ("Felling", x=2) => "Felling (2)".
 * If the tag has no variable, returns label unchanged.
 */
export function formatTagLabel(
  def: WeaponTagDefinition,
  x?: number
): string {
  if (!def.variable || x === undefined) return def.label;
  const unit = def.variable.unit ?? '';
  return `${def.label} (${unit}${x})`;
}

/**
 * Given a tag definition and an optional x, produce the effect text with
 * any "{x}" placeholders replaced. Falls back to the bare effect if no
 * placeholder is present.
 */
export function formatTagEffect(
  def: WeaponTagDefinition,
  x?: number
): string | undefined {
  if (!def.effect) return undefined;
  if (x === undefined) return def.effect;
  return def.effect.replace(/\{x\}/g, String(x));
}

/**
 * Resolve a WeaponTagRef to its definition (library or custom) plus the
 * effective x value (uses variable.default if x is undefined).
 */
export function resolveTagRef(
  ref: WeaponTagRef,
  customTags: WeaponTagDefinition[]
): { def: WeaponTagDefinition; x?: number } | undefined {
  const def = resolveTag(ref.tagId, customTags);
  if (!def) return undefined;
  const x = ref.x ?? def.variable?.default;
  return { def, x };
}

/**
 * Normalize a list of WeaponTagRef so that tags without a variable have
 * x stripped, and tags with a variable have x defaulted if missing.
 * Useful before saving.
 */
export function normalizeTagRefs(refs: WeaponTagRef[]): WeaponTagRef[] {
  return refs.map(ref => {
    const def = WEAPON_TAG_LIBRARY.find(t => t.id === ref.tagId);
    if (!def?.variable) {
      return ref.x === undefined ? ref : { tagId: ref.tagId };
    }
    if (ref.x === undefined) {
      return { tagId: ref.tagId, x: def.variable.default };
    }
    const { min, max } = def.variable;
    const x = Math.max(min, Math.min(max, ref.x));
    return { tagId: ref.tagId, x };
  });
}