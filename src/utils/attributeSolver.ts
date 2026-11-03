import type { AspectName, FunctionName } from '../types/character';

/**
 * Attribute import solver.
 *
 * Every attribute is one function plus one aspect, so sixteen attributes are
 * sixteen sums over eight unknowns. The system has rank 7: adding a constant to
 * every function and subtracting it from every aspect changes nothing. That
 * single free dimension is the lean, expressed as the extra equation
 * sum(functions) = 4 * lean.
 *
 * Work is in "steps": functions and aspects are RatingValues (multiples of 5
 * from -20 to 30), so a step is 5 points and an attribute's rank is
 * 8 + function + aspect. Steps keep the arithmetic integral.
 *
 * Rejection is honest about the algebra: below seven entries the system is
 * underdetermined and any attribute fits, so conflicts can only appear from the
 * eighth onward.
 */

export const FUNCTIONS_ORDER: FunctionName[] = ['Resist', 'Finesse', 'Perceive', 'Force'];
export const ASPECTS_ORDER: AspectName[] = ['Form', 'Flesh', 'Mind', 'Spirit'];

/** RatingValue -20 and 30, in steps. */
export const MIN_STEP = -4;
export const MAX_STEP = 6;

/** A disagreement of one rank is rounding, not contradiction. */
export const TOLERANCE = 1;

/** Rank offset: an attribute of rank 8 is function 0 plus aspect 0. */
const RANK_OFFSET = 8;

export interface SolverEntry {
  function: FunctionName;
  aspect: AspectName;
  rank: number;
}

export interface SolverSolution {
  functions: Record<FunctionName, number>;
  aspects: Record<AspectName, number>;
  /** Absolute error per entered attribute, keyed `function:aspect`. */
  residuals: Record<string, number>;
  maxResidual: number;
}

const key = (f: FunctionName, a: AspectName) => `${f}:${a}`;

function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-9) continue;
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const p = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= p;

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }

  return M.map(row => row[n]);
}

/** Minimum-norm solution of rows·x = rhs. */
function solveMinNorm(rows: number[][], rhs: number[]): number[] {
  const m = rows.length;
  const n = 8;

  // A = rows · rowsᵀ
  const A: number[][] = Array.from({ length: m }, (_, i) =>
    Array.from({ length: m }, (_, j) => {
      let sum = 0;
      for (let k = 0; k < n; k++) sum += rows[i][k] * rows[j][k];
      return sum;
    }),
  );

  const y = solveLinear(A, rhs);

  const x = new Array<number>(n).fill(0);
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) x[k] += rows[i][k] * y[i];
  }
  return x;
}

const clampStep = (v: number) => Math.max(MIN_STEP, Math.min(MAX_STEP, Math.round(v)));

function buildSystem(
  entries: SolverEntry[],
  lean: number,
  baseline: number,
): { rows: number[][]; rhs: number[] } {
  const rows: number[][] = [];
  const rhs: number[] = [];

  for (const entry of entries) {
    const row = new Array<number>(8).fill(0);
    row[FUNCTIONS_ORDER.indexOf(entry.function)] = 1;
    row[4 + ASPECTS_ORDER.indexOf(entry.aspect)] = 1;
    rows.push(row);
    rhs.push(entry.rank - RANK_OFFSET);
  }

  // Gauge: fixes the point on the solution line.
  const gauge = new Array<number>(8).fill(0);
  for (let i = 0; i < 4; i++) gauge[i] = 1;
  rows.push(gauge);
  // Lean is measured from the baseline, so lean 0 keeps the default split.
  rhs.push(4 * (baseline + lean));

  return { rows, rhs };
}

/**
 * Unrounded, unclamped solution.
 *
 * Solved as a displacement from `baseline` (a uniform step on every function and
 * aspect) rather than from zero, so an unconstrained grid derives at the
 * campaign's default rating instead of at nothing.
 */
