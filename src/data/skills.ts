import type { Skill, SkillRating } from '../types/character';
import { SKILL_RATINGS } from '../types/character';

export const SKILLS: Skill[] = [
  {
    id: 'SilverTongue',
    name: "The Silver Tongue",
    emoji: '🗣️',
    category: 'Social',
    description: 'Direct, personal mastery of rhetoric, empathy, and social cues to influence individuals.',
  },
  {
    id: 'WhisperersWeb',
    name: 'The Whisperers Web',
    emoji: '🕸️',
    category: 'Social',
    description: 'Understanding and navigation of complex social networks as systems.',
  },
  {
    id: 'LeadersMantle',
    name: "The Leader's Mantle",
    emoji: '👑',
    category: 'Social',
    description: 'Personal charisma and organizational acumen to build, lead, and maintain a group.',
  },
  {
    id: 'UnseenHand',
    name: 'The Unseen Hand',
    emoji: '🎭',
    category: 'Social',
    description: 'Indirect manipulation of events, systems, and people without revealing involvement.',
  },
  {
    id: 'WayOfTheWarrior',
    name: 'The Way of the Warrior',
    emoji: '⚔️',
    category: 'Physical',
    description: 'Mastery of direct, personal confrontation and physical conditioning.',
  },
  {
    id: 'WayOfTheRogue',
    name: 'The Way of the Rogue',
    emoji: '🗡️',
    category: 'Physical',
    description: 'Asymmetric action, stealth, and exploitation of unseen weaknesses.',
  },
  {
    id: 'EngineersPen',
    name: "The Engineer's Pen",
    emoji: '🖋️',
    category: 'Physical',
    description: 'Understanding and application of fundamental principles of logic, physics, and structure.',
  },
  {
    id: 'WayOfTheExplorer',
    name: 'The Way of the Explorer',
    emoji: '🧭',
    category: 'Physical',
    description: 'Resilience, adaptability, and practical knowledge to survive hostile environments.',
  },
  {
    id: 'HeartsFire',
    name: "The Heart's Fire",
    emoji: '❤️‍🔥',
    category: 'Abstract',
    description: 'Creation of profound emotional connection through performance and presence.',
  },
  {
    id: 'ArtisansCraft',
    name: "The Artisan's Craft",
    emoji: '🔨',
    category: 'Abstract',
    description: 'Tangible creation, repair, and appraisal of physical objects through practiced skill.',
  },
  {
    id: 'MachinesMind',
    name: "The Machine's Mind",
    emoji: '🤖',
    category: 'Abstract',
    description: 'Understanding, operation, and manipulation of complex non-physical systems.',
  },
  {
    id: 'ScholarsMind',
    name: "The Scholar's Mind",
    emoji: '📚',
    category: 'Abstract',
    description: 'Acquisition, analysis, and synthesis of knowledge through research and deduction.',
  },
];

const SKILL_MODIFIERS: Record<string, number> = Object.fromEntries(
  SKILL_RATINGS.map(r => [r.rating, r.modifier])
);

/** Skill rating -> per-die modifier. */
export function getSkillModifier(rating: SkillRating): number {
  return SKILL_MODIFIERS[rating] ?? 0;
}

const SKILL_COSTS: Record<string, number> = Object.fromEntries(
  SKILL_RATINGS.map(r => [r.rating, r.cost])
);

/** Skill rating -> development point cost. */
export function getSkillCost(rating: SkillRating): number {
  return SKILL_COSTS[rating] ?? 0;
}

/** Total development points spent on a list of skills. */
export function getTotalSkillCost(skills: { rating: SkillRating }[]): number {
  return skills.reduce((sum, s) => sum + getSkillCost(s.rating), 0);
}

/** Total per-die modifier across a list of skills. */
export function getTotalSkillModifier(skills: { rating: SkillRating }[]): number {
  return skills.reduce((sum, s) => sum + getSkillModifier(s.rating), 0);
}