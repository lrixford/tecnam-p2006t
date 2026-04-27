import { mountStationInput } from './stationInput.js';
import { renderNomograph } from './nomograph.js';
import { renderCgEnvelope } from './cgEnvelope.js';
import { renderPrintSummary } from './dataTable.js';
import { renderSuggestCard } from './suggestCard.js';

export function mountWidget(target) {
  const el = document.createElement('section');
  el.className = 'widget p2006t';
  el.innerHTML = `
    <header class="widget__header">
      <h1>Tecnam P2006T — Weight &amp; Balance</h1>
    </header>
    <div class="widget__body">
      <div id="station-input-mount"></div>
      <div id="suggest-card-mount"></div>
      <div id="print-summary-mount"></div>
      <div id="nomograph-mount"></div>
      <div id="cg-envelope-mount" class="cg-envelope"></div>
    </div>
  `;
  target.replaceChildren(el);

  const stationMount  = el.querySelector('#station-input-mount');
  const suggestMount  = el.querySelector('#suggest-card-mount');
  const printMount    = el.querySelector('#print-summary-mount');
  const nomographMount   = el.querySelector('#nomograph-mount');
  const cgEnvelopeMount  = el.querySelector('#cg-envelope-mount');

  function refresh(state) {
    renderSuggestCard(suggestMount, state, (suggestion) => {
      const patch = {};
      if (suggestion.fuelL_gal !== undefined) patch.fuelL = { volume_gal: suggestion.fuelL_gal };
      if (suggestion.fuelR_gal !== undefined) patch.fuelR = { volume_gal: suggestion.fuelR_gal };
      if (suggestion.baggage_lb !== undefined) patch.baggage = { weight_lb: suggestion.baggage_lb };
      stationInput.patch(patch);
    });
    renderPrintSummary(printMount, state);
    renderNomograph(nomographMount, state);
    renderCgEnvelope(cgEnvelopeMount, state);
  }

  const stationInput = mountStationInput(stationMount, { onChange: refresh });

  refresh(stationInput.getState());

  return {
    destroy:  () => { stationInput.destroy(); el.remove(); },
    getState: () => stationInput.getState(),
  };
}
