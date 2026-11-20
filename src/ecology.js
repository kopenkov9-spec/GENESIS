(() => {
  const {
    hash,
    rng,
    name,
    clamp,
    mod,
    delta,
    distance
  } = G;
  const blankGenes = () => ({
    fin: 0,
    shell: 0,
    sense: 0,
    lung: 0,
    sym: 0
  });
  function inherit(a, b, seed, force = false) {
    const r = rng(seed),
      g = {};
    for (const k of G.traits) g[k] = r() < .5 ? a[k] : b[k];
    if (force || r() < .38) {
      const k = G.traits[Math.floor(r() * 5)];
      g[k] = clamp(g[k] + (r() < .77 ? 1 : -1), 0, 4);
    }
    return g;
  }
  function population(p, i, x, y, genes, n = 12) {
    const h = hash(p.seed, 'population', i);
    return {
      id: i,
      name: name(h),
      parent: -1,
      genes: {
        ...genes
      },
      n,
      x,
      y,
      age: 0,
      isolation: 0,
      diverged: false,
      pressure: 0
    };
  }
  function makeWorld(p) {
    const r = rng(hash(p.seed, 'genomes')),
      pops = [];
    for (let i = 0; i < 3; i++) {
      const g = blankGenes();
      g[G.traits[i]] = 1 + Math.floor(r() * 2);
      pops.push(population(p, i, 110 + r() * 790, 110 + r() * 790, g, 8 + Math.floor(r() * 8)));
    }
    return {
      heat: 0,
      field: 0,
      battery: 0,
      pressure: 0,
      gravity: 1,
      tempo: 1,
      clock: 0,
      last: 0,
      cycle: 0,
      harvest: {},
      buildings: [],
      pops,
      kin: [],
      relations: [0, 0, 0],
      allies: [false, false, false],
      conflicts: 0,
      culture: 0,
      stock: {
        bio: 0,
        ore: 0,
        crystal: 0,
        brine: 0,
        charge: 0,
        lore: 0
      },
      pos: null,
      designs: 0
    };
  }
  function physiology(g) {
    return {
      speed: 29 + 9 * g.fin + 2 * g.lung,
      reach: 11 + 3.2 * g.sense,
      defense: 1 / (1 + .56 * g.shell),
      upkeep: .075 + .012 * (g.fin + g.shell + g.lung) - .012 * g.sym,
      sense: 47 + g.sense * 27
    };
  }
  // A controller is a pure observation -> movement policy. It has no DOM or save access.
  const nativeController = {
    decide(o) {
      const {
        a,
        food,
        threat,
        player,
        genes
      } = o;
      let target,
        sign = 1;
      if (a.role === 'hunter' && o.playerDistance < 65 + genes.sense * 14 && o.playerDistance > 0) target = player;else if (threat && o.threatDistance < 43 + genes.sense * 8) {
        target = threat;
        sign = -1;
      } else if (food && a.energy < .78) target = food;
      if (target) return {
        x: delta(a.x, target.x) * sign,
        y: delta(a.y, target.y) * sign
      };
      const phase = a.id * 5.32 + o.time * .18;
      return {
        x: Math.cos(phase + Math.sin(a.y * .012)),
        y: Math.sin(phase * .81 + Math.cos(a.x * .013))
      };
    }
  };
  let controller = nativeController,
    controllerError = '';
  function setEvolutionController(next) {
    if (next !== null && typeof next?.decide !== 'function') throw Error('decide(observation)');
    controller = next || nativeController;
    controllerError = '';
  }
  function actors(p) {
    const r = rng(hash(p.seed, 'swarm')),
      out = [];
    for (let i = 0; i < 28; i++) {
      const a = r() * Math.PI * 2,
        rad = i < 15 ? 34 + r() * 125 : 120 + r() * 340;
      out.push({
        id: i,
        x: mod(512 + Math.cos(a) * rad, 1024),
        y: mod(512 + Math.sin(a) * rad, 1024),
        angle: a,
        role: i % 7 === 2 ? 'hunter' : 'grazer',
        pop: i % 3,
        energy: .4 + r() * .55,
        stun: 0
      });
    }
    return out;
  }
  function syncResidents(s, w, p) {
    const cohorts = w.pops.filter(q => q.id >= 3).sort((a, b) => distance(s.loc, a) - distance(s.loc, b)).slice(0, 8);
    const previous = new Map(s.actors.filter(a => a.id >= 28).map(a => [a.pop, a]));
    s.actors = s.actors.filter(a => a.id < 28);
    for (const q of cohorts) {
      const r = rng(hash(p.seed, q.id, 'resident'));
      s.actors.push(previous.get(q.id) || {
        id: 28 + q.id,
        x: mod(q.x + (r() - .5) * 12, 1024),
        y: mod(q.y + (r() - .5) * 12, 1024),
        angle: r() * Math.PI * 2,
        role: q.genes.sym ? 'grazer' : q.genes.shell > 2 ? 'hunter' : 'grazer',
        pop: q.id,
        energy: .82,
        stun: 0
      });
    }
  }
  function updateActors(s, w, sites, dt) {
    const grid = new G.SpatialGrid();
    for (const a of s.actors) grid.add(a);
    const player = s.loc,
      visible = s.era < 2,
      stats = physiology(s.genes);
    for (const a of s.actors) {
      a.stun = Math.max(0, a.stun - dt);
      if (a.stun) continue;
      const genes = w.pops[a.pop % w.pops.length].genes,
        playerDistance = visible ? distance(a, player) : Infinity;
      if (genes.sym && playerDistance < 16) {
        s.vital = Math.min(100, s.vital + .18 * dt);
        a.energy = Math.min(1, a.energy + .035 * dt);
      }
      const nearby = grid.near(a.x, a.y, 59);
      let threat,
        threatDistance = Infinity;
      for (const b of nearby) if (b.role === 'hunter' && b !== a) {
        const d = distance(a, b);
        if (d < threatDistance) {
          threat = b;
          threatDistance = d;
        }
      }
      let food,
        fd = Infinity;
      if (a.energy < .78) {
        for (const site of sites) if (site.k === 'food') {
          const d = distance(a, site);
          if (d < fd) {
            fd = d;
            food = site;
          }
        }
      }
      const observation = {
        a: {
          ...a
        },
        genes: {
          ...genes
        },
        food: food && {
          ...food
        },
        threat: threat && {
          ...threat
        },
        player: {
          x: player.x,
          y: player.y
        },
        playerDistance,
        threatDistance,
        time: s.tick / 8
      };
      let cmd;
      try {
        cmd = controller.decide(observation);
      } catch (error) {
        controllerError = String(error);
        controller = nativeController;
        cmd = controller.decide(observation);
        console.warn('Evolution controller: ' + controllerError);
      }
      if (!cmd || !Number.isFinite(cmd.x) || !Number.isFinite(cmd.y)) cmd = {
        x: 0,
        y: 0
      };
      const len = Math.hypot(cmd.x, cmd.y) || 1,
        sp = (a.role === 'hunter' ? 11 : 5.5) + genes.fin * 2;
      a.x = mod(a.x + cmd.x / len * sp * dt, 1024);
      a.y = mod(a.y + cmd.y / len * sp * dt, 1024);
      if (cmd.x || cmd.y) a.angle = Math.atan2(cmd.y, cmd.x);
      a.energy = clamp(a.energy + ((fd < 9 ? .11 : 0) - .002 * (1 + genes.fin)) * dt, .1, 1);
      if (playerDistance < 8 && a.role === 'hunter' && s.cool.hit <= 0) {
        s.vital -= 9 * stats.defense;
        a.energy = 1;
        s.cool.hit = 2.4;
        a.stun = .9;
      }
    }
  }
  function ecologicalCycle(w, p) {
    const born = [],
      cap = 38 + w.buildings.filter(b => b.k === 'farm' || b.k === 'biomech').length * 6;
    for (const pop of w.pops) {
      const env = G.environment(p, pop.x, pop.y, w),
        g = pop.genes;
      const neighbours = w.pops.filter(q => q !== pop && distance(pop, q) < 155);
      const sym = neighbours.some(q => q.genes.sym > 0 || g.sym > 0) ? .14 : 0;
      const matching = env.biome === 'water' ? g.fin * .08 : g.lung * .12;
      const fitness = .34 - w.pressure * .002 + matching + .04 * g.shell + .025 * g.sense + sym - w.heat * .0028;
      const competition = neighbours.reduce((a, b) => a + b.n * .18, 0);
      const pressure = (pop.n + competition) / cap + .028 * (g.fin + g.shell + g.lung);
      pop.pressure = pressure;
      pop.n = clamp(pop.n + pop.n * (fitness - pressure) * .064, 1, 600);
      pop.age++;
      pop.isolation = neighbours.length ? 0 : pop.isolation + 1;
      const r = rng(hash(p.seed, pop.id, pop.age));
      if (pop.age % 8 === 0 && pop.n >= 4) {
        const candidate = inherit(g, g, hash(p.seed, pop.id, pop.age, 'child'), true);
        const score = v => (env.biome === 'water' ? v.fin : v.lung) * .18 + v.sym * .1 + v.shell * (w.heat > .5 ? .13 : .02) - physiology(v).upkeep;
        if (score(candidate) > score(g) || r() < .17) pop.genes = candidate;
      }
      if (pop.isolation >= 14 && pop.n >= 5 && !pop.diverged && w.pops.length + born.length < 20) {
        const child = population(p, w.pops.length + born.length, mod(pop.x + 175 + r() * 64, 1024), mod(pop.y + 127 + r() * 64, 1024), inherit(g, g, hash(p.seed, pop.id, 'split'), true), pop.n * .28);
        child.parent = pop.id;
        pop.n *= .72;
        pop.diverged = true;
        born.push(child);
      }
    }
    w.pops.push(...born);
  }
  Object.assign(G, {
    blankGenes,
    inherit,
    population,
    makeWorld,
    physiology,
    setEvolutionController,
    actors,
    syncResidents,
    updateActors,
    ecologicalCycle
  });
  G.controllerStatus = () => ({
    custom: controller !== nativeController,
    error: controllerError
  });
})();
