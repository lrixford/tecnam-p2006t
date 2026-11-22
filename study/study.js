import { GROUPS, DECKS } from './cards.js';
import { QUIZ } from './quiz.js';
import { DIAGRAMS } from './diagrams.js';

const STORE_KEY = 'p2006t-study:v1';
const SWIPE_DISTANCE = 90;
const MASTER_AT = 3; // correct quiz answers, net of misses, that master a question
const QUIZ_LENGTH = 20; // most questions in one quiz
const DOUBLE_TAP_MS = 320;
const CARD_MIN_REM = 15; // shortest a flashcard gets, however little is on it

const ALL = DECKS.flatMap((deck) => deck.cards.map((card) => ({ ...card, deck })));
const BY_ID = new Map(ALL.map((c) => [c.id, c]));
const app = document.getElementById('app');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- saved progress ---------- */

function loadStore() {
  const fresh = { v: 1, cards: {}, opts: { inOrder: false, answerFirst: false, mei: true }, session: null, quiz: null };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY));
    if (parsed && parsed.v === 1) {
      return { ...fresh, ...parsed, opts: { ...fresh.opts, ...parsed.opts }, cards: parsed.cards || {} };
    }
  } catch {
    /* unreadable or blocked storage: start fresh */
  }
  return fresh;
}

const store = loadStore();
let storageOk = true;

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}
save();

const statusOf = (id) => store.cards[id]?.s || 'new';
const isStarred = (id) => !!store.cards[id]?.star;
const masteryOf = (id) => Math.max(0, Math.min(MASTER_AT, store.cards[id]?.m | 0));
const isMastered = (id) => masteryOf(id) >= MASTER_AT;

/* Instructor-only decks can be switched off; their cards then sit out of every run, list and count. */
const isInPlay = (card) => store.opts.mei || !card.deck.mei;
const inPlay = () => ALL.filter(isInPlay);

/* What the progress bars show: mastery outranks the flashcard sort. */
const levelOf = (id) => (isMastered(id) ? 'master' : statusOf(id));

function tally(cards) {
  const t = { master: 0, know: 0, learn: 0, new: 0, total: cards.length };
  for (const c of cards) t[levelOf(c.id)]++;
  return t;
}

const LEVEL_LABEL = { master: 'Mastered', know: 'Known', learn: 'Still learning', new: 'Not seen' };

