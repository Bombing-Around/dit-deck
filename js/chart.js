import { MORSE, REV, STRIP, glyphs } from './morse.js';

const NS = 'http://www.w3.org/2000/svg';
const mk = (tag, attrs, parent, text) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (text != null) n.textContent = text;
  if (parent) parent.appendChild(n);
  return n;
};

// Clears the svg and returns the drawing context shared by both layouts.
function frame(svg, w, h, label) {
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('aria-label', label);
  const f = mk('filter', { id: 'glow', x: '-150%', y: '-150%', width: '400%', height: '400%' }, mk('defs', {}, svg));
  mk('feGaussianBlur', { stdDeviation: '2.6', result: 'b' }, f);
  const fm = mk('feMerge', {}, f); mk('feMergeNode', { in: 'b' }, fm); mk('feMergeNode', { in: 'SourceGraphic' }, fm);
  const ctx = {
    leds: new Map(), traces: new Map(), labels: new Map(),
    gT: mk('g', {}, svg), gL: mk('g', {}, svg), gX: mk('g', {}, svg),
  };
  ctx.node = (c, p, dnp = false) => {
    mk('circle', { cx: p.x, cy: p.y, r: 7.5, class: 'pad' + (dnp ? ' dnp' : '') }, ctx.gL);
    ctx.leds.set(c, mk('circle', { cx: p.x, cy: p.y, r: 4.6, class: 'led' + (dnp ? ' dnp' : '') }, ctx.gL));
  };
  ctx.startLabel = p => ctx.labels.set('', mk('text', { x: p.x, y: p.y + 24, 'text-anchor': 'middle', class: 'lbl' }, ctx.gX, 'START'));
  return ctx;
}

// Binary tree: dit up, dah down, depth left to right
function buildTree(svg) {
  const ctx = frame(svg, 540, 340, 'Morse code tree. Dit branches up, dah branches down.');
  const X = [30, 140, 252, 364, 470], TOP = 18, ROW = 20;
  const pos = code => {
    const d = code.length; let idx = 0;
    for (const c of code) idx = idx * 2 + (c === '-' ? 1 : 0);
    const span = 1 << (4 - d);
    return { x: X[d], y: TOP + (idx * span + (span - 1) / 2) * ROW };
  };
  const codes = [''];
  for (let d = 0; d < 4; d++) for (const c of codes.filter(c => c.length === d)) codes.push(c + '.', c + '-');
  for (const c of codes) {
    const p = pos(c);
    if (c) {
      const q = pos(c.slice(0, -1)), dy = Math.abs(p.y - q.y);
      const bx = Math.max(q.x + 8, p.x - 10 - dy);
      ctx.traces.set(c, mk('path', { d: `M${q.x} ${q.y}H${bx}L${p.x - 10} ${p.y}H${p.x}`, class: 'trace' }, ctx.gT));
    }
    const ch = c ? REV[c] : '';
    ctx.node(c, p, c && !ch);
    if (!c) ctx.startLabel(p);
    else if (ch && c.length === 4) {
      const t = mk('text', { x: p.x + 12, y: p.y + 4.5, class: 'lbl' }, ctx.gX, ch + ' ');
      mk('tspan', { class: 'cd' }, t, glyphs(c));
      ctx.labels.set(c, t);
    } else if (ch) ctx.labels.set(c, mk('text', { x: p.x + 9, y: p.y - 9, class: 'lbl' }, ctx.gX, ch));
  }
  mk('text', { x: 6, y: 16, class: 'legend' }, ctx.gX, '↑ DIT ·');
  mk('text', { x: 6, y: 332, class: 'legend' }, ctx.gX, '↓ DAH −');
  return ctx;
}

// Pathway card: dah arm runs left of START, dit arm runs right, branches drop down. [col, row]
const PATHWAY = {
  '': [3, 0],
  '-': [2, 0], '--': [1, 0], '---': [0, 0],
  '.': [4, 0], '..': [5, 0], '...': [6, 0], '....': [7, 0],
  '--.': [1, 1], '--.-': [0, 1], '--..': [1, 2],
  '..-': [5, 1], '...-': [6, 1], '..-.': [5, 2],
  '-.': [2, 3], '-.-': [1, 3], '-.--': [0, 3], '-.-.': [1, 4],
  '-..': [2, 5], '-..-': [1, 5], '-...': [2, 6],
  '.-': [4, 3], '.-.': [5, 3], '.-..': [6, 3],
  '.--': [4, 5], '.--.': [5, 5], '.---': [4, 6],
};
function buildPathway(svg) {
  const ctx = frame(svg, 540, 334, 'Morse pathway chart. Dahs run left from start, dits run right, and branches drop down.');
  const P = c => ({ x: 44 + PATHWAY[c][0] * 64, y: 34 + PATHWAY[c][1] * 44 });
  for (const c in PATHWAY) {
    const p = P(c);
    if (c) {
      const q = P(c.slice(0, -1));
      ctx.traces.set(c, mk('path', { d: `M${q.x} ${q.y}L${p.x} ${p.y}`, class: 'trace' }, ctx.gT));
    }
    ctx.node(c, p);
    if (!c) { ctx.startLabel(p); continue; }
    ctx.labels.set(c, mk('text', { x: p.x + 10, y: p.y - 8, class: 'lbl' }, ctx.gX, REV[c]));
    mk('text', { x: p.x + 10, y: p.y + 17, class: 'lbl-cd' }, ctx.gX, glyphs(c));
  }
  mk('text', { x: 44, y: 328, class: 'legend' }, ctx.gX, '← DAH ARM');
  mk('text', { x: 496, y: 328, 'text-anchor': 'end', class: 'legend' }, ctx.gX, 'DIT ARM →');
  return ctx;
}

export const CHARTS = { tree: buildTree, pathway: buildPathway };

// The chart plus the number/punctuation strip, and the lighting across both.
export function createBoard(svg, stripEl) {
  const cells = new Map();
  for (const ch of STRIP) {
    const d = document.createElement('div');
    d.className = 'cell';
    d.innerHTML = `<span class="l"></span><b></b><i></i>`;
    d.children[1].textContent = ch; d.children[2].textContent = glyphs(MORSE[ch]);
    stripEl.appendChild(d); cells.set(MORSE[ch], d);
  }

  let parts = null, lit = [], token = 0;
  const clear = () => { for (const n of lit) n.classList.remove('on', 'cur', 'hit', 'hold', 'bad', 'cand'); lit = []; };
  const mark = (n, ...cls) => { if (n) { n.classList.add(...cls); lit.push(n); } };

  function setChart(name) {
    clear();
    parts = CHARTS[name](svg);
  }

  function lightPath(buf, endCls = 'cur') {
    clear(); token++;
    const { leds, traces, labels } = parts;
    let deepest = null;
    for (let i = 0; i <= Math.min(buf.length, 4); i++) {
      const c = buf.slice(0, i);
      if (!leds.has(c)) break;
      deepest = c;
      mark(leds.get(c), 'on'); mark(labels.get(c), 'on');
      if (i) mark(traces.get(c), 'on');
    }
    if (deepest === buf) mark(leds.get(buf), endCls);
    if (buf.length >= 4) for (const [code, cell] of cells) if (code.startsWith(buf)) mark(cell, code === buf && endCls !== 'cur' ? endCls : 'cand');
  }

  // Clear after ms, unless something else lit up in the meantime or canClear() says no.
  function fadeLater(ms, canClear) {
    const t = ++token;
    setTimeout(() => { if (t === token && canClear()) clear(); }, ms);
  }

  return { setChart, lightPath, clear, fadeLater };
}
