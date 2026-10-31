import type { WeaponTagDefinition, WeaponTagRef, TagValueSource, TagResolveContext, AttributeName } from '../types/character';
import { abbreviateAttribute } from './aspectAttributes';

export const WEAPON_TAG_CATEGORIES = [
  'Damage & Injury',
  'Armor & Penetration',
  'Tactical & Control',
  'Area & Delivery',
  'Range & Movement',
  'Combat Handling',
  'Material',
  'Alignment',
  'Metaphysical',
  'Reliability & Maintenance',
  'Utility',
] as const;

const SOURCE_LABELS: Record<Exclude<TagValueSource['kind'], 'attributeRank'>, string> = {
  immaterialSize: 'Immaterial Size',
  size: 'Material Size',
  surge: 'Surge',
  stuff: 'Stuff',
};

export function describeTagSource(src: TagValueSource): string {
  return src.kind === 'attributeRank' ? `${src.attribute} Rank` : SOURCE_LABELS[src.kind];
}

const SOURCE_ABBR: Record<Exclude<TagValueSource['kind'], 'attributeRank'>, string> = {
  immaterialSize: 'ImmSz',
  size: 'Size',
  surge: 'Surge',
  stuff: 'Stuff',
};

export function tagSourceAbbr(src: TagValueSource): string {
  return src.kind === 'attributeRank' ? abbreviateAttribute(src.attribute) : SOURCE_ABBR[src.kind];
}

/** Sensible bounds + fallback for a freshly chosen source. */
export function defaultBoundsForSource(src: TagValueSource) {
  switch (src.kind) {
    case 'attributeRank': return { min: 0, max: 20, default: 8 };
    case 'immaterialSize': return { min: -2, max: 6, default: 0 };
    case 'size': return { min: -3, max: 6, default: 0 };
    case 'surge': return { min: 0, max: 60, default: 0 };
    case 'stuff': return { min: -100, max: 100, default: 0 };
  }
}

/** Decode a `<select>` value into a TagValueSource; '' means a fixed value. */
export function parseSourceKey(key: string): TagValueSource | undefined {
  if (!key) return undefined;
  if (key.startsWith('attr:')) {
    return { kind: 'attributeRank', attribute: key.slice(5) as AttributeName };
  }
  return { kind: key as 'immaterialSize' | 'size' | 'surge' | 'stuff' };
}

