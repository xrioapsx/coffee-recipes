/**
 * Reference recipes from well-known baristas, grouped by barista. Data only: add a
 * recipe or a barista here without touching layout code.
 * Amounts are in grams, as the baristas give them (the calculator uses ml on purpose;
 * see HANDOFF §2). Each barista lists the sources their numbers come from.
 *
 * Recipe ids are unique across all baristas; the saved selection (state.hof) is a
 * recipe id, and the barista is whoever owns it.
 */
import { fmt } from './util';

export interface BrewBuild {
  /** [label, value] pairs shown as fixed facts. */
  facts: Array<[string, string]>;
  /** Derived amounts table: [label, amount]. */
  rows: Array<[string, string]>;
  /** Timed steps: [time or label, text]. Amounts inside the text rescale too. */
  steps: Array<[string, string]>;
  note?: string;
}

export interface BrewRecipe {
  id: string;
  name: string;
  /** Short ratio and time tag. */
  tag: string;
  input: { label: string; def: number; min: number; max: number; step: number };
  build: (input: number) => BrewBuild;
}

export interface Barista {
  id: string;
  name: string;
  /** One line on who they are, shown on their tab. */
  title: string;
  /** Intro paragraphs. The first may start with a bold lead sentence, set as `lead`. */
  intro: Array<{ lead?: string; text: string }>;
  /** Shown above the source links. */
  sourceNote: string;
  sources: Array<{ label: string; url: string }>;
  recipes: BrewRecipe[];
}

const HOFFMANN_RECIPES: BrewRecipe[] = [
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
  {
    id: 'shakerato',
    name: 'Caffè shakerato',
    tag: 'espresso shaken with syrup and ice',
    input: { label: 'Espresso (g)', def: 40, min: 20, max: 160, step: 5 },
    build: (e) => {
      const syrup = e / 4;
      const drops = Math.max(1, Math.round(e / 20));
      return {
        facts: [
          ['Espresso', 'A double shot is about 40 g'],
          ['Syrup', '1:1 simple syrup: equal weights of sugar and water'],
          ['Equipment', 'Cocktail shaker and a chilled glass'],
        ],
        rows: [
          ['Espresso', fmt(e) + ' g'],
          ['Simple syrup', fmt(syrup) + ' g'],
          ['Saline (salt water)', drops + (drops === 1 ? ' drop' : ' drops')],
          ['Ice', 'A shaker full. The amount is not given.'],
        ],
        steps: [
          ['Chill', 'Put a glass in the freezer or fill it with ice water while you prepare.'],
          ['Shaker', 'Add ' + fmt(syrup) + ' g of syrup, ' + drops + (drops === 1 ? ' drop' : ' drops') + ' of saline and the ice to the shaker.'],
          ['Pour', 'Pull ' + fmt(e) + ' g of espresso and pour it straight over the ice.'],
          ['Shake', 'Swirl, then shake hard for about 30 seconds.'],
          ['Serve', 'Strain into the chilled glass. The foam on top is the point.'],
        ],
        note:
          'His fruity variation uses about 36 g of a light, fruity espresso, 12 g of Earl Grey syrup, 2 drops of saline and 0.2 g of orange bitters. Honey syrup in place of simple syrup gets you close to your own coffee honey drink.',
      };
    },
  },
  {
    id: 'tonic',
    name: 'Espresso tonic',
    tag: 'about 1:3 espresso to tonic',
    input: { label: 'Tonic water (g)', def: 120, min: 60, max: 480, step: 10 },
    build: (t) => {
      const lo = (t * 35) / 120;
      const hi = (t * 40) / 120;
      return {
        facts: [
          ['Tonic', 'Shop-bought is fine. He also makes his own from cinchona bark.'],
          ['Coffee', 'Fruity, washed coffees suit it best'],
          ['Glass', 'Tall, with plenty of ice'],
        ],
        rows: [
          ['Tonic water', fmt(t) + ' g'],
          ['Espresso', fmt(lo) + '–' + fmt(hi) + ' g'],
        ],
        steps: [
          ['Ice', 'Fill the glass with ice.'],
          ['Tonic', 'Pour in ' + fmt(t) + ' g of cold tonic.'],
          ['Espresso', 'Add ' + fmt(lo) + ' to ' + fmt(hi) + ' g of espresso on top, or serve it on the side.'],
          ['Serve', 'Stir, swirl or leave it layered, as you like.'],
        ],
      };
    },
  },
];

