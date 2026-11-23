/**
 * James Hoffmann reference recipes. Data only: add a recipe here without touching layout code.
 * Amounts are in grams, as he gives them (the calculator uses ml on purpose; see HANDOFF §2).
 * Sources are linked on the page; these come from written-up versions of his videos.
 */
import { fmt } from './util';

export interface HoffmannBuild {
  /** [label, value] pairs shown as fixed facts. */
  facts: Array<[string, string]>;
  /** Derived amounts table: [label, amount]. */
  rows: Array<[string, string]>;
  /** Timed steps: [time or label, text]. Amounts inside the text rescale too. */
  steps: Array<[string, string]>;
  note?: string;
}

export interface HoffmannRecipe {
  id: string;
  name: string;
  /** Short ratio and time tag. */
  tag: string;
  input: { label: string; def: number; min: number; max: number; step: number };
  build: (input: number) => HoffmannBuild;
}

export const HOFFMANN_RECIPES: HoffmannRecipe[] = [
  {
    id: 'v60',
    name: 'Ultimate V60',
    tag: '60 g/L, about 3:00 to 3:30',
    input: { label: 'Water (g)', def: 500, min: 100, max: 1500, step: 10 },
    build: (w) => {
      const c = w * 0.06;
      const bloom = c * 2.5;
      return {
        facts: [
          ['Grind', 'Medium-fine'],
          ['Water temperature', 'Just off the boil. Hotter is better, especially for light roasts.'],
          ['Brewer', 'Hario V60 with paper filter'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Bloom pour', fmt(bloom) + ' g'],
          ['Pour to at 0:45', fmt(w * 0.6) + ' g'],
          ['Final pour to at 1:15', fmt(w) + ' g'],
        ],
        steps: [
          ['Prep', 'Rinse the filter with hot water, add ' + fmt(c) + ' g of coffee and make a small well in the middle.'],
          ['0:00', 'Pour ' + fmt(bloom) + ' g for the bloom (about 2.5 times the coffee, never more than 3). Swirl so the slurry is even.'],
          ['0:45', 'Pour up to ' + fmt(w * 0.6) + ' g over about 30 seconds.'],
          ['1:15', 'Pour up to ' + fmt(w) + ' g over about 30 seconds, a little slower and gentler than the first pour.'],
          ['1:45', 'Stir once clockwise and once anticlockwise with a spoon to knock grounds off the walls.'],
          ['Then', 'Let it drain a little, then give the V60 a gentle swirl to level the bed.'],
          ['by 3:00', 'Aim for the drawdown to finish around 3:00. Some write-ups say 3:30.'],
        ],
      };
    },
  },
  {
    id: 'aero',
    name: 'Ultimate AeroPress',
    tag: '55 g/L, about 3 minutes',
    input: { label: 'Water (g)', def: 200, min: 100, max: 300, step: 10 },
    build: (w) => {
      const c = w * 0.055;
      return {
        facts: [
          ['Grind', 'Finer end of medium for light roast'],
          ['Water temperature', 'Freshly boiled. Down to about 90°C for very dark roasts.'],
          ['Position', 'Standard, not inverted. No rinsing or preheating.'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Water', fmt(w) + ' g'],
        ],
        steps: [
          ['Prep', 'Put a filter in the cap without rinsing it. Lock the cap on and set the AeroPress on a mug or server.'],
          ['Add', fmt(c) + ' g of coffee. Shake the brewer lightly to level the bed.'],
          ['0:00', 'Pour all ' + fmt(w) + ' g of water, making sure every grain is wet. Start the timer and set the plunger about 1 cm into the top.'],
          ['2:00', 'Hold the brewer and plunger and swirl gently.'],
          ['2:30', 'Press slowly all the way down, taking about 30 seconds.'],
          ['Darker roast', 'Use a little more coffee, grind coarser and lower the water temperature.'],
        ],
      };
    },
  },
  {
    id: 'press',
    name: 'Ultimate French press',
    tag: '60 g/L, about 10 minutes',
    input: { label: 'Water (g)', def: 500, min: 200, max: 1000, step: 10 },
    build: (w) => {
      const c = w * 0.06;
      return {
        facts: [
          ['Grind', 'Medium-coarse'],
          ['Water temperature', 'Just boiled, 100°C'],
          ['Note', 'Another write-up uses 1:15, so 30 g to 450 g. Both work.'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Water', fmt(w) + ' g'],
        ],
        steps: [
          ['Prep', 'Put the French press on a scale, add ' + fmt(c) + ' g of ground coffee and tare.'],
          ['0:00', 'Pour ' + fmt(w) + ' g of water over the grounds in about 10 seconds. Do not stir yet.'],
          ['4:00', 'Stir the crust that formed on top.'],
          ['Skim', 'Use two spoons to lift off the foam and floating grounds.'],
          ['Wait', 'Leave it alone for 5 to 8 minutes while the grounds settle.'],
          ['Serve', 'Rest the plunger on the surface without pressing it down, then pour gently so the silt stays behind.'],
        ],
      };
    },
  },
  {
    id: 'moka',
    name: 'Moka pot',
    tag: 'about 1:10 by weight',
    input: { label: 'Water in the base (ml)', def: 150, min: 50, max: 600, step: 10 },
    build: (w) => {
      const c = w / 10;
      return {
        facts: [
          ['Water', 'Boil first, then fill to the valve with water just off the boil'],
          ['Basket', 'Level to the top, loose, do not press down'],
          ['Optional', 'An AeroPress filter under the top section'],
        ],
        rows: [
          ['Water in base', fmt(w) + ' ml'],
          ['Coffee (about a tenth of the water)', fmt(c) + ' g'],
        ],
        steps: [
          ['Fill', 'Add ' + fmt(w) + ' ml of just-boiled water to the base, up to the valve.'],
          ['Load', 'Fill the basket with about ' + fmt(c) + ' g of loose grounds, levelled off without tamping.'],
          ['Heat', 'Put it on medium-high heat with the lid open so you can watch the coffee come up.'],
          ['At flow', 'As soon as coffee starts to flow, turn the heat to its lowest setting.'],
          ['If fast', 'If the coffee comes out thick and fast, take the pot off the heat completely.'],
          ['At gurgle', 'When you hear gurgling, lift the pot, tilt it and run the base under cold water to stop the brew.'],
        ],
        note:
          'A brikka has a weighted valve that behaves differently from a plain moka pot, and these steps come from his standard moka pot routine, so treat them as a starting point and adjust the heat by eye.',
      };
    },
  },
  {
    id: 'iced',
    name: 'Immersion iced coffee',
    tag: 'about 75 g/L, 5:30',
    input: { label: 'Finished drink (ml)', def: 250, min: 100, max: 1000, step: 10 },
    build: (t) => {
      const c = t * 0.076;
      const hot = t * 0.66;
      const ice = t * 0.34;
      return {
        facts: [
          ['Grind', 'Finer end of medium, finer than pour-over'],
          ['Water temperature', '99°C'],
          ['Brewer', 'AeroPress or Clever Dripper with paper filter'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Hot water', fmt(hot) + ' g'],
          ['Ice from the freezer', fmt(ice) + ' g'],
        ],
        steps: [
          ['Prep', 'Preheat the brewer here (unlike his Ultimate AeroPress) and set it on a carafe. Grind ' + fmt(c) + ' g of coffee.'],
          ['0:00', 'Add the coffee, then ' + fmt(hot) + ' g of freshly boiled water. Stir so there are no dry pockets.'],
          ['Seal', 'Place the plunger on top to seal the brewer.'],
          ['5:00', 'Steep for at least 5 minutes, or 4 minutes for darker roasts.'],
          ['Ice', 'Put ' + fmt(ice) + ' g of ice into the carafe.'],
          ['Press', 'Press the brew through onto the ice. Stir in any ice that is left, then serve over ice.'],
        ],
        note: 'Amounts are flexible. Ice cubes are never the same size, so do not worry about the last gram.',
      };
    },
  },
];
