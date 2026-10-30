#!/usr/bin/env bash
set -euo pipefail

cat > /tmp/s12.py <<'PY'
import io
p = 'src/pages/PlaysheetPage.tsx'
s = io.open(p, encoding='utf-8').read()

def rep(old, new, label):
    global s
    c = s.count(old)
    print(f'{label}: {c}')
    assert c == 1, f"{label} x{c}"
    s = s.replace(old, new)

rep("""  // Skills are per aspect and per reaction — parrying a logic attack and
  // dodging it may draw on entirely different skills.
  const [dodgeSkill, setDodgeSkill] = useState<Partial<Record<AspectName, string>>>({});
  const [parrySkill, setParrySkill] = useState<Partial<Record<AspectName, string>>>({});""",
"""  // One skill per aspect, applied to whichever reaction is pressed. A
  // combined Dodge+Parry is a single defence resolved twice, so it uses the
  // one skill rather than two.
  const [defenceSkill, setDefenceSkill] = useState<Partial<Record<AspectName, string>>>({});""",
'state')

# single select, above the reaction controls
rep("""                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-base">{aspect.emoji}</span>
                          <span className="font-medium text-white text-sm">{aspect.name}</span>
                        </div>""",
"""                        <div className="flex items-center gap-1.5 mb-2">
                          <span className="text-base">{aspect.emoji}</span>
                          <span className="font-medium text-white text-sm">{aspect.name}</span>
                        </div>

                        {character.skills.length > 0 && (
                          <select
                            value={defenceSkill[aspect.id] ?? ''}
                            onChange={e => setDefenceSkill(prev => ({ ...prev, [aspect.id]: e.target.value }))}
                            className="w-full bg-slate-600 border border-slate-500 rounded px-1 py-0.5 text-xs mb-2"
                            title="Skill applied to this defence"
                          >
                            <option value="">No skill</option>
                            {character.skills.map(entry => {
                              const def = SKILLS.find(k => k.id === entry.skillId);
                              const bonus = getSkillModifier(entry.rating);
                              return (
                                <option key={entry.skillId} value={entry.skillId}>
                                  {entry.specialty || def?.name || entry.skillId} ({bonus >= 0 ? '+' : ''}{bonus})
                                </option>
                              );
                            })}
                          </select>
                        )}""", 'single select')

# drop the two per-button selects
rep("""                            {character.skills.length > 0 && (
                              <select
                                value={dodgeSkill[aspect.id] ?? ''}
                                onChange={e => setDodgeSkill(prev => ({ ...prev, [aspect.id]: e.target.value }))}
                                className="w-full bg-slate-600 border border-slate-500 rounded px-1 py-0.5 text-xs mb-1"
                                title="Skill applied to this Dodge"
                              >
                                <option value="">No skill</option>
                                {character.skills.map(entry => {
                                  const def = SKILLS.find(k => k.id === entry.skillId);
                                  const bonus = getSkillModifier(entry.rating);
                                  return (
                                    <option key={entry.skillId} value={entry.skillId}>
                                      {entry.specialty || def?.name || entry.skillId} ({bonus >= 0 ? '+' : ''}{bonus})
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                            <button""", "                            <button", 'remove dodge select')

rep("""                          {character.skills.length > 0 && (
                            <select
                              value={parrySkill[aspect.id] ?? ''}
                              onChange={e => setParrySkill(prev => ({ ...prev, [aspect.id]: e.target.value }))}
                              className="w-full bg-slate-600 border border-slate-500 rounded px-1 py-0.5 text-xs mb-1"
                              title="Skill applied to this Parry"
                            >
                              <option value="">No skill</option>
                              {character.skills.map(entry => {
                                const def = SKILLS.find(k => k.id === entry.skillId);
                                const bonus = getSkillModifier(entry.rating);
                                return (
                                  <option key={entry.skillId} value={entry.skillId}>
                                    {entry.specialty || def?.name || entry.skillId} ({bonus >= 0 ? '+' : ''}{bonus})
                                  </option>
                                );
                              })}
                            </select>
                          )}
                          <button""", "                          <button", 'remove parry select')

rep("skillBonusFor(dodgeSkill[aspect.id])", "skillBonusFor(defenceSkill[aspect.id])", 'dodge call')
rep("skillBonusFor(parrySkill[aspect.id])", "skillBonusFor(defenceSkill[aspect.id])", 'parry call')

io.open(p, 'w', encoding='utf-8').write(s)
print('ok')
PY
python3 /tmp/s12.py

npm test && npm run build

