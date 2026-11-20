(() => {
  class Soundscape {
    constructor() {
      this.ctx = null;
      this.vol = .32;
      this.next = 0;
      this.note = 0;
      this.seed = 1;
    }
    async wake() {
      if (!this.vol) return;
      try {
        if (!this.ctx) {
          this.ctx = new (window.AudioContext || window.webkitAudioContext)();
          this.master = this.ctx.createGain();
          this.master.gain.value = this.vol * .32;
          this.master.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') await this.ctx.resume();
      } catch {}
    }
    volume(v) {
      this.vol = v;
      if (this.ctx) this.master.gain.setTargetAtTime(v * .32, this.ctx.currentTime, .08);
    }
    tone(f, d, t, type, amp, glide = 1) {
      if (!this.ctx || !this.vol || this.ctx.state !== 'running') return;
      const o = this.ctx.createOscillator(),
        g = this.ctx.createGain(),
        filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800 + f * .7;
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(10, f * glide), t + d);
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(amp, t + Math.min(d * .22, .16));
      g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(filter);
      filter.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + d + .015);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
        filter.disconnect();
      };
    }
    score(s, danger, field) {
      if (!this.ctx || !this.vol || this.ctx.state !== 'running' || this.ctx.currentTime < this.next) return;
      const t = this.ctx.currentTime + .025,
        era = s?.era || 0,
        seed = s ? G.hash(s.seed, s.loc.sid, s.loc.pid) : 2101;
      const root = 92.5 * Math.pow(2, seed % 9 / 12),
        scale = danger ? [0, 1, 5, 6, 10] : [0, 3, 5, 7, 10, 12, 14],
        r = G.rng(G.hash(seed, Math.floor(this.note / 8), this.note % 8));
      const n = scale[Math.floor(r() * scale.length)],
        f = root * 2 ** (n / 12);
      const step = danger ? .34 : 1.06 - era * .072;
      this.tone(f * (era >= 4 ? 2 : 1), danger ? .22 : 1.15, t, era >= 3 ? 'triangle' : 'sine', .18);
      if (this.note % 4 === 0) this.tone(root * .5, step * 3.5, t, 'sine', .22);
      if (field > .6 && this.note % 2 === 0) this.tone(f * 3, .74, t + step * .35, 'sine', .075);
      this.note++;
      this.next = t + step;
    }
    fx(code, seed = 1) {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + .01,
        h = G.hash(code, seed) % 180;
      if (['epoch', 'discovered', 'planet', 'gate'].includes(code)) {
        [1, 1.25, 1.5, 2].forEach((v, i) => this.tone((218 + h * .2) * v, .55, t + i * .11, 'sine', .24));
      } else this.tone(170 + h, .16, t, 'triangle', .16, code === 'pulse' ? .45 : 1.45);
    }
  }
  G.Soundscape = Soundscape;
})();
