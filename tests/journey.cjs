'use strict';

const assert = require('node:assert/strict'),
  G = require('./load.cjs');
function play(seed = 'PELAGOS', hooks = {}) {
  let s = G.create(seed),
    actions = 0;
  const stages = [],
    samples = [];
  function run(cmd, args = {}) {
    let r = G.action(s, cmd, args);
    actions++;
    assert(r.ok, cmd + ' ' + JSON.stringify(args) + ' refused: ' + r.code);
    let ticks = 0;
    while (s.nav && ticks++ < 4000) {
      const event = G.step(s);
      if (event) r = event;
    }
    assert(!s.nav, 'route timed out');
    assert(r.ok, cmd + ' arrival: ' + r.code);
    if (hooks.action) hooks.action(cmd, args, r);
    return r;
  }
  function supply(cost) {
    for (const [key, value] of Object.entries(cost)) {
      let n = 0;
      while (s.res[key] + .00001 < value && n++ < 100) {
        if (key === 'lore') {
          for (let i = 0; i < 32; i++) G.step(s);
        } else {
          const kind = {
            bio: 'food',
            ore: 'reef',
            crystal: 'prism',
            brine: 'vent',
            charge: 'vent'
          }[key];
          assert.equal(s.loc.scope, 'ground', 'supply on surface');
          run('seek', {
            kind
          });
        }
      }
      assert(s.res[key] + .00001 >= value, 'missing ' + key);
    }
  }
  function epoch() {
    assert(G.goals(s).every(x => x.done), JSON.stringify(G.goals(s)));
    run('advance');
    stages.push(s.era);
    G.validate(s);
    const exact = G.encode(s);
    s = G.decode(exact);
    assert.equal(G.encode(s), exact);
    if (hooks.epoch) hooks.epoch(s);
  }
  function build(k) {
    supply(G.builds[k].cost);
    run('build', {
      k
    });
  }
  function trial(k) {
    const r = G.recipes[k];
    supply({
      [r.a]: 1,
      [r.b]: 1,
      charge: r.min
    });
    let t = run('experiment', {
      left: r.a,
      right: r.b,
      drive: r.drive,
      level: r.min
    });
    if (!t.sample.result) {
      run('seek', {
        kind: 'prism'
      });
      supply({
        [r.a]: 1,
        [r.b]: 1,
        charge: 3
      });
      t = run('experiment', {
        left: r.a,
        right: r.b,
        drive: r.drive,
        level: 3
      });
    }
    assert.equal(t.sample.result, k, 'experiment ' + k);
    samples.push(k);
  }
  for (let n = 0; n < 3; n++) run('seek', {
    kind: 'food'
  });
  run('organ', {
    k: 'fin'
  });
  run('divide');
  epoch();
  for (const k of ['lung', 'sense']) {
    supply(G.genesCost(s, k));
    run('organ', {
      k
    });
  }
  supply({
    bio: 4
  });
  run('seek', {
    kind: 'shore'
  });
  run('brood');
  epoch();
  build('camp');
  trial('tools');
  build('farm');
  build('mill');
  supply({
    bio: 4,
    ore: 2
  });
  for (const mode of ['greet', 'trade', 'ally']) run('dip', {
    mode,
    index: 0
  });
  epoch();
  trial('resonance');
  trial('circuit');
  trial('culture');
  trial('mycelium');
  trial('ceramic');
  for (const k of ['school', 'lab', 'reactor', 'machine', 'biomech', 'construct', 'relay', 'road', 'yard']) build(k);
  run('policy', {
    k: 'living'
  });
  run('priority', {
    k: 'weave'
  });
  run('hull', {
    k: 'organic'
  });
  supply({
    bio: 20,
    ore: 32,
    crystal: 28,
    brine: 12,
    charge: 25
  });
  epoch();
  const home = G.world(s, G.HOME, 0),
    buildSite = JSON.stringify(home.buildings.map(b => [b.k, b.x, b.y])),
    genes = JSON.stringify(s.genes),
    kin = home.kin[0].name,
    coords = G.coords(G.HOME),
    away = G.idAt(coords.x + 1, coords.y);
  run('jump', {
    sid: away
  });
  run('dip', {
    mode: 'greet',
    index: 0
  });
  build('station');
  run('refuel');
  run('land', {
    pid: 0
  });
  build('colony');
  trial('fold');
  epoch();
  build('portal');
  run('gravity', {
    value: .6
  });
  run('time', {
    value: 2
  });
  supply({
    bio: 18,
    brine: 6,
    charge: 12
  });
  run('species');
  run('ecosystem');
  build('mind');
  supply({
    ore: 24,
    crystal: 16,
    charge: 22
  });
  run('launch');
  build('ring');
  const art = run('planet').pid;
  run('land', {
    pid: art
  });
  build('portal');
  run('gate', {
    index: 0
  });
  assert.equal(s.loc.pid, 0);
  assert.equal(s.loc.sid, away);
  run('launch');
  run('jump', {
    sid: G.HOME
  });
  run('land', {
    pid: 0
  });
  const homeAgain = G.world(s);
  assert.equal(JSON.stringify(homeAgain.buildings.map(b => [b.k, b.x, b.y])), buildSite);
  assert.equal(homeAgain.kin[0].name, kin);
  assert.equal(JSON.stringify(s.genes), genes);
  assert(homeAgain.allies[0]);
  assert(s.knowledge.fold);
  const bytes = Buffer.byteLength(G.encode(s)),
    decoded = G.decode(G.encode(s));
  assert.equal(G.encode(s), G.encode(decoded));
  return {
    s,
    stages,
    samples,
    stats: {
      seed,
      actions,
      ticks: s.tick,
      worlds: Object.keys(s.worlds).length,
      buildings: homeAgain.buildings.length,
      saveBytes: bytes,
      epochs: s.epochs.map(t => t / 8)
    }
  };
}
module.exports = {
  play
};
if (require.main === module) console.log(JSON.stringify(play(process.argv[2] || 'PELAGOS').stats, null, 2));
