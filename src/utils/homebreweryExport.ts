import type { CharacterAspectRatings, CharacterFunctionRatings, CharacterSkill, CharacterPower, Artifact, Ally, PersonalShadow, CharacterWeapon, CharacterArmor, DiePool, Power } from '../types/character';
import { ASPECTS, FUNCTIONS, ATTRIBUTES, SKILL_RATINGS, SIZE_OPTIONS, WEAPON_RANGES, RATING_SCALE, RATING_LABELS } from '../types/character';
import { SKILLS } from '../data/skills';
import { POWERS } from '../data/powers';
import { getDiePoolEntry } from '../data/diePoolTable';
import { getPowerDisplay } from './powerDisplay';
import { formatWeaponLogistics } from '../data/weaponData';

// Convert die pool to Homebrewery die icons
function dieIcons(pool: DiePool): string {
  if (pool.divisor) {
    // Special case: d4÷2
    return `:df_d4_4:÷${pool.divisor}`;
  }
  
  // Map die sizes to icon format
  const iconMap: Record<number, string> = {
    4: ':df_d4_4:',
    6: ':df_d6_6:',
    8: ':df_d8_8:',
    10: ':df_d10_10:',
    12: ':df_d12_12:',
  };
  
  // Generate icons for each die (no separator)
  return pool.dice.map(d => iconMap[d] || `d${d}`).join('');
}

// Get attribute abbreviation (3 chars)
function attrAbbr(name: string): string {
  const abbrs: Record<string, string> = {
    'Toughness': 'Tgh',
    'Endurance': 'End',
    'Willpower': 'Wil',
    'Resilience': 'Res',
    'Agility': 'Agi',
    'Reflexes': 'Rct',
    'Intelligence': 'Int',
    'Inspiration': 'Ins',
    'Perception': 'Per',
    'Intuition': 'Itn',
    'Memory': 'Mem',
    'Wisdom': 'Wis',
    'Strength': 'Str',
    'Magnetism': 'Mag',
    'Charisma': 'Cha',
    'Presence': 'Pre',
  };
  return abbrs[name] || name.substring(0, 3);
}

// Format penetration value
function formatPenetration(penetration: number | [number, number]): string {
  if (Array.isArray(penetration)) {
    return penetration[0] === penetration[1] 
      ? `${penetration[0]}` 
      : `${penetration[0]}-${penetration[1]}`;
  }
  return penetration > 0 ? `${penetration}` : '';
}

// Format attack type with proper spacing
function formatAttackType(type: string): string {
  // Convert camelCase to Title Case with spaces
  return type.replace(/([A-Z])/g, ' $1').trim();
}

export interface PaceValues {
  walking: { mph: number; kph: number; ms: number };
  sprinting: { mph: number; kph: number; ms: number };
  multiplier: number;
}

