import { MORSE, REV, KOCH, WORDS, glyphs, textToEvents, codeToEvents, farnsworthGap } from './morse.js';
import { renderGlossary, glossWords } from './glossary.js';
import { CHARTS, createBoard } from './chart.js';
import { installAudio, ensureAudio, audioBlocked, tone, setPitch, soundOn, setSound } from './audio.js';

const $ = s => document.querySelector(s);

let wpm = 12;
const U = () => 1200 / wpm;

/* ---------- chart ---------- */
const board = createBoard($('#tree'), $('#strip'));
let chart = 'pathway';
function setChart(name) {
  if (!CHARTS[name]) name = 'pathway';
  chart = name;
  board.setChart(name);
  document.querySelectorAll('[data-chart]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.chart === name)));
  try { localStorage.setItem('ditdeck.chart', name); } catch {}
}

/* ---------- audio ---------- */
installAudio(() => { $('#swSnd').dataset.blocked = audioBlocked() ? '1' : ''; });

/* ---------- decoder ---------- */
const keyEl = $('#key'), sigLed = $('#sigLed'), errLed = $('#errLed');
const roCode = $('#roCode'), roChar = $('#roChar');
let buf = '', isDown = false, downAt = 0, pressDecode = false, pressSrc = 'user', gapT = 0, wordT = 0;

function renderRO(code, ch) {
  roCode.textContent = code ? glyphs(code) : '—';
  roChar.textContent = ch || (code ? '…' : '·');
  roCode.classList.toggle('idle', !code);
  roChar.classList.toggle('idle', !ch);
}

function keyDown(on) {
  tone(on);
  sigLed.classList.toggle('on', on);
  keyEl.classList.toggle('down', on);
}

function press(src) {
  if (src === 'user') { if (playing) stopPlay(); ensureAudio(); dismissSample(); }
  if (isDown) return;
  isDown = true; downAt = performance.now();
  pressSrc = src;
  pressDecode = src === 'user' || !!(playing && playing.decode);
  clearTimeout(gapT); clearTimeout(wordT);
  keyDown(true);
  if (rec.on && src === 'user') recPush(1);
}
function release(src) {
  if (!isDown) return;
  isDown = false;
  keyDown(false);
  if (rec.on && src === 'user') recPush(0);
  if (!pressDecode) return;
  const dur = performance.now() - downAt;
  buf += dur < 2 * U() ? '.' : '-';
  board.lightPath(buf);
  renderRO(buf, REV[buf]);
  renderTape();
  gapT = setTimeout(commit, 2.5 * U());
}
function commit() {
  const code = buf; buf = '';
  if (!code) return;
  const ch = REV[code];
  const idle = () => !buf && !isDown;
  if (ch) {
    tape.push({ c: ch });
    board.lightPath(code, 'hit'); board.fadeLater(750, idle);
  } else {
    tape.push({ c: '✕', err: true });
    board.lightPath(code, 'bad'); board.fadeLater(750, idle);
    errLed.classList.add('on'); setTimeout(() => errLed.classList.remove('on'), 500);
  }
  if (tape.length > 400) tape.splice(0, tape.length - 400);
  renderRO(code, ch || '✕');
  renderTape();
  drillCheck(ch || null, code, pressSrc);
  wordT = setTimeout(() => {
    if (tape.length && tape[tape.length - 1].c !== ' ') { tape.push({ c: ' ' }); renderTape(); }
  }, 3.5 * U());
}
function hardReset() {
  clearTimeout(gapT); clearTimeout(wordT);
  buf = ''; board.clear(); renderRO('', '');
}

/* ---------- tape ---------- */
const tapeEl = $('#tapeText');
const tape = [];
function renderTape() {
  const frag = document.createDocumentFragment();
  let run = '';
  const flush = () => { if (run) { frag.append(run); run = ''; } };
  for (const t of tape) {
    if (t.err) { flush(); const s = document.createElement('span'); s.className = 'err'; s.textContent = t.c; frag.append(s); }
    else run += t.c;
  }
  flush();
  if (buf) { const s = document.createElement('span'); s.className = 'pend'; s.textContent = glyphs(buf); frag.append(s); }
  const caret = document.createElement('span'); caret.className = 'caret'; frag.append(caret);
  tapeEl.replaceChildren(frag);
  renderGloss();
}
// Chips explaining any on-air shorthand in the copy. Hidden in blind copy so it can't give the game away.
const glossEl = $('#gloss');
function renderGloss() {
  const words = tape.filter(t => !t.err).map(t => t.c).join('').split(/\s+/).filter(Boolean).slice(-40);
  const found = $('#paper').classList.contains('blind') ? [] : glossWords(words);
  glossEl.replaceChildren(...found.map(f => {
    const a = document.createElement('a'); a.className = 'chip'; a.href = '#' + f.id;
    const b = document.createElement('b'); b.textContent = f.w;
    a.append(b, f.s);
    return a;
  }));
  glossEl.hidden = !found.length;
}
const wordBreak = () => { if (tape.length && tape[tape.length - 1].c !== ' ') tape.push({ c: ' ' }); };
let sample = true;
function endSample() { sample = false; $('#sampleTag').hidden = $('#sampleNote').hidden = true; }
function dismissSample() {
  if (!sample) return;
  endSample();
  tape.length = 0; hardReset(); renderTape();
}

/* ---------- player ---------- */
let playing = null, timers = [];
function play(events, { decode = true, onDone } = {}) {
  stopPlay();
  if (!events.length) return;
  ensureAudio();
  playing = { decode };
  setBusy(true);
  for (const ev of events) timers.push(setTimeout(() => ev.down ? press('play') : release('play'), ev.t));
  timers.push(setTimeout(() => { playing = null; timers = []; setBusy(false); onDone && onDone(); }, events[events.length - 1].t + 20));
}
function stopPlay() {
  timers.forEach(clearTimeout); timers = [];
  if (!playing) return;
  if (isDown) { isDown = false; keyDown(false); }
  playing = null; setBusy(false);
}
function setBusy(on) {
  $('#swPlay').setAttribute('aria-pressed', String(on));
}

/* ---------- recorder ---------- */
const rec = { on: false, ev: [], take: [], t0: null, label: '' };
function recPush(down) {
  const now = performance.now();
  if (rec.t0 == null) { if (!down) return; rec.t0 = now; }
  rec.take.push({ t: now - rec.t0, down });
}
function recLabel() {
  const n = rec.ev.filter(e => e.down).length;
  const s = rec.ev.length ? (rec.ev[rec.ev.length - 1].t / 1000).toFixed(1) : 0;
  $('#recInfo').textContent = rec.on ? 'Recording… key away' : rec.ev.length ? `${rec.label} · ${n} marks · ${s} s` : 'Nothing recorded';
  $('#swPlay').disabled = rec.on || !rec.ev.length;
}
function setRec(on) {
  if (on) { stopPlay(); rec.on = true; rec.take = []; rec.t0 = null; }
  else {
    if (rec.take.length && rec.take[rec.take.length - 1].down) rec.take.push({ t: performance.now() - rec.t0, down: 0 });
    if (rec.take.length) { rec.ev = rec.take; rec.label = 'Your take'; }
    rec.on = false;
  }
  $('#swRec').setAttribute('aria-pressed', String(rec.on));
  recLabel();
}
// Sample take: "SOS" keyed by a slightly uneven hand
(() => {
  const jit = [1.08, .92, 1.1, .95, 1.04, .9, 1.12, .97, 1.06, .93, 1.02, 1.09, .94, 1.05, .91, 1.1, .96, 1.03];
  let i = 0, prev = 0, t = 0;
  rec.ev = textToEvents('SOS', U()).map(e => { const d = (e.t - prev) * jit[i++ % jit.length]; prev = e.t; t += d; return { t: Math.round(t), down: e.down }; });
  rec.label = 'Sample · SOS';
})();

/* ---------- drill ---------- */
const D = { on: false, mode: 'see', level: 6, target: 'K', prev: null, streak: 0, right: 0, tries: 0, lock: false };
const tgtCh = $('#tgtCh'), tgtCd = $('#tgtCd'), dres = $('#dres');
function say(msg, cls = '') { dres.textContent = msg; dres.className = 'dres ' + cls; }
function renderTarget(reveal) {
  tgtCh.textContent = D.mode === 'hear' && !reveal ? '?' : D.target;
  tgtCd.textContent = reveal ? glyphs(MORSE[D.target]) : '';
}
function renderStats() {
  $('#stStreak').textContent = D.streak;
  $('#stTries').textContent = D.tries;
  $('#stAcc').textContent = D.tries ? Math.round(100 * D.right / D.tries) + '%' : '—';
}
function renderLevel() {
  $('#levelN').textContent = D.level;
  $('#levelOut').textContent = KOCH.slice(0, D.level).join(' ');
}
const sound = t => play(textToEvents(t, U()), { decode: false });
function dNext() {
  const pool = KOCH.slice(0, D.level);
  let t;
  do t = pool[Math.floor(Math.random() * pool.length)]; while (pool.length > 1 && t === D.prev);
  D.target = D.prev = t; D.lock = false;
  renderTarget(false);
  say(D.mode === 'hear' ? 'Listen, then key it back.' : 'Key it.');
  if (D.mode === 'hear') setTimeout(() => { if (D.on && D.target === t && !D.lock) sound(t); }, 350);
}
function drillCheck(ch, code, src) {
  if (!D.on || D.lock || src !== 'user') return;
  D.tries++; D.lock = true;
  if (ch === D.target) {
    D.right++; D.streak++;
    renderTarget(true);
    say(`${D.target} ${glyphs(code)} · correct`, 'ok');
    setTimeout(() => D.on && dNext(), 700);
  } else {
    D.streak = 0;
    renderTarget(true);
    say(`You sent ${ch ?? 'no character'} ${glyphs(code)}. ${D.target} is ${glyphs(MORSE[D.target])}.`, 'bad');
    const t = D.target;
    setTimeout(() => {
      if (!D.on || D.target !== t) return;
      D.lock = false; renderTarget(false); say('Try again.');
      if (D.mode === 'hear') sound(t);
    }, 1600);
  }
  renderStats();
}
function setDrill(on) {
  D.on = on;
  $('#drillBtn').textContent = on ? 'Stop' : 'Start';
  $('#replayBtn').hidden = !(on && D.mode === 'hear');
  if (on) { if (SP.on) setSpeed(false); D.streak = D.right = D.tries = 0; renderStats(); ensureAudio(); dismissSample(); dNext(); }
  else { D.lock = false; stopPlay(); say('Stopped. Press Start to go again.'); renderTarget(true); }
}

/* ---------- speed run ---------- */
const SP = { on: false, kind: 'letters', char: 18, wpm: 10, best: 0, ans: '', prev: null, run: 0, right: 0, tries: 0, lock: true, t: 0 };
try { Object.assign(SP, JSON.parse(localStorage.getItem('ditdeck.speed')) || {}); } catch {}
const spSave = () => { try { localStorage.setItem('ditdeck.speed', JSON.stringify({ char: SP.char, wpm: SP.wpm, best: SP.best })); } catch {} };
const spIn = $('#spIn'), spRes = $('#spRes'), spTimer = $('#spTimer');
const pick = a => a[Math.floor(Math.random() * a.length)];
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PFX = ['K', 'W', 'N', 'AA', 'KD', 'KJ', 'WB', 'VE', 'G', 'M', 'DL', 'F', 'JA', 'VK', 'EA', 'ON', 'PA', 'OH', 'SM', 'I'];
const callsign = () => pick(PFX) + Math.floor(Math.random() * 10) + Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => pick(ABC)).join('');
function spItem() {
  const pool = KOCH.slice(0, D.level);
  if (SP.kind === 'groups') return Array.from({ length: 5 }, () => pick(pool)).join('');
  if (SP.kind === 'words') return pick(WORDS);
  if (SP.kind === 'calls') return callsign();
  let t;
  do t = pick(pool); while (pool.length > 1 && t === SP.prev);
  return t;
}
const spChar = () => Math.max(SP.char, SP.wpm);
// A lone letter has no gaps to stretch, so a clock sets the pace: one character's share of a minute at this speed.
const spWindow = () => 60000 / (5 * SP.wpm);
const spEvents = () => { const c = spChar(); return textToEvents(SP.ans, 1200 / c, farnsworthGap(c, SP.wpm)); };
function renderSpeed() {
  $('#spWpm').textContent = SP.wpm;
  $('#spMx').textContent = SP.kind === 'letters'
    ? `characters at ${spChar()} wpm · ${(spWindow() / 1000).toFixed(1)} s to answer`
    : spChar() > SP.wpm ? `characters at ${spChar()} wpm, gaps stretched to ${SP.wpm}` : `characters and gaps at ${SP.wpm} wpm`;
  $('#spStreak').textContent = SP.run;
  $('#spAcc').textContent = SP.tries ? Math.round(100 * SP.right / SP.tries) + '%' : '—';
  $('#spBest').textContent = SP.best ? SP.best + ' wpm' : '—';
}
function spSay(msg, cls = '') { spRes.textContent = msg; spRes.className = 'dres ' + cls; }
function spTimerStart() {
  const bar = spTimer.firstElementChild, ms = spWindow();
  bar.style.transition = 'none'; bar.style.transform = 'scaleX(1)';
  void bar.offsetWidth; // restart the transition
  bar.style.transition = `transform ${ms}ms linear`; bar.style.transform = 'scaleX(0)';
  spTimer.classList.add('run');
  SP.t = setTimeout(() => spCheck(''), ms);
}
function spListen() {
  clearTimeout(SP.t); spTimer.classList.remove('run');
  play(spEvents(), { decode: false, onDone: () => { if (SP.on && !SP.lock && SP.kind === 'letters') spTimerStart(); } });
}
function spNext() {
  if (!SP.on) return;
  SP.ans = SP.prev = spItem(); SP.lock = false;
  spIn.value = ''; spIn.focus();
  spSay('Listen…');
  spListen();
}
function spCheck(typed) {
  if (!SP.on || SP.lock) return;
  SP.lock = true; clearTimeout(SP.t); spTimer.classList.remove('run');
  const got = typed.toUpperCase().replace(/\s+/g, ''), was = SP.wpm;
  SP.tries++;
  if (got === SP.ans) {
    SP.right++; SP.best = Math.max(SP.best, was);
    if (++SP.run % 3 === 0 && SP.wpm < 40) SP.wpm++;
    spSay(`${SP.ans} · correct${SP.wpm > was ? ` · up to ${SP.wpm} wpm` : ''}`, 'ok');
    SP.t = setTimeout(spNext, 450);
  } else {
    SP.run = 0; SP.wpm = Math.max(5, SP.wpm - 1);
    const it = SP.ans.length === 1 ? `${SP.ans} ${glyphs(MORSE[SP.ans])}` : SP.ans;
    spSay(`${got ? `You copied ${got}.` : 'Too slow.'} It was ${it}${SP.wpm < was ? ` · down to ${SP.wpm} wpm` : ''}`, 'bad');
    // Hear it again now that you know what it was, then move on.
    SP.t = setTimeout(() => play(spEvents(), { decode: false, onDone: () => { SP.t = setTimeout(spNext, 700); } }), 400);
  }
  spSave(); renderSpeed();
}
function setSpeed(on) {
  SP.on = on; SP.lock = true;
  clearTimeout(SP.t); spTimer.classList.remove('run'); stopPlay();
  $('#spBtn').textContent = on ? 'Stop' : 'Start';
  $('#spReplay').hidden = !on;
  spIn.disabled = !on;
  if (on) { if (D.on) setDrill(false); SP.run = SP.right = SP.tries = 0; ensureAudio(); renderSpeed(); spNext(); }
  else spSay('Stopped. Press Start to go again.');
}

