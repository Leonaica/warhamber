import { useCharacter } from '../context/CharacterContext';
import {
  ASPECTS, FUNCTIONS, ATTRIBUTES, SKILL_RATINGS, SIZE_OPTIONS,
  type AspectName, type FunctionName, type AttributeName,
  type SkillName, type SkillRating,
} from '../types/character';

const SKILL_MODIFIERS: Record<SkillRating, number> = Object.fromEntries(
  SKILL_RATINGS.map(s => [s.rating, s.modifier])
) as Record<SkillRating, number>;

const SKILL_NAMES: Record<SkillName, string> = {
  SilverTongue: "Silver Tongue",
  WhisperersWeb: "Whisperer's Web",
  LeadersMantle: "Leader's Mantle",
  UnseenHand: "Unseen Hand",
  WayOfTheWarrior: "Way of the Warrior",
  WayOfTheRogue: "Way of the Rogue",
  EngineersPen: "Engineer's Pen",
  WayOfTheExplorer: "Way of the Explorer",
  HeartsFire: "Heart's Fire",
  ArtisansCraft: "Artisan's Craft",
  MachinesMind: "Machine's Mind",
  ScholarsMind: "Scholar's Mind",
};

// Attributes used for Parry/Dodge keyed by Aspect
const DEFENSE_ATTRIBUTES: Record<AspectName, AttributeName> = {
  Form: 'Agility',
  Flesh: 'Reflexes',
  Mind: 'Intelligence',
  Spirit: 'Creativity',
};

const DODGE_ATTRIBUTES: Record<AspectName, AttributeName | null> = {
  Form: 'Agility',
  Flesh: null,
  Mind: 'Intelligence',
  Spirit: 'Creativity',
};

