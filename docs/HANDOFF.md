# Coffee Honey Scaler — project handoff to Claude Code

Paste this whole file as your opening prompt, or save it in the repo root and tell
Claude Code to read it. `index.html` ships alongside it as the working reference
implementation — read it before writing anything new.

---

## 1. What I want you to do

I have a working single-file web app. I want to move it into a proper project I can
version, test and deploy. Read `index.html` first, confirm the three decisions in
§10, then set the project up and port the app across without losing any behaviour
described in §4 to §6.

Do not redesign the app or change the scaling maths unless I ask. The numbers in §6
are verified and the visual direction in §8 is settled.

---

## 2. Context

I am a home coffee drinker, not a barista. I brew with a **Bialetti Brikka** moka
pot, not an espresso machine. My everyday drink is honey stirred into hot coffee,
then shaken with ice:

- 40 ml honey
- 70 ml "espresso" from the Brikka
- 100 ml ice cubes

I wanted more volume out of it without it tasting different, which is what the app
does. It then grew into a place to keep all my drinks, plus a reference shelf of
James Hoffmann brew recipes, since he is who I follow.

Units are **millilitres throughout the calculator**, because I measure in a jigger,
not on a scale. The Hoffmann recipes use **grams**, because that is how he gives
them. Do not unify these; the mismatch is intentional.

---

## 3. Current state

- One self-contained `index.html`: markup, CSS and vanilla JS in a single file, no
  build step, no dependencies, no network calls.
- Published as a private Claude artifact at
  https://claude.ai/artifact/1MHavtXSQJAj5fhdM9bNe2
- State persists in `localStorage` under the key `coffee-honey-scaler-v2`, with a
  one-way migration from an older `coffee-honey-scaler-v1` shape.
- Two views, routed on the URL hash: `#calculator` (default) and `#hoffmann`.

---

## 4. Data model

```js
{
  recipes: [
    {
      id: "a1b2c3d",              // random string
      name: "Coffee honey",
      extra: 40,                   // ml to add vs. the recipe's own base total
      melt: 25,                    // % of ice assumed to melt while shaking
      round5: false,               // round scaled amounts to 5 ml
      ingredients: [
        {
          id: "x7y8z9",
          name: "Honey",
          ml: 40,                  // the base amount, what I actually wrote down
          lock: false,             // hold this amount while everything else scales
          ice: false,              // counts as volume but only partly as liquid
          max: 0                   // cap in ml; 0 means no cap
        }
      ]
    }
  ],
  currentId: "a1b2c3d",
  hof: "v60",                      // selected Hoffmann recipe
  hofInputs: { "v60": 500 }        // per-recipe water/volume input
}
```

Notes:

- `extra`, `melt`, `round5` are **per recipe**, not global. Changing the target
  volume of one drink must not disturb another.
- `ml` is always the *base* amount. Scaled output is derived, never written back.
  This matters: round-tripping scaled values into the base would drift the recipe.
- Ingredient order is the display order, bottom-up in the glass graphic.
- Ingredient colours are assigned by index from a six-token palette and cycle.
  They are not stored.

---

## 5. The scaling algorithm

This is the core of the app. In `index.html` it is the `compute(recipe)` function,
fenced between `// <compute>` and `// </compute>` comments so it can be extracted
and tested in isolation. Keep it a **pure function** with no DOM access, whatever
structure you move it into.

Steps, in order:

1. `baseTotal` = sum of every ingredient's `ml`.
2. `target` = `max(0, baseTotal + extra)`.
3. Split the base into `L` (sum of locked ingredients) and `U` (sum of unlocked).
4. `factor = (target - L) / U`.
5. Each unlocked ingredient becomes `round(ml * factor / step) * step`, where
   `step` is 5 when `round5` is on, otherwise 1. Locked ingredients keep their
   base amount.
6. **Residual fix.** When `step` is 1, rounding leaves the sum a millilitre or two
   off `target`. Add the difference to the largest unlocked ingredient so the total
   lands exactly on the number I asked for. Skip this when `round5` is on, because
   there I want round numbers more than I want an exact total.
7. **Caps.** For each ingredient with `max > 0` whose scaled amount exceeds it,
   clamp to `max` and add the overflow to a single shared `water` figure. Emit a
   warning naming the ingredient and the amount. Water is shown as its own row,
   never as an ingredient.
8. `total` = sum of scaled amounts + water.
9. **Liquid.** `liquid` = water + every non-ice amount + every ice amount × melt
   fraction. `iceLeft` = ice amounts × (1 − melt). Compute `baseLiquid` the same
   way from the base amounts.
10. **Shares.** Each ingredient's `share` is its scaled amount over `liquid`;
    `baseShare` is its base amount over `baseLiquid`. These are what tell me the
    taste held. They are percentages of liquid, so with ice in the recipe they sum
    to more than 100. That is correct, not a bug — do not "fix" it by normalising.

Guard conditions, each surfacing a plain-language warning rather than throwing:

