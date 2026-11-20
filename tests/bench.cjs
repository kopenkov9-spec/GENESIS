'use strict';

const fs = require('node:fs'),
  os = require('node:os'),
  vm = require('node:vm'),
  path = require('node:path');
const {
    performance
  } = require('node:perf_hooks'),
  {
    play
  } = require('./journey.cjs'),
  G = require('./load.cjs');
const ROOT = path.join(__dirname, '..');
function summarize(a) {
  const sorted = [...a].sort((x, y) => x - y);
  return {
    samples: a.length,
    medianMs: +sorted[Math.floor(a.length * .5)].toFixed(3),
    p95Ms: +sorted[Math.floor(a.length * .95)].toFixed(3)
  };
}
const epochs = [G.create('PELAGOS')];
const finished = play('PELAGOS', {
  epoch: s => epochs.push(G.decode(G.encode(s)))
});
const simulation = epochs.map((state, era) => {
  const s = G.decode(G.encode(state)),
    samples = [];
  for (let i = 0; i < 64; i++) G.step(s);
  for (let n = 0; n < 96; n++) {
    const before = performance.now();
    for (let j = 0; j < 8; j++) G.step(s);
    samples.push((performance.now() - before) / 8);
  }
  return {
    era,
    ...summarize(samples)
  };
});
const result = {
  runtime: process.version,
  platform: process.platform,
  arch: process.arch,
  referenceCPUVisible: os.cpus()[0]?.model,
  logicalCPUsVisible: os.cpus().length,
  simulation,
  journey: finished.stats,
  htmlBytes: fs.statSync(path.join(ROOT, 'GENESIS_Beyond_Matter.html')).size
};
if (process.argv.includes('--canvas')) {
  const {
    createCanvas
  } = require('@napi-rs/canvas');
  const document = {
    createElement: () => createCanvas(1, 1)
  };
  const ctx = vm.createContext({
    G,
    Math,
    JSON,
    Map,
    Set,
    Array,
    Object,
    Number,
    String,
    Error,
    Infinity,
    console,
    document,
    devicePixelRatio: 1,
    performance
  });
  for (const id of ['art', 'renderer', 'maps']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'src', id + '.js'), 'utf8'), ctx);
  const W = 960,
    H = 600,
    canvas = createCanvas(W, H);
  canvas.getBoundingClientRect = () => ({
    width: W,
    height: H
  });
  const renderer = new G.Renderer(canvas),
    outdir = process.env.GENESIS_QA_IMAGES;
  if (outdir) fs.mkdirSync(outdir, {
    recursive: true
  });
  const c = canvas.getContext('2d');
  G.menuArt(c, W, H, 72841, 1, 'bg');
  if (outdir) fs.writeFileSync(path.join(outdir, 'plate.png'), canvas.toBuffer('image/png'));
  result.canvas = {
    backend: 'Skia / @napi-rs/canvas, CPU, DPR 1',
    width: W,
    height: H,
    frames: []
  };
  for (const [era, s] of epochs.entries()) {
    const a = [];
    for (let j = 0; j < 32; j++) {
      const start = performance.now();
      renderer.draw(s, j * .016, 'bg', 'high');
      c.getImageData(0, 0, 1, 1);
      if (j >= 4) a.push(performance.now() - start);
    }
    result.canvas.frames.push({
      era,
      ...summarize(a)
    });
    if (outdir) fs.writeFileSync(path.join(outdir, 'epoch-' + era + '.png'), canvas.toBuffer('image/png'));
  }
}
result.processMiB = {
  heapUsed: +(process.memoryUsage().heapUsed / 1048576).toFixed(1),
  rss: +(process.memoryUsage().rss / 1048576).toFixed(1)
};
console.log(JSON.stringify(result, null, 2));
