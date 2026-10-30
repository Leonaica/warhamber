import type { WeaponTagDefinition } from '../types/character';
import { getTagColor, formatTagLabel, formatTagEffect } from '../data/weaponTags';

export type TagToggleState = 'active' | 'available' | 'dormant' | 'flavor';

interface TagToggleProps {
  tag: WeaponTagDefinition;
  x?: number;
  state: TagToggleState;
  contribution?: string;
  onToggle?: () => void;
  children?: { id: string; label: string; on: boolean; onToggle: () => void }[];
}

/**
 * A clickable quality. Flavor tags are inert; everything else toggles.
 * Dormant is an active tag whose roll condition is not satisfied yet.
 */
export function TagToggle({ tag, x, state, contribution, onToggle, children }: TagToggleProps) {
  const color = getTagColor(tag.category);
  const label = formatTagLabel(tag, x);
  const effect = formatTagEffect(tag, x);
  const title = [effect, tag.description].filter(Boolean).join(' — ');

  if (state === 'flavor') {
    return (
      <span
        title={title ? `${title} — narrative only` : 'Narrative only'}
        className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-xs text-slate-500 opacity-60 cursor-default"
      >
        {label}
      </span>
    );
  }

  const base = 'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors';
  const look = state === 'active'
    ? `${color.selectedBg} ${color.text} ${color.border}`
    : state === 'dormant'
      ? 'bg-amber-900/20 text-amber-300 border-amber-600/60'
      : `bg-slate-800/50 text-slate-400 border-slate-600 ${color.hover}`;

  return (
    <span className="inline-flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onToggle}
        title={title}
        aria-pressed={state !== 'available'}
        className={`${base} ${look}`}
      >
        <span>{label}</span>
        {state === 'active' && contribution && <span className="opacity-80">{contribution}</span>}
        {state === 'dormant' && <span className="opacity-80">armed</span>}
      </button>
      {state !== 'available' && children && children.length > 1 && (
        <span className="flex gap-0.5 pl-1">
          {children.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={c.onToggle}
              className={`rounded border px-1 text-[10px] ${c.on ? 'border-slate-500 bg-slate-600 text-white' : 'border-slate-700 bg-slate-800 text-slate-500'}`}
            >
              {c.label}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}