/* ---------- text helpers ---------- */

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const fmt = (s) =>
  esc(s)
    .replace(/\bV_([A-Z0-9]+)/g, 'V<sub>$1</sub>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

const plain = (s) => String(s).replace(/\bV_([A-Z0-9]+)/g, 'V$1').replace(/\*\*/g, '');

/* One checklist line. "Item: action" is set as the item, a dot leader and the
   action at the right; a line with no action is set as a plain sentence. */
function checkHTML(text) {
  const at = text.indexOf(': ');
  if (at < 0) return `<span class="chk__item">${fmt(text)}</span>`;
  return `<span class="chk__item">${fmt(text.slice(0, at))}</span><span class="chk__dots" aria-hidden="true"></span><span class="visually-hidden">: </span><span class="chk__act">${fmt(text.slice(at + 2)).replace(/\*$/, '<span class="chk__star">*</span>')}</span>`;
}

const checklistHTML = (steps, cls = '') =>
  `<ol class="checklist${cls}">${steps.map((s) => `<li><span class="chk">${checkHTML(s)}</span></li>`).join('')}</ol>`;

function answerHTML(card) {
  let html = '';
  if (card.a) html += card.a.split('\n\n').map((p) => `<p>${fmt(p)}</p>`).join('');
  if (card.steps) html += checklistHTML(card.steps);
  if (card.bullets) html += `<ul>${card.bullets.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul>`;
  return html;
}

const whyHTML = (card) =>
  card.why
    ? `<div class="why"><p class="why__label">Why</p><ul>${card.why.map((line) => `<li>${fmt(line)}</li>`).join('')}</ul></div>`
    : '';

/* The deck's answers as a reference table, with this card's cell marked. */
function deckTableHTML(card) {
  const ROWS = 5;
  const cards = card.deck.cards;
  const cols = Math.ceil(cards.length / ROWS);
  let rows = '';
  for (let r = 0; r < ROWS; r++) {
    let cells = '';
    for (let c = 0; c < cols; c++) {
      const item = cards[c * ROWS + r];
      if (!item) {
        cells += '<th></th><td></td>';
        continue;
      }
      const here = item.id === card.id ? ' class="is-here"' : '';
      const line = item.id === 'vs.vmc' ? ' data-line="red"' : item.id === 'vs.vyse' ? ' data-line="blue"' : '';
      cells += `<th scope="row"${here}${line}>${fmt(item.label || item.q)}</th><td${here}>${fmt(item.a.replace(/ kt$/, ''))}</td>`;
    }
    rows += `<tr>${cells}</tr>`;
  }
  return `<table class="reftable"><caption>${fmt(card.deck.title)}, ${fmt(card.deck.blurb.toLowerCase())}</caption><tbody>${rows}</tbody></table>`;
}

/* The V_MC factors as one table in COMBATS order, with this card's row marked. */
function factorTableHTML(card) {
  const cards = card.deck.cards;
  const arrow = (text, word) => {
    const dir = new RegExp(`${word} goes \\*\\*(up|down)`).exec(text)?.[1];
    return dir === 'up' ? '<span aria-hidden="true">▲</span> Up' : '<span aria-hidden="true">▼</span> Down';
  };
  const rows = cards
    .map((item, i) => {
      const first = i === 0 || cards[i - 1].letter !== item.letter;
      const span = cards.filter((c) => c.letter === item.letter).length;
      const letter = first ? `<th scope="rowgroup" rowspan="${span}" class="reftable__letter">${item.letter}</th>` : '';
      const here = item.id === card.id ? ' class="is-here"' : '';
      return `<tr>${letter}<th scope="row"${here}>${fmt(item.label)}</th><td${here}>${arrow(item.a, 'V_MC')}</td><td${here}>${arrow(item.a, 'Performance')}</td></tr>`;
    })
    .join('');
  return `<table class="reftable reftable--factors">
    <caption>${fmt('Each COMBATS condition raises both, with two exceptions: the bank lowers V_MC, and the windmilling propeller lowers performance. The opposite of a condition flips both arrows.')}</caption>
    <thead><tr><th scope="col"><span class="visually-hidden">COMBATS</span></th><th scope="col">Factor</th><th scope="col">${fmt('V_MC')}</th><th scope="col">Performance</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* Propeller governor: one row per case, built from the cards that carry a row. */
function governorTableHTML(card) {
  const arrow = (dir) => `<span aria-hidden="true">${dir === 'up' ? '▲' : '▼'}</span><span class="visually-hidden">${dir}</span>`;
  const rows = card.deck.cards
    .filter((item) => item.governor)
    .map((item) => {
      const here = item.id === card.id ? ' class="is-here"' : '';
      const cells = item.governor.map((cell, i) => `<td${here}>${i < 3 ? esc(cell) : arrow(cell)}</td>`).join('');
      return `<tr><th scope="row"${here}>${fmt(item.label)}</th>${cells}</tr>`;
    })
    .join('');
  return `<table class="reftable reftable--factors reftable--governor">
    <caption>In a climb or dive the lever has not moved: the governor is bringing RPM back to where it was set.</caption>
    <thead><tr><th scope="col"><span class="visually-hidden">Case</span></th><th scope="col">Spring</th><th scope="col">Fly&shy;weights</th><th scope="col">Pilot valve</th><th scope="col">Oil press.</th><th scope="col">Blade angle</th><th scope="col">RPM</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

/* Drawings for a card: `figure` goes with the question, `diagram` with the answer. */
function drawingsHTML(keys) {
  return []
    .concat(keys || [])
    .map((key) => DIAGRAMS[key])
    .filter(Boolean)
    .map((d) => `<figure class="diagram">${d.svg}<figcaption>${fmt(d.caption)}</figcaption></figure>`)
    .join('');
}

function answerSize(card) {
  if (card.steps) return card.steps.length > 7 ? 'sm' : 'md';
  const len = (card.a || '').length + (card.bullets || []).join(' ').length;
  if (len <= 18 && !card.bullets) return 'xl';
  if (len <= 110) return 'lg';
  if (len <= 320) return 'md';
  return 'sm';
}

const searchText = (card) =>
  plain([card.q, card.hint, card.a, ...(card.steps || []), ...(card.bullets || []), ...(card.why || []), card.note].filter(Boolean).join(' ')).toLowerCase();

function shuffled(list) {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const pipsHTML = (n) =>
  `<span class="pips" aria-hidden="true">${Array.from({ length: MASTER_AT }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

/* ---------- scopes: what a study run or quiz covers ---------- */

function scope(key) {
  const cards = inPlay();
  if (key === 'all') return { title: 'All cards', cards };
  if (key === 'learning') return { title: 'Still learning', cards: cards.filter((c) => statusOf(c.id) === 'learn') };
  if (key === 'starred') return { title: 'Starred', cards: cards.filter((c) => isStarred(c.id)) };
  if (key.startsWith('group-')) {
    const group = GROUPS.find((g) => g.id === key.slice(6));
    return group ? { title: group.title, cards: cards.filter((c) => c.deck.group === group.id) } : null;
  }
  const deck = DECKS.find((d) => d.id === key);
  return deck && (store.opts.mei || !deck.mei) ? { title: deck.title, cards: cards.filter((c) => c.deck === deck) } : null;
}

/* Take cards that are no longer in play out of the flashcard run and quiz in progress. */
function dropOutOfPlay() {
  const stays = (id) => BY_ID.has(id) && isInPlay(BY_ID.get(id));
  const s = store.session;
  if (s && Array.isArray(s.order)) {
    const i = s.order.slice(0, s.i).filter(stays).length;
    const order = s.order.filter(stays);
    store.session = order.length ? { ...s, order, i } : null;
    history = [];
  }
  const q = store.quiz;
  if (q && Array.isArray(q.ids)) {
    // Questions already answered keep their place in the results.
    const ids = q.ids.filter((id, n) => n < q.results.length || stays(id));
    store.quiz = ids.length ? { ...q, ids } : null;
    quizView = null;
  }
}

/* ---------- flashcard sessions ---------- */

let history = [];
let busy = false;

function startSession(key, ids) {
  const order = ids || scope(key).cards.map((c) => c.id);
  // Runs are shuffled unless the reader turns shuffle off.
  store.session = { key, order: store.opts.inOrder ? order : shuffled(order), i: 0 };
  history = [];
  save();
}

function currentSession(key) {
  const s = store.session;
  if (s && s.key === key && Array.isArray(s.order)) {
    s.order = s.order.filter((id) => BY_ID.has(id));
    s.i = Math.min(Math.max(0, s.i | 0), s.order.length);
    if (s.order.length) return s;
  }
  startSession(key);
  return store.session;
}

/* ---------- shared pieces ---------- */

const ICON = {
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"/></svg>',
  shuffle:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h3.5c4.5 0 6 10 10.5 10H21M3 17h3.5c1.6 0 2.8-1.2 3.8-2.8M21 7h-4c-1.6 0-2.8 1.2-3.8 2.8M18 4l3 3-3 3M18 14l3 3-3 3"/></svg>',
  swap: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4L3.5 7.5 7 11M3.5 7.5H17M17 13l3.5 3.5L17 20M20.5 16.5H7"/></svg>',
  undo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5L4 9l4 4M4 9h10a6 6 0 010 12h-3"/></svg>',
  grip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14.500l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.500l6 6 6-6"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.05 5.850L12 16.850 6.750 19.650 7.8 13.8 3.5 9.7l5.9-.8z"/></svg>',
};

function tapeHTML(levels, current = -1) {
  const dense = levels.length > 60 ? ' tape--dense' : '';
  const ticks = levels.map((lv, i) => `<i class="tick tick--${lv}${i === current ? ' tick--here' : ''}"></i>`).join('');
  return `<div class="tape${dense}" aria-hidden="true">${ticks}</div>`;
}

const cardTape = (ids, current) => tapeHTML(ids.map(levelOf), current);

function meterHTML(t) {
  const seg = (name) => `<i class="meter__${name}" style="width:${((t[name] / t.total) * 100).toFixed(2)}%"></i>`;
  return `<span class="meter" aria-hidden="true">${seg('master')}${seg('know')}${seg('learn')}</span>`;
}

function countText(t) {
  const parts = [];
  if (t.master) parts.push(`${t.master} mastered`);
  if (t.know) parts.push(`${t.know} known`);
  if (t.learn) parts.push(`${t.learn} still learning`);
  return parts.length ? `${t.total} cards: ${parts.join(', ')}` : `${t.total} cards`;
}

const storageNotice = () =>
  storageOk
    ? ''
    : '<p class="notice" role="status">This browser is blocking storage, so progress will be lost when you close the page. Private browsing is the usual cause.</p>';

/* ---------- home ---------- */

function renderHome() {
  document.title = 'Multi-engine study cards';
  const cards = inPlay();
  const total = tally(cards);
  const starred = cards.filter((c) => isStarred(c.id)).length;

  const resumes = [];
  const s = store.session;
  if (s && s.i > 0 && s.i < s.order.length && scope(s.key)) {
    resumes.push(
      `<a class="btn" href="#/study/${esc(s.key)}">Resume ${fmt(scope(s.key).title)}, card ${s.i + 1} of ${s.order.length}</a>`,
    );
  }
  const q = store.quiz;
  if (q && q.results.length && q.results.length < q.ids.length && scope(q.key)) {
    resumes.push(
      `<a class="btn" href="#/quiz/${esc(q.key)}">Resume quiz, question ${q.results.length + 1} of ${q.ids.length}</a>`,
    );
  }

  const groups = GROUPS.map((group) => {
    const rows = DECKS.filter((d) => d.group === group.id)
      .map((deck) => {
        const t = tally(ALL.filter((c) => c.deck === deck));
        const name = esc(plain(deck.title));
        const include = deck.mei
          ? `<button class="switch" role="switch" data-action="include-mei" aria-checked="${store.opts.mei}" aria-label="Include the ${name} cards"><span class="switch__track" aria-hidden="true"></span>Include</button>`
          : '';
        if (deck.mei && !store.opts.mei) {
          return `
        <li class="deck deck--off">
          <div class="deck__info">
            <h3 class="deck__title">${fmt(deck.title)} <span class="tag">Instructor</span></h3>
            <p class="deck__blurb">Left out of study runs, quizzes, lists and counts. Saved progress on these ${t.total} cards is kept.</p>
          </div>
          <div class="deck__actions">${include}</div>
        </li>`;
        }
        return `
        <li class="deck">
          <div class="deck__info">
            <h3 class="deck__title">${fmt(deck.title)}${deck.mei ? ' <span class="tag">Instructor</span>' : ''}</h3>
            ${deck.blurb ? `<p class="deck__blurb">${fmt(deck.blurb)}</p>` : ''}
            ${meterHTML(t)}
            <p class="deck__count">${countText(t)}</p>
          </div>
          <div class="deck__actions">
            ${include}
            <a class="btn btn--small btn--study" href="#/study/${deck.id}" aria-label="Study ${name}">Study</a>
            <a class="btn btn--small" href="#/quiz/${deck.id}" aria-label="Take the ${name} quiz">Quiz</a>
            <a class="btn btn--small btn--quiet" href="#/browse/${deck.id}" aria-label="List the ${name} cards">List</a>
          </div>
        </li>`;
      })
      .join('');
    const gt = tally(cards.filter((c) => c.deck.group === group.id));
    return `
    <section class="group">
      <header class="group__head">
        <div>
          <h2>${esc(group.title)}</h2>
          <p class="group__count">${countText(gt)}</p>
        </div>
        <div class="group__actions">
          <a class="btn btn--small btn--study" href="#/study/group-${group.id}" aria-label="Study all of ${esc(group.title)}">Study</a>
          <a class="btn btn--small" href="#/quiz/group-${group.id}" aria-label="Take a quiz on ${esc(group.title)}">Quiz</a>
        </div>
      </header>
      <ul class="decks">${rows}</ul>
    </section>`;
  }).join('');

  const stat = (level) =>
    `<div class="stat stat--${level}"><dt><span class="key key--${level}"></span>${LEVEL_LABEL[level]}</dt><dd>${total[level]}</dd></div>`;

  app.innerHTML = `
  <div class="home">
    <header class="masthead">
      <a class="crumb" href="../">Weight and balance calculator</a>
      <h1>Multi-engine study cards</h1>
      <p class="lede">Tecnam P2006T systems and multi-engine aerodynamics${store.opts.mei ? ', with the instructor-only questions' : ''}. Flip through the cards, then take the quiz. Progress saves in this browser.</p>
    </header>
    ${storageNotice()}
    <section class="overview" aria-label="Overall progress">
      <dl class="stats">${stat('master')}${stat('know')}${stat('learn')}${stat('new')}</dl>
      ${cardTape(cards.map((c) => c.id))}
      <p class="overview__how">Answer a question right ${MASTER_AT} times in quizzes to master it. A wrong answer takes one back.</p>
      <div class="actions">
        <a class="btn btn--primary" href="#/study/all">Study all ${total.total} cards</a>
        <a class="btn btn--quiz" href="#/quiz/all">Take a quiz</a>
        ${resumes.join('')}
        ${total.learn ? `<a class="btn" href="#/study/learning">Review ${total.learn} still learning</a>` : ''}
        ${starred ? `<a class="btn" href="#/study/starred">Study ${starred} starred</a>` : ''}
        <a class="btn btn--quiet" href="#/browse/all">Search all cards</a>
        <a class="btn btn--quiet" href="kneeboard.html">Print kneeboard checklists</a>
      </div>
    </section>
    ${groups}
    <footer class="foot">
      <p>Cards with a note flag an answer worth checking. The "Why" explanations and the wrong choices in quizzes are study aids. The POH and your instructor have the final word.</p>
      <button class="btn btn--quiet btn--danger" data-action="reset">Erase saved progress</button>
    </footer>
  </div>`;
}

/* ---------- flashcards ---------- */

function faceHTML(card, side) {
  const level = levelOf(card.id);
  const chip = level === 'new' ? '' : `<span class="chip chip--${level}">${LEVEL_LABEL[level]}</span>`;
  if (side === 'q') {
    return `
      <div class="face__top"><span>${fmt(card.deck.title)}</span>${chip}</div>
      <div class="face__body"><div class="face__content">
        <p class="prompt prompt--${card.figure ? 'sm' : card.q.length <= 16 ? 'xl' : card.q.length <= 70 ? 'lg' : 'md'}">${fmt(card.q)}</p>
        ${card.hint ? `<p class="hint">${fmt(card.hint)}</p>` : ''}
        ${drawingsHTML(card.figure)}
      </div></div>`;
  }
  return `
      <div class="face__top face__top--q"><span>${fmt(card.q)}</span></div>
      <div class="face__body"><div class="face__content">
        <div class="answer answer--${answerSize(card)}">${answerHTML(card)}</div>
        ${card.deck.table === 'factors' ? factorTableHTML(card) : card.deck.table ? deckTableHTML(card) : ''}
        ${card.governor ? governorTableHTML(card) : ''}
        ${drawingsHTML(card.figure)}${drawingsHTML(card.diagram)}
        ${whyHTML(card)}
        ${card.note ? `<p class="note">${fmt(card.note)}</p>` : ''}
      </div></div>`;
}

function renderStudy(key) {
  const info = scope(key);
  if (!info) return go('#/');
  document.title = `${plain(info.title)} | Study cards`;

  if (!info.cards.length && !(store.session?.key === key && store.session.order.length)) {
    const why =
      key === 'learning'
        ? 'No cards are marked still learning. Mark a card "Still learning" while you study and it shows up here.'
        : 'No cards are starred. Tap the star while you study to collect the ones you want to drill.';
    app.innerHTML = `
      <div class="study study--empty">
        <header class="bar"><a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a><div class="bar__title"><span>${esc(info.title)}</span></div></header>
        <div class="finish"><h1>Nothing to study here yet</h1><p>${why}</p><div class="actions"><a class="btn btn--primary" href="#/study/all">Study all cards</a><a class="btn" href="#/">Back to decks</a></div></div>
      </div>`;
    return;
  }

  const s = currentSession(key);
  if (s.i >= s.order.length) return renderFinish(key, info, s);

  const card = BY_ID.get(s.order[s.i]);
  const [front, back] = store.opts.answerFirst ? ['a', 'q'] : ['q', 'a'];
  const starred = isStarred(card.id);

  app.innerHTML = `
  <div class="study">
    <header class="bar">
      <a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a>
      <div class="bar__title"><span>${fmt(info.title)}</span><span class="bar__count">${s.i + 1} of ${s.order.length}</span></div>
      <button class="iconbtn" data-action="answer-first" aria-pressed="${store.opts.answerFirst}" aria-label="Show answers first" title="Show answers first">${ICON.swap}</button>
      <button class="iconbtn" data-action="shuffle" aria-pressed="${!store.opts.inOrder}" aria-label="Shuffle" title="Shuffle">${ICON.shuffle}</button>
    </header>
    ${cardTape(s.order, s.i)}
    ${storageNotice()}
    <main class="stage">
      <div class="card" id="card" role="button" tabindex="0" aria-label="Flashcard. Press space to flip.">
        <div class="card__inner">
          <div class="face face--front">${faceHTML(card, front)}<p class="face__foot">Tap to flip, swipe to sort</p></div>
          <div class="face face--back" aria-hidden="true">${faceHTML(card, back)}</div>
        </div>
        <span class="stamp stamp--learn" aria-hidden="true">Still learning</span>
        <span class="stamp stamp--know" aria-hidden="true">Know it</span>
      </div>
    </main>
    <footer class="controls">
      <button class="mark mark--learn" data-action="learn">Still learning</button>
      <button class="iconbtn" data-action="undo" aria-label="Go back one card" title="Go back one card" ${s.i === 0 ? 'disabled' : ''}>${ICON.undo}</button>
      <button class="iconbtn iconbtn--star" data-action="star" aria-pressed="${starred}" aria-label="Star this card" title="Star this card">${ICON.star}</button>
      <button class="mark mark--know" data-action="know">Know it</button>
    </footer>
  </div>`;

  attachCard(document.getElementById('card'));
  fitCard({ instant: true });

  // The first card of the day shows how swiping sorts it.
  if (store.hintSeen !== today()) playHint(document.getElementById('card'));
}

function renderFinish(key, info, s) {
  const cards = s.order.map((id) => BY_ID.get(id));
  const known = cards.filter((c) => statusOf(c.id) === 'know').length;
  const learn = cards.filter((c) => statusOf(c.id) === 'learn').length;
  const allKnown = known === cards.length;
  app.innerHTML = `
  <div class="study study--done">
    <header class="bar"><a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a><div class="bar__title"><span>${fmt(info.title)}</span><span class="bar__count">Done</span></div></header>
    ${cardTape(s.order)}
    <div class="finish">
      <h1>${allKnown ? `All ${cards.length} known` : `${known} of ${cards.length} known`}</h1>
      <p>${allKnown ? 'Every card in this run is marked known. The quiz is how you master them.' : `${learn} ${learn === 1 ? 'card is' : 'cards are'} still learning. Review until the red is gone.`}</p>
      <div class="actions">
        ${learn ? `<button class="btn btn--primary" data-action="review-missed">Review ${learn} still learning</button>` : ''}
        <a class="btn ${learn ? 'btn--quiz' : 'btn--primary'}" href="#/quiz/${esc(key)}">Take the quiz</a>
        <button class="btn" data-action="restart">Start ${fmt(info.title)} again</button>
        <a class="btn" href="#/">Back to decks</a>
      </div>
    </div>
  </div>`;
}

/* Size the card to the face in view: as tall as its content needs, within a
   minimum that keeps it card-shaped and the room the screen allows. A face
   taller than that room scrolls inside the card. */
function fitCard({ instant = false } = {}) {
  const card = document.getElementById('card');
  const stage = card?.parentElement;
  if (!card || !stage) return;
  const face = card.querySelector(card.classList.contains('is-flipped') ? '.face--back' : '.face--front');
  const body = face.querySelector('.face__body');
  const bodyStyle = getComputedStyle(body);
  let needed = body.querySelector('.face__content').offsetHeight
    + parseFloat(bodyStyle.paddingTop) + parseFloat(bodyStyle.paddingBottom);
  for (const part of face.children) if (part !== body) needed += part.offsetHeight;

  const stageStyle = getComputedStyle(stage);
  const room = stage.clientHeight - parseFloat(stageStyle.paddingTop) - parseFloat(stageStyle.paddingBottom);
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const height = Math.round(Math.min(room, Math.max(CARD_MIN_REM * rem, needed + 1)));

  if (instant) card.classList.add('is-sizing');
  card.style.height = `${height}px`;
  if (instant) {
    void card.offsetHeight; // apply the height before transitions come back on
    card.classList.remove('is-sizing');
  }
}

function flip() {
  const card = document.getElementById('card');
  if (!card) return;
  stopHint();
  const flipped = card.classList.toggle('is-flipped');
  card.querySelector('.face--front').setAttribute('aria-hidden', String(flipped));
  card.querySelector('.face--back').setAttribute('aria-hidden', String(!flipped));
  fitCard();
}

function mark(status) {
  const s = store.session;
  if (busy || !s || s.i >= s.order.length) return;
  stopHint();
  const id = s.order[s.i];
  const prev = store.cards[id] ? { ...store.cards[id] } : null;
  history.push({ id, prev });
  store.cards[id] = { ...prev, s: status, n: (prev?.n || 0) + 1 };
  s.i++;
  save();

  const card = document.getElementById('card');
  if (card && !reduceMotion.matches) {
    busy = true;
    card.classList.add(status === 'know' ? 'is-leaving-right' : 'is-leaving-left');
    setTimeout(() => {
      busy = false;
      render();
    }, 190);
  } else {
    render();
  }
}

function undo() {
  const s = store.session;
  if (busy || !s || s.i === 0) return;
  s.i--;
  const last = history.pop();
  if (last && last.id === s.order[s.i]) {
    // Only the flashcard sort is rolled back; stars and quiz mastery stay.
    const restored = { ...store.cards[last.id], s: last.prev?.s, n: last.prev?.n };
    if (restored.s === undefined) delete restored.s;
    if (restored.n === undefined) delete restored.n;
    store.cards[last.id] = restored;
  }
  save();
  render();
}

function toggleStar(id) {
  store.cards[id] = { ...store.cards[id], star: !isStarred(id) };
  save();
}

/* ---------- swipe hint ---------- */

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// The demonstration in progress: { card, label, timers }.
let hint = null;

/* Ends the demonstration. It counts as seen for the day once it has played
   through or the reader has acted on the card; a redraw that cuts it short
   lets it play again. */
function stopHint(seen = true) {
  if (!hint) return;
  const { card, label, timers } = hint;
  hint = null;
  if (seen) {
    store.hintSeen = today();
    save();
  }
  timers.forEach(clearTimeout);
  label.remove();
  card.classList.remove('is-demo');
  for (const prop of ['--dx', '--rot', '--know', '--learn']) card.style.removeProperty(prop);
}

/* Leans the card to each side in turn, with the stamp and a caption naming
   what a swipe that way does. Any touch on the card ends it. It plays even
   when reduced motion is requested: it is brief, and it is the instruction. */
function playHint(card) {
  const label = document.createElement('p');
  label.className = 'swipe-hint';
  label.setAttribute('role', 'status');
  // The caption is centered in the space between the top of the stage and the card.
  label.style.height = `${card.offsetTop}px`;
  card.parentElement.append(label);
  const timers = [];
  hint = { card, label, timers };
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));

  const reach = Math.min(120, card.offsetWidth * 0.3);
  const lean = (x) => {
    card.style.setProperty('--dx', `${x}px`);
    card.style.setProperty('--rot', `${x / 28}deg`);
    card.style.setProperty('--know', x > 0 ? 1 : 0);
    card.style.setProperty('--learn', x < 0 ? 1 : 0);
  };
  at(600, () => {
    card.classList.add('is-demo');
    label.innerHTML = '<span class="swipe-hint__learn">Swipe left: still learning</span>';
    lean(-reach);
  });
  at(2100, () => {
    label.innerHTML = '<span class="swipe-hint__know">Swipe right: know it</span>';
    lean(reach);
  });
  at(3600, () => lean(0));
  at(4300, () => stopHint());
}

/* Tap flips the card; dragging it sideways past the threshold sorts it. */
function attachCard(card) {
  let startX = 0;
  let startY = 0;
  let dx = 0;
  let dragging = false;
  let pointer = null;
  let suppressClick = false;

  const setDrag = (x) => {
    card.style.setProperty('--dx', `${x}px`);
    card.style.setProperty('--rot', `${x / 28}deg`);
    card.style.setProperty('--know', Math.max(0, Math.min(1, x / SWIPE_DISTANCE)));
    card.style.setProperty('--learn', Math.max(0, Math.min(1, -x / SWIPE_DISTANCE)));
  };

  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || busy) return;
    stopHint();
    pointer = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dx = 0;
    dragging = false;
  });

  card.addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointer) return;
    const mx = e.clientX - startX;
    const my = e.clientY - startY;
    if (!dragging) {
      if (Math.abs(mx) < 12 || Math.abs(mx) < Math.abs(my) * 1.2) return;
      dragging = true;
      card.classList.add('is-dragging');
      try {
        card.setPointerCapture(pointer);
      } catch {
        /* pointer already gone */
      }
    }
    dx = mx;
    setDrag(dx);
  });

  const release = (e) => {
    if (e.pointerId !== pointer) return;
    pointer = null;
    if (!dragging) return;
    dragging = false;
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
    card.classList.remove('is-dragging');
    if (e.type === 'pointerup' && Math.abs(dx) >= SWIPE_DISTANCE) {
      mark(dx > 0 ? 'know' : 'learn');
    } else {
      setDrag(0);
    }
  };
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);

  card.addEventListener('click', () => {
    if (suppressClick) return;
    if (String(getSelection?.() || '').length) return;
    flip();
  });
}

/* ---------- quiz ---------- */

/* The correct choice for a card: its quiz wording, or its own short answer. */
const rightChoice = (card) => QUIZ[card.id]?.right || card.a;
const quizPrompt = (card) => QUIZ[card.id]?.q || card.q;
/* A select-all-that-apply question lists every correct choice under `all`. */
const isMulti = (card) => Array.isArray(QUIZ[card.id]?.all);
const rightText = (card) => (isMulti(card) ? QUIZ[card.id].all.join('; ') : rightChoice(card));
/* A card with `steps` is asked as a put-in-order question. */
const isOrder = (card) => Array.isArray(card.steps);

/* The steps shuffled, and never left in the right order. */
function mixedSteps(card) {
  const same = (list) => list.every((text, i) => text === card.steps[i]);
  let out = shuffled(card.steps);
  for (let n = 0; n < 20 && same(out); n++) out = shuffled(card.steps);
  return out;
}

function choicesFor(card) {
  if (isMulti(card)) {
    const { all, wrong: others } = QUIZ[card.id];
    return shuffled([...all.map((text) => ({ text, right: true })), ...others.map((text) => ({ text, right: false }))]);
  }
  const right = rightChoice(card);
  let wrong = QUIZ[card.id]?.wrong;
  if (!wrong) {
    // Borrow the correct answers of the other cards in this deck.
    const pool = new Set(card.deck.cards.filter((c) => !isMulti(c) && !isOrder(c)).map((c) => rightChoice(c)));
    pool.delete(right);
    wrong = shuffled([...pool]).slice(0, 3);
  }
  return shuffled([{ text: right, right: true }, ...wrong.map((text) => ({ text, right: false }))]);
}

// The question on screen: { id, multi, choices, selected, out, graded, ok, lastTap }.
// `selected` holds the choices waiting to be submitted (one, unless `multi`),
// `out` the choices the reader has ruled out. Once `graded`, `selected` is
// what was submitted and `ok` whether it was right. A put-in-order question
// sets `order` and keeps the steps as the reader has arranged them in `seq`.
let quizView = null;

function startQuiz(key) {
  // Questions still to master come first; mastered ones fill whatever room is left.
  const ids = scope(key).cards.map((c) => c.id);
  const open = shuffled(ids.filter((id) => !isMastered(id))).slice(0, QUIZ_LENGTH);
  const review = shuffled(ids.filter(isMastered)).slice(0, QUIZ_LENGTH - open.length);
  store.quiz = { key, ids: shuffled([...open, ...review]), i: 0, results: [] };
  quizView = null;
  save();
}

function renderQuiz(key) {
  const info = scope(key);
  if (!info) return go('#/');
  document.title = `Quiz: ${plain(info.title)} | Study cards`;

  let q = store.quiz;
  if (!q || q.key !== key || !Array.isArray(q.ids) || !q.ids.every((id) => BY_ID.has(id))) {
    if (!info.cards.length) return renderQuizEmpty(key, info);
    return renderQuizIntro(info);
  }
  // A reload after answering but before "Next" lands on the following question.
  if (!quizView && q.results.length > q.i) q.i = q.results.length;
  if (q.i >= q.ids.length) return renderQuizResults(key, info, q);

  const card = BY_ID.get(q.ids[q.i]);
  if (!quizView || quizView.id !== card.id) {
    const order = isOrder(card);
    quizView = { id: card.id, order, seq: order ? mixedSteps(card) : [], multi: !order && isMulti(card), choices: order ? [] : choicesFor(card), selected: new Set(), out: new Set(), graded: false, ok: false, lastTap: null };
  }
  const { choices, selected, multi, order } = quizView;
  const answered = quizView.graded;
  const last = q.i === q.ids.length - 1;
  const correctSoFar = q.results.filter((r) => r.ok).length;
  const m = masteryOf(card.id);

  const levels = q.ids.map((id, i) => (q.results[i] ? (q.results[i].ok ? 'right' : 'wrong') : 'new'));
  const options = choices
    .map((c, i) => {
      const chosen = selected.has(i);
      // On a select-all question, a correct choice the reader left out is marked as missed.
      const missed = multi && c.right && !chosen;
      let state = '';
      if (answered) state = c.right ? (missed ? ' option--right option--missed' : ' option--right') : chosen ? ' option--wrong' : ' option--dim';
      const tell = answered && c.right ? `<span class="visually-hidden"> (${missed ? 'correct, not selected' : 'correct answer'})</span>` : '';
      return `<li><button class="option${state}" data-action="choose" data-i="${i}" aria-pressed="false" ${answered ? 'disabled' : ''}><span class="option__key" aria-hidden="true">${'ABCDEF'[i]}</span><span class="option__text">${fmt(c.text)}${tell}</span><span class="visually-hidden option__out-note"></span></button></li>`;
    })
    .join('');

  let feedback = `
    <div class="feedback feedback--pending">
      <button class="btn btn--primary" id="quiz-submit" data-action="quiz-submit" ${order ? '' : 'disabled'}>Submit answer</button>
    </div>`;
  if (answered) {
    const ok = quizView.ok;
    const progress = isMastered(card.id) ? 'Mastered.' : `${m} of ${MASTER_AT} toward mastered.`;
    feedback = `
    <div class="feedback feedback--${ok ? 'right' : 'wrong'}">
      <div class="feedback__text" role="status">
        <p class="feedback__verdict">${ok ? 'Correct' : 'Not quite'}</p>
        <p class="feedback__progress">${pipsHTML(m)}${progress}</p>
      </div>
      <button class="btn btn--primary" id="quiz-next" data-action="quiz-next">${last ? 'See results' : 'Next question'}</button>
    </div>`;
  }

  app.innerHTML = `
  <div class="quiz">
    <header class="bar">
      <a class="iconbtn" href="#/" aria-label="Leave the quiz">${ICON.close}</a>
      <div class="bar__title"><span>Quiz: ${fmt(info.title)}</span><span class="bar__count">Question ${q.i + 1} of ${q.ids.length}, ${correctSoFar} correct</span></div>
    </header>
    ${tapeHTML(levels, answered ? -1 : q.i)}
    ${storageNotice()}
    <main class="quiz__main">
      <p class="quiz__deck">${fmt(card.deck.title)}</p>
      <h1 class="quiz__q">${fmt(quizPrompt(card))}</h1>
      ${drawingsHTML(card.figure)}
      ${card.hint && !QUIZ[card.id]?.q ? `<p class="hint">${fmt(card.hint)}</p>` : ''}
      ${multi ? '<p class="quiz__multi">Select all that apply.</p>' : ''}
      ${order ? `<p class="quiz__multi">${answered ? 'Your order' : 'Drag the steps into order, or use the arrows.'}</p>` : ''}
      ${order ? `<ol class="steps" id="steps">${stepRowsHTML()}</ol>` : `<ol class="options${multi ? ' options--multi' : ''}">${options}</ol>`}
      ${feedback}
      ${order && answered && !quizView.ok ? `<div class="why"><p class="why__label">Correct order</p>${checklistHTML(card.steps)}</div>` : ''}
      ${order && answered && card.bullets ? `<div class="answer answer--sm quiz__then"><ul>${card.bullets.map((b) => `<li>${fmt(b)}</li>`).join('')}</ul></div>` : ''}
      ${answered ? whyHTML(card) : ''}
      ${answered && card.note ? `<p class="note">${fmt(card.note)}</p>` : ''}
    </main>
  </div>`;

  if (answered) {
    const next = document.getElementById('quiz-next');
    next.focus({ preventScroll: true });
    next.scrollIntoView({ block: 'nearest' });
  } else {
    paintChoices();
  }
}

/* The rows of a put-in-order question, as the reader has them arranged. Once
   graded, each row shows whether it sits where the checklist has it. */
function stepRowsHTML() {
  const { seq, graded } = quizView;
  const steps = BY_ID.get(quizView.id).steps;
  return seq
    .map((text, i) => {
      const n = `<span class="step__n" aria-hidden="true">${i + 1}</span>`;
      if (graded) {
        const ok = text === steps[i];
        return `<li class="step step--${ok ? 'right' : 'wrong'}">${n}<span class="step__text chk">${checkHTML(text)}<span class="visually-hidden"> (${ok ? 'in the right place' : 'in the wrong place'})</span></span></li>`;
      }
      const label = esc(plain(text));
      return `<li class="step" data-i="${i}">
        <span class="step__grip" aria-hidden="true">${ICON.grip}</span>${n}
        <span class="step__text chk">${checkHTML(text)}</span>
        <span class="step__move">
          <button class="step__btn" data-action="step-up" data-i="${i}" aria-label="Move up: ${label}" ${i ? '' : 'disabled'}>${ICON.up}</button>
          <button class="step__btn" data-action="step-down" data-i="${i}" aria-label="Move down: ${label}" ${i < seq.length - 1 ? '' : 'disabled'}>${ICON.down}</button>
        </span>
      </li>`;
    })
    .join('');
}

/* Move a step one place with its arrow buttons, keeping the keyboard focus on it. */
function moveStep(i, by) {
  if (!quizView?.order || quizView.graded) return;
  const j = i + by;
  const { seq } = quizView;
  if (j < 0 || j >= seq.length) return;
  [seq[i], seq[j]] = [seq[j], seq[i]];
  const list = document.getElementById('steps');
  list.innerHTML = stepRowsHTML();
  const buttons = list.children[j].querySelectorAll('.step__btn');
  const wanted = buttons[by < 0 ? 0 : 1];
  (wanted.disabled ? buttons[by < 0 ? 1 : 0] : wanted).focus({ preventScroll: true });
  list.children[j].scrollIntoView({ block: 'nearest' });
}

/* Dragging a step. The row follows the pointer and trades places with a
   neighbor as its middle crosses theirs, so rows of any height work. */
let drag = null; // { row, pointerId, y0, top0, clientY, frame }

function dragStart(e) {
  if (drag || !quizView?.order || quizView.graded || e.button > 0) return;
  const row = e.target.closest('.step');
  if (!row || e.target.closest('button')) return;
  // A finger drags by the handle, so the rest of the row still scrolls the page.
  if (e.pointerType !== 'mouse' && !e.target.closest('.step__grip')) return;
  e.preventDefault();
  drag = { row, pointerId: e.pointerId, y0: e.clientY + window.scrollY, top0: row.offsetTop, clientY: e.clientY, frame: 0 };
  row.classList.add('is-dragging');
  // Captured on the page, not the row: moving the row in the list would drop it.
  app.setPointerCapture(e.pointerId);
  drag.frame = requestAnimationFrame(dragFrame);
}

function dragFrame() {
  if (!drag) return;
  const { row } = drag;
  // Near the top or bottom of the window, scroll the page along.
  const edge = 64;
  if (drag.clientY < edge) window.scrollBy(0, -9);
  else if (drag.clientY > window.innerHeight - edge) window.scrollBy(0, 9);

  const top = drag.top0 + drag.clientY + window.scrollY - drag.y0;
  const middle = top + row.offsetHeight / 2;
  for (;;) {
    const prev = row.previousElementSibling;
    const next = row.nextElementSibling;
    if (prev && middle < prev.offsetTop + prev.offsetHeight / 2) row.parentNode.insertBefore(row, prev);
    else if (next && middle > next.offsetTop + next.offsetHeight / 2) row.parentNode.insertBefore(next, row);
    else break;
  }
  row.style.transform = `translateY(${top - row.offsetTop}px)`;
  drag.frame = requestAnimationFrame(dragFrame);
}

function dragEnd() {
  if (!drag) return;
  cancelAnimationFrame(drag.frame);
  const list = drag.row.parentNode;
  drag = null;
  if (!quizView?.order || quizView.graded || !list?.isConnected) return;
  const before = quizView.seq;
  quizView.seq = [...list.children].map((li) => before[Number(li.dataset.i)]);
  list.innerHTML = stepRowsHTML();
}

/* Show which choices are selected and which are ruled out, without redrawing. */
function paintChoices() {
  if (!quizView || quizView.graded || quizView.order) return;
  for (const btn of app.querySelectorAll('.option')) {
    const i = Number(btn.dataset.i);
    const out = quizView.out.has(i);
    btn.classList.toggle('option--selected', quizView.selected.has(i));
    btn.classList.toggle('option--out', out);
    btn.setAttribute('aria-pressed', String(quizView.selected.has(i)));
    btn.querySelector('.option__out-note').textContent = out ? ' (ruled out)' : '';
  }
  const submit = document.getElementById('quiz-submit');
  if (submit) submit.disabled = quizView.selected.size === 0;
}

/* One tap selects a choice; on a select-all question it adds the choice or
   takes it back off. A second tap on the same choice within a moment rules it
   out instead, or brings it back, and undoes what the first tap did. A
   ruled-out choice has to be brought back before it can be selected. */
function choose(i, { viaKey = false } = {}) {
  if (!quizView || quizView.graded || !quizView.choices[i]) return;
  const now = Date.now();
  const last = quizView.lastTap;
  if (!viaKey && last && last.i === i && now - last.t <= DOUBLE_TAP_MS) {
    quizView.lastTap = null;
    if (quizView.out.has(i)) quizView.out.delete(i);
    else quizView.out.add(i);
    quizView.selected = new Set(last.before);
    quizView.selected.delete(i);
  } else {
    quizView.lastTap = viaKey ? null : { i, t: now, before: new Set(quizView.selected) };
    if (!quizView.out.has(i)) {
      if (!quizView.multi) quizView.selected = new Set([i]);
      else if (!quizView.selected.delete(i)) quizView.selected.add(i);
    }
  }
  paintChoices();
}

function submitAnswer() {
  const q = store.quiz;
  if (!q || !quizView || quizView.graded || drag) return;
  if (!quizView.order && !quizView.selected.size) return;
  const id = quizView.id;
  // Right means every correct choice selected and nothing else, or every step in its place.
  const ok = quizView.order
    ? quizView.seq.every((text, i) => text === BY_ID.get(id).steps[i])
    : quizView.choices.every((c, i) => c.right === quizView.selected.has(i));
  const before = masteryOf(id);
  const m = ok ? Math.min(MASTER_AT, before + 1) : Math.max(0, before - 1);
  store.cards[id] = { ...store.cards[id], m };
  // `mastered` marks a question that reached mastery on this answer, not one already there.
  q.results.push({ id, ok, mastered: m >= MASTER_AT && before < MASTER_AT });
  quizView.graded = true;
  quizView.ok = ok;
  save();
  render();
}

function quizNext() {
  const q = store.quiz;
  if (!q || !quizView || !quizView.graded) return;
  q.i = q.results.length;
  quizView = null;
  save();
  window.scrollTo(0, 0);
  render();
}

/* Title page: what the quiz covers and how it works, before any question shows. */
function renderQuizIntro(info) {
  const total = info.cards.length;
  const open = info.cards.filter((c) => !isMastered(c.id)).length;
  const count = Math.min(QUIZ_LENGTH, total);
  const plural = count === 1 ? 'question' : 'questions';
  const ordering = info.cards.some(isOrder);
  const choosing = info.cards.some((c) => !isOrder(c));
  const mastered = total - open;
  const review = count - Math.min(QUIZ_LENGTH, open);
  let mix = '';
  if (!open) mix = ` All ${total} are already mastered, so this is a review.`;
  else if (review) mix = ` ${review} ${review === 1 ? 'is a mastered question' : 'are mastered questions'} back for review.`;
  else if (open > count) mix = ` They are drawn at random from the ${open} you have not mastered.`;
  else if (mastered) mix = ` ${mastered} of ${total} already mastered.`;

  app.innerHTML = `
  <div class="quiz">
    <header class="bar"><a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a><div class="bar__title"><span>Quiz</span></div></header>
    <div class="finish intro">
      <h1>${fmt(info.title)}</h1>
      <p>${count} ${ordering ? (choosing ? '' : 'put-in-order ') : 'multiple-choice '}${plural}.${mix}</p>
      <ul class="intro__rules">
        ${ordering ? '<li><strong>Put the steps in order.</strong> Drag a step by its handle, or use its arrows, then tap Submit answer. It counts as right only with every step in its place.</li>' : ''}
        ${choosing ? `<li><strong>Select, then submit.</strong> Tap an answer to select it, then tap Submit answer. Nothing is graded until you submit.</li>
        <li><strong>Select all that apply.</strong> Some questions have more than one right answer and say so. Tap each one you want. They count as right only with every correct answer selected and no wrong one.</li>
        <li><strong>Rule answers out.</strong> Double-tap an answer to dim it. Double-tap again to bring it back.</li>` : ''}
        <li><strong>Mastering a question.</strong> A right answer adds one, a wrong answer takes one away. At ${MASTER_AT} the question is mastered. Mastered questions come back only when a quiz has room for them, and a wrong answer still takes one away.</li>
        <li class="intro__keys"><strong>On a keyboard.</strong> The number keys select an answer and Enter submits.</li>
      </ul>
      <div class="actions">
        <button class="btn btn--primary" id="quiz-start" data-action="quiz-start">Start quiz</button>
        <a class="btn" href="#/study/${esc(route().key)}">Study these cards first</a>
      </div>
    </div>
  </div>`;
  document.getElementById('quiz-start').focus({ preventScroll: true });
}

function renderQuizEmpty(key, info) {
  app.innerHTML = `
  <div class="quiz">
    <header class="bar"><a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a><div class="bar__title"><span>Quiz: ${fmt(info.title)}</span></div></header>
    <div class="finish">
      <h1>Nothing to quiz here yet</h1>
      <p>This list has no cards in it.</p>
      <div class="actions"><a class="btn btn--primary" href="#/">Back to decks</a></div>
    </div>
  </div>`;
}

function renderQuizResults(key, info, q) {
  const right = q.results.filter((r) => r.ok).length;
  const total = q.results.length;
  const pct = total ? Math.round((right / total) * 100) : 0;
  const newlyMastered = q.results.filter((r) => r.ok && r.mastered).length;
  const missed = q.results.filter((r) => !r.ok);
  const left = info.cards.filter((c) => !isMastered(c.id)).length;

  const missedRows = missed
    .map((r) => {
      const card = BY_ID.get(r.id);
      const answer = isOrder(card)
        ? checklistHTML(card.steps, ' miss__a miss__steps')
        : `<p class="miss__a">${fmt(rightText(card))}</p>`;
      return `<li class="miss"><p class="miss__q">${fmt(quizPrompt(card))}</p>${answer}</li>`;
    })
    .join('');

  app.innerHTML = `
  <div class="quiz">
    <header class="bar"><a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.close}</a><div class="bar__title"><span>Quiz: ${fmt(info.title)}</span><span class="bar__count">Results</span></div></header>
    ${tapeHTML(q.results.map((r) => (r.ok ? 'right' : 'wrong')))}
    <div class="finish">
      <h1>${right} of ${total} correct</h1>
      <p>${pct}%. ${newlyMastered ? `${newlyMastered} ${newlyMastered === 1 ? 'question' : 'questions'} newly mastered. ` : ''}${left ? `${left} in ${fmt(info.title)} still to master.` : `Everything in ${fmt(info.title)} is mastered.`}</p>
      <div class="actions">
        <button class="btn${left ? ' btn--primary' : ''}" data-action="quiz-new">${left ? 'Take another quiz' : 'Take a review quiz'}</button>
        ${missed.length ? `<button class="btn" data-action="quiz-review">Review ${missed.length} missed as flashcards</button>` : ''}
        <a class="btn ${left ? '' : 'btn--primary'}" href="#/">Back to decks</a>
      </div>
    </div>
    ${missed.length ? `<section class="misses"><h2>Missed, with the right answers</h2><ul>${missedRows}</ul></section>` : ''}
  </div>`;
}

/* ---------- browse ---------- */

function renderBrowse(key) {
  const info = scope(key);
  if (!info) return go('#/');
  document.title = `${plain(info.title)} | Study cards`;
  const showDeck = key === 'all' || key === 'learning' || key === 'starred' || key.startsWith('group-');

  const rows = info.cards
    .map((card) => {
      const level = levelOf(card.id);
      const m = masteryOf(card.id);
      return `
      <li class="row${level === 'know' ? ' row--reset' : ''}" data-text="${esc(searchText(card))}">
        ${level === 'know' ? `<button class="iconbtn row__reset" data-action="row-reset" data-id="${card.id}" aria-label="Mark as not seen: ${esc(plain(card.q))}" title="Mark as not seen">${ICON.undo}</button>` : ''}
        <details>
          <summary><span class="dot dot--${level}" role="img" aria-label="${LEVEL_LABEL[level]}"></span><span class="row__q">${fmt(card.q)}${card.hint ? ` <span class="row__hint">${fmt(card.hint)}</span>` : ''}</span></summary>
          <div class="row__a">
            ${showDeck ? `<p class="row__deck">${fmt(card.deck.title)}</p>` : ''}
            <div class="answer answer--sm">${answerHTML(card)}</div>
            ${drawingsHTML(card.figure)}${drawingsHTML(card.diagram)}
            ${whyHTML(card)}
            ${card.note ? `<p class="note">${fmt(card.note)}</p>` : ''}
            ${m ? `<p class="row__quiz">${pipsHTML(m)}Quiz: ${m} of ${MASTER_AT} toward mastered</p>` : ''}
            <button class="btn btn--quiet btn--small" data-action="row-star" data-id="${card.id}" aria-pressed="${isStarred(card.id)}">${isStarred(card.id) ? 'Starred' : 'Star this card'}</button>
          </div>
        </details>
      </li>`;
    })
    .join('');

  app.innerHTML = `
  <div class="browse">
    <header class="bar">
      <a class="iconbtn" href="#/" aria-label="Back to decks">${ICON.back}</a>
      <div class="bar__title"><span>${fmt(info.title)}</span><span class="bar__count">${info.cards.length} cards</span></div>
      ${info.cards.length ? `<a class="btn btn--small" href="#/quiz/${esc(key)}">Quiz</a><a class="btn btn--primary btn--small" href="#/study/${esc(key)}">Study</a>` : ''}
    </header>
    <label class="search"><span class="visually-hidden">Search these cards</span><input type="search" id="search" placeholder="Search questions and answers" autocomplete="off" /></label>
    ${info.cards.length ? '<div class="rowtools"><button class="btn btn--quiet btn--small" data-action="rows-open">Expand all</button><button class="btn btn--quiet btn--small" data-action="rows-close">Collapse all</button></div>' : ''}
    <ul class="rows">${rows}</ul>
    <p class="empty" id="no-match" hidden>No cards match that search.</p>
    ${info.cards.length ? '' : '<p class="empty">No cards in this list yet.</p>'}
  </div>`;

  const input = document.getElementById('search');
  input.addEventListener('input', () => {
    const terms = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const li of app.querySelectorAll('.row')) {
      const hit = terms.every((t) => li.dataset.text.includes(t));
      li.hidden = !hit;
      if (hit) shown++;
    }
    document.getElementById('no-match').hidden = shown > 0 || !info.cards.length;
  });
}

/* ---------- routing and events ---------- */

function route() {
  const [, view, key] = location.hash.split('/');
  return { view: view || 'home', key: key ? decodeURIComponent(key) : '' };
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  stopHint(false);
  dragEnd();
  const { view, key } = route();
  document.body.dataset.view = view;
  if (view === 'study') renderStudy(key);
  else if (view === 'quiz') renderQuiz(key);
  else if (view === 'browse') renderBrowse(key);
  else renderHome();
}

app.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { key } = route();
  const s = store.session;

  switch (el.dataset.action) {
    case 'know':
    case 'learn':
      mark(el.dataset.action);
      break;
    case 'undo':
      undo();
      break;
    case 'star':
      if (s && s.i < s.order.length) {
        toggleStar(s.order[s.i]);
        el.setAttribute('aria-pressed', String(isStarred(s.order[s.i])));
      }
      break;
    case 'row-star':
      toggleStar(el.dataset.id);
      el.setAttribute('aria-pressed', String(isStarred(el.dataset.id)));
      el.textContent = isStarred(el.dataset.id) ? 'Starred' : 'Star this card';
      break;
    case 'row-reset': {
      const { s: _status, ...rest } = store.cards[el.dataset.id] || {};
      store.cards[el.dataset.id] = rest;
      save();
      const row = el.closest('.row');
      const dot = row.querySelector('.dot');
      dot.className = 'dot dot--new';
      dot.setAttribute('aria-label', LEVEL_LABEL.new);
      row.classList.remove('row--reset');
      el.remove();
      row.querySelector('summary').focus({ preventScroll: true });
      break;
    }
    case 'rows-open':
    case 'rows-close':
      for (const d of app.querySelectorAll('.row details')) d.open = el.dataset.action === 'rows-open';
      break;
    case 'shuffle':
      store.opts.inOrder = !store.opts.inOrder;
      startSession(key);
      render();
      break;
    case 'answer-first':
      store.opts.answerFirst = !store.opts.answerFirst;
      save();
      render();
      break;
    case 'restart':
      startSession(key);
      render();
      break;
    case 'review-missed':
      startSession(key, s.order.filter((id) => statusOf(id) === 'learn'));
      render();
      break;
    case 'choose':
      choose(Number(el.dataset.i));
      break;
    case 'step-up':
      moveStep(Number(el.dataset.i), -1);
      break;
    case 'step-down':
      moveStep(Number(el.dataset.i), 1);
      break;
    case 'quiz-submit':
      submitAnswer();
      break;
    case 'quiz-start':
      startQuiz(key);
      window.scrollTo(0, 0);
      render();
      break;
    case 'quiz-next':
      quizNext();
      break;
    case 'quiz-new':
      startQuiz(key);
      window.scrollTo(0, 0);
      render();
      break;
    case 'quiz-review': {
      const ids = store.quiz.results.filter((r) => !r.ok).map((r) => r.id);
      store.quiz = null;
      quizView = null;
      startSession(key, ids);
      go(`#/study/${key}`);
      break;
    }
    case 'include-mei':
      store.opts.mei = !store.opts.mei;
      dropOutOfPlay();
      save();
      render();
      document.querySelector('[data-action="include-mei"]')?.focus({ preventScroll: true });
      break;
    case 'reset':
      if (confirm('Erase all saved progress, mastery and stars? This cannot be undone.')) {
        store.cards = {};
        store.session = null;
        store.quiz = null;
        quizView = null;
        save();
        render();
      }
      break;
  }
});