function solveRaw(entries: SolverEntry[], lean: number, baseline = 0): number[] {
  const { rows, rhs } = buildSystem(entries, lean, baseline);
  const shifted = rhs.map((d, i) => d - rows[i].reduce((s, v) => s + v * baseline, 0));
  const y = solveMinNorm(rows, shifted);
  return y.map(v => v + baseline);
}

/**
 * Lean values that keep every function and aspect inside the rating scale.
 *
 * The solution is affine in the lean — every function gains t, every aspect
 * loses it — so the feasible interval is just the step limits pushed through
 * that shift. Sliding outside it would force a clamp and break a pinned
 * attribute, so the slider is bounded to it instead.
 */
export function leanBounds(entries: SolverEntry[], baseline = 0): { min: number; max: number } {
  const raw = solveRaw(entries, 0, baseline);
  let min = MIN_STEP;
  let max = MAX_STEP;

  for (let i = 0; i < 4; i++) {
    min = Math.max(min, MIN_STEP - raw[i]);
    max = Math.min(max, MAX_STEP - raw[i]);
  }
  for (let i = 4; i < 8; i++) {
    min = Math.max(min, raw[i] - MAX_STEP);
    max = Math.min(max, raw[i] - MIN_STEP);
  }

  // Rounding outward can cross when the true value is fractional — a lean of
  // 5.08 becomes min 6 and max 5. Collapse to the nearest whole step instead;
  // the residual marker covers the fraction that is left.
  const lo = Math.ceil(min);
  const hi = Math.floor(max);
  if (lo > hi) {
    const mid = Math.round((min + max) / 2);
    return { min: mid, max: mid };
  }

  return { min: lo, max: hi };
}

/** Solve for the entered attributes. Unentered directions come out at minimum norm. */
export function solve(entries: SolverEntry[], lean: number, baseline = 0): SolverSolution {
  const x = solveRaw(entries, lean, baseline);

  const functions = {} as Record<FunctionName, number>;
  const aspects = {} as Record<AspectName, number>;
  FUNCTIONS_ORDER.forEach((f, i) => { functions[f] = clampStep(x[i]); });
  ASPECTS_ORDER.forEach((a, i) => { aspects[a] = clampStep(x[4 + i]); });

  const residuals: Record<string, number> = {};
  let maxResidual = 0;
  for (const entry of entries) {
    const error = Math.abs(functions[entry.function] + aspects[entry.aspect] - (entry.rank - RANK_OFFSET));
    residuals[key(entry.function, entry.aspect)] = error;
    maxResidual = Math.max(maxResidual, error);
  }

  return { functions, aspects, residuals, maxResidual };
}

/**
 * Whether an attribute can be added without contradicting what is already in.
 * Exact below seven entries; tested against every entry from the eighth on.
 */
export function canAdd(entries: SolverEntry[], candidate: SolverEntry, lean: number): boolean {
  const candidateResidual = Math.abs(
    solve([...entries, candidate], lean).residuals[key(candidate.function, candidate.aspect)] ?? 0,
  );
  if (candidateResidual > TOLERANCE) return false;
  return solve([...entries, candidate], lean).maxResidual <= TOLERANCE;
}

/** Derived rank of any attribute under a solution, clamped to the table. */
export function attributeRank(solution: SolverSolution, f: FunctionName, a: AspectName): number {
  return Math.max(0, Math.min(20, RANK_OFFSET + solution.functions[f] + solution.aspects[a]));
}

/** Rating values for committing back to the character. */
export function toRatings(solution: SolverSolution): {
  functions: Record<FunctionName, number>;
  aspects: Record<AspectName, number>;
} {
  const scale = (step: number) => step * 5;
  const functions = {} as Record<FunctionName, number>;
  const aspects = {} as Record<AspectName, number>;
  FUNCTIONS_ORDER.forEach(f => { functions[f] = scale(solution.functions[f]); });
  ASPECTS_ORDER.forEach(a => { aspects[a] = scale(solution.aspects[a]); });
  return { functions, aspects };
}
