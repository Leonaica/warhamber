import type { CharacterAspectRatings, CharacterFunctionRatings, CharacterSkill, CharacterPower, Artifact, Ally, PersonalShadow } from '../types/character';
import { ASPECTS, FUNCTIONS, ATTRIBUTES, SKILL_RATINGS } from '../types/character';
import { SKILLS } from '../data/skills';
import { POWERS } from '../data/powers';
import { getDiePoolEntry } from '../data/diePoolTable';

interface CharacterSheetProps {
  name: string;
  campaignLimit: number;
  aspects: CharacterAspectRatings;
  functions: CharacterFunctionRatings;
  skills: CharacterSkill[];
  powers: CharacterPower[];
  artifacts: Artifact[];
  allies: Ally[];
  personalShadows: PersonalShadow[];
  stuff: number;
  surge: number;
}

function dieNotation(dice: number[]): string {
  const counts: Record<number, number> = {};
  dice.forEach(d => {
    counts[d] = (counts[d] || 0) + 1;
  });
  
  const parts: string[] = [];
  Object.entries(counts)
    .map(([size, count]) => ({ size: parseInt(size), count }))
    .sort((a, b) => b.size - a.size)
    .forEach(({ size, count }) => {
      if (count === 1) {
        parts.push(`d${size}`);
      } else {
        parts.push(`${count}d${size}`);
      }
    });
  
  return parts.join(' + ');
}