export function PrintableSheet() {
  const character = useCharacter();

  if (!character.hasCharacter) return null;
  const c = character.computedCharacter;

  const getDieNotation = (attrName: AttributeName): string =>
    c.diePools[attrName]?.notation ?? '—';

  const getAttr = (aspectId: AspectName, funcId: FunctionName) =>
    ATTRIBUTES.find(a => a.aspect === aspectId && a.func === funcId)!;

  const sizeLabel = SIZE_OPTIONS.find(s => s.value === character.size)?.label ?? 'Average';
  const immaterialSizeLabel = SIZE_OPTIONS.find(s => s.value === character.immaterialSize)?.label ?? 'Average';

  // Render a row of empty boxes for ticking during play
  const renderTickBoxes = (count: number) => (
    <span className="inline-flex gap-0.5 ml-1">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="inline-block w-3 h-3 border border-black"></span>
      ))}
    </span>
  );

  return (
    <div className="hidden print:block text-black bg-white p-6 text-xs leading-tight">
      {/* Header */}
      <div className="border-b-2 border-black pb-2 mb-3 break-inside-avoid">
        <h1 className="text-2xl font-bold">{c.name}</h1>
        <div className="text-sm">
          Campaign Limit: {c.campaignLimit} | Spent: {c.totalPointsSpent} |{' '}
          Stuff: {c.stuff > 0 ? `Good ${c.stuff}` : c.stuff < 0 ? `Bad ${Math.abs(c.stuff)}` : 'Neutral'} |{' '}
          Surge: {c.surge} | Material Size: {sizeLabel} | Immaterial Size: {immaterialSizeLabel}
        </div>
      </div>

      {/* Aspects & Functions */}
      <div className="grid grid-cols-2 gap-4 mb-3 break-inside-avoid">
        <div>
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Aspects</h2>
          {ASPECTS.map(a => (
            <div key={a.id} className="flex justify-between">
              <span>{a.name}</span>
              <span>{c.aspects[a.id]}</span>
            </div>
          ))}
        </div>
        <div>
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Functions</h2>
          {FUNCTIONS.map(f => (
            <div key={f.id} className="flex justify-between">
              <span>{f.name}</span>
              <span>{c.functions[f.id]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attributes & Die Pools */}
      <div className="mb-3 break-inside-avoid">
        <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Attributes & Die Pools</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left border-b border-gray-300 py-0.5"></th>
              {ASPECTS.map(a => (
                <th key={a.id} className="text-center border-b border-gray-300 py-0.5">{a.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FUNCTIONS.map(func => (
              <tr key={func.id}>
                <td className="font-medium py-0.5 pr-2">{func.name}</td>
                {ASPECTS.map(aspect => {
                  const attr = getAttr(aspect.id, func.id);
                  return (
                    <td key={aspect.id} className="text-center py-0.5">
                      <div>{attr.name}</div>
                      <div className="text-gray-600">{getDieNotation(attr.id)}</div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Skills */}
      {c.skills.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Skills</h2>
          <div className="grid grid-cols-2 gap-x-4">
            {c.skills.map(skill => (
              <div key={skill.skillId}>
                <span className="font-medium">{SKILL_NAMES[skill.skillId]}</span>
                <span className="text-gray-600">
                  {' '}{skill.rating} ({SKILL_MODIFIERS[skill.rating] >= 0 ? '+' : ''}{SKILL_MODIFIERS[skill.rating]})
                </span>
                {skill.specialty && (
                  <span className="text-gray-500"> — {skill.specialty}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Powers */}
      {c.powers.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Powers</h2>
          {c.powers.map(power => (
            <div key={power.id} className="mb-1">
              <span className="font-medium">{power.label}</span>
              <span className="text-gray-600"> ({power.points} pts)</span>
              {power.customTitle && <span className="text-gray-500"> — {power.customTitle}</span>}
              <div className="text-gray-600 ml-3">{power.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Artifacts */}
      {c.artifacts.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Artifacts</h2>
          {c.artifacts.map(art => (
            <div key={art.id} className="mb-0.5">
              <span className="font-medium">{art.name}</span>
              <span className="text-gray-600"> ({art.cost} pts{art.quantity > 1 ? `, x${art.quantity}` : ''})</span>
              <div className="text-gray-600 ml-3">{art.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Allies */}
      {c.allies.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Allies</h2>
          {c.allies.map(ally => (
            <div key={ally.id} className="mb-0.5">
              <span className="font-medium">{ally.name}</span>
              <span className="text-gray-600"> ({ally.cost} pts, Loyalty {ally.loyalty > 0 ? `+${ally.loyalty}` : ally.loyalty})</span>
              <div className="text-gray-600 ml-3">{ally.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Personal Shadows */}
      {c.personalShadows.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Personal Shadows</h2>
          {c.personalShadows.map(shadow => (
            <div key={shadow.id} className="mb-0.5">
              <span className="font-medium">{shadow.name}</span>
              <span className="text-gray-600"> ({shadow.cost} pts)</span>
              <div className="text-gray-600 ml-3">{shadow.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Weapons */}
      {c.weapons.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Weapons</h2>
          {c.weapons.map(weapon => (
            <div key={weapon.id} className="mb-1">
              <span className="font-medium">{weapon.name}</span>
              <span className="text-gray-600">
                {' '}({weapon.category}, {weapon.handedness}{weapon.ammo ? `, ${weapon.ammo}` : ''})
              </span>
              {weapon.attacks.map(atk => (
                <div key={atk.id} className="ml-3 text-gray-600">
                  {atk.aspect} {atk.type}: Mag {atk.magnitude}, Pen{' '}
                  {Array.isArray(atk.penetration) ? `${atk.penetration[0]}-${atk.penetration[1]}` : atk.penetration},{' '}
                  Range {atk.range}
                  {atk.isConditional && atk.condition && <span className="italic"> ({atk.condition})</span>}
                </div>
              ))}
              {weapon.notes?.map((n, i) => (
                <div key={i} className="ml-3 text-gray-500 italic">{n}</div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Armor */}
      {c.armor.length > 0 && (
        <div className="mb-3 break-inside-avoid">
          <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Armor</h2>
          {c.armor.map(armor => (
            <div key={armor.id} className="mb-0.5">
              <span className="font-medium">{armor.name}</span>
              <span className="text-gray-600"> (Armor {armor.armor}, {armor.location})</span>
              <span className="text-gray-500"> — Aspects: {armor.aspects.join(', ')}</span>
              {armor.notes?.map((n, i) => (
                <div key={i} className="ml-3 text-gray-500 italic">{n}</div>
              ))}
            </div>
          ))}
        </div>
      )}
      {/* Play State: Surge, Initiative, Wounds, Reactions */}
      <div className="grid grid-cols-2 gap-4 mb-3 break-inside-avoid">
      {/* Surge & Initiative */}
      <div>
        <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Vitals</h2>
        <div className="mb-1">
          <span className="font-medium">Surge:</span> {renderTickBoxes(c.surge)}
        </div>
        <div className="mb-1">
          <span className="font-medium">Physical Init:</span>{' '}
          <span className="text-gray-700">
            {getDieNotation('Reflexes')} / {getDieNotation('Agility')} (lower)
          </span>
        </div>
        <div>
          <span className="font-medium">Mental Init:</span>{' '}
          <span className="text-gray-700">
            {getDieNotation('Creativity')} / {getDieNotation('Intelligence')} (lower)
          </span>
        </div>
      </div>

      {/* Wounds & Reactions */}
      <div>
        <h2 className="font-bold text-sm border-b border-gray-400 mb-1">Aspects State</h2>
        {ASPECTS.map(a => {
          const parryAttr = DEFENSE_ATTRIBUTES[a.id];
          const dodgeAttr = DODGE_ATTRIBUTES[a.id];
          const parryNotation = getDieNotation(parryAttr);
          const dodgeNotation = dodgeAttr ? getDieNotation(dodgeAttr) : null;
          const parryDiceCount = c.diePools[parryAttr]?.dice.length ?? 0;
          const dodgeDiceCount = dodgeAttr ? (c.diePools[dodgeAttr]?.dice.length ?? 0) : 0;

          return (
            <div key={a.id} className="mb-1">
              <div className="font-medium">{a.name}</div>
              <div className="ml-3 text-gray-700">
                Wounds: {renderTickBoxes(8)}
              </div>
              <div className="ml-3 text-gray-700">
                Parry ({parryAttr} {parryNotation}): {renderTickBoxes(parryDiceCount)}
              </div>
              {dodgeAttr ? (
                <div className="ml-3 text-gray-700">
                  Dodge ({dodgeAttr} {dodgeNotation}): {renderTickBoxes(dodgeDiceCount)}
                </div>
              ) : (
                <div className="ml-3 text-gray-700 italic">
                  Surprise Roll ({getDieNotation('Reflexes')})
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
  );

}