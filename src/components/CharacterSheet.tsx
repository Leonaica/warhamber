import { ASPECTS, FUNCTIONS, ATTRIBUTES } from '../types/character';
import type { WeaponTagRef } from '../types/character';
import { SKILLS, getSkillModifier, getTotalSkillCost } from '../data/skills';
import { calculateSkillCap, calculateSkillMaximum } from '../utils/calculations';
import { POWERS } from '../data/powers';
import { getDiePoolEntry } from '../data/diePoolTable';
import { formatMagnitude, formatRange } from '../data/weaponData'
import { resolveTagRef, idsToRefs, formatTagLabel, formatTagEffect } from '../data/weaponTags';
import { useCharacter } from '../context/useCharacter'
import { useTagResolveContext } from '../context/useTagResolveContext'
import { buildMythicTraits } from '../utils/powerDisplay';
import { SOAK_ATTRIBUTES, PARRY_POOL_ATTRIBUTES, DODGE_ATTRIBUTES } from '../data/aspectAttributes';
import { WOUND_LABELS, WOUND_PENALTIES, type WoundLevel } from '../data/wounds';

import './CharacterSheet.css';

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

/** Empty boxes to tick at the table. */
function TickBoxes({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="inline-block w-3 h-3 border border-black"></span>
      ))}
    </span>
  );
}

/** Eight wound boxes, numbered to match the ladder beneath the table. */
function WoundBoxes() {
  return (
    <span className="inline-flex gap-0.5 ml-1">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center w-3.5 h-3.5 border border-black text-[8px] leading-none"
        >
          {i + 1}
        </span>
      ))}
    </span>
  );
}

