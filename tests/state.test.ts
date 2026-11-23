import { describe, expect, it } from 'vitest';
import { KEY, OLD_KEY, load, save, type StorageLike } from '../src/state';

function mem(init: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('state: load', () => {
  it('starts with the coffee honey starter when storage is empty', () => {
    const s = load(mem());
    expect(s.recipes).toHaveLength(1);
    expect(s.recipes[0].name).toBe('Coffee honey');
    expect(s.recipes[0].ingredients.map((g) => g.ml)).toEqual([40, 70, 100]);
    expect(s.currentId).toBe(s.recipes[0].id);
    expect(s.hof).toBe('v60');
  });

  it('works with no storage at all', () => {
    expect(load(null).recipes).toHaveLength(1);
  });

  it('loads existing v2 data untouched', () => {
    const v2 = {
      recipes: [
        { id: 'r1', name: 'Mine', extra: 30, melt: 20, round5: true,
          ingredients: [{ id: 'a', name: 'Honey', ml: 35, lock: true, ice: false, max: 0 }] },
        { id: 'r2', name: 'Other', extra: -10, melt: 25, round5: false,
          ingredients: [{ id: 'b', name: 'Ice', ml: 90, lock: false, ice: true, max: 60 }] },
      ],
      currentId: 'r2',
      hof: 'aero',
      hofInputs: { aero: 220 },
    };
    const s = load(mem({ [KEY]: JSON.stringify(v2) }));
    expect(s).toEqual(v2);
  });

  it('repairs a dangling currentId and malformed fields', () => {
    const s = load(mem({ [KEY]: JSON.stringify({
      recipes: [{ id: 'r1', ingredients: [{ ml: '-5', max: 'x' }] }],
      currentId: 'gone',
    }) }));
    expect(s.currentId).toBe('r1');
    expect(s.recipes[0].name).toBe('Untitled drink');
    expect(s.recipes[0].melt).toBe(25);
    expect(s.recipes[0].ingredients[0]).toMatchObject({ name: 'Ingredient', ml: 0, max: 0, lock: false, ice: false });
    expect(s.recipes[0].ingredients[0].id).toBeTruthy();
  });

  it('falls back to starter on corrupt JSON', () => {
    expect(load(mem({ [KEY]: '{not json' })).recipes[0].name).toBe('Coffee honey');
  });
});

describe('state: v1 migration', () => {
  it('maps the old fixed recipe into the new shape', () => {
    const v1 = {
      base: { honey: 35, espresso: 80, ice: 120 },
      lock: { honey: true, espresso: false, ice: false },
      extra: 50, melt: 30, cap: 90, round5: true,
      recipe: 'moka', inputs: { moka: 200 },
    };
    const s = load(mem({ [OLD_KEY]: JSON.stringify(v1) }));
    const r = s.recipes[0];
    expect(r.ingredients.map((g) => g.ml)).toEqual([35, 80, 120]);
    expect(r.ingredients.map((g) => g.lock)).toEqual([true, false, false]);
    expect(r.ingredients[1].max).toBe(90);
    expect(r.ingredients[2].ice).toBe(true);
    expect(r).toMatchObject({ extra: 50, melt: 30, round5: true });
    expect(s.hof).toBe('moka');
    expect(s.hofInputs).toEqual({ moka: 200 });
  });

  it('prefers v2 when both keys exist', () => {
    const s = load(mem({
      [OLD_KEY]: JSON.stringify({ base: { honey: 1 } }),
      [KEY]: JSON.stringify({ recipes: [{ id: 'x', name: 'V2', ingredients: [] }], currentId: 'x' }),
    }));
    expect(s.recipes[0].name).toBe('V2');
  });

  it('does not write anything until save is called', () => {
    const st = mem({ [OLD_KEY]: JSON.stringify({ extra: 10 }) });
    load(st);
    expect(st.data[KEY]).toBeUndefined();
  });
});

describe('state: save', () => {
  it('round-trips through storage', () => {
    const st = mem();
    const s = load(st);
    s.recipes[0].name = 'Renamed';
    save(st, s);
    expect(load(st)).toEqual(s);
  });

  it('swallows storage errors', () => {
    const broken: StorageLike = { getItem: () => null, setItem: () => { throw new Error('quota'); } };
    expect(() => save(broken, load(broken))).not.toThrow();
  });
});
