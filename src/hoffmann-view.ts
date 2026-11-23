/** "Hoffmann recipes" view. The input field is never re-rendered while typing. */
import { HOFFMANN_RECIPES, type HoffmannBuild } from './hoffmann-recipes';
import type { AppState } from './state';
import { $, num } from './util';

const rowsHtml = (b: HoffmannBuild) => b.rows.map((x) => '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td></tr>').join('');
const stepsHtml = (b: HoffmannBuild) =>
  b.steps.map((s) => '<li><span class="t">' + s[0] + '</span><span>' + s[1] + '</span></li>').join('');

export function createHoffmannView(S: AppState, save: () => void) {
  function render() {
    const c = HOFFMANN_RECIPES.filter((r) => r.id === S.hof)[0] || HOFFMANN_RECIPES[0];
    $('pills').innerHTML = HOFFMANN_RECIPES.map(
      (r) => '<button class="pill" type="button" data-id="' + r.id + '" aria-pressed="' + (r.id === c.id) + '">' + r.name + '</button>',
    ).join('');
    document.querySelectorAll<HTMLButtonElement>('.pill').forEach((b) => {
      b.addEventListener('click', () => {
        S.hof = b.dataset.id!;
        save();
        render();
      });
    });
    const w = num(S.hofInputs[c.id], c.input.def);
    const r = c.build(w);
    $('recipe').innerHTML =
      '<div class="rhead"><h2>' + c.name + '</h2><span class="tag">' + c.tag + '</span></div>' +
      '<div class="row2" style="grid-template-columns:1fr 110px"><label for="rin"><strong>' + c.input.label +
      '</strong><br><span class="hint">Change this and everything below rescales.</span></label>' +
      '<input class="num" id="rin" type="number" inputmode="decimal" min="' + c.input.min + '" max="' + c.input.max +
      '" step="' + c.input.step + '" value="' + w + '"></div>' +
      '<div class="facts">' +
      r.facts.map((f) => '<div class="fact"><div class="k">' + f[0] + '</div><div class="v">' + f[1] + '</div></div>').join('') +
      '</div>' +
      '<table class="ing2"><tbody>' + rowsHtml(r) + '</tbody></table>' +
      '<ol class="tl">' + stepsHtml(r) + '</ol>' +
      (r.note ? '<p class="hint">' + r.note + '</p>' : '');
    $('rin').addEventListener('input', (e) => {
      const v = num((e.target as HTMLInputElement).value, NaN);
      if (isFinite(v) && v > 0) {
        S.hofInputs[c.id] = v;
        save();
        const rr = c.build(v);
        // Only the amounts table and steps change; the input itself is left alone.
        $('recipe').querySelector('table.ing2 tbody')!.innerHTML = rowsHtml(rr);
        $('recipe').querySelector('ol.tl')!.innerHTML = stepsHtml(rr);
      }
    });
  }

  return { render };
}
