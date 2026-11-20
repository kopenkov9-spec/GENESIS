(() => {
  const {
    success,
    fail,
    spend,
    grant,
    clamp,
    body,
    world,
    entry
  } = G;
  const condition = (id, done, panel) => ({
    id,
    done: !!done,
    panel
  });
  function goals(s) {
    const c = condition,
      w = world(s, G.HOME, 0),
      has = k => G.count(w, k) > 0;
    switch (s.era) {
      case 0:
        return [c('feed3', s.stats.meals >= 3, 'field'), c('edit', G.traits.some(k => s.genes[k] > 0), 'anatomy'), c('divide', s.stats.births >= 2, 'anatomy')];
      case 1:
        return [c('lungsense', s.genes.lung && s.genes.sense, 'anatomy'), c('shore', s.stats.landfall, 'field'), c('brood', s.stats.broods, 'anatomy')];
      case 2:
        return [c('village', has('camp'), 'build'), c('toolcraft', s.knowledge.tools, 'lab'), c('pact', w.allies.some(Boolean), 'society')];
      case 3:
        return [c('power', has('reactor') || has('biomech') || has('machine'), 'build'), c('shipyard', has('yard'), 'build'), c('tuning', s.knowledge.resonance, 'lab')];
      case 4:
        return [c('outpost', s.stats.colonies > 0, 'build'), c('station', Object.keys(s.stations).length, 'build'), c('contact', s.stats.firstContact, 'society'), c('fold', s.knowledge.fold, 'lab')];
      default:
        return [];
    }
  }
  function genesCost(s, k) {
    const c = {};
    for (const [r, v] of Object.entries(G.anatomy[k] || {})) c[r] = v * (1 + (s.genes[k] || 0));
    return c;
  }
  function assemble(s, k) {
    const d = Object.hasOwn(G.builds, k) ? G.builds[k] : null,
      w = world(s),
      p = body(s);
    if (!d || s.era < d.era) return fail('era');
    if (d.know && !s.knowledge[d.know]) return fail('needsKnow', {
      item: d.know
    });
    if (!!d.orbit !== (s.loc.scope === 'orbit')) return fail(d.orbit ? 'orbitOnly' : 'groundOnly');
    if (d.away && s.loc.sid === G.HOME) return fail('foreign');
    if (k === 'station' && s.stations[s.loc.sid] || k === 'ring' && s.rings[s.loc.sid] || (k === 'colony' || k === 'portal') && G.count(w, k)) return fail('exists');
    if (!d.orbit && w.buildings.length >= 96) return fail('full');
    if (!spend(s, d.cost)) return fail('resources');
    if (d.orbit) {
      (k === 'station' ? s.stations : s.rings)[s.loc.sid] = {
        pid: s.loc.pid,
        x: s.loc.x,
        y: s.loc.y
      };
    } else {
      // A compact settlement takes new sites around its founding point.
      let x = s.loc.x,
        y = s.loc.y;
      for (let n = 0; n < 96 && w.buildings.some(b => G.distance({
        x,
        y
      }, b) < 12); n++) {
        const a = n * 2.4,
          rad = 13 + 3 * Math.sqrt(n);
        x = G.mod(s.loc.x + Math.cos(a) * rad, 1024);
        y = G.mod(s.loc.y + Math.sin(a) * rad, 1024);
      }
      w.buildings.push({
        k,
        x,
        y,
        age: 0
      });
      if (k === 'colony') {
        s.stats.colonies++;
        w.kin.push({
          name: s.worlds[G.key(G.HOME, 0)].kin[0].name,
          n: 8,
          x,
          y,
          genes: {
            ...s.genes
          }
        });
      }
      if (k === 'portal') s.portals.push({
        sid: s.loc.sid,
        pid: s.loc.pid,
        x,
        y
      });
      if (k === 'biomech') {
        const g = {
          ...s.genes,
          shell: Math.min(4, s.genes.shell + 1)
        };
        w.pops.push(G.population(p, w.pops.length, x, y, g, 6));
      }
    }
    entry(s, 'built', k);
    return success('built', {
      item: k
    });
  }
  function experiment(s, a) {
    if (s.era < 2) return fail('era');
    const {
      left,
      right,
      drive,
      level
    } = a;
    if (!Object.hasOwn(G.materials, left) || !Object.hasOwn(G.materials, right) || !['flux', 'heat', 'current'].includes(drive) || ![1, 2, 3].includes(level)) return fail('target');
    const cost = {
      charge: level
    };
    cost[left] = (cost[left] || 0) + 1;
    cost[right] = (cost[right] || 0) + 1;
    if (!spend(s, cost)) return fail('resources');
    const w = world(s),
      p = body(s),
      env = G.environment(p, s.loc.x, s.loc.y, w, s.tick);
    const m = G.measure(left, right, drive, level, env.field, env.temp, p.lattice);
    const id = Object.keys(G.recipes).find(k => {
      const r = G.recipes[k];
      return r.drive === drive && level >= r.min && r.props.every(prop => m.match(prop) > .72) && m.response >= m.threshold(k) && (!r.needs || r.needs.every(n => s.knowledge[n]));
    });
    const fresh = id && !s.knowledge[id],
      sample = {
        tick: s.tick,
        left,
        right,
        drive,
        level,
        field: +env.field.toFixed(3),
        temperature: +env.temp.toFixed(2),
        response: +m.response.toFixed(3),
        result: id || ''
      };
    s.trials.push(sample);
    if (s.trials.length > 60) s.trials.shift();
    w.heat = Math.min(100, w.heat + m.heat * .35);
    if (id && fresh) {
      s.knowledge[id] = {
        ...sample,
        sid: s.loc.sid,
        pid: s.loc.pid
      };
      grant(s, {
        lore: 3
      });
      entry(s, 'discovered', id);
    }
    return success(fresh ? 'discovered' : id ? 'repeat' : 'inert', {
      item: id,
      sample
    });
  }
  function diplomacy(s, a) {
    if (s.era < 2) return fail('era');
    const alien = s.loc.scope === 'orbit',
      w = world(s),
      i = Number(a.index ?? 0),
      mode = a.mode;
    if (!Number.isInteger(i) || i < 0 || i > 2 || !['greet', 'trade', 'ally', 'contest'].includes(mode)) return fail('target');
    if (alien && s.loc.sid === G.HOME) return fail('foreign');
    const remote = G.count(w, 'relay') > 0;
    if (!alien && !remote) {
      const t = G.points(body(s)).find(x => x.k === 'tribe' + i);
      if (G.distance(s.loc, t) > 20) return G.destination(s, t.x, t.y, {
        cmd: 'dip',
        index: i,
        mode
      });
    }
    const civ = G.civilization(s.seed, s.loc.sid, s.tick / 8);
    const contact = alien ? s.contacts[s.loc.sid] || {
      relation: 0,
      ally: false,
      traded: 0
    } : null;
    let rel = alien ? contact.relation : w.relations[i],
      ally = alien ? contact.ally : w.allies[i];
    if (mode === 'greet') {
      if (!spend(s, {
        bio: 1
      })) return fail('resources');
      rel = Math.min(4, rel + 1);
      w.culture += .6;
    }
    if (mode === 'trade') {
      if (!spend(s, {
        ore: 2
      })) return fail('resources');
      grant(s, {
        crystal: alien ? civ.wealth : 2,
        brine: 1
      });
      rel = Math.min(6, rel + 1);
      s.stats.trade++;
      if (alien) contact.traded++;
    }
    if (mode === 'ally') {
      if (rel < 2) return fail('trust');
      if (ally) return fail('exists');
      if (!spend(s, {
        bio: 2
      })) return fail('resources');
      ally = true;
      w.culture += 2;
      grant(s, {
        lore: 2
      });
    }
    if (mode === 'contest') {
      if (!spend(s, {
        charge: 2
      })) return fail('resources');
      rel = Math.max(-6, rel - 3);
      ally = false;
      w.conflicts++;
      s.vital = Math.max(5, s.vital - 7 / (1 + s.genes.shell + G.count(w, 'construct')));
      grant(s, {
        ore: 3,
        bio: 1
      });
    }
    if (alien) {
      contact.relation = rel;
      contact.ally = ally;
      s.contacts[s.loc.sid] = contact;
      s.stats.firstContact = true;
    } else {
      w.relations[i] = rel;
      w.allies[i] = ally;
    }
    entry(s, mode, alien ? civ.name : G.name(G.hash(body(s).seed, 'house', i)));
    return success(mode);
  }
  function action(s, cmd, a = {}) {
    const w = world(s),
      p = body(s),
      ground = s.loc.scope === 'ground';
    switch (cmd) {
      case 'move':
        return G.destination(s, a.x, a.y);
      case 'seek':
        {
          const t = G.nearest(s, a.kind);
          if (!t) return fail('unavailable');
          return G.destination(s, t.x, t.y, {
            cmd: 'sample',
            id: t.id
          });
        }
      case 'use':
        if (!ground) {
          const b = G.bodies(s.seed, s.loc.sid, s.artificial[s.loc.sid] || []).find(x => G.distance(s.loc, x) <= 25);
          return b ? G.land(s, b.id) : action(s, 'refuel');
        }
        return G.harvest(s, G.nearest(s));
      case 'pulse':
        {
          if (!ground || s.cool.pulse > 0) return fail('cool');
          if (!spend(s, {
            charge: 2
          })) return fail('resources');
          const r = G.physiology(s.genes).sense;
          for (const q of s.actors) if (G.distance(s.loc, q) < r) {
            q.stun = 4 + s.genes.sense;
            q.x = G.mod(q.x + G.delta(s.loc.x, q.x) * .5, 1024);
            q.y = G.mod(q.y + G.delta(s.loc.y, q.y) * .5, 1024);
          }
          w.heat = Math.min(100, w.heat + 1.6);
          w.field = Math.min(26, w.field + .35);
          s.cool.pulse = 4;
          s.stats.pulses++;
          return success('pulse');
        }
      case 'organ':
        if (!G.traits.includes(a.k) || s.genes[a.k] >= 4) return fail('max');
        if (a.k === 'lung' && s.era < 1) return fail('era');
        if (!spend(s, genesCost(s, a.k))) return fail('resources');
        s.genes[a.k]++;
        s.lineage.push({
          tick: s.tick,
          kind: 'organ',
          genes: {
            ...s.genes
          },
          sid: s.loc.sid,
          pid: s.loc.pid
        });
        entry(s, 'organ', a.k);
        return success('organ', {
          item: a.k
        });
      case 'divide':
        {
          if (!ground) return fail('groundOnly');
          if (!spend(s, {
            bio: 4
          })) return fail('resources');
          const kin = w.kin[0],
            child = G.inherit(s.genes, kin?.genes || s.genes, G.hash(s.seed, 'birth', s.stats.births), true);
          s.mutant = child;
          G.birth(s, 'offspring', child);
          if (kin) {
            kin.n++;
            kin.genes = {
              ...child
            };
          }
          entry(s, 'offspring');
          return success('offspring');
        }
      case 'inherit':
        if (!s.mutant) return fail('nochild');
        s.genes = {
          ...s.mutant
        };
        s.mutant = null;
        s.lineage.push({
          tick: s.tick,
          kind: 'inherit',
          genes: {
            ...s.genes
          },
          sid: s.loc.sid,
          pid: s.loc.pid
        });
        entry(s, 'inherit');
        return success('inherit');
      case 'brood':
        {
          if (s.era < 1 || !ground || !s.genes.lung || !G.dry(s)) return fail('needLand');
          if (!spend(s, {
            bio: 4
          })) return fail('resources');
          w.kin.push({
            name: G.name(G.hash(p.seed, w.kin.length, 'line')),
            n: 5,
            x: s.loc.x,
            y: s.loc.y,
            genes: {
              ...s.genes
            }
          });
          w.pops.push(G.population(p, w.pops.length, s.loc.x, s.loc.y, s.genes, 5));
          s.stats.broods++;
          entry(s, 'brood');
          return success('brood');
        }
      case 'advance':
        {
          if (s.era >= 5 || goals(s).some(o => !o.done)) return fail('goals');
          s.era++;
          s.epochs.push(s.tick);
          grant(s, {
            bio: 3,
            ore: 2,
            crystal: 2,
            brine: 1,
            charge: 4
          });
          s.vital = 100;
          if (s.era === 4) G.orbit(s);
          entry(s, 'epoch', String(s.era));
          return success('epoch');
        }
      case 'build':
        return assemble(s, a.k);
      case 'experiment':
        return experiment(s, a);
      case 'dip':
        return diplomacy(s, a);
      case 'policy':
        if (s.era < 3 || !['tech', 'arcane', 'living', 'hybrid'].includes(a.k)) return fail('era');
        settleEconomies(s);
        s.policy = a.k;
        entry(s, 'policy', a.k);
        return success('policy');
      case 'priority':
        if (s.era < 3 || !['forge', 'weave', 'grow'].includes(a.k)) return fail('era');
        settleEconomies(s);
        s.priority = a.k;
        entry(s, 'priority', a.k);
        return success('priority');
      case 'scan':
        {
          if (s.era < 4 || ground) return fail('orbitOnly');
          const site = G.anomalySite(s.seed, s.loc.sid);
          if (G.distance(s.loc, site) > 15) return G.destination(s, site.x, site.y, {
            cmd: 'scan'
          });
          if (s.scans[s.loc.sid]) return success('scanRepeat');
          if (!spend(s, {
            charge: 2
          })) return fail('resources');
          s.scans[s.loc.sid] = {
            tick: s.tick,
            k: site.k,
            intensity: site.intensity
          };
          grant(s, {
            lore: 3,
            crystal: 2
          });
          w.heat = Math.min(100, w.heat + site.intensity * 2);
          entry(s, 'scan', site.k);
          return success('scan', {
            item: site.k
          });
        }
      case 'drive':
        if (s.era < 4 || !['thrust', 'gravity'].includes(a.k)) return fail('era');
        if (a.k === 'gravity' && !s.knowledge.resonance) return fail('needsKnow', {
          item: 'resonance'
        });
        s.ship.drive = a.k;
        return success('drive');
      case 'brake':
        if (ground) return fail('orbitOnly');
        s.nav = null;
        s.ship.vx = 0;
        s.ship.vy = 0;
        return success('brake');
      case 'bank':
        {
          if (s.era < 3 || !ground) return fail('groundOnly');
          if (!G.count(w, 'reactor') && !G.count(w, 'school') && !G.count(w, 'portal')) return fail('storeSite');
          if (a.mode === 'deposit') {
            if (w.battery > 35) return fail('full');
            if (!spend(s, {
              charge: 5
            })) return fail('resources');
            w.battery += 5;
            return success('deposit');
          }
          if (a.mode === 'withdraw') {
            const n = Math.min(5, w.battery, G.capacity(s) - s.res.charge);
            if (n < .001) return fail('empty');
            w.battery -= n;
            grant(s, {
              charge: n
            });
            return success('withdraw');
          }
          if (a.mode === 'transfer') {
            const to = s.portals[a.index];
            if (!G.count(w, 'portal') || !to || to.sid === s.loc.sid && to.pid === s.loc.pid) return fail('gatePair');
            const dest = world(s, to.sid, to.pid);
            if (w.battery < 5 || dest.battery > 36) return fail('empty');
            w.battery -= 5;
            dest.battery += 4;
            w.heat = Math.min(100, w.heat + 1);
            return success('transfer');
          }
          return fail('target');
        }
      case 'hull':
        if (s.era < 3 || !['keel', 'organic'].includes(a.k)) return fail('era');
        if (a.k === 'organic' && !s.knowledge.culture) return fail('needsKnow', {
          item: 'culture'
        });
        s.ship.hull = a.k;
        entry(s, 'hull', a.k);
        s.ship.fuel = Math.min(s.ship.fuel, maxFuel(s));
        return success('hull');
      case 'launch':
        if (s.era < 4 || !ground) return fail('era');
        G.orbit(s);
        return success('launch');
      case 'land':
        return G.land(s, a.pid);
      case 'refuel':
        {
          if (ground) return fail('orbitOnly');
          const station = s.stations[s.loc.sid],
            near = station && G.distance(s.loc, station) < 28;
          if (!near && G.distance(s.loc, {
            x: 512,
            y: 512
          }) > 27) return G.destination(s, 512, 512, {
            cmd: 'refuel'
          });
          const amount = maxFuel(s) - s.ship.fuel;
          if (amount < .001) return success('refuel');
          s.ship.fuel = maxFuel(s);
          if (!near) w.heat = Math.min(100, w.heat + amount * .12);
          return success('refuel');
        }
      case 'jump':
        {
          if (s.era < 4 || ground) return fail('orbitOnly');
          if (!Number.isInteger(a.sid) || a.sid < 0 || a.sid >= G.CAPACITY || a.sid === s.loc.sid) return fail('target');
          const distance = G.sectorDist(s.loc.sid, a.sid),
            cost = jumpCost(s, a.sid);
          if (distance > jumpRange(s)) return fail('range');
          if (s.ship.fuel + 1e-8 < cost) return fail('fuel');
          if (s.ship.drive === 'gravity') {
            if (!spend(s, {
              charge: 2
            })) return fail('resources');
            w.heat = Math.min(100, w.heat + 2);
          }
          s.ship.fuel -= cost;
          return enterSystem(s, a.sid);
        }
      case 'rift':
        {
          if (s.era < 5 || ground) return fail('orbitOnly');
          if (!Number.isInteger(a.sid) || a.sid < 0 || a.sid >= G.CAPACITY || a.sid === s.loc.sid) return fail('target');
          if (!spend(s, {
            charge: 12,
            crystal: 2
          })) return fail('resources');
          w.heat = Math.min(100, w.heat + 12);
          return enterSystem(s, a.sid);
        }
      case 'gravity':
      case 'time':
        {
          if (s.era < 5 || !ground) return fail('groundOnly');
          const levels = cmd === 'gravity' ? [.6, 1, 1.45] : [.5, 1, 2];
          if (!levels.includes(a.value)) return fail('target');
          if (!spend(s, {
            charge: 3,
            crystal: 1
          })) return fail('resources');
          if (cmd === 'gravity') w.gravity = a.value;else w.tempo = a.value;
          w.heat = Math.min(100, w.heat + 4);
          entry(s, cmd, String(a.value));
          return success(cmd);
        }
      case 'species':
      case 'ecosystem':
        {
          if (s.era < 5 || !ground) return fail('groundOnly');
          const eco = cmd === 'ecosystem';
          if (w.pops.length + (eco ? 3 : 1) > 128) return fail('full');
          if (!spend(s, eco ? {
            bio: 8,
            brine: 4,
            charge: 3
          } : {
            bio: 4,
            charge: 2
          })) return fail('resources');
          for (let i = 0; i < (eco ? 3 : 1); i++) {
            const g = G.inherit(s.genes, s.genes, G.hash(p.seed, w.designs++, cmd), true);
            if (eco) g.sym = Math.max(1, g.sym);
            w.pops.push(G.population(p, w.pops.length, G.mod(s.loc.x + i * 35, 1024), s.loc.y, g, 8));
          }
          w.field = Math.min(26, w.field + 1);
          s.stats.engineered++;
          entry(s, cmd);
          return success(cmd);
        }
      case 'planet':
        {
          if (s.era < 5 || ground) return fail('orbitOnly');
          const list = s.artificial[s.loc.sid] || [];
          if (list.length >= 12) return fail('full');
          if (!spend(s, {
            ore: 8,
            charge: 6,
            crystal: 4
          })) return fail('resources');
          const pid = 8 + list.length;
          s.artificial[s.loc.sid] = [...list, pid];
          entry(s, 'planet', G.planet(s.seed, s.loc.sid, pid).name);
          return success('planet', {
            pid
          });
        }
      case 'gate':
        {
          const from = s.portals.find(b => b.sid === s.loc.sid && b.pid === s.loc.pid && G.distance(s.loc, b) < 25),
            to = s.portals[a.index];
          if (s.era < 5 || !ground || !from || !to || to === from) return fail('gatePair');
          if (!spend(s, {
            charge: 4
          })) return fail('resources');
          w.pos = {
            x: s.loc.x,
            y: s.loc.y
          };
          w.heat = Math.min(100, w.heat + 3);
          Object.assign(s.loc, {
            sid: to.sid,
            pid: to.pid,
            x: to.x,
            y: to.y
          });
          s.nav = null;
          s.actors = G.actors(body(s));
          const dest = world(s);
          G.aggregate(s, dest, body(s));
          G.collect(s, dest);
          entry(s, 'gate', body(s).name);
          return success('gate');
        }
      default:
        return fail('target');
    }
  }
  function settleEconomies(s) {
    for (const [id, w] of Object.entries(s.worlds)) {
      if (!w.buildings.length) continue;
      const [sid, pid] = id.split('/').map(Number);
      G.aggregate(s, w, G.planet(s.seed, sid, pid));
    }
  }
  function maxFuel(s) {
    return s.ship.hull === 'organic' ? 22 : 16;
  }
  function jumpRange(s) {
    return 4.5 + (s.ship.drive === 'gravity' ? 2 : 0) + (s.knowledge.fold ? 1.5 : 0) + (s.policy === 'tech' ? .6 : 0);
  }
  function jumpCost(s, id) {
    return (1 + G.sectorDist(s.loc.sid, id) * 1.65) * (s.ship.hull === 'organic' ? .8 : 1) * (s.ship.drive === 'gravity' ? .72 : 1) * (G.system(s.seed, s.loc.sid).anomaly === 'shear' ? 1.08 : 1);
  }
  function enterSystem(s, id) {
    s.ship.vx = 0;
    s.ship.vy = 0;
    s.loc.sid = id;
    s.loc.pid = 0;
    s.loc.x = 512;
    s.loc.y = 530;
    s.nav = null;
    world(s);
    if (!s.visited.includes(id)) s.visited.push(id);
    entry(s, 'jump', G.system(s.seed, id).name);
    return success('jump');
  }
  Object.assign(G, {
    goals,
    genesCost,
    action,
    maxFuel,
    jumpRange,
    jumpCost
  });
})();
