import './styles/base.css';
import './styles/calculator.css';
import './styles/hoffmann.css';
import { createCalculator } from './calculator';
import { createHoffmannView } from './hoffmann-view';
import { browserStorage, load, save as saveState } from './state';
import { $ } from './util';

const storage = browserStorage();
const S = load(storage);
const save = () => saveState(storage, S);

const calculator = createCalculator(S, save);
const hoffmann = createHoffmannView(S, save);

/** Two views routed on the URL hash: #calculator (default) and #hoffmann. */
function route() {
  const hof = location.hash === '#hoffmann';
  $('view-calc').hidden = hof;
  $('view-hof').hidden = !hof;
  $('tab-calc').setAttribute('aria-current', hof ? 'false' : 'page');
  $('tab-hof').setAttribute('aria-current', hof ? 'page' : 'false');
  if (hof) hoffmann.render();
  else calculator.renderAll();
}

calculator.bind();
window.addEventListener('hashchange', route);
route();
