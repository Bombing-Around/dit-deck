// Sidetone: one always-running oscillator gated by a gain node.

const state = { hz: 620, sound: true };
let ac = null, osc = null, gain = null, primed = false, keepAlive = null;
let onStatus = () => {};

// 0.25 s of 8-bit silence. An unmuted <audio> element playing moves iOS into the
// "playback" session, so Web Audio is no longer muted by the ringer switch.
const SILENT_WAV = (() => {
  const n = 2000, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  let s = ''; for (const x of b) s += String.fromCharCode(x);
  return 'data:audio/wav;base64,' + btoa(s);
})();

const status = () => onStatus();

// True when sound is on but the browser hasn't let the context start yet.
export const audioBlocked = () => !!(state.sound && ac && ac.state !== 'running');

export function ensureAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {}
  if (!ac) {
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      osc = ac.createOscillator(); gain = ac.createGain();
      osc.type = 'sine'; osc.frequency.value = state.hz; gain.gain.value = 0;
      osc.connect(gain).connect(ac.destination); osc.start();
      ac.onstatechange = status;
    } catch { ac = null; return; }
  }
  if (ac.state !== 'running') ac.resume().then(status, status);
  if (!primed) {
    primed = true;
    try { const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(ac.destination); s.start(0); } catch {}
  }
  try {
    if (!keepAlive) { keepAlive = new Audio(SILENT_WAV); keepAlive.loop = true; keepAlive.setAttribute('playsinline', ''); }
    if (keepAlive.paused && !document.hidden) keepAlive.play().catch(() => {});
  } catch {}
  status();
}

export function installAudio(statusCallback) {
  onStatus = statusCallback;
  // Touch pointerdown doesn't grant audio activation on iOS/WebKit; these events do.
  for (const ev of ['pointerup', 'touchend', 'click', 'keydown']) document.addEventListener(ev, ensureAudio, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && keepAlive) keepAlive.pause(); });
}

export function tone(on) {
  if (!ac) return;
  const t = ac.currentTime;
  gain.gain.cancelScheduledValues(t);
  gain.gain.setTargetAtTime(on && state.sound ? 0.22 : 0, t, 0.004);
}

export function setPitch(hz) {
  state.hz = hz;
  if (osc) osc.frequency.setTargetAtTime(hz, ac.currentTime, 0.01);
}

export const soundOn = () => state.sound;
export function setSound(on) { state.sound = on; status(); }
