(() => {
  const {
    clamp,
    hash,
    mod,
    delta,
    distance
  } = G;
  const key = (sid, pid) => sid + '/' + pid;
  const body = s => G.planet(s.seed, s.loc.sid, s.loc.pid);
  function world(s, sid = s.loc.sid, pid = s.loc.pid) {
    const k = key(sid, pid);
    if (!s.worlds[k]) {
      s.worlds[k] = G.makeWorld(G.planet(s.seed, sid, pid));
      s.worlds[k].last = s.tick;
    }
    return s.worlds[k];
  }
  const pointCache = new Map();
  function points(p) {
    if (!pointCache.has(p.seed)) {
      if (pointCache.size >= 40) pointCache.delete(pointCache.keys().next().value);
      pointCache.set(p.seed, G.sites(p));
    }
    return pointCache.get(p.seed);
  }
  function entry(s, code, arg = '') {
    const event = {
      tick: s.tick,
      code,
      arg
    };
    s.journal.push(event);
    if (['origin', 'epoch', 'built', 'ally', 'contest', 'discovered', 'policy', 'priority', 'hull', 'brood', 'gravity', 'time', 'species', 'ecosystem', 'planet', 'scan'].includes(code)) s.chronicle.push({
      ...event,
      sid: s.loc.sid,
      pid: s.loc.pid
    });
    if (s.journal.length > 140) s.journal.shift();
  }
  function birth(s, kind, genes) {
    s.lineage.push({
      tick: s.tick,
      kind,
      genes: {
        ...genes
      },
      sid: s.loc.sid,
      pid: s.loc.pid
    });
    s.stats.births++;
  }
  function create(seed) {
    const s = {
      format: 1,
      seed: String(seed || 'PELAGOS').slice(0, 72),
      tick: 0,
      era: 0,
      epochs: [0],
      lineage: [],
      genes: G.blankGenes(),
      mutant: null,
      loc: {
        sid: G.HOME,
        pid: 0,
        x: 512,
        y: 512,
        angle: 0,
        scope: 'ground'
      },
      res: {
        bio: 3,
        ore: 2,
        crystal: 2,
        brine: 2,
        charge: 5,
        lore: 0
      },
      vital: 88,
      nav: null,
      cool: {
        hit: 0,
        pulse: 0
      },
      ship: {
        hull: 'keel',
        fuel: 16,
        drive: 'thrust',
        vx: 0,
        vy: 0
      },
      worlds: {},
      artificial: {},
      visited: [G.HOME],
      stations: {},
      rings: {},
      contacts: {},
      scans: {},
      portals: [],
      knowledge: {},
      trials: [],
      policy: 'hybrid',
      priority: 'grow',
      journal: [],
      chronicle: [],
      tut: true,
      stats: {
        meals: 0,
        births: 0,
        broods: 0,
        landfall: false,
        trade: 0,
        colonies: 0,
        engineered: 0,
        pulses: 0,
        firstContact: false
      },
      actors: []
    };
    const w = world(s),
      p = body(s);
    w.kin.push({
      name: G.name(hash(s.seed, 'lineage')),
      n: 1,
      x: 512,
      y: 512,
      genes: {
        ...s.genes
      }
    });
    s.actors = G.actors(p);
    birth(s, 'origin', s.genes);
    entry(s, 'origin', p.name);
    return s;
  }
  function grant(s, out) {
    for (const [k, v] of Object.entries(out)) s.res[k] = clamp(s.res[k] + v, 0, k === 'charge' ? capacity(s) : 99999);
  }
  function capacity(s) {
    return 18 + s.genes.sense * 4 + (s.era >= 3 ? 14 : 0) + (s.era >= 5 ? 20 : 0);
  }
  function afford(s, cost) {
    return Object.entries(cost).every(([k, v]) => s.res[k] + 1e-7 >= v);
  }
  function spend(s, cost) {
    if (!afford(s, cost)) return false;
    for (const [k, v] of Object.entries(cost)) s.res[k] = Math.max(0, s.res[k] - v);
    return true;
  }
  const count = (w, k) => w.buildings.filter(b => b.k === k).length;
  function dry(s) {
    return G.terrain(body(s), s.loc.x, s.loc.y) >= .485;
  }
  function aggregate(s, w, p) {
    const elapsed = (s.tick - w.last) / 8;
    if (elapsed <= 0) return;
    w.last = s.tick;
    const before = w.clock;
    w.clock += elapsed * w.tempo;
    const diff = w.clock - before;
    w.heat = clamp(w.heat - .045 * diff, 0, 100);
    w.pressure = Math.max(0, w.pressure - .023 * diff);
    w.field = Math.sign(w.field) * Math.max(0, Math.abs(w.field) - .021 * diff);
    const cycles = Math.floor(w.clock / 4) - Math.floor(before / 4);
    if (!cycles) return;
    const transport = 1 + Math.min(.75, count(w, 'road') * .15),
      pact = 1 + w.allies.filter(Boolean).length * .09;
    const ownedOrbit = s.stations[p.sys]?.pid === p.id,
      ring = s.rings[p.sys]?.pid === p.id;
    const add = (k, v) => {
      w.stock[k] = Math.min(99999, w.stock[k] + v * cycles);
    };
    const industry = s.policy === 'tech' ? 1.28 : s.policy === 'hybrid' ? 1.10 : 1;
    const magic = s.policy === 'arcane' ? 1.35 : s.policy === 'hybrid' ? 1.10 : 1;
    const biology = s.policy === 'living' ? 1.38 : s.policy === 'hybrid' ? 1.10 : 1;
    for (const b of w.buildings) {
      const d = G.builds[b.k];
      b.age += cycles;
      const efficiency = (b.k === 'machine' ? 1 + Math.min(.9, b.age * .014) : 1) * (b.k === 'reactor' ? .65 + p.lattice * .32 : 1);
      for (const [k, v] of Object.entries(d.prod)) {
        const mult = k === 'ore' ? industry : k === 'bio' || k === 'brine' ? biology : magic;
        const focus = s.priority === 'forge' && k === 'ore' || s.priority === 'weave' && k === 'charge' || s.priority === 'grow' && k === 'bio' ? 1.3 : 1;
        add(k, v * transport * pact * efficiency * mult * focus * (w.heat > 70 ? .62 : 1));
      }
      if (b.k === 'reactor') w.heat = Math.min(100, w.heat + (s.knowledge.ceramic ? .09 : .19) * cycles);
      if (b.k === 'school' || b.k === 'camp') w.culture += .1 * cycles;
    }
    if (ownedOrbit) {
      add('ore', .8);
      add('crystal', .7);
    }
    if (ring) {
      add('charge', 5);
      add('ore', 1);
    }
    for (let i = 0; i < Math.min(160, cycles); i++) G.ecologicalCycle(w, p);
    for (const k of w.kin) {
      const env = G.environment(p, k.x, k.y, w);
      const fit = k.genes.lung + k.genes.sym + (env.biome === 'water' ? k.genes.fin : 0);
      k.n = clamp(k.n + (1 + fit * .23) * .10 * cycles - w.heat * .0009 * cycles, 1, 1000);
    }
    w.cycle += cycles;
  }
  function collect(s, w) {
    grant(s, w.stock);
    for (const k of G.keys) w.stock[k] = 0;
  }
  const success = (code = 'ok', data = {}) => ({
    ok: true,
    code,
    ...data
  });
  const fail = (code, data = {}) => ({
    ok: false,
    code,
    ...data
  });
  function siteReady(w, site) {
    return !w.harvest[site.id] || w.harvest[site.id] <= w.clock;
  }
  function nearest(s, kind) {
    if (s.loc.scope !== 'ground') return null;
    const w = world(s);
    let best = null,
      dist = Infinity;
    for (const a of points(body(s))) {
      if (kind && a.k !== kind || !siteReady(w, a)) continue;
      const d = distance(s.loc, a);
      if (d < dist) {
        best = a;
        dist = d;
      }
    }
    return best;
  }
  function destination(s, x, y, after = null) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return fail('target');
    s.nav = {
      x: mod(x, 1024),
      y: mod(y, 1024),
      after
    };
    return success('course');
  }
  function harvest(s, site) {
    if (s.loc.scope !== 'ground' || !site) return fail('far');
    const w = world(s),
      p = body(s),
      stats = G.physiology(s.genes);
    if (!siteReady(w, site)) return fail('spent');
    if (distance(s.loc, site) > stats.reach + 4) return fail('far');
    const env = G.environment(p, site.x, site.y, w, s.tick);
    if (site.k === 'shore') {
      if (s.era < 1 || !s.genes.lung) return fail('lung');
      if (!dry(s)) return fail('needLand');
      s.stats.landfall = true;
      return success('landfall');
    }
    if (site.k.startsWith('tribe')) return G.action(s, 'dip', {
      index: Number(site.k.slice(-1)),
      mode: 'greet',
      arrived: true
    });
    let result;
    switch (site.k) {
      case 'food':
        result = {
          bio: 3 + s.genes.sym,
          brine: 1
        };
        s.vital = Math.min(100, s.vital + 11);
        s.stats.meals++;
        w.pressure = Math.min(50, w.pressure + .6);
        break;
      case 'reef':
        result = {
          ore: 4 + (s.policy === 'tech' && s.era >= 3 ? 1 : 0)
        };
        break;
      case 'prism':
        result = {
          crystal: 3,
          charge: 1
        };
        break;
      case 'vent':
        result = {
          charge: 3 + Math.floor(env.potential * 3) + s.genes.sense,
          brine: 3
        };
        w.field = Math.max(-16, w.field - 1.4);
        s.vital = Math.min(100, s.vital + 7);
        break;
      case 'toxin':
        s.vital = Math.max(2, s.vital - 8 * stats.defense);
        result = {
          brine: 4
        };
        break;
      default:
        return fail('target');
    }
    grant(s, result);
    w.harvest[site.id] = w.clock + (site.k === 'food' ? 5 : 8);
    return success('harvest', {
      item: site.k,
      gain: result
    });
  }
  function orbit(s) {
    if (s.loc.scope === 'ground') world(s).pos = {
      x: s.loc.x,
      y: s.loc.y
    };
    s.ship.vx = 0;
    s.ship.vy = 0;
    s.loc.scope = 'orbit';
    s.loc.x = 512;
    s.loc.y = 530;
    s.nav = null;
    s.actors = [];
  }
  function land(s, pid) {
    const id = s.loc.sid,
      ps = G.bodies(s.seed, id, s.artificial[id] || []),
      dest = ps.find(b => b.id === pid);
    if (s.loc.scope !== 'orbit' || !dest) return fail('target');
    if (distance(s.loc, dest) > 25) return destination(s, dest.x, dest.y, {
      cmd: 'land',
      pid
    });
    s.ship.vx = 0;
    s.ship.vy = 0;
    s.loc.pid = pid;
    s.loc.scope = 'ground';
    const w = world(s);
    aggregate(s, w, body(s));
    collect(s, w);
    Object.assign(s.loc, w.pos || {
      x: 512,
      y: 512
    });
    s.actors = G.actors(body(s));
    s.nav = null;
    entry(s, 'landing', body(s).name);
    return success('landing');
  }
  function step(s, input = {}) {
    const dt = .125;
    s.tick++;
    const w = world(s),
      p = body(s),
      local = s.loc.scope === 'ground',
      stats = G.physiology(s.genes);
    aggregate(s, w, p);
    if (s.tick % 8 === 0) collect(s, w);
    s.cool.hit = Math.max(0, s.cool.hit - dt);
    s.cool.pulse = Math.max(0, s.cool.pulse - dt);
    if (local) {
      if (s.tick % 32 === 0) G.syncResidents(s, w, p);
      G.updateActors(s, w, points(p), dt * G.environment(p, s.loc.x, s.loc.y, w, s.tick).timeRate);
      s.vital = clamp(s.vital + ((s.era >= 2 ? .16 : .045) - stats.upkeep + (s.genes.sym && G.terrain(p, s.loc.x, s.loc.y) > .48 ? .10 : 0)) * dt, 0, 100);
    }
    let x = input.x || 0,
      y = input.y || 0;
    if (x || y) s.nav = null;
    const d = s.nav ? distance(s.loc, s.nav) : 0;
    if (s.nav) {
      x = delta(s.loc.x, s.nav.x);
      y = delta(s.loc.y, s.nav.y);
    }
    const len = Math.hypot(x, y);
    if (!local && !s.nav) {
      const acceleration = (s.ship.drive === 'gravity' ? 61 : 49) * (input.fast && s.ship.fuel > .01 ? 1.65 : 1),
        max = s.ship.hull === 'organic' ? 86 : 102;
      if (input.fast && len > .01) s.ship.fuel = Math.max(0, s.ship.fuel - .065 * dt);
      const damp = Math.pow(input.brake ? .13 : len ? .88 : .64, dt);
      s.ship.vx = (s.ship.vx + (len ? x / len : 0) * acceleration * dt) * damp;
      s.ship.vy = (s.ship.vy + (len ? y / len : 0) * acceleration * dt) * damp;
      const v = Math.hypot(s.ship.vx, s.ship.vy);
      if (v > max) {
        s.ship.vx *= max / v;
        s.ship.vy *= max / v;
      }
      if (v > .05) {
        s.loc.x = mod(s.loc.x + s.ship.vx * dt, 1024);
        s.loc.y = mod(s.loc.y + s.ship.vy * dt, 1024);
      }
      if (len > .01) s.loc.angle = Math.atan2(y, x);
    } else if (len > .01) {
      let speed = local ? (stats.speed + (s.era >= 2 ? 18 : 0) + count(w, 'road') * 3) / Math.sqrt(p.gravity * w.gravity) : s.ship.hull === 'organic' ? 80 : 94;
      if (local && s.era <= 1 && !s.genes.lung && G.terrain(p, s.loc.x, s.loc.y) > .48) speed *= .56;
      if (input.fast && s.vital > 8) {
        speed *= 1.65;
        if (local) s.vital -= .8 * dt;
      }
      const stride = s.nav ? Math.min(d, speed * dt) : speed * dt;
      s.loc.x = mod(s.loc.x + x / len * stride, 1024);
      s.loc.y = mod(s.loc.y + y / len * stride, 1024);
      s.loc.angle = Math.atan2(y, x);
    }
    if (local && s.era >= 1 && s.genes.lung && dry(s)) s.stats.landfall = true;
    let result = null;
    if (s.nav && distance(s.loc, s.nav) < 1.2) {
      const a = s.nav.after;
      s.nav = null;
      if (!local) {
        s.ship.vx = 0;
        s.ship.vy = 0;
      }
      if (a) result = a.cmd === 'sample' ? harvest(s, points(p)[a.id]) : G.action(s, a.cmd, {
        ...a,
        arrived: true
      });
    }
    if (local) {
      const danger = points(p).some(a => a.k === 'toxin' && distance(s.loc, a) < 8);
      if (danger) s.vital -= 1.6 * stats.defense * dt;
      if (s.vital <= .1) {
        Object.assign(s.loc, w.pos || {
          x: 512,
          y: 512
        });
        s.vital = 65;
        s.res.bio *= .8;
        s.cool.hit = 10;
        s.nav = null;
        entry(s, 'recovery');
        result = success('recovery');
      }
    }
    return result;
  }
  Object.assign(G, {
    key,
    body,
    world,
    points,
    entry,
    birth,
    create,
    grant,
    capacity,
    afford,
    spend,
    count,
    dry,
    aggregate,
    collect,
    success,
    fail,
    siteReady,
    nearest,
    destination,
    harvest,
    orbit,
    land,
    step
  });
})();
