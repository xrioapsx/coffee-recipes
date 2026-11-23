/**
 * "Barista recipes" view: one tab per barista, then that barista's recipes.
 * The recipe input field is never re-rendered while typing.
 */
import { BARISTAS, baristaOf, type BrewBuild } from './baristas';
import type { AppState } from './state';
import { $, esc, num } from './util';

const rowsHtml = (b: BrewBuild) => b.rows.map((x) => '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td></tr>').join('');
const stepsHtml = (b: BrewBuild) =>
  b.steps.map((s) => '<li><span class="t">' + s[0] + '</span><span>' + s[1] + '</span></li>').join('');

export function createBaristaView(S: AppState, save: () => void) {
  function render() {
    // The saved selection is a recipe id; the barista is whoever owns it.
    const barista = baristaOf(S.hof);
    const c = barista.recipes.find((r) => r.id === S.hof) || barista.recipes[0];

    $('baristas').innerHTML = BARISTAS.map(
      (b) =>
        '<button class="barista" type="button" data-id="' + b.id + '" aria-pressed="' + (b.id === barista.id) + '">' +
        '<span class="bn">' + esc(b.name) + '</span><span class="bt">' + esc(b.title) + '</span></button>',
    ).join('');
    $('baristas')
      .querySelectorAll<HTMLButtonElement>('.barista')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const b = BARISTAS.find((x) => x.id === btn.dataset.id)!;
          if (b.id === barista.id) return;
          S.hof = b.recipes[0].id;
          save();
          render();
        });
      });

    $('barista-intro').innerHTML = barista.intro
      .map((p) => '<p>' + (p.lead ? '<strong>' + esc(p.lead) + '</strong> ' : '') + esc(p.text) + '</p>')
      .join('');

    // With only one recipe the pill row would be noise, so hide it.
    $('pills').hidden = barista.recipes.length < 2;
    $('pills').innerHTML = barista.recipes
      .map(
        (r) =>
          '<button class="pill" type="button" data-id="' + r.id + '" aria-pressed="' + (r.id === c.id) + '">' + esc(r.name) + '</button>',
      )
      .join('');
    $('pills')
      .querySelectorAll<HTMLButtonElement>('.pill')
      .forEach((b) => {
        b.addEventListener('click', () => {
          S.hof = b.dataset.id!;
          save();
          render();
        });
      });

    const w = num(S.hofInputs[c.id], c.input.def);
    const r = c.build(w);
    $('recipe').innerHTML =
      '<div class="rhead"><h2>' + esc(c.name) + '</h2><span class="tag">' + esc(c.tag) + '</span></div>' +
      '<div class="row2" style="grid-template-columns:1fr 110px"><label for="rin"><strong>' + c.input.label +
      '</strong><br><span class="hint">Change this and everything below rescales.</span></label>' +
      '<input class="num" id="rin" type="number" inputmode="decimal" min="' + c.input.min + '" max="' + c.input.max +
      '" step="' + c.input.step + '" value="' + w + '"></div>' +
      '<div class="facts">' +
      r.facts.map((f) => '<div class="fact"><div class="k">' + f[0] + '</div><div class="v">' + f[1] + '</div></div>').join('') +
      '</div>' +
      '<table class="ing2"><tbody id="r-rows">' + rowsHtml(r) + '</tbody></table>' +
      '<ol class="tl" id="r-steps">' + stepsHtml(r) + '</ol>' +
      (r.note ? '<p class="hint">' + r.note + '</p>' : '') +
      (r.sub || [])
        .map(
          (s) =>
            '<div class="makeahead"><h3>Make ahead: ' + esc(s.title) + '</h3>' +
            '<table class="ing2"><tbody>' + s.rows.map((x) => '<tr><td>' + x[0] + '</td><td>' + x[1] + '</td></tr>').join('') + '</tbody></table>' +
            '<ol class="steps">' + s.steps.map((t) => '<li>' + t + '</li>').join('') + '</ol></div>',
        )
        .join('');
    $('rin').addEventListener('input', (e) => {
      const v = num((e.target as HTMLInputElement).value, NaN);
      if (isFinite(v) && v > 0) {
        S.hofInputs[c.id] = v;
        save();
        const rr = c.build(v);
        // Only the amounts table and steps change; the input itself is left alone.
        $('r-rows').innerHTML = rowsHtml(rr);
        $('r-steps').innerHTML = stepsHtml(rr);
      }
    });

    $('sources').innerHTML =
      '<strong>Where these numbers come from.</strong> ' + esc(barista.sourceNote) +
      '<ul>' +
      barista.sources
        .map((s) => '<li><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a></li>')
        .join('') +
      '</ul>';
  }

  return { render };
}