| Condition | Behaviour |
|---|---|
| No ingredients | Warn, return zeros |
| Every ingredient locked (`U <= 0`) | Warn, nothing scales |
| `factor < 0` (target below the locked sum) | Warn, clamp factor to 0 |
| `liquid == 0` (all ice, 0% melt) | Shares are 0, no division by zero |

---

## 6. Verified test vectors

Base recipe: Honey 40, Espresso 70, Ice 100 (ice flagged), melt 25%, no caps,
no locks, `round5` off. **Port these as the first test suite.**

| Case | Honey | Espresso | Ice | Water | Total |
|---|---|---|---|---|---|
| `extra: 0` | 40 | 70 | 100 | 0 | 210 |
| `extra: 30` | 46 | 80 | 114 | 0 | 240 |
| `extra: 40` | 48 | 83 | 119 | 0 | 250 |
| `extra: 50` | 50 | 87 | 123 | 0 | 260 |
| `extra: -60` | 29 | 50 | 71 | 0 | 150 |
| `extra: 40`, honey locked | 40 | 86 | 124 | 0 | 250 |
| `extra: 40`, `round5` | 50 | 85 | 120 | 0 | 255 |
| `extra: 40`, espresso `max: 75` | 48 | 75 | 119 | 8 | 250 |

Share check on the base case: honey 29.6, espresso 51.9, ice 74.1. Across
`extra` 0 to 50 the honey share stays within 29.6–29.9, which is the whole point
of the app. Assert that drift stays under 0.5 points for any unlocked, uncapped
scaling.

Edge cases that must not throw: empty ingredient list; single locked ingredient;
target below the locked sum; one ice ingredient at 0% melt.

### How I tested it so far

Crude but effective, and worth keeping until there is a real runner:

```bash
node -e '
  const fs = require("fs");
  const h = fs.readFileSync("index.html", "utf8");
  eval(h.match(/\/\/ <compute>([\s\S]*?)\/\/ <\/compute>/)[1]);
  console.log(compute({ extra: 40, melt: 25, round5: false, ingredients: [...] }));
'
```

---

## 7. Feature inventory

Everything below works today. Treat it as the acceptance checklist for the port.

### Calculator view

- Recipe tabs across the top, one per saved drink, plus **+ New recipe**.
- Rename in a text field; the active tab's label updates live as I type.
- **Duplicate** (appends " copy", inserts after the original, fresh ids throughout)
  and **Delete** (disabled when only one recipe remains; selection falls back to
  the previous recipe).
- Ingredient rows: name, amount in ml, remove button, and three controls —
  *Keep fixed*, *Melts (ice)*, *Max __ ml*.
- **Add ingredient** appends a blank row and focuses its name field.
- Target volume set three ways, all kept in sync: quick chips
  (Original / +30 / +40 / +50), a slider (−100 to +300, step 5), and a total-ml
  number field.
- Per-recipe settings: melt percentage (0–80) and round-to-5.
- Output: a large total with a delta pill; a glass graphic whose layers are the
  ingredients, hatched for ice, with a dashed line marking the original volume;
  a per-ingredient list showing the new amount and what it was; warnings; three
  summary tiles; and a **Balance** section with a bar per ingredient showing its
  share of liquid against the original in brackets.
- **Copy recipe** writes plain text to the clipboard, falling back to a visible
  selected textarea when the clipboard API is refused.

### Hoffmann view

Five recipes behind pills. Each has one input (water in grams, or finished volume
in ml for the iced one) that rescales the amounts **and the amounts quoted inside
the step text**. Changing it must not steal focus from the field.

### Focus behaviour

This caused real bugs and must survive the port. Rendering is deliberately split:
structural re-render only when the recipe or ingredient list changes, output-only
re-render on every keystroke. Number and text fields are never written to while
they hold focus. If you move to a framework, use controlled inputs with the same
guarantee and verify by typing continuously into a name field and an amount field.

---

## 8. Design

Direction: a kitchen-scale readout. Large monospace numerals, honey amber as the
single accent, everything else quiet.

- Fonts, from Google Fonts: **Bricolage Grotesque** (display, 600/800),
  **Figtree** (body, 400/500/600), **DM Mono** (all numerals, 400/500).
- All colour goes through CSS custom properties defined in `:root`. Light is the
  base palette; dark is redefined under both
  `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`
  and `:root[data-theme="dark"]`. **Keep this structure.** A colour that only
  exists inside a dark block makes the light theme unreadable.
- Ingredient palette is `--c1` to `--c6`, cycling by index, plus `--water`.
  Ice ingredients get a diagonal hatch overlay rather than a separate colour.
- Numerals use `font-variant-numeric: tabular-nums` everywhere so digits do not
  jitter while a slider moves.
- Two-column layout collapsing to one at 860px; the glass graphic stacks at 430px.
- `prefers-reduced-motion` already disables the layer and marker transitions.

---

## 9. Hoffmann recipe data

Hardcoded today. Move it to a data file (JSON or a typed module) so adding a
recipe does not mean touching layout code. Each entry has: id, name, a short ratio
tag, one scaling input (label, default, min, max, step), a few fixed facts, a
derived amounts table, timed steps, and an optional note.