export function CharacterSheet({
  name,
  campaignLimit,
  aspects,
  functions,
  skills,
  powers,
  artifacts,
  allies,
  personalShadows,
  stuff,
  surge,
}: CharacterSheetProps) {
  // Calculate skill costs
  const skillCostTotal = skills.reduce((sum, skill) => {
    const rating = SKILL_RATINGS.find(r => r.rating === skill.rating);
    return sum + (rating?.cost || 0);
  }, 0);

  // Calculate cap and max
  const willpowerPool = getDiePoolEntry(functions['Resist'] + aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
  const memoryPool = getDiePoolEntry(functions['Perceive'] + aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
  const skillCap = Math.min(Math.floor(willpowerPool / 4), 4);
  const skillMax = Math.floor(memoryPool / 2);

  // Power cost total
  const powerCostTotal = powers.reduce((sum, cp) => sum + cp.points, 0);

  // Artifact cost total
  const artifactCostTotal = artifacts.reduce((sum, a) => sum + a.cost * a.quantity, 0);

  // Ally cost total
  const allyCostTotal = allies.reduce((sum, a) => sum + a.cost, 0);

  // Shadow cost total
  const shadowCostTotal = personalShadows.reduce((sum, s) => sum + s.cost, 0);

  const stuffText = stuff >= 0 ? `+${stuff} Good Stuff` : `${stuff} Bad Stuff`;

  return (
    <div className="character-sheet">
      {/* Header */}
      <div className="sheet-header">
        <div className="character-name">{name || 'Unnamed Character'}</div>
        <div className="character-campaign">{campaignLimit} Points</div>
      </div>

      {/* Attributes Grid */}
      <div className="attributes-section">
        <h2>Attributes</h2>
        <table className="attributes-table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              {ASPECTS.map(aspect => (
                <th key={aspect.id}>
                  <div className="aspect-name">{aspect.emoji} {aspect.name}</div>
                  <div className="aspect-value">[{aspects[aspect.id] >= 0 ? '+' : ''}{aspects[aspect.id]}]</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNCTIONS.map(func => {
              const funcRating = functions[func.id];
              return (
                <tr key={func.id}>
                  <td className="func-name">{func.emoji}</td>
                  <td className="func-value">
                    <span className="func-label">{func.name}</span>
                    <span className="func-rating">{funcRating >= 0 ? '+' : ''}{funcRating}</span>
                  </td>
                  {ASPECTS.map(aspect => {
                    const attr = ATTRIBUTES.find(a => a.func === func.id && a.aspect === aspect.id);
                    if (!attr) return <td key={aspect.id}></td>;
                    const value = funcRating + aspects[aspect.id];
                    const pool = getDiePoolEntry(value).pool;
                    return (
                      <td key={aspect.id} className="attr-cell">
                        <div className="attr-name">{attr.name}</div>
                        <div className="attr-dice">{dieNotation(pool.dice)}</div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat surge">
          <span className="stat-label">Surge</span>
          <span className="stat-value">{surge}</span>
        </div>
        <div className={`stat stuff ${stuff >= 0 ? 'good' : 'bad'}`}>
          <span className="stat-label">Stuff</span>
          <span className="stat-value">{stuffText}</span>
        </div>
        <div className="stat skills-meta">
          <span className="stat-label">Skills</span>
          <span className="stat-value">Cap +{skillCap}, Max {skillMax}</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="two-column">
        <div className="column left-column">
          {/* Powers */}
          {powers.length > 0 && (
            <div className="section">
              <h3>✨ Powers [{powerCostTotal} pts]</h3>
              <ul className="power-list">
                {powers.map(cp => {
                  const power = POWERS.find(p => p.id === cp.powerId);
                  if (!power) return null;
                  return (
                    <li key={cp.id}>
                      <strong>{power.name}</strong>
                      <span className="cost"> [{cp.points} pts]</span>
                      {cp.label && <span className="label"> — {cp.label}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="section">
              <h3>🎓 Skills [{skillCostTotal} pts]</h3>
              <ul className="skill-list">
                {skills.map(skillEntry => {
                  const skill = SKILLS.find(s => s.id === skillEntry.skillId);
                  if (!skill) return null;
                  const rating = SKILL_RATINGS.find(r => r.rating === skillEntry.rating);
                  return (
                    <li key={skillEntry.skillId}>
                      <strong>{skill.name}</strong>
                      <span className="rating"> {skillEntry.rating}</span>
                      {rating && <span className="modifier"> ({rating.modifier >= 0 ? '+' : ''}{rating.modifier})</span>}
                      {skillEntry.specialty && <span className="specialty"> — {skillEntry.specialty}</span>}
                      {skillEntry.specialtyExplanation && <span className="specialtydescription"> — {skillEntry.specialtyExplanation}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Artifacts */}
          {artifacts.length > 0 && (
            <div className="section">
              <h3>🗡️ Artifacts [{artifactCostTotal} pts]</h3>
              <ul className="artifact-list">
                {artifacts.map(artifact => (
                  <li key={artifact.id}>
                    <strong>{artifact.name}</strong>
                    {artifact.quantity > 1 && <span> ×{artifact.quantity}</span>}
                    <span className="cost"> [{artifact.cost} pts]</span>
                    {artifact.description && <span className="desc"> — {artifact.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="column right-column">
          {/* Personal Shadows */}
          {personalShadows.length > 0 && (
            <div className="section">
              <h3>🌓 Personal Shadows [{shadowCostTotal} pts]</h3>
              <ul className="shadow-list">
                {personalShadows.map(shadow => (
                  <li key={shadow.id}>
                    <strong>{shadow.name}</strong>
                    <span className="cost"> [{shadow.cost} pts]</span>
                    {shadow.description && <span className="desc"> — {shadow.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Allies & Enemies */}
          {allies.length > 0 && (
            <div className="section">
              <h3>🤝 Allies & Enemies [{allyCostTotal} pts]</h3>
              <ul className="ally-list">
                {allies.map(ally => {
                  const loyaltyClass = ally.loyalty < 0 ? 'enemy' : ally.loyalty > 3 ? 'devotee' : 'ally';
                  return (
                    <li key={ally.id} className={loyaltyClass}>
                      <strong>{ally.name}</strong>
                      <span className="cost"> [{ally.cost} pts]</span>
                      {ally.description && <span className="desc"> — {ally.description}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Point Summary */}
          <div className="section point-summary">
            <h3>📊 Point Summary</h3>
            <div className="summary-row">
              <span>Aspects & Functions:</span>
              <span>{Object.values(aspects).reduce<number>((s, v) => s + v, 0) + Object.values(functions).reduce<number>((s, v) => s + v, 0)}</span>
            </div>
            <div className="summary-row">
              <span>Skills:</span>
              <span>{skillCostTotal}</span>
            </div>
            <div className="summary-row">
              <span>Powers:</span>
              <span>{powerCostTotal}</span>
            </div>
            <div className="summary-row">
              <span>Artifacts:</span>
              <span>{artifactCostTotal}</span>
            </div>
            <div className="summary-row">
              <span>Allies:</span>
              <span>{allyCostTotal}</span>
            </div>
            <div className="summary-row">
              <span>Shadows:</span>
              <span>{shadowCostTotal}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{campaignLimit - stuff}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}