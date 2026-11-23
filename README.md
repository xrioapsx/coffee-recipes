# Coffee Honey Scaler

Keep your own drinks, each with its own ingredients, and scale any of them up or
down without changing how they taste. A second tab holds James Hoffmann's
reference brew recipes.

Calculator amounts are in **ml** (measured with a jigger); the Hoffmann recipes
are in **grams**, as he gives them. That mismatch is on purpose.

## Commands

You need Node 22 or newer.

| What | Command |
|---|---|
| Install dependencies (once) | `npm install` |
| Run locally at http://localhost:5173 | `npm run dev` |
| Run the tests | `npm test` |
| Build to `dist/` | `npm run build` |
| Serve the built `dist/` | `npm run preview` |

## Layout

```
index.html               markup (from the original single-file app)
src/compute.ts           the scaling algorithm, a pure function
src/state.ts             schema, load/save, v1 → v2 migration
src/calculator.ts        "My recipes" view
src/hoffmann-recipes.ts  Hoffmann recipe data: add recipes here
src/hoffmann-view.ts     "Hoffmann recipes" view
src/styles/*.css         the original CSS, split by section
tests/                   Vitest: compute vectors, parity, state
reference/index.html     the original single-file app, kept as the behaviour reference
docs/HANDOFF.md          the full spec: data model, algorithm, test vectors, design
```

## Data

Recipes are saved in this browser's `localStorage` under
`coffee-honey-scaler-v2`. Data saved by the original app at the same address
loads as-is. A different browser or domain starts empty.

## Deploy

`.github/workflows/deploy.yml` runs the tests, builds and publishes to GitHub
Pages on every push to `main`. One-time setup: push the repo to GitHub, then in
**Settings → Pages** set **Source** to **GitHub Actions**.
