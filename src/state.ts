/**
 * App state: schema, load/save, and the one-way v1 → v2 migration.
 * Storage is injected so this module is testable without a browser.
 */
import type { Ingredient, Recipe } from './compute';
import { num, uid } from './util';

// Keys keep the app's original name on purpose: renaming them would orphan saved recipes.
export const KEY = 'coffee-honey-scaler-v2';
export const OLD_KEY = 'coffee-honey-scaler-v1';

export interface AppState {
  recipes: Recipe[];
  currentId: string;
  /** Selected Hoffmann recipe id. */
  hof: string;
  /** Per-Hoffmann-recipe water/volume input. */
  hofInputs: Record<string, number>;
}

/** The parts of the Web Storage API we use. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function starter(): Recipe {
  return {
    id: uid(),
    name: 'Coffee honey',
    extra: 40,
    melt: 25,
    round5: false,
    ingredients: [
      { id: uid(), name: 'Honey', ml: 40, lock: false, ice: false, max: 0 },
      { id: uid(), name: 'Espresso (brikka)', ml: 70, lock: false, ice: false, max: 0 },
      { id: uid(), name: 'Ice cubes', ml: 100, lock: false, ice: true, max: 0 },
    ],
  };
}

export function newRecipe(): Recipe {
  return {
    id: uid(),
    name: 'New drink',
    extra: 0,
    melt: 25,
    round5: false,
    ingredients: [{ id: uid(), name: 'Coffee', ml: 100, lock: false, ice: false, max: 0 }],
  };
}

export function newIngredient(): Ingredient {
  return { id: uid(), name: 'New ingredient', ml: 0, lock: false, ice: false, max: 0 };
}


/** v1 stored a single fixed honey/espresso/ice recipe plus the Hoffmann selection. */
export function migrateV1(storage: StorageLike): AppState | null {
  try {
    const raw = storage.getItem(OLD_KEY);
    if (!raw) return null;
    const o: any = JSON.parse(raw);
    const r = starter();
    if (o.base) {
      r.ingredients[0].ml = num(o.base.honey, 40);
      r.ingredients[1].ml = num(o.base.espresso, 70);
      r.ingredients[2].ml = num(o.base.ice, 100);
    }
    if (o.lock) {
      r.ingredients[0].lock = !!o.lock.honey;
      r.ingredients[1].lock = !!o.lock.espresso;
      r.ingredients[2].lock = !!o.lock.ice;
    }
    if (typeof o.extra === 'number') r.extra = o.extra;
    if (typeof o.melt === 'number') r.melt = o.melt;
    if (typeof o.cap === 'number' && o.cap > 0) r.ingredients[1].max = o.cap;
    r.round5 = !!o.round5;
    return { recipes: [r], currentId: r.id, hof: o.recipe || 'v60', hofInputs: o.inputs || {} };
  } catch {
    return null;
  }
}

/** Coerce anything shaped roughly like v2 into a valid AppState. */
export function normalize(o: any): AppState {
  if (!o || !Array.isArray(o.recipes) || o.recipes.length === 0) {
    const r = starter();
    o = { recipes: [r], currentId: r.id, hof: 'v60', hofInputs: {} };
  }
  const recipes: Recipe[] = o.recipes.map((r: any) => ({
    id: r.id || uid(),
    name: typeof r.name === 'string' ? r.name : 'Untitled drink',
    extra: typeof r.extra === 'number' ? r.extra : 0,
    melt: typeof r.melt === 'number' ? r.melt : 25,
    round5: !!r.round5,
    ingredients: (Array.isArray(r.ingredients) ? r.ingredients : []).map((g: any) => ({
      id: g.id || uid(),
      name: typeof g.name === 'string' ? g.name : 'Ingredient',
      ml: Math.max(0, num(g.ml, 0)),
      lock: !!g.lock,
      ice: !!g.ice,
      max: Math.max(0, num(g.max, 0)),
    })),
  }));
  const currentId = recipes.some((r) => r.id === o.currentId) ? o.currentId : recipes[0].id;
  return { recipes, currentId, hof: o.hof || 'v60', hofInputs: o.hofInputs || {} };
}

export function load(storage: StorageLike | null): AppState {
  let o: any = null;
  if (storage) {
    try {
      const raw = storage.getItem(KEY);
      if (raw) o = JSON.parse(raw);
    } catch {
      o = null;
    }
    if (!o) o = migrateV1(storage);
  }
  return normalize(o);
}

export function save(storage: StorageLike | null, state: AppState): void {
  if (!storage) return;
  try {
    storage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

/** localStorage, or null where accessing it throws (private mode, blocked site data). */
export function browserStorage(): StorageLike | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
