import { describe, expect, it } from 'vitest';
import { ATTRIBUTES, type Character } from '../types/character';
import { getDiePoolEntry } from '../data/diePoolTable';
import {
  calculateImmaterialSize, calculateSkillCap, calculateSkillMaximum,
  checkPowerPrerequisites, computeCharacter, getAttributeTierColor,
} from './calculations';

interface Over {
  campaignLimit?: number;
  aspects?: Character['aspects'];
  functions?: Character['functions'];
  skills?: Character['skills'];
  powers?: Character['powers'];
  artifacts?: Character['artifacts'];
  allies?: Character['allies'];
  shadows?: Character['personalShadows'];
}

const ZERO_ASPECTS: Character['aspects'] = { Form: 0, Flesh: 0, Mind: 0, Spirit: 0 };
const ZERO_FUNCTIONS: Character['functions'] = { Resist: 0, Finesse: 0, Perceive: 0, Force: 0 };

const compute = (o: Over = {}) => computeCharacter(
  'X',
  o.campaignLimit ?? 0,
  o.aspects ?? ZERO_ASPECTS,
  o.functions ?? ZERO_FUNCTIONS,
  o.skills ?? [],
  o.powers ?? [],
  o.artifacts ?? [],
  o.allies ?? [],
  o.shadows ?? [],
  [],
  [],
  0,
  [],
);

describe('attributes', () => {
  it('adds the function to the aspect', () => {
    const c = compute({ functions: { ...ZERO_FUNCTIONS, Force: 5 }, aspects: { ...ZERO_ASPECTS, Form: 3 } });
    expect(c.attributes.Strength).toBe(8);
  });

  it('gives every attribute the pool its value earns', () => {
    const c = compute({ aspects: { Form: 5, Flesh: -5, Mind: 10, Spirit: -10 } });
    for (const attr of ATTRIBUTES) {
      expect(c.diePools[attr.id].notation).toBe(getDiePoolEntry(c.attributes[attr.id]).pool.notation);
    }
  });
});

describe('skill limits', () => {
  it('caps the skill cap at Extraordinary', () => {
    expect(calculateSkillCap(4)).toBe(1);
    expect(calculateSkillCap(16)).toBe(4);
    expect(calculateSkillCap(400)).toBe(4);
  });

  it('derives the cap from Willpower', () => {
    expect(compute().skillCap).toBe(calculateSkillCap(
      getDiePoolEntry(0).pool.dice.reduce((s, d) => s + d, 0),
    ));
  });

  it('halves the memory pool for the maximum', () => {
    expect(calculateSkillMaximum(0)).toBe(0);
    expect(calculateSkillMaximum(9)).toBe(4);
  });
});

describe('immaterial size', () => {
  it('is two less than the combined dice', () => {
    expect(calculateImmaterialSize(8, 8)).toBe(2);
    expect(calculateImmaterialSize(0, 0)).toBe(0);
  });

  it('treats an unknown rank as no dice', () => {
    expect(calculateImmaterialSize(99, 99)).toBe(-2);
  });
});

describe('points and stuff', () => {
  it('sums every costed line', () => {
    const c = compute({
      aspects: { Form: 5, Flesh: 5, Mind: 5, Spirit: 5 },
      functions: { Resist: 5, Finesse: 5, Perceive: 5, Force: 5 },
      skills: [{ skillId: 'SilverTongue', rating: 'Exceptional', specialty: '', specialtyExplanation: '' }],
      powers: [{ id: 'p', powerId: 'p', points: 3, label: 'p', description: '' }],
      artifacts: [{ id: 'a', name: 'a', description: '', cost: 2, quantity: 3 }],
      allies: [{ id: 'y', name: 'y', description: '', cost: 4, loyalty: 1 }],
      shadows: [{ id: 's', name: 's', description: '', cost: 1 }],
    });
    expect(c.totalPointsSpent).toBe(20 + 20 + 5 + 3 + 6 + 4 + 1);
  });

  it('counts an artifact by quantity', () => {
    expect(compute({ artifacts: [{ id: 'a', name: 'a', description: '', cost: 2, quantity: 3 }] })
      .totalPointsSpent).toBe(6);
  });

  it('is the limit less what was spent', () => {
    expect(compute({ campaignLimit: 100, aspects: { ...ZERO_ASPECTS, Form: 30 } }).stuff).toBe(70);
  });
});