export const WEAPON_TAG_LIBRARY: WeaponTagDefinition[] = [
  // === Damage & Injury ===
  {
    id: 'tag-burning',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Mag X Form-Annihilation each round until extinguished" }],
    label: 'Burning',
    category: 'Damage & Injury',
    description: 'Sets targets ablaze; X is the Magnitude of ongoing fire damage',
    effect: 'Target takes Mag {x} Form-Annihilation damage each round until extinguished',
    variable: { min: 1, max: 11, default: 2, step: 1 },
  },
  {
    id: 'tag-crippling',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Injuries worsen 1 step each time Surge is used" }],
    label: 'Crippling',
    category: 'Damage & Injury',
    description: 'Injuries worsen with exertion',
    effect: 'Injuries caused by this weapon worsen 1 step each time Surge is used',
  },
  {
    id: 'tag-cruel',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Injuries worsen 1 level if not stabilised this round" }],
    label: 'Cruel',
    category: 'Damage & Injury',
    description: 'Injuries worsen rapidly without treatment',
    effect: 'Injuries automatically worsen by one level if not stabilized within the round',
  },
  {
    id: 'tag-devastating',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'raiseDamage', op: 'set', amount: 'x' }],
    label: 'Devastating',
    category: 'Damage & Injury',
    description: 'Particularly deadly with critical hits',
    effect: '+{x} damage per Raise',
    variable: { min: 6, max: 20, default: 6, step: 2 },
  },
  {
    id: 'tag-nonlethal',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Injuries lead to unconsciousness, not death" }],
    label: 'Non-Lethal',
    category: 'Damage & Injury',
    description: 'Designed to incapacitate rather than kill',
    effect: 'Injuries lead to unconsciousness rather than death',
  },
  {
    id: 'tag-soul-drinking',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Kills restore 1 Injury level from the most injured aspect" }],
    label: 'Soul-Drinking',
    category: 'Damage & Injury',
    description: 'Consumes the souls of the slain',
    effect: 'Kills restore 1 Injury level from the wielder\'s most injured aspect',
  },
  {
    id: 'tag-strength-bonus',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'damageModifier', op: 'add', amount: 'strength' }],
    label: 'Strength Bonus',
    category: 'Damage & Injury',
    description: 'Damage depends in part on the Strength of the user',
    effect: 'Add {x} (the wielder\'s Strength Rank) as a Damage Modifier',
    variable: { min: 0, max: 20, default: 8, sourceLabel: 'Str',
    derivedFrom: { kind: 'attributeRank', attribute: 'Strength' } },
  },
  {
    id: 'tag-tearing',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'reroll', op: 'flag' }],
    label: 'Tearing',
    category: 'Damage & Injury',
    description: 'Weapon tears flesh for maximum damage',
    effect: 'Reroll damage Magnitude; wielder keeps the higher result',
  },
  {
    id: 'tag-vampiric',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Heal 1 Injury level per 2 levels inflicted" }],
    label: 'Vampiric',
    category: 'Damage & Injury',
    description: 'Drains life on every hit',
    effect: 'Wielder heals 1 Injury level in their most injured Aspect for every 2 Injury levels inflicted by this weapon. Triggers on any damage, not just kills',
  },
  {
    id: 'tag-wounding',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Target loses 1 Injury level per round until healed" }],
    label: 'Wounding',
    category: 'Damage & Injury',
    description: 'Causes persistent bleeding',
    effect: 'Target loses 1 additional Injury level per round until healed (persistent Flesh damage)',
  },

  {
    id: 'tag-vorpal',
    kind: 'conditional',
    defaultActive: true,
    effects: [{ stage: 'override', op: 'set', target: 'woundLevel', amount: 'deathBlow', when: { raisesAtLeast: 2 }, note: 'Necks are severed' }],
    label: 'Vorpal',
    category: 'Damage & Injury',
    description: 'Edge honed to sever necks',
    effect: 'Necks are severed: inflicts a Death Blow on 2+ Raises',
  },
  {
    id: 'tag-haywire',
    kind: 'arithmetic',
    effects: [{ stage: 'magnitude', op: 'add', amount: 4, note: 'Against technological targets' }],
    label: 'Haywire',
    category: 'Damage & Injury',
    description: 'Disrupts electronics and machine systems',
    effect: 'Increase Mag by 4 against technological targets; struck technology is disabled until repaired',
  },
  // === Armor & Penetration ===
  {
    id: 'tag-corrosive',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Reduce opponent armor by X after the hit, permanently" }],
    label: 'Corrosive',
    category: 'Armor & Penetration',
    description: 'Degrades target armor on hit',
    effect: 'Reduces target\'s armor by {x} per hit (permanent until repaired)',
    variable: { min: 1, max: 224, default: 1 },
  },
  {
    id: 'tag-felling',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'resistance', op: 'subtract', amount: 'x' }],
    label: 'Felling',
    category: 'Armor & Penetration',
    description: 'Cuts through dense tissue and bone with ease',
    effect: 'Reduces target\'s Resistance by {x} for damage reduction from this weapon',
    variable: { min: 4, max: 20, default: 4, step: 4 },
  },
  {
    id: 'tag-gravitic',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'damageModifier', op: 'add', amount: 'armorValue' }],
    label: 'Gravitic',
    category: 'Armor & Penetration',
    description: 'Gravity-manipulating weapon',
    effect: 'Increase damage equal to Armor value of location hit',
  },
  {
    id: 'tag-lance',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'penetration', op: 'add', amount: 'x', per: 'success' }],
    label: 'Lance',
    category: 'Armor & Penetration',
    description: 'A focused beam of devastating energy, piercing armor with ease',
    effect: '+{x} to Pen per success',
    variable: { min: 1, max: 100, default: 2, step: 1 },
  },
  {
    id: 'tag-melta',
    kind: 'arithmetic',
    effects: [{ stage: 'penetration', op: 'multiply', amount: 2 }],
    label: 'Melta',
    category: 'Armor & Penetration',
    description: 'Short-range high-penetration weapon',
    effect: 'Double Pen out to Short range',
  },
  {
    id: 'tag-razor-sharp',
    kind: 'conditional',
    defaultActive: true,
    effects: [{ stage: 'penetration', op: 'multiply', amount: 2, when: { raisesAtLeast: 1 } }],
    label: 'Razor Sharp',
    category: 'Armor & Penetration',
    description: 'Exceptionally sharp edge',
    effect: 'Doubles penetration on a hit with a Raise',
  },

  // === Tactical & Control ===
  {
    id: 'tag-binding',
    kind: 'secondTest',
    effects: [{ stage: 'flag', op: 'flag', note: "Toughness vs TN X or frozen" }],
    label: 'Binding',
    category: 'Tactical & Control',
    description: 'Freezing or immobilizing effect on impact',
    effect: 'On hit, target tests Toughness vs. TN {x} or be frozen in place for one round per degree of failure. Frozen targets cannot move, act, or be moved, but remain aware',
    variable: { min: 4, max: 96, default: 4, step: 4 },
  },
  {
    id: 'tag-compelling',
    kind: 'secondTest',
    effects: [{ stage: 'flag', op: 'flag', note: "Willpower vs TN X or compulsion implanted" }],
    label: 'Compelling',
    category: 'Tactical & Control',
    description: 'Implants a compulsion on hit',
    effect: 'On hit, target tests Willpower vs. TN {x} or have a simple compulsion implanted ("flee," "surrender," "drop your weapon") that feels like their own urge. Lasts until resisted or scene ends',
    variable: { min: 4, max: 96, default: 8, step: 4 },
  },
  {
    id: 'tag-concussive',
    kind: 'secondTest',
    effects: [{ stage: 'flag', op: 'flag', note: "Willpower vs TN X or stunned/prone" }],
    label: 'Concussive',
    category: 'Tactical & Control',
    description: 'Stunning or knocking force on impact',
    effect: 'On hit, target tests Willpower vs. TN {x} to avoid being stunned or knocked prone for one round per degree of failure',
    variable: { min: 4, max: 96, default: 4, step: 4 },
  },
  {
    id: 'tag-disruptive',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Target cannot Surge for 1 round" }],
    label: 'Disruptive',
    category: 'Tactical & Control',
    description: 'Disrupts the target\'s flow of energy',
    effect: 'Target cannot use Surge for 1 round after being hit',
  },
  {
    id: 'tag-ensnaring',
    kind: 'secondTest',
    effects: [{ stage: 'flag', op: 'flag', note: "Test vs TN X each action or stay immobilised" }],
    label: 'Ensnaring',
    category: 'Tactical & Control',
    description: 'Entraps targets',
    effect: 'Target must test each action to free themselves vs. TN {x} or remain immobilized',
    variable: { min: 4, max: 96, default: 4, step: 4 },
  },
  {
    id: 'tag-intimidating',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Nonlethal Mag X Mind-Shattering to witnesses" }],
    label: 'Intimidating',
    category: 'Tactical & Control',
    description: 'Frightening to behold',
    effect: 'Inflicts nonlethal Mag {x} Mind-Shattering (fear) to witnesses when brandished',
    variable: { min: 1, max: 11, default: 1, step: 1 },
  },
  {
    id: 'tag-suppressive',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "-2 to all actions in the zone" }],
    label: 'Suppressive',
    category: 'Tactical & Control',
    description: 'Suppresses enemy action in an area',
    effect: 'Designated zone causes -2 to all actions for targets within, even without hitting them',
  },
  {
    id: 'tag-thundering',
    kind: 'conditional',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', when: { raisesAtLeast: 1 }, note: 'Deafened: cannot hear commands, -2 Perception' }],
    label: 'Thundering',
    category: 'Tactical & Control',
    description: 'Deafening strikes',
    effect: 'Deafens target on Raise (cannot hear commands, -2 to Perception)',
  },

  // === Area & Delivery ===
  {
    id: 'tag-blast',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Hits all targets within Xm; roll separately" }],
    label: 'Blast',
    category: 'Area & Delivery',
    description: 'Area-effect weapon; X is the blast radius in meters',
    effect: 'Attack hits all targets within {x}m of impact point; roll separately for each',
    variable: { min: 1, max: 100, default: 2, step: 1 },
  },
  {
    id: 'tag-indirect',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "No line of sight needed; target gains +2 to Dodge" }],
    label: 'Indirect',
    category: 'Area & Delivery',
    description: 'Can fire indirectly over obstacles',
    effect: 'Can fire at targets without line of sight using a spotter or arc calculation; target gains +2 to dodge if they see it coming',
  },
  {
    id: 'tag-scatter',
    kind: 'arithmetic',
    effects: [{ stage: 'magnitude', op: 'add', amount: 2, child: 'close', childLabel: 'Close', note: 'Touch/Close' }, { stage: 'magnitude', op: 'subtract', amount: 2, child: 'far', childLabel: 'Medium+', note: 'Medium+' }],
    label: 'Scatter',
    category: 'Area & Delivery',
    description: 'Shotgun-style spread',
    effect: '+2 Magnitude at Touch/Close range; -2 Magnitude at Medium+ range',
  },
  {
    id: 'tag-seeking',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Reroll a missed attack; ignores cover" }],
    label: 'Seeking',
    category: 'Area & Delivery',
    description: 'Guided to target',
    effect: 'Reroll any missed attack; ignores cover penalties',
  },
  {
    id: 'tag-spray',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Cone; all targets, roll separately" }],
    label: 'Spray',
    category: 'Area & Delivery',
    description: 'Cone attack affecting all targets in area',
    effect: 'Attack affects all targets in a cone from the wielder; roll separately for each. Cone extends to weapon\'s Range rank',
  },
  {
    id: 'tag-storm',
    kind: 'arithmetic',
    effects: [{ stage: 'magnitude', op: 'add', amount: 2, note: 'Firing full capacity' }],
    label: 'Storm',
    category: 'Area & Delivery',
    description: 'High rate of fire weapon',
    effect: 'Doubles shots per attack action; +2 Magnitude when firing full capacity',
  },
  {
    id: 'tag-sympathetic',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Attacks through a link; ignores armor and cover" }],
    label: 'Sympathetic',
    category: 'Area & Delivery',
    description: 'Attacks through symbolic or spiritual connections',
    effect: 'Weapon can attack through a symbolic or spiritual connection rather than striking directly. Wielder must possess a link (True Name, Tarot image, piece of flesh/hair, or established psychic connection). Attacks through a link ignore physical armor and cover but are resisted by spiritual defenses. Range is irrelevant',
  },
  {
    id: 'tag-twin-linked',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Reroll failed attacks" }],
    label: 'Twin-Linked',
    category: 'Area & Delivery',
    description: 'Paired weapons linked to fire together',
    effect: 'Reroll failed attack rolls; may fire both barrels/systems as one action',
  },

  // === Range & Movement ===
  {
    id: 'tag-distance',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Doubles thrown range" }],
    label: 'Distance',
    category: 'Range & Movement',
    description: 'Extended throwing range',
    effect: 'Doubles thrown range for this weapon (e.g., Short becomes Medium)',
  },
  {
    id: 'tag-returning',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Returns to hand at end of round" }],
    label: 'Returning',
    category: 'Range & Movement',
    description: 'Returns to wielder when thrown',
    effect: 'After thrown attack, weapon returns to wielder\'s hand at end of round',
  },
  {
    id: 'tag-speed',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "One extra attack per round" }],
    label: 'Speed',
    category: 'Range & Movement',
    description: 'Grants additional attacks',
    effect: 'Wielder may make one additional attack with this weapon per round (on bottom beat)',
  },
  {
    id: 'tag-throwing',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Can be thrown at Short range" }],
    label: 'Throwing',
    category: 'Range & Movement',
    description: 'Melee weapon balanced for throwing',
    effect: 'Melee weapon can be thrown at Short range without penalty',
  },

  // === Combat Handling ===
  {
    id: 'tag-accurate',
    kind: 'conditional',
    effects: [{ stage: 'attack', op: 'add', amount: 2, when: { aiming: true } }, { stage: 'damageModifier', op: 'add', amount: 2, when: { raisesAtLeast: 1 } }],
    label: 'Accurate',
    category: 'Combat Handling',
    description: 'Well-balanced or precisely machined for accuracy',
    effect: '+2 to aim, +2 to damage if a Raise is scored',
  },
  {
    id: 'tag-balanced',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'parry', op: 'add', amount: 2 }],
    label: 'Balanced',
    category: 'Combat Handling',
    description: 'Well-balanced for parrying',
    effect: '+2 to parry',
  },
  {
    id: 'tag-clumsy',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'subtract', amount: 2, note: 'Tight spaces, grapples, prone' }],
    label: 'Clumsy',
    category: 'Combat Handling',
    description: 'Awkward to use in confined spaces',
    effect: '-2 to attack in tight spaces, grapples, or when prone',
  },
  {
    id: 'tag-cumbersome',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'attack', op: 'subtract', amount: 2 }],
    label: 'Cumbersome',
    category: 'Combat Handling',
    description: 'Heavy or awkward to wield',
    effect: '-2 to physical actions while wielded due to weight/awkwardness',
  },
  {
    id: 'tag-defensive',
    kind: 'arithmetic',
    effects: [{ stage: 'parry', op: 'add', amount: 3 }, { stage: 'attack', op: 'subtract', amount: 2 }],
    label: 'Defensive',
    category: 'Combat Handling',
    description: 'Shields, bucklers, and the like',
    effect: '+3 to parry, -2 to attack',
  },
  {
    id: 'tag-energy',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'parry', op: 'deny', note: 'Cannot be physically parried' }],
    label: 'Energy',
    category: 'Combat Handling',
    description: 'Energy blade',
    effect: 'Cannot be physically parried (must Dodge or use energy barrier)',
  },
  {
    id: 'tag-flexible',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'parry', op: 'deny' }],
    label: 'Flexible',
    category: 'Combat Handling',
    description: 'Made of linked metal, rope, or other non-rigid materials that deny defensive counters',
    effect: 'Cannot be parried',
  },
  {
    id: 'tag-guardian',
    kind: 'arithmetic',
    effects: [{ stage: 'resistance', op: 'add', amount: 2, note: 'When not attacking this round' }],
    label: 'Guardian',
    category: 'Combat Handling',
    description: 'Protective when wielded',
    effect: '+2 to Resistance when wielded but not used to attack this round',
  },
  {
    id: 'tag-power-field',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "3-in-4 chance to destroy a parried weapon" }],
    label: 'Power Field',
    category: 'Combat Handling',
    description: 'Disruptive energy field around the weapon',
    effect: '3-in-4 chance to destroy a parried melee weapon',
  },
  {
    id: 'tag-recoil',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'subtract', amount: 2, note: 'Moving, prone, or one-handed' }],
    label: 'Recoil',
    category: 'Combat Handling',
    description: 'Poor recoil management (negative)',
    effect: '-2 to attack if wielder is moving, prone, or firing one-handed without support',
  },
  {
    id: 'tag-unbalanced',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'parry', op: 'subtract', amount: 2 }],
    label: 'Unbalanced',
    category: 'Combat Handling',
    description: 'Poorly balanced for defensive use',
    effect: '-2 to parry attempts',
  },

  {
    id: 'tag-inaccurate',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'attack', op: 'subtract', amount: 2, note: 'Cannot aim' }],
    label: 'Inaccurate',
    category: 'Combat Handling',
    description: 'Unwieldy to aim (negative)',
    effect: 'Cannot aim; -2 to ranged attacks',
  },
  // === Material ===
  {
    id: 'tag-adamantine',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "All hits count as criticals against objects" }],
    label: 'Adamantine',
    category: 'Material',
    description: 'Forged from adamantine alloy',
    effect: 'Treats all hits as criticals against objects; bypasses hardness',
  },
  {
    id: 'tag-cold-iron',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Bypasses fey and fiend resistance" }],
    label: 'Cold Iron',
    category: 'Material',
    description: 'Forged from cold-worked iron, worked without heat',
    effect: 'Bypasses damage resistance of fey and certain fiends',
  },
  {
    id: 'tag-mithral',
    kind: 'flavor',
    label: 'Mithral',
    category: 'Material',
    description: 'Forged from mithral silver',
    effect: 'Half the weight of steel; non-magnetic; immune to rust',
  },
  {
    id: 'tag-silvered',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Full damage to silver-vulnerable creatures" }],
    label: 'Silvered',
    category: 'Material',
    description: 'Coated or alloyed with silver',
    effect: 'Deals full damage to creatures vulnerable to silver (lycanthropes, certain undead)',
  },

  // === Alignment ===
  {
    id: 'tag-anarchic',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'add', amount: 2, note: 'vs lawful/ordered' }],
    label: 'Anarchic',
    category: 'Alignment',
    description: 'Chaos-aligned',
    effect: '+2 against lawful/ordered beings (modrons, devils, Amberites)',
  },
  {
    id: 'tag-axiomatic',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'add', amount: 2, note: 'vs chaotic' }],
    label: 'Axiomatic',
    category: 'Alignment',
    description: 'Lawful-aligned',
    effect: '+2 against chaotic beings (demons, slaadi, Chaosites)',
  },
  {
    id: 'tag-bane',
    kind: 'arithmetic',
    effects: [{ stage: 'damageModifier', op: 'add', amount: 2, child: 'damage', childLabel: '+2 dmg' }, { stage: 'raises', op: 'multiply', amount: 2, child: 'raises', childLabel: 'x2 raises' }],
    label: 'Bane',
    category: 'Alignment',
    description: 'Specific enemy slayer',
    effect: '+2 damage and double the number of Raises against a specific creature type',
  },
  {
    id: 'tag-holy',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'add', amount: 1, note: 'vs evil/corrupted' }, { stage: 'magnitude', op: 'add', amount: 1 }],
    label: 'Holy',
    category: 'Alignment',
    description: 'Blessed against evil',
    effect: '+1 to attack and Magnitude against evil-aligned or corrupted targets; glows in presence of undead',
  },
  {
    id: 'tag-unholy',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'add', amount: 1, note: 'vs good/sacred' }, { stage: 'magnitude', op: 'add', amount: 1 }],
    label: 'Unholy',
    category: 'Alignment',
    description: 'Cursed against good',
    effect: '+1 to attack and Magnitude against good-aligned or sacred targets; corrupts wielder with extended use',
  },

  // === Metaphysical ===
  {
    id: 'tag-emprean',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Damage counts as Spirit-type" }],
    label: 'Empyrean',
    category: 'Metaphysical',
    description: 'Channels the Sea of Souls directly',
    effect: 'Damage counts as Spirit-type for purposes of bypassing spiritual defenses and striking immaterial targets. A weapon with both (Empyrean) and (Ghost Touch) can strike any target, material or immaterial, through any defense',
  },
  {
    id: 'tag-force',
    kind: 'arithmetic',
    effects: [{ stage: 'damageModifier', op: 'add', amount: 'presence', note: 'Once charged' }],
    label: 'Force',
    category: 'Metaphysical',
    description: 'Psyker weapon, applies only if character possesses Psionics or any Magic Power',
    effect: 'Once charged (1 action), adds wielder\'s Presence rank to Damage. Weapon remains charged until put away or sheathed',
    variable: { min: 0, max: 20, default: 8, sourceLabel: 'Pre',
    derivedFrom: { kind: 'attributeRank', attribute: 'Presence' } },
  },
  {
    id: 'tag-ghost-touch',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Strikes immaterial targets" }],
    label: 'Ghost Touch',
    category: 'Metaphysical',
    description: 'Can strike immaterial targets',
    effect: 'Can strike immaterial targets (those without Form aspect) as if they were physical',
  },
  {
    id: 'tag-null',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Powers within Point Blank roll at -6" }],
    label: 'Null',
    category: 'Metaphysical',
    description: 'Suppresses supernatural effects',
    effect: 'Supernatural Powers used within Point Blank range roll tests and damage at -6',
  },
  {
    id: 'tag-pattern',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'magnitude', op: 'add', amount: 4, child: 'mag', childLabel: '+4 Mag' }],
    label: 'Pattern-Etched',
    category: 'Metaphysical',
    description: 'Etched with the true Pattern',
    effect: 'Destructive damage (+4 Mag) to any supernatural or chaotic creature; touch overloads magic and combusts Logrus',
  },
  {
    id: 'tag-logrus',
    kind: 'arithmetic',
    defaultActive: true,
    effects: [{ stage: 'penetration', op: 'set', amount: 224, child: 'pen', childLabel: 'Pen 224', note: 'Ignores Shadow armor' }, { stage: 'magnitude', op: 'add', amount: 2, child: 'mag', childLabel: '+2 Mag' }],
    label: 'Logrus',
    category: 'Metaphysical',
    description: 'Weapon\'s surface twists and coils with the Logrus',
    effect: 'Ignores Shadow armor (Pen 224); deadly damage (+2 Mag) to anything of Shadow; touch dissolves magic.',
  },
  {
    id: 'tag-primal-chaos',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Mag X Form-Annihilation each round" }],
    label: 'Primal Chaos',
    category: 'Metaphysical',
    description: 'Weapon is infused with raw, undifferentiated potential',
    effect: 'Inflicts Mag {x} Form-Annihilation damage each round as target\'s material reality dissolves.',
    variable: { min: 1, max: 11, default: 4, step: 1 },
  },
  {
    id: 'tag-shapeshifting',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Change form as an action" }],
    label: 'Shapeshifting',
    category: 'Metaphysical',
    description: 'Weapon can change its form',
    effect: 'Wielder may shift weapon between forms (e.g., sword to spear to whip) as an action',
  },
  {
    id: 'tag-transmuting',
    kind: 'secondTest',
    effects: [{ stage: 'flag', op: 'flag', note: "Toughness vs TN X or struck material transforms" }],
    label: 'Transmuting',
    category: 'Metaphysical',
    description: 'Transforms struck material on hit',
    effect: 'On hit, target tests Toughness vs. TN {x} or have the struck material transformed (flesh-to-stone, metal-to-glass, bone-to-ice). Nature of transformation depends on weapon. Transmuted material gains properties of new form. Persists until reversed or scene ends',
    variable: { min: 4, max: 96, default: 8, step: 4 },
  },
  {
    id: 'tag-true-name',
    kind: 'arithmetic',
    effects: [{ stage: 'resistance', op: 'set', amount: 4, child: 'resist', childLabel: 'Resist 4' }, { stage: 'armor', op: 'set', amount: 0, child: 'armor', childLabel: 'Armor 0' }],
    label: 'True Name',
    category: 'Metaphysical',
    description: 'Weapon is attuned to the True Name of a specific being',
    effect: 'When used against that being, damage bypasses all armor and target\'s Resist attributes reduced to flat TN 4. Cannot be used against anyone else. If target is slain by this weapon, their soul is consumed and cannot be restored by normal means',
  },

  // === Reliability & Maintenance ===
  {
    id: 'tag-fragile',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Breaks on a critical failure" }],
    label: 'Fragile',
    category: 'Reliability & Maintenance',
    description: 'Easily broken on mishandling',
    effect: 'Breaks on critical failure (fumble); requires repair/replacement',
  },
  {
    id: 'tag-overheats',
    kind: 'narrative',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', note: "Overheats on repeated use; GM adjudicates" }],
    label: 'Overheats',
    category: 'Reliability & Maintenance',
    description: 'Overheats on failure (negative)',
    effect: 'If highest damage die explodes, weapon deals Magnitude 2 Form-Annihilation to wielder unless dropped',
  },
  {
    id: 'tag-reliable',
    kind: 'flavor',
    label: 'Reliable',
    category: 'Reliability & Maintenance',
    description: 'Well-made and dependable',
    effect: 'Does not jam',
  },
  {
    id: 'tag-reloading',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Reloads itself at its reload rate" }],
    label: 'Self Loading',
    category: 'Reliability & Maintenance',
    description: 'Weapon reloads/recharges automatically',
    effect: 'The reloading action takes place by itself at the weapon\'s reload rate',
  },
  {
    id: 'tag-unreliable',
    kind: 'conditional',
    defaultActive: true,
    effects: [{ stage: 'flag', op: 'flag', when: { allLow: true }, note: 'Jams - weapon unusable until cleared' }],
    label: 'Unreliable',
    category: 'Reliability & Maintenance',
    description: 'Prone to malfunction',
    effect: 'Jams if all 1s and 2s are rolled',
  },

  // === Utility ===
  {
    id: 'tag-dancing',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Attacks independently on command" }],
    label: 'Dancing',
    category: 'Utility',
    description: 'Weapon fights independently',
    effect: 'Can be commanded to attack independently while wielder takes other actions',
  },
  {
    id: 'tag-evolutionary',
    kind: 'arithmetic',
    effects: [{ stage: 'magnitude', op: 'add', amount: 1, note: 'vs a species already killed' }],
    label: 'Evolutionary',
    category: 'Utility',
    description: 'Bio-adaptation',
    effect: 'After killing an enemy, gains +1 Magnitude vs that species until it adapts to a different species',
  },
  {
    id: 'tag-integrated',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Cannot be disarmed" }],
    label: 'Integrated',
    category: 'Utility',
    description: 'Built into the body',
    effect: 'Cannot be disarmed; built into body/limb/nerve interface',
  },
  {
    id: 'tag-manifestation',
    kind: 'narrative',
    effects: [{ stage: 'flag', op: 'flag', note: "Exists when called" }],
    label: 'Manifestation',
    category: 'Utility',
    description: 'Exists only when manifested',
    effect: 'Weapon forms and dissapates at will',
  },
  {
    id: 'tag-oathbound',
    kind: 'arithmetic',
    effects: [{ stage: 'attack', op: 'subtract', amount: 4, note: 'When wielded by someone else' }],
    label: 'Oathbound',
    category: 'Utility',
    description: 'Bound to a specific wielder',
    effect: 'Bound to specific wielder; others take -4 to use it; returns if thrown away',
  },
  {
    id: 'tag-shadow-adaptive',
    kind: 'flavor',
    label: 'Shadow-Adaptive',
    category: 'Utility',
    description: 'Adjusts to local physics',
    effect: 'Automatically adjusts to local Shadow laws; never suffers "foreign tech" penalties',
  },
  {
    id: 'tag-silent',
    kind: 'flavor',
    label: 'Silent',
    category: 'Utility',
    description: 'Makes no sound when used',
    effect: 'Makes no sound when fired/striking',
  },
];

