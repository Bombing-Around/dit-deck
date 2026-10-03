import { MORSE, glyphs } from './morse.js';

// t: term. d: definition. s: short meaning for the tape gloss (on-air terms only).
// send: text to key when played. code: one unbroken run of marks (a prosign). m: tape words that match.
export const GLOSSARY = [
  { group: 'On the air', note: 'Shorthand you\'ll hear in a real contact, roughly in the order it turns up.', air: true, terms: [
    { t: 'CQ', s: 'calling anyone', d: 'Calling anyone. A general call inviting any station to answer, usually sent a few times: CQ CQ DE <callsign> K.' },
    { t: 'DE', s: 'from / this is', d: 'From, or "this is". Comes right before the sender\'s callsign.' },
    { id: 'callsign', t: 'Callsign', d: 'A station\'s unique ID, issued with a license (W1AW, G4ABC). Sent after DE. In the sample, the card signs as DIT DECK.', send: null },
    { t: 'K', s: 'over, go ahead', d: 'Over, go ahead. Hands the turn to anyone listening. It ends almost every transmission, which is why the sample finishes on K.' },
    { t: 'KN', code: '-.--.', s: 'over, only you', d: 'Prosign: over, but only the station I\'m talking with should reply.' },
    { t: 'BK', s: 'break, back to you', d: 'Break. A quick handover in a fast back-and-forth, without repeating callsigns.' },
    { t: 'R', s: 'received', d: 'Received, understood (Roger). Not a request to repeat.' },
    { t: 'RST', s: 'signal report', m: ['RST', '599', '5NN'], send: 'RST 599', d: 'Signal report: Readability 1-5, Strength 1-9, Tone 1-9. 599 means perfect and is the usual default, often sent as 5NN.' },
    { t: 'UR', s: 'your / you\'re', d: 'Your, or you\'re. UR RST 599 = your signal report is 599.' },
    { t: 'ES', s: 'and', d: 'And. Shorter than AND, and has a nice rhythm.' },
    { t: 'OP', s: 'operator', d: 'Operator. OP IS SAM = my name is Sam. NAME is also common.' },
    { t: 'QTH', s: 'location', d: 'Location. QTH IS DENVER = I\'m in Denver.' },
    { t: 'QRS', s: 'please send slower', d: 'Please send slower. Every learner\'s friend: nobody minds being asked.' },
    { t: 'QRZ', s: 'who is calling me?', d: 'Who is calling me? Sent when you heard someone answer but didn\'t catch the callsign.' },
    { t: 'QSL', s: 'confirmed', d: 'I confirm receipt. Also the postcard hams swap to confirm a contact.' },
    { t: 'QSO', s: 'a contact', d: 'A contact or conversation between two stations.' },
    { t: 'FB', s: 'great', d: 'Fine business: great, excellent. FB OM = great, old man (friend).' },
    { t: 'TU', s: 'thank you', m: ['TU', 'TNX'], d: 'Thank you. TNX (thanks) is also common.' },
    { t: 'HI', s: 'laughter', d: 'Laughter. HI HI is the CW version of "haha".' },
    { t: 'GM GA GE', s: 'good morning / afternoon / evening', m: ['GM', 'GA', 'GE'], d: 'Good morning, good afternoon, good evening.' },
    { t: '73', s: 'best regards', d: 'Best regards. The standard friendly sign-off. Never "73s".' },
    { t: '88', s: 'love and kisses', d: 'Love and kisses. Sent to family and close friends.' },
    { t: 'AR', code: '.-.-.', s: 'end of message', d: 'Prosign: end of message. Often sent just before K.' },
    { t: 'SK', code: '...-.-', s: 'end of contact', d: 'Prosign: end of contact. Signing off for good with this station.' },
    { t: 'BT', code: '-...-', s: 'break / pause', m: ['='], d: 'Prosign: break, like a new paragraph between thoughts. It decodes as = on the tape.' },
    { t: 'SOS', code: '...---...', s: 'distress', d: 'Distress. Sent as one unbroken run, not as three letters. Never send it on the air unless it\'s real.' },
  ]},
  { group: 'Learning the code', note: 'Words this card and most Morse courses use.', terms: [
    { t: 'Dit', code: '.', d: 'The short mark, one unit long, written ·. Say it "dit", or just "di" inside a letter: K is dah-di-dah.' },
    { t: 'Dah', code: '-', d: 'The long mark, three units long, written −.' },
    { t: 'Unit', d: 'The basic beat. A dit is 1 unit and a dah is 3. Gaps are 1 unit inside a letter, 3 between letters, and 7 between words. The card shows the current unit length along its bottom edge.' },
    { t: 'WPM', send: 'PARIS', d: 'Words per minute, using PARIS (exactly 50 units) as the standard word. One unit in ms = 1200 ÷ WPM, so at 12 wpm a unit is 100 ms. Press ▶ to hear PARIS.' },
    { t: 'CW', send: 'CW', d: 'Continuous wave: what hams call Morse sent over the radio. "Working CW" = talking in Morse.' },
    { t: 'Prosign', code: '.-.-.', d: 'Two letters keyed together with no letter gap, so they act as a single symbol. Written with a bar over them, like AR, SK, KN and BT. ▶ plays AR.' },
    { id: 'koch', t: 'Koch method', d: 'Learn at full speed from the start. Begin with two characters and add one each time you copy 90% correctly. The Drill uses Koch order, which is why it starts on K and M.' },
    { t: 'Copy', d: 'What you receive and write down. "Solid copy" means you got all of it. The paper tape is your copy.' },
    { t: 'Head copy', d: 'Decoding by ear without writing anything down. Blind copy blurs the tape so you have to listen.' },
    { t: 'Sidetone', d: 'The tone you hear while you key, so you can hear your own sending. VR2 sets its pitch.' },
    { t: 'Straight key', d: 'The simplest key: a single on/off lever, and you time every dit and dah by hand. The big round button is one.' },
  ]},
  { group: 'On this card', note: 'The card is laid out like a circuit board, so its labels are printed like part numbers.', terms: [
    { t: 'Lit path', d: 'As you key, LEDs light from START along the path your dits and dahs trace. The bright one is where you are now. When you pause, the letter is decoded and printed on the tape.' },
    { t: 'Pathway / Tree', d: 'JP1 picks the chart. Pathway: dahs run left from START, dits run right, and branches drop down. Tree: each dit steps up, each dah steps down, one column per mark.' },
    { t: 'Number strip', d: 'Numbers and punctuation have 5 or 6 marks, too many for the chart, so they live on the strip below it.' },
    { t: 'SW · VR · JP · LED · U · BZ', d: 'Parts-style labels. SW = switches (SW1 is the key), VR = knobs (VR1 speed, VR2 tone), JP = jumper (JP1 picks the chart), LED1 = signal, LED2 = decode error, U2 = the decode readout, BZ1 = buzzer.' },
  ]},
];

const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const g of GLOSSARY) for (const e of g.terms) {
  e.id = 'g-' + (e.id || slug(e.t));
  if (e.send === undefined && !e.code && g.air) e.send = e.t;
}

// Code shown under a term: one run for prosigns, letter by letter otherwise.
const shown = e => e.code ? glyphs(e.code)
  : e.send ? e.send.split(' ').map(w => [...w].map(c => glyphs(MORSE[c])).join(' ')).join(' / ') : '';

export function renderGlossary(el, onPlay) {
  for (const g of GLOSSARY) {
    const sec = document.createElement('div'); sec.className = 'g-group';
    const h = document.createElement('h3'); h.textContent = g.group;
    const n = document.createElement('p'); n.className = 'note'; n.textContent = g.note;
    const dl = document.createElement('dl'); dl.className = 'g-list';
    for (const e of g.terms) {
      const it = document.createElement('div'); it.className = 'g-item'; it.id = e.id;
      const dt = document.createElement('dt');
      const term = document.createElement('span'); term.className = 'g-term' + (e.code && e.code.length > 1 ? ' ps' : ''); term.textContent = e.t;
      dt.append(term);
      if (e.code || e.send) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'g-play';
        b.textContent = '▶'; b.setAttribute('aria-label', 'Play ' + e.t);
        b.addEventListener('click', () => onPlay(e));
        dt.append(b);
      }
      it.append(dt);
      const cd = shown(e);
      if (cd) { const c = document.createElement('dd'); c.className = 'g-code'; c.textContent = cd; it.append(c); }
      const d = document.createElement('dd'); d.textContent = e.d; it.append(d);
      dl.append(it);
    }
    sec.append(h, n, dl);
    el.append(sec);
  }
}

// Tape words → on-air terms found in them, in order, each once.
const AIR = new Map();
for (const g of GLOSSARY) if (g.air) for (const e of g.terms) if (e.s) for (const w of e.m || [e.t]) AIR.set(w, e);

export function glossWords(words) {
  const out = [], seen = new Set();
  const add = (w, s, id) => { if (!seen.has(id)) { seen.add(id); out.push({ w, s, id }); } };
  for (let i = 0; i < words.length; i++) {
    const e = AIR.get(words[i]);
    if (!e) continue;
    add(words[i], e.s, e.id);
    // Unknown words right after DE are the sender's callsign.
    if (words[i] === 'DE') {
      let j = i + 1;
      while (j < words.length && !AIR.has(words[j])) j++;
      if (j > i + 1) add(words.slice(i + 1, j).join(' '), 'sender\'s callsign', 'g-callsign');
    }
  }
  // Lone K or R on their own are usually just practice letters.
  return out.some(x => x.w.length > 1) ? out : [];
}