export function generateHomebreweryMarkdown(
  name: string,
  avatarIcon: string,
  campaignLimit: number,
  aspects: CharacterAspectRatings,
  functions: CharacterFunctionRatings,
  aspectExplanations: Record<string, string>,
  functionExplanations: Record<string, string>,
  skills: CharacterSkill[],
  powers: CharacterPower[],
  artifacts: Artifact[],
  allies: Ally[],
  personalShadows: PersonalShadow[],
  weapons: CharacterWeapon[],
  armor: CharacterArmor[],
  size: number,
  immaterialSize: number,
  pace: PaceValues,
  stuff: number,
  surge: number
): string {

  const lines: string[] = [];
  
  // Character sheet frame
  lines.push(`{{monster,frame`);
  lines.push(`## ${avatarIcon} ${name || "Avatar Name"}`);
  lines.push(`*${campaignLimit} Points*`);
  lines.push(`___`);
  
  // Attributes table header
  lines.push(`|||🧱 **Form**|🧬 **Flesh**|🧠 **Mind**|🔥 **Spirit**|`);
  lines.push(`|:------------------|:------:|:------:|:------:|:------:|:------:|`);

  // Simplified Aspect ratings row
  lines.push(`| | |${aspects.Form}|${aspects.Flesh}|${aspects.Mind}|${aspects.Spirit}|`);

  // Function rows with attributes
  FUNCTIONS.forEach(func => {
    const funcRating = functions[func.id];
    const cells = [`${func.emoji} **${func.name}**`, `${funcRating}`];
    
    ASPECTS.forEach(aspect => {
      const attr = ATTRIBUTES.find(a => a.func === func.id && a.aspect === aspect.id);
      if (attr) {
        const value = funcRating + aspects[aspect.id];
        const pool = getDiePoolEntry(value).pool;
        const icons = dieIcons(pool);
        cells.push(`${attrAbbr(attr.name)}<br>${icons}`);
      }
    });
    
    lines.push(`|${cells.join('|')}|`);
  });
  
  lines.push(`___`);
  lines.push(``);
  
  // Surge and Stuff
  const stuffText = stuff >= 0 ? `+${stuff} Good Stuff` : `${stuff} Bad Stuff`;
  lines.push(`***${surge} Surge Points*** (${stuffText})  `);
  
  // Sizes (Material and Immaterial)
  const sizeOption = SIZE_OPTIONS.find(s => s.value === size);
  if (sizeOption && sizeOption.value !== 0) {
    lines.push(`**Material Size:** ${sizeOption.label} (${sizeOption.value >= 0 ? '+' : ''}${sizeOption.value})`);
  }
  
  const immaterialSizeOption = SIZE_OPTIONS.find(s => s.value === immaterialSize);
  if (immaterialSizeOption && immaterialSizeOption.value !== 0) {
    lines.push(`**Immaterial Size:** ${immaterialSizeOption.label} (${immaterialSizeOption.value >= 0 ? '+' : ''}${immaterialSizeOption.value})  `);
  }
  
  // Pace (mph only)
  const paceMultiplierText = pace.multiplier !== 1 ? ` (${pace.multiplier}x)` : '';
  lines.push(`**Pace:** ${pace.walking.mph}/${pace.sprinting.mph} mph${paceMultiplierText}  `);
  
  // Finesse attributes used for Parry (pool size = number of dice)
  const parryAttributes: Record<string, string> = {
    Form: 'Agility',
    Flesh: 'Reflexes',
    Mind: 'Intelligence',
    Spirit: 'Inspiration',
  };
  
  // Finesse attributes used for Dodge (pool size = number of dice, null = no dodge)
  const dodgeAttributes: Record<string, string | null> = {
    Form: 'Agility',
    Flesh: null,
    Mind: 'Intelligence',
    Spirit: 'Inspiration',
  };
  
  // Resist attributes used for Soak (damage reduction = die pool rank)
  const resistAttributes: Record<string, string> = {
    Form: 'Toughness',
    Flesh: 'Endurance',
    Mind: 'Willpower',
    Spirit: 'Resilience',
  };

  ASPECTS.forEach(aspect => {
    const parryAttrName = parryAttributes[aspect.id];
    const dodgeAttrName = dodgeAttributes[aspect.id];
    const soakAttrName = resistAttributes[aspect.id];
    const sizeValue = SIZE_OPTIONS.find(s => s.value === size)?.value ?? 0;
    const immaterialSizeValue = SIZE_OPTIONS.find(s => s.value === immaterialSize)?.value ?? 0;

    // Parry (Finesse)
    let parryText = 'No Parry';
    if (parryAttrName) {
      const parryAttr = ATTRIBUTES.find(a => a.name === parryAttrName);
      if (parryAttr) {
        const parryValue = functions[parryAttr.func] + aspects[parryAttr.aspect];
        const parryPool = getDiePoolEntry(parryValue).pool;
        const parryDice = parryPool.dice.length;
        parryText = `Parry: ${parryDice}`;
      }
    }
    
    // Dodge (Finesse)
    let dodgeText = 'No Dodge';
    if (dodgeAttrName) {
      const dodgeAttr = ATTRIBUTES.find(a => a.name === dodgeAttrName);
      if (dodgeAttr) {
        const dodgeValue = functions[dodgeAttr.func] + aspects[dodgeAttr.aspect];
        const dodgePool = getDiePoolEntry(dodgeValue).pool;
        const dodgeDice = dodgePool.dice.length;
        dodgeText = `Dodge: ${dodgeDice}`;
      }
    }
    
    // Soak (Resist + Size)
    let soakText = 'No Soak';
    const soakAttr = ATTRIBUTES.find(a => a.name === soakAttrName);
    if (soakAttr) {
      const soakValue = functions[soakAttr.func] + aspects[soakAttr.aspect];
      const soakPoolEntry = getDiePoolEntry(soakValue);
      
      // Add Material Size to Form/Flesh, Immaterial Size to Mind/Spirit
      const sizeModifier = (aspect.id === 'Form' || aspect.id === 'Flesh') 
        ? sizeValue 
        : immaterialSizeValue;
        
      const finalSoak = soakPoolEntry.rank + sizeModifier;
      soakText = `Soak: ${finalSoak}`;
    }
    
    lines.push(`**${aspect.name}:** ${parryText} | ${dodgeText} | ${soakText}  `);
  });
  lines.push(``);

  lines.push(`___`);

  // Build mythic levels from rating scale for getPowerDisplay
  const mythicLevels = RATING_SCALE.map(cost => ({
    cost,
    name: RATING_LABELS[cost].split(' ').slice(1).join(' ')
  }));

  // Collect all powers (regular + mythic) with their display info
  interface PowerDisplayItem {
    emoji: string;
    title: string;
    systemReference: string;
    description: string;
    points: number;
  }
  
  const allPowerItems: PowerDisplayItem[] = [];
  
  // Regular powers
  powers.forEach(cp => {
    const power = POWERS.find(p => p.id === cp.powerId);
    if (power) {
      const display = getPowerDisplay(power, cp.points, cp.label, cp.customTitle);
      allPowerItems.push({
        emoji: power.emoji,
        title: display.title,
        systemReference: display.systemReference,
        description: cp.description || '',
        points: cp.points,
      });
    }
  });
  
  // Mythic aspects (20+)
  ASPECTS.forEach(aspect => {
    if (aspects[aspect.id] >= 20) {
      const display = getPowerDisplay(
        {
          id: `mythic-aspect-${aspect.id}`,
          name: aspect.name,
          emoji: aspect.emoji,
          category: 'Substance',
          levels: mythicLevels,
          description: '',
          repeatable: false,
          requirements: '',
          keyAttributes: [],
        } as Power,
        aspects[aspect.id],
        undefined,
        `Mythic ${aspect.name}`
      );
      allPowerItems.push({
        emoji: aspect.emoji,
        title: display.title,
        systemReference: display.systemReference,
        description: aspectExplanations[aspect.id] || '',
        points: aspects[aspect.id],
      });
    }
  });
  
  // Mythic functions (20+)
  FUNCTIONS.forEach(func => {
    if (functions[func.id] >= 20) {
      const display = getPowerDisplay(
        {
          id: `mythic-function-${func.id}`,
          name: func.name,
          emoji: func.emoji,
          category: 'Substance',
          levels: mythicLevels,
          description: '',
          repeatable: false,
          requirements: '',
          keyAttributes: [],
        } as Power,
        functions[func.id],
        undefined,
        `Mythic ${func.name}`
      );
      allPowerItems.push({
        emoji: func.emoji,
        title: display.title,
        systemReference: display.systemReference,
        description: functionExplanations[func.id] || '',
        points: functions[func.id],
      });
    }
  });
  
  // Sort by points descending (most significant first)
  allPowerItems.sort((a, b) => b.points - a.points);
  
  // Output powers
  if (allPowerItems.length > 0) {
    lines.push(`#### Powers`);
    allPowerItems.forEach(item => {
      const description = item.description ? ` ${item.description}` : '';
      lines.push(`**${item.emoji} ${item.title}** *[${item.systemReference}]* :: ${description}`);
    });
  }

  // Skills
  if (skills.length > 0) {
    const skillCostTotal = skills.reduce((sum, skill) => {
      const rating = SKILL_RATINGS.find(r => r.rating === skill.rating);
      return sum + (rating?.cost || 0);
    }, 0);
    
    const willpowerPool = getDiePoolEntry(functions['Resist'] + aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
    const memoryPool = getDiePoolEntry(functions['Perceive'] + aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
    const skillCap = Math.min(Math.floor(willpowerPool / 4), 4);
    const skillMax = Math.floor(memoryPool / 2);
    
    lines.push(``);
    lines.push(`#### Skills [${skillCostTotal} Points], Cap:${skillCap}, Max:${skillMax}`);
    [...skills].sort((a, b) => {
      const modA = SKILL_RATINGS.find(r => r.rating === a.rating)?.modifier ?? 0;
      const modB = SKILL_RATINGS.find(r => r.rating === b.rating)?.modifier ?? 0;
      return modB - modA;
    }).forEach(skillEntry => {
      const skill = SKILLS.find(s => s.id === skillEntry.skillId);
      if (skill) {
        const rating = SKILL_RATINGS.find(r => r.rating === skillEntry.rating);
        const modText = rating ? ` (${rating.modifier >= 0 ? '+' : ''}${rating.modifier})` : '';
        const specialtyText = skillEntry.specialty ? ` (${skillEntry.specialty})` : '';
        const explanationText = skillEntry.specialtyExplanation ? ` ${skillEntry.specialtyExplanation}` : '';
        lines.push(`**${skill.name}** :: ${skillEntry.rating}${modText}${specialtyText}${explanationText}`);
      }
    });
  }
  
  // Weapons
  if (weapons.length > 0) {
    lines.push(``);
    lines.push(`#### Weapons`);
    weapons.forEach(weapon => {
      const attackTexts = weapon.attacks.map(attack => {
        const aspectName = ASPECTS.find(a => a.id === attack.aspect)?.name || attack.aspect;
        const penFormatted = formatPenetration(attack.penetration);
        const penText = penFormatted ? ` Pen ${penFormatted}` : '';
        const rangeLabel = WEAPON_RANGES.find(r => r.value === attack.range)?.label || attack.range;
        const conditionalText = attack.isConditional ? ` ⚠️${attack.condition ? ` (${attack.condition})` : ''}` : '';
        return `${aspectName}-${formatAttackType(attack.type)} ${attack.magnitude}${penText} ${rangeLabel}${conditionalText}`;
      });
      
      const parenthetical = attackTexts.join('; ');
      const categoryText = `${weapon.category}, ${weapon.handedness}`;
      const parts = [categoryText];
      const logistics = formatWeaponLogistics(weapon.capacity, weapon.reloadTime);
      if (logistics) parts.push(logistics);
      if (weapon.notes && weapon.notes.length > 0) parts.push(weapon.notes.join('. '));
      
      lines.push(`**${weapon.name}** :: (${parenthetical}). ${parts.join('. ')}`);
    });
  }
  
  // Armor
  if (armor.length > 0) {
    lines.push(``);
    lines.push(`#### Armor`);
    armor.forEach(piece => {
      const aspectNames = piece.aspects.map(a => {
        const aspect = ASPECTS.find(aspect => aspect.id === a);
        return aspect ? aspect.name : a;
      }).join('/');
      const locationText = piece.location ? ` ${piece.location}` : '';
      const notesText = piece.notes && piece.notes.length > 0 
        ? `. ${piece.notes.join('. ')}` 
        : '';
      
      lines.push(`**${piece.name}** (${aspectNames} ${piece.armor}${locationText})${notesText}`);
    });
  }
  
  // Artifacts and Constructs
  if (artifacts.length > 0) {
    lines.push(``);
    lines.push(`#### Artifacts and Constructs`);
    artifacts.forEach(artifact => {
      const qtyText = artifact.quantity > 1 ? ` x${artifact.quantity}` : '';
      lines.push(`**${artifact.name}** *[${artifact.cost} Points]*${qtyText} :: ${artifact.description}`);
    });
  }
  
  // Personal Shadows
  if (personalShadows.length > 0) {
    lines.push(``);
    lines.push(`#### Private Shadows`);
    personalShadows.forEach(shadow => {
      lines.push(`**${shadow.name}** *[${shadow.cost} Points]* :: ${shadow.description}`);
    });
  }
  
  // Allies and Enemies
  if (allies.length > 0) {
    lines.push(``);
    lines.push(`#### Allies and Enemies`);
    allies.forEach(ally => {
      const loyaltyText = ally.loyalty < 0 ? 'Enemy' : ally.loyalty > 3 ? 'Devotee' : ally.loyalty > 1 ? 'Ally' : 'Contact';
      lines.push(`**${ally.name}** *[${ally.cost} Points]* :: ${ally.description || loyaltyText}`);
    });
  }
  
  // Close the frame
  lines.push(`}}`);
  
  return lines.join('\n');
}