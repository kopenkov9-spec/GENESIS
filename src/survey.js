(() => {
  function survey({
    seed,
    id,
    age,
    rad = 3
  }) {
    const at = G.coords(id),
      stars = [];
    for (let yy = -rad; yy <= rad; yy++) for (let xx = -rad; xx <= rad; xx++) {
      const sid = G.idAt(at.x + xx, at.y + yy),
        s = G.system(seed, sid),
        c = G.civilization(seed, sid, age);
      stars.push({
        sid,
        dx: xx + s.dx,
        dy: yy + s.dy,
        star: s.star,
        name: s.name,
        wealth: c.wealth,
        event: c.event
      });
    }
    return stars;
  }
  function forecast({
    world,
    planet
  }) {
    const w = world;
    for (let i = 0; i < 8; i++) G.ecologicalCycle(w, planet);
    return w.pops.map(p => ({
      id: p.id,
      n: p.n
    }));
  }
  G.survey = survey;
  G.forecast = forecast;
})();
