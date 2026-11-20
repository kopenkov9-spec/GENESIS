'use strict';

const G = {};
(() => {
  const SIZE = 1024,
    AXIS = 16384,
    CAPACITY = AXIS * AXIS,
    HOME = 8192 * AXIS + 8192;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const mod = (v, n) => (v % n + n) % n;
  const delta = (a, b, span = SIZE) => mod(b - a + span / 2, span) - span / 2;
  const distance = (a, b) => Math.hypot(delta(a.x, b.x), delta(a.y, b.y));
  function hash(...parts) {
    let v = 2166136261;
    for (const c of parts.join('|')) {
      v = Math.imul(v ^ c.charCodeAt(0), 16777619);
    }
    v ^= v >>> 16;
    v = Math.imul(v, 0x7feb352d);
    v ^= v >>> 15;
    v = Math.imul(v, 0x846ca68b);
    return (v ^ v >>> 16) >>> 0;
  }
  function rng(seed) {
    let x = seed >>> 0 || 0x69341af;
    return () => {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      return (x >>> 0) / 4294967296;
    };
  }
  function name(seed) {
    const r = rng(seed),
      a = ['Ae', 'Va', 'O', 'Ly', 'Tha', 'Ne', 'I', 'Sa', 'Ve', 'Ke', 'Eli', 'Or', 'Me', 'Iri', 'Lu', 'Xa'],
      b = ['r', 'th', 'll', 'm', 'v', 'n', 'ss', 'l', 'd', 's', 'rh', 'k'],
      c = ['ion', 'ea', 'is', 'ora', 'ai', 'os', 'eth', 'une', 'a', 'ir', 'on', 'ara', 'ium', 'en'];
    return a[Math.floor(r() * a.length)] + b[Math.floor(r() * b.length)] + c[Math.floor(r() * c.length)];
  }
  const keys = ['bio', 'ore', 'crystal', 'brine', 'charge', 'lore'];
  const traits = ['fin', 'shell', 'sense', 'lung', 'sym'];
  const labels = {
    bio: ['Биомаса', 'Biomass'],
    ore: ['Руда', 'Ore'],
    crystal: ['Кристал', 'Crystal'],
    brine: ['Разсол', 'Brine'],
    charge: ['Заряд', 'Charge'],
    lore: ['Знание', 'Insight'],
    food: ['Хранителна колония', 'Nutrient bloom'],
    reef: ['Минерален риф', 'Mineral reef'],
    prism: ['Кристална жила', 'Prism vein'],
    vent: ['Етерен извор', 'Aether spring'],
    toxin: ['Токсичен облак', 'Toxin cloud'],
    shore: ['Бряг', 'Dry shore'],
    fin: ['Камшиче', 'Flagellum'],
    shell: ['Броня', 'Carapace'],
    sense: ['Антена', 'Antenna'],
    lung: ['Дихателна торбичка', 'Air sac'],
    sym: ['Симбионт', 'Symbiont'],
    heat: ['Топлина', 'Heat'],
    current: ['Електричество', 'Current'],
    flux: ['Етерен поток', 'Aether flux'],
    tools: ['Закалени влакна', 'Tempered fibres'],
    resonance: ['Кристален резонанс', 'Crystal resonance'],
    circuit: ['Проводяща решетка', 'Conductive lattice'],
    culture: ['Жива култура', 'Living culture'],
    mycelium: ['Невромицел', 'Neural mycelium'],
    ceramic: ['Синтерован камък', 'Sintered stone'],
    fold: ['Пространствена гънка', 'Spatial fold'],
    camp: ['Селище', 'Settlement'],
    farm: ['Градина', 'Garden'],
    mill: ['Работилница', 'Workshop'],
    school: ['Магическа школа', 'Aether school'],
    lab: ['Академия', 'Academy'],
    reactor: ['Кристален реактор', 'Crystal reactor'],
    machine: ['Саморазвиваща се машина', 'Evolving machine'],
    construct: ['Етерен конструкт', 'Aether construct'],
    biomech: ['Биомеханичен инкубатор', 'Biomech nursery'],
    relay: ['Телепатична мрежа', 'Telepathic relay'],
    road: ['Транспортна мрежа', 'Transit hub'],
    yard: ['Корабостроителница', 'Shipyard'],
    colony: ['Колония', 'Colony'],
    station: ['Космическа станция', 'Orbital station'],
    portal: ['Пространствен портал', 'Spatial portal'],
    ring: ['Звезден венец', 'Stellar ring'],
    mind: ['Синтетично съзнание', 'Synthetic mind'],
    tech: ['Технологична', 'Technological'],
    arcane: ['Магическа', 'Arcane'],
    living: ['Биологична', 'Biological'],
    hybrid: ['Хибридна', 'Hybrid'],
    water: ['Море', 'Sea'],
    coast: ['Бряг', 'Coast'],
    grove: ['Гора', 'Woodland'],
    desert: ['Суха степ', 'Arid steppe'],
    tundra: ['Тундра', 'Tundra'],
    highland: ['Височини', 'Highlands'],
    amber: ['Кехлибарена звезда', 'Amber star'],
    blue: ['Синя звезда', 'Blue star'],
    red: ['Червено джудже', 'Red dwarf'],
    white: ['Бяло джудже', 'White dwarf'],
    tide: ['Прилив на полето', 'Field tide'],
    bloom: ['Голям цъфтеж', 'Great bloom'],
    conclave: ['Събор на домовете', 'Council of houses'],
    drift: ['Прахова зима', 'Dust winter'],
    kin: ['Гнездов пазител', 'Brood keeper'],
    weaver: ['Тъкач на кристали', 'Crystal weaver'],
    ranger: ['Пазител на прилива', 'Tide warden'],
    calm: ['Тихо време', 'Clear'],
    rain: ['Дъжд', 'Rain'],
    mist: ['Мъгла', 'Mist'],
    snow: ['Сняг', 'Snow'],
    wind: ['Вятър', 'Wind'],
    thermal: ['Термична вълна', 'Thermal wave'],
    shear: ['Пространствено срязване', 'Spatial shear'],
    echo: ['Времево ехо', 'Temporal echo'],
    forge: ['Индустрия', 'Industry'],
    weave: ['Етер', 'Aether'],
    grow: ['Симбиоза', 'Symbiosis'],
    sun: ['Звезда', 'Star'],
    land: ['Повърхност', 'Surface']
  };
  const eras = [['Зараждане', 'Genesis'], ['Еволюция', 'Evolution'], ['Пробуждане', 'Awakening'], ['Цивилизация', 'Civilization'], ['Космическа епоха', 'Spaceflight'], ['Трансценденция', 'Transcendence']];
  const tr = (pair, lang = 'bg') => Array.isArray(pair) ? pair[lang === 'en' ? 1 : 0] : String(pair);
  const label = (k, lang) => tr(labels[k] || [k, k], lang);
  function coords(id) {
    return {
      x: id % AXIS,
      y: Math.floor(id / AXIS)
    };
  }
  function idAt(x, y) {
    return mod(x, AXIS) + AXIS * mod(y, AXIS);
  }
  function sectorDist(a, b) {
    const p = coords(a),
      q = coords(b);
    return Math.hypot(delta(p.x, q.x, AXIS), delta(p.y, q.y, AXIS));
  }
  function system(seed, id) {
    const h = hash(seed, 'star', id),
      r = rng(h);
    return {
      id,
      seed: h,
      name: name(h),
      star: ['amber', 'red', 'blue', 'white'][Math.floor(r() * 4)],
      count: 2 + Math.floor(r() * 4),
      dx: (r() - .5) * .54,
      dy: (r() - .5) * .54,
      anomaly: ['echo', 'shear', 'thermal'][Math.floor(r() * 3)],
      faction: name(hash(h, 'court')),
      culture: ['kin', 'weaver', 'ranger'][Math.floor(r() * 3)],
      event: ['tide', 'bloom', 'conclave', 'drift'][Math.floor(r() * 4)]
    };
  }
  const cache = new Map();
  function planet(seed, id, i) {
    const key = JSON.stringify([seed, id, i]);
    if (cache.has(key)) return cache.get(key);
    const h = hash(seed, 'body', id, i),
      r = rng(h),
      art = i >= 8;
    const p = {
      seed: h,
      id: i,
      sys: id,
      name: name(h),
      art,
      hue: Math.floor(r() * 60) + 124,
      temp: r() * 40 - 6,
      humidity: r(),
      gravity: .72 + r() * .83,
      anomaly: system(seed, id).anomaly,
      moons: Math.floor(r() * 4),
      atm: .42 + r() * .58,
      lattice: .75 + r() * .5,
      mineral: r(),
      phase: Array.from({
        length: 9
      }, () => r() * Math.PI * 2),
      flora: name(hash(h, 'leaf')),
      fauna: name(hash(h, 'fauna')),
      form: r(),
      culture: name(hash(h, 'tribe')),
      history: ['tide', 'bloom', 'drift', 'conclave'][Math.floor(r() * 4)]
    };
    if (cache.size >= 48) cache.delete(cache.keys().next().value);
    cache.set(key, p);
    return p;
  }
  function terrain(p, x, y) {
    const X = x / 1024 * 6.2831853,
      Y = y / 1024 * 6.2831853,
      k = p.phase;
    const v = .50 + .15 * Math.sin(X * 2 + Math.sin(Y + k[0]) + k[1]) + .13 * Math.cos(Y * 2 + Math.cos(X + k[2]) + k[3]) + .085 * Math.sin(X * 3 + Y * 2 + k[4]) + .05 * Math.cos(X * 5 - Y * 3 + k[5]) + .026 * Math.sin(X * 11 + Y * 7 + k[6]);
    // A persistent tidal estuary surrounds the lineage's first pool on every body.
    const dx = delta(512, x),
      dy = delta(512, y),
      f = clamp(1 - (Math.hypot(dx, dy) - 70) / 116, 0, 1);
    return v * (1 - f) + (.426 + .00195 * dx + .0004 * dy) * f;
  }
  function environment(p, x, y, world = {}, tick = 0) {
    const h = terrain(p, x, y),
      lat = Math.cos((y - 512) / 1024 * Math.PI * 2),
      wave = Math.sin(x * .012 + y * .008 + p.phase[2]),
      hot = world.heat || 0;
    const anomaly = Math.max(0, Math.sin(x * .011 - y * .014 + p.phase[7]) - .32);
    const temp = (p.anomaly === 'thermal' ? anomaly * 13 : 0) + p.temp + lat * 6 - (h - .5) * 32 + hot * .12 + Math.sin(tick / 240 + p.phase[4]) * 2;
    const field = clamp(.49 + .23 * wave + .12 * Math.cos(y * .016 + p.phase[3]) + (p.anomaly === 'echo' ? anomaly * .2 : 0) + (world.field || 0) * .019, .06, 1.65);
    const biome = h < .485 ? 'water' : h < .535 ? 'coast' : h > .73 ? 'highland' : temp < 2 ? 'tundra' : p.humidity < .33 ? 'desert' : 'grove';
    const weatherCycle = Math.sin(tick / 530 + p.phase[8]) + Math.cos(y * .007 + tick / 870 + p.phase[1]) * .45;
    const weather = weatherCycle > .55 ? temp < 1 ? 'snow' : p.humidity > .5 ? 'rain' : 'wind' : weatherCycle < -.92 && p.humidity > .35 ? 'mist' : 'calm';
    return {
      h,
      temp,
      field,
      weather,
      timeRate: p.anomaly === 'echo' ? 1 + anomaly * .48 : 1,
      potential: field * (1 + p.lattice * .48) * (1 + hot * .003),
      biome,
      gravity: p.gravity * (world.gravity || 1)
    };
  }
  function sites(p) {
    const r = rng(hash(p.seed, 'sites')),
      out = [];
    function put(k, x, y) {
      out.push({
        id: out.length,
        k,
        x: mod(x, 1024),
        y: mod(y, 1024)
      });
    }
    put('food', 518, 510);
    put('food', 493, 526);
    put('food', 528, 537);
    put('reef', 504, 485);
    put('prism', 540, 503);
    put('vent', 480, 504);
    put('shore', 572, 518);
    put('toxin', 466, 551);
    const kinds = ['food', 'reef', 'prism', 'vent', 'food', 'toxin'];
    for (let i = 0; i < 84; i++) put(kinds[i % kinds.length], r() * 1024, r() * 1024);
    for (let i = 0; i < 3; i++) put('tribe' + i, 558 + i * 38, 496 + i * 29);
    return out;
  }
  function bodies(seed, id, extra = []) {
    const sys = system(seed, id),
      ids = Array.from({
        length: sys.count
      }, (_, i) => i).concat(extra);
    return ids.map((i, j) => {
      const p = planet(seed, id, i),
        a = (j * .618 + .14) * Math.PI * 2 + p.phase[0] * .21,
        rad = 100 + j * 32;
      return {
        id: i,
        k: 'planet',
        name: p.name,
        x: 512 + Math.cos(a) * rad,
        y: 512 + Math.sin(a) * rad,
        r: 12 + p.form * 9
      };
    });
  }
  function anomalySite(seed, id) {
    const sy = system(seed, id),
      r = rng(hash(sy.seed, 'anomaly')),
      a = r() * Math.PI * 2,
      d = 74 + r() * 66;
    return {
      k: sy.anomaly,
      x: 512 + Math.cos(a) * d,
      y: 512 + Math.sin(a) * d,
      intensity: .55 + r() * .75
    };
  }
  function satellites(p) {
    const r = rng(hash(p.seed, 'satellites'));
    return Array.from({
      length: p.moons
    }, (_, i) => ({
      name: name(hash(p.seed, 'moon', i)),
      radius: 1.2 + r() * 1.6,
      phase: r() * Math.PI * 2,
      period: 14 + r() * 35 + i * 12,
      mineral: r()
    }));
  }
  function civilization(seed, id, age) {
    const sy = system(seed, id),
      cycle = Math.floor(age / 120),
      events = ['tide', 'bloom', 'conclave', 'drift'];
    let wealth = 3 + sy.seed % 3,
      science = 0,
      event = sy.event;
    // A bounded regional history converges towards a seed-specific economic baseline.
    for (let year = Math.max(0, cycle - 11); year <= cycle; year++) {
      const r = rng(hash(sy.seed, 'politics', year));
      event = events[Math.floor(r() * 4)];
      wealth = clamp(wealth * .76 + (event === 'bloom' ? 2.4 : event === 'drift' ? .05 : 1.05) + r() * .45, 1, 8);
      science += event === 'conclave' ? 2 : 1;
    }
    return {
      name: sy.faction,
      culture: sy.culture,
      event,
      wealth: Math.max(2, Math.round(wealth)),
      science: Math.max(0, cycle - 11) + science
    };
  }
  class SpatialGrid {
    constructor(size = 64) {
      this.size = size;
      this.bins = new Map();
    }
    add(o) {
      const n = 1024 / this.size,
        k = Math.floor(mod(o.x, 1024) / this.size) + n * Math.floor(mod(o.y, 1024) / this.size);
      if (!this.bins.has(k)) this.bins.set(k, []);
      this.bins.get(k).push(o);
    }
    near(x, y, r) {
      const n = 1024 / this.size,
        out = [],
        seen = new Set();
      for (let j = Math.floor((y - r) / this.size); j <= Math.floor((y + r) / this.size); j++) for (let i = Math.floor((x - r) / this.size); i <= Math.floor((x + r) / this.size); i++) {
        const k = mod(i, n) + n * mod(j, n);
        if (!seen.has(k)) {
          seen.add(k);
          const b = this.bins.get(k);
          if (b) out.push(...b);
        }
      }
      return out;
    }
  }
  Object.assign(G, {
    SIZE,
    AXIS,
    CAPACITY,
    HOME,
    clamp,
    mod,
    delta,
    distance,
    hash,
    rng,
    name,
    keys,
    traits,
    labels,
    eras,
    tr,
    label,
    coords,
    idAt,
    sectorDist,
    system,
    planet,
    terrain,
    environment,
    sites,
    bodies,
    anomalySite,
    satellites,
    civilization,
    SpatialGrid
  });
})();