export function CharacterSheet() {
  const character = useCharacter();
  const c = character.computedCharacter;
  const tagCtx = useTagResolveContext();

  // Calculate skill costs
  const skillCostTotal = getTotalSkillCost(character.skills);

  // Calculate cap and max
  const willpowerPool = getDiePoolEntry(character.functions['Resist'] + character.aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
  const memoryPool = getDiePoolEntry(character.functions['Perceive'] + character.aspects['Mind']).pool.dice.reduce((s, d) => s + d, 0);
  const skillCap = calculateSkillCap(willpowerPool);
  const skillMax = calculateSkillMaximum(memoryPool);

  // Power cost total
  const powerCostTotal = character.powers.reduce((sum, cp) => sum + cp.points, 0);

  const mythicTraits = buildMythicTraits(
    character.aspects,
    character.functions,
    character.aspectExplanations,
    character.functionExplanations,
  );

  const powerListItems = [
    ...mythicTraits.map(t => ({
      key: t.id,
      emoji: t.emoji,
      title: t.title,
      points: t.points,
      note: 'Mythic',
      description: t.description,
    })),
    ...character.powers.flatMap(cp => {
      const power = POWERS.find(p => p.id === cp.powerId);
      if (!power) return [];
      return [{
        key: cp.id,
        emoji: power.emoji,
        title: power.name,
        points: cp.points,
        note: cp.label ?? '',
        description: cp.description ?? '',
      }];
    }),
  ].sort((a, b) => b.points - a.points);

  // Artifact cost total
  const artifactCostTotal = character.artifacts.reduce((sum, a) => sum + a.cost * a.quantity, 0);

  // Ally cost total
  const allyCostTotal = character.allies.reduce((sum, a) => sum + a.cost, 0);

  // Shadow cost total
  const shadowCostTotal = character.personalShadows.reduce((sum, s) => sum + s.cost, 0);

  const stuffText = c.stuff === 0 ? 'Neutral Stuff' : `${Math.abs(c.stuff)} ${c.stuff > 0 ? 'Good' : 'Bad'} Stuff`;

  return (
    <div className="character-sheet">
      <div className="sheet-table">
        <div className="sheet-cell">

      {/* Header */}
      <div className="sheet-header">
        <div className="character-name">{c.name || 'Unnamed Character'}</div>
        <div className="character-campaign">
          {c.totalPointsSpent} / {character.campaignLimit} Points · {stuffText}
        </div>
      </div>
  
      {/* Attributes Grid */}
      <div className="section attributes-section">
        <h3>Attributes</h3>
        <table className="attributes-table">
          <thead>
            <tr>
              <th></th>
              <th></th>
              {ASPECTS.map(aspect => (
                <th key={aspect.id}>
                  <div className="aspect-name">{aspect.emoji} {aspect.name}</div>
                  <div className="aspect-value">[{character.aspects[aspect.id] >= 0 ? '+' : ''}{character.aspects[aspect.id]}]</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNCTIONS.map(func => {
              const funcRating = character.functions[func.id];
              return (
                <tr key={func.id}>
                  <td className="func-name">{func.emoji}</td>
                  <td className="func-value">
                    <div className="func-label">{func.name}</div>
                    <div className="func-rating">[{funcRating >= 0 ? '+' : ''}{funcRating}]</div>
                  </td>
                  {ASPECTS.map(aspect => {
                    const attr = ATTRIBUTES.find(a => a.func === func.id && a.aspect === aspect.id);
                    if (!attr) return <td key={aspect.id}></td>;
                    const value = funcRating + character.aspects[aspect.id];
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

      {/* Play State — tick boxes to mark at the table */}
      <div className="section">
        <h3>🎲 Play State</h3>
        <div className="summary-row">
          <span>Surge:</span>
          <span>{c.surge} <TickBoxes count={c.surge} /></span>
        </div>
        <div className="summary-row">
          <span>Physical Init:</span>
          <span>{dieNotation(c.diePools['Reflexes'].dice)} / {dieNotation(c.diePools['Agility'].dice)} (lower)</span>
        </div>
        <div className="summary-row">
          <span>Mental Init:</span>
          <span>{dieNotation(c.diePools['Inspiration'].dice)} / {dieNotation(c.diePools['Intelligence'].dice)} (lower)</span>
        </div>
        <div className="summary-row">
          <span>Pace:</span>
          <span>{character.pace.walking.mph}/{character.pace.sprinting.mph} mph ({character.pace.walking.kph}/{character.pace.sprinting.kph} kph)</span>
        </div>
      </div>

      <div className="section">
        <h3>🩸 Aspects State</h3>
        <table className="equipment-table aspects-state-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>Wounds</th>
              <th>Parry</th>
              <th>Dodge</th>
              <th>Soak</th>
            </tr>
          </thead>
          <tbody>
            {ASPECTS.map(a => {
              const parryAttr = PARRY_POOL_ATTRIBUTES[a.id];
              const dodgeAttr = DODGE_ATTRIBUTES[a.id];
              const parryDice = c.diePools[parryAttr]?.dice.length ?? 0;
              const dodgeDice = dodgeAttr ? (c.diePools[dodgeAttr]?.dice.length ?? 0) : 0;

              const soakAttrDef = ATTRIBUTES.find(attr => attr.name === SOAK_ATTRIBUTES[a.id]);
              const soakValue = soakAttrDef
                ? character.functions[soakAttrDef.func] + character.aspects[soakAttrDef.aspect]
                : 0;
              const sizeMod = ((a.id === 'Form' || a.id === 'Flesh')
                ? character.size
                : character.immaterialSize) * 4;
              const finalSoak = getDiePoolEntry(soakValue).rank + sizeMod;

              return (
                <tr key={a.id}>
                  <td>{a.emoji} {a.name}</td>
                  <td><WoundBoxes /></td>
                  <td><TickBoxes count={parryDice} /> <span className="desc">{parryAttr}</span></td>
                  <td>
                    {dodgeAttr
                      ? <><TickBoxes count={dodgeDice} /> <span className="desc">{dodgeAttr}</span></>
                      : <span className="desc">Surprise Roll ({dieNotation(c.diePools['Reflexes'].dice)})</span>}
                  </td>
                  <td>{finalSoak}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="wound-legend">
          {Array.from({ length: 8 }, (_, i) => {
            const level = (i + 1) as WoundLevel;
            const pen = WOUND_PENALTIES[level];
            return (
              <span key={level}>
                <strong>L{level}</strong> {WOUND_LABELS[level].label}
                {pen !== 0 && <> {pen}/die</>}
              </span>
            );
          })}
        </div>
      </div>

      {/* Equipment Section */}
      {(character.weapons.length > 0 || character.armor.length > 0) && (
        <div className="section equipment-section">
          <h3>⚔️ Equipment</h3>
          
          {character.weapons.length > 0 && (
            <div className="weapons-block">
              <h4>Weapons</h4>
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Handedness</th>
                    <th>Attack Details</th>
                    <th>Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {character.weapons.map(weapon => {
                    const refs: WeaponTagRef[] = weapon.tags ?? idsToRefs(weapon.tagIds ?? []);
                    const resolvedTags = refs
                      .map(ref => resolveTagRef(ref, character.customTags, tagCtx))
                      .filter((t): t is NonNullable<typeof t> => t !== null);
                    return (
                      <tr key={weapon.id}>
                        <td><strong>{weapon.name}</strong></td>
                        <td>{weapon.category}</td>
                        <td>{weapon.handedness}</td>
                        <td>
                          {weapon.attacks.map(attack => {
                            const penValue = typeof attack.penetration === 'number' 
                              ? attack.penetration 
                              : Array.isArray(attack.penetration) 
                                ? attack.penetration[0] 
                                : 0;
                            return (
                              <div key={attack.id} className="attack-detail">
                                {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {formatMagnitude(attack.magnitude)} {attack.type}
                                {penValue > 0 && ` (Pen ${penValue})`}
                                {attack.range && ` • ${formatRange(attack.range)}`}
                              </div>
                            );
                          })}
                        </td>
                        <td>
                          <div className="tag-list">
                          {resolvedTags.map(({ def, x }) => {
                              const effectText = formatTagEffect(def, x);
                              return (
                                <div key={def.id} className="tag-entry">
                                  <strong>{formatTagLabel(def, x)}</strong>
                                  {effectText && <span className="tag-effect"> — {effectText}</span>}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {character.armor.length > 0 && (
            <div className="armor-block">
              <h4>Armor</h4>
              <table className="equipment-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Aspects</th>
                    <th>Armor</th>
                    <th>Location</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {character.armor.map(piece => {
                    const aspectEmojis: Record<string, string> = {
                      Form: '🧱', Flesh: '🧬', Mind: '🧠', Spirit: '🔥'
                    };
                    return (
                      <tr key={piece.id}>
                        <td><strong>{piece.name}</strong></td>
                        <td>{piece.aspects.map(a => `${aspectEmojis[a] || ''} ${a}`).join(', ')}</td>
                        <td>{piece.armor}</td>
                        <td>{piece.location || '—'}</td>
                        <td>{piece.notes?.join(', ') || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="two-column">
        <div className="column left-column">
          {/* Powers — mythic Aspects/Functions are written up here too */}
          {powerListItems.length > 0 && (
            <div className="section">
              <h3>✨ Powers [{powerCostTotal} pts]</h3>
              <ul className="power-list">
                {powerListItems.map(item => (
                  <li key={item.key}>
                    <strong>{item.emoji} {item.title}</strong>
                    <span className="cost"> [{item.points} pts]</span>
                    {item.note && <span className="label"> — {item.note}</span>}
                    {item.description && <span className="desc"> — {item.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {character.skills.length > 0 && (
            <div className="section">
              <h3>🎓 Skills [{skillCostTotal} pts] <span className="heading-note">Cap +{skillCap} / Max {skillMax}</span></h3>
              <ul className="skill-list">
                {character.skills.map(skillEntry => {
                  const skill = SKILLS.find(s => s.id === skillEntry.skillId);
                  if (!skill) return null;
                  const modifier = getSkillModifier(skillEntry.rating);
                  return (
                    <li key={skillEntry.skillId}>
                      <strong>{skill.name}</strong>
                      <span className="rating"> {skillEntry.rating}</span>
                      <span className="modifier"> ({modifier >= 0 ? '+' : ''}{modifier})</span>
                      {skillEntry.specialty && <span className="specialty"> — {skillEntry.specialty}</span>}
                      {skillEntry.specialtyExplanation && <span className="specialtydescription"> — {skillEntry.specialtyExplanation}</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Artifacts */}
          {character.artifacts.length > 0 && (
            <div className="section">
              <h3>🗡️ Artifacts [{artifactCostTotal} pts]</h3>
              <ul className="artifact-list">
                {character.artifacts.map(artifact => (
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
          {character.personalShadows.length > 0 && (
            <div className="section">
              <h3>🌓 Personal Shadows [{shadowCostTotal} pts]</h3>
              <ul className="shadow-list">
                {character.personalShadows.map(shadow => (
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
          {character.allies.length > 0 && (
            <div className="section">
              <h3>🤝 Allies & Enemies [{allyCostTotal} pts]</h3>
              <ul className="ally-list">
                {character.allies.map(ally => {
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
              <span>{Object.values(character.aspects).reduce<number>((s, v) => s + v, 0) + Object.values(character.functions).reduce<number>((s, v) => s + v, 0)}</span>
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
              <span>{c.totalPointsSpent} / {character.campaignLimit}</span>
            </div>
          </div>
        </div>   {/* .right-column */}
      </div>     {/* .two-column */}
    </div>       {/* .sheet-cell */}
    <div className="sheet-running-foot">
      <div className="foot-row">
        <span>{c.name || 'Unnamed Character'} — WarhAmber</span>
        <span>{c.totalPointsSpent} / {character.campaignLimit} pts</span>
      </div>
    </div>
      </div>         {/* .sheet-table */}
    </div> 
  );
}