let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgPlaying = false;
let bgGainNode: GainNode | null = null;
let bgBeatIndex = 0;
let bgNextBeat = 0;
let bgTimer: ReturnType<typeof setTimeout> | null = null;

function initCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.75;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return { ac: ctx, master: masterGain! };
}

function reverb(ac: AudioContext, src: AudioNode, dest: GainNode, wet = 0.2) {
  const delay = ac.createDelay(0.15);
  const g = ac.createGain();
  delay.delayTime.value = 0.07;
  g.gain.value = wet;
  const delay2 = ac.createDelay(0.15);
  const g2 = ac.createGain();
  delay2.delayTime.value = 0.13;
  g2.gain.value = wet * 0.6;
  src.connect(delay); delay.connect(g); g.connect(dest);
  src.connect(delay2); delay2.connect(g2); g2.connect(dest);
}

export function playCoin() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  const pitchVar = 1 + (Math.random() - 0.5) * 0.06;
  [[880, 'sine', 0.18], [1320, 'triangle', 0.09], [1760, 'sine', 0.05]].forEach(([freq, type, vol], i) => {
    const osc = ac.createOscillator() as OscillatorNode;
    const gain = ac.createGain();
    osc.type = type as OscillatorType;
    osc.frequency.setValueAtTime((freq as number) * pitchVar, t);
    osc.frequency.exponentialRampToValueAtTime((freq as number) * pitchVar * 1.45, t + 0.09);
    gain.gain.setValueAtTime(vol as number, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.connect(gain); gain.connect(master);
    osc.start(t); osc.stop(t + 0.24);
    if (i === 0) reverb(ac, gain, master, 0.12);
  });
  // tick click
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.018), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 80);
  const src = ac.createBufferSource();
  const cg = ac.createGain();
  src.buffer = buf; cg.gain.value = 0.12;
  src.connect(cg); cg.connect(master); src.start(t);
}

export function playJump() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  // Bass kick
  const kick = ac.createOscillator();
  const kg = ac.createGain();
  kick.type = 'sine';
  kick.frequency.setValueAtTime(140, t);
  kick.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  kg.gain.setValueAtTime(0.38, t);
  kg.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  kick.connect(kg); kg.connect(master); kick.start(t); kick.stop(t + 0.18);
  // Sweep up
  const sweep = ac.createOscillator();
  const sg = ac.createGain();
  sweep.type = 'sine';
  sweep.frequency.setValueAtTime(200, t + 0.04);
  sweep.frequency.exponentialRampToValueAtTime(980, t + 0.26);
  sg.gain.setValueAtTime(0, t);
  sg.gain.setValueAtTime(0.24, t + 0.05);
  sg.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  sweep.connect(sg); sg.connect(master); sweep.start(t + 0.04); sweep.stop(t + 0.34);
  reverb(ac, sg, master, 0.18);
}

export function playGameOver() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  // Descending chord
  [392, 330, 277, 220].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sawtooth';
    const s = t + i * 0.13;
    osc.frequency.setValueAtTime(freq, s);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.68, s + 0.4);
    g.gain.setValueAtTime(0.22, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + 0.58);
    osc.connect(g); g.connect(master); osc.start(s); osc.stop(s + 0.62);
    reverb(ac, g, master, 0.35);
  });
  // Thud
  const thud = ac.createOscillator();
  const tg = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(65, t);
  thud.frequency.exponentialRampToValueAtTime(28, t + 0.6);
  tg.gain.setValueAtTime(0.55, t);
  tg.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
  thud.connect(tg); tg.connect(master); thud.start(t); thud.stop(t + 0.8);
}

export function playLaneSwitch() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(480, t);
  osc.frequency.exponentialRampToValueAtTime(720, t + 0.07);
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + 0.13);
}

export function playSlide() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(75, t + 0.28);
  g.gain.setValueAtTime(0.14, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + 0.34);
  // whoosh noise
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.28), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.08));
  const noise = ac.createBufferSource();
  const ng = ac.createGain();
  noise.buffer = buf; ng.gain.value = 0.09;
  noise.connect(ng); ng.connect(master); noise.start(t);
}