// === Category colors for UI ===

interface TagColorSet {
  bg: string;
  text: string;
  border: string;
  hover: string;
  selectedBg: string;
}

const TAG_CATEGORY_COLORS: Record<string, TagColorSet> = {
  'Damage & Injury': {
    bg: 'bg-red-900/40',
    text: 'text-red-300',
    border: 'border-red-700',
    hover: 'hover:bg-red-800/60',
    selectedBg: 'bg-red-700/50',
  },
  'Armor & Penetration': {
    bg: 'bg-slate-900/40',
    text: 'text-slate-300',
    border: 'border-slate-700',
    hover: 'hover:bg-slate-800/60',
    selectedBg: 'bg-slate-700/50',
  },
  'Tactical & Control': {
    bg: 'bg-amber-900/40',
    text: 'text-amber-300',
    border: 'border-amber-700',
    hover: 'hover:bg-amber-800/60',
    selectedBg: 'bg-amber-700/50',
  },
  'Area & Delivery': {
    bg: 'bg-orange-900/40',
    text: 'text-orange-300',
    border: 'border-orange-700',
    hover: 'hover:bg-orange-800/60',
    selectedBg: 'bg-orange-700/50',
  },
  'Range & Movement': {
    bg: 'bg-sky-900/40',
    text: 'text-sky-300',
    border: 'border-sky-700',
    hover: 'hover:bg-sky-800/60',
    selectedBg: 'bg-sky-700/50',
  },
  'Combat Handling': {
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-300',
    border: 'border-emerald-700',
    hover: 'hover:bg-emerald-800/60',
    selectedBg: 'bg-emerald-700/50',
  },
  'Material': {
    bg: 'bg-stone-900/40',
    text: 'text-stone-300',
    border: 'border-stone-700',
    hover: 'hover:bg-stone-800/60',
    selectedBg: 'bg-stone-700/50',
  },
  'Alignment': {
    bg: 'bg-purple-900/40',
    text: 'text-purple-300',
    border: 'border-purple-700',
    hover: 'hover:bg-purple-800/60',
    selectedBg: 'bg-purple-700/50',
  },
  'Metaphysical': {
    bg: 'bg-indigo-900/40',
    text: 'text-indigo-300',
    border: 'border-indigo-700',
    hover: 'hover:bg-indigo-800/60',
    selectedBg: 'bg-indigo-700/50',
  },
  'Reliability & Maintenance': {
    bg: 'bg-teal-900/40',
    text: 'text-teal-300',
    border: 'border-teal-700',
    hover: 'hover:bg-teal-800/60',
    selectedBg: 'bg-teal-700/50',
  },
  'Utility': {
    bg: 'bg-lime-900/40',
    text: 'text-lime-300',
    border: 'border-lime-700',
    hover: 'hover:bg-lime-800/60',
    selectedBg: 'bg-lime-700/50',
  },
};

