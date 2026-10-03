# Dit Deck

A playable Morse code trainer card. Plain HTML, CSS, and ES modules: no build step, no dependencies beyond Google Fonts.

## Features

- **Straight key**: tap or hold the on-screen key, or hold <kbd>Space</kbd>. Web Audio sidetone plus a signal LED.
- **Live decode chart**: your path lights up as you key. Switch between two layouts with the JP1 jumper:
  - **Pathway**: the dah arm runs left of START, the dit arm runs right, and branches drop down.
  - **Tree**: a binary tree with dits branching up and dahs branching down.
- **Numbers and punctuation**: shown on a strip below the chart, lit as you key them.
- **SND / REC / PLAY / CLR**: silent LED-only mode, record raw key timing, replay it through the decoder, clear the tape.
- **Send text**: the card keys your text at the set speed. Blind-copy mode hides the tape for ear training.
- **Drill**: Koch-order practice in "see it" or "hear it" mode, with streak and accuracy.
- **Speed run**: copy by ear and type what you hear (letters, 5-character groups, words, or callsigns). Speed ramps up 1 wpm every 3 in a row and drops 1 on a miss; slower speeds use Farnsworth spacing so characters stay at least at the set character speed. Letters mode adds an answer clock. Speed and best are saved in the browser.
- **Glossary**: on-air shorthand (CQ, DE, K, 73, prosigns, Q codes), Morse basics, and the card's labels, each playable. Chips under the tape explain any shorthand in your copy.

## Timing

All thresholds scale with the speed setting (5–30 WPM, 1 unit = 1200 / WPM ms):

| Event | Threshold |
| --- | --- |
| Dit vs. dah | press shorter than 2 units is a dit |
| Letter commit | 2.5 units of silence |
| Word space | 6 units of silence |

## Run it

ES modules don't load from `file://`, so serve the folder:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000>. On GitHub Pages it deploys from `main` (Settings → Pages → deploy from branch, root).

On iOS the first tap unlocks audio. The page requests a playback audio session so the silent switch doesn't mute the tone.

## Layout

| Path | What's in it |
| --- | --- |
| `index.html` | Markup for the card, tape, and bench |
| `css/dit-deck.css` | All styles |
| `js/morse.js` | Code tables, Koch order, text-to-key-events timing |
| `js/audio.js` | Web Audio sidetone and the iOS audio unlock |
| `js/chart.js` | Pathway and tree chart drawing, plus path lighting |
| `js/glossary.js` | Glossary terms, their rendering, and the tape gloss |
| `js/main.js` | Decoder, tape, player, recorder, drill, and UI wiring |

## License

[MIT](LICENSE)