/** Split a total into pours by their share of a reference total, plus running totals. */
function pours(total: number, ref: number, parts: number[]) {
  let run = 0;
  return parts.map((p) => {
    const g = (p / ref) * total;
    run += g;
    return { g, upTo: run };
  });
}

const KASUYA_RECIPES: BrewRecipe[] = [
  {
    id: 'kasuya-46',
    name: '4:6 method',
    tag: '1:15, about 3:30',
    input: { label: 'Water (g)', def: 300, min: 150, max: 600, step: 10 },
    build: (w) => {
      const c = w / 15;
      const p = pours(w, 300, [50, 70, 60, 60, 60]);
      return {
        facts: [
          ['Grind', 'Coarse'],
          ['Water temperature', '92°C'],
          ['Brewer', 'Hario V60. His own model has no spiral ribs at the bottom, which slows the flow.'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['First 40%: pours 1 and 2', fmt(p[0].g) + ' g + ' + fmt(p[1].g) + ' g'],
          ['Last 60%: pours 3, 4 and 5', fmt(p[2].g) + ' g each'],
          ['Total water', fmt(w) + ' g'],
        ],
        steps: [
          ['0:00', 'Pour ' + fmt(p[0].g) + ' g.'],
          ['0:45', 'Pour ' + fmt(p[1].g) + ' g, up to ' + fmt(p[1].upTo) + ' g.'],
          ['1:30', 'Pour ' + fmt(p[2].g) + ' g, up to ' + fmt(p[2].upTo) + ' g.'],
          ['2:10', 'Pour ' + fmt(p[3].g) + ' g, up to ' + fmt(p[3].upTo) + ' g.'],
          ['2:40', 'Pour ' + fmt(p[4].g) + ' g, up to ' + fmt(p[4].upTo) + ' g.'],
          ['3:30', 'Remove the V60, even if it is still dripping.'],
        ],
        note:
          'The idea behind the name: the first 40% of the water sets the taste and the last 60% sets the strength. A bigger first pour makes it brighter, a smaller one sweeter. Splitting the last 60% into more pours makes it stronger, fewer pours lighter.',
      };
    },
  },
];

const RAO_RECIPES: BrewRecipe[] = [
  {
    id: 'rao-v60',
    name: 'V60 with the Rao spin',
    tag: 'about 1:16.5, 4:00 to 4:30',
    input: { label: 'Water (g)', def: 330, min: 150, max: 660, step: 10 },
    build: (w) => {
      const c = (w * 20) / 330;
      const bloom = (w * 60) / 330;
      const mid = (w * 200) / 330;
      return {
        facts: [
          ['Grind', 'Not given. Adjust it so the whole brew takes 4:00 to 4:30.'],
          ['Water temperature', '97°C'],
          ['Brewer', 'Plastic V60, which holds heat better than ceramic or glass'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Bloom pour', fmt(bloom) + ' g'],
          ['Pour to', fmt(mid) + ' g'],
          ['Final pour to', fmt(w) + ' g'],
        ],
        steps: [
          ['Prep', 'Grind ' + fmt(c) + ' g of coffee into the V60 and push a small nest into the middle with your finger.'],
          ['0:00', 'Pour ' + fmt(bloom) + ' g, then straight away spin the brewer hard so all the grounds get wet.'],
          ['0:40', 'Pour up to ' + fmt(mid) + ' g, then give it a very gentle spin of under a second.'],
          ['70% down', 'When the slurry has drained about 70%, pour up to ' + fmt(w) + ' g and spin gently again.'],
          ['Pouring', 'Pour from low with a steady, nearly vertical stream, keeping the kettle at one height and moving evenly around the slurry.'],
          ['4:00–4:30', 'The drawdown should finish here. If not, change the grind.'],
        ],
      };
    },
  },
];

const WINTON_RECIPES: BrewRecipe[] = [
  {
    id: 'winton-5pour',
    name: 'Five-pour V60',
    tag: '1:15, five equal pours',
    input: { label: 'Water (g)', def: 300, min: 150, max: 600, step: 10 },
    build: (w) => {
      const c = w / 15;
      const p = pours(w, 5, [1, 1, 1, 1, 1]);
      return {
        facts: [
          ['Grind', 'Medium. Coarser if it runs long and bitter, finer if it runs fast and sour.'],
          ['Water temperature', '93°C, left off the base so it cools between pours'],
          ['Brewer', 'Hario metal V60 size 02 with V60 paper filters'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Each of the five pours', fmt(p[0].g) + ' g'],
          ['Total water', fmt(w) + ' g'],
        ],
        steps: [
          ['Pour 1', 'Bloom: pour ' + fmt(p[0].g) + ' g in circles until every ground is wet.'],
          ['Pour 2', 'Once the bloom settles, pour up to ' + fmt(p[1].upTo) + ' g from a height to stir up the bed.'],
          ['Pour 3', 'After about 30 seconds, or when the bed is nearly dry, pour up to ' + fmt(p[2].upTo) + ' g.'],
          ['Pour 4', 'Wait the same again, then pour up to ' + fmt(p[3].upTo) + ' g.'],
          ['Pour 5', 'Wait the same again, then pour up to ' + fmt(w) + ' g.'],
          ['Drawdown', 'Let it drain, about 3 minutes 30 seconds. Then lift off the brewer and swirl the coffee.'],
        ],
        note:
          'For his competition brew he used two kettles, 93°C for the bloom and 88°C for the later pours. With one kettle, leaving it off the base lets it cool on the way.',
      };
    },
  },
];

const SASAKI_RECIPES: BrewRecipe[] = [
  {
    id: 'sasaki-2014',
    name: '2014 winning AeroPress',
    tag: 'about 1:15, 78°C, slow press',
    input: { label: 'Water (g)', def: 250, min: 150, max: 300, step: 10 },
    build: (w) => {
      const c = (w * 16.5) / 250;
      const bloom = (w * 40) / 250;
      const main = (w * 210) / 250;
      const leave = (w * 45) / 250;
      return {
        facts: [
          ['Grind', 'EK43 at 9.5 in competition, around medium'],
          ['Water', '78°C, soft mineral water'],
          ['Brewer', 'AeroPress, standard position, rinsed paper filter'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Bloom water', fmt(bloom) + ' g'],
          ['Then add', fmt(main) + ' g'],
          ['Leave in the chamber', 'about ' + fmt(leave) + ' g'],
        ],
        steps: [
          ['Prep', 'Rinse a paper filter and set the AeroPress up the normal way. Add ' + fmt(c) + ' g of coffee.'],
          ['0:00', 'Pour ' + fmt(bloom) + ' g of water at 78°C and stir 5 times.'],
          ['0:25', 'Add ' + fmt(main) + ' g more water and stir once.'],
          ['Press', 'Press very slowly, taking about 75 seconds.'],
          ['Stop', 'Stop with about ' + fmt(leave) + ' g still in the chamber. The last part tastes harsh.'],
        ],
      };
    },
  },
];

const GARAY_RECIPES: BrewRecipe[] = [
  {
    id: 'garay-2018',
    name: '2018 winning AeroPress',
    tag: 'strong concentrate, then diluted',
    input: { label: 'Total water (g)', def: 200, min: 120, max: 240, step: 10 },
    build: (w) => {
      const c = (w * 34.9) / 200;
      const brew = w * 0.5;
      const hot = w * 0.3;
      const room = w * 0.2;
      return {
        facts: [
          ['Grind', 'EK43S at 8 in competition, around medium-fine'],
          ['Water', '85°C, Brita-filtered'],
          ['Brewer', 'AeroPress inverted, rinsed paper filter'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Brew water', fmt(brew) + ' g'],
          ['Top up, hot', fmt(hot) + ' g'],
          ['Top up, room temperature', fmt(room) + ' g'],
        ],
        steps: [
          ['Prep', 'Set the AeroPress upside down, rinse the filter, grind ' + fmt(c) + ' g of coffee.'],
          ['0:00', 'Pour ' + fmt(brew) + ' g of water at 85°C over about 30 seconds.'],
          ['0:30', 'Stir firmly but carefully with chopsticks for 30 seconds.'],
          ['1:00', 'Cap it, flip it onto a server that is not preheated, and press for 30 seconds.'],
          ['Top up', 'Add ' + fmt(hot) + ' g of 85°C water and ' + fmt(room) + ' g of room-temperature water.'],
        ],
      };
    },
  },
];

const LITTLE_RECIPES: BrewRecipe[] = [
  {
    id: 'little-2022',
    name: '2022 winning AeroPress',
    tag: 'concentrate onto cold water, then bypass',
    input: { label: 'Finished drink (g)', def: 150, min: 100, max: 200, step: 10 },
    build: (t) => {
      const c = (t * 18) / 150;
      const cold = (t * 20) / 150;
      const brew = (t * 94) / 150;
      return {
        facts: [
          ['Grind', 'Very coarse with fines sifted out, or EK43 at 10 without sifting'],
          ['Water', '92°C to brew, 90°C to top up'],
          ['Brewer', 'AeroPress, standard position, one unrinsed paper filter'],
        ],
        rows: [
          ['Coffee', fmt(c) + ' g'],
          ['Cold water in the server', fmt(cold) + ' g'],
          ['Brew water', fmt(brew) + ' g'],
          ['Top up with hot water to', fmt(t) + ' g'],
        ],
        steps: [
          ['Prep', 'Put ' + fmt(cold) + ' g of cold water in the server. It stops the extraction as the coffee lands.'],
          ['0:00', 'Add ' + fmt(c) + ' g of coffee, pour ' + fmt(brew) + ' g of 92°C water and stir gently 12 times.'],
          ['1:20', 'Set the plunger on top.'],
          ['1:30', 'Press gently.'],
          ['Top up', 'Add 90°C water until the drink weighs ' + fmt(t) + ' g.'],
        ],
        note: 'In competition she ground twice, very coarse then on a second grinder, and sifted out the finest dust. One grinder on a coarse setting is a fair start at home.',
      };
    },
  },
];

const WIPVASUTTI_RECIPES: BrewRecipe[] = [
  {
    id: 'wipvasutti-2023',
    name: '2023 winning AeroPress',
    tag: 'two-stage dose, cool and hot bypass',
    input: { label: 'Finished drink (g)', def: 155, min: 100, max: 200, step: 5 },
    build: (t) => {
      const c1 = (t * 16) / 155;
      const c2 = (t * 2) / 155;
      const brew = (t * 100) / 155;
      const cool = (t * 115) / 155;
      return {
        facts: [
          ['Grind', 'Fine-medium, French press range (1Zpresso ZP6 at 65 clicks)'],
          ['Water', '89°C, mineralised coffee water'],
          ['Brewer', 'AeroPress inverted, rinsed paper filter'],
        ],
        rows: [
          ['Coffee, first dose', fmt(c1) + ' g'],
          ['Coffee, second dose', fmt(c2) + ' g'],
          ['Brew water', fmt(brew) + ' g'],
          ['Top up, room temperature, to', fmt(cool) + ' g'],
          ['Top up, hot, to', fmt(t) + ' g'],
        ],
        steps: [
          ['0:00', 'With the AeroPress upside down, add ' + fmt(c1) + ' g of coffee and pour ' + fmt(brew) + ' g of 89°C water.'],
          ['0:30', 'Stir with one end of a chopstick for 5 seconds.'],
          ['0:45', 'Add the second ' + fmt(c2) + ' g of coffee.'],
          ['0:55', 'Stir for another 5 seconds. Push the plunger up to clear the air, then cap it.'],
          ['1:35', 'Flip carefully and press for about 30 seconds.'],
          ['Top up', 'Add room-temperature water to ' + fmt(cool) + ' g, then hot water to ' + fmt(t) + ' g.'],
        ],
        note: 'The late second dose is how he fixed the strength. Competition brews are tuned to one coffee, so taste and adjust.',
      };
    },
  },
];

export const BARISTAS: Barista[] = [
  {
    id: 'hoffmann',
    name: 'James Hoffmann',
    title: 'World Barista Champion 2007',
    intro: [
      {
        lead: 'Closest to your coffee honey: the caffè shakerato.',
        text: 'Espresso and syrup shaken hard with ice, the Italian original of your own drink. His immersion iced coffee is close too: strong coffee pressed straight onto ice, so the melting ice does the diluting, which is why the calculator counts ice melt.',
      },
      { text: 'Pick a recipe, then change the water to scale everything else in it.' },
    ],
    sourceNote: "The shakerato and tonic are from his own site. The rest are written-up versions of his videos, so check the original video when a detail matters.",
    sources: [
      { label: 'Ultimate V60 Technique (gist)', url: 'https://gist.github.com/fluency03/7fb305b8110dde5739d14697af97a99a' },
      { label: 'Ultimate V60, Hario USA', url: 'https://www.hario-usa.com/blogs/recipes-and-more-from-friends/james-hoffmann-uitimate-v60-technique' },
      { label: 'Ultimate AeroPress Technique (gist)', url: 'https://gist.github.com/fluency03/a494eed7504c8f2b3a162a84f3941168' },
      { label: 'French press recipe, Honest Coffee Guide', url: 'https://honestcoffeeguide.com/brew-recipes/james-hoffmann-french-press/' },
      { label: 'Moka pot routine, HuffPost UK', url: 'https://huffingtonpost.co.uk/entry/james-hoffmann-moka-pot-coffee-routine_uk_673b1cc9e4b0ebe12e36b57d' },
      { label: 'Immersion iced coffee, AeroPrecipe', url: 'https://aeroprecipe.com/recipes/james-hoffman-immersion-iced-coffee' },
      { label: 'Caffè shakerato, jameshoffmann.co.uk', url: 'https://www.jameshoffmann.co.uk/weird-coffee-science/caffe-shakerato' },
      { label: 'Espresso tonic recipes, jameshoffmann.co.uk', url: 'https://www.jameshoffmann.co.uk/weird-coffee-science/espresso-tonic-recipes' },
      { label: 'Immersion iced coffee, Sprudge', url: 'https://sprudge.com/summer-brew-methods-james-hoffmann-katie-carguilo-bust-out-the-slip-n-slide-3817.html' },
    ],
    recipes: HOFFMANN_RECIPES,
  },
  {
    id: 'kasuya',
    name: 'Tetsu Kasuya',
    title: 'World Brewers Cup Champion 2016',
    intro: [
      {
        lead: 'The 4:6 method he won with.',
        text: 'Five timed pours on a V60 at 1:15. Splitting the water into a taste part and a strength part means you can steer the cup without changing the grind.',
      },
    ],
    sourceNote: "Hario's interview with Kasuya. Other write-ups use slightly different pour splits, which is the point of the method.",
    sources: [
      { label: 'Hario V60 recipe interview with Tetsu Kasuya, Hario UK', url: 'https://hario.co.uk/blogs/hario-ambassadors/hario-v60-recipe-interview-with-hario-ambassador-tetsu-kasuya' },
      { label: '4:6 method variations, Honest Coffee Guide', url: 'https://honestcoffeeguide.com/brew-recipes/tetsu-kasuya-4-6-method/' },
    ],
    recipes: KASUYA_RECIPES,
  },
  {
    id: 'rao',
    name: 'Scott Rao',
    title: 'Coffee consultant and author',
    intro: [
      {
        lead: 'Known for the "Rao spin".',
        text: 'Instead of stirring, he spins the whole brewer so the coffee bed settles flat and drains evenly.',
      },
    ],
    sourceNote: "His recipe as given in Hario's interview with him. The grind is not stated, so set it by the brew time.",
    sources: [
      { label: 'Hario V60 recipe interview with Scott Rao, Hario UK', url: 'https://www.hario.co.uk/blogs/hario-ambassadors/hario-v60-recipe-interview-with-hario-ambassador-scott-rao' },
    ],
    recipes: RAO_RECIPES,
  },
  {
    id: 'winton',
    name: 'Matt Winton',
    title: 'World Brewers Cup Champion 2021',
    intro: [
      {
        lead: 'Five equal pours, no stirring.',
        text: 'The recipe he won with. Each pour is the same size, and the pours themselves do the agitating.',
      },
    ],
    sourceNote: 'A written-up version of the official Hario video, so check the video when a detail matters.',
    sources: [
      { label: 'Matt Winton V60 five pour, Honest Coffee Guide', url: 'https://honestcoffeeguide.com/brew-recipes/matt-winton-v60-five-pour/' },
      { label: 'V60 five-pour recipe video, Hario', url: 'https://www.youtube.com/watch?v=YIC-2nFQ7vM' },
    ],
    recipes: WINTON_RECIPES,
  },
  {
    id: 'sasaki',
    name: 'Shuichi Sasaki',
    title: 'World AeroPress Champion 2014',
    intro: [
      {
        lead: 'Low temperature, slow press.',
        text: 'A Japanese barista with Paul Bassett, he won with 78°C water and a 75-second press, stopping before the bitter last part comes through.',
      },
    ],
    sourceNote: 'His recipe as reported after the championship. Competition recipes are tuned to one coffee, so treat it as a starting point.',
    sources: [
      { label: '2014 World AeroPress Champion recipe, Daily Coffee News', url: 'https://dailycoffeenews.com/2014/06/13/how-to-brew-the-worlds-best-aeoropress-the-2014-world-champions-recipe' },
    ],
    recipes: SASAKI_RECIPES,
  },
  {
    id: 'garay',
    name: 'Carolina Ibarra Garay',
    title: 'World AeroPress Champion 2018',
    intro: [
      {
        lead: 'A strong concentrate, diluted to taste.',
        text: 'The first American to win the World AeroPress Championship. She brews with a big dose and little water, then tops up with hot and room-temperature water.',
      },
    ],
    sourceNote: 'Her recipe as reported after the championship, brewed with a Kenyan coffee every competitor had to use. Treat it as a starting point.',
    sources: [
      { label: 'Carolina Ibarra Garay winning recipe, Daily Coffee News', url: 'https://dailycoffeenews.com/2018/11/20/carolina-ibarra-garays-winning-recipe-from-the-world-aeropress-championship' },
    ],
    recipes: GARAY_RECIPES,
  },
  {
    id: 'little',
    name: 'Jibbi Little',
    title: 'World AeroPress Champion 2022',
    intro: [
      {
        lead: 'Brewed straight onto cold water.',
        text: 'The Australian champion presses a short concentrate into a little cold water to lock in the flavour, then tops it up with hot water.',
      },
    ],
    sourceNote: 'Her recipe as published by AeroPress.',
    sources: [
      { label: 'WAC 2022 champion Jibbi Little, AeroPress', url: 'https://aeropress.com/blogs/aeropress-recipes/wac-2022-champion-jibbi-little' },
    ],
    recipes: LITTLE_RECIPES,
  },
  {
    id: 'wipvasutti',
    name: 'Tay Wipvasutti',
    title: 'World AeroPress Champion 2023',
    intro: [
      {
        lead: 'Coffee added in two stages.',
        text: 'Representing Thailand, he adds a small second dose of coffee partway through the brew to set the strength, then tops up with cool and hot water.',
      },
    ],
    sourceNote: 'His winning method as written up after the championship.',
    sources: [
      { label: '2023 World AeroPress Champion Tay Wipvasutti, The Magic Roast', url: 'https://themagicroast.substack.com/p/introducing-2023-world-aeropress' },
    ],
    recipes: WIPVASUTTI_RECIPES,
  },
];

/** The barista who owns a recipe id, falling back to the first barista. */
export function baristaOf(recipeId: string): Barista {
  return BARISTAS.find((b) => b.recipes.some((r) => r.id === recipeId)) || BARISTAS[0];
}