/* ---------- wiring ---------- */
keyEl.addEventListener('pointerdown', e => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  e.preventDefault();
  try { keyEl.setPointerCapture(e.pointerId); } catch {}
  press('user');
});
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) keyEl.addEventListener(ev, () => release('user'));
keyEl.addEventListener('contextmenu', e => e.preventDefault());

const typing = el => el && el.matches && el.matches('input[type="text"], textarea, [contenteditable="true"]');
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' || typing(e.target)) return;
  e.preventDefault();
  if (!e.repeat) press('user');
});
document.addEventListener('keyup', e => {
  if (e.code !== 'Space' || typing(e.target)) return;
  e.preventDefault();
  release('user');
});
window.addEventListener('blur', () => { if (isDown && !playing) release('user'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPlay(); if (isDown) release('user'); } });

$('#swSnd').addEventListener('click', e => {
  setSound(!soundOn());
  e.currentTarget.setAttribute('aria-pressed', String(soundOn()));
  ensureAudio(); tone(isDown);
});
$('#swRec').addEventListener('click', () => { ensureAudio(); setRec(!rec.on); });
$('#swPlay').addEventListener('click', () => {
  if (playing) { stopPlay(); return; }
  if (rec.on) setRec(false);
  dismissSample(); hardReset();
  wordBreak();
  play(rec.ev, { decode: true });
});
const clearAll = () => { stopPlay(); tape.length = 0; hardReset(); renderTape(); endSample(); };
$('#swClr').addEventListener('click', clearAll);
$('#clearBtn').addEventListener('click', clearAll);

