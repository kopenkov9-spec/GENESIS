(() => {
  const {
    Interface,
    $,
    esc,
    btn,
    doBtn,
    head,
    copy,
    help,
    ri
  } = G;
  const P = Interface.prototype;
  P.side = function (reset = false) {
    const el = $('side'),
      scroll = reset ? 0 : el.scrollTop,
      s = this.s,
      p = G.body(s),
      w = G.world(s);
    const cap = head(this.pair(G.eras[s.era]) + ' / ' + esc(p.name), this.t(this.panel + 'Title'));
    const fn = {
      field: 'fieldPanel',
      anatomy: 'anatomyPanel',
      lab: 'labPanel',
      build: 'buildPanel',
      society: 'societyPanel',
      atlas: 'atlasPanel',
      archive: 'archivePanel',
      trans: 'transPanel'
    }[this.panel];
    el.innerHTML = cap + this[fn](s, p, w);
    el.scrollTop = scroll;
    this.paintPanelMedia();
  };
  P.fieldPanel = function (s, p, w) {
    const ground = s.loc.scope === 'ground',
      e = G.environment(p, s.loc.x, s.loc.y, w, s.tick);
    const targets = ['food', 'reef', 'prism', 'vent', ...(s.era >= 1 ? ['shore'] : [])];
    let actions = ground ? `<div class="split">${targets.map(k => doBtn('seek', '<span style="color:' + G.COLORS[k] + '">●</span> ' + this.l(k), {
      kind: k
    }, 'small')).join('')}</div>` : `<div class="actions">${btn('panel', this.t('atlas'), {
      k: 'atlas'
    }, 'primary')}${doBtn('refuel', this.bi('Зареди гориво', 'Refuel'))}</div>`;
    const goals = G.goals(s);
    const list = goals.map(g => btn('goal', '<span>' + (g.done ? '✓' : '○') + '</span>' + this.t(g.id) + (g.id === 'feed3' ? ' (' + Math.min(3, s.stats.meals) + '/3)' : ''), {
      k: g.panel,
      id: g.id
    }, 'goal ' + (g.done ? 'done' : ''))).join('');
    let guide = '';
    if (s.tut) {
      const text = this.tutorial(s);
      guide = `<div class="note"><div class="row"><strong>${this.bi('Полеви наставник', 'Field guide')}</strong>${btn('tutorial', '×', {}, 'quiet small')}</div>${text}</div>`;
    }
    return guide + `<h3>${ground ? this.bi('Избери находище', 'Choose a field target') : this.bi('Корабни системи', 'Ship systems')}</h3>${actions}${ground ? help(this.bi('Изборът задава курс и събира пробата при пристигане.', 'Selecting a site sets a course and gathers on arrival.')) : ''}<h3>${s.era < 5 ? this.bi('Следваща епоха', 'Next epoch') : this.bi('Свободен свят', 'Open sandbox')}</h3><div class="stack">${list}</div>${s.era < 5 ? btn('do-advance', this.pair(G.eras[s.era + 1]) + ' →', {}, 'primary wide', goals.some(g => !g.done)) : btn('panel', this.t('transTitle') + ' →', {
      k: 'trans'
    }, 'primary wide')}<h3>${this.bi('Среда', 'Environment')}</h3><div class="pills"><span>${this.l(ground ? e.biome : G.system(s.seed, s.loc.sid).anomaly) + (ground ? ' · ' + this.l(e.weather) : '')}</span><span>${e.temp.toFixed(1)} °C</span><span>Ψ ${e.field.toFixed(2)}</span><span>ΔV ${e.potential.toFixed(2)}</span></div>`;
  };
  P.tutorial = function (s) {
    if (s.era === 0) {
      if (s.stats.meals < 3) return this.bi('Избери „Хранителна колония“ три пъти. Можеш и сам да плуваш с WASD и да събираш с E.', 'Choose Nutrient bloom three times. You can also swim with WASD and gather with E.');
      if (!G.traits.some(k => s.genes[k])) return this.bi('Отвори Анатомия и развий орган. Камшичето увеличава скоростта ти.', 'Open Anatomy and grow an organ. The flagellum increases swimming speed.');
      if (s.stats.births < 2) return this.bi('В Анатомия избери „Разделяне“. Можеш да прегледаш мутацията преди да я наследиш.', 'Choose Divide in Anatomy. Inspect the mutation before inheriting it.');
    }
    if (s.era === 1 && !s.stats.broods) return this.bi('Развий антена и дихателна торбичка, избери „Бряг“, после в Анатомия основи популация.', 'Grow an antenna and an air sac, travel to Dry shore, then found a population in Anatomy.');
    if (s.era === 2) return this.bi('Построй селище. За първия инструмент нагрей биомаса и руда. В Общество поздрави един дом, търгувай и предложи съюз.', 'Build a settlement. For your first tool, heat biomass and ore. Greet a house, trade, then propose an alliance in Society.');
    if (s.era === 3) return this.bi('За реактор изследвай кристал и разсол с етерен поток. Построй производствена мощност и корабостроителница.', 'For a reactor, test crystal and brine with flux. Build a power industry and a shipyard.');
    if (s.era === 4) return this.bi('В Атлас избери друга звезда и скочи. Свържи се с нея от орбита, построй станция, кацни за колония и проучи гънката в Опити.', 'Select another star in Atlas and jump. Make contact from orbit, build a station, land for a colony, then investigate the fold in Lab.');
    if (s.era === 5) return this.pair(G.eraText[5]);
    return this.bi('Всички условия са изпълнени. Избери следващата епоха.', 'All conditions are met. Choose the next epoch.');
  };
  P.anatomyPanel = function (s, p, w) {
    this.requestForecast();
    const stats = G.physiology(s.genes);
    return `<canvas class="cardcanvas" id="specimen" width="450" height="152"></canvas><div class="row"><span class="specname">${esc(s.worlds[G.key(G.HOME, 0)].kin[0].name)}</span><span class="ticks">F${s.stats.births}</span></div><div class="data">${this.bi('Скорост', 'Speed')} ${stats.speed} · ${this.bi('Обсег', 'Reach')} ${stats.reach.toFixed(1)}</div><h3>${this.bi('Органи', 'Organs')}</h3>${G.traits.filter(k => k !== 'lung' || s.era >= 1).map(k => `<div class="entry"><div><strong>${this.l(k)} ${s.genes[k]}/4</strong><div class="help">${this.pair(G.traitText[k])}</div>${s.genes[k] < 4 ? this.cost(G.genesCost(s, k)) : ''}</div>${btn('do-organ', '＋', {
      k
    }, 'small', s.genes[k] >= 4)}</div>`).join('')}<h3>${this.bi('Наследственост', 'Heredity')}</h3><div class="actions">${doBtn('divide', this.bi('Разделяне', 'Divide') + ' · ' + ri.bio + ' 4')}${s.era >= 1 ? doBtn('brood', this.bi('Основи популация', 'Found population') + ' · ' + ri.bio + ' 4') : ''}</div>${s.mutant ? `<div class="card"><strong>${this.bi('Последен потомък', 'Latest offspring')}</strong><div class="help">${G.traits.map(k => this.l(k) + ' ' + s.mutant[k]).join(' · ')}</div>${doBtn('inherit', this.bi('Наследи варианта', 'Inherit this variant'), {}, 'small')}</div>` : ''}<h3>${this.bi('Биосфера', 'Biosphere')}</h3>${help(this.bi('Популации', 'Populations') + ' ' + w.pops.length + ' · ' + this.bi('Разклонения', 'Speciation events') + ' ' + w.pops.filter(q => q.parent >= 0).length)}<div class="help">${this.bi('Прогноза след 8 цикъла за първите три вида', 'First three population sizes in 8 cycles')} <b id="forecastout">${this.forecastText()}</b></div>`;
  };
  P.labPanel = function (s, p, w) {
    const a = this.lab,
      ids = Object.keys(G.materials),
      recent = s.trials.at(-1);
    const form = (id, title, options) => `<label class="formrow">${title}<select id="${id}">${options}</select></label>`;
    const field = G.environment(p, s.loc.x, s.loc.y, w, s.tick);
    const m = G.measure(a.left, a.right, a.drive, a.level, field.field, field.temp, p.lattice);
    return copy(this.bi('Комбинирай две проби и измери отговора им. Всеки опит изразходва двете проби и заряд според интензитета.', 'Combine two samples and measure their response. Each trial consumes both samples and charge equal to intensity.')) + `<div class="twocol">${form('left', this.bi('Проба A', 'Sample A'), this.opts(ids, a.left))}${form('right', this.bi('Проба B', 'Sample B'), this.opts(ids, a.right))}</div><div class="twocol">${form('drive', this.bi('Въздействие', 'Stimulus'), this.opts(['heat', 'current', 'flux'], a.drive))}${form('level', this.bi('Интензитет', 'Intensity'), this.opts([1, 2, 3], a.level, ['1', '2', '3']))}</div><div class="pills"><span>Ψ ${field.field.toFixed(2)}</span><span>σ ${m.conduct.toFixed(2)}</span><span>${field.temp.toFixed(1)} °C</span></div>${btn('trial', this.bi('Проведи опита', 'Run experiment') + ' · ' + ri.charge + ' ' + a.level, {}, 'primary wide')}${recent ? '<div class="note"><strong>' + this.t(recent.result ? 'discovered' : 'inert') + (recent.result ? ' · ' + this.l(recent.result) : '') + '</strong><br>R ' + recent.response.toFixed(3) + ' · Ψ ' + recent.field.toFixed(2) + '</div>' : ''}<h3>${this.bi('Изследователски бележки', 'Research notes')}</h3>${Object.keys(G.recipes).map(k => `<details><summary>${s.knowledge[k] ? '✓ ' : ''}${this.l(k)}</summary><p class="help">${this.pair(G.hints[k])}</p></details>`).join('')}`;
  };
  P.buildPanel = function (s, p, w) {
    const orbit = s.loc.scope === 'orbit',
      items = Object.entries(G.builds).filter(([, d]) => d.era <= s.era && !!d.orbit === orbit);
    const built = w.buildings.map(b => b.k);
    if (s.stations[s.loc.sid]) built.push('station');
    if (s.rings[s.loc.sid]) built.push('ring');
    let storage = '';
    if (!orbit && s.era >= 3 && (G.count(w, 'reactor') || G.count(w, 'school') || G.count(w, 'portal'))) {
      const transfer = G.count(w, 'portal') ? s.portals.map((q, index) => q.sid === s.loc.sid && q.pid === s.loc.pid ? '' : doBtn('bank', '→ ' + esc(G.planet(s.seed, q.sid, q.pid).name), {
        mode: 'transfer',
        index
      })).join('') : '';
      storage = '<div class="card"><strong>' + this.bi('Кристален акумулатор', 'Crystal accumulator') + ' · ' + Math.floor(w.battery) + '/40</strong><div class="actions">' + doBtn('bank', this.bi('Вложи 5', 'Deposit 5'), {
        mode: 'deposit'
      }) + doBtn('bank', this.bi('Изтегли до 5', 'Withdraw up to 5'), {
        mode: 'withdraw'
      }) + transfer + '</div>' + help(this.bi('Порталът изпраща 4 от всеки 5 единици. Остатъкът се отделя като топлина.', 'Portals transmit 4 of every 5 units. The remainder becomes heat.')) + '</div>';
    }
    return storage + `<p class="help">${this.bi('Площадка', 'Site')} · ${esc(p.name)} · ${orbit ? this.bi('орбита', 'orbit') : Math.round(s.loc.x) + ', ' + Math.round(s.loc.y)}</p>${built.length ? '<div class="pills">' + [...new Set(built)].map(k => '<span>' + this.l(k) + ' ×' + built.filter(v => v === k).length + '</span>').join('') + '</div>' : ''}${s.era >= 4 ? '<div class="actions">' + (orbit ? btn('panel', this.bi('Избери планета за кацане', 'Choose a planet to land'), {
      k: 'atlas'
    }) : doBtn('launch', this.bi('Излез в орбита', 'Launch to orbit'))) + '</div>' : ''}${items.map(([k, d]) => `<div class="card"><div class="row"><strong>${this.l(k)}</strong>${btn('do-build', '＋', {
      k
    }, 'small')}</div><div class="help">${this.pair(G.facilities[k])}</div>${this.cost(d.cost)}${d.know && !s.knowledge[d.know] ? '<div class="help">◇ ' + this.l(d.know) + '</div>' : ''}</div>`).join('')}`;
  };
  P.societyPanel = function (s, p, w) {
    const orbit = s.loc.scope === 'orbit',
      alien = orbit && s.loc.sid !== G.HOME,
      civ = G.civilization(s.seed, s.loc.sid, s.tick / 8),
      i = this.house;
    const rel = alien ? s.contacts[s.loc.sid]?.relation || 0 : w.relations[i],
      ally = alien ? !!s.contacts[s.loc.sid]?.ally : w.allies[i];
    const n = alien ? civ.name : G.name(G.hash(p.seed, 'house', i));
    let html = `<div class="pills"><span>${this.bi('Култура', 'Culture')} ${w.culture.toFixed(1)}</span><span>${this.bi('Обмени', 'Trades')} ${s.stats.trade}</span><span>${this.bi('Спорове', 'Disputes')} ${w.conflicts}</span></div>`;
    if (!orbit || alien) html += `<h3>${alien ? this.bi('Извънземна цивилизация', 'Foreign civilization') : this.bi('Съседни домове', 'Neighbouring houses')}</h3>${!alien ? '<div class="actions">' + [0, 1, 2].map(v => btn('house', G.name(G.hash(p.seed, 'house', v)), {
      index: v
    }, 'toggle ' + (v === i ? 'on' : ''))).join('') + '</div>' : ''}<div class="card"><div class="row"><strong>${esc(n)}</strong><span class="ticks">${this.bi('Доверие', 'Trust')} ${rel}</span></div><div class="help">${this.l(alien ? civ.culture : ['kin', 'weaver', 'ranger'][i])} · ${ally ? this.bi('съюзник', 'allied') : this.bi('независим', 'independent')}${alien ? ' · ' + this.l(civ.event) : ''}</div><div class="actions">${['greet', 'trade', 'ally', 'contest'].map((mode, j) => doBtn('dip', [this.bi('Поздрави', 'Greet'), this.bi('Търгувай', 'Trade'), this.bi('Съюз', 'Ally'), this.bi('Оспори', 'Contest')][j], {
      mode,
      index: i
    })).join('')}</div>${help(this.bi('Поздравът струва 1 биомаса. Размени 2 руда за', 'A greeting costs 1 biomass. Trade 2 ore for') + ' ' + (alien ? civ.wealth : 2) + ' ' + this.l('crystal') + ' + 1 ' + this.l('brine') + '. ' + this.bi('Съюзът изисква доверие 2 и 2 биомаса.', 'An alliance costs 2 biomass and needs trust 2.'))}</div>`;else html += copy(this.bi('В родната орбита се чува само твоят дом. Скочи в друга система за първи контакт.', 'Only your own people occupy home orbit. Jump to another system for first contact.'));
    if (s.era >= 3) html += `<h3>${this.bi('Доктрина', 'Doctrine')}</h3><div class="actions">${['tech', 'arcane', 'living', 'hybrid'].map(k => doBtn('policy', this.l(k), {
      k
    }, 'toggle ' + (s.policy === k ? 'on' : ''))).join('')}</div>${help(this.bi('Технологията повишава рудодобива и обсега. Магията увеличава заряда и знанието. Биологията ускорява растежа. Хибридът повишава всички добиви.', 'Technology boosts ore and jump range. Arcane doctrine lifts charge and insight. Biological doctrine boosts growth. Hybrid improves all yields.'))}<h3>${this.bi('Производствен фокус', 'Production focus')}</h3><div class="actions">${['forge', 'weave', 'grow'].map(k => doBtn('priority', this.l(k), {
      k
    }, 'toggle ' + (s.priority === k ? 'on' : ''))).join('')}</div><h3>${this.bi('Корабен корпус', 'Ship hull')}</h3><div class="actions">${['keel', 'organic'].map((k, i) => doBtn('hull', [this.bi('Минерален', 'Mineral keel'), this.bi('Органичен', 'Organic')][i], {
      k
    }, 'toggle ' + (s.ship.hull === k ? 'on' : ''))).join('')}</div>${help(this.bi('Органичният корпус изисква жива култура. Има по-голям резервоар и изразходва по-малко гориво.', 'The organic hull requires Living culture. It carries a larger tank and burns less fuel.'))}`;
    return html;
  };
  P.atlasPanel = function (s, p, w) {
    const orbit = s.loc.scope === 'orbit',
      gal = this.atlasMode === 'galaxy' && s.era >= 4,
      sy = G.system(s.seed, s.loc.sid);
    let h = s.era >= 4 ? `<div class="actions">${['surface', 'galaxy'].map((k, i) => btn('mapmode', [this.bi('Планета', 'Planet'), this.bi('Галактика', 'Galaxy')][i], {
      k
    }, 'toggle ' + (gal === (i === 1) ? 'on' : ''))).join('')}</div>` : '';
    if (gal) {
      this.requestSurvey();
      const chosen = G.system(s.seed, this.selected),
        at = G.coords(this.selected),
        here = G.coords(s.loc.sid),
        dist = G.sectorDist(s.loc.sid, this.selected);
      h += `<canvas id="galmap" class="atlas" width="520" height="300" aria-label="${this.bi('Избери звезда', 'Select a star')}"></canvas><div class="row"><span class="specname">${esc(chosen.name)}</span><span class="ticks">${at.x} / ${at.y}</span></div><div class="help">${this.l(chosen.star)} · ${this.l(chosen.anomaly)} · ${dist.toFixed(1)} pc · ${this.bi('Планети', 'Planets')} ${chosen.count + (s.artificial[this.selected]?.length || 0)}</div><div class="actions">${doBtn('jump', this.bi('Скок', 'Jump') + ' · ' + G.jumpCost(s, this.selected).toFixed(1), {
        sid: this.selected
      }, 'primary')}${s.era >= 5 ? doBtn('rift', this.bi('Разлом', 'Open rift') + ' · 12 ϟ', {
        sid: this.selected
      }) : ''}${btn('homeStar', this.bi('Родна звезда', 'Home star'))}</div>${help(this.bi('Гориво', 'Fuel') + ' ' + s.ship.fuel.toFixed(1) + '/' + G.maxFuel(s) + ' · ' + this.bi('Обсег', 'Range') + ' ' + G.jumpRange(s).toFixed(1) + ' pc')}<div class="twocol"><label class="formrow">X<input id="gx" type="number" min="0" max="16383" value="${at.x}"></label><label class="formrow">Y<input id="gy" type="number" min="0" max="16383" value="${at.y}"></label></div><div class="actions">${btn('lookup', this.bi('Намери координати', 'Locate coordinates'))}${btn('nearstar', this.bi('Съседна звезда', 'Next star'), {
        sid: G.idAt(here.x + 1, here.y)
      })}</div>`;
      if (s.visited.length > 1) h += `<label class="formrow">${this.bi('Посетени системи', 'Visited systems')}<select id="visited"><option value="">—</option>${s.visited.map(id => '<option value="' + id + '">' + esc(G.system(s.seed, id).name) + '</option>').join('')}</select></label>`;
    } else {
      h += `<canvas id="planetmap" class="atlas" width="504" height="310"></canvas><div class="row"><span class="specname">${esc(p.name)}</span><span class="ticks">${p.moons} ☾</span></div>${help(this.bi('Посочи място на картата за придвижване по повърхността.', 'Click a map location to travel across the surface.'))}<div class="pills"><span>g ${(p.gravity * w.gravity).toFixed(2)}</span><span>atm ${p.atm.toFixed(2)}</span><span>Ψ ${p.lattice.toFixed(2)}</span></div>${help(esc(p.flora) + ' · ' + esc(p.fauna) + ' · ' + this.l(p.history))}`;
    }
    if (s.era >= 4) {
      h += `<h3>${esc(sy.name)} · ${this.bi('планети', 'planets')}</h3>`;
      if (orbit) {
        h += G.bodies(s.seed, s.loc.sid, s.artificial[s.loc.sid] || []).map(b => `<div class="entry"><div><strong>${esc(b.name)}</strong><div class="help">${b.id >= 8 ? this.bi('Изкуствен свят', 'Constructed world') : this.bi('Естествен свят', 'Natural world')}${s.loc.sid === G.HOME && b.id === 0 ? ' · ' + this.bi('Дом', 'Home') : ''}</div></div>${doBtn('land', this.bi('Кацни', 'Land'), {
          pid: b.id
        }, 'small')}</div>`).join('') + doBtn('refuel', this.bi('Зареди при звездата', 'Refuel at star'), {}, 'wide');
      } else h += doBtn('launch', this.bi('Излез в орбита', 'Launch to orbit'), {}, 'primary wide');
      if (orbit) h += doBtn('scan', this.bi('Измери аномалията', 'Survey anomaly') + ' · ϟ2', {}, 'wide') + '<h3>' + this.bi('Режим на двигателя', 'Drive mode') + '</h3><div class="actions">' + ['thrust', 'gravity'].map((k, i) => doBtn('drive', [this.bi('Импулсен', 'Impulse'), this.bi('Гравитационен', 'Gravitic')][i], {
        k
      }, 'toggle ' + (s.ship.drive === k ? 'on' : ''))).join('') + '</div>' + help(this.bi('Гравитационният скок струва още 2 заряд, увеличава обсега с 2 pc и пести 28% гориво. X задейства спирачните двигатели.', 'Gravitic jumps use 2 charge, extend range by 2 pc and save 28% fuel. Hold X for braking thrusters.'));
    }
    if (!gal && p.moons) h += '<h3>' + this.bi('Спътници', 'Moons') + '</h3><div class="pills">' + G.satellites(p).map(m => '<span>☾ ' + esc(m.name) + '</span>').join('') + '</div>';
    return h;
  };
  P.archivePanel = function (s, p, w) {
    const t = this,
      page = this.historyPage || 0;
    const backwards = (array, n) => array.slice().reverse().slice(page * n, (page + 1) * n);
    const maxPage = Math.max(0, Math.ceil(Math.max(s.lineage.length / 12, s.journal.length / 24, s.chronicle.length / 12, w.pops.length / 15)) - 1);
    const browser = '<div class="row"><span class="data">' + this.bi('Страница', 'Page') + ' ' + (page + 1) + ' / ' + (maxPage + 1) + '</span><div class="actions">' + btn('historyPage', '←', {
      index: page - 1
    }, 'small', page <= 0) + btn('historyPage', '→', {
      index: page + 1
    }, 'small', page >= maxPage) + '</div></div>';
    const chronology = s.epochs.map((tick, i) => `<div class="entry"><b>${this.pair(G.eras[i])}</b><span class="ticks">T+${Math.floor(tick / 8)} s</span></div>`).join('');
    function event(j) {
      if (j.code === 'epoch') return t.pair(G.eras[Number(j.arg)]);
      return esc(t.t(j.code)) + (j.arg ? ' · ' + (Object.hasOwn(G.labels, j.arg) ? t.l(j.arg) : esc(j.arg)) : '');
    }
    return browser + `<div class="pills"><span>${s.visited.length} ☉</span><span>${Object.keys(s.knowledge).length} / ${Object.keys(G.recipes).length} ◇</span><span>F${s.stats.births}</span></div><h3>${this.bi('Епохи', 'Epochs')}</h3>${chronology}<h3>${this.bi('Енциклопедия на откритията', 'Encyclopedia of discoveries')}</h3>${Object.keys(s.knowledge).length ? Object.entries(s.knowledge).map(([k, t]) => `<details><summary>${this.l(k)}</summary><p class="help">${this.l(t.left)} + ${this.l(t.right)} · ${this.l(t.drive)} ×${t.level}<br>R ${t.response.toFixed(3)} · Ψ ${t.field.toFixed(2)} · ${esc(G.planet(s.seed, t.sid, t.pid).name)}</p></details>`).join('') : help(this.bi('Първите открития идват от опитите в епохата на Пробуждането.', 'Discoveries begin with experiments during Awakening.'))}<h3>${this.bi('Генетична линия', 'Genetic lineage')}</h3>${backwards(s.lineage, 12).map(l => `<details><summary>${this.t(l.kind)} · T+${Math.floor(l.tick / 8)} s</summary><p class="help">${G.traits.map(k => this.l(k) + ' ' + l.genes[k]).join(' · ')}</p></details>`).join('')}<h3>${this.bi('Местни видове', 'Local species')}</h3>${w.pops.slice(page * 15, (page + 1) * 15).map(q => `<div class="entry"><span>${esc(q.name)} ${q.parent >= 0 ? '↳' : ''}</span><span class="data">≈ ${Math.round(q.n)}</span></div>`).join('')}<h3>${this.bi('Събития', 'Events')}</h3>${backwards(s.journal, 24).map(j => `<div class="entry"><span class="help">${event(j)}</span><span class="ticks">${Math.floor(j.tick / 8)} s</span></div>`).join('')}` + '<h3>' + this.bi('Наследство на цивилизацията', 'Civilization legacy') + '</h3>' + backwards(s.chronicle, 12).map(j => '<div class="entry"><span class="help">' + event(j) + '</span><span class="ticks">' + esc(G.planet(s.seed, j.sid, j.pid).name) + '</span></div>').join('') + browser;
  };
  P.transPanel = function (s, p, w) {
    const orbit = s.loc.scope === 'orbit';
    let html = copy(this.pair(G.eraText[5]));
    if (orbit) return html + `<div class="card"><strong>${this.bi('Кондензация на материя', 'Matter condensation')}</strong><div>${this.cost({
      ore: 8,
      charge: 6,
      crystal: 4
    })}</div>${doBtn('planet', this.bi('Създай планета', 'Create planet'), {}, 'primary wide')}</div><div class="actions">${doBtn('build', this.l('ring'), {
      k: 'ring'
    })}${btn('panel', this.t('atlas'), {
      k: 'atlas'
    })}</div>`;
    html += `<div class="card"><strong>${this.bi('Гравитация', 'Gravity')}</strong> <span class="data">×${w.gravity}</span><div class="actions">${[.6, 1, 1.45].map(value => doBtn('gravity', '×' + value, {
      value
    }, 'toggle ' + (w.gravity === value ? 'on' : ''))).join('')}</div>${this.cost({
      charge: 3,
      crystal: 1
    })}</div><div class="card"><strong>${this.bi('Местно време', 'Local time')}</strong> <span class="data">×${w.tempo}</span><div class="actions">${[.5, 1, 2].map(value => doBtn('time', '×' + value, {
      value
    }, 'toggle ' + (w.tempo === value ? 'on' : ''))).join('')}</div>${this.cost({
      charge: 3,
      crystal: 1
    })}</div><div class="actions">${doBtn('species', this.bi('Създай вид', 'Create species'))}${doBtn('ecosystem', this.bi('Посей екосистема', 'Seed ecosystem'))}${doBtn('build', this.l('mind'), {
      k: 'mind'
    })}</div><h3>${this.bi('Портална мрежа', 'Portal network')}</h3>${doBtn('build', this.bi('Изгради портал', 'Build portal'), {
      k: 'portal'
    }, 'wide')}${help(this.bi('Построй портали на два свята. Приближи началния и избери другия за скок срещу 4 заряд.', 'Build portals on two worlds. Approach the origin and choose another for a 4-charge transit.'))}${s.portals.map((q, index) => q.sid === s.loc.sid && q.pid === s.loc.pid ? doBtn('move', this.bi('До местния портал', 'Approach local portal'), {
      x: q.x,
      y: q.y
    }, 'wide') : doBtn('gate', esc(G.planet(s.seed, q.sid, q.pid).name) + ' →', {
      index
    }, 'wide')).join('')}${doBtn('launch', this.bi('Излез в орбита', 'Launch to orbit'), {}, 'primary wide')}`;
    return html;
  };
  P.paintPanelMedia = function () {
    const s = this.s;
    if (!s) return;
    if ($('specimen')) {
      const el = $('specimen'),
        c = el.getContext('2d');
      c.fillStyle = '#112325';
      c.fillRect(0, 0, el.width, el.height);
      G.sky(c, 450, 152, G.body(s).seed, 40);
      G.specimen(c, 230, 74, 88, -.20, G.body(s).seed, s.genes, 0, true);
    }
    if ($('galmap')) this.mapPoints = G.galaxyMap($('galmap'), s, this.stars, this.selected);
    if ($('planetmap')) G.planetMap($('planetmap'), s, this.renderer);
  };
})();
