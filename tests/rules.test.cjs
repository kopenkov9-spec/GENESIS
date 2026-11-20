'use strict';

const {
    test
  } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const G = require('./load.cjs'),
  {
    play
  } = require('./journey.cjs');
const serialize = v => JSON.stringify(v),
  clone = v => JSON.parse(serialize(v));
const state = (seed = 'PELAGOS') => G.create(seed);
function mockStorage() {
  const m = new Map();
  return {
    getItem: k => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, v),
    keys: () => [...m.keys()]
  };
}
function go(s, cmd, a = {}) {
  let r = G.action(s, cmd, a);
  for (let i = 0; s.nav && i < 4000; i++) {
    const e = G.step(s);
    if (e) r = e;
  }
  return r;
}
function tick(s, n, input) {
  for (let i = 0; i < n; i++) G.step(s, input);
}
let end;
function mature() {
  if (!end) end = G.encode(play().s);
  return G.decode(end);
}
test('268,435,456 addresses round-trip, including wraparound', () => {
  assert.equal(G.CAPACITY, 268435456);
  for (const id of [0, 1, G.HOME, G.CAPACITY - 1]) {
    const q = G.coords(id);
    assert.equal(G.idAt(q.x, q.y), id);
  }
  assert.equal(G.sectorDist(0, G.AXIS - 1), 1);
});
test('seeded catalog is order-independent and distinguishes seeds', () => {
  const a = serialize(G.system('A', 624));
  G.system('B', 5);
  assert.equal(serialize(G.system('A', 624)), a);
  assert.notEqual(serialize(G.system('B', 624)), a);
});
test('coasts, continental relief, moon and flora catalogs are deterministic', () => {
  const p = G.planet('X', 0, 0),
    n = G.planet('X', 0, 1);
  assert.equal(G.terrain(p, 5, 7), G.terrain(p, 5, 7));
  assert(Math.abs(G.terrain(p, 9, 5) - G.terrain(p, 1033, 1029)) < 1e-6);
  assert.notEqual(p.flora, n.flora);
  assert.equal(G.satellites(p).length, p.moons);
  assert(G.terrain(p, 512, 512) < .485 && G.terrain(p, 572, 518) > .485);
});
test('same seed and input replay byte-identically after 240 ticks', () => {
  const a = state(),
    b = state();
  for (let i = 0; i < 240; i++) {
    const input = {
      x: i % 7 === 0 ? 1 : 0,
      y: i % 4 === 0 ? -1 : 0
    };
    G.step(a, input);
    G.step(b, input);
  }
  assert.equal(G.encode(a), G.encode(b));
});
test('fixed-step navigation survives save and resume midway', () => {
  const a = state();
  G.action(a, 'move', {
    x: 800,
    y: 600
  });
  tick(a, 10);
  const b = G.decode(G.encode(a));
  tick(a, 45);
  tick(b, 45);
  assert.equal(G.encode(a), G.encode(b));
});
test('sampling spends a site, regrows and changes environmental pressure', () => {
  const s = state(),
    site = G.nearest(s, 'food');
  go(s, 'seek', {
    kind: 'food'
  });
  assert.equal(s.stats.meals, 1);
  assert(G.world(s).pressure > 0);
  assert.equal(G.harvest(s, site).code, 'spent');
  tick(s, 42);
  assert(G.siteReady(G.world(s), site));
});
test('pulse has charge, cooldown and thermal costs', () => {
  const s = state(),
    v = s.res.charge;
  assert(G.action(s, 'pulse').ok);
  assert.equal(s.res.charge, v - 2);
  assert(G.world(s).heat > 0);
  assert.equal(G.action(s, 'pulse').code, 'cool');
});
test('harvesting a spring changes field potential and permits recovery', () => {
  const s = state();
  go(s, 'seek', {
    kind: 'vent'
  });
  const w = G.world(s),
    p = G.body(s),
    a = G.environment(p, s.loc.x, s.loc.y, w, 10);
  assert(w.field < 0);
  tick(s, 200);
  const b = G.environment(p, s.loc.x, s.loc.y, w, 10);
  assert(b.potential > a.potential);
});
test('unmet epoch gate is atomic', () => {
  const s = state(),
    raw = G.encode(s);
  assert.equal(G.action(s, 'advance').code, 'goals');
  assert.equal(G.encode(s), raw);
});
test('organs alter locomotion, sensing, armour and metabolic demand', () => {
  const zero = G.blankGenes(),
    g = {
      ...zero,
      fin: 2,
      sense: 2,
      shell: 2,
      sym: 2
    };
  const a = G.physiology(zero),
    b = G.physiology(g);
  assert(b.speed > a.speed && b.reach > a.reach && b.defense < a.defense);
  assert(G.physiology({
    ...zero,
    sym: 1
  }).upkeep < a.upkeep);
});
test('division preserves the parent and records independently inheritable genes', () => {
  const s = state();
  go(s, 'seek', {
    kind: 'food'
  });
  const original = serialize(s.genes);
  go(s, 'divide');
  assert.equal(serialize(s.genes), original);
  const child = serialize(s.mutant);
  go(s, 'inherit');
  assert.equal(serialize(s.genes), child);
  assert.equal(s.lineage.length, 3);
  assert.equal(s.stats.births, 2);
});
test('isolation can yield a distinct descendant population', () => {
  const s = state(),
    p = G.body(s),
    w = G.world(s);
  w.pops = [G.population(p, 0, 10, 10, G.blankGenes(), 10)];
  for (let i = 0; i < 18; i++) G.ecologicalCycle(w, p);
  assert(w.pops.some(q => q.parent === 0 && q.name !== w.pops[0].name));
});
test('symbiosis and competition affect carrying outcomes', () => {
  const p = G.body(state()),
    w = G.makeWorld(p),
    g = G.blankGenes();
  w.pops = [G.population(p, 0, 5, 6, g, 12), G.population(p, 1, 8, 9, {
    ...g,
    sym: 2
  }, 12)];
  const other = clone(w);
  other.pops[1].genes.sym = 0;
  for (let i = 0; i < 5; i++) {
    G.ecologicalCycle(w, p);
    G.ecologicalCycle(other, p);
  }
  assert(w.pops[0].n > other.pops[0].n);
});
test('controller interface receives observations and can be detached', () => {
  let seen = 0;
  G.setEvolutionController({
    decide(o) {
      assert(Number.isFinite(o.time));
      seen++;
      return {
        x: 1,
        y: 0
      };
    }
  });
  try {
    G.step(state());
    assert.equal(seen, 28);
  } finally {
    G.setEvolutionController(null);
  }
  assert.throws(() => G.setEvolutionController({}));
});
test('spatial bins query neighbours across the planetary seam', () => {
  const g = new G.SpatialGrid(),
    a = {
      x: 1022,
      y: 100
    };
  g.add(a);
  assert(g.near(2, 100, 8).includes(a));
});
test('experiments use material properties, order invariance, threshold and inherited evidence', () => {
  const s = mature();
  const a = G.measure('ore', 'crystal', 'flux', 2, .8, 18, 1),
    b = G.measure('crystal', 'ore', 'flux', 2, .8, 18, 1);
  assert.equal(a.response, b.response);
  assert(G.measure('ore', 'crystal', 'flux', 2, .2, 18, 1).response < a.response);
  const r = G.action(s, 'experiment', {
    left: 'ore',
    right: 'crystal',
    drive: 'flux',
    level: 1
  });
  assert(r.ok && !r.sample.result);
  assert(s.knowledge.fold.tick >= 0);
});
test('invalid or unaffordable build preserves the complete state', () => {
  const s = state(),
    before = G.encode(s);
  assert(!G.action(s, 'build', {
    k: 'ring'
  }).ok);
  assert.equal(before, G.encode(s));
});
test('foreign settlements survive orbital travel and receipt of deferred production', () => {
  const s = mature(),
    w = G.world(s);
  assert(w.kin.length > 1 && w.allies[0]);
  const age = w.buildings[0].age;
  go(s, 'launch');
  go(s, 'jump', {
    sid: G.HOME + 1
  });
  tick(s, 100);
  go(s, 'jump', {
    sid: G.HOME
  });
  go(s, 'land', {
    pid: 0
  });
  assert(w.buildings[0].age > age);
});
test('doctrine, logistics and automation change production', () => {
  const s = mature(),
    a = G.decode(G.encode(s)),
    b = G.decode(G.encode(s));
  G.action(a, 'policy', {
    k: 'tech'
  });
  G.action(b, 'policy', {
    k: 'arcane'
  });
  tick(a, 40);
  tick(b, 40);
  assert(a.res.ore > b.res.ore);
  assert(G.count(G.world(a), 'road') > 0);
  assert(G.world(a).buildings.find(b => b.k === 'machine').age > 0);
});
test('stored energy, portal loss and capacity are accounted for', () => {
  const s = mature();
  assert(G.action(s, 'bank', {
    mode: 'deposit'
  }).ok);
  assert.equal(G.world(s).battery, 5);
  assert(G.action(s, 'bank', {
    mode: 'withdraw'
  }).ok);
  assert.equal(G.world(s).battery, 0);
  go(s, 'launch');
  go(s, 'jump', {
    sid: G.HOME + 1
  });
  go(s, 'land', {
    pid: 0
  });
  const w = G.world(s),
    d = s.portals[1];
  go(s, 'bank', {
    mode: 'deposit'
  });
  assert(go(s, 'bank', {
    mode: 'transfer',
    index: 1
  }).ok);
  assert.equal(G.world(s, d.sid, d.pid).battery, 4);
  assert.equal(w.battery, 0);
});
test('stellar anomaly survey has a physical approach, cost and a single reward', () => {
  const s = mature();
  go(s, 'launch');
  const n = s.res.lore;
  assert.equal(go(s, 'scan').code, 'scan');
  const first = s.res.lore;
  assert(first >= n + 3);
  assert.equal(go(s, 'scan').code, 'scanRepeat');
  assert.equal(s.res.lore, first);
  assert(G.decode(G.encode(s)).scans[G.HOME]);
});
test('gravitic and organic drives change actual flight costs', () => {
  const s = mature();
  go(s, 'launch');
  const id = G.HOME + 1,
    cost = G.jumpCost(s, id),
    range = G.jumpRange(s);
  go(s, 'drive', {
    k: 'gravity'
  });
  assert(G.jumpCost(s, id) < cost && G.jumpRange(s) > range);
  const c = s.res.charge;
  go(s, 'jump', {
    sid: id
  });
  assert.equal(s.res.charge, c - 2);
});
test('thrust, brake and boost affect velocity, position and fuel', () => {
  const s = mature();
  go(s, 'launch');
  const x = s.loc.x,
    f = s.ship.fuel;
  tick(s, 10, {
    x: 1,
    fast: true
  });
  assert(s.loc.x > x && s.ship.vx > 0 && s.ship.fuel < f);
  go(s, 'brake');
  assert.equal(s.ship.vx, 0);
});
test('time, gravity, megastructures, a made planet and new species persist', () => {
  const s = mature(),
    q = G.world(s, G.HOME + 1, 0);
  assert.equal(q.tempo, 2);
  assert.equal(q.gravity, .6);
  assert(q.pops.length >= 7);
  assert(s.rings[G.HOME + 1]);
  assert(s.artificial[G.HOME + 1].includes(8));
  assert(G.planet(s.seed, G.HOME + 1, 8).art);
});
test('cross-galaxy rift resolves arbitrary valid coordinates', () => {
  const s = mature();
  go(s, 'launch');
  const id = G.CAPACITY - 1;
  assert(go(s, 'rift', {
    sid: id
  }).ok);
  assert.equal(s.loc.sid, id);
  assert.equal(G.decode(G.encode(s)).loc.sid, id);
});
test('political seasons alter trade and history deterministically', () => {
  const a = G.civilization('A', 170, 0),
    b = G.civilization('A', 170, 120 * 91);
  assert(b.science > a.science);
  assert.equal(serialize(b), serialize(G.civilization('A', 170, 120 * 91)));
});
test('census forecast does not mutate authoritative world when sent as a snapshot', () => {
  const s = state(),
    w = G.world(s),
    raw = serialize(w);
  const out = G.forecast({
    world: clone(w),
    planet: G.body(s)
  });
  assert(out.length >= 3);
  assert.equal(serialize(w), raw);
});
test('save deltas restore every live property, including a paused active course', () => {
  const s = mature();
  G.action(s, 'seek', {
    kind: 'reef'
  });
  G.step(s);
  const raw = G.encode(s),
    loaded = G.decode(raw);
  assert.equal(serialize(loaded), serialize(s));
  assert(Buffer.byteLength(raw) < Buffer.byteLength(serialize(s)) * 1.1);
});
test('checksum and semantic validation reject corrupt input', () => {
  const f = JSON.parse(G.encode(state()));
  f.data = f.data.replace('PELAGOS', 'OTHER');
  assert.throws(() => G.decode(JSON.stringify(f)));
  const d = JSON.parse(f.data);
  d.genes.lung = -50;
  f.data = JSON.stringify(d);
  f.hash = G.hash(f.data).toString(16);
  assert.throws(() => G.decode(JSON.stringify(f)));
  assert.throws(() => G.decode('{}'));
});
test('manual slot falls back to the last intact previous save', () => {
  const store = mockStorage(),
    a = state();
  G.writeSlot(store, 'manual', a);
  const raw = G.encode(a);
  G.step(a);
  G.writeSlot(store, 'manual', a);
  store.setItem(store.keys().find(k => !k.endsWith('.previous')), 'broken');
  assert.equal(G.encode(G.readSlot(store, 'manual')), raw);
});
test('a storage failure retains the last committed game', () => {
  const store = mockStorage(),
    a = state();
  G.writeSlot(store, 'auto', a);
  const old = G.encode(a);
  G.step(a);
  assert.throws(() => G.writeSlot({
    getItem: store.getItem,
    setItem() {
      throw Error('quota');
    }
  }, 'auto', a));
  assert.equal(G.encode(G.readSlot(store, 'auto')), old);
});
test('catalog worker source runs as an independent message processor', () => {
  const html = fs.readFileSync(path.join(__dirname, '../GENESIS_Beyond_Matter.html'), 'utf8'),
    m = html.match(/const WORKER_BOOT=(.+);\n/);
  assert(m);
  const shared = html.split('<script id="genesis-kernel">')[1].split('</script>')[0];
  const worker = shared + JSON.parse(m[1]);
  let msg;
  const self = {
    postMessage: v => msg = v
  };
  vm.runInNewContext(worker, {
    self
  });
  self.onmessage({
    data: {
      type: 'survey',
      key: 'id',
      data: {
        seed: 'X',
        id: 0,
        age: 90
      }
    }
  });
  assert.equal(msg.key, 'id');
  assert.equal(msg.data.length, 49);
  assert.equal(serialize(msg.data), serialize(G.survey({
    seed: 'X',
    id: 0,
    age: 90
  })));
});
test('standalone distribution has no online asset or network API dependency', () => {
  const html = fs.readFileSync(path.join(__dirname, '../GENESIS_Beyond_Matter.html'), 'utf8');
  assert(html.includes("connect-src 'none'"));
  assert(!/<(?:script|img|link|source)[^>]+(?:src|href)=["'](?:https?:|\/\/)/i.test(html));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*\(/.test(html));
  assert(!html.includes('/*__SCRIPT__*/'));
});
for (const seed of ['PELAGOS', 'Калки', 'AURA-988', 'DUNE', 'ECHO', 'Salix']) test('ordinary six-epoch round trip and postgame on seed ' + seed, () => {
  const r = play(seed);
  assert.equal(serialize(r.stages), '[1,2,3,4,5]');
  assert.equal(r.s.era, 5);
  assert.equal(r.s.loc.sid, G.HOME);
  assert.equal(new Set(r.samples).size, 7);
});
test('advertised nursery shore is dry across 4096 unrelated worlds', () => {
  for (let i = 0; i < 4096; i++) {
    const p = G.planet('ARCHIPELAGO-' + i, G.HOME, 0);
    assert(G.terrain(p, 572, 518) > .485);
  }
});

test('sintered insulation lowers heat from the same operating reactor', () => {
  const a = mature();
  const b = G.decode(G.encode(a));
  delete b.knowledge.ceramic;
  const insulated = G.world(a);
  const uninsulated = G.world(b);
  insulated.heat = uninsulated.heat = 10;
  tick(a, 96);
  tick(b, 96);
  assert(insulated.heat < uninsulated.heat);
});
test('worker terrain is byte-identical to the synchronous raster', () => {
  const html = fs.readFileSync(path.join(__dirname, '../GENESIS_Beyond_Matter.html'), 'utf8');
  const shared = html.split('<script id="genesis-kernel">')[1].split('</script>')[0];
  const boot = JSON.parse(html.match(/const WORKER_BOOT=(.+);\n/)[1]);
  let response;
  const self = {postMessage(message, transfers) { response = message; assert.equal(transfers.length, 1); }};
  vm.runInNewContext(shared + boot, {self});
  const planet = G.body(state()), n = 48;
  self.onmessage({data:{type:'terrain', key:planet.seed, data:{planet,n}}});
  assert.equal(response.key, planet.seed);
  assert.equal(Buffer.compare(Buffer.from(response.buffer), Buffer.from(G.terrainPixels(planet,n))), 0);
});
