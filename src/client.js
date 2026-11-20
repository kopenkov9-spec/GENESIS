(() => {
  const {
      Interface,
      $,
      esc,
      btn,
      doBtn,
      ri
    } = G,
    P = Interface.prototype;
  P.hud = function () {
    const s = this.s,
      w = G.world(s),
      p = G.body(s),
      g = s.loc.scope === 'ground',
      e = G.environment(p, s.loc.x, s.loc.y, w, s.tick);
    $('status').innerHTML = G.keys.map(k => `<span class="res res-${k}" title="${this.l(k)}"><i>${ri[k]}</i><small>${this.l(k)}</small><b>${Math.floor(s.res[k] + .000001)}</b></span>`).join('');
    $('fieldhead').innerHTML = `<div><div class="eyeline">${this.bi('Епоха', 'Epoch')} ${['I', 'II', 'III', 'IV', 'V', 'VI'][s.era]} / VI</div><div class="fieldtitle">${this.pair(G.eras[s.era])}</div><div class="fieldsub">${esc(g ? p.name : G.system(s.seed, s.loc.sid).name)} · ${g ? this.l(e.biome) : this.bi('Орбита', 'Orbit')}</div></div><div class="vital">${g ? this.bi('Живот', 'Vitality') + ' ' + Math.ceil(s.vital) + '%' : this.bi('Гориво', 'Fuel') + ' ' + s.ship.fuel.toFixed(1)}<span><b style="width:${g ? s.vital : s.ship.fuel / G.maxFuel(s) * 100}%"></b></span></div>`;
    const footkey = [s.era, g, this.prefs.lang].join();
    if (footkey !== this.footKey) {
      this.footKey = footkey;
      $('fieldfoot').innerHTML = `<div class="minirow">${g ? doBtn('use', this.bi('Събери', 'Gather') + ' · E', {}, 'hudbtn') + doBtn('pulse', this.bi('Импулс', 'Pulse') + ' · ϟ2', {}, 'hudbtn') : btn('panel', this.t('atlas') + ' · M', {
        k: 'atlas'
      }, 'hudbtn') + doBtn('refuel', this.bi('Зареди', 'Refuel'), {}, 'hudbtn') + doBtn('brake', this.bi('Спри', 'Brake'), {}, 'hudbtn')}</div><div class="fieldhint">${this.bi('Посочи за движение', 'Click to move')}<br>WASD / ↑ ↓ ← →</div>`;
    }
    $('strip').innerHTML = `<span><b>Ψ</b> ${e.field.toFixed(2)} · ΔV ${e.potential.toFixed(2)} · ${Math.round(w.heat)} Θ</span><span>${this.paused ? this.bi('ПАУЗА', 'PAUSED') : s.nav ? this.bi('НА КУРС', 'ON COURSE') : this.bi('ЛОКАЛНО', 'LOCAL')} · ${Math.round(s.loc.x)}, ${Math.round(s.loc.y)}</span><span>${this.prefs.diag ? Math.round(this.fps) + ' FPS · ' + this.simMs.toFixed(2) + ' ms SIM · ' + this.renderer.ms.toFixed(1) + ' ms DRAW' : 'SEED / ' + esc(s.seed)}</span>`;
  };
  P.bind = function () {
    $('app').addEventListener('click', e => {
      const button = e.target.closest('button[data-ui]');
      if (!button || button.disabled) return;
      const a = JSON.parse(button.dataset.v || '{}');
      this.click(button.dataset.ui, a);
    });
    $('app').addEventListener('change', e => {
      const id = e.target.id,
        v = e.target.value;
      if (id === 'langSel') {
        this.prefs.lang = v;
        this.preferences();
        this.language();
        this.settings();
      }
      if (id === 'quality') {
        this.prefs.quality = v;
        this.preferences();
      }
      if (['left', 'right', 'drive', 'level'].includes(id)) {
        this.lab[id] = id === 'level' ? Number(v) : v;
        this.side();
        $(id)?.focus();
      }
      if (id === 'visited' && v !== '') {
        this.selected = Number(v);
        this.side();
      }
    });
    $('app').addEventListener('input', e => {
      if (e.target.id === 'seed') this.seed = e.target.value;
      if (e.target.id === 'volume') {
        this.prefs.volume = Number(e.target.value) / 100;
        this.sound.volume(this.prefs.volume);
        this.sound.wake();
        $('volval').textContent = e.target.value + '%';
        this.preferences();
      }
    });
    $('dialog').addEventListener('cancel', () => {
      this.dialog = '';
      this.keys.clear();
    });
    $('dialog').addEventListener('close', () => {
      this.dialog = '';
      this.keys.clear();
    });
    $('field').addEventListener('pointerdown', e => {
      if (!this.s || this.paused) return;
      $('field').focus({
        preventScroll: true
      });
      const rect = $('field').getBoundingClientRect(),
        s = this.s,
        pos = this.renderer.fromScreen(s, e.clientX - rect.left, e.clientY - rect.top);
      if (s.loc.scope === 'orbit') {
        const b = G.bodies(s.seed, s.loc.sid, s.artificial[s.loc.sid] || []).find(p => G.distance(pos, p) < p.r + 6);
        if (b) {
          this.run('land', {
            pid: b.id
          });
          return;
        }
      } else {
        const obj = G.points(G.body(s)).filter(a => G.siteReady(G.world(s), a) && (!a.k.startsWith('tribe') || s.era >= 2)).sort((a, b) => G.distance(pos, a) - G.distance(pos, b))[0];
        if (obj && G.distance(pos, obj) < Math.max(6, 12 / this.renderer.z)) {
          G.destination(s, obj.x, obj.y, {
            cmd: 'sample',
            id: obj.id
          });
          this.notice('course');
          return;
        }
      }
      this.run('move', pos, false);
    });
    $('side').addEventListener('click', e => {
      const el = e.target;
      if (!['galmap', 'planetmap'].includes(el.id)) return;
      const b = el.getBoundingClientRect(),
        nx = (e.clientX - b.left) / b.width,
        ny = (e.clientY - b.top) / b.height;
      if (el.id === 'galmap' && this.mapPoints?.length) {
        const x = nx * el.width,
          y = ny * el.height;
        this.selected = this.mapPoints.reduce((a, b) => Math.hypot(a.x - x, a.y - y) < Math.hypot(b.x - x, b.y - y) ? a : b).sid;
        this.side();
      }
      if (el.id === 'planetmap') {
        if (this.s.loc.scope === 'ground') this.run('move', {
          x: nx * 1024,
          y: ny * 1024
        });else this.notice('groundOnly', false);
      }
    });
    $('importfile').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      try {
        if (f.size > 24 * 1024 * 1024) throw Error();
        const s = G.decode(await f.text());
        this.start(s);
        this.save('auto');
        this.notice('loaded');
      } catch {
        this.notice('invalid', false);
        if (this.state === 'menu' && this.dialog !== 'saves') this.menu();
      }
      e.target.value = '';
    });
    document.addEventListener('keydown', e => {
      if (e.code === 'Escape') {
        if (this.dialog) return;
        if (this.state === 'game') {
          this.click('menu');
          e.preventDefault();
        }
        return;
      }
      if (this.state !== 'game' || this.dialog || e.altKey || e.ctrlKey || e.metaKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (['KeyW', 'KeyS', 'KeyA', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
        return;
      }
      if (e.repeat) return;
      if (e.code === 'KeyM') {
        e.preventDefault();
        this.selectPanel(this.panel === 'atlas' ? 'field' : 'atlas');
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        this.click('pause');
      }
      if (e.code === 'KeyE') {
        e.preventDefault();
        this.run('use');
      }
      if (e.code === 'Space' && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        this.run('pulse');
      }
    });
    document.addEventListener('keyup', e => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.keys.clear();
        this.acc = 0;
        if (this.s) this.save('auto');
      }
    });
    window.addEventListener('pagehide', () => {
      if (this.s) this.save('auto');
    });
  };
  P.language = function () {
    document.documentElement.lang = this.prefs.lang;
    if (this.state === 'menu') this.menu();else {
      this.footKey = '';
      this.shell();
      this.side();
      this.hud();
    }
  };
  P.click = function (id, a = {}) {
    if (id.startsWith('do-')) {
      this.run(id.slice(3), a);
      return;
    }
    switch (id) {
      case 'settings':
        this.settings();
        break;
      case 'saves':
        this.saves();
        break;
      case 'close':
        this.close();
        break;
      case 'lang':
        this.prefs.lang = this.prefs.lang === 'en' ? 'bg' : 'en';
        this.preferences();
        this.language();
        break;
      case 'start':
        {
          this.seed = ($('seed').value.trim() || 'PELAGOS').slice(0, 72);
          if (this.s || this.slotCache) {
            this.modal('new', this.bi('Нова вселена', 'New universe'), '<p>' + this.bi('Новата игра ще замени автоматичния запис. Ръчният запис се пази.', 'A new game replaces the autosave. Your manual slot is retained.') + '</p>' + btn('confirmNew', this.bi('Започни', 'Begin'), {}, 'primary wide'));
          } else this.click('confirmNew');
          break;
        }
      case 'confirmNew':
        this.start(G.create(this.seed));
        this.save('auto');
        break;
      case 'resume':
        {
          const state = this.s || this.storage('auto');
          if (state) this.start(state);
          break;
        }
      case 'roll':
        {
          const r = new Uint32Array(1);
          if (window.crypto) crypto.getRandomValues(r);else r[0] = Date.now() >>> 0;
          this.seed = G.name(r[0]).toUpperCase() + '-' + (r[0] % 1000).toString().padStart(3, '0');
          $('seed').value = this.seed;
          break;
        }
      case 'menu':
        if (this.s) this.save('auto');
        this.menu();
        break;
      case 'save':
        if (this.s) {
          const ok = this.save(a.slot, true);
          this.saves();
          this.notice(ok ? 'saved' : 'storage', ok);
        }
        break;
      case 'load':
        {
          const s = this.storage(a.slot);
          if (s) {
            this.start(s);
            this.save('auto');
            this.notice('loaded');
          } else this.notice('missing', false);
          break;
        }
      case 'export':
        {
          if (!this.s) break;
          try {
            const raw = G.encode(G.validate(this.s)),
              url = URL.createObjectURL(new Blob([raw], {
                type: 'application/json'
              })),
              link = document.createElement('a');
            link.href = url;
            link.download = 'GENESIS-' + this.s.seed.replace(/[^a-zA-Z0-9А-Яа-я_-]/g, '_') + '-' + this.s.tick + '.genesis';
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1800);
            this.notice('exported');
          } catch {
            this.notice('invalid', false);
          }
          break;
        }
      case 'import':
        $('importfile').click();
        break;
      case 'gpu':
        this.prefs.gpu = !this.prefs.gpu;
        if (this.prefs.gpu) this.motes.init();
        $('motes').hidden = !this.prefs.gpu;
        this.preferences();
        this.settings();
        break;
      case 'diag':
        this.prefs.diag = !this.prefs.diag;
        this.preferences();
        this.settings();
        break;
      case 'panel':
        this.selectPanel(a.k);
        break;
      case 'goal':
        this.selectPanel(a.k);
        if (a.k === 'field') this.notice('ok', true, this.t(a.id));
        break;
      case 'tutorial':
        this.s.tut = !this.s.tut;
        this.side();
        if (this.dialog === 'settings') this.settings();
        break;
      case 'pause':
        this.paused = !this.paused;
        this.keys.clear();
        this.acc = 0;
        this.shell();
        this.hud();
        break;
      case 'speed':
        this.speed = this.speed === 1 ? 3 : this.speed === 3 ? 8 : 1;
        this.prefs.speed = this.speed;
        this.preferences();
        this.shell();
        break;
      case 'trial':
        this.run('experiment', {
          ...this.lab
        });
        break;
      case 'historyPage':
        this.historyPage = a.index;
        this.side(true);
        break;
      case 'house':
        this.house = a.index;
        this.side();
        break;
      case 'mapmode':
        this.atlasMode = a.k;
        this.side();
        break;
      case 'homeStar':
        this.selected = G.HOME;
        this.side();
        break;
      case 'nearstar':
        this.selected = a.sid;
        this.side();
        break;
      case 'lookup':
        {
          const x = $('gx').valueAsNumber,
            y = $('gy').valueAsNumber;
          if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= G.AXIS || y >= G.AXIS) {
            this.notice('target', false);
            break;
          }
          this.selected = G.idAt(x, y);
          this.side();
          break;
        }
    }
  };
  P.loop = function (now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(.22, (now - (this.prev || now)) / 1000);
    this.prev = now;
    if (document.hidden || !dt) return;
    this.fps = this.fps ? this.fps * .94 + .06 / Math.max(.003, dt) : 1 / dt;
    if (this.state === 'menu') {
      if (now / 1000 - this.lastMenuT > (this.reduced ? 5 : .105)) {
        const el = $('menuArt'),
          b = el.getBoundingClientRect(),
          d = Math.min(devicePixelRatio || 1, 1.5),
          W = Math.max(1, Math.round(b.width)),
          H = Math.max(1, Math.round(b.height));
        if (el.width !== Math.round(W * d) || el.height !== Math.round(H * d)) {
          el.width = Math.round(W * d);
          el.height = Math.round(H * d);
        }
        const c = el.getContext('2d');
        c.setTransform(d, 0, 0, d, 0, 0);
        G.menuArt(c, W, H, 72841, this.reduced ? 0 : now / 4000, this.prefs.lang);
        this.lastMenuT = now / 1000;
      }
      return;
    }
    const s = this.s;
    if (!s) return;
    if (!this.paused && !this.dialog) {
      this.acc = (this.acc || 0) + dt * this.speed;
      const key = this.keys,
        has = (a, b) => key.has(a) || key.has(b);
      const input = {
        x: Number(has('KeyD', 'ArrowRight')) - Number(has('KeyA', 'ArrowLeft')),
        y: Number(has('KeyS', 'ArrowDown')) - Number(has('KeyW', 'ArrowUp')),
        fast: has('ShiftLeft', 'ShiftRight'),
        brake: key.has('KeyX')
      };
      const before = performance.now();
      let steps = 0;
      while (this.acc >= .125 && steps < 20) {
        const scope = s.loc.scope,
          land = s.stats.landfall,
          result = G.step(s, input);
        this.acc -= .125;
        this.steps++;
        steps++;
        if (result) {
          this.feedback(result, true);
          if (scope !== s.loc.scope) this.contextChange(false);else this.side();
        } else if (land !== s.stats.landfall && this.panel === 'field') this.side();
      }
      if (steps) this.simMs = this.simMs * .9 + (performance.now() - before) / steps * .1;
    }
    if ((!this.dialog || !this.renderer.drawn) && now - this.lastRender > (this.prefs.quality === 'low' ? 32 : 15)) {
      const t = now / 1000;
      this.renderer.draw(s, t, this.prefs.lang, this.prefs.quality);
      this.lastRender = now;
      const field = G.environment(G.body(s), s.loc.x, s.loc.y, G.world(s), s.tick).field;
      if (this.prefs.gpu && this.motes.active) {
        $('motes').hidden = false;
        this.motes.draw(this.renderer.W, this.renderer.H, t, G.body(s).seed, field, this.renderer.budget);
      }
      if (!this.paused && !this.dialog) this.sound.score(s, s.cool.hit > .2 || s.vital < 30, field);
    }
    if (now - (this.lastHud || 0) > 350) {
      this.hud();
      if (this.panel === 'atlas' && this.atlasMode === 'surface') this.paintPanelMedia();
      this.lastHud = now;
    }
    if (now > (this.toastEnd || 0)) $('toast').hidden = true;
    if (now - (this.lastSave || 0) > 15000 && !this.dialog) {
      this.save('auto');
      this.lastSave = now;
    }
  };
  globalThis.GenesisEvolution = Object.freeze({
    setController: G.setEvolutionController,
    status: G.controllerStatus
  });
  new Interface();
})();
