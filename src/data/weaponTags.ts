import type { WeaponTagDefinition } from '../types/character';

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
    id: 'tag-nonlethal',
    label: 'Non-Lethal',
    category: 'Inherent',
    effect: 'Injuries lead to unconsciousness rather than death',
  },
  {
    id: 'tag-ensnaring',
    label: 'Ensnaring',
    category: 'Inherent',
    effect: 'Target must spend next action to free themselves or remain immobilized',
  },
  {
    id: 'tag-clumsy',
    label: 'Clumsy',
    category: 'Inherent',
    effect: '-2 to attack in tight spaces, grapples, or when prone',
  },
  {
    id: 'tag-chain',
    label: 'Chain',
    category: 'Inherent',
    description: 'Ripping chain weapon (40K)',
    effect: 'On Raise, tears target free from grapple or cover automatically',
  },
  {
    id: 'tag-throwing',
    label: 'Throwing',
    category: 'Inherent',
    description: 'Melee weapon balanced for throwing (D&D)',
    effect: 'Melee weapon can be thrown at Short range without penalty',
  },
  {
    id: 'tag-cumbersome',
    label: 'Cumbersome',
    category: 'Inherent',
    effect: '-2 to all actions while wielded due to weight/awkwardness; may require minimum Strength',
  },
  {
    id: 'tag-blast',
    label: 'Blast',
    category: 'Inherent',
    description: 'Area-effect weapon (40K)',
    effect: 'Attack hits all targets within Close range of impact point; roll separately for each',
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
    id: 'tag-ceramite',
    label: 'Ceramite',
    category: 'Inherent',
    description: 'Heat-resistant ceramic composite',
    effect: 'Immune to Fire damage; melts rather than conducts heat',
  },
  {
    id: 'tag-obsidian',
    label: 'Obsidian',
    category: 'Inherent',
    description: 'Volcanic glass edge',
    effect: '+2 Penetration, but breaks if parried by harder material or on fumble',
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
    id: 'tag-crippling',
    label: 'Crippling',
    category: 'Craftsmanship',
    description: 'Injuries worsen with exertion',
    effect: 'Injuries caused by this weapon worsen 1 step each time Surge is used',
  },
  {
    id: 'tag-cruel',
    label: 'Cruel',
    category: 'Craftsmanship',
    effect: 'Injuries automatically worsen by one level if not stabilized within the round',
  },
  {
    id: 'tag-devastating',
    label: 'Devastating',
    category: 'Craftsmanship',
    description: 'particularly deadly with critical hits',
    effect: '+4 damage per Raise',
  },
  {
    id: 'tag-felling',
    label: 'Felling',
    category: 'Craftsmanship',
    description: 'makes a mockery of even the most resilient enemies, cutting dense tissue and bone with ease',
    effect: 'Ignores enemy Resistance',
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
    id: 'tag-integrated',
    label: 'Integrated',
    category: 'Craftsmanship',
    effect: 'Cannot be disarmed; built into body/limb/nerve interface',
  },
  {
    id: 'tag-gestalt',
    label: 'Gestalt',
    category: 'Craftsmanship',
    effect: 'When wielded with matching set piece, both gain +1 Magnitude',
  },
  {
    id: 'tag-synchronized',
    label: 'Synchronized',
    category: 'Craftsmanship',
    effect: '+2 when used with specific synergistic gear (targeting visor, specific armor, etc.)',
  },
  {
    id: 'tag-suppressive',
    label: 'Suppressive',
    category: 'Craftsmanship',
    effect: 'Designated zone causes -2 to all actions for targets within, even without hitting them',
  },
  {
    id: 'tag-intimidating',
    label: 'Intimidating',
    category: 'Craftsmanship',
    effect: 'Merely displaying it causes nonlethal Spirit damage (fear) to witnesses',
  },
  {
    id: 'tag-picky',
    label: 'Picky',
    category: 'Craftsmanship',
    effect: 'Requires specific ammunition (holy water, specific blood type, rare crystals) or becomes Unreliable',
  },
  {
    id: 'tag-crude',
    label: 'Crude',
    category: 'Craftsmanship',
    effect: '-2 to social situations, but +2 to intimidation among criminals and primitives',
  },
  {
    id: 'tag-noisy',
    label: 'Noisy',
    category: 'Craftsmanship',
    effect: 'Cannot be used stealthily; alerts enemies in adjacent zones even on miss',
  },
  {
    id: 'tag-fragile',
    label: 'Fragile',
    category: 'Craftsmanship',
    effect: 'Breaks on critical failure (fumble); requires repair/replacement',
  },
  {
    id: 'tag-ostentatious',
    label: 'Ostentatious',
    category: 'Craftsmanship',
    effect: 'Automatically draws attention; enemies prioritize targeting wielder',
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
    effect: 'Jams if all 1s are rolled, even if not a critical failure',
  },
  {
    id: 'tag-xenotech',
    label: 'Xenotech',
    category: 'Craftsmanship',
    description: 'Alien design (40K)',
    effect: 'Wrong species takes -1 to use, +1 damage against that species',
  },
  {
    id: 'tag-stim-compatible',
    label: 'Stim-Compatible',
    category: 'Craftsmanship',
    description: 'Chemical synergy (StarCraft)',
    effect: 'When wielder uses stims/chemicals, weapon gains +2 Magnitude for duration',
  },
  {
    id: 'tag-twin-linked',
    label: 'Twin-Linked',
    category: 'Craftsmanship',
    description: 'Paired weapons linked to fire together (40K)',
    effect: 'Reroll failed attack rolls; may fire both barrels/systems as one action',
  },
  {
    id: 'tag-storm',
    label: 'Storm',
    category: 'Craftsmanship',
    description: 'High rate of fire weapon (40K)',
    effect: 'Doubles shots per attack action; +2 Magnitude when firing full capacity',
  },
  {
    id: 'tag-lance',
    label: 'Lance',
    category: 'Craftsmanship',
    description: 'Consistent armor penetration (40K)',
    effect: 'Penetration never drops below base value regardless of range or cover',
  },
  {
    id: 'tag-impact',
    label: 'Impact',
    category: 'Craftsmanship',
    description: 'Bonus damage from design (D&D, 40K)',
    effect: '+2 Magnitude on hits that beat target\'s Resistance',
  },
  {
    id: 'tag-scatter',
    label: 'Scatter',
    category: 'Craftsmanship',
    description: 'Shotgun-style spread (40K)',
    effect: '+2 Magnitude at Touch/Close range; -2 Magnitude at Medium+ range',
  },
  {
    id: 'tag-melta',
    label: 'Melta',
    category: 'Craftsmanship',
    description: 'Short-range high-penetration weapon (40K)',
    effect: '+4 Penetration at Touch/Close range; loses all Penetration beyond Short range',
  },
  {
    id: 'tag-tearing',
    label: 'Tearing',
    category: 'Craftsmanship',
    description: 'Weapon tears flesh for maximum damage (40K)',
    effect: 'Reroll damage Magnitude; wielder keeps the higher result',
  },
  {
    id: 'tag-rending',
    label: 'Rending',
    category: 'Craftsmanship',
    description: 'Tears through armor on solid hits (40K)',
    effect: '+2 Penetration on any hit that scores a Raise',
  },
  {
    id: 'tag-salvo',
    label: 'Salvo',
    category: 'Craftsmanship',
    description: 'Designed to fire on the move (40K)',
    effect: 'No penalty for firing while moving at full speed',
  },
  {
    id: 'tag-recoil',
    label: 'Recoil',
    category: 'Craftsmanship',
    description: 'Poor recoil management (negative)',
    effect: '-2 to attack if wielder is moving, prone, or firing one-handed without support',
  },
  {
    id: 'tag-gets-hot',
    label: 'Gets Hot',
    category: 'Craftsmanship',
    description: 'Overheats on failure (40K, negative)',
    effect: 'On critical failure, weapon deals Form-Burning to wielder at Magnitude equal to weapon\'s base',
  },

  // === Enchantment ===
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
  {
    id: 'tag-adaptable',
    label: 'Adaptable',
    category: 'Enchantment',
    effect: 'Automatically shifts damage Aspect to target\'s lowest Resistance',
  },
  {
    id: 'tag-flashy',
    label: 'Flashy',
    category: 'Enchantment',
    effect: 'Produces blinding light; blinds targets in darkness on hit, but gives away position',
  },
  {
    id: 'tag-corrosive',
    label: 'Corrosive',
    category: 'Enchantment',
    effect: 'Permanently reduces target\'s armor rating by 1 per hit (until repaired)',
  },
  {
    id: 'tag-ghost-touch',
    label: 'Ghost Touch',
    category: 'Enchantment',
    effect: 'Can strike immaterial targets (those without Form aspect) as if they were physical',
  },
  {
    id: 'tag-power-field',
    label: 'Power Field',
    category: 'Enchantment',
    description: 'Disruptive energy field around the weapon (40K)',
    effect: '3-in-4 chance to destroy a parried melee weapon',
  },
  {
    id: 'tag-thundering',
    label: 'Thundering',
    category: 'Enchantment',
    description: 'Deafening strikes (D&D)',
    effect: 'Deafens target on Raise (cannot hear commands, -2 to Perception)',
  },
  {
    id: 'tag-bane',
    label: 'Bane',
    category: 'Enchantment',
    description: 'Specific enemy slayer (D&D)',
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
    id: 'tag-unstable',
    label: 'Unstable',
    category: 'Enchantment',
    effect: 'Roll on random effect table each use (wild magic/chaos tech)',
  },
  {
    id: 'tag-disruptive',
    label: 'Disruptive',
    category: 'Enchantment',
    effect: 'Target cannot use Surge for 1 round after being hit',
  },
  {
    id: 'tag-blessed',
    label: 'Blessed',
    category: 'Enchantment',
    effect: 'Brings fortune; wielder gains +1 to one roll per scene; holy symbols react positively',
  },
  {
    id: 'tag-cursed',
    label: 'Cursed',
    category: 'Enchantment',
    effect: 'Brings misfortune; GM gains +2 to use against wielder; cannot be discarded willingly',
  },
  {
    id: 'tag-sacred',
    label: 'Sacred',
    category: 'Enchantment',
    effect: 'Must not be used for profane purposes; breaks or curses wielder if misused',
  },
  {
    id: 'tag-concussive',
    label: 'Concussive',
    category: 'Enchantment',
    description: 'Stunning force on impact (40K)',
    effect: 'On hit, target must resist or lose next action (stunned)',
  },
  {
    id: 'tag-deflagrate',
    label: 'Deflagrate',
    category: 'Enchantment',
    description: 'Continuing burn damage after hit (40K)',
    effect: 'After initial hit, target takes Form-Burning at half Magnitude for 2 additional rounds',
  },
  {
    id: 'tag-haywire',
    label: 'Haywire',
    category: 'Enchantment',
    description: 'Disrupts electronics and machines (40K)',
    effect: 'Against technological targets: +4 Magnitude and disables target\'s tech for 1 round',
  },
  {
    id: 'tag-pinning',
    label: 'Pinning',
    category: 'Enchantment',
    description: 'Forces targets to seek cover (40K)',
    effect: 'On hit, target must resist or be forced to take cover (Pinned) for 1 round',
  },
  {
    id: 'tag-skyfire',
    label: 'Skyfire',
    category: 'Enchantment',
    description: 'Designed to hit flying targets (40K)',
    effect: '+2 to attack and no range penalty against flying/elevated targets',
  },
  {
    id: 'tag-returning',
    label: 'Returning',
    category: 'Enchantment',
    description: 'Returns to wielder when thrown (D&D)',
    effect: 'After thrown attack, weapon returns to wielder\'s hand at end of round',
  },
  {
    id: 'tag-seeking',
    label: 'Seeking',
    category: 'Enchantment',
    description: 'Guided to target (D&D)',
    effect: 'Reroll any missed attack; ignores cover penalties',
  },
  {
    id: 'tag-speed',
    label: 'Speed',
    category: 'Enchantment',
    description: 'Grants additional attacks (D&D)',
    effect: 'Wielder may make one additional attack with this weapon per round',
  },
  {
    id: 'tag-holy',
    label: 'Holy',
    category: 'Enchantment',
    description: 'Blessed against evil (D&D)',
    effect: '+2 Magnitude against evil-aligned or corrupted targets; glows in presence of undead',
  },
  {
    id: 'tag-unholy',
    label: 'Unholy',
    category: 'Enchantment',
    description: 'Cursed against good (D&D)',
    effect: '+2 Magnitude against good-aligned or sacred targets; corrupts wielder with extended use',
  },
  {
    id: 'tag-wounding',
    label: 'Wounding',
    category: 'Enchantment',
    description: 'Causes persistent bleeding (D&D)',
    effect: 'Target loses 1 additional Injury level per round until healed (Flesh-Bleeding persists)',
  },
  {
    id: 'tag-guardian',
    label: 'Guardian',
    category: 'Enchantment',
    description: 'Protective when wielded (D&D)',
    effect: '+2 to Resistance when wielded but not used to attack this round',
  },
  {
    id: 'tag-distance',
    label: 'Distance',
    category: 'Enchantment',
    description: 'Extended throwing range (D&D)',
    effect: 'Doubles thrown range for this weapon (e.g., Short becomes Medium)',
  },

  // === Supernatural ===
  {
    id: 'tag-force',
    label: 'Force',
    category: 'Supernatural',
    description: 'Psyker weapon, applies only if character possesses Psionics',
    effect: 'Adds wielder\'s Willpower rank to damage instead of standard calculation',
  },
  {
    id: 'tag-null',
    label: 'Null',
    category: 'Supernatural',
    description: 'Suppresses supernatural effects',
    effect: 'Powers used within Reach range roll tests and damage at -4',
  },
  {
    id: 'tag-phasing',
    label: 'Phasing',
    category: 'Supernatural',
    description: 'Weapon exists partially out of phase',
    effect: 'Can strike through physical barriers up to 1 meter; ignores non-mystical armor',
  },
  {
    id: 'tag-soul-drinking',
    label: 'Soul-Drinking',
    category: 'Supernatural',
    effect: 'Kills restore 1 Injury level from the wielder\'s most injured aspect',
  },
  {
    id: 'tag-crystallizing',
    label: 'Crystallizing',
    category: 'Supernatural',
    effect: 'Wounds turn to crystal/stone; healing requires +1 Restoration Point per level',
  },
  {
    id: 'tag-hungry',
    label: 'Hungry',
    category: 'Supernatural',
    effect: 'Roll d6 after use: on 1, capacity reduced by 1 step until fed (blood/souls/ammo)',
  },
  {
    id: 'tag-gibbering',
    label: 'Gibbering',
    category: 'Supernatural',
    description: 'Maddening to wield',
    effect: 'Wielder takes 1 Mind damage per use but weapon deals Spirit damage to targets',
  },
  {
    id: 'tag-tainted',
    label: 'Tainted',
    category: 'Supernatural',
    effect: 'Carries spiritual corruption; wielder takes 1 Spirit damage per day of carrying until cleansed',
  },
  {
    id: 'tag-jealous',
    label: 'Jealous',
    category: 'Supernatural',
    effect: 'Demands to be used once drawn; if sheathed without drawing blood, deals 1 damage to wielder',
  },
  {
    id: 'tag-sporadic',
    label: 'Sporadic',
    category: 'Supernatural',
    effect: 'Only functions on odd-numbered rounds or when specific condition is met',
  },
  {
    id: 'tag-vicious',
    label: 'Vicious',
    category: 'Supernatural',
    description: 'Bloodthirsty weapon (D&D)',
    effect: '+2 damage but 1 damage to wielder per hit',
  },
  {
    id: 'tag-evolutionary',
    label: 'Evolutionary',
    category: 'Supernatural',
    description: 'Zerg bio-adaptation (StarCraft)',
    effect: 'After killing enemy type, permanently gains +1 vs that type',
  },
  {
    id: 'tag-psionic',
    label: 'Psionic',
    category: 'Supernatural',
    description: 'Protoss tech (StarCraft)',
    effect: 'Requires psionic attunement; deals Mind damage; floats when wielded by psyker',
  },
  {
    id: 'tag-anarchic',
    label: 'Anarchic',
    category: 'Supernatural',
    description: 'Chaos-aligned (D&D)',
    effect: '+2 against lawful/ordered beings (modrons, machines, tyranids)',
  },
  {
    id: 'tag-axiomatic',
    label: 'Axiomatic',
    category: 'Supernatural',
    description: 'Law-aligned (D&D)',
    effect: '+2 against chaotic beings (demons, orks, zerg)',
  },
  {
    id: 'tag-woe',
    label: 'Woe',
    category: 'Supernatural',
    description: 'Weapon of ill omen',
    effect: 'Kills with this weapon doom the slayer (narrative curse; effect varies by Shadow)',
  },
  {
    id: 'tag-shapeshifting',
    label: 'Shapeshifting',
    category: 'Supernatural',
    description: 'Weapon can change its form (Amber)',
    effect: 'Wielder may shift weapon between forms (e.g., sword to spear to whip) as a free action',
  },
  {
    id: 'tag-necrodermis',
    label: 'Necrodermis',
    category: 'Supernatural',
    description: 'Living metal from beyond',
    effect: 'Self-repairs 1 Form per hour; may attempt to repair wielder',
  },
  {
    id: 'tag-wraithbone',
    label: 'Wraithbone',
    category: 'Supernatural',
    description: 'Psychic resonant crystal',
    effect: '+1 to Mind attacks; floats in zero-g; psychically reactive',
  },
  {
    id: 'tag-daemon-forged',
    label: 'Daemon-Forged',
    category: 'Supernatural',
    description: 'Forged in the warp',
    effect: 'Deals Spirit damage; risks possession on critical failure (Resilience check)',
  },
  {
    id: 'tag-starmetal',
    label: 'Starmetal',
    category: 'Supernatural',
    description: 'Metal fallen from the sky',
    effect: '+1 Magnitude against extraplanar entities; glows near portals',
  },
  {
    id: 'tag-bio-organic',
    label: 'Bio-Organic',
    category: 'Supernatural',
    description: 'Living weapon',
    effect: 'Heals 1 damage per kill; requires feeding or withers',
  },
  {
    id: 'tag-orichalcum',
    label: 'Orichalcum',
    category: 'Supernatural',
    description: 'Ancient anti-magic metal',
    effect: 'Bypasses magical defenses; cuts through wards and force fields',
  },
  {
    id: 'tag-shadowsteel',
    label: 'Shadowsteel',
    category: 'Supernatural',
    description: 'Metal from the darkness between Shadows',
    effect: 'Absorbs light; +2 to Concealable; wielder harder to see in darkness',
  },
  {
    id: 'tag-force-projected',
    label: 'Force-Projected',
    category: 'Supernatural',
    description: 'Energy blade',
    effect: 'Cannot be physically parried (must Dodge or use energy barrier)',
  },

  // === Legendary ===
  {
    id: 'tag-broken-pattern',
    label: 'Broken Pattern',
    category: 'Legendary',
    description: 'Imbued with Broken Pattern',
    effect: 'Functions in all Shadows but 1-in-6 chance of chaotic side effect each use',
  },
  {
    id: 'tag-primal',
    label: 'Primal',
    category: 'Legendary',
    description: 'From a primal Shadow',
    effect: '+1 against summoned/artificial beings, -1 against natural creatures',
  },
  {
    id: 'tag-blood-cursed',
    label: 'Blood-Cursed',
    category: 'Legendary',
    description: 'Weapon of specific lineage',
    effect: 'Deals extra damage to specific bloodline (dramatic irony for Amberites)',
  },
  {
    id: 'tag-shadow-adaptive',
    label: 'Shadow-Adaptive',
    category: 'Legendary',
    description: 'Adjusts to local physics',
    effect: 'Automatically adjusts to local Shadow laws; never suffers "foreign tech" penalties',
  },
  {
    id: 'tag-sigil-crafted',
    label: 'Sigil-Crafted',
    category: 'Legendary',
    description: 'Forged in a specific Shadow',
    effect: 'Gains bonuses in that Shadow type, penalties in opposed Shadow types',
  },
  {
    id: 'tag-artifact',
    label: 'Artifact',
    category: 'Legendary',
    description: 'Has history and possibly sentience',
    effect: 'May unlock powers through narrative milestones',
  },
  {
    id: 'tag-jeweled',
    label: 'Jeweled',
    category: 'Legendary',
    description: 'Amberite status symbol',
    effect: '+2 social in Amber; recognizable; valuable as currency',
  },
  {
    id: 'tag-pattern-etched',
    label: 'Pattern-Etched',
    category: 'Legendary',
    description: 'Cut with the Pattern',
    effect: 'Can cut through Shadow barriers; deals Spirit damage to Chaos beings',
  },
  {
    id: 'tag-logrus-touched',
    label: 'Logrus-Touched',
    category: 'Legendary',
    description: 'Extension of the Logrus',
    effect: 'Can strike targets in adjacent Shadows if wielder has Logrus sight',
  },
  {
    id: 'tag-trump-embedded',
    label: 'Trump-Embedded',
    category: 'Legendary',
    description: 'Contains Trump magic',
    effect: 'Contains Trump of wielder; weapon can be called through any Trump contact',
  },
  {
    id: 'tag-notorious',
    label: 'Notorious',
    category: 'Legendary',
    effect: 'Famous weapon; enemies may flee or target wielder specifically; recognized on sight',
  },
  {
    id: 'tag-historical',
    label: 'Historical',
    category: 'Legendary',
    effect: 'Famous in history; scholars know its deeds; may have prophecy attached',
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