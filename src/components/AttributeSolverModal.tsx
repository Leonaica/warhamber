import { useState } from 'react';
import type { AspectName, FunctionName } from '../types/character';
import { ATTRIBUTES } from '../types/character';
import { DIE_POOL_TABLE } from '../data/diePoolTable';
import { getDefaultRating } from '../utils/defaultRating';
import {
  ASPECTS_ORDER,
  FUNCTIONS_ORDER,
  TOLERANCE,
  solve,
  canAdd,
  attributeRank,
  leanBounds,
  toRatings,
  type SolverEntry,
} from '../utils/attributeSolver';

interface Props {
  /** Campaign point limit; sets the default rating the grid opens at. */
  campaignLimit: number;
  onClose: () => void;
  onCommit: (
    functions: Record<FunctionName, number>,
    aspects: Record<AspectName, number>,
  ) => void;
}

const poolFor = (rank: number) => DIE_POOL_TABLE.find(e => e.rank === rank)?.pool.notation ?? '—';
const points = (step: number) => (step >= 0 ? `+${step * 5}` : `${step * 5}`);

/**
 * Helper for translating an avatar from another game. Nothing is written until
 * Commit; Cancel discards.
 */
export function AttributeSolverModal({ campaignLimit, onClose, onCommit }: Props) {
  // Straight from the builder's own thresholds, in steps.
  const baseline = getDefaultRating(campaignLimit) / 5;
  const [entries, setEntries] = useState<SolverEntry[]>([]);
  const [lean, setLean] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  // The slider cannot leave the range that keeps every value on scale.
  const bounds = leanBounds(entries, baseline);
  const bounded = Math.max(bounds.min, Math.min(bounds.max, lean));
  const solution = solve(entries, bounded, baseline);
  const has = (f: FunctionName, a: AspectName) => entries.find(e => e.function === f && e.aspect === a);

  const pin = (f: FunctionName, a: AspectName) => {
    setMessage(null);
    setEntries(prev => [...prev, { function: f, aspect: a, rank: attributeRank(solution, f, a) }]);
  };

  const adjust = (f: FunctionName, a: AspectName, delta: number) => {
    const current = has(f, a);
    if (!current) return;
    const next = Math.max(0, Math.min(20, current.rank + delta));
    if (next === current.rank) return;

    const candidate = { function: f, aspect: a, rank: next };
    const others = entries.filter(e => e !== current);

    if (!canAdd(others, candidate, lean)) {
      const name = ATTRIBUTES.find(x => x.func === f && x.aspect === a)?.name ?? f;
      setMessage(`${name} ${next} conflicts with what is already entered.`);
      return;
    }

    setMessage(null);
    setEntries(prev => prev.map(e => (e === current ? candidate : e)));
  };

  const unpin = (f: FunctionName, a: AspectName) => {
    setMessage(null);
    setEntries(prev => prev.filter(e => !(e.function === f && e.aspect === a)));
  };

  const reset = () => {
    setEntries([]);
    setLean(0);
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-5 py-3 flex items-center justify-between z-10">
          <h3 className="text-white font-bold">Translate attributes</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Every attribute is a Function plus an Aspect. The grid starts at this campaign's
            default rating. Enter the attributes you know, most important first: each is checked
            against the others and refused if it cannot fit, and whatever you leave out is
            derived. Nothing is written until you commit.
          </p>

          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>🧩 Aspects</span>
              <span>⚡ Functions</span>
            </div>
            <input
              type="range"
              min={bounds.min}
              max={bounds.max}
              step={1}
              value={bounded}
              onChange={e => setLean(parseInt(e.target.value))}
              disabled={bounds.min >= bounds.max}
              className="w-full accent-amber-500 disabled:opacity-40"
            />
            <p className="text-xs text-slate-500 mt-1">
              Shifts the same totals between Functions and Aspects without changing a single
              attribute: a strong body, or a strong will. The range shortens as attributes are
              pinned, and stops where a pinned value would have to move.
            </p>
          </div>

          {message && (
            <div className="text-xs bg-red-900/30 border border-red-500/40 text-red-300 rounded px-2 py-1">
              {message}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr>
                  <th className="p-1 w-1/5"></th>
                  {ASPECTS_ORDER.map(a => (
                    <th key={a} className="p-1 text-center text-amber-300">
                      {a} <span className="text-slate-400 font-normal">{points(solution.aspects[a])}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNCTIONS_ORDER.map(f => (
                  <tr key={f}>
                    <td className="p-1 text-amber-300">
                      {f} <span className="text-slate-400 font-normal">{points(solution.functions[f])}</span>
                    </td>
                    {ASPECTS_ORDER.map(a => {
                      const attr = ATTRIBUTES.find(x => x.func === f && x.aspect === a);
                      if (!attr) return <td key={a} />;
                      const pinned = has(f, a);
                      const rank = pinned ? pinned.rank : attributeRank(solution, f, a);
                      const residual = solution.residuals[`${f}:${a}`] ?? 0;
                      return (
                        <td key={a} className="p-1 text-center">
                          <div className={`rounded px-1 py-0.5 ${pinned ? 'bg-amber-500/20 ring-1 ring-amber-500/50' : 'bg-slate-700/40'}`}>
                            <div className="text-slate-300 truncate">{attr.name}</div>
                            <div className={pinned ? 'text-white' : 'text-slate-500'}>
                              R{rank} <span className="text-slate-500">{poolFor(rank)}</span>
                            </div>
                            {pinned && residual > TOLERANCE && (
                              <div className="text-red-400">off {residual}</div>
                            )}
                            <div className="flex justify-center gap-0.5 mt-0.5">
                              {pinned ? (
                                <>
                                  <button onClick={() => adjust(f, a, -1)} className="w-4 h-4 rounded bg-slate-600 hover:bg-slate-500 text-white">−</button>
                                  <button onClick={() => adjust(f, a, 1)} className="w-4 h-4 rounded bg-slate-600 hover:bg-slate-500 text-white">+</button>
                                  <button onClick={() => unpin(f, a)} className="w-4 h-4 rounded bg-slate-700 hover:bg-red-700 text-slate-300">✕</button>
                                </>
                              ) : (
                                <button onClick={() => pin(f, a)} className="px-1 h-4 rounded bg-slate-700 hover:bg-slate-600 text-slate-300">pin</button>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button onClick={reset} className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-sm">
              Reset
            </button>
            <button onClick={onClose} className="flex-1 bg-slate-600 hover:bg-slate-500 text-slate-100 px-3 py-1.5 rounded text-sm">
              Cancel
            </button>
            <button
              onClick={() => {
                const ratings = toRatings(solution);
                onCommit(ratings.functions, ratings.aspects);
              }}
              disabled={entries.length === 0}
              className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 px-3 py-1.5 rounded text-sm font-medium"
            >
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
