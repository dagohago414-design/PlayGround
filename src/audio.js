import { storageGet, storageSet } from './utils.js';

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.enabled = storageGet('wildbound.audio', true);
    this.mode = 'field';
    this._nextNote = 0;
    this._step = 0;
    this._timer = null;
    this._melody = 0;
  }

  init() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.enabled ? 0.5 : 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    this.master.connect(comp).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;
    this.bus.connect(this.master);

    this.delay = ctx.createDelay(1.0);
    this.delay.delayTime.value = 0.29;
    this.feedback = ctx.createGain();
    this.feedback.gain.value = 0.3;
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.22;
    this.delay.connect(this.feedback).connect(this.delay);
    this.delay.connect(this.wet).connect(this.bus);

    this._noise = this._makeNoise(1.2);
    this._pad();
    this._nextNote = ctx.currentTime + 0.25;
    this._timer = setInterval(() => this._schedule(), 110);
    this.setMode(this.mode, true);
  }

  _makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  _pad() {
    const ctx = this.ctx;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.035;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.5;
    padGain.connect(filter).connect(this.bus);
    const freqs = [130.81, 164.81, 196.0];
    this.padOscs = freqs.map((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f;
      osc.detune.value = (i - 1) * 6;
      const g = ctx.createGain();
      g.gain.value = 0.5;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.06 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.2;
      lfo.connect(lfoGain).connect(g.gain);
      osc.connect(g).connect(padGain);
      osc.start();
      lfo.start();
      return { osc, gain: g };
    });
    this.padGain = padGain;
    this.padFilter = filter;
  }

  setMode(mode, force = false) {
    if (this.mode === mode && !force) return;
    this.mode = mode;
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (mode === 'battle') {
      this.padGain.gain.setTargetAtTime(0.055, t, 0.5);
      this.padFilter.frequency.setTargetAtTime(1500, t, 0.5);
      this.padOscs[0].osc.frequency.setTargetAtTime(110, t, 0.6);
      this.padOscs[1].osc.frequency.setTargetAtTime(138.59, t, 0.6);
      this.padOscs[2].osc.frequency.setTargetAtTime(164.81, t, 0.6);
    } else {
      this.padGain.gain.setTargetAtTime(0.035, t, 0.8);
      this.padFilter.frequency.setTargetAtTime(900, t, 0.8);
      this.padOscs[0].osc.frequency.setTargetAtTime(130.81, t, 0.8);
      this.padOscs[1].osc.frequency.setTargetAtTime(164.81, t, 0.8);
      this.padOscs[2].osc.frequency.setTargetAtTime(196.0, t, 0.8);
    }
  }

  _schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const battle = this.mode === 'battle';
    const tempo = battle ? 128 : 74;
    const stepDur = 60 / tempo / 2;
    while (this._nextNote < ctx.currentTime + 0.34) {
      this._playStep(this._step, this._nextNote, stepDur, battle);
      this._step++;
      this._nextNote += stepDur;
    }
  }

  _playStep(step, time, dur, battle) {
    const base = battle ? 220 : 261.63;
    const scale = battle ? [0, 3, 5, 7, 10, 12, 15] : [0, 2, 4, 7, 9, 12, 14, 16];
    const chordRoots = battle ? [0, -2, 3, -2] : [0, 5, 9, 7];
    const bar = Math.floor(step / 8) % 4;
    if (step % 8 === 0) {
      this._chord(time, base * Math.pow(2, chordRoots[bar] / 12), battle ? 0.055 : 0.042, dur * (battle ? 5 : 9), battle);
    }
    if (battle) {
      if (step % 2 === 0) this._bass(time, base * Math.pow(2, (chordRoots[bar] + (step % 8 === 6 ? 7 : 0)) / 12), dur * 0.9, 0.1);
      if (step % 4 === 2) this._perc(time, 0.06);
      if (step % 8 === 4) this._perc(time, 0.09, 160);
      const melodyChance = step % 4 === 0 || step % 8 === 6 ? 0.55 : 0.12;
      if (Math.random() < melodyChance) {
        const idx = Math.floor(Math.random() * scale.length);
        const oct = Math.random() < 0.18 ? 2 : 1;
        this._pluck(time, base * Math.pow(2, (scale[idx] + (oct - 1) * 12) / 12) * 2, dur * 1.4, 0.055, 'triangle');
      }
    } else {
      if (step % 16 === 0) this._bass(time, base * Math.pow(2, chordRoots[bar] / 12) / 2, dur * 3, 0.055);
      const melodyChance = step % 8 === 0 ? 0.7 : step % 4 === 0 ? 0.26 : 0.06;
      if (Math.random() < melodyChance) {
        const idx = Math.floor(Math.random() * scale.length);
        this._pluck(time, base * Math.pow(2, scale[idx] / 12) * 2, dur * 2.1, 0.04 + Math.random() * 0.025, 'sine');
      }
    }
  }

  _pluck(time, freq, dur, vol, type = 'triangle') {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g);
    g.connect(this.bus);
    g.connect(this.delay);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  _bass(time, freq, dur, vol) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(vol, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(g).connect(this.bus);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }

  _chord(time, root, vol, dur, minor) {
    const intervals = minor ? [0, 3, 7, 10] : [0, 4, 7, 11];
    intervals.forEach((semi, i) => {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = root * Math.pow(2, semi / 12) * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.linearRampToValueAtTime(vol / (i + 1.5), time + 0.09);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      osc.connect(g).connect(this.bus);
      osc.start(time);
      osc.stop(time + dur + 0.1);
    });
  }

  _perc(time, vol, freq = 260) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq * 4;
    filter.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    src.connect(filter).connect(g).connect(this.bus);
    src.start(time, Math.random(), 0.1);
  }

  sfx(name, variation = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + 0.01;
    if (name === 'click') {
      this._pluck(t, 720, 0.07, 0.09, 'triangle');
    } else if (name === 'open') {
      [523, 659, 784].forEach((f, i) => this._pluck(t + i * 0.05, f, 0.18, 0.07, 'sine'));
    } else if (name === 'encounter') {
      [392, 523, 659, 784].forEach((f, i) => this._pluck(t + i * 0.075, f, 0.24, 0.09, 'triangle'));
    } else if (name === 'hit') {
      this._noiseHit(t, variation, 0.14);
      this._bass(t, 120 - variation * 14, 0.16, 0.12);
    } else if (name === 'superhit') {
      this._noiseHit(t, 2, 0.2);
      [180, 260, 380].forEach((f, i) => this._pluck(t + i * 0.03, f, 0.22, 0.09, 'sawtooth'));
    } else if (name === 'weak') {
      this._noiseHit(t, -1, 0.08);
    } else if (name === 'heal') {
      [523, 659, 784, 1046].forEach((f, i) => this._pluck(t + i * 0.075, f, 0.34, 0.06, 'sine'));
    } else if (name === 'throw') {
      this._whoosh(t, 0.24);
    } else if (name === 'wobble') {
      this._pluck(t, 330, 0.13, 0.1, 'sine');
      this._pluck(t + 0.1, 392, 0.13, 0.07, 'sine');
    } else if (name === 'success') {
      [523, 659, 784, 1046, 1318].forEach((f, i) => this._pluck(t + i * 0.085, f, 0.5, 0.09, 'triangle'));
      [261, 329, 392].forEach((f, i) => this._bass(t + i * 0.12, f, 0.5, 0.05));
    } else if (name === 'fail') {
      [392, 349, 311, 262].forEach((f, i) => this._pluck(t + i * 0.11, f, 0.28, 0.07, 'triangle'));
    } else if (name === 'faint') {
      [392, 330, 262, 196].forEach((f, i) => this._pluck(t + i * 0.13, f, 0.42, 0.07, 'sawtooth'));
    } else if (name === 'levelup') {
      [523, 587, 659, 784, 880, 1046].forEach((f, i) => this._pluck(t + i * 0.09, f, 0.4, 0.08, 'triangle'));
    } else if (name === 'victory') {
      [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => this._pluck(t + i * 0.12, f, 0.5, 0.085, 'triangle'));
    } else if (name === 'step') {
      this._noiseHit(t, 0, 0.025);
    }
  }

  _noiseHit(time, variant, vol) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800 + variant * 300, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + 0.18);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);
    src.connect(filter).connect(g).connect(this.bus);
    src.start(time, Math.random(), 0.3);
  }

  _whoosh(time, dur) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(2400, time + dur * 0.8);
    filter.Q.value = 1.4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(0.13, time + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter).connect(g).connect(this.bus);
    src.start(time, Math.random(), dur + 0.1);
  }

  toggle() {
    this.enabled = !this.enabled;
    storageSet('wildbound.audio', this.enabled);
    if (this.ctx) {
      if (this.enabled) this.ctx.resume?.();
      this.master.gain.setTargetAtTime(this.enabled ? 0.5 : 0, this.ctx.currentTime, 0.08);
    }
    return this.enabled;
  }
}