const DEFAULT_TAG_COLOR: TagColorSet = {
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

function resolveTag(
  tagId: string,
  customTags: WeaponTagDefinition[]
): WeaponTagDefinition | undefined {
  const libraryTag = WEAPON_TAG_LIBRARY.find(t => t.id === tagId);
  if (libraryTag) return libraryTag;

  return customTags.find(t => t.id === tagId);
}

function readSource(src: TagValueSource, ctx?: TagResolveContext): number | undefined {
  switch (src.kind) {
    case 'attributeRank': return ctx?.attributeDiePools?.[src.attribute]?.rank;
    case 'immaterialSize': return ctx?.immaterialSize;
    case 'size': return ctx?.size;
    case 'surge': return ctx?.surge;
    case 'stuff': return ctx?.stuff;
  }
}

export function resolveVariableDefault(def: WeaponTagDefinition, ctx?: TagResolveContext) {
  const v = def.variable;
  if (!v) return undefined;
  if (v.derivedFrom) {
    const raw = readSource(v.derivedFrom, ctx);
    if (raw !== undefined) return Math.max(v.min, Math.min(v.max, raw));
  }
  return v.default;
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
function parseTagRef(id: string): WeaponTagRef {
  const idx = id.indexOf(':');
  if (idx === -1) return { tagId: id };
  const tagId = id.slice(0, idx);
  const xStr = id.slice(idx + 1);
  const x = parseInt(xStr, 10);
  return Number.isFinite(x) ? { tagId, x } : { tagId };
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
  const unit = def.variable.unit ?? (def.variable.derivedFrom ? `${def.variable.sourceLabel ?? ''} ` : '');
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
 * effective x value. Derived variables read from `ctx`; otherwise falls
 * back to `variable.default`.
 */
export function resolveTagRef(
  ref: WeaponTagRef,
  customTags: WeaponTagDefinition[],
  ctx: TagResolveContext
): { def: WeaponTagDefinition; x?: number } | undefined {
  const def = resolveTag(ref.tagId, customTags);
  if (!def) return undefined;
  const x = ref.x ?? resolveVariableDefault(def, ctx);
  return { def, x };
}

/**
 * Normalize a list of WeaponTagRef so that tags without a variable have
 * x stripped, and tags with a variable have x defaulted if missing.
 * Useful before saving.
 */
export function normalizeTagRefs(
    refs: WeaponTagRef[],
    customTags: WeaponTagDefinition[]
    ): WeaponTagRef[] {
  return refs.map(ref => {
    const def = resolveTag(ref.tagId, customTags);
    if (!def?.variable) {
      return ref.x === undefined ? ref : { tagId: ref.tagId };
    }
    if (def.variable.derivedFrom && ref.x === undefined) return ref;
    if (ref.x === undefined) {
      return { tagId: ref.tagId, x: def.variable.default };
    }
    const { min, max } = def.variable;
    const x = Math.max(min, Math.min(max, ref.x));
    return { tagId: ref.tagId, x };
  });
}
