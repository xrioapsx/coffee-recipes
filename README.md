# Kohi Kōbō

*Kōhī kōbō* (コーヒー工房) is Japanese for "coffee workshop".

Keep your own drinks, each with its own ingredients, and scale any of them up or
down without changing how they taste. A second tab holds reference recipes
from well-known baristas, grouped by barista: pour-over, AeroPress and
espresso drinks from James Hoffmann, Tetsu Kasuya, Scott Rao, Matt Winton and
four World AeroPress Champions.

Calculator amounts are in **ml** (measured with a jigger); the barista recipes
are in **grams**, as they give them. That mismatch is on purpose.

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
src/baristas.ts          barista recipe data, grouped by barista: add recipes here
src/barista-view.ts      "Barista recipes" view
src/styles/*.css         the original CSS, split by section
tests/                   Vitest: compute vectors, parity, state, barista data
reference/index.html     the original single-file app, kept as the behaviour reference
docs/HANDOFF.md          the full spec: data model, algorithm, test vectors, design
```

## Data

Recipes are saved in this browser's `localStorage` under
`coffee-honey-scaler-v2` (the key keeps the app's original name so existing
data still loads). Data saved by the original app at the same address
loads as-is. A different browser or domain starts empty.

## Deploy

The site is hosted on **Cloudflare Pages**, which keeps the GitHub repo private
and costs nothing. Cloudflare builds and publishes on every push to `main`.
GitHub Actions (`.github/workflows/ci.yml`) runs the tests and build on every
push and pull request.

One-time setup in the Cloudflare dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**, then authorise GitHub
   and pick `xrioapsx/coffee-recipes`. Granting access to this repo only is enough.
2. Build settings:
   - Framework preset: **None** (or Vite)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable: `NODE_VERSION` = `22`
3. **Save and Deploy.** The site appears at `https://<project-name>.pages.dev`.
