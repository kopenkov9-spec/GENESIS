(() => {
  const palette = {
    deep: [11, 32, 42],
    lagoon: [52, 100, 98],
    sand: [156, 162, 128],
    dune: [147, 132, 94],
    shore: [114, 133, 95],
    scrub: [144, 123, 87],
    grass: [98, 125, 91],
    lichen: [146, 161, 151],
    cliff: [111, 85, 69],
    forest: [48, 81, 69],
    stone: [91, 103, 92],
    ice: [207, 208, 184]
  };
  function terrainPixels(p, n) {
    const data = new Uint8ClampedArray(n * n * 4),
      heights = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) heights[y * n + x] = G.terrain(p, x * 1024 / n, y * 1024 / n);
    const arid = p.humidity < .33,
      frost = p.temp < 4,
      shift = (p.hue - 150) * .18;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const idx = y * n + x,
        h = heights[idx],
        e = heights[y * n + (x + 1) % n],
        south = heights[(y + 1) % n * n + x];
      const grit = (((Math.imul(x + 71, 73856093) ^ Math.imul(y + 31, 19349663) ^ p.seed) >>> 3) % 23 - 11) * .24;
      const normal = G.clamp(((h - e) * .6 + (h - south)) * (n / 9), -.3, .3);
      let a, b, t;
      if (h < .485) {
        a = palette.deep;
        b = palette.lagoon;
        t = G.clamp((h - .16) / .325, 0, 1);
      } else if (h < .535) {
        a = palette.sand;
        b = arid ? palette.dune : palette.shore;
        t = (h - .485) / .05;
      } else if (h < .76) {
        a = arid ? palette.scrub : palette.grass;
        b = frost ? palette.lichen : arid ? palette.cliff : palette.forest;
        t = (h - .535) / .225;
      } else {
        a = palette.stone;
        b = palette.ice;
        t = G.clamp((h - .76) / .2, 0, 1);
      }
      const shore = h > .477 && h < .486 ? 9 : 0;
      const depth = h < .477 ? (Math.cos(h * 170 + p.phase[3]) * .5 + .5) * 1.5 : 0;
      const ridge = h > .53 ? Math.pow(Math.max(0, 1 - Math.abs(h * 24 % 1 - .5) * 18), 2) * 4 : 0;
      const light = 1 + normal;
      for (let k = 0; k < 3; k++) data[idx * 4 + k] = (a[k] + (b[k] - a[k]) * t) * light + grit + shore + depth + ridge + (k === 0 ? shift : k === 2 ? -shift * .55 : 0);
      data[idx * 4 + 3] = 255;
    }
    return data;
  }
  G.terrainPixels = terrainPixels;
})();
