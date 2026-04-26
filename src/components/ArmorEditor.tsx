import type { ArmorAttributeName, ArmorValues } from '../types/character';
import { ASPECTS } from '../types/character';

interface ArmorEditorProps {
  armor: ArmorValues;
  setArmor: (defense: ArmorAttributeName, value: number) => void;
}

const ARMOR_INFO: Record<ArmorAttributeName, { label: string; aspect: string; emoji: string; description: string }> = {
  Toughness: { label: 'Toughness', aspect: 'Form', emoji: '🧱', description: 'Physical armor, damage reduction vs Form attacks' },
  Endurance: { label: 'Endurance', aspect: 'Flesh', emoji: '🧬', description: 'Biological resistance, damage reduction vs Flesh attacks' },
  Willpower: { label: 'Willpower', aspect: 'Mind', emoji: '🧠', description: 'Mental shielding, damage reduction vs Mind attacks' },
  Resilience: { label: 'Resilience', aspect: 'Spirit', emoji: '🔥', description: 'Spiritual warding, damage reduction vs Spirit attacks' },
};

export function ArmorEditor({ armor, setArmor }: ArmorEditorProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-amber-400">🛡️ Armor</h3>
        <span className="text-xs text-slate-500">Damage reduction per aspect</span>
      </div>

      <div className="space-y-3">
        {(Object.keys(ARMOR_INFO) as ArmorAttributeName[]).map((attr) => {
          const info = ARMOR_INFO[attr];
          const value = armor[attr];
          
          return (
            <div key={attr} className="bg-slate-700/50 rounded p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{info.emoji}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{info.label}</div>
                    <div className="text-xs text-slate-500">{info.description}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setArmor(attr, Math.max(0, value - 1))}
                    className="bg-slate-600 hover:bg-slate-500 w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  >
                    −
                  </button>
                  <span className={`w-10 text-center font-bold text-lg ${value > 0 ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {value}
                  </span>
                  <button
                    onClick={() => setArmor(attr, Math.min(20, value + 1))}
                    className="bg-slate-600 hover:bg-slate-500 w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-500 italic">
        Armor reduces damage after penetration. Each point subtracts 1 from the final damage.
      </div>
    </div>
  );
}