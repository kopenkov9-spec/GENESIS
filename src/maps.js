(() => {
  function planetMap(canvas, s, renderer) {
    const W = canvas.width,
      H = canvas.height,
      c = canvas.getContext('2d'),
      p = G.body(s),
      w = G.world(s);
    c.drawImage(renderer.texture(p), 0, 0, W, H);
    c.fillStyle = 'rgba(13,31,33,.18)';
    c.fillRect(0, 0, W, H);
    for (let i = 1; i < 8; i++) {
      G.line(c, i * W / 8, 0, i * W / 8, H, 'rgba(203,217,192,.22)', .7);
      G.line(c, 0, i * H / 8, W, i * H / 8, 'rgba(203,217,192,.22)', .7);
    }
    for (const a of G.points(p)) {
      if (a.k.startsWith('tribe') && s.era < 2) continue;
      const x = a.x / 1024 * W,
        y = a.y / 1024 * H;
      G.oval(c, x, y, 2.25, 2.25, 0, G.COLORS[a.k] || '#e6b876');
    }
    for (const b of w.buildings) {
      const x = b.x / 1024 * W,
        y = b.y / 1024 * H;
      c.fillStyle = '#ffdf8d';
      c.fillRect(x - 3, y - 3, 6, 6);
    }
    const x = s.loc.x / 1024 * W,
      y = s.loc.y / 1024 * H;
    c.strokeStyle = '#ffe0a1';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(x, y, 8, 0, G.TAU);
    c.stroke();
    G.line(c, x - 12, y, x + 12, y, '#ffe0a1', 1);
    G.line(c, x, y - 12, x, y + 12, '#ffe0a1', 1);
  }
  function galaxyMap(canvas, s, stars, selected) {
    const W = canvas.width,
      H = canvas.height,
      c = canvas.getContext('2d'),
      at = G.coords(s.loc.sid);
    c.fillStyle = '#112127';
    c.fillRect(0, 0, W, H);
    G.sky(c, W, H, G.hash(s.seed, at.x, at.y), 85);
    for (let i = 0; i < 8; i++) {
      G.line(c, i * W / 7, 0, i * W / 7, H, 'rgba(164,193,181,.14)', 1);
      G.line(c, 0, i * H / 7, W, i * H / 7, 'rgba(164,193,181,.14)', 1);
    }
    const pts = [];
    for (const st of stars) {
      const x = (st.dx + 3.5) * W / 7,
        y = (st.dy + 3.5) * H / 7;
      pts.push({
        ...st,
        x,
        y
      });
      const col = st.star === 'blue' ? '#a4d9ed' : st.star === 'red' ? '#e8a68d' : st.star === 'white' ? '#e0e5d9' : '#e6cc95';
      G.oval(c, x, y, st.sid === s.loc.sid ? 4.3 : 2.5, st.sid === s.loc.sid ? 4.3 : 2.5, 0, col);
      if (st.sid === selected || st.sid === s.loc.sid) {
        c.strokeStyle = st.sid === selected ? '#e9bd79' : '#87cabe';
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(x, y, 8, 0, G.TAU);
        c.stroke();
        c.fillStyle = col;
        c.font = '11px monospace';
        c.textAlign = 'center';
        c.fillText(st.name, x, y + 20);
      }
    }
    return pts;
  }
  G.planetMap = planetMap;
  G.galaxyMap = galaxyMap;
})();