const wpmIn = $('#wpm'), hzIn = $('#hz');
const renderTiming = () => {
  $('#wpmOut').textContent = wpm + ' wpm';
  $('#timing').textContent = `1 unit = ${Math.round(U())} ms`;
};
wpmIn.addEventListener('input', () => { wpm = +wpmIn.value; renderTiming(); });
hzIn.addEventListener('input', () => { setPitch(+hzIn.value); $('#hzOut').textContent = hzIn.value + ' Hz'; });

$('#sendBtn').addEventListener('click', () => {
  const ev = textToEvents($('#sendText').value, U());
  if (!ev.length) { $('#sendText').focus(); return; }
  dismissSample(); hardReset();
  wordBreak();
  renderTape();
  play(ev, { decode: true });
});
$('#sendText').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('#sendBtn').click(); } });
$('#stopBtn').addEventListener('click', stopPlay);

$('#blindBtn').addEventListener('click', e => {
  const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
  e.currentTarget.setAttribute('aria-pressed', String(on));
  $('#paper').classList.toggle('blind', on);
  renderGloss();
});
$('#copyBtn').addEventListener('click', e => {
  const btn = e.currentTarget, txt = tape.map(t => t.c).join('').trim();
  const done = msg => { btn.textContent = msg; setTimeout(() => { btn.textContent = 'Copy text'; }, 1600); };
  const fallback = () => {
    const r = document.createRange(); r.selectNodeContents(tapeEl);
    const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    done('Selected');
  };
  try {
    const p = navigator.clipboard && navigator.clipboard.writeText(txt);
    if (p) p.then(() => done('Copied'), fallback); else fallback();
  } catch { fallback(); }
});

