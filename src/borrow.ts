/**
 * "Make it mine": turn a barista recipe into an editable entry in My recipes.
 *
 * The barista tables can't be copied row by row: pour-overs list running totals
 * ("pour to 300 g, then to 500 g"), and some rows are pinches or garnishes. So each
 * recipe has an explicit ingredient list here, at the recipe's default input.
 * Weights in grams are entered as ml (1 g of water ≈ 1 ml); ground coffee keeps its
 * weight so it scales with the water.
 */
import { BARISTAS, type BrewRecipe } from './baristas';
import type { Recipe } from './compute';
import { uid } from './util';

type Item = [name: string, amount: number, opts?: { ice?: boolean; lock?: boolean }];
interface Spec {
  items: Item[];
  /** % of the ice that melts. Defaults to 25, like a new recipe. */
  melt?: number;
}

export const MINE: Record<string, Spec> = {
  // James Hoffmann
  v60: { items: [['Ground coffee (g)', 30], ['Water', 500]] },
  aero: { items: [['Ground coffee (g)', 11], ['Water', 200]] },
  press: { items: [['Ground coffee (g)', 30], ['Water', 500]] },
  moka: { items: [['Water in the base', 150], ['Ground coffee (g)', 15]] },
  // Brewed hot onto ice that all melts, so the full 80% maximum.
  iced: { items: [['Ground coffee (g)', 19], ['Hot water', 165], ['Ice', 85, { ice: true }]], melt: 80 },
  shakerato: { items: [['Espresso', 40], ['Simple syrup', 10]] },
  tonic: { items: [['Tonic water', 120], ['Espresso', 38]] },
  // Morgan Eckroth
  'eckroth-pantry': { items: [['Honey', 15], ['Espresso', 40], ['Milk', 240]] },
  'eckroth-beekeeper': { items: [['Infused honey syrup', 23], ['Espresso', 60], ['Milk', 180]] },
  'eckroth-maple': { items: [['Espresso', 40], ['Dark maple syrup', 20], ['Milk', 250]] },
  'eckroth-strawberry': { items: [['Strawberry syrup', 25], ['Espresso', 40], ['Milk', 200]] },
  'eckroth-chai': { items: [['Chai concentrate', 100], ['Milk', 100], ['Espresso', 40], ['Orgeat or vanilla syrup', 20]] },
  'eckroth-psl': { items: [['Pumpkin spice syrup', 25], ['Espresso', 40], ['Milk', 200]] },
  'eckroth-gochugaru': { items: [['Gochugaru chocolate sauce', 25], ['Espresso', 40], ['Milk', 250]] },
  // Pour-overs: total water, not the running pour targets.
  'kasuya-46': { items: [['Ground coffee (g)', 20], ['Water', 300]] },
  'rao-v60': { items: [['Ground coffee (g)', 20], ['Water', 330]] },
  'winton-5pour': { items: [['Ground coffee (g)', 20], ['Water', 300]] },
  'sasaki-2014': { items: [['Ground coffee (g)', 16.5], ['Water', 250]] },
  'garay-2018': { items: [['Ground coffee (g)', 34.9], ['Brew water', 100], ['Hot water top-up', 60], ['Room-temperature top-up', 40]] },
  'little-2022': { items: [['Ground coffee (g)', 18], ['Cold water in the server', 20], ['Brew water', 94], ['Hot water top-up', 36]] },
  'wipvasutti-2023': {
    items: [['Ground coffee, first dose (g)', 16], ['Ground coffee, second dose (g)', 2], ['Brew water', 100], ['Room-temperature top-up', 15], ['Hot water top-up', 40]],
  },
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Rows in the barista's table that have no g or ml amount, so they can't be copied. */
export function leftOut(r: BrewRecipe, input = r.input.def): string[] {
  return r.build(input).rows
    .filter((x) => !/\d+(\.\d+)?\s*(g|ml)\b/.test(x[1]))
    .map((x) => x[0].toLowerCase() + ' (' + x[1].toLowerCase() + ')');
}

/**
 * A new My recipes entry from a barista recipe, scaled to `input`
 * (the barista page's milk or water amount; defaults to the published one).
 */
export function borrow(r: BrewRecipe, barista: string, input = r.input.def): Recipe {
  const spec = MINE[r.id];
  const k = input > 0 ? input / r.input.def : 1;
  return {
    id: uid(),
    name: r.name + ' (' + barista + ')',
    extra: 0,
    melt: spec.melt ?? 25,
    round5: false,
    ingredients: spec.items.map(([name, amount, o]) => ({
      id: uid(),
      name,
      ml: round1(amount * k),
      lock: !!o?.lock,
      ice: !!o?.ice,
      max: 0,
    })),
  };
}

/** Every barista recipe, grouped for the picker. */
export const borrowable = () =>
  BARISTAS.map((b) => ({ barista: b.name, recipes: b.recipes.filter((r) => MINE[r.id]) }));
