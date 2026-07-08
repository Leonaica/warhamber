import type { WeaponTagDefinition } from '../types/character';

export const WEAPON_TAG_CATEGORIES = [
  'Quality',
  'Flaw',
  'Material',
  'Origin',
  'Mechanical',
  'Narrative',
] as const;

export const WEAPON_TAG_LIBRARY: WeaponTagDefinition[] = [
  // === 40k Qualities ===
  {
    id: 'tag-accurate',
    label: 'Accurate',
    category: 'Quality',
    effect: '+10 to hit when taking a half action to aim',
  },
  {
    id: 'tag-balanced',
    label: 'Balanced',
    category: 'Quality',
    effect: '+10 to parry attempts',
  },
  {
    id: 'tag-devastating',
    label: 'Devastating',
    category: 'Quality',
    effect: 'Deals +1 damage for every 2 degrees of success on the hit',
  },
  {
    id: 'tag-flexible',
    label: 'Flexible',
    category: 'Quality',
    effect: 'Can be used in grapples without penalty',
  },
  {
    id: 'tag-lance',
    label: 'Lance',
    category: 'Quality',
    effect: 'Ignores armor at long range or beyond',
  },
  {
    id: 'tag-reliable',
    label: 'Reliable',
    category: 'Quality',
    effect: 'Jams only on a natural 00 (or equivalent critical failure)',
  },
  {
    id: 'tag-razor-sharp',
    label: 'Razor Sharp',
    category: 'Quality',
    effect: 'Doubles penetration on a hit with 3+ degrees of success',
  },
  {
    id: 'tag-tearing',
    label: 'Tearing',
    category: 'Quality',
    effect: 'Roll two damage dice, keep the higher result',
  },
  {
    id: 'tag-venom',
    label: 'Venom',
    category: 'Quality',
    effect: 'Delivers poison on a successful hit',
  },

  // === 40k Flaws ===
  {
    id: 'tag-clumsy',
    label: 'Clumsy',
    category: 'Flaw',
    effect: '-10 to parry attempts',
  },
  {
    id: 'tag-unbalanced',
    label: 'Unbalanced',
    category: 'Flaw',
    effect: '-10 to parry attempts',
  },
  {
    id: 'tag-unreliable',
    label: 'Unreliable',
    category: 'Flaw',
    effect: 'Jams on 91-00 (or equivalent near-miss range)',
  },

  // === D&D Materials ===
  {
    id: 'tag-silvered',
    label: 'Silvered',
    category: 'Material',
    description: 'Coated or alloyed with silver',
    effect: 'Deals full damage to creatures vulnerable to silver (lycanthropes, certain undead)',
  },
  {
    id: 'tag-cold-iron',
    label: 'Cold Iron',
    category: 'Material',
    description: 'Forged from cold-worked iron, worked without heat',
    effect: 'Bypasses damage resistance of fey and certain fiends',
  },
  {
    id: 'tag-adamantine',
    label: 'Adamantine',
    category: 'Material',
    description: 'Forged from adamantine alloy',
    effect: 'Treats all hits as criticals against objects; bypasses hardness',
  },
  {
    id: 'tag-mithral',
    label: 'Mithral',
    category: 'Material',
    description: 'Forged from mithral silver',
    effect: 'Half the weight of steel; non-magnetic; immune to rust',
  },

  // === Origin ===
  {
    id: 'tag-fremen-forged',
    label: 'Fremen-forged',
    category: 'Origin',
    description: 'Crafted by the Fremen of Arrakis',
    effect: 'Re-roll 1s on attack rolls in desert terrain',
  },
  {
    id: 'tag-adeptus-mechanicus',
    label: 'Adeptus Mechanicus',
    category: 'Origin',
    description: 'Sanctified by the Priests of Mars',
    effect: 'Counts as sanctified for purposes of affecting warp entities',
  },

  // === Mechanical (custom effects) ===
  {
    id: 'tag-plus2-aim',
    label: '+2 to aim',
    category: 'Mechanical',
    effect: '+2 bonus when taking an aim action',
  },

  // === Narrative ===
  {
    id: 'tag-power-field',
    label: 'Power Field',
    category: 'Narrative',
    description: 'Disruptive energy field around the weapon',
    effect: '3-in-4 chance to destroy a parried melee weapon',
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
  Quality: {
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
    hover: 'hover:bg-emerald-800/60',
    selectedBg: 'bg-emerald-700/50',
  },
  Flaw: {
    bg: 'bg-red-900/40',
    text: 'text-red-300',
    border: 'border-red-700',
    hover: 'hover:bg-red-800/60',
    selectedBg: 'bg-red-700/50',
  },
  Material: {
    bg: 'bg-sky-900/40',
    text: 'text-sky-300',
    border: 'border-sky-700',
    hover: 'hover:bg-sky-800/60',
    selectedBg: 'bg-sky-700/50',
  },
  Origin: {
    bg: 'bg-purple-900/40',
    text: 'text-purple-300',
    border: 'border-purple-700',
    hover: 'hover:bg-purple-800/60',
    selectedBg: 'bg-purple-700/50',
  },
  Mechanical: {
    bg: 'bg-amber-900/40',
    text: 'text-amber-300',
    border: 'border-amber-700',
    hover: 'hover:bg-amber-800/60',
    selectedBg: 'bg-amber-700/50',
  },
  Narrative: {
    bg: 'bg-slate-700/40',
    text: 'text-slate-300',
    border: 'border-slate-600',
    hover: 'hover:bg-slate-600/60',
    selectedBg: 'bg-slate-600/50',
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