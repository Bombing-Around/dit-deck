export const MORSE = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',
  N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',
  '.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-'};
export const REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
export const KOCH = ['K','M','U','R','E','S','N','A','P','T','L','W','I','.','J','Z','=','F','O','Y',',','V','G','5','/','Q','9','2','H','3','8','B','?','4','7','C','1','D','6','0','X'];
export const STRIP = ['1','2','3','4','5','6','7','8','9','0','.',',','?','/','='];

// Display glyphs for a code: middle dot and minus sign.
export const glyphs = code => code.replace(/\./g, '·').replace(/-/g, '−');

// Key events ({t, down}) for sending text. unit is in ms; gap stretches the
// spaces between letters and words (Farnsworth) and defaults to standard spacing.
export function textToEvents(text, unit, gap = unit) {
  const ev = []; let t = 0;
  const words = text.toUpperCase().split(/\s+/).map(w => [...w].filter(c => MORSE[c])).filter(w => w.length);
  words.forEach((w, wi) => {
    w.forEach((ch, ci) => {
      [...MORSE[ch]].forEach((e, ei) => {
        if (ei) t += unit;
        ev.push({ t, down: 1 }); t += e === '.' ? unit : 3 * unit; ev.push({ t, down: 0 });
      });
      if (ci < w.length - 1) t += 3 * gap;
    });
    if (wi < words.length - 1) t += 7 * gap;
  });
  return ev;
}

// Key events for one unbroken run of marks, like a prosign.
export function codeToEvents(code, unit) {
  const ev = []; let t = 0;
  [...code].forEach((e, i) => {
    if (i) t += unit;
    ev.push({ t, down: 1 }); t += e === '.' ? unit : 3 * unit; ev.push({ t, down: 0 });
  });
  return ev;
}

// Gap unit in ms for characters at c wpm with an overall (effective) speed of s wpm. ARRL Farnsworth formula.
export const farnsworthGap = (c, s) => s >= c ? 1200 / c : 1000 * (60 * c - 37.2 * s) / (s * c * 19);

// Copy practice material: common English words plus everyday on-air words.
export const WORDS = ['THE','AND','YOU','THAT','WAS','FOR','ARE','WITH','HIS','THEY','THIS','HAVE','FROM','ONE','HAD','WORD','BUT','NOT',
  'WHAT','ALL','WERE','WHEN','WE','THERE','CAN','YOUR','WHICH','SAID','EACH','SHE','DO','HOW','IF','WILL','UP','OTHER','ABOUT','OUT',
  'MANY','THEN','THEM','SO','SOME','HER','WOULD','MAKE','LIKE','INTO','TIME','HAS','LOOK','TWO','MORE','GO','SEE','NO','WAY','COULD',
  'MY','THAN','FIRST','WATER','CALL','WHO','NOW','FIND','LONG','DOWN','DAY','DID','GET','COME','MADE','MAY','PART',
  'CQ','DE','TU','73','RST','599','QTH','NAME','RIG','ANT','WX','HR','UR','ES','FB','OM','PSE','AGN','QSL','QRS','TNX','GM','GE'];
