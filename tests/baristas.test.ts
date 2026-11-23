import { describe, expect, it } from 'vitest';
import { BARISTAS, baristaOf } from '../src/baristas';

const all = BARISTAS.flatMap((b) => b.recipes.map((r) => ({ barista: b, recipe: r })));
const grams = (s: string) => [...s.matchAll(/(\d+(?:\.\d+)?) g\b/g)].map((m) => parseFloat(m[1]));

describe('barista data', () => {
  it('recipe ids are unique across all baristas', () => {
    const ids = all.map((x) => x.recipe.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('barista ids are unique and every barista has recipes and sources', () => {
    expect(new Set(BARISTAS.map((b) => b.id)).size).toBe(BARISTAS.length);
    for (const b of BARISTAS) {
      expect(b.recipes.length).toBeGreaterThan(0);
      expect(b.sources.length).toBeGreaterThan(0);
      for (const s of b.sources) expect(s.url).toMatch(/^https:\/\//);
    }
  });

  it.each(all.map((x) => [x.barista.name + ' / ' + x.recipe.name, x.recipe] as const))(
    '%s builds cleanly at min, default and max',
    (_n, r) => {
      for (const v of [r.input.min, r.input.def, r.input.max]) {
        const b = r.build(v);
        const text = JSON.stringify(b);
        expect(text).not.toMatch(/NaN|Infinity|undefined/);
        expect(b.rows.length).toBeGreaterThan(0);
        expect(b.steps.length).toBeGreaterThan(0);
      }
    },
  );

  it('Hoffmann keeps his original five recipes, ids unchanged, first', () => {
    expect(BARISTAS[0].id).toBe('hoffmann');
    expect(BARISTAS[0].recipes.map((r) => r.id).slice(0, 5)).toEqual(['v60', 'aero', 'press', 'moka', 'iced']);
  });

  it('an old saved selection resolves to Hoffmann; unknown ids fall back to the first barista', () => {
    expect(baristaOf('moka').id).toBe('hoffmann');
    expect(baristaOf('kasuya-46').id).toBe('kasuya');
    expect(baristaOf('nope').id).toBe('hoffmann');
  });
});

describe('barista recipe amounts', () => {
  const find = (id: string) => all.find((x) => x.recipe.id === id)!.recipe;

  it('Kasuya 4:6 at 300 g: 20 g coffee, pours 50/70/60/60/60 ending at 300', () => {
    const b = find('kasuya-46').build(300);
    expect(b.rows[0][1]).toBe('20 g');
    const pours = b.steps.slice(0, 5).map((s) => grams(s[1])[0]);
    expect(pours).toEqual([50, 70, 60, 60, 60]);
    expect(grams(b.steps[4][1])[1]).toBe(300);
  });

  it('Kasuya 4:6 keeps the 40/60 split when scaled', () => {
    const b = find('kasuya-46').build(450);
    const pours = b.steps.slice(0, 5).map((s) => grams(s[1])[0]);
    expect(pours[0] + pours[1]).toBeCloseTo(180, 5);
    expect(pours.reduce((a, x) => a + x, 0)).toBeCloseTo(450, 5);
  });

  it('Rao at 330 g: 20 g coffee, bloom 60, then to 200 and 330', () => {
    const b = find('rao-v60').build(330);
    expect(b.rows.map((r) => r[1])).toEqual(['20 g', '60 g', '200 g', '330 g']);
  });

  it('Winton at 300 g: 20 g coffee, five pours of 60 ending at 300', () => {
    const b = find('winton-5pour').build(300);
    expect(b.rows[0][1]).toBe('20 g');
    expect(b.rows[1][1]).toBe('60 g');
    const upTo = b.steps.slice(1, 5).map((s) => grams(s[1]).at(-1));
    expect(upTo).toEqual([120, 180, 240, 300]);
  });

  it('Hoffmann shakerato at 40 g: 10 g syrup, 2 drops saline', () => {
    const b = find('shakerato').build(40);
    expect(b.rows.slice(0, 3).map((r) => r[1])).toEqual(['40 g', '10 g', '2 drops']);
  });

  it('Hoffmann espresso tonic at 120 g tonic: 35–40 g espresso', () => {
    expect(find('tonic').build(120).rows[1][1]).toBe('35–40 g');
  });

  it('Sasaki 2014 at 250 g: 16.5 g coffee, 40 g bloom, 210 g, leave 45 g', () => {
    expect(find('sasaki-2014').build(250).rows.map((r) => r[1])).toEqual(['16.5 g', '40 g', '210 g', 'about 45 g']);
  });

  it('Garay 2018 at 200 g: 34.9 g coffee, 100 g brew, 60 g hot, 40 g room temperature', () => {
    expect(find('garay-2018').build(200).rows.map((r) => r[1])).toEqual(['34.9 g', '100 g', '60 g', '40 g']);
  });

  it('Little 2022 at 150 g: 18 g coffee, 20 g cold water, 94 g brew', () => {
    expect(find('little-2022').build(150).rows.map((r) => r[1])).toEqual(['18 g', '20 g', '94 g', '150 g']);
  });

  it('Wipvasutti 2023 at 155 g: 16 g + 2 g coffee, 100 g brew, to 115 then 155', () => {
    expect(find('wipvasutti-2023').build(155).rows.map((r) => r[1])).toEqual(['16 g', '2 g', '100 g', '115 g', '155 g']);
  });

  it('Eckroth Pantry Latte at 240 ml milk: 15 ml honey, 40 ml espresso', () => {
    expect(find('eckroth-pantry').build(240).rows.slice(0, 2).map((r) => r[1])).toEqual(['15 ml', '40 ml']);
  });

  it('Eckroth Beekeeper at 180 ml milk: ¾ oz syrup (23 ml), 2 oz espresso (60 ml)', () => {
    expect(find('eckroth-beekeeper').build(180).rows.slice(0, 3).map((r) => r[1])).toEqual(['23 ml', '60 ml', '180 ml']);
  });

  it('Eckroth Salted Maple at 250 ml milk: 40 ml espresso, 20 ml maple', () => {
    expect(find('eckroth-maple').build(250).rows.slice(0, 2).map((r) => r[1])).toEqual(['40 ml', '20 ml']);
  });

  it('Eckroth syrup lattes at 200 ml milk: 25 ml syrup, 40 ml espresso', () => {
    for (const id of ['eckroth-strawberry', 'eckroth-psl']) {
      expect(find(id).build(200).rows.slice(0, 3).map((r) => r[1])).toEqual(['25 ml', '40 ml', '200 ml']);
    }
  });

  it('Eckroth Dirty Chai at 100 ml milk: 100 chai, 100 milk, 40 espresso, 20 syrup', () => {
    expect(find('eckroth-chai').build(100).rows.slice(0, 4).map((r) => r[1])).toEqual(['100 ml', '100 ml', '40 ml', '20 ml']);
  });

  it('make-ahead batches stay fixed while the drink scales', () => {
    const a = find('eckroth-gochugaru').build(250).sub;
    const b = find('eckroth-gochugaru').build(500).sub;
    expect(a).toEqual(b);
    expect(a![0].rows[0]).toEqual(['Sugar', '120 g']);
  });
});
