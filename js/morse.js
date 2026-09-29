export const MORSE = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',
  N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',
  '1':'.----','2':'..---','3':'...--','4':'....-','5':'.....','6':'-....','7':'--...','8':'---..','9':'----.','0':'-----',
  '.':'.-.-.-',',':'--..--','?':'..--..','/':'-..-.','=':'-...-'};
export const REV = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]));
export const KOCH = ['K','M','U','R','E','S','N','A','P','T','L','W','I','.','J','Z','=','F','O','Y',',','V','G','5','/','Q','9','2','H','3','8','B','?','4','7','C','1','D','6','0','X'];
export const STRIP = ['1','2','3','4','5','6','7','8','9','0','.',',','?','/','='];

// Display glyphs for a code: middle dot and minus sign.
export const glyphs = code => code.replace(/\./g, '·').replace(/-/g, '−');

// Key events ({t, down}) for sending text with standard spacing. unit is in ms.
export function textToEvents(text, unit) {
  const ev = []; let t = 0;
  const words = text.toUpperCase().split(/\s+/).map(w => [...w].filter(c => MORSE[c])).filter(w => w.length);
  words.forEach((w, wi) => {
    w.forEach((ch, ci) => {
      [...MORSE[ch]].forEach((e, ei) => {
        if (ei) t += unit;
        ev.push({ t, down: 1 }); t += e === '.' ? unit : 3 * unit; ev.push({ t, down: 0 });
      });
      if (ci < w.length - 1) t += 3 * unit;
    });
    if (wi < words.length - 1) t += 7 * unit;
  });
  return ev;
}
