'use strict';

// Driver-independent input itinerary. Every mutation uses a visible control in the shipped UI.
async function uiJourney(h) {
  const epochs = [],
    notes = [];
  const click = (id, k, scope) => h.click(id, k, scope);
  const panel = k => click('panel', k, 'rail');
  async function act(cmd, k, expected) {
    await click('do-' + cmd, k);
    await h.settle();
    if (expected) await h.code(expected);
  }
  async function gather(kind) {
    await panel('field');
    await act('seek', kind, kind === 'shore' ? 'landfall' : 'harvest');
  }
  async function stock(cost) {
    for (const [k, n] of Object.entries(cost)) {
      let safe = 0;
      while ((await h.stock(k)) < n && safe++ < 25) await gather({
        bio: 'food',
        ore: 'reef',
        crystal: 'prism',
        brine: 'vent',
        charge: 'vent'
      }[k]);
      if ((await h.stock(k)) < n) throw Error('Stock ' + k);
    }
  }
  async function advance(i) {
    await panel('field');
    await act('advance', undefined, 'epoch');
    epochs.push(await h.epoch());
    if (h.capture) await h.capture(i);
  }
  async function build(k, c) {
    await stock(c);
    await panel('build');
    await act('build', k, 'built');
  }
  async function trial(left, right, drive, level, id) {
    await stock({
      [left]: 1,
      [right]: 1,
      charge: level
    });
    await panel('lab');
    for (const [k, v] of Object.entries({
      left,
      right,
      drive,
      level
    })) await h.select(k, String(v));
    await click('trial');
    await h.code('discovered');
    notes.push(id);
  }
  await h.begin();
  await click('speed');
  await click('speed');
  const home = await h.place();
  await gather('food');
  await gather('food');
  await gather('food');
  await panel('anatomy');
  await act('organ', 'fin', 'organ');
  await act('divide', undefined, 'offspring');
  await advance(1);
  await stock({
    bio: 5,
    ore: 2,
    crystal: 1
  });
  await panel('anatomy');
  await act('organ', 'lung', 'organ');
  await act('organ', 'sense', 'organ');
  await stock({
    bio: 4
  });
  await gather('shore');
  await panel('anatomy');
  await act('brood', undefined, 'brood');
  await advance(2);
  await build('camp', {
    bio: 4,
    ore: 3
  });
  await trial('bio', 'ore', 'heat', 1, 'tools');
  await build('farm', {
    bio: 3,
    brine: 1
  });
  await build('mill', {
    ore: 3,
    bio: 2
  });
  await stock({
    bio: 4,
    ore: 2
  });
  await panel('society');
  for (const mode of ['greet', 'trade', 'ally']) await act('dip', mode, mode);
  await advance(3);
  await trial('crystal', 'brine', 'flux', 1, 'resonance');
  await trial('ore', 'crystal', 'current', 1, 'circuit');
  await build('reactor', {
    ore: 5,
    crystal: 4
  });
  await build('yard', {
    ore: 6,
    crystal: 3,
    charge: 2
  });
  await stock({
    bio: 18,
    ore: 25,
    crystal: 18,
    brine: 8,
    charge: 22
  });
  await advance(4);
  await panel('atlas');
  await click('nearstar');
  await act('jump', undefined, 'jump');
  await panel('society');
  await act('dip', 'greet', 'greet');
  await build('station', {
    ore: 5,
    crystal: 3,
    charge: 2
  });
  await panel('atlas');
  await act('land', 0, 'landing');
  await build('colony', {
    bio: 6,
    ore: 4,
    charge: 2
  });
  await trial('ore', 'crystal', 'flux', 3, 'fold');
  await advance(5);
  await stock({
    bio: 8,
    ore: 20,
    charge: 18,
    crystal: 12
  });
  await panel('trans');
  await act('species', undefined, 'species');
  await act('gravity', 0.6, 'gravity');
  await act('time', 2, 'time');
  await act('launch', undefined, 'launch');
  await panel('trans');
  await act('planet', undefined, 'planet');
  await panel('atlas');
  await act('land', 8, 'landing');
  await panel('atlas');
  await act('launch', undefined, 'launch');
  await panel('atlas');
  await click('homeStar');
  await act('jump', undefined, 'jump');
  await act('land', 0, 'landing');
  if ((await h.place()) !== home) throw Error('Returned to a different home');
  await panel('build');
  if (!(await h.side()).includes('Settlement')) throw Error('Home settlement lost');
  await click('saves', undefined, 'playtop');
  await click('save', 'manual');
  await h.code('saved');
  await click('load', 'manual');
  await h.code('loaded');
  await panel('archive');
  if (!(await h.side()).includes('Spatial fold')) throw Error('Discovery archive lost');
  await h.persistence();
  return {
    epochs,
    discoveries: notes,
    home
  };
}
if (typeof module !== 'undefined') module.exports = {
  uiJourney
};
