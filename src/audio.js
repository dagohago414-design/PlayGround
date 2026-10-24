export class AudioEngine {
  constructor() {
    this.ctx = null
    this.master = null
    this.musicGain = null
    this.muted = false
    this.musicTimer = null
    this.step = 0
    this.nextTime = 0
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume()
      return
    }
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    this.ctx = new Ctx()
    this.master = this.ctx.createGain()
    this.master.gain.value = this.muted ? 0 : 0.85
    this.master.connect(this.ctx.destination)
    this.musicGain = this.ctx.createGain()
    this.musicGain.gain.value = 0.14
    this.musicGain.connect(this.master)
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) this.master.gain.setTargetAtTime(muted ? 0 : 0.85, this.ctx.currentTime, 0.05)
  }

  tone(freq, duration, { type = 'sine', gain = 0.2, slide = 0, delay = 0, dest = null, attack = 0.01 } = {}) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + duration)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(gain, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(g)
    g.connect(dest || this.master)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  }

  noise(duration, { gain = 0.2, delay = 0, filter = 1200 } = {}) {
    if (!this.ctx) return
    const t = this.ctx.currentTime + delay
    const rate = this.ctx.sampleRate
    const buffer = this.ctx.createBuffer(1, rate * duration, rate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const src = this.ctx.createBufferSource()
    src.buffer = buffer
    const bq = this.ctx.createBiquadFilter()
    bq.type = 'lowpass'
    bq.frequency.setValueAtTime(filter, t)
    bq.frequency.exponentialRampToValueAtTime(200, t + duration)
    const g = this.ctx.createGain()
    g.gain.value = gain
    src.connect(bq)
    bq.connect(g)
    g.connect(this.master)
    src.start(t)
  }

  click() {
    this.tone(660, 0.07, { type: 'triangle', gain: 0.12, slide: 180 })
  }

  select() {
    this.tone(720, 0.08, { type: 'triangle', gain: 0.14 })
    this.tone(1080, 0.12, { type: 'sine', gain: 0.09, delay: 0.05 })
  }

  step() {
    this.noise(0.06, { gain: 0.045, filter: 700 })
  }

  encounter() {
    ;[523, 659, 880, 1046].forEach((f, i) => this.tone(f, 0.16, { type: 'square', gain: 0.06, delay: i * 0.08 }))
    this.noise(0.4, { gain: 0.08, filter: 2200 })
  }

  hit(type = 'normal') {
    const base = { fire: 180, water: 300, grass: 240, electric: 420, rock: 120, flying: 360, normal: 200 }[type] || 200
    this.noise(0.22, { gain: 0.22, filter: 1800 })
    this.tone(base, 0.2, { type: 'sawtooth', gain: 0.15, slide: -base * 0.6 })
    this.tone(base * 2, 0.12, { type: 'square', gain: 0.06, delay: 0.02, slide: -base * 0.4 })
  }

  weak() {
    this.tone(220, 0.18, { type: 'triangle', gain: 0.1, slide: -60 })
  }

  heal() {
    ;[523, 659, 783, 1046].forEach((f, i) => this.tone(f, 0.3, { type: 'sine', gain: 0.12, delay: i * 0.09 }))
  }

  throwOrb() {
    this.tone(380, 0.24, { type: 'sine', gain: 0.1, slide: 520 })
    this.noise(0.12, { gain: 0.05, filter: 1400 })
  }

  shake() {
    this.tone(540, 0.08, { type: 'square', gain: 0.07 })
    this.noise(0.08, { gain: 0.08, filter: 900 })
  }

  catchSuccess() {
    ;[523, 659, 783, 1046, 1318].forEach((f, i) => this.tone(f, 0.32, { type: 'triangle', gain: 0.14, delay: i * 0.1 }))
  }

  catchFail() {
    ;[420, 360, 300].forEach((f, i) => this.tone(f, 0.16, { type: 'square', gain: 0.1, delay: i * 0.12 }))
  }

  victory() {
    const notes = [523, 659, 783, 1046, 783, 1046, 1318]
    notes.forEach((f, i) => this.tone(f, 0.25, { type: 'triangle', gain: 0.13, delay: i * 0.1 }))
    notes.forEach((f, i) => this.tone(f / 2, 0.25, { type: 'sine', gain: 0.06, delay: i * 0.1 }))
  }

  levelUp() {
    ;[659, 880, 1046, 1318].forEach((f, i) => this.tone(f, 0.2, { type: 'sine', gain: 0.1, delay: i * 0.07 }))
  }

  startMusic() {
    this.init()
    if (!this.ctx || this.musicTimer) return
    this.nextTime = this.ctx.currentTime + 0.15
    this.step = 0
    const melody = [
      523.25, 659.25, 783.99, 659.25, 587.33, 783.99, 880, 783.99,
      659.25, 783.99, 987.77, 783.99, 587.33, 659.25, 783.99, 587.33
    ]
    const bass = [130.81, 110, 87.31, 98]
    const beat = 0.22
    const schedule = () => {
      if (!this.ctx) return
      while (this.nextTime < this.ctx.currentTime + 0.4) {
        const s = this.step
        const bar = Math.floor(s / 16) % 4
        const note = melody[s % 16]
        if (s % 4 === 0) {
          this.tone(bass[bar], 0.7, { type: 'sine', gain: 0.09, delay: this.nextTime - this.ctx.currentTime, dest: this.musicGain, attack: 0.04 })
          this.tone(bass[bar] * 2.5, 0.6, { type: 'triangle', gain: 0.025, delay: this.nextTime - this.ctx.currentTime, dest: this.musicGain })
        }
        if (s % 2 === 0 || s % 8 === 3) {
          this.tone(note, 0.34, { type: 'triangle', gain: 0.06, delay: this.nextTime - this.ctx.currentTime, dest: this.musicGain, attack: 0.02 })
        }
        if (s % 8 === 6) {
          this.tone(note * 2, 0.22, { type: 'sine', gain: 0.025, delay: this.nextTime - this.ctx.currentTime, dest: this.musicGain })
        }
        this.nextTime += beat
        this.step++
      }
      this.musicTimer = setTimeout(schedule, 180)
    }
    schedule()
  }

  stopMusic() {
    if (this.musicTimer) clearTimeout(this.musicTimer)
    this.musicTimer = null
  }
}