describe('surge', () => {
  it('takes the highest function, not the sum', () => {
    // The limit covers the 20 points Force costs, so stuff stays 0 and cannot
    // move the result. An attribute value is a cost, so Force 20 is rank 12
    // (2d12 + d6), not rank 20.
    const c = compute({ campaignLimit: 20, functions: { ...ZERO_FUNCTIONS, Force: 20 } });
    const forceDice = ATTRIBUTES
      .filter(a => a.func === 'Force')
      .reduce((s, a) => s + c.diePools[a.id].dice.length, 0);
    expect(c.surge).toBe(forceDice);
  });

  it('pays good stuff only in full fives', () => {
    expect(compute({ campaignLimit: 4 }).surge).toBe(compute().surge);
    expect(compute({ campaignLimit: 5 }).surge).toBe(compute().surge + 1);
    expect(compute({ campaignLimit: 10 }).surge).toBe(compute().surge + 2);
  });

  it('bites bad stuff from the first point', () => {
    expect(compute({ campaignLimit: -1 }).surge).toBe(compute().surge - 1);
    expect(compute({ campaignLimit: -6 }).surge).toBe(compute().surge - 2);
  });

  it('floors at zero', () => {
    expect(compute({ campaignLimit: -1000 }).surge).toBe(0);
  });
});

describe('tier colours', () => {
  it('steps down by band', () => {
    expect(getAttributeTierColor(40)).toBe('text-rose-400');
    expect(getAttributeTierColor(15)).toBe('text-emerald-400');
    expect(getAttributeTierColor(0)).toBe('text-amber-400');
    expect(getAttributeTierColor(-10)).toBe('text-violet-400');
    expect(getAttributeTierColor(-11)).toBe('text-blue-400');
  });
});

describe('power prerequisites', () => {
  const attrs = Object.fromEntries(ATTRIBUTES.map(a => [a.id, 5])) as Record<string, number>;
  const power = (prerequisites: unknown[]) => ({
    id: 'p', name: 'P', emoji: '', category: 'Substance' as const,
    description: '', requirements: '', keyAttributes: [], levels: [],
    prerequisites: prerequisites as never,
  });

  it('is met with no prerequisites', () => {
    expect(checkPowerPrerequisites(power([]), attrs as never, ZERO_ASPECTS, ZERO_FUNCTIONS, []).met).toBe(true);
  });

  it('reports a failed attribute', () => {
    const r = checkPowerPrerequisites(
      power([{ type: 'attribute', attribute: 'Strength', minimum: 10 }]),
      attrs as never, ZERO_ASPECTS, ZERO_FUNCTIONS, [],
    );
    expect(r.met).toBe(false);
    expect(r.unmet[0]).toContain('Strength 5 < 10');
  });

  it('reports a missing power', () => {
    const r = checkPowerPrerequisites(
      power([{ type: 'power', powerId: 'other' }]),
      attrs as never, ZERO_ASPECTS, ZERO_FUNCTIONS, [],
    );
    expect(r.met).toBe(false);
  });

  it('is met when the power is owned at the required points', () => {
    const r = checkPowerPrerequisites(
      power([{ type: 'power', powerId: 'other', powerPoints: 2 }]),
      attrs as never, ZERO_ASPECTS, ZERO_FUNCTIONS,
      [{ id: 'x', powerId: 'other', points: 5, label: 'o', description: '' }],
    );
    expect(r.met).toBe(true);
  });

  it('ignores a prerequisite gated above the current points', () => {
    const r = checkPowerPrerequisites(
      power([{ type: 'attribute', attribute: 'Strength', minimum: 99, appliesAtPoints: 10 }]),
      attrs as never, ZERO_ASPECTS, ZERO_FUNCTIONS, [], 5,
    );
    expect(r.met).toBe(true);
  });
});
