(() => {
  const {
      TAU,
      oval,
      line,
      glow,
      path
    } = G,
    COLORS = {
      food: '#c5d391',
      reef: '#d6b998',
      prism: '#9ccded',
      vent: '#81daca',
      toxin: '#dc8483',
      shore: '#e8bf79'
    };
  function spriteSite(c, k, x, y, z, t) {
    c.save();
    c.translate(x, y);
    c.scale(z, z);
    const col = COLORS[k] || '#e9ba75';
    if (k === 'food') {
      const r = G.rng(1925),
        g = c.createRadialGradient(-1, -1, .3, 0, 0, 9);
      g.addColorStop(0, 'rgba(211,214,135,.24)');
      g.addColorStop(1, 'rgba(137,181,117,0)');
      oval(c, 0, 0, 9, 9, 0, g);
      for (let j = 0; j < 13; j++) {
        const a = r() * TAU,
          d = r() * 5.7,
          xx = Math.cos(a) * d,
          yy = Math.sin(a) * d,
          sz = 1 + r() * 2.3;
        c.beginPath();
        c.ellipse(xx, yy, sz, sz * .74, a, 0, TAU);
        c.fillStyle = j % 3 ? 'rgba(132,165,102,.80)' : 'rgba(181,177,109,.83)';
        c.fill();
        c.strokeStyle = 'rgba(213,229,160,.80)';
        c.lineWidth = .33;
        c.stroke();
        oval(c, xx - .25, yy - .3, sz * .38, sz * .24, a, '#e1d39a');
      }
    } else if (k === 'prism' || k === 'reef') {
      const r = G.rng(k === 'reef' ? 315 : 155),
        stone = k === 'reef';
      oval(c, 1, 3, 7.5, 2.7, -.1, 'rgba(7,29,31,.4)');
      for (let j = 0; j < 7; j++) {
        const dx = (r() - .5) * 8,
          dy = (r() - .5) * 4,
          ht = (stone ? 2.4 : 4) + r() * (stone ? 3.2 : 6),
          wd = 1 + r() * 2,
          lean = (r() - .4) * 2;
        path(c, [[dx - wd, dy + 2], [dx - wd * .8, dy - ht * .54], [dx + lean, dy - ht], [dx + wd, dy - ht * .4], [dx + wd * .8, dy + 1]], true);
        c.fillStyle = stone ? '#ab9d88' : '#78aaa9';
        c.fill();
        path(c, [[dx + lean, dy - ht], [dx + wd, dy - ht * .4], [dx + wd * .8, dy + 1], [dx, dy + 2]], true);
        c.fillStyle = stone ? '#726e64' : '#457789';
        c.fill();
        line(c, dx + lean, dy - ht, dx - wd * .7, dy - ht * .5, stone ? '#e2c2a1' : '#c1e6e0', .5);
      }
    } else if (k === 'vent' || k === 'toxin') {
      const danger = k === 'toxin',
        r = G.rng(danger ? 41 : 96);
      glow(c, 0, 0, 11, danger ? 'rgba(201,112,138,.24)' : 'rgba(108,210,185,.24)');
      for (let j = 0; j < (danger ? 9 : 5); j++) {
        const a = r() * TAU,
          rad = r() * 5,
          px = Math.cos(a) * rad,
          py = Math.sin(a) * rad;
        if (danger) {
          const sz = 1.5 + r() * 2;
          oval(c, px, py, sz, sz * .78, a, 'rgba(193,121,143,.45)');
          oval(c, px - .2, py - .3, sz * .38, sz * .3, 0, '#dcb1bc');
        } else {
          c.beginPath();
          for (let i = 0; i <= 14; i++) {
            const u = i / 14,
              b = a + u * 4 + t * .19,
              d = 1 + u * 5;
            const xx = px * .28 + Math.cos(b) * d,
              yy = py * .28 + Math.sin(b) * d * .68 - u * 2;
            if (i) c.lineTo(xx, yy);else c.moveTo(xx, yy);
          }
          c.strokeStyle = j % 2 ? '#91d6bd' : '#588f89';
          c.lineWidth = .48;
          c.stroke();
        }
      }
      if (!danger) oval(c, 0, 0, 1.2, 1.2, 0, '#ccdfaa');
    } else if (k.startsWith('tribe')) {
      building(c, {
        k: 'camp'
      }, 0, 0, .86, G.hash(k));
    } else {
      c.strokeStyle = '#e1c494';
      c.lineWidth = .65;
      c.beginPath();
      c.arc(0, 0, 6.5, 0, TAU);
      c.stroke();
      line(c, 0, -4, 0, 2, '#d4b984', .75);
      path(c, [[0, -4], [4, -3], [0, -1]], true);
      c.fillStyle = '#e8c685';
      c.fill();
    }
    c.restore();
  }
  function building(c, b, x, y, z, seed) {
    c.save();
    c.translate(x, y);
    c.scale(z, z);
    const h = G.hash(seed, b.k),
      tall = ['reactor', 'lab', 'school', 'relay', 'mind', 'portal'].includes(b.k),
      farm = ['farm', 'biomech'].includes(b.k);
    oval(c, 4, 3, 11, 4, -.18, 'rgba(7,21,25,.42)');
    if (b.k === 'camp' || b.k === 'colony') {
      for (let j = 0; j < 3; j++) {
        const dx = [-6, 5, 1][j],
          dy = [0, -1, 4][j],
          sz = b.k === 'colony' ? 1.2 : 1;
        path(c, [[dx - 4 * sz, dy + 1], [dx, dy - 6 * sz], [dx + 4 * sz, dy + .5], [dx + 1, dy + 2]], true);
        c.fillStyle = j % 2 ? '#cbaf83' : '#b58261';
        c.fill();
        path(c, [[dx, dy - 6 * sz], [dx + 4 * sz, dy + .5], [dx + 1, dy + 2]], true);
        c.fillStyle = '#796950';
        c.fill();
        line(c, dx, dy - 6 * sz, dx - 1, dy + 1, '#e1cda3', .5);
      }
      oval(c, -2, 3, 1, 1, 0, '#efbd76');
    } else if (b.k === 'yard' || b.k === 'mill' || b.k === 'machine') {
      path(c, [[-9, 3], [-5, -2], [6, -3], [10, 1], [6, 4], [-6, 5]], true);
      c.fillStyle = '#819787';
      c.fill();
      for (let i = 0; i < 4; i++) {
        line(c, -6 + i * 3, 3, -6 + i * 3, -6 - i % 2 * 3, '#d1b28e', 1.4);
        line(c, -6 + i * 3, -6 - i % 2 * 3, -3 + i * 3, -7, '#b6c4a7', 1.1);
      }
      oval(c, 1, -4, 3, 2, 0, '#546b64');
    } else if (farm) {
      for (let j = 0; j < 6; j++) {
        const dx = (j % 3 - 1) * 4,
          dy = (j >> 1) * 4;
        line(c, dx, dy, dx - 2, dy - 6, '#accca1', 1.7);
        oval(c, dx - 2, dy - 5, 3, 1.7, -.6, '#a3c78b');
      }
    } else if (b.k === 'portal') {
      c.strokeStyle = '#93dfd6';
      c.lineWidth = 2.8;
      c.beginPath();
      c.ellipse(0, -6, 6, 10, -.2, 0, TAU);
      c.stroke();
      glow(c, 0, -6, 13, 'rgba(110,235,209,.38)');
    } else {
      const n = tall ? 2 : 3;
      for (let j = 0; j < n; j++) {
        const xx = (j - (n - 1) / 2) * 5,
          ht = (tall ? 10 : 3) + (h >>> j * 4 & 5);
        path(c, [[xx - 4, 2], [xx - 4, -ht], [xx, -ht - 4], [xx + 4, -ht + 1], [xx + 4, 3], [xx, 5]], true);
        c.fillStyle = j % 2 ? '#96b9ac' : '#b7c7aa';
        c.fill();
        path(c, [[xx, -ht - 4], [xx + 4, -ht + 1], [xx + 4, 3], [xx, 5]], true);
        c.fillStyle = '#45625c';
        c.fill();
        line(c, xx - 2, -ht + 1, xx - 2, -ht + 4, '#f8ce85', 1.4);
      }
    }
    c.restore();
  }
  function ship(c, x, y, z, angle, organic, t) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(z, z);
    glow(c, -11, 0, 19, 'rgba(110,218,211,.38)');
    path(c, [[-9, -2], [-19 - Math.sin(t * 8) * 3, 0], [-9, 2]], true);
    c.fillStyle = '#96dbca';
    c.fill();
    if (organic) {
      G.specimen(c, 0, 0, 12, 0, 193, {
        fin: 1
      }, t, false);
    } else {
      path(c, [[15, 0], [-9, -8], [-5, -2], [-12, 0], [-5, 2], [-9, 8]], true);
      c.fillStyle = '#e5d2a6';
      c.fill();
      path(c, [[11, 0], [-7, 1], [-9, 8]], true);
      c.fillStyle = '#799c96';
      c.fill();
      oval(c, 1, 0, 3.5, 1.5, 0, '#72c7c5');
    }
    c.restore();
  }
  class Renderer {
    constructor(canvas) {
      this.el = canvas;
      this.c = canvas.getContext('2d', {
        alpha: false
      });
      this.tex = new Map();
      this.siteSprites = new Map();
      this.heroFrames = new Map();
      this.heroKey = "";
      this.sprites = new Map();
      this.W = 0;
      this.H = 0;
      this.z = 1;
      this.lod = 1;
      this.budget = 100;
      this.ms = 0;
      this.drawn = 0;
      this.particles = Array.from({
        length: 120
      }, () => ({
        x: 0,
        y: 0,
        r: 1
      }));
      this.pseed = -1;
      this.pulseAt = -100;
    }
    metrics() {
      const box = this.el.getBoundingClientRect(),
        W = Math.max(1, Math.round(box.width)),
        H = Math.max(1, Math.round(box.height)),
        dpr = Math.min(devicePixelRatio || 1, this.lod === 0 ? 1 : 1.65);
      if (this.W !== W || this.H !== H || this.dpr !== dpr) {
        this.W = W;
        this.H = H;
        this.dpr = dpr;
        this.el.width = Math.round(W * dpr);
        this.el.height = Math.round(H * dpr);
      }
      this.c.setTransform(dpr, 0, 0, dpr, 0, 0);
      return [W, H];
    }
    texture(p) {
      if (!this.tex.has(p.seed)) {
        if (this.tex.size >= 14) this.tex.delete(this.tex.keys().next().value);
        const n = p.id === 0 ? 448 : 352;
        this.tex.set(p.seed, G.terrainCanvas(p, this.terrainProvider ? 96 : n));
        if (this.terrainProvider) this.terrainProvider(p, n);
      }
      return this.tex.get(p.seed);
    }
    animal(seed, genes, bad, land) {
      const key = [seed, JSON.stringify(genes), bad, land].join('/');
      if (!this.sprites.has(key)) {
        if (this.sprites.size >= 80) this.sprites.delete(this.sprites.keys().next().value);
        const el = document.createElement('canvas');
        el.width = 170;
        el.height = 100;
        const c = el.getContext('2d');
        if (land) G.creature(c, 88, 50, 36, 0, seed, genes, 0, bad);else G.specimen(c, 90, 50, 46, 0, seed, genes, 0, false, bad);
        this.sprites.set(key, el);
      }
      return this.sprites.get(key);
    }
    drawSite(k, x, y, zoom, time) {
      if (!this.siteSprites.has(k)) {
        const tile = document.createElement('canvas');
        tile.width = tile.height = 80;
        spriteSite(tile.getContext('2d'), k, 40, 40, 3.5, 0);
        this.siteSprites.set(k, tile);
      }
      const pulse = k === 'vent' || k === 'toxin' ? 1 + .055 * Math.sin(time * 2 + x * .011) : 1;
      const size = 80 * zoom * pulse / 3.5;
      this.c.drawImage(this.siteSprites.get(k), x - size / 2, y - size / 2, size, size);
    }
    drawHero(s, planet, x, y, time) {
      const cell = s.era === 0;
      const key = [cell, planet.seed, ...G.traits.map(k => s.genes[k])].join('/');
      if (key !== this.heroKey) {
        this.heroKey = key;
        this.heroFrames.clear();
      }
      const phase = Math.floor(time * 6) % 12;
      if (!this.heroFrames.has(phase)) {
        const tile = document.createElement('canvas');
        tile.width = 220;
        tile.height = 134;
        const c = tile.getContext('2d');
        const t = phase * Math.PI * 2 / (12 * (cell ? 1.8 : 4));
        if (cell) G.specimen(c, 125, 67, 52, 0, planet.seed, s.genes, t, true);
        else G.creature(c, 125, 67, 45, 0, planet.seed, s.genes, t);
        this.heroFrames.set(phase, tile);
      }
      const scale = cell ? this.z * 10.2 / 52 : this.z * 11.2 / 45;
      const c = this.c;
      c.save();
      c.translate(x, y);
      c.rotate(s.loc.angle);
      c.scale(scale, scale);
      c.drawImage(this.heroFrames.get(phase), -125, -67);
      c.restore();
    }
    mapXY(s, x, y) {
      return [this.W / 2 + G.delta(s.loc.x, x) * this.z, this.H / 2 + G.delta(s.loc.y, y) * this.z];
    }
    fromScreen(s, x, y) {
      return {
        x: G.mod(s.loc.x + (x - this.W / 2) / this.z, 1024),
        y: G.mod(s.loc.y + (y - this.H / 2) / this.z, 1024)
      };
    }
    dust(seed, t, micro) {
      const c = this.c,
        W = this.W,
        H = this.H;
      if (this.pseed !== seed) {
        const r = G.rng(seed);
        for (const p of this.particles) {
          p.x = r();
          p.y = r();
          p.r = .45 + r() * 1.6;
        }
        this.pseed = seed;
      }
      for (let i = 0; i < this.budget; i++) {
        const p = this.particles[i],
          x = G.mod(p.x * W + t * (micro ? 2.1 : .3) * p.r, W),
          y = G.mod(p.y * H + t * .58 * p.r, H);
        oval(c, x, y, p.r * (micro ? 1.1 : .65), p.r * .66, i, 'rgba(181,214,183,' + (micro ? .30 : .52) + ')');
      }
    }
    draw(s, t, lang, quality = 'auto') {
      const start = performance.now();
      if (quality !== 'auto') this.lod = quality === 'low' ? 0 : 2;
      const [W, H] = this.metrics();
      if (W < 3 || H < 3) return;
      const c = this.c,
        p = G.body(s),
        w = G.world(s),
        ground = s.loc.scope === 'ground',
        micro = ground && s.era === 0;
      this.budget = this.lod === 0 ? 32 : this.lod === 1 ? 65 : 110;
      this.z = ground ? micro ? G.clamp(Math.min(W, H) / 162, 1.8, 3.6) : G.clamp(Math.min(W, H) / 292, 1.25, 2.2) : G.clamp(Math.min(W, H) / 395, .85, 1.8);
      c.fillStyle = ground ? '#142d2e' : '#101b24';
      c.fillRect(0, 0, W, H);
      if (ground) {
        const tex = this.texture(p),
          tile = 1024 * this.z,
          ox = W / 2 - s.loc.x * this.z,
          oy = H / 2 - s.loc.y * this.z;
        c.globalAlpha = micro ? .27 : 1;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
          const x = ox + i * tile,
            y = oy + j * tile;
          if (x < W && x + tile > 0 && y < H && y + tile > 0) c.drawImage(tex, x, y, tile + .5, tile + .5);
        }
        c.globalAlpha = 1;
        if (micro) {
          glow(c, W * .42, H * .4, Math.max(W, H) * .68, 'rgba(64,125,111,.31)');
          this.filaments(p, s, t);
        } else {
          this.vegetation(p, s);
          const weather = G.environment(p, s.loc.x, s.loc.y, w, s.tick).weather;
          if (weather === 'mist') glow(c, W * .55, H * .48, Math.max(W, H) * .55, 'rgba(191,206,181,.18)');
          if (weather === 'rain' || weather === 'snow' || weather === 'wind') {
            const r = G.rng(p.seed + 778);
            for (let i = 0; i < (this.lod ? 52 : 18); i++) {
              const x = G.mod(r() * W + t * (weather === 'wind' ? 65 : 23), W),
                y = G.mod(r() * H + t * (weather === 'snow' ? 12 : 75), H);
              if (weather === 'snow') oval(c, x, y, 1.4, 1, 0, 'rgba(211,228,219,.46)');else line(c, x, y, x + (weather === 'wind' ? 10 : 2), y + (weather === 'wind' ? 1 : 9), 'rgba(173,205,194,.23)', .85);
            }
          }
        }
        this.dust(p.seed, t, micro);
        for (const a of G.points(p)) {
          if (a.k.startsWith('tribe') && s.era < 2 || a.k === 'shore' && s.era === 0) continue;
          const [x, y] = this.mapXY(s, a.x, a.y);
          if (x < -16 || x > W + 16 || y < -16 || y > H + 16) continue;
          c.globalAlpha = G.siteReady(w, a) ? 1 : .30;
          this.drawSite(a.k, x, y, this.z * (micro ? 1.13 : 1), t);
          c.globalAlpha = 1;
        }
        const allies = w.kin.slice(1);
        for (const pop of allies) {
          const [x, y] = this.mapXY(s, pop.x, pop.y);
          c.strokeStyle = 'rgba(191,217,157,.5)';
          c.setLineDash([2, 5]);
          c.beginPath();
          c.arc(x, y, 12 * this.z, 0, TAU);
          c.stroke();
          c.setLineDash([]);
        }
        if (s.era >= 3 && G.count(w, 'road')) {
          for (let i = 1; i < w.buildings.length; i++) {
            const b = w.buildings[i],
              a = w.buildings[i - 1],
              u = this.mapXY(s, a.x, a.y),
              v = this.mapXY(s, b.x, b.y);
            if (Math.abs(u[0] - v[0]) < this.W * .8) line(c, ...u, ...v, 'rgba(223,203,145,.65)', this.z * 1.2);
          }
        }
        for (const b of w.buildings) {
          const [x, y] = this.mapXY(s, b.x, b.y);
          if (x > -30 && x < W + 30 && y > -40 && y < H + 40) building(c, b, x, y, this.z, p.seed);
        }
        for (const a of s.actors) {
          const [x, y] = this.mapXY(s, a.x, a.y);
          if (x < -45 || x > W + 45 || y < -40 || y > H + 40) continue;
          const genes = w.pops[a.pop % w.pops.length].genes,
            bad = a.role === 'hunter',
            el = this.animal(p.seed + a.id % 6, genes, bad, !micro),
            z = this.z * (bad ? .33 : .19);
          c.save();
          c.translate(x, y);
          c.rotate(a.angle);
          c.globalAlpha = a.stun ? .55 : .92;
          c.drawImage(el, -90 * z, -50 * z, 170 * z, 100 * z);
          c.restore();
        }
        if (s.era < 3) this.drawHero(s, p, W / 2, H / 2, t);
        else this.rover(s, W / 2, H / 2, t);
      } else this.space(s, t, lang);
      if (s.era === 5) {
        const r = (ground ? 24 : 28) * this.z;
        c.save();
        c.translate(W / 2, H / 2);
        c.rotate(t * .23);
        c.strokeStyle = 'rgba(148,217,203,.46)';
        c.lineWidth = .7;
        for (let i = 0; i < 3; i++) {
          c.rotate(TAU / 3);
          c.beginPath();
          c.ellipse(0, 0, r, r * .42, 0, .3, 2.45);
          c.stroke();
          oval(c, r * Math.cos(.3), r * .42 * Math.sin(.3), 1.6, 1.6, 0, '#b9d9b5');
        }
        c.restore();
      }
      if (s.nav) {
        const [x, y] = this.mapXY(s, s.nav.x, s.nav.y);
        c.setLineDash([3, 8]);
        line(c, W / 2, H / 2, x, y, 'rgba(225,218,158,.47)', 1);
        c.setLineDash([]);
        this.reticle(x, y, 10, '#e4c586');
      }
      this.reticle(W / 2, H / 2, (ground ? 17 : 19) * this.z, 'rgba(225,225,185,.65)');
      if (t - this.pulseAt < 1.4) {
        c.strokeStyle = 'rgba(150,235,214,' + (1 - (t - this.pulseAt) / 1.4) + ')';
        c.beginPath();
        c.arc(W / 2, H / 2, Math.max(0, (t - this.pulseAt) * 58 * this.z), 0, TAU);
        c.stroke();
      }
      const vignette = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .23, W / 2, H / 2, Math.max(W, H) * .7);
      vignette.addColorStop(0, 'rgba(5,14,18,0)');
      vignette.addColorStop(1, 'rgba(5,14,18,.53)');
      c.fillStyle = vignette;
      c.fillRect(0, 0, W, H);
      this.ms = this.ms * .92 + (performance.now() - start) * .08;
      this.drawn++;
      if (quality === 'auto' && this.drawn % 90 === 0) this.lod = this.ms > 16 ? 0 : this.ms < 7 ? 2 : 1;
    }
    reticle(x, y, r, col) {
      const c = this.c;
      c.lineWidth = 1;
      c.strokeStyle = col;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.arc(x, y, r, (i + .12) * Math.PI / 2, (i + .36) * Math.PI / 2);
        c.stroke();
      }
    }
    filaments(p, s, t) {
      const c = this.c,
        r = G.rng(p.seed + 850);
      for (let i = 0; i < (this.lod ? 55 : 25); i++) {
        const a = {
            x: 512 + (r() - .5) * 390,
            y: 512 + (r() - .5) * 310
          },
          [x, y] = this.mapXY(s, a.x, a.y),
          z = this.z,
          f = r() * 5,
          sz = r() * 4 + 2;
        if (x < -60 || y < -60 || x > this.W + 60 || y > this.H + 60) continue;
        c.save();
        c.translate(x, y);
        c.rotate(f);
        c.strokeStyle = 'rgba(134,191,157,.18)';
        c.lineWidth = z * .4;
        c.beginPath();
        c.ellipse(0, 0, sz * z, sz * .38 * z, 0, 0, TAU);
        c.stroke();
        for (let j = -2; j <= 2; j++) line(c, j * sz * z * .35, -sz * z * .23, j * sz * z * .35 + Math.sin(t * .3 + f), sz * z * .23, 'rgba(148,186,149,.16)', .8);
        c.restore();
      }
    }
    vegetation(p, s) {
      const c = this.c,
        z = this.z,
        step = 22,
        nx = Math.ceil(this.W / (2 * z * step)) + 2,
        ny = Math.ceil(this.H / (2 * z * step)) + 2,
        ax = Math.floor(s.loc.x / step),
        ay = Math.floor(s.loc.y / step);
      for (let yy = -ny; yy <= ny; yy++) for (let xx = -nx; xx <= nx; xx++) {
        const gx = G.mod(ax + xx, 47),
          gy = G.mod(ay + yy, 47),
          h = G.hash(p.seed, gx, gy);
        if ((h & 3) > (this.lod ? 1 : 0)) continue;
        const x = (gx + h % 69 / 85) * 1024 / 47,
          y = (gy + (h >>> 8 & 63) / 80) * 1024 / 47,
          ht = G.terrain(p, x, y);
        if (ht < .50) continue;
        const [sx, sy] = this.mapXY(s, x, y),
          n = 3 + (h >>> 16 & 3),
          sz = z * (2 + (h >>> 20 & 3));
        line(c, sx, sy + 1, sx - 1, sy - sz * 1.9, '#536654', z);
        for (let j = 0; j < n; j++) {
          const a = j * 2.4 + (h & 15);
          oval(c, sx + Math.cos(a) * sz * .48, sy - sz + Math.sin(a) * sz * .5, sz * .65, sz * .30, a, p.temp < 5 ? '#a8b9aa' : '#91a57f');
        }
      }
    }
    rover(s, x, y, t) {
      const c = this.c,
        z = this.z;
      c.save();
      c.translate(x, y);
      c.rotate(s.loc.angle);
      oval(c, 0, 0, 7 * z, 4 * z, 0, '#d8c393');
      for (const a of [-1, 1]) for (const b of [-1, 1]) oval(c, a * 4 * z, b * 4 * z, 2.4 * z, 1.3 * z, 0, '#354547');
      line(c, 0, 0, 8 * z, 0, '#6fafa6', 2 * z);
      c.restore();
    }
    space(s, t, lang) {
      const c = this.c,
        W = this.W,
        H = this.H,
        z = this.z,
        sy = G.system(s.seed, s.loc.sid);
      glow(c, W * .36, H * .42, Math.max(W, H) * .8, 'rgba(47,82,88,.38)');
      this.dust(sy.seed, t, false);
      const [sx, syy] = this.mapXY(s, 512, 512),
        sun = sy.star === 'blue' ? '#abd6e8' : sy.star === 'red' ? '#ed987d' : '#f2cf8b';
      glow(c, sx, syy, 46 * z, 'rgba(242,185,111,.40)');
      oval(c, sx, syy, 10 * z, 10 * z, 0, sun);
      for (const b of G.bodies(s.seed, s.loc.sid, s.artificial[s.loc.sid] || [])) {
        const p = G.planet(s.seed, s.loc.sid, b.id),
          [x, y] = this.mapXY(s, b.x, b.y);
        c.strokeStyle = 'rgba(160,181,172,.13)';
        c.beginPath();
        c.arc(sx, syy, Math.hypot(b.x - 512, b.y - 512) * z, 0, TAU);
        c.stroke();
        if (x < -65 || x > W + 65 || y < -65 || y > H + 65) continue;
        G.planetDisc(c, x, y, b.r * z, p, this.texture(p));
        c.fillStyle = '#d3dccb';
        c.textAlign = 'center';
        c.font = '11px ui-monospace, monospace';
        c.fillText(b.name, x, y + b.r * z + 14);
        for (const [m, moon] of G.satellites(p).entries()) {
          const a = moon.phase + t / moon.period,
            d = (b.r + 5 + m * 3) * z;
          oval(c, x + Math.cos(a) * d, y + Math.sin(a) * d, moon.radius * z, moon.radius * z, 0, '#bdc9b9');
        }
      }
      const site = G.anomalySite(s.seed, s.loc.sid),
        [ax, ay] = this.mapXY(s, site.x, site.y);
      c.save();
      c.translate(ax, ay);
      c.rotate(t * .09);
      for (let j = 0; j < 4; j++) {
        c.rotate(.59);
        c.strokeStyle = j % 2 ? 'rgba(189,159,208,.56)' : 'rgba(138,206,192,.57)';
        c.beginPath();
        c.ellipse(0, 0, (10 + j) * z, (2 + j) * z, 0, 0, TAU);
        c.stroke();
      }
      c.restore();
      const st = s.stations[s.loc.sid];
      if (st) {
        const [x, y] = this.mapXY(s, st.x, st.y);
        building(c, {
          k: 'lab'
        }, x, y, z, sy.seed);
      }
      if (s.rings[s.loc.sid]) {
        c.strokeStyle = '#e8c78a';
        c.lineWidth = 2.2 * z;
        c.beginPath();
        c.ellipse(sx, syy, 22 * z, 6 * z, -.4, 0, TAU);
        c.stroke();
      }
      ship(c, W / 2, H / 2, z, s.loc.angle, s.ship.hull === 'organic', t);
    }
  }
  Object.assign(G, {
    Renderer,
    spriteSite,
    building,
    ship,
    COLORS
  });
})();
