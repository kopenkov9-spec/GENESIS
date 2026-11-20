(() => {
  const recipes = {
    tools: {
      a: 'bio',
      b: 'ore',
      drive: 'heat',
      min: 1,
      props: ['fibre', 'metal']
    },
    resonance: {
      a: 'crystal',
      b: 'brine',
      drive: 'flux',
      min: 1,
      props: ['lattice', 'ions']
    },
    circuit: {
      a: 'ore',
      b: 'crystal',
      drive: 'current',
      min: 1,
      props: ['metal', 'lattice']
    },
    culture: {
      a: 'bio',
      b: 'brine',
      drive: 'current',
      min: 1,
      props: ['fibre', 'ions']
    },
    mycelium: {
      a: 'bio',
      b: 'crystal',
      drive: 'flux',
      min: 1,
      props: ['fibre', 'lattice']
    },
    ceramic: {
      a: 'ore',
      b: 'brine',
      drive: 'heat',
      min: 2,
      props: ['metal', 'ions']
    },
    fold: {
      a: 'ore',
      b: 'crystal',
      drive: 'flux',
      min: 3,
      props: ['metal', 'lattice'],
      needs: ['circuit', 'resonance']
    }
  };
  const materials = {
    bio: {
      fibre: 1,
      metal: .02,
      lattice: .04,
      ions: .18,
      conduct: .27
    },
    ore: {
      metal: .95,
      fibre: 0,
      lattice: .22,
      ions: .08,
      conduct: .93
    },
    crystal: {
      lattice: 1,
      metal: .06,
      fibre: 0,
      ions: .03,
      conduct: .43
    },
    brine: {
      ions: .96,
      lattice: 0,
      metal: 0,
      fibre: .04,
      conduct: .82
    }
  };
  function measure(a, b, drive, power, field, temp, lattice) {
    const m = materials[a],
      n = materials[b],
      match = p => Math.max(m[p], n[p]),
      mix = (m.conduct + n.conduct) / 2;
    const coupling = drive === 'flux' ? (match('lattice') * .7 + .3) * (.72 + field * .28) * lattice : drive === 'current' ? .5 + mix : .85 + G.clamp(temp / 130, -.12, .3);
    return {
      response: power * coupling,
      conduct: mix,
      heat: drive === 'heat' ? power * 4 : power * coupling,
      threshold: k => recipes[k].min * ({
        fold: .59,
        resonance: .57,
        mycelium: .57,
        ceramic: .73
      }[k] || .69),
      match
    };
  }
  const builds = {
    camp: {
      era: 2,
      cost: {
        bio: 4,
        ore: 3
      },
      prod: {
        bio: .55,
        lore: .16
      }
    },
    farm: {
      era: 2,
      cost: {
        bio: 3,
        brine: 1
      },
      prod: {
        bio: 1.45,
        brine: .6
      }
    },
    mill: {
      era: 2,
      know: 'tools',
      cost: {
        ore: 3,
        bio: 2
      },
      prod: {
        ore: 1.25,
        crystal: .35
      }
    },
    school: {
      era: 2,
      know: 'resonance',
      cost: {
        crystal: 3,
        bio: 2
      },
      prod: {
        charge: 1.4,
        lore: .48
      }
    },
    lab: {
      era: 3,
      know: 'tools',
      cost: {
        ore: 4,
        crystal: 2
      },
      prod: {
        lore: 1.25
      }
    },
    reactor: {
      era: 3,
      know: 'resonance',
      cost: {
        ore: 5,
        crystal: 4
      },
      prod: {
        charge: 2.5,
        crystal: .5
      }
    },
    machine: {
      era: 3,
      know: 'circuit',
      cost: {
        ore: 5,
        charge: 3
      },
      prod: {
        ore: 2
      }
    },
    construct: {
      era: 3,
      know: 'resonance',
      cost: {
        crystal: 4,
        charge: 3
      },
      prod: {
        ore: .8,
        charge: .6
      }
    },
    biomech: {
      era: 3,
      know: 'culture',
      cost: {
        bio: 5,
        ore: 2
      },
      prod: {
        bio: 2,
        crystal: .5
      }
    },
    relay: {
      era: 3,
      know: 'mycelium',
      cost: {
        bio: 4,
        crystal: 3
      },
      prod: {
        lore: 1
      }
    },
    road: {
      era: 3,
      cost: {
        ore: 4,
        bio: 2
      },
      prod: {}
    },
    yard: {
      era: 3,
      know: 'tools',
      cost: {
        ore: 6,
        crystal: 3,
        charge: 2
      },
      prod: {
        ore: .4
      }
    },
    colony: {
      era: 4,
      away: true,
      cost: {
        bio: 6,
        ore: 4,
        charge: 2
      },
      prod: {
        bio: 1,
        ore: .8,
        brine: .6
      }
    },
    station: {
      era: 4,
      orbit: true,
      cost: {
        ore: 5,
        crystal: 3,
        charge: 2
      },
      prod: {
        ore: .8,
        crystal: .7
      }
    },
    portal: {
      era: 5,
      know: 'fold',
      cost: {
        crystal: 5,
        charge: 6,
        ore: 2
      },
      prod: {}
    },
    ring: {
      era: 5,
      orbit: true,
      know: 'fold',
      cost: {
        ore: 10,
        crystal: 5,
        charge: 5
      },
      prod: {
        charge: 5,
        ore: 1
      }
    },
    mind: {
      era: 5,
      know: 'circuit',
      cost: {
        lore: 4,
        ore: 5,
        charge: 5
      },
      prod: {
        lore: 3
      }
    }
  };
  const anatomy = {
    fin: {
      bio: 2
    },
    shell: {
      bio: 2,
      ore: 1
    },
    sense: {
      bio: 2,
      crystal: 1
    },
    lung: {
      bio: 3,
      ore: 2
    },
    sym: {
      bio: 2,
      brine: 1
    }
  };
  Object.assign(G, {
    recipes,
    materials,
    measure,
    builds,
    anatomy
  });
})();
