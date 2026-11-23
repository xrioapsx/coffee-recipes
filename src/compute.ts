/**
 * The scaling algorithm. Pure: no DOM, no storage, no globals.
 * Ported unchanged from the original single-file app; see docs/HANDOFF.md §5.
 */

export interface Ingredient {
  id: string;
  name: string;
  /** The base amount in ml, as written down. Scaled output is never written back here. */
  ml: number;
  /** Hold this amount while everything else scales. */
  lock: boolean;
  /** Ice: counts as volume but only partly as liquid. */
  ice: boolean;
  /** Cap in ml; 0 means no cap. Anything over it becomes water. */
  max: number;
}

export interface Recipe {
  id: string;
  name: string;
  /** ml to add vs. the recipe's own base total. */
  extra: number;
  /** % of ice assumed to melt while shaking. */
  melt: number;
  /** Round scaled amounts to 5 ml. */
  round5: boolean;
  ingredients: Ingredient[];
}

/** The subset of a recipe that compute() reads, so tests can pass minimal objects. */
export type ComputeInput = Partial<Pick<Recipe, 'extra' | 'melt' | 'round5'>> & {
  ingredients?: Array<Partial<Ingredient>>;
};

export interface ScaledIngredient {
  id: string | undefined;
  name: string | undefined;
  ice: boolean;
  base: number;
  ml: number;
  /** ml removed by the cap, if any. */
  capped?: number;
  /** % of the liquid in the glass. */
  share: number;
  /** Same, for the original recipe. */
  baseShare: number;
}

export interface ComputeResult {
  ingredients: ScaledIngredient[];
  water: number;
  total: number;
  baseTotal: number;
  target: number;
  warn: string[];
  liquid: number;
  baseLiquid: number;
  iceLeft: number;
}

export function compute(recipe: ComputeInput): ComputeResult {
  const ings = recipe.ingredients || [];
  const melt = Math.min(Math.max(recipe.melt || 0, 0), 100) / 100;
  const step = recipe.round5 ? 5 : 1;
  const warn: string[] = [];
  let baseTotal = 0;
  let L = 0;
  let U = 0;
  ings.forEach((g) => {
    const v = Math.max(0, g.ml || 0);
    baseTotal += v;
    if (g.lock) L += v;
    else U += v;
  });
  const target = Math.max(0, baseTotal + (recipe.extra || 0));
  const out: ScaledIngredient[] = ings.map((g) => ({
    id: g.id,
    name: g.name,
    ice: !!g.ice,
    base: Math.max(0, g.ml || 0),
    ml: Math.max(0, g.ml || 0),
    share: 0,
    baseShare: 0,
  }));

  if (ings.length === 0) {
    warn.push('This recipe has no ingredients yet. Add one to start.');
  } else if (U <= 0) {
    if (L > 0) warn.push('Every ingredient is fixed, so nothing can scale. Untick "keep fixed" on at least one.');
  } else {
    let factor = (target - L) / U;
    if (factor < 0) {
      warn.push('The total is smaller than the fixed ingredients alone. Raise the total, or untick one of them.');
      factor = 0;
    }
    out.forEach((o, i) => {
      o.ml = ings[i].lock ? o.base : Math.round((o.base * factor) / step) * step;
    });
    // Residual fix: land exactly on the target when not rounding to 5.
    if (step === 1 && factor > 0) {
      const sum = out.reduce((a, o) => a + o.ml, 0);
      const residual = Math.round(target - sum);
      if (residual !== 0) {
        let pick = -1;
        out.forEach((o, i) => {
          if (!ings[i].lock && (pick < 0 || o.base > out[pick].base)) pick = i;
        });
        if (pick >= 0) out[pick].ml = Math.max(0, out[pick].ml + residual);
      }
    }
  }

  // Caps: overflow becomes a single shared water figure.
  let water = 0;
  out.forEach((o, i) => {
    const cap = Math.max(0, (ings[i] && ings[i].max) || 0);
    if (cap > 0 && o.ml > cap) {
      const over = o.ml - cap;
      water += over;
      o.ml = cap;
      o.capped = over;
      warn.push(
        (o.name || 'An ingredient') + ' is capped at ' + cap + ' ml, so ' + over +
          ' ml becomes water. That part of the drink will taste milder.',
      );
    }
  });

  const total = out.reduce((a, o) => a + o.ml, 0) + water;
  let liquid = water;
  let baseLiquid = 0;
  let iceLeft = 0;
  out.forEach((o) => {
    liquid += o.ice ? o.ml * melt : o.ml;
    baseLiquid += o.ice ? o.base * melt : o.base;
    if (o.ice) iceLeft += o.ml * (1 - melt);
  });
  // Shares are % of liquid, so with ice they sum to more than 100. That is intended.
  out.forEach((o) => {
    o.share = liquid > 0 ? (o.ml / liquid) * 100 : 0;
    o.baseShare = baseLiquid > 0 ? (o.base / baseLiquid) * 100 : 0;
  });

  return { ingredients: out, water, total, baseTotal, target, warn, liquid, baseLiquid, iceLeft };
}