export function playMilestone() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  [523, 659, 784, 1047, 1319].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = i < 3 ? 'square' : 'sine';
    const s = t + i * 0.1;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.14, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + 0.22);
    osc.connect(g); g.connect(master); osc.start(s); osc.stop(s + 0.25);
    reverb(ac, g, master, 0.25);
  });
}

export function playCombo(count: number) {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  const base = Math.min(440 + count * 90, 1200);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(base, t);
  osc.frequency.exponentialRampToValueAtTime(base * 1.6, t + 0.12);
  g.gain.setValueAtTime(0.16, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + 0.22);
}

export function playMagnetPickup() {
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  const t = ac.currentTime;
  [330, 440, 550, 660, 880, 1100].forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    const s = t + i * 0.055;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.13, s);
    g.gain.exponentialRampToValueAtTime(0.001, s + 0.18);
    osc.connect(g); g.connect(master); osc.start(s); osc.stop(s + 0.2);
  });
  reverb(ac, masterGain!, master, 0.0);
}

const BG_TEMPO = 0.21;
const BG_MELODY = [
  262, 330, 392, 330, 294, 370, 330, 0,
  294, 370, 440, 370, 330, 416, 370, 0,
  349, 440, 523, 440, 392, 494, 440, 0,
  330, 415, 494, 415, 370, 466, 415, 0,
];

export function startBgMusic() {
  if (bgPlaying) return;
  const r = initCtx(); if (!r) return;
  const { ac, master } = r;
  bgPlaying = true;
  bgGainNode = ac.createGain();
  bgGainNode.gain.value = 0;
  bgGainNode.connect(master);
  // fade in
  bgGainNode.gain.setValueAtTime(0, ac.currentTime);
  bgGainNode.gain.linearRampToValueAtTime(0.07, ac.currentTime + 1.5);
  bgBeatIndex = 0;
  bgNextBeat = ac.currentTime + 0.3;

  const schedule = () => {
    if (!bgPlaying || !bgGainNode) return;
    const now = ac.currentTime;
    while (bgNextBeat < now + 0.5) {
      const freq = BG_MELODY[bgBeatIndex % BG_MELODY.length];
      if (freq > 0) {
        // melody
        const osc = ac.createOscillator();
        const g = ac.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.07, bgNextBeat);
        g.gain.exponentialRampToValueAtTime(0.001, bgNextBeat + BG_TEMPO * 0.8);
        osc.connect(g); g.connect(bgGainNode); osc.start(bgNextBeat); osc.stop(bgNextBeat + BG_TEMPO);
        // bass every 4
        if (bgBeatIndex % 4 === 0) {
          const bass = ac.createOscillator();
          const bg2 = ac.createGain();
          bass.type = 'sine'; bass.frequency.value = freq / 2;
          bg2.gain.setValueAtTime(0.12, bgNextBeat);
          bg2.gain.exponentialRampToValueAtTime(0.001, bgNextBeat + BG_TEMPO * 1.9);
          bass.connect(bg2); bg2.connect(bgGainNode); bass.start(bgNextBeat); bass.stop(bgNextBeat + BG_TEMPO * 2);
        }
        // hi-hat every 2
        if (bgBeatIndex % 2 === 1) {
          const hatBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.04), ac.sampleRate);
          const hd = hatBuf.getChannelData(0);
          for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1) * Math.exp(-i / 400);
          const hat = ac.createBufferSource();
          const hg = ac.createGain();
          hat.buffer = hatBuf; hg.gain.value = 0.04;
          hat.connect(hg); hg.connect(bgGainNode); hat.start(bgNextBeat);
        }
      }
      bgNextBeat += BG_TEMPO;
      bgBeatIndex++;
    }
    bgTimer = setTimeout(schedule, 80);
  };
  schedule();
}

export function stopBgMusic() {
  bgPlaying = false;
  if (bgTimer) { clearTimeout(bgTimer); bgTimer = null; }
  if (bgGainNode && ctx) {
    const now = ctx.currentTime;
    bgGainNode.gain.setValueAtTime(bgGainNode.gain.value, now);
    bgGainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    setTimeout(() => { bgGainNode = null; }, 700);
  }
}

export function setMasterVolume(vol: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, vol));
}
