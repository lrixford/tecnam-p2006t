import { suggest } from './suggest.js';
import { lbToKg, galToL, formatNumber } from './units.js';

const ISSUE_TEXT = {
  'forward-cg': 'CG is too far forward at takeoff and landing.',
  'aft-cg':     'CG is too far aft at takeoff.',
  'over-mtow':  'Aircraft is over maximum takeoff weight.',
};

export function renderSuggestCard(target, state, onApply) {
  const s = suggest(state);

  if (s.status === 'ok') {
    target.replaceChildren();
    return;
  }

  const card = document.createElement('div');
  card.className = `suggest-card suggest-card--${s.status === 'impossible' ? 'error' : 'warn'}`;

  if (s.status === 'impossible') {
    card.innerHTML = `
      <div class="suggest-card__row">
        <span>✗ <strong>No W&amp;B Solution</strong> — ${s.reason}</span>
      </div>
    `;
  } else {
    const fuelLine = `Load <strong>${formatNumber(s.fuelL_gal, 1)} gal per tank</strong>`
      + ` (${formatNumber(s.total_gal, 1)} gal / ${formatNumber(galToL(s.total_gal), 0)} L total)`;

    const baggageLine = s.baggage_lb !== undefined
      ? ` and add <strong>${formatNumber(s.baggage_delta_lb, 0)} lb (${formatNumber(lbToKg(s.baggage_delta_lb), 0)} kg)</strong> baggage (${formatNumber(s.baggage_lb, 0)} lb total)`
      : '';

    card.innerHTML = `
      <div class="suggest-card__row">
        <span class="suggest-card__title">⚠ <strong>W&amp;B Advisory</strong> — ${ISSUE_TEXT[s.issue] ?? s.issue}</span>
        <span class="suggest-card__actions">
          <span class="suggest-card__items">${fuelLine}${baggageLine}</span>
          <button class="suggest-card__apply" type="button">Apply Suggestion</button>
        </span>
      </div>
    `;

    card.querySelector('.suggest-card__apply').addEventListener('click', () => onApply(s));
  }

  target.replaceChildren(card);
}
