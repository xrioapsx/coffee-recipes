import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { compute, type ComputeInput } from '../src/compute';

type Opts = {
  extra?: number;
  round5?: boolean;
  lockHoney?: boolean;
  espressoMax?: number;
};

// Base recipe from HANDOFF §6: Honey 40, Espresso 70, Ice 100 (ice), melt 25%.
function base(o: Opts = {}): ComputeInput {
  return {
    extra: o.extra ?? 0,
    melt: 25,
    round5: !!o.round5,
    ingredients: [
      { id: 'h', name: 'Honey', ml: 40, lock: !!o.lockHoney, ice: false, max: 0 },
      { id: 'e', name: 'Espresso', ml: 70, lock: false, ice: false, max: o.espressoMax ?? 0 },
      { id: 'i', name: 'Ice', ml: 100, lock: false, ice: true, max: 0 },
    ],
  };
}

describe('compute: verified vectors (HANDOFF §6)', () => {
  const cases: Array<[string, Opts, [number, number, number, number, number]]> = [
    ['extra 0', { extra: 0 }, [40, 70, 100, 0, 210]],
    ['extra 30', { extra: 30 }, [46, 80, 114, 0, 240]],
    ['extra 40', { extra: 40 }, [48, 83, 119, 0, 250]],
    ['extra 50', { extra: 50 }, [50, 87, 123, 0, 260]],
    ['extra -60', { extra: -60 }, [29, 50, 71, 0, 150]],
    ['extra 40, honey locked', { extra: 40, lockHoney: true }, [40, 86, 124, 0, 250]],
    ['extra 40, round5', { extra: 40, round5: true }, [50, 85, 120, 0, 255]],
    ['extra 40, espresso max 75', { extra: 40, espressoMax: 75 }, [48, 75, 119, 8, 250]],
  ];

  it.each(cases)('%s', (_label, opts, [honey, espresso, ice, water, total]) => {
    const c = compute(base(opts));
    expect(c.ingredients.map((o) => o.ml)).toEqual([honey, espresso, ice]);
    expect(c.water).toBe(water);
    expect(c.total).toBe(total);
  });

  it('warns when a cap turns overflow into water', () => {
    const c = compute(base({ extra: 40, espressoMax: 75 }));
    expect(c.warn).toHaveLength(1);
    expect(c.warn[0]).toMatch(/Espresso is capped at 75 ml, so 8 ml becomes water/);
    expect(c.ingredients[1].capped).toBe(8);
  });
});

describe('compute: shares', () => {
  it('base case shares are 29.6 / 51.9 / 74.1', () => {
    const c = compute(base());
    expect(c.ingredients.map((o) => +o.share.toFixed(1))).toEqual([29.6, 51.9, 74.1]);
    expect(c.ingredients.map((o) => +o.baseShare.toFixed(1))).toEqual([29.6, 51.9, 74.1]);
  });

  it('shares are % of liquid, so with ice they sum past 100 (not normalised)', () => {
    const c = compute(base());
    const sum = c.ingredients.reduce((a, o) => a + o.share, 0);
    expect(sum).toBeGreaterThan(100);
  });

  it('honey share stays within 29.6–29.9 across extra 0..50', () => {
    for (let extra = 0; extra <= 50; extra += 5) {
      const honey = compute(base({ extra })).ingredients[0].share;
      expect(+honey.toFixed(1)).toBeGreaterThanOrEqual(29.6);
      expect(+honey.toFixed(1)).toBeLessThanOrEqual(29.9);
    }
  });

  it('drift stays under 0.5 points for non-ice ingredients in unlocked, uncapped scaling', () => {
    // Known, pre-existing behaviour (matches the original app): the ice row can drift
    // past 0.5 because the 1–2 ml rounding residual lands on the largest ingredient (ice),
    // and ice's share is magnified ~4x since only the melted 25% counts as liquid.
    // e.g. extra 50 → ice share 73.3 vs 74.1. Honey and espresso stay tight.
    for (let extra = -100; extra <= 300; extra += 5) {
      const c = compute(base({ extra }));
      for (const o of c.ingredients.filter((x) => !x.ice)) {
        expect(Math.abs(o.share - o.baseShare)).toBeLessThan(0.5);
      }
    }
  });

  it('residual fix lands the total exactly on target when round5 is off', () => {
    for (let extra = -100; extra <= 300; extra += 1) {
      const c = compute(base({ extra }));
      expect(c.total).toBe(c.target);
    }
  });
});

describe('compute: edge cases must not throw', () => {
  it('empty ingredient list', () => {
    const c = compute({ extra: 40, melt: 25, round5: false, ingredients: [] });
    expect(c.total).toBe(0);
    expect(c.liquid).toBe(0);
    expect(c.warn[0]).toMatch(/no ingredients/);
  });

  it('missing ingredients field', () => {
    expect(() => compute({})).not.toThrow();
  });

  it('single locked ingredient: nothing scales', () => {
    const c = compute({ extra: 40, melt: 25, ingredients: [{ name: 'A', ml: 50, lock: true }] });
    expect(c.ingredients[0].ml).toBe(50);
    expect(c.warn[0]).toMatch(/Every ingredient is fixed/);
  });

  it('target below the locked sum clamps factor to 0', () => {
    const c = compute({
      extra: -100,
      melt: 25,
      ingredients: [
        { name: 'Locked', ml: 80, lock: true },
        { name: 'Free', ml: 40 },
      ],
    });
    expect(c.ingredients.map((o) => o.ml)).toEqual([80, 0]);
    expect(c.warn[0]).toMatch(/smaller than the fixed ingredients/);
  });

  it('one ice ingredient at 0% melt: shares are 0, no NaN', () => {
    const c = compute({ extra: 20, melt: 0, ingredients: [{ name: 'Ice', ml: 100, ice: true }] });
    expect(c.liquid).toBe(0);
    expect(c.ingredients[0].share).toBe(0);
    expect(c.ingredients[0].baseShare).toBe(0);
    expect(c.iceLeft).toBe(120);
  });
});

describe('compute: parity with the original single-file app', () => {
  // Pull the original compute() out of reference/index.html and run both on random input.
  const html = readFileSync(fileURLToPath(new URL('../reference/index.html', import.meta.url)), 'utf8');
  const src = html.match(/\/\/ <compute>([\s\S]*?)\/\/ <\/compute>/)![1];
  const original = new Function(src + '; return compute;')() as (r: unknown) => unknown;

  // Small deterministic PRNG so failures reproduce.
  let seed = 12345;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const int = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

  it('matches on 2000 random recipes', () => {
    for (let n = 0; n < 2000; n++) {
      const count = int(0, 6);
      const recipe: ComputeInput = {
        extra: int(-150, 400),
        melt: int(0, 80),
        round5: rand() < 0.3,
        ingredients: Array.from({ length: count }, (_, i) => ({
          id: 'g' + i,
          name: 'Ing ' + i,
          ml: int(0, 200),
          lock: rand() < 0.2,
          ice: rand() < 0.25,
          max: rand() < 0.2 ? int(0, 150) : 0,
        })),
      };
      expect(compute(recipe)).toEqual(original(JSON.parse(JSON.stringify(recipe))));
    }
  });
});
