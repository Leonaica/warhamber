import type { Character, AttributeName, FunctionName, DiePool, Power, CharacterPower } from '../types/character';
import { ATTRIBUTES, SKILL_RATINGS } from '../types/character';
import { getDiePoolEntry, DIE_POOL_TABLE } from '../data/diePoolTable';
import { POWERS } from '../data/powers';

// Calculate attribute value from function + aspect ratings
function calculateAttribute(
  funcRating: number,
  aspectRating: number
): number {
  return funcRating + aspectRating;
}

// Get tier color for attribute value
export function getAttributeTierColor(value: number): string {
  if (value >= 40) return 'text-rose-400';        // Unnatural
  if (value >= 15) return 'text-emerald-400';     // Supernatural
  if (value >= 0) return 'text-amber-400';        // Superhuman (Amber-level)
  if (value >= -10) return 'text-violet-400';     // Transhuman
  return 'text-blue-400';                         // Human
}

// Calculate skill cap (based on Willpower)
function calculateSkillCap(willpowerPool: number): number {
  const cap = Math.floor(willpowerPool / 4);
  return Math.min(cap, 4); // Hard max of Extraordinary (+4)
}

// Calculate skill maximum (based on Memory)
function calculateSkillMaximum(memoryPool: number): number {
  return Math.floor(memoryPool / 2);
}

// Calculate total skill bonuses
export function calculateTotalSkillBonuses(skills: Character['skills']): number {
  return skills.reduce((total, skill) => {
    const rating = SKILL_RATINGS.find(r => r.rating === skill.rating);
    return total + (rating?.modifier ?? 0);
  }, 0);
}

// Calculate skill point costs
export function calculateSkillCosts(skills: Character['skills']): number {
  return skills.reduce((total, skill) => {
    const rating = SKILL_RATINGS.find(r => r.rating === skill.rating);
    return total + (rating?.cost ?? 0);
  }, 0);
}

// Check if power prerequisites are met
export function checkPowerPrerequisites(
  power: Power,
  attributes: Record<AttributeName, number>,
  aspects: { Form: number; Flesh: number; Mind: number; Spirit: number },
  functions: { Resist: number; Finesse: number; Perceive: number; Force: number },
  ownedPowers: CharacterPower[],
  currentPowerPoints?: number
): { met: boolean; unmet: string[] } {
  if (!power.prerequisites || power.prerequisites.length === 0) {
    return { met: true, unmet: [] };
  }

  const unmet: string[] = [];

  for (const prereq of power.prerequisites) {
    // Check if this prerequisite applies at current power level
    if (prereq.appliesAtPoints !== undefined) {
      if (currentPowerPoints === undefined || currentPowerPoints < prereq.appliesAtPoints) {
        continue;
      }
    }
    
    if (prereq.type === 'attribute' && prereq.attribute && prereq.minimum !== undefined) {
      const attrValue = attributes[prereq.attribute];
      if (attrValue < prereq.minimum) {
        unmet.push(`${prereq.attribute} ${attrValue} < ${prereq.minimum}`);
      }
    } else if (prereq.type === 'aspect' && prereq.aspect && prereq.minimum !== undefined) {
      const aspectValue = aspects[prereq.aspect];
      if (aspectValue < prereq.minimum) {
        unmet.push(`${prereq.aspect} ${aspectValue} < ${prereq.minimum}`);
      }
    } else if (prereq.type === 'function' && prereq.func && prereq.minimum !== undefined) {
      const funcValue = functions[prereq.func];
      if (funcValue < prereq.minimum) {
        unmet.push(`${prereq.func} ${funcValue} < ${prereq.minimum}`);
      }
    } else if (prereq.type === 'power' && prereq.powerId) {
      const ownedPower = ownedPowers.find(p => p.powerId === prereq.powerId);
      const requiredPower = POWERS.find(p => p.id === prereq.powerId);
      const requiredPoints = prereq.powerPoints || 0;
      
      if (!ownedPower) {
        unmet.push(`Missing ${requiredPower?.name || prereq.powerId}`);
      } else if (ownedPower.points < requiredPoints) {
        unmet.push(`${requiredPower?.name || prereq.powerId} ${ownedPower.points}/${requiredPoints} points`);
      }
    }
  }

  return { met: unmet.length === 0, unmet };
}