document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
  D.mode = b.dataset.mode;
  document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  $('#replayBtn').hidden = !(D.on && D.mode === 'hear');
  if (D.on) { stopPlay(); dNext(); } else renderTarget(true);
}));
$('#level').max = KOCH.length;
$('#level').addEventListener('input', e => { D.level = +e.target.value; renderLevel(); if (D.on) { stopPlay(); dNext(); } });
$('#drillBtn').addEventListener('click', () => setDrill(!D.on));
$('#replayBtn').addEventListener('click', () => { if (D.on) sound(D.target); });

document.querySelectorAll('[data-sp]').forEach(b => b.addEventListener('click', () => {
  SP.kind = b.dataset.sp;
  document.querySelectorAll('[data-sp]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  renderSpeed();
  if (SP.on) { SP.lock = true; SP.run = 0; spNext(); }
}));
const spCharIn = $('#spChar');
const renderSpChar = () => { $('#spCharOut').textContent = SP.char + ' wpm'; renderSpeed(); };
spCharIn.value = SP.char;
spCharIn.addEventListener('input', () => { SP.char = +spCharIn.value; spSave(); renderSpChar(); });
spIn.addEventListener('input', () => { if (SP.kind === 'letters' && spIn.value.trim()) spCheck(spIn.value); });
spIn.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); spCheck(spIn.value); } });
$('#spBtn').addEventListener('click', () => setSpeed(!SP.on));
$('#spReplay').addEventListener('click', () => { if (SP.on && !SP.lock) { spIn.focus(); spListen(); } });

document.querySelectorAll('[data-chart]').forEach(b => b.addEventListener('click', () => {
  if (b.dataset.chart === chart) return;
  setChart(b.dataset.chart);
  if (buf) board.lightPath(buf); else if (sample) board.lightPath('-.-', 'hold');
}));

/* ---------- resting state: a sample copy with the last letter held on the chart ---------- */
let saved = null;
try { saved = localStorage.getItem('ditdeck.chart'); } catch {}
setChart(saved || 'pathway');
for (const c of 'CQ DE DIT DECK K') tape.push({ c });
renderTape();
board.lightPath('-.-', 'hold');
renderRO('-.-', 'K');
renderTiming(); renderLevel(); renderTarget(true); recLabel(); renderSpChar();
renderGlossary($('#glossList'), e => play(e.code ? codeToEvents(e.code, U()) : textToEvents(e.send, U()), { decode: false }));
