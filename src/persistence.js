(() => {
  const SAVEKEY = 'genesis.beyondmatter.slot.';
  // Generated traits, positions and names that match the seeded baseline are omitted on disk.
  function different(row, base) {
    const out = {};
    for (const [k, v] of Object.entries(row)) if (!Object.hasOwn(base, k) || JSON.stringify(v) !== JSON.stringify(base[k])) out[k] = v;
    return out;
  }
  function pack(s) {
    const worlds = {};
    for (const [id, w] of Object.entries(s.worlds)) {
      const [sid, pid] = id.split('/').map(Number),
        base = G.makeWorld(G.planet(s.seed, sid, pid)),
        patch = different(w, base);
      if (patch.pops) patch.pops = w.pops.map((q, i) => different(q, base.pops[i] || {}));
      worlds[id] = patch;
    }
    const base = s.loc.scope === 'ground' ? G.actors(G.body(s)) : [];
    return {
      ...s,
      worlds,
      actors: s.actors.map((a, i) => different(a, base[i] || {}))
    };
  }
  function unpack(data) {
    if (!data || typeof data.seed !== 'string' || data.seed.length > 72 || !data.worlds || !Array.isArray(data.actors) || data.actors.length > 36) throw Error('Save structure');
    const worlds = {};
    for (const [id, patch] of Object.entries(data.worlds)) {
      if (!/^\d{1,9}\/\d{1,2}$/.test(id) || !patch || typeof patch !== 'object') throw Error('World address');
      const [sid, pid] = id.split('/').map(Number),
        base = G.makeWorld(G.planet(data.seed, sid, pid));
      const w = {
        ...base,
        ...patch
      };
      if (patch.pops) {
        if (!Array.isArray(patch.pops)) throw Error('Populations');
        w.pops = patch.pops.map((q, i) => ({
          ...base.pops[i],
          ...q
        }));
      }
      worlds[id] = w;
    }
    const base = data.loc?.scope === 'ground' ? G.actors(G.body(data)) : [];
    return {
      ...data,
      worlds,
      actors: data.actors.map((a, i) => ({
        ...base[i],
        ...a
      }))
    };
  }
  function encode(s) {
    const data = JSON.stringify(pack(s));
    return JSON.stringify({
      game: 'GENESIS_BEYOND_MATTER',
      schema: 1,
      encoding: 'seed-delta',
      hash: G.hash(data).toString(16),
      data
    });
  }
  function validate(s) {
    function ok(v) {
      if (!v) throw Error('Invalid save');
    }
    const obj = o => o && typeof o === 'object' && !Array.isArray(o);
    const num = (n, min = 0, max = 1e14) => Number.isFinite(n) && n >= min && n <= max;
    const int = (n, min = 0, max = 1e14) => Number.isInteger(n) && num(n, min, max);
    const txt = (v, n = 100) => typeof v === 'string' && v.length <= n;
    const arr = (v, n = 200000) => Array.isArray(v) && v.length <= n;
    const pos = o => obj(o) && num(o.x, 0, 1024) && num(o.y, 0, 1024);
    const genes = g => obj(g) && G.traits.every(k => int(g[k], 0, 4));
    const resources = r => obj(r) && G.keys.every(k => num(r[k], 0, 1e8));
    const sys = id => int(id, 0, G.CAPACITY - 1),
      pid = id => int(id, 0, 19);
    const dest = o => obj(o) && sys(o.sid) && pid(o.pid);
    const checkDict = d => {
      ok(obj(d));
      for (const k of Object.keys(d)) ok(k !== '__proto__' && k !== 'constructor' && k !== 'prototype');
    };
    ok(obj(s) && s.format === 1 && txt(s.seed, 72) && s.seed.length && int(s.era, 0, 5) && int(s.tick) && dest(s.loc) && pos(s.loc) && num(s.loc.angle, -20, 20) && ['orbit', 'ground'].includes(s.loc.scope));
    ok(genes(s.genes) && (s.mutant === null || genes(s.mutant)) && resources(s.res) && num(s.vital, 0, 100.001) && obj(s.cool) && num(s.cool.hit) && num(s.cool.pulse));
    ok(obj(s.ship) && ['organic', 'keel'].includes(s.ship.hull) && num(s.ship.fuel, 0, 22) && num(s.ship.vx, -150, 150) && num(s.ship.vy, -150, 150) && ['thrust', 'gravity'].includes(s.ship.drive) && ['tech', 'arcane', 'living', 'hybrid'].includes(s.policy) && ['forge', 'weave', 'grow'].includes(s.priority));
    ok(arr(s.epochs, 6) && s.epochs.length === s.era + 1 && s.epochs.every(t => int(t, 0, s.tick)) && arr(s.visited) && s.visited.includes(G.HOME) && s.visited.includes(s.loc.sid) && s.visited.every(sys));
    ok(arr(s.lineage) && s.lineage.length && s.lineage.every(l => dest(l) && genes(l.genes) && int(l.tick) && ['origin', 'offspring', 'organ', 'inherit'].includes(l.kind)));
    ok(obj(s.stats) && ['meals', 'births', 'broods', 'trade', 'colonies', 'engineered', 'pulses'].every(k => int(s.stats[k])) && typeof s.stats.landfall === 'boolean' && typeof s.stats.firstContact === 'boolean' && typeof s.tut === 'boolean');
    for (const dict of [s.knowledge, s.worlds, s.artificial, s.stations, s.rings, s.contacts, s.scans]) checkDict(dict);
    const drives = ['heat', 'current', 'flux'];
    const trial = t => obj(t) && int(t.tick) && Object.hasOwn(G.materials, t.left) && Object.hasOwn(G.materials, t.right) && drives.includes(t.drive) && int(t.level, 1, 3) && num(t.field) && num(t.response) && num(t.temperature, -100, 250) && (t.result === '' || Object.hasOwn(G.recipes, t.result));
    for (const [k, t] of Object.entries(s.knowledge)) ok(Object.hasOwn(G.recipes, k) && trial(t) && dest(t) && t.result === k);
    ok(arr(s.trials, 60) && s.trials.every(trial) && arr(s.journal, 140) && s.journal.every(j => obj(j) && int(j.tick) && txt(j.code) && txt(j.arg)));
    ok(arr(s.chronicle) && s.chronicle.every(e => dest(e) && int(e.tick, 0, s.tick) && txt(e.code) && txt(e.arg)));
    for (const [id, list] of Object.entries(s.artificial)) ok(sys(+id) && arr(list, 12) && list.every((v, i) => v === i + 8));
    for (const d of [s.stations, s.rings]) for (const [id, b] of Object.entries(d)) ok(sys(+id) && pos(b) && pid(b.pid));
    for (const [id, r] of Object.entries(s.scans)) ok(sys(+id) && obj(r) && int(r.tick) && ['thermal', 'echo', 'shear'].includes(r.k) && num(r.intensity, 0, 2));
    for (const [id, c] of Object.entries(s.contacts)) ok(sys(+id) && obj(c) && int(c.relation, -6, 6) && typeof c.ally === 'boolean' && int(c.traded));
    for (const [key, w] of Object.entries(s.worlds)) {
      const parts = key.split('/');
      ok(parts.length === 2 && key === Number(parts[0]) + '/' + Number(parts[1]) && sys(+parts[0]) && pid(+parts[1]) && obj(w));
      ok(num(w.battery, 0, 40) && num(w.pressure, 0, 50) && num(w.heat, 0, 100) && num(w.field, -16, 26) && [.6, 1, 1.45].includes(w.gravity) && [.5, 1, 2].includes(w.tempo) && num(w.clock) && int(w.last, 0, s.tick) && int(w.cycle) && int(w.designs) && num(w.culture) && int(w.conflicts) && resources(w.stock) && (w.pos === null || pos(w.pos)));
      ok(arr(w.buildings, 96) && w.buildings.every(b => pos(b) && Object.hasOwn(G.builds, b.k) && int(b.age)));
      ok(arr(w.kin) && w.kin.every(k => pos(k) && genes(k.genes) && txt(k.name) && num(k.n, 0, 1e8)));
      ok(arr(w.pops) && w.pops.length >= 3 && w.pops.every(q => pos(q) && int(q.id) && int(q.parent, -1) && genes(q.genes) && txt(q.name) && num(q.n, 0, 1e8) && int(q.age) && num(q.isolation) && typeof q.diverged === 'boolean' && num(q.pressure)));
      ok(arr(w.relations, 3) && w.relations.length === 3 && w.relations.every(r => int(r, -6, 6)) && arr(w.allies, 3) && w.allies.length === 3 && w.allies.every(a => typeof a === 'boolean'));
      checkDict(w.harvest);
      for (const [id, v] of Object.entries(w.harvest)) ok(int(+id, 0, 94) && num(v));
    }
    ok(s.worlds[G.key(G.HOME, 0)]?.kin?.length && s.worlds[G.key(s.loc.sid, s.loc.pid)] !== undefined);
    ok(arr(s.portals) && s.portals.every(q => dest(q) && pos(q) && s.worlds[G.key(q.sid, q.pid)]?.buildings.some(b => b.k === 'portal')));
    ok(arr(s.actors, 36) && s.actors.every(a => pos(a) && int(a.id) && int(a.pop) && num(a.stun) && num(a.energy, 0, 1) && num(a.angle, -20, 20) && ['hunter', 'grazer'].includes(a.role)));
    if (s.nav !== null) {
      ok(pos(s.nav));
      const a = s.nav.after;
      if (a !== null) {
        ok(obj(a) && ['sample', 'land', 'dip', 'refuel', 'scan'].includes(a.cmd));
        if (a.cmd === 'sample') ok(int(a.id, 0, 94));
        if (a.cmd === 'land') ok(pid(a.pid));
        if (a.cmd === 'dip') ok(int(a.index, 0, 2) && ['greet', 'trade', 'ally', 'contest'].includes(a.mode));
      }
    }
    return s;
  }
  function decode(raw) {
    if (typeof raw !== 'string' || raw.length > 24 * 1024 * 1024) throw Error('Save size');
    const file = JSON.parse(raw);
    if (file.game !== 'GENESIS_BEYOND_MATTER' || file.schema !== 1 || typeof file.data !== 'string' || G.hash(file.data).toString(16) !== file.hash) throw Error('Save checksum');
    if (file.encoding !== 'seed-delta') throw Error('Save encoding');
    return validate(unpack(JSON.parse(file.data)));
  }
  function readSlot(storage, slot) {
    const k = SAVEKEY + slot;
    for (const suffix of ['', '.previous']) {
      try {
        const raw = storage.getItem(k + suffix);
        if (raw) return decode(raw);
      } catch {}
    }
    return null;
  }
  function writeSlot(storage, slot, s) {
    const k = SAVEKEY + slot,
      raw = encode(validate(s)),
      old = storage.getItem(k);
    if (old) {
      let valid = false;
      try {
        decode(old);
        valid = true;
      } catch {}
      if (valid) storage.setItem(k + '.previous', old);
    }
    storage.setItem(k, raw);
  }
  Object.assign(G, {
    encode,
    decode,
    validate,
    readSlot,
    writeSlot
  });
})();
