import { useState } from 'react';
import type { ArmorAspect, CharacterArmor } from '../types/character';
import StepperInput from './StepperInput';

const ASPECT_INFO: Record<ArmorAspect, { emoji: string; label: string; locationLabel: string; locationPlaceholder: string }> = {
  Form: {
    emoji: '🧱',
    label: 'Form',
    locationLabel: 'Location',
    locationPlaceholder: 'Body parts protected (e.g., torso, head, left wing)',
  },
  Flesh: {
    emoji: '🧬',
    label: 'Flesh',
    locationLabel: 'Application',
    locationPlaceholder: 'How applied (e.g., systemic, injected, environmental field)',
  },
  Mind: {
    emoji: '🧠',
    label: 'Mind',
    locationLabel: 'Focus',
    locationPlaceholder: 'Where it centers, if applicable (e.g., circlet, mental discipline)',
  },
  Spirit: {
    emoji: '🔥',
    label: 'Spirit',
    locationLabel: 'Ward Placement',
    locationPlaceholder: 'Where the ward is placed, if applicable (e.g., forehead, aura)',
  },
};

interface ArmorEditorProps {
  armor?: CharacterArmor;
  onSave: (armorData: Omit<CharacterArmor, 'id'>) => void;
  onCancel: () => void;
}

export function ArmorEditor({ armor, onSave, onCancel }: ArmorEditorProps) {
  const [name, setName] = useState(armor?.name ?? 'New Armor');
  const [aspects, setAspects] = useState<ArmorAspect[]>(armor?.aspects ?? ['Form']);
  const [armorValue, setArmorValue] = useState(armor?.armor ?? 1);
  const [location, setLocation] = useState(armor?.location ?? '');
  const [notes, setNotes] = useState<string[]>(armor?.notes ?? []);

  const toggleAspect = (aspect: ArmorAspect) => {
    const newAspects = aspects.includes(aspect)
      ? aspects.filter(a => a !== aspect)
      : [...aspects, aspect];
    
    if (newAspects.length > 0) {
      setAspects(newAspects);
    }
  };

  const addNote = () => {
    setNotes([...notes, '']);
  };

  const updateNote = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    setNotes(newNotes);
  };

  const removeNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const getLocationInfo = () => {
    if (aspects.length === 1) {
      return ASPECT_INFO[aspects[0]];
    }
    if (aspects.length === 0) {
      return { locationLabel: 'Location', locationPlaceholder: 'Select aspects first' };
    }
    return {
      locationLabel: 'Location/Application',
      locationPlaceholder: 'Where it applies or how it manifests (e.g., worn, systemic, centered on crown chakra)',
    };
  };

  const handleSave = () => {
    onSave({
      name,
      aspects,
      armor: armorValue,
      location,
      notes: notes.length > 0 ? notes : undefined,
    });
  };

  const locationInfo = getLocationInfo();

  return (
    <div className="bg-slate-700 rounded-lg p-4 border border-amber-500/50">
      <h4 className="text-sm font-bold text-amber-400 mb-3">
        {armor ? 'Edit Armor' : 'Add Armor'}
      </h4>

      <div className="space-y-3">
        {/* Name */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="e.g., Chainmail, Psi-Shield, Inoculation"
          />
        </div>

        {/* Aspects */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Aspects Protected</label>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(ASPECT_INFO) as ArmorAspect[]).map(aspect => (
              <button
                key={aspect}
                type="button"
                onClick={() => toggleAspect(aspect)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  aspects.includes(aspect)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-slate-600 text-slate-400 hover:bg-slate-500'
                }`}
              >
                {ASPECT_INFO[aspect].emoji} {aspect}
              </button>
            ))}
          </div>
        </div>

        {/* Armor Value */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Armor Value</label>
          <StepperInput
            value={armorValue}
            onValueChange={setArmorValue}
            min={0}
            max={20}
            className={`text-lg ${armorValue > 0 ? 'text-cyan-400' : 'text-slate-500'}`}
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">{locationInfo.locationLabel}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-slate-600 border border-slate-500 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder={locationInfo.locationPlaceholder}
          />
        </div>

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-slate-400">Notes</label>
            <button
              type="button"
              onClick={addNote}
              className="text-xs text-amber-400 hover:text-amber-300"
            >
              + Add Note
            </button>
          </div>
          {notes.map((note, idx) => (
            <div key={idx} className="flex gap-1 mb-1">
              <input
                type="text"
                value={note}
                onChange={(e) => updateNote(idx, e.target.value)}
                className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Special property, bonus, penalty, description..."
              />
              <button
                type="button"
                onClick={() => removeNote(idx)}
                className="text-slate-500 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save/Cancel buttons */}
      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSave}
          className="bg-amber-500 hover:bg-amber-400 text-slate-900 px-4 py-2 rounded font-medium text-sm"
        >
          {armor ? 'Save Changes' : 'Add Armor'}
        </button>
        <button
          onClick={onCancel}
          className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-4 py-2 rounded font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}