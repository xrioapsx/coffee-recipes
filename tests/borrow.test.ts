import { describe, expect, it } from 'vitest';
import { BARISTAS } from '../src/baristas';
import { borrow, borrowable, leftOut, MINE } from '../src/borrow';
import { compute } from '../src/compute';

const all = BARISTAS.flatMap((b) => b.recipes.map((r) => ({ barista: b, recipe: r })));
const find = (id: string) => all.find((x) => x.recipe.id === id)!;
const amount = (s: string) => {
  if (s.includes('–')) return NaN; // a range: the copy takes its midpoint
  const m = s.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/);
  return m ? parseFloat(m[1]) : NaN;
};

describe('make it mine', () => {
  it('every barista recipe can be copied, and the picker lists them all', () => {
    for (const { recipe } of all) expect(MINE[recipe.id], recipe.id).toBeDefined();
    expect(Object.keys(MINE).sort()).toEqual(all.map((x) => x.recipe.id).sort());
    expect(borrowable().flatMap((g) => g.recipes).length).toBe(all.length);
  });

  it('copied amounts match the barista table where the names match', () => {
    for (const { recipe } of all) {
      const rows = new Map(recipe.build(recipe.input.def).rows.map((r) => [r[0].toLowerCase(), amount(r[1])]));
      for (const [name, ml] of MINE[recipe.id].items) {
        const t = rows.get(name.toLowerCase());
        if (t !== undefined && isFinite(t)) expect(ml, recipe.id + ' / ' + name).toBe(t);
      }
    }
  });

  it('pour-overs copy the total water, not the running pour targets', () => {
    for (const id of ['v60', 'aero', 'press', 'kasuya-46', 'rao-v60', 'winton-5pour', 'sasaki-2014', 'garay-2018', 'little-2022', 'wipvasutti-2023']) {
      const r = find(id).recipe;
      const water = MINE[id].items.filter(([n]) => !/coffee/i.test(n)).reduce((a, [, ml]) => a + ml, 0);
      expect(water, id).toBe(r.input.def);
    }
  });

  it('coffee doses match the barista table', () => {
    for (const id of ['v60', 'aero', 'press', 'kasuya-46', 'rao-v60', 'winton-5pour', 'sasaki-2014', 'garay-2018', 'little-2022']) {
      const r = find(id).recipe;
      const coffee = MINE[id].items.find(([n]) => /coffee/i.test(n))![1];
      expect(coffee, id).toBe(amount(r.build(r.input.def).rows.find((x) => /coffee/i.test(x[0]))![1]));
    }
  });

  it('builds a normal recipe: new ids, barista in the name, no scaling yet', () => {
    const { barista, recipe } = find('eckroth-pantry');
    const a = borrow(recipe, barista.name);
    const b = borrow(recipe, barista.name);
    expect(a.name).toBe('Pantry Latte (Morgan Eckroth)');
    expect(a.ingredients.map((g) => [g.name, g.ml])).toEqual([['Honey', 15], ['Espresso', 40], ['Milk', 240]]);
    expect(a).toMatchObject({ extra: 0, melt: 25, round5: false });
    expect(a.id).not.toBe(b.id);
    expect(a.ingredients[0].id).not.toBe(b.ingredients[0].id);
    expect(compute(a).total).toBe(295);
  });

  it('follows the amount set on the barista page', () => {
    const { barista, recipe } = find('eckroth-pantry');
    expect(borrow(recipe, barista.name, 480).ingredients.map((g) => g.ml)).toEqual([30, 80, 480]);
    expect(borrow(recipe, barista.name, 0).ingredients.map((g) => g.ml)).toEqual([15, 40, 240]);
  });

  it('marks ice and its melt for the iced pour-over', () => {
    const { barista, recipe } = find('iced');
    const r = borrow(recipe, barista.name);
    expect(r.melt).toBe(80);
    expect(r.ingredients.filter((g) => g.ice).map((g) => g.ml)).toEqual([85]);
  });

  it('lists what could not be copied', () => {
    expect(leftOut(find('eckroth-pantry').recipe)).toEqual([
      'ground cinnamon (a pinch)',
      'ground nutmeg (a pinch)',
      'orange peel (for garnish)',
    ]);
    expect(leftOut(find('v60').recipe)).toEqual([]);
    expect(leftOut(find('shakerato').recipe)).toHaveLength(2);
  });
});