// Calculate surge points
function calculateSurge(
  diePools: Record<AttributeName, DiePool>,
  stuff: number
): number {
  // Calculate total dice count for each Function
  const functionDice: Record<FunctionName, number> = {
    Resist: 0,
    Finesse: 0,
    Perceive: 0,
    Force: 0,
  };

  // Sum dice counts per function
  ATTRIBUTES.forEach(attr => {
    const pool = diePools[attr.id];
    const diceCount = pool.dice.length; // Count of dice, not sum of values
    functionDice[attr.func] += diceCount;
  });

  // Find highest function's dice count (base surge)
  const baseSurge = Math.max(
    functionDice['Resist'],
    functionDice['Finesse'],
    functionDice['Perceive'],
    functionDice['Force']
  );

  // Good Stuff adds +1 Surge per full 5 points (5–9 → +1, 10–14 → +2).
  // Bad Stuff bites from the first point: –1 to –5 costs 1 Surge, –6 to –10
  // costs 2, and so on. Surge floors at 0. 
  const stuffModifier = stuff >= 0
    ? Math.floor(stuff / 5)
    : -Math.ceil(Math.abs(stuff) / 5);

  return Math.max(0, baseSurge + stuffModifier);
}

export function calculateImmaterialSize(charismaRank: number, presenceRank: number): number {
  const charismaEntry = DIE_POOL_TABLE.find(e => e.rank === charismaRank);
  const presenceEntry = DIE_POOL_TABLE.find(e => e.rank === presenceRank);
  
  const charismaDice = charismaEntry ? charismaEntry.pool.dice.length : 0;
  const presenceDice = presenceEntry ? presenceEntry.pool.dice.length : 0;
  
  return (charismaDice + presenceDice) - 2;
}

// Calculate stuff (good or bad)
function calculateStuff(campaignLimit: number, pointsSpent: number): number {
  return campaignLimit - pointsSpent;
}

// Build a complete computed character
export function computeCharacter(
  name: string,
  campaignLimit: number,
  aspects: Character['aspects'],
  functions: Character['functions'],
  skills: Character['skills'],
  powers: Character['powers'],
  artifacts: Character['artifacts'],
  allies: Character['allies'],
  personalShadows: Character['personalShadows'],
  weapons: Character['weapons'],
  armor: Character['armor'],
  size: Character['size'],
  customTags: Character['customTags'] = [],
): Character {
  // Calculate all attributes
  const attributes: Record<AttributeName, number> = {} as Record<AttributeName, number>;
  const diePools: Record<AttributeName, { dice: number[]; notation: string; min: number; max: number }> = 
    {} as Record<AttributeName, { dice: number[]; notation: string; min: number; max: number }>;
  
  ATTRIBUTES.forEach(attr => {
    const value = calculateAttribute(
      functions[attr.func],
      aspects[attr.aspect]
    );
    attributes[attr.id] = value;
    diePools[attr.id] = getDiePoolEntry(value).pool;
  });
  
  // Calculate derived values
  const willpowerPool = diePools['Willpower'].dice.reduce((sum, d) => sum + d, 0);
  const memoryPool = diePools['Memory'].dice.reduce((sum, d) => sum + d, 0);
  
  const skillCap = calculateSkillCap(willpowerPool);
  const skillMaximum = calculateSkillMaximum(memoryPool);
  
  // Calculate total points
  let totalPointsSpent = 0;
  
  // Aspects
  totalPointsSpent += aspects.Form;
  totalPointsSpent += aspects.Flesh;
  totalPointsSpent += aspects.Mind;
  totalPointsSpent += aspects.Spirit;
  
  // Functions
  totalPointsSpent += functions.Resist;
  totalPointsSpent += functions.Finesse;
  totalPointsSpent += functions.Perceive;
  totalPointsSpent += functions.Force;
  
    // Skills
    totalPointsSpent += calculateSkillCosts(skills);

    // Powers
    totalPointsSpent += powers.reduce((sum, p) => sum + p.points, 0);

    // Artifacts, allies, shadows
    totalPointsSpent += artifacts.reduce((sum, a) => sum + (a.cost * a.quantity), 0);
    totalPointsSpent += allies.reduce((sum, a) => sum + a.cost, 0);
    totalPointsSpent += personalShadows.reduce((sum, s) => sum + s.cost, 0);
  
  const stuff = calculateStuff(campaignLimit, totalPointsSpent);
  const surge = calculateSurge(diePools, stuff);

  return {
    name,
    campaignLimit,
    aspects,
    functions,
    skills,
    powers,
    artifacts,
    allies,
    personalShadows,
    weapons,
    customTags,
    armor,
    size,
    attributes,
    diePools,
    skillCap,
    skillMaximum,
    totalPointsSpent,
    stuff,
    surge,
  };
}
