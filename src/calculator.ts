/**
 * "My recipes" view.
 *
 * Focus rule (HANDOFF §7): structural re-render (tabs, ingredient rows) only when the
 * recipe or ingredient list changes; output-only re-render on every keystroke. Number
 * and text fields are never written to while they hold focus.
 */
import { compute, type Ingredient, type Recipe } from './compute';
import { newIngredient, newRecipe, type AppState } from './state';
import { $, esc, num, uid } from './util';

const COLORS = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6'];
const colorOf = (i: number) => 'var(' + COLORS[i % COLORS.length] + ')';

export function createCalculator(S: AppState, save: () => void) {
  const cur = (): Recipe => S.recipes.filter((r) => r.id === S.currentId)[0] || S.recipes[0];
  const focused = (id: string) => document.activeElement === $(id);

  /* ---------- rendering ---------- */

  function renderTabs() {
    $('rtabs').innerHTML =
      S.recipes
        .map(
          (r) =>
            '<button class="rtab" type="button" data-id="' + esc(r.id) + '" aria-pressed="' +
            (r.id === S.currentId) + '">' + esc(r.name || 'Untitled') + '</button>',
        )
        .join('') + '<button class="rtab add" type="button" id="newRecipe">+ New recipe</button>';
    $('rtabs')
      .querySelectorAll<HTMLButtonElement>('.rtab[data-id]')
      .forEach((b) => {
        b.addEventListener('click', () => {
          S.currentId = b.dataset.id!;
          save();
          renderAll();
        });
      });
    $('newRecipe').addEventListener('click', () => {
      const r = newRecipe();
      S.recipes.push(r);
      S.currentId = r.id;
      save();
      renderAll();
      const name = $<HTMLInputElement>('rname');
      name.focus();
      name.select();
    });
    $('count').textContent =
      S.recipes.length + (S.recipes.length === 1 ? ' recipe' : ' recipes') + ', saved in this browser';
    $<HTMLButtonElement>('del').disabled = S.recipes.length <= 1;
  }

  function renderIngredients() {
    const r = cur();
    $('ings').innerHTML = r.ingredients
      .map(
        (g, i) =>
          '<div class="ing" data-id="' + esc(g.id) + '">' +
          '<div class="r1">' +
          '<span class="sw' + (g.ice ? ' hatch' : '') + '" style="background:' + colorOf(i) + '"></span>' +
          '<input class="txt f-name" value="' + esc(g.name) + '" aria-label="Ingredient name">' +
          '<input class="num f-ml" type="number" inputmode="decimal" min="0" step="1" value="' + g.ml +
          '" aria-label="Amount in ml for ' + esc(g.name) + '">' +
          '<button class="x f-del" type="button" aria-label="Remove ' + esc(g.name) + '">&times;</button>' +
          '</div>' +
          '<div class="r2">' +
          '<label class="check"><input type="checkbox" class="f-lock"' + (g.lock ? ' checked' : '') + '>Keep fixed</label>' +
          '<label class="check"><input type="checkbox" class="f-ice"' + (g.ice ? ' checked' : '') + '>Melts (ice)</label>' +
          '<span class="maxbox"><label>Max <input class="num f-max" type="number" inputmode="decimal" min="0" step="5" value="' +
          g.max + '"></label> ml, 0 = none</span>' +
          '</div>' +
          '</div>',
      )
      .join('');

    $('ings')
      .querySelectorAll<HTMLElement>('.ing')
      .forEach((row) => {
        const id = row.dataset.id!;
        const g = (): Ingredient | undefined => cur().ingredients.filter((x) => x.id === id)[0];
        const on = <K extends keyof HTMLElementEventMap>(
          sel: string,
          type: K,
          fn: (el: HTMLInputElement, it: Ingredient) => void,
        ) => {
          const el = row.querySelector<HTMLInputElement>(sel)!;
          el.addEventListener(type, () => {
            const it = g();
            if (it) fn(el, it);
          });
        };
        on('.f-name', 'input', (el, it) => {
          it.name = el.value;
          save();
          renderOut();
        });
        on('.f-ml', 'input', (el, it) => {
          it.ml = Math.max(0, num(el.value, 0));
          save();
          renderOut();
          syncTotals();
        });
        on('.f-max', 'input', (el, it) => {
          it.max = Math.max(0, num(el.value, 0));
          save();
          renderOut();
        });
        on('.f-lock', 'change', (el, it) => {
          it.lock = el.checked;
          save();
          renderOut();
        });
        on('.f-ice', 'change', (el, it) => {
          it.ice = el.checked;
          save();
          renderIngredients();
          renderOut();
        });
        row.querySelector('.f-del')!.addEventListener('click', () => {
          const r2 = cur();
          r2.ingredients = r2.ingredients.filter((x) => x.id !== id);
          save();
          renderIngredients();
          renderOut();
          syncTotals();
        });
      });
  }

  function renderControls() {
    const r = cur();
    if (!focused('rname')) $<HTMLInputElement>('rname').value = r.name;
    if (!focused('melt-input')) $<HTMLInputElement>('melt-input').value = String(r.melt);
    $<HTMLInputElement>('round5').checked = r.round5;
    $<HTMLInputElement>('extra-range').value = String(Math.min(Math.max(r.extra, -100), 300));
    document.querySelectorAll<HTMLButtonElement>('.chip').forEach((b) => {
      b.setAttribute('aria-pressed', String(num(b.dataset.extra, NaN) === r.extra));
    });
    syncTotals();
  }

  function syncTotals() {
    const r = cur();
    const c = compute(r);
    if (!focused('total-input')) $<HTMLInputElement>('total-input').value = String(c.baseTotal + r.extra);
  }

  function renderOut() {
    const r = cur();
    const c = compute(r);
    $('out-total').textContent = String(c.total);
    const d = c.total - c.baseTotal;
    const de = $('out-delta');
    de.textContent = d === 0 ? 'same as original' : (d > 0 ? '+' : '') + d + ' ml';
    de.className = 'delta' + (d === 0 ? ' zero' : '');
    $('out-name').textContent = (r.name || 'Untitled') + ', originally ' + c.baseTotal + ' ml';

    const scale = Math.max(200, Math.ceil((Math.max(c.total, c.baseTotal) * 1.08) / 10) * 10);
    let layers = c.ingredients
      .map((o, i) =>
        o.ml > 0
          ? '<div class="layer' + (o.ice ? ' hatch' : '') + '" style="height:' + (o.ml / scale) * 100 +
            '%;background:' + colorOf(i) + '"></div>'
          : '',
      )
      .join('');
    if (c.water > 0)
      layers += '<div class="layer" style="height:' + (c.water / scale) * 100 + '%;background:var(--water)"></div>';
    $('glass').innerHTML = layers;
    $('marker').style.bottom = (c.baseTotal / scale) * 100 + '%';
    $('marker-label').textContent = 'original ' + c.baseTotal;

    let rows = c.ingredients
      .map((o, i) => {
        const diff = o.ml - o.base;
        let note =
          r.ingredients[i] && r.ingredients[i].lock
            ? 'fixed at ' + o.base + ' ml'
            : 'was ' + o.base + ' ml (' + (diff >= 0 ? '+' : '') + diff + ')';
        if (o.capped) note += ', capped';
        return (
          '<div class="item"><span class="nm"><span class="sw' + (o.ice ? ' hatch' : '') + '" style="background:' +
          colorOf(i) + '"></span><span class="t">' + esc(o.name || 'Ingredient') + '</span></span>' +
          '<span class="val">' + o.ml + ' <small>ml</small></span><span class="was">' + note + '</span></div>'
        );
      })
      .join('');
    if (c.water > 0) {
      rows +=
        '<div class="item"><span class="nm"><span class="sw" style="background:var(--water)"></span><span class="t">Water</span></span>' +
        '<span class="val">' + c.water + ' <small>ml</small></span><span class="was">tops up what was capped</span></div>';
    }
    $('list').innerHTML = rows || '<p class="hint">No ingredients yet.</p>';

    $('warns').innerHTML = c.warn.map((w) => '<div class="warn">' + esc(w) + '</div>').join('');

    let drift = 0;
    c.ingredients.forEach((o) => {
      drift = Math.max(drift, Math.abs(o.share - o.baseShare));
    });
    $('stats').innerHTML =
      stat(
        'In the glass after shaking',
        '≈ ' + Math.round(c.liquid) + ' ml liquid',
        c.iceLeft > 0 ? '+ about ' + Math.round(c.iceLeft) + ' ml ice left' : 'no ice in this recipe',
      ) +
      stat(
        'Balance vs original',
        drift < 0.5 ? 'unchanged' : 'off by ' + drift.toFixed(1) + ' pts',
        drift < 0.5 ? 'tastes the same' : 'from fixed amounts, caps or rounding',
      ) +
      stat('Total volume', c.total + ' ml', 'original ' + c.baseTotal + ' ml');

    $('shares').innerHTML = c.ingredients
      .map(
        (o, i) =>
          '<div class="share"><span>' + esc(o.name || 'Ingredient') + '</span>' +
          '<span class="pct">' + o.share.toFixed(1) + '% <span style="color:var(--muted)">(' +
          o.baseShare.toFixed(1) + ')</span></span>' +
          '<span class="b"><i style="width:' + Math.min(100, o.share) + '%;background:' + colorOf(i) +
          '"></i></span></div>',
      )
      .join('');
  }

  function stat(k: string, v: string, n: string) {
    return '<div class="stat"><div class="k">' + k + '</div><div class="v">' + v + '</div><div class="n">' + n + '</div></div>';
  }

  function renderAll() {
    renderTabs();
    renderIngredients();
    renderControls();
    renderOut();
  }

  function recipeText(): string {
    const r = cur();
    const c = compute(r);
    const d = c.total - c.baseTotal;
    const lines = [(r.name || 'Untitled') + ' — ' + c.total + ' ml (' + (d >= 0 ? '+' : '') + d + ' ml vs original)'];
    c.ingredients.forEach((o) => lines.push(o.name + ': ' + o.ml + ' ml'));
    if (c.water > 0) lines.push('Water: ' + c.water + ' ml');
    lines.push('Shake with ice, then strain.');
    return lines.join('\n');
  }

  /* ---------- static controls, bound once ---------- */

  function bind() {
    $<HTMLInputElement>('rname').addEventListener('input', (e) => {
      const v = (e.target as HTMLInputElement).value;
      cur().name = v;
      save();
      const tab = $('rtabs').querySelector('.rtab[data-id="' + CSS.escape(cur().id) + '"]');
      if (tab) tab.textContent = v || 'Untitled';
      renderOut();
    });
    $('dup').addEventListener('click', () => {
      const r = cur();
      const copy: Recipe = JSON.parse(JSON.stringify(r));
      copy.id = uid();
      copy.name = r.name + ' copy';
      copy.ingredients.forEach((g) => {
        g.id = uid();
      });
      S.recipes.splice(S.recipes.indexOf(r) + 1, 0, copy);
      S.currentId = copy.id;
      save();
      renderAll();
    });
    $('del').addEventListener('click', () => {
      if (S.recipes.length <= 1) return;
      const r = cur();
      const i = S.recipes.indexOf(r);
      S.recipes.splice(i, 1);
      S.currentId = S.recipes[Math.max(0, i - 1)].id;
      save();
      renderAll();
    });
    $('addIng').addEventListener('click', () => {
      cur().ingredients.push(newIngredient());
      save();
      renderIngredients();
      renderOut();
      const rows = $('ings').querySelectorAll('.ing');
      const last = rows[rows.length - 1];
      if (last) {
        const f = last.querySelector<HTMLInputElement>('.f-name')!;
        f.focus();
        f.select();
      }
    });
    document.querySelectorAll<HTMLButtonElement>('.chip').forEach((b) => {
      b.addEventListener('click', () => {
        cur().extra = num(b.dataset.extra, 0);
        save();
        renderControls();
        renderOut();
      });
    });
    $('extra-range').addEventListener('input', (e) => {
      cur().extra = num((e.target as HTMLInputElement).value, 0);
      save();
      renderControls();
      renderOut();
    });
    $('total-input').addEventListener('input', (e) => {
      const t = num((e.target as HTMLInputElement).value, NaN);
      if (isFinite(t)) {
        const r = cur();
        r.extra = Math.round(t - compute(r).baseTotal);
        save();
        renderControls();
        renderOut();
      }
    });
    $('melt-input').addEventListener('input', (e) => {
      cur().melt = Math.min(80, Math.max(0, num((e.target as HTMLInputElement).value, 0)));
      save();
      renderOut();
    });
    $('round5').addEventListener('change', (e) => {
      cur().round5 = (e.target as HTMLInputElement).checked;
      save();
      renderOut();
    });
    $('copy').addEventListener('click', () => {
      const text = recipeText();
      const status = $('copy-status');
      const box = $<HTMLTextAreaElement>('copybox');
      const fallback = () => {
        box.hidden = false;
        box.value = text;
        box.focus();
        box.select();
        status.textContent = 'Copy was blocked here. The text is selected below, so press your copy shortcut.';
      };
      try {
        navigator.clipboard.writeText(text).then(() => {
          box.hidden = true;
          status.textContent = 'Copied.';
        }, fallback);
      } catch {
        fallback();
      }
    });
  }

  return { bind, renderAll };
}
