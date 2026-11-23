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

  it('Hoffmann keeps his five recipes under their original ids', () => {
    expect(BARISTAS[0].id).toBe('hoffmann');
    expect(BARISTAS[0].recipes.map((r) => r.id)).toEqual(['v60', 'aero', 'press', 'moka', 'iced']);
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
});
