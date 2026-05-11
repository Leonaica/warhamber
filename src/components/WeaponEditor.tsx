import { useState } from 'react';
import type { AspectName, AttackType, WeaponAttack, CharacterWeapon, WeaponCategory, WeaponHandedness, WeaponRange } from '../types/character';
import { ASPECTS, ATTACK_TYPES_BY_ASPECT, WEAPON_RANGES, getMechanismGroupsForAspect } from '../types/character';
import { DAMAGE_MAGNITUDE_TABLE, type DamageMagnitudeEntry } from '../data/damageTable';
import { WEAPON_CATEGORY_GROUPS, DEFAULT_ATTACK_BY_CATEGORY, MECHANISM_LABELS } from '../data/weaponData';
import StepperInput from './StepperInput';

interface WeaponEditorProps {
  weapon?: CharacterWeapon;
  onSave: (weapon: Omit<CharacterWeapon, 'id'>) => void;
  onCancel: () => void;
}

export function WeaponEditor({ weapon, onSave, onCancel }: WeaponEditorProps) {
  const [name, setName] = useState(weapon?.name || '');
  const [category, setCategory] = useState<WeaponCategory>(weapon?.category as WeaponCategory || 'Melee');
  const [handedness, setHandedness] = useState<WeaponHandedness>(weapon?.handedness as WeaponHandedness || 'One-handed');
  const [attacks, setAttacks] = useState<WeaponAttack[]>(weapon?.attacks || []);
  const [ammo, setAmmo] = useState(weapon?.ammo || '');
  const [notes, setNotes] = useState<string[]>(weapon?.notes || []);
  const [newNote, setNewNote] = useState('');

  const addAttack = () => {
    const id = crypto.randomUUID();
    const defaultRange: WeaponRange = ['Melee', 'Thrown', 'Unarmed', 'Natural'].includes(category) 
      ? 'Close' : 'Short';
    const defaults = DEFAULT_ATTACK_BY_CATEGORY[category];
    const newAttack: WeaponAttack = {
      id,
      aspect: defaults.aspect,
      type: defaults.type,
      magnitude: 3,
      penetration: 0,
      range: defaultRange,
    };
    setAttacks([...attacks, newAttack]);
  };

  const updateAttack = (id: string, updates: Partial<WeaponAttack>) => {
    setAttacks(attacks.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const removeAttack = (id: string) => {
    setAttacks(attacks.filter(a => a.id !== id));
  };

  const addNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      handedness,
      attacks,
      ammo: ammo.trim() || undefined,
      notes: notes.length > 0 ? notes : undefined,
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-bold text-amber-400">
        {weapon ? 'Edit Weapon' : 'Add Weapon'}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Weapon Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          placeholder="e.g., Longsword, .38 Special, Mind Blast"
        />
      </div>

      {/* Category and Handedness */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as WeaponCategory)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            {Object.entries(WEAPON_CATEGORY_GROUPS).map(([group, cats]) => (
              <optgroup key={group} label={group}>
                {cats.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">Handedness</label>
          <select
            value={handedness}
            onChange={(e) => setHandedness(e.target.value as WeaponHandedness)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          >
            <option value="One-handed">One-handed</option>
            <option value="Two-handed">Two-handed</option>
          </select>
        </div>
      </div>

      {/* Ammo */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Ammo (optional)</label>
        <input
          type="text"
          value={ammo}
          onChange={(e) => setAmmo(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
          placeholder="e.g., 6 rounds, magazine, infinite, psi points"
        />
      </div>

      {/* Attacks */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm text-slate-400">Attack Modes</label>
          <button
            onClick={addAttack}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1 rounded text-sm font-medium"
          >
            + Add Attack
          </button>
        </div>

        {attacks.length === 0 && (
          <div className="text-slate-500 text-sm italic text-center py-4 bg-slate-700/30 rounded">
            No attacks defined. Add at least one attack mode.
          </div>
        )}

        {attacks.map((attack) => (
          <div key={attack.id} className="bg-slate-700/50 rounded p-3 mb-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">
                {ASPECTS.find(a => a.id === attack.aspect)?.emoji} {attack.aspect} Attack
              </span>
              <button
                onClick={() => removeAttack(attack.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>

            <div className="flex flex-wrap gap-x-3 gap-y-2 items-end">
              {/* Aspect */}
              <div className="min-w-[130px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Aspect</label>
                <select
                  value={attack.aspect}
                  onChange={(e) => {
                    const newAspect = e.target.value as AspectName;
                    updateAttack(attack.id, {
                      aspect: newAspect,
                      type: ATTACK_TYPES_BY_ASPECT[newAspect][0] as AttackType,
                    });
                  }}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {ASPECTS.map(a => (
                    <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>
                  ))}
                </select>
              </div>

              {/* Attack Type - Grouped by Mechanism */}
              <div className="min-w-[160px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Type</label>
                <select
                  value={attack.type}
                  onChange={(e) => updateAttack(attack.id, { type: e.target.value as AttackType })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {Object.entries(getMechanismGroupsForAspect(attack.aspect)).map(([mechanism, types]) => (
                    <optgroup key={mechanism} label={MECHANISM_LABELS[mechanism]}>
                      {(types as string[]).map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Magnitude */}
              <div className="min-w-[150px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Magnitude</label>
                <select
                  value={attack.magnitude}
                  onChange={(e) => updateAttack(attack.id, { magnitude: parseInt(e.target.value) })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {DAMAGE_MAGNITUDE_TABLE.map((m: DamageMagnitudeEntry) => (
                    <option key={m.magnitude} value={m.magnitude}>
                      {m.magnitude} — {m.label} ({m.pool.notation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Penetration */}
              <div className="min-w-[120px]">
                <label className="block text-xs text-slate-400 mb-1">Penetration</label>
                <StepperInput
                  value={typeof attack.penetration === 'number' ? attack.penetration : attack.penetration[0]}
                  onValueChange={(val) => updateAttack(attack.id, { penetration: val })}
                  min={0}
                  max={100}
                  className="text-sm"
                  buttonClassName="bg-slate-600 hover:bg-slate-500 px-2 py-1 rounded text-sm"
                />
              </div>

              {/* Range */}
              <div className="min-w-[150px] flex-1">
                <label className="block text-xs text-slate-400 mb-1">Range</label>
                <select
                  value={attack.range}
                  onChange={(e) => updateAttack(attack.id, { range: e.target.value as WeaponRange })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm"
                >
                  {WEAPON_RANGES.map(r => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Conditional */}
            <div className="mt-2">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input
                  type="checkbox"
                  checked={attack.isConditional || false}
                  onChange={(e) => updateAttack(attack.id, { isConditional: e.target.checked })}
                  className="rounded"
                />
                Conditional attack
              </label>
              {attack.isConditional && (
                <input
                  type="text"
                  value={attack.condition || ''}
                  onChange={(e) => updateAttack(attack.id, { condition: e.target.value })}
                  className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm mt-1"
                  placeholder="Condition description"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm text-slate-400 mb-1">Notes</label>
        {notes.map((note, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <span className="text-sm text-slate-300 flex-1">• {note}</span>
            <button
              onClick={() => removeNote(index)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              ×
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addNote()}
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
            placeholder="Add a note..."
          />
          <button
            onClick={addNote}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-sm"
          >
            Add
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!name.trim() || attacks.length === 0}
          className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-600 disabled:text-slate-400 text-slate-900 py-2 rounded font-medium transition-colors"
        >
          {weapon ? 'Update Weapon' : 'Add Weapon'}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2 rounded font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}