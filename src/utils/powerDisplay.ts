import type { Power } from '../types/character';

interface PowerDisplay {
  title: string;
  systemReference: string;
}

function getLevelForPoints(power: Power, points: number): { name: string; cost: number } | null {
  if (power.id === 'minorPower') {
    if (points < 0) return { name: 'Limitation', cost: points };
    if (points === 0) return { name: 'Trivial', cost: 0 };
    return { name: 'Minor', cost: points };
  }
  
  const sortedLevels = [...power.levels].sort((a, b) => b.cost - a.cost);
  for (const level of sortedLevels) {
    if (points >= level.cost) {
      return level;
    }
  }
  return power.levels[0] || null;
}

export function getPowerDisplay(
  power: Power,
  points: number,
  label?: string,
  customTitle?: string
): PowerDisplay {
  const level = getLevelForPoints(power, points);
  const levelName = level?.name || '';
  const pointsStr = points < 0 ? `–${Math.abs(points)}` : `${points}`;

  // Minor Powers: "Limitation • –3 pts" or "Minor • 2 pts"
  if (power.id === 'minorPower') {
    const title = customTitle || label || 'Minor Power';
    return { title, systemReference: `${levelName} • ${pointsStr} pts` };
  }

  // Powers with subpowers (Psionics, Artifice)
  if (power.subPowers && power.practitioner && power.subPowerAdjectives) {
    const adjective = power.subPowerAdjectives[label || ''] || '';
    
    // systemReference always uses system terminology, not customTitle
    const systemName = label && adjective
      ? `${adjective} ${power.practitioner}`
      : power.name;
    const systemReference = `${levelName} • ${systemName} • ${pointsStr} pts`;
    
    // Title: customTitle takes precedence
    if (customTitle) {
      return { title: customTitle, systemReference };
    }
    
    // Construct title from discipline + rank + practitioner
    if (label && adjective) {
      const title = levelName === 'Adept' || levelName === ''
        ? `${adjective} ${power.practitioner}`
        : `${levelName} ${adjective} ${power.practitioner}`;
      return { title, systemReference };
    }
    
    return { title: power.name, systemReference };
  }

  // Standard powers
  // Title: customTitle > label > level name > power name
  const title = customTitle || label || levelName || power.name;
  
  // systemReference always uses power.name (system reference), never customTitle
  const systemReference = `${levelName} • ${power.name} • ${pointsStr} pts`;
  
  return { title, systemReference };
}