(() => {
  const TAU = Math.PI * 2;
  function path(c, pts, close = false) {
    c.beginPath();
    pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    if (close) c.closePath();
  }
  function oval(c, x, y, rx, ry, a, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, a, 0, TAU);
    c.fill();
  }
  function line(c, x1, y1, x2, y2, col, width = 1) {
    c.strokeStyle = col;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
  }
  function glow(c, x, y, r, inner, outer = 'rgba(0,0,0,0)') {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function membrane(c, scale, seed) {
    c.beginPath();
    for (let i = 0; i <= 112; i++) {
      const a = i / 112 * TAU,
        w = 1 + .055 * Math.sin(a * 3 + seed) + .035 * Math.cos(a * 5 - seed) + .027 * Math.sin(a * 8 + 1);
      const x = Math.cos(a) * 95 * w * scale,
        y = Math.sin(a) * (48 + 7 * Math.cos(a - .55)) * w * scale;
      if (!i) c.moveTo(x, y);else c.lineTo(x, y);
    }
    c.closePath();
  }
  function specimen(c, x, y, size, angle, seed, genes = {}, t = 0, rich = true, hostile = false) {
    const r = G.rng(seed || 9),
      phase = r() * 5,
      fin = genes.fin || 0,
      shell = genes.shell || 0,
      sense = genes.sense || 0,
      lung = genes.lung || 0,
      sym = genes.sym || 0;
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(size / 100, size / 100);
    const amber = hostile ? '#f37b68' : '#f1b66b',
      mint = hostile ? '#da785d' : '#7ccec2',
      dark = hostile ? '#382228' : '#132e2f';
    // Each flagellum is a ribbon with a second, shifted filament.
    const tails = 4 + fin * 2;
    for (let j = 0; j < tails; j++) {
      const sy = (j / (tails - 1) - .5) * 50,
        dy = (j - (tails - 1) / 2) * 9;
      for (let st = 0; st < (rich ? 2 : 1); st++) {
        c.beginPath();
        for (let i = 0; i <= 34; i++) {
          const u = i / 34,
            xx = -62 - u * (72 + fin * 12 + j * 5),
            yy = sy + dy * u + Math.sin(u * 8.2 + t * 1.8 + j * .66 + st * .4) * u * (13 + 6 * Math.sin(j)) + st * .9;
          if (!i) c.moveTo(xx, yy);else c.lineTo(xx, yy);
        }
        c.strokeStyle = st ? 'rgba(250,199,128,.53)' : j % 2 ? mint : amber;
        c.globalAlpha = st ? .7 : .52;
        c.lineWidth = st ? .68 : 1.55;
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    const quills = rich ? 95 : 28;
    for (let j = 0; j < quills; j++) {
      const a = j / quills * TAU + phase * .012,
        rr = 1 + .055 * Math.sin(a * 3 + phase) + .035 * Math.cos(a * 5 - phase) + .027 * Math.sin(a * 8 + 1),
        xx = Math.cos(a) * 95 * rr,
        yy = Math.sin(a) * (48 + 7 * Math.cos(a - .55)) * rr,
        le = 3 + r() * 9 + (j % 8 === 0 ? 9 + sense * 4 : 0);
      c.beginPath();
      c.moveTo(xx * .97, yy * .97);
      c.quadraticCurveTo(xx + Math.cos(a + .4) * le * .6, yy + Math.sin(a + .4) * le * .55, xx + Math.cos(a + .27) * le, yy + Math.sin(a + .27) * le);
      c.strokeStyle = j % 4 ? mint : amber;
      c.globalAlpha = .25 + r() * .44;
      c.lineWidth = .65 + r() * .55;
      c.stroke();
    }
    c.globalAlpha = 1;
    const g = c.createLinearGradient(-35, -53, 22, 55);
    g.addColorStop(0, hostile ? '#a75c50' : '#afc9ac');
    g.addColorStop(.12, hostile ? '#50373a' : '#41675c');
    g.addColorStop(.39, dark);
    g.addColorStop(.72, hostile ? '#42272b' : '#213e39');
    g.addColorStop(.93, '#8d7852');
    g.addColorStop(1, '#e2b86e');
    membrane(c, 1, phase);
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = mint;
    c.lineWidth = 1.6 + shell;
    c.stroke();
    c.save();
    membrane(c, .95, phase);
    c.clip();
    glow(c, 28, -7, 56, 'rgba(229,157,67,.36)');
    glow(c, -52, 2, 46, 'rgba(116,202,176,.40)');
    const strands = rich ? 39 : 12;
    for (let j = 0; j < strands; j++) {
      const a = r() * TAU,
        x1 = Math.cos(a) * 84,
        y1 = Math.sin(a) * 40,
        x2 = r() * 117 - 62,
        y2 = r() * 65 - 34;
      c.beginPath();
      c.moveTo(x1, y1);
      c.bezierCurveTo(x1 + r() * 30 - 15, y1 + r() * 19 - 10, x2 + r() * 26 - 13, y2 + r() * 20 - 10, x2, y2);
      c.strokeStyle = j % 3 ? 'rgba(194,217,170,.29)' : 'rgba(241,181,112,.48)';
      c.lineWidth = .45 + r() * .65;
      c.stroke();
    }
    for (let j = 0; j < (rich ? 270 : 38); j++) {
      const a = r() * TAU,
        rad = Math.sqrt(r()),
        xx = Math.cos(a) * 91 * rad,
        yy = Math.sin(a) * 46 * rad;
      oval(c, xx, yy, .25 + r() * 1.3, .25 + r() * .75, r() * 3, j % 4 ? 'rgba(186,222,184,.53)' : 'rgba(255,194,111,.74)');
    }
    function nucleus(nx, ny, sz) {
      glow(c, nx, ny, sz * 1.8, 'rgba(247,164,70,.39)');
      const grad = c.createRadialGradient(nx - sz * .28, ny - sz * .30, 1, nx, ny, sz);
      grad.addColorStop(0, '#ead397');
      grad.addColorStop(.34, '#ce9458');
      grad.addColorStop(.68, '#8a593d');
      grad.addColorStop(.87, '#5c5141');
      grad.addColorStop(1, '#d2ac6d');
      oval(c, nx, ny, sz, sz * .92, -.3, grad);
      c.strokeStyle = '#e5b778';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(nx, ny, sz + 2, sz * .94 + 2, -.3, 0, TAU);
      c.stroke();
      for (let i = 0; i < (rich ? 30 : 9); i++) {
        const a = r() * TAU,
          rad = sz * .77 * Math.sqrt(r());
        oval(c, nx + Math.cos(a) * rad, ny + Math.sin(a) * rad, .6 + r() * 2, .5 + r() * 1.3, r() * 4, 'rgba(86,67,46,.56)');
      }
      oval(c, nx - 3, ny + 1, sz * .29, sz * .24, -.4, '#7a5740');
      oval(c, nx - 4, ny, sz * .11, sz * .09, 0, '#f7d29b');
    }
    nucleus(28, -5, 16);
    if (lung) nucleus(-48, -7, 7 + lung);
    for (let j = 0; j < (rich ? 11 : 5) + sym; j++) {
      const a = r() * TAU,
        rad = .36 + r() * .48,
        xx = Math.cos(a) * 86 * rad,
        yy = Math.sin(a) * 46 * rad;
      if (Math.hypot(xx - 28, yy + 5) < 20) continue;
      c.save();
      c.translate(xx, yy);
      c.rotate(r() * 4);
      oval(c, 0, 0, 5 + r() * 3, 3, 0, j % 2 ? '#81ad90' : '#bea16a');
      c.beginPath();
      c.moveTo(-4, .4);
      c.lineTo(-1, -1.4);
      c.lineTo(1, 1);
      c.lineTo(4, -1);
      c.strokeStyle = dark;
      c.lineWidth = .9;
      c.stroke();
      c.restore();
    }
    c.restore();
    for (let j = 0; j < 3 + shell; j++) {
      membrane(c, .97 - j * .025, phase + j * .08);
      c.strokeStyle = j % 2 ? 'rgba(207,200,144,.55)' : 'rgba(141,210,187,.62)';
      c.lineWidth = j === 0 ? 1.5 : .7;
      c.stroke();
    }
    for (let i = 0; i < 2 + sense; i++) {
      const y0 = (i - (1 + sense) / 2) * 13;
      c.beginPath();
      c.moveTo(81, y0);
      c.quadraticCurveTo(106, y0 * 1.5, 117 + sense * 2, y0 * 2 + Math.sin(t + i) * 2);
      c.strokeStyle = amber;
      c.lineWidth = 1;
      c.stroke();
      oval(c, 117 + sense * 2, y0 * 2 + Math.sin(t + i) * 2, 2.1, 1.6, 0, amber);
    }
    c.restore();
  }
  function creature(c, x, y, z, angle, seed, g, t, hostile = false) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.scale(z / 24, z / 24);
    const n = 2 + (g.fin || 0),
      col = hostile ? '#e88c70' : '#b2d2a6';
    for (let j = 0; j < n; j++) {
      const xx = -12 + j * (22 / Math.max(1, n - 1));
      for (const sign of [-1, 1]) {
        c.beginPath();
        c.moveTo(xx, sign * 5);
        c.quadraticCurveTo(xx - 4, sign * (15 + Math.sin(t * 4 + j) * 2), xx - 9 + Math.sin(t * 4 + j) * 2, sign * 17);
        c.strokeStyle = col;
        c.lineWidth = 1.7;
        c.stroke();
      }
    }
    specimen(c, 0, 0, 18, 0, seed, g, t, false, hostile);
    c.restore();
  }
  function terrainCanvas(p, n = 256, rgba = null) {
    const el = document.createElement('canvas');
    el.width = el.height = n;
    const c = el.getContext('2d'),
      im = c.createImageData(n, n);
    im.data.set(rgba || G.terrainPixels(p, n));
    c.putImageData(im, 0, 0);
    return el;
  }
  function planetDisc(c, x, y, r, p, texture) {
    c.save();
    c.translate(x, y);
    glow(c, 0, 0, r * 1.32, 'rgba(115,181,175,.3)');
    c.beginPath();
    c.arc(0, 0, r, 0, TAU);
    c.clip();
    c.drawImage(texture, 0, 0, texture.width, texture.height, -r, -r, 2 * r, 2 * r);
    const g = c.createRadialGradient(-r * .48, -r * .45, r * .04, r * .08, r * .1, r * 1.13);
    g.addColorStop(0, 'rgba(252,228,163,.28)');
    g.addColorStop(.52, 'rgba(19,49,55,.02)');
    g.addColorStop(.85, 'rgba(7,19,30,.76)');
    g.addColorStop(1, 'rgba(4,12,20,.97)');
    c.fillStyle = g;
    c.fillRect(-r, -r, 2 * r, 2 * r);
    c.restore();
    c.strokeStyle = 'rgba(165,210,185,.47)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, r, 2.55, 5.60);
    c.stroke();
  }
  function sky(c, W, H, seed, n = 120) {
    const r = G.rng(seed);
    for (let i = 0; i < n; i++) {
      const x = r() * W,
        y = r() * H,
        sz = .2 + r() * .95;
      oval(c, x, y, sz, sz, 0, i % 4 ? 'rgba(187,220,209,.45)' : 'rgba(241,195,128,.71)');
    }
  }
  function menuArt(c, W, H, seed, t, lang) {
    const bg = c.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#0c191b');
    bg.addColorStop(.56, '#102726');
    bg.addColorStop(1, '#122322');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);
    const cx = W * .55,
      cy = H * .48,
      scale = Math.min(W * .26, H * .29);
    glow(c, cx, cy, scale * 2.1, 'rgba(97,139,115,.26)');
    const r = G.rng(seed + 192);
    for (let i = 0; i < 62; i++) {
      let x = r() * W,
        y = r() * H,
        sz = 1 + r() * 10;
      if (i % 4 === 0) {
        c.strokeStyle = 'rgba(135,178,153,.10)';
        c.lineWidth = .8;
        c.beginPath();
        c.ellipse(x, y, sz * 1.7, sz * .55, r() * 5, 0, TAU);
        c.stroke();
      } else oval(c, x, y, sz * .15, sz * .17, 0, 'rgba(196,208,163,.31)');
    }
    c.save();
    c.translate(cx, cy);
    c.rotate(-.39);
    for (let i = 0; i < 3; i++) {
      c.lineWidth = .7;
      c.strokeStyle = i === 1 ? 'rgba(198,185,139,.26)' : 'rgba(170,196,165,.14)';
      c.setLineDash(i === 1 ? [2, 6] : []);
      c.beginPath();
      c.ellipse(0, 0, scale * (1.25 + i * .18), scale * (.92 + i * .14), 0, 0, TAU);
      c.stroke();
    }
    c.restore();
    const trace = (a, b, d, e) => {
      line(c, a, b, d, b, 'rgba(204,193,157,.5)', .7);
      line(c, d, b, e, b - 18, 'rgba(204,193,157,.5)', .7);
      oval(c, a, b, 2, 2, 0, '#dfba82');
    };
    specimen(c, cx, cy, scale, -.49, seed, {
      fin: 1,
      sense: 1
    }, t, true);
    trace(cx + scale * .35, cy - scale * .38, cx + scale * .97, cx + scale * 1.08);
    trace(cx - scale * .50, cy + scale * .18, cx - scale * .95, cx - scale * 1.08);
    c.fillStyle = '#a9b9a6';
    c.font = '10px ui-monospace, monospace';
    c.textAlign = 'right';
    c.fillText(lang === 'en' ? 'MEMBRANE' : 'МЕМБРАНА', cx + scale * 1.33, cy - scale * .38 - 23);
    c.textAlign = 'left';
    c.fillText(lang === 'en' ? 'FLAGELLUM' : 'КАМШИЧЕ', Math.max(14, cx - scale * 1.38), cy + scale * .18 - 23);
    const l = W * .08,
      b = H * .89;
    line(c, l, b, l + 60, b, '#a9b9a6', 1);
    line(c, l, b - 3, l, b + 3, '#a9b9a6');
    line(c, l + 60, b - 3, l + 60, b + 3, '#a9b9a6');
    c.fillStyle = '#a9b9a6';
    c.fillText('20 μm', l, b - 7);
  }
  Object.assign(G, {
    TAU,
    path,
    oval,
    line,
    glow,
    specimen,
    creature,
    terrainCanvas,
    planetDisc,
    sky,
    menuArt
  });
})();