app.addEventListener('pointerdown', dragStart);
app.addEventListener('pointermove', (e) => {
  if (drag && e.pointerId === drag.pointerId) drag.clientY = e.clientY;
});
app.addEventListener('pointerup', dragEnd);
app.addEventListener('pointercancel', dragEnd);

document.addEventListener('keydown', (e) => {
  const { view } = route();
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  const onControl = tag === 'BUTTON' || tag === 'A';
  const k = e.key.toLowerCase();

  if (view === 'quiz') {
    const i = k.length === 1 ? Math.max('123456'.indexOf(k), 'abcdef'.indexOf(k)) : -1;
    if (i >= 0) choose(i, { viaKey: true });
    else if (e.key === 'Enter' && !(onControl && e.target.closest('.btn, .iconbtn, .step__btn'))) {
      // Enter submits the selected choice, then moves on.
      e.preventDefault();
      if (quizView && !quizView.graded) submitAnswer();
      else quizNext();
    }
    return;
  }
  if (view !== 'study') return;

  if ((e.key === ' ' || e.key === 'Enter') && !onControl) {
    e.preventDefault();
    flip();
  } else if (e.key === 'ArrowRight') {
    mark('know');
  } else if (e.key === 'ArrowLeft') {
    mark('learn');
  } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    if (!onControl) {
      e.preventDefault();
      flip();
    }
  } else if (e.key === 'Backspace' || k === 'u') {
    undo();
  } else if (k === 's') {
    document.querySelector('[data-action="star"]')?.click();
  }
});

window.addEventListener('resize', () => fitCard({ instant: true }));

window.addEventListener('hashchange', () => {
  // A finished quiz is kept only while its results are on screen.
  const { view, key } = route();
  const q = store.quiz;
  if (q && q.results.length >= q.ids.length && !(view === 'quiz' && key === q.key)) {
    store.quiz = null;
    quizView = null;
    save();
  }
  window.scrollTo(0, 0);
  render();
});

render();
