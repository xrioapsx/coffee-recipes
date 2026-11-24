import './styles/base.css';
import './styles/calculator.css';
import './styles/baristas.css';
import { createCalculator } from './calculator';
import { createBaristaView } from './barista-view';
import { browserStorage, load, save as saveState } from './state';
import { $ } from './util';

const storage = browserStorage();
const S = load(storage);
const save = () => saveState(storage, S);

const calculator = createCalculator(S, save);
const baristas = createBaristaView(S, save, (id, input) => {
  calculator.adopt(id, input);
  location.hash = '#calculator';
});

/** Two views routed on the URL hash: #calculator (default) and #baristas (#hoffmann still works). */
function route() {
  const hof = location.hash === '#baristas' || location.hash === '#hoffmann';
  $('view-calc').hidden = hof;
  $('view-hof').hidden = !hof;
  $('tab-calc').setAttribute('aria-current', hof ? 'false' : 'page');
  $('tab-hof').setAttribute('aria-current', hof ? 'page' : 'false');
  if (hof) baristas.render();
  else calculator.renderAll();
}

calculator.bind();
window.addEventListener('hashchange', route);
route();