**Ultimate V60** — 60 g/L, ~3:00–3:30. Default 500 g water.
Coffee = water × 0.06. Bloom = coffee × 2.5. Medium-fine grind, water as hot as
possible. Rinse filter, well in the centre. 0:00 bloom pour, swirl. 0:45 pour to
60% of total over ~30 s. 1:15 pour to 100% over ~30 s, gentler. 1:45 stir once
each way. Let it drain a little, gentle swirl, finish around 3:00.

**Ultimate AeroPress** — 55 g/L, ~3 min. Default 200 g water.
Coffee = water × 0.055. Finer end of medium, freshly boiled (down to ~90 °C for
very dark). Standard position, no rinse, no preheat. Pour all the water at 0:00,
plunger seated 1 cm. Swirl at 2:00. Press slowly from 2:30 over ~30 s.

**Ultimate French press** — 60 g/L, ~10 min. Default 500 g water.
Coffee = water × 0.06. Medium-coarse, water at 100 °C. Pour in ~10 s, leave it.
Stir the crust at 4:00, skim the foam with two spoons, wait 5–8 min, rest the
plunger on the surface without pressing, pour gently.

**Moka pot** — about 1:10 by weight. Default 150 ml water in the base.
Coffee = water ÷ 10. Boil the water first, fill to the valve. Basket level and
loose, no tamping. Optional AeroPress filter under the top section. Medium-high
heat, lid open. At first flow drop to the lowest heat; if it runs thick and fast,
off the heat entirely. At the gurgle, lift, tilt, cool the base under the tap.

**Immersion iced coffee** — ~75 g/L, 5:30. Default 250 ml finished drink.
Coffee = total × 0.076, hot water = total × 0.66, ice = total × 0.34. Finer end of
medium, 99 °C. Preheat the brewer here, unlike his AeroPress recipe. Steep ≥5 min
(4 for darker roasts), press onto ice, stir in what is left, serve over ice.

### Caveats to keep visible in the UI

- These come from **written-up versions of his videos, not from him directly**.
  Keep the source links on the page. The V60 bloom ratio and the French press
  timings are the two I would verify against the original video first.
- The moka pot steps are for a **plain moka pot**. A Brikka's weighted valve
  behaves differently, so the app already says to treat them as a starting point.
- The 25% melt default is **my assumption**, not measured. If you ever add a
  calibration flow — weigh the drink before and after shaking — that number should
  come from measurement instead.

Sources:
- https://gist.github.com/fluency03/7fb305b8110dde5739d14697af97a99a (V60)
- https://www.hario-usa.com/blogs/recipes-and-more-from-friends/james-hoffmann-uitimate-v60-technique
- https://gist.github.com/fluency03/a494eed7504c8f2b3a162a84f3941168 (AeroPress)
- https://honestcoffeeguide.com/brew-recipes/james-hoffmann-french-press/
- https://huffingtonpost.co.uk/entry/james-hoffmann-moka-pot-coffee-routine_uk_673b1cc9e4b0ebe12e36b57d
- https://aeroprecipe.com/recipes/james-hoffman-immersion-iced-coffee

---

## 10. Decide these with me before building

Ask me, then proceed. Do not assume.

1. **Stack.** My default preference is Vite + TypeScript + vanilla DOM or Preact,
   Vitest for the maths, no CSS framework — the hand-written CSS is small and I
   like it. Tell me if you would choose differently and why, in two or three lines.
2. **Storage.** `localStorage` is fine for now, but it means my recipes live in one
   browser. Options: keep as-is; add JSON export/import; or go further. Recommend
   one, with the cost.
3. **Deploy target.** Static hosting of some kind. Say what you would use and what
   it costs me.

---

## 11. Build order

1. Scaffold the project and get it running.
2. Port `compute()` **first**, typed, as a pure module, with §6 as the test suite.
   Everything green before any UI work.
3. Port the state layer: the schema in §4, load/save, the v1 and v2 migrations.
4. Port the calculator view, then the Hoffmann view.
5. Port the CSS as-is. Only split it into files; do not restyle.
6. Set up the build and deploy.

Commit at each step with a message I can read later. Branch rather than committing
to the default branch.

---

## 12. Backlog, roughly in the order I want it

- JSON export and import of the whole recipe library, so it survives a new browser.
- Reorder ingredients by drag, or at least up/down buttons.
- Reorder and rename recipe tabs.
- Undo for delete, since there is no confirmation step today.
- Measured melt calibration, replacing the 25% guess.
- Unit toggle for grams, for anyone who does use a scale.
- Per-recipe notes field: which beans, what I changed, whether it worked.
- Print or share view for a single recipe.
- A real favicon and a PWA manifest so it installs on my phone.

## 13. Definition of done for the port

- Every vector in §6 passes as an automated test.
- Every item in §7 works, focus behaviour included.
- Light and dark both legible; nothing clipped at 390px wide.
- My existing `coffee-honey-scaler-v2` data loads without being touched by hand.
- One command runs the app locally, one builds it, one runs the tests, and the
  README says what they are.
