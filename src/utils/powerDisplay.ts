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
  label?: string
): PowerDisplay {
  const level = getLevelForPoints(power, points);
  const pointsStr = points > 0 ? `${points}` : `${points}`;
  
  // Minor Powers
  if (power.id === 'minorPower') {
    const title = label || 'Minor Power';
    const category = points < 0 ? 'Limitation' : points === 0 ? 'Trivial' : 'Minor Power';
    return { title, systemReference: `${category} • ${pointsStr} pts` };
  }
  
  // Powers with subpowers (Psionics, Artifice)
  if (power.subPowers && power.practitioner && power.subPowerAdjectives) {
    const adjective = power.subPowerAdjectives[label || ''] || '';
    const rank = level?.name || '';
    
    if (label && adjective) {
      // Construct: "Telepathic Psion", "Master Telepathic Psion", "Supreme Telepathic Psion"
      let title: string;
      if (rank === 'Adept' || rank === '') {
        title = `${adjective} ${power.practitioner}`;
      } else {
        title = `${rank} ${adjective} ${power.practitioner}`;
      }
      return { title, systemReference: `${power.name} • ${adjective} ${rank} • ${pointsStr} pts` };
    }
    return { title: power.name, systemReference: `${power.name} • ${rank} ${adjective} ${power.practitioner} • ${pointsStr} pts` };
  }
  
  // Standard powers with custom label
  if (label) {
    return {
      title: label,
      systemReference: level ? `${power.name} • ${level.name} • ${pointsStr} pts` : `${power.name} • ${pointsStr} pts`,
    };
  }
  
  // Standard powers - use level name as title
  if (level) {
    return { title: level.name, systemReference: `${power.name} • ${level.name} • ${pointsStr} pts` };
  }
  
  return { title: power.name, systemReference: `${power.name} • ${pointsStr} pts` };
}