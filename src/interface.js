(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[c]);
  const icons = {
    field: '◎',
    anatomy: '⌁',
    lab: '∿',
    build: '⌂',
    society: '◇',
    atlas: '⊙',
    archive: '▤',
    trans: '✧'
  };
  const ri = {
    bio: '✤',
    ore: '⬡',
    crystal: '◇',
    brine: '≈',
    charge: 'ϟ',
    lore: '✧'
  };
  function btn(action, title, a = {}, cls = '', disabled = false) {
    const key = a.k ?? a.kind ?? a.mode ?? a.pid ?? a.sid ?? a.index ?? a.slot ?? a.value ?? '';
    return `<button type="button" data-ui="${esc(action)}" data-k="${esc(key)}" data-v="${esc(JSON.stringify(a))}" class="${esc(cls)}"${disabled ? ' disabled' : ''}>${title}</button>`;
  }
  const doBtn = (cmd, title, args = {}, cls = '') => btn('do-' + cmd, title, args, cls);
  const head = (small, title) => `<div class="eyeline">${small}</div><h2>${title}</h2>`;
  const copy = t => `<p class="copy">${t}</p>`;
  const help = t => `<p class="help">${t}</p>`;
  class Interface {
    constructor() {
      this.prefs = {
        lang: 'bg',
        quality: 'auto',
        volume: .32,
        speed: 1,
        gpu: true,
        diag: false
      };
      try {
        const p = JSON.parse(localStorage.getItem('genesis.settings') || '{}');
        if (['bg', 'en'].includes(p.lang)) this.prefs.lang = p.lang;
        if (['auto', 'low', 'high'].includes(p.quality)) this.prefs.quality = p.quality;
        if ([1, 3, 8].includes(p.speed)) this.prefs.speed = p.speed;
        if (Number.isFinite(p.volume)) this.prefs.volume = G.clamp(p.volume, 0, 1);
        for (const k of ['gpu', 'diag']) if (typeof p[k] === 'boolean') this.prefs[k] = p[k];
      } catch {}
      this.renderer = new G.Renderer($('field'));
      this.motes = new G.Motes($('motes'));
      this.sound = new G.Soundscape();
      this.sound.volume(this.prefs.volume);
      this.seed = 'PELAGOS';
      this.s = null;
      this.panel = 'field';
      this.paused = false;
      this.dialog = '';
      this.state = 'menu';
      this.keys = new Set();
      this.speed = this.prefs.speed;
      this.lab = {
        left: 'bio',
        right: 'ore',
        drive: 'heat',
        level: 1
      };
      this.house = 0;
      this.buildFilter = 'all';
      this.page = '';
      this.historyPage = 0;
      this.selected = G.HOME + 1;
      this.lastMenuT = -3;
      this.lastRender = 0;
      this.fps = 0;
      this.simMs = 0;
      this.steps = 0;
      this.worker = null;
      this.workerMode = false;
      this.stars = [];
      this.surveyKey = '';
      this.forecastKey = '';
      this.forecast = [];
      this.menuNotice = '';
      this.atlasMode = 'surface';
      this.slotCache = null;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.reduced = reduced;
      try {
        const url = URL.createObjectURL(new Blob([WORKER_SOURCE], {
          type: 'text/javascript'
        }));
        this.worker = new Worker(url);
        this.renderer.terrainProvider = (planet, n) => this.worker?.postMessage({
          type: 'terrain',
          key: planet.seed,
          data: {
            planet,
            n
          }
        });
        this.worker.onmessage = e => {
          const m = e.data;
          if (m.type === 'terrain' && this.renderer.tex.has(m.key)) {
            this.renderer.tex.set(m.key, G.terrainCanvas(m.planet, m.n, new Uint8ClampedArray(m.buffer)));
            this.workerMode = true;
          }
          if (m.type === 'survey' && m.key === this.surveyKey) {
            this.stars = m.data;
            this.workerMode = true;
            if (this.panel === 'atlas' && this.state === 'game') this.paintPanelMedia();
          }
          if (m.type === 'forecast' && m.key === this.forecastKey) {
            this.forecast = m.data;
            this.workerMode = true;
            const el = $('forecastout');
            if (el) el.textContent = this.forecastText();
          }
        };
        this.worker.onerror = () => {
          this.worker?.terminate();
          this.worker = null;
          this.workerMode = false;
          this.renderer.terrainProvider = null;
          this.renderer.tex.clear();
          this.surveyKey = '';
          this.forecastKey = '';
          if (this.s && this.state === 'game') this.side();
        };
        URL.revokeObjectURL(url);
      } catch {}
      this.bind();
      this.menu();
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }
    bi(bg, en) {
      return this.prefs.lang === 'en' ? en : bg;
    }
    pair(p) {
      return G.tr(p, this.prefs.lang);
    }
    t(k) {
      return this.pair(G.words[k] || G.labels[k] || [k, k]);
    }
    l(k) {
      return G.label(k, this.prefs.lang);
    }
    storage(slot) {
      try {
        return G.readSlot(localStorage, slot);
      } catch {
        return null;
      }
    }
    preferences() {
      try {
        localStorage.setItem('genesis.settings', JSON.stringify(this.prefs));
      } catch {}
    }
    menu() {
      this.state = 'menu';
      this.keys.clear();
      this.acc = 0;
      this.slotCache = this.storage('auto');
      $('menu').hidden = false;
      $('game').hidden = true;
      document.documentElement.lang = this.prefs.lang;
      $('menutop').innerHTML = btn('saves', this.t('saves'), {}, 'quiet') + btn('settings', this.t('settings'), {}, 'quiet') + btn('lang', this.prefs.lang === 'en' ? 'БГ' : 'EN', {}, 'lang');
      const go = this.bi('Започни нов живот', 'Begin a new life');
      $('intro').innerHTML = `<div class="eyebrow">${this.bi('Атлас на живота', 'Atlas of life')}</div><h1>GENESIS</h1><div class="subtitle">Beyond Matter</div>${copy(this.bi('От първата клетка до цивилизация, която създава светове. Изследвай една вселена чрез еволюция, технология и етер.', 'From a single cell to a civilization that makes worlds. Explore one universe through evolution, technology and aether.')).replace('class="copy"', 'class="lede"')}<label class="seedlabel" for="seed">${this.bi('Начален seed', 'World seed')}</label><div class="seedbar"><input id="seed" maxlength="72" value="${esc(this.seed)}" spellcheck="false"><button data-ui="roll" title="${this.bi('Случаен seed', 'Random seed')}" aria-label="${this.bi('Случаен seed', 'Random seed')}">⤨</button></div>${btn('start', go + ' <b>→</b>', {}, 'primary entrybtn')}${this.s || this.slotCache ? btn('resume', this.bi('Продължи', 'Continue') + ' · ' + esc((this.s || this.slotCache).seed), {}, 'textbtn') : ''}<div class="help" role="status">${esc(this.menuNotice)}</div>`;
      $('platecaption').innerHTML = `<span>${this.bi('МИКРОСКОПИЯ', 'MICROSCOPY')} / 01</span><i>Pelagia prima</i>`;
      $('menufeed').innerHTML = `<div class="epochs">${G.eras.map(p => '<span>' + this.pair(p) + '</span>').join('')}</div><span>${this.bi('Локална вселена', 'Local universe')} ◌</span>`;
      this.lastMenuT = -3;
      window.scrollTo(0, 0);
    }
    start(s) {
      this.s = s;
      this.state = 'game';
      this.paused = false;
      this.keys.clear();
      this.acc = 0;
      this.panel = 'field';
      this.page = '';
      this.historyPage = 0;
      this.selected = s.loc.sid + 1 < G.CAPACITY ? s.loc.sid + 1 : s.loc.sid - 1;
      this.surveyKey = '';
      this.forecastKey = '';
      this.stars = [];
      this.forecast = [];
      this.atlasMode = s.loc.scope === 'orbit' ? 'galaxy' : 'surface';
      $('menu').hidden = true;
      $('game').hidden = false;
      this.close();
      this.sound.wake();
      if (this.prefs.gpu) this.motes.init();
      this.shell();
      this.selectPanel('field');
      this.hud();
      window.scrollTo(0, 0);
    }
    shell() {
      const s = this.s;
      const open = ['field', 'anatomy', ...(s.era >= 2 ? ['lab', 'build', 'society'] : []), 'atlas', 'archive', ...(s.era >= 5 ? ['trans'] : [])];
      $('rail').innerHTML = open.map(k => btn('panel', '<i aria-hidden="true">' + icons[k] + '</i>' + this.t(k), {
        k
      }, this.panel === k ? 'on' : '')).join('');
      $('playtop').innerHTML = btn('pause', this.paused ? '▶' : 'Ⅱ', {}, 'minor') + btn('speed', '×' + this.speed, {}, 'minor') + btn('saves', this.t('saves'), {}, 'quiet') + btn('settings', '⚙', {}, 'minor');
      $('playtop').children[0].setAttribute('aria-label', this.bi('Пауза / продължи', 'Pause / resume'));
      $('playtop').children[1].title = this.bi('Темп на симулацията', 'Simulation speed');
      $('playtop').lastChild.setAttribute('aria-label', this.t('settings'));
      $('field').setAttribute('aria-label', this.bi('Игрално поле. Посочи цел или използвай WASD.', 'Playfield. Click a destination or use WASD.'));
    }
    selectPanel(k) {
      this.panel = k;
      this.shell();
      this.side(true);
    }
    cost(cost) {
      return '<span class="cost">' + Object.entries(cost).map(([k, v]) => `<span title="${esc(this.l(k))}">${ri[k]} ${Number.isInteger(v) ? v : v.toFixed(1)}</span>`).join(' · ') + '</span>';
    }
    modal(id, title, html) {
      this.dialog = id;
      this.keys.clear();
      $('dtitle').innerHTML = '<h2>' + esc(title) + '</h2>';
      $('dcontent').innerHTML = html;
      $('close').setAttribute('aria-label', this.bi('Затвори', 'Close'));
      if (!$('dialog').open) $('dialog').showModal();
    }
    close() {
      if ($('dialog').open) $('dialog').close();
      this.dialog = '';
    }
    settings() {
      const p = this.prefs;
      this.modal('settings', this.t('settings'), `<div class="formrow"><label for="langSel">${this.bi('Език', 'Language')}</label><select id="langSel"><option value="bg" ${p.lang === 'bg' ? 'selected' : ''}>Български</option><option value="en" ${p.lang === 'en' ? 'selected' : ''}>English</option></select></div><div class="formrow"><label for="quality">${this.bi('Графично качество', 'Graphics quality')}</label><select id="quality">${this.opts(['auto', 'low', 'high'], p.quality, [this.bi('Адаптивно', 'Adaptive'), this.bi('Икономично', 'Low'), this.bi('Високо', 'High')])}</select></div><div class="formrow"><label for="volume">${this.bi('Сила на звука', 'Volume')} · <b id="volval">${Math.round(p.volume * 100)}%</b></label><input id="volume" type="range" min="0" max="100" value="${Math.round(p.volume * 100)}"></div><div class="actions">${btn('gpu', 'WebGPU · ' + this.on(p.gpu))}${btn('diag', this.bi('Диагностика', 'Diagnostics') + ' · ' + this.on(p.diag))}</div>${this.s ? this.diagnostics() + btn('tutorial', this.bi('Полеви наставник', 'Field guide') + ' · ' + this.on(this.s.tut), {}, 'small') : ''}${help(this.bi('WASD или стрелки за движение. E събира или каца. Интервал изпуска импулс. M отваря атласа. P спира времето.', 'WASD or arrows to move. E gathers or lands. Space releases a pulse. M opens the atlas. P pauses time.'))}`);
    }
    on(v) {
      return v ? this.bi('вкл.', 'on') : this.bi('изкл.', 'off');
    }
    opts(items, current, names) {
      return items.map((k, i) => `<option value="${esc(k)}" ${String(k) === String(current) ? 'selected' : ''}>${esc(names ? names[i] : this.l(k))}</option>`).join('');
    }
    diagnostics() {
      const mem = performance.memory?.usedJSHeapSize;
      return `<div class="card data">${Math.round(this.fps)} FPS · ${this.simMs.toFixed(2)} ms ${this.bi('симулация', 'simulation')}<br>${this.renderer.ms.toFixed(2)} ms ${this.bi('рисуване', 'render')} · ${this.s.actors.length} ${this.bi('агенти', 'agents')}<br>${mem ? (mem / 1048576).toFixed(1) + ' MiB JS' : this.bi('JS паметта не се отчита в този браузър', 'This browser does not report JS heap')}<br>Canvas 2D · ${this.motes.active && this.prefs.gpu ? 'WebGPU' : 'CPU motes'} · ${this.workerMode ? 'Worker' : this.bi('локална симулация', 'local simulation')}</div>`;
    }
    saves() {
      const rows = ['auto', 'manual'].map(slot => {
        const s = this.storage(slot);
        return `<div class="card"><div class="row"><strong>${slot === 'auto' ? this.bi('Автоматичен запис', 'Autosave') : this.bi('Ръчен запис', 'Manual save')}</strong>${s ? btn('load', this.bi('Зареди', 'Load'), {
          slot
        }, 'small') : ''}</div><div class="help">${s ? esc(s.seed) + ' · ' + this.pair(G.eras[s.era]) + ' · ' + Math.floor(s.tick / 8) + ' s' : this.bi('Празно гнездо', 'Empty slot')}</div></div>`;
      }).join('');
      const buttons = (this.s ? btn('save', this.bi('Запази ръчно', 'Save manually'), {
        slot: 'manual'
      }, 'primary') + btn('export', this.bi('Експортирай', 'Export file')) : '') + btn('import', this.bi('Импортирай', 'Import file'));
      this.modal('saves', this.t('saves'), rows + '<div class="actions">' + buttons + '</div><p id="saveinfo" role="status" class="help"></p>');
    }
    save(slot, announce = false) {
      try {
        G.writeSlot(localStorage, slot, this.s);
        if (announce) this.notice('saved');
        return true;
      } catch {
        if (announce || !this.warned) {
          this.notice('storage', false);
          this.warned = true;
        }
        return false;
      }
    }
    notice(code, ok = true, detail = '') {
      const text = this.t(code) + (detail ? ' · ' + detail : '');
      if (this.dialog === 'saves' && $('saveinfo')) $('saveinfo').textContent = text;
      if (this.state === 'menu') {
        this.menuNotice = text;
        return;
      }
      const el = $('toast');
      el.className = ok ? '' : 'bad';
      el.dataset.code = code;
      el.textContent = text;
      el.hidden = false;
      this.toastEnd = performance.now() + 3100;
    }
    run(cmd, args = {}, user = true) {
      const s = this.s,
        wasEra = s.era,
        scope = s.loc.scope,
        sid = s.loc.sid;
      const res = G.action(s, cmd, args);
      this.feedback(res, user);
      if (res.ok && (s.era !== wasEra || scope !== s.loc.scope || sid !== s.loc.sid)) {
        this.contextChange(s.era !== wasEra);
      } else if (user) {
        this.side();
        this.hud();
      }
      return res;
    }
    contextChange(epoch) {
      this.surveyKey = '';
      this.forecastKey = '';
      this.stars = [];
      this.atlasMode = this.s.loc.scope === 'orbit' ? 'galaxy' : 'surface';
      if (this.selected === this.s.loc.sid) this.selected = G.idAt(G.coords(this.s.loc.sid).x + 1, G.coords(this.s.loc.sid).y);
      if (epoch) this.selectPanel('field');else this.side();
      this.shell();
      this.hud();
      this.save('auto');
    }
    feedback(res, user) {
      if (!res) return;
      let info = res.item ? this.l(res.item) : '';
      if (res.gain) info = Object.entries(res.gain).map(([k, n]) => ri[k] + ' +' + n).join(' ');
      if (res.code === 'epoch') info = this.pair(G.eras[this.s.era]);
      if (res.sample) {
        info += (info ? ' · ' : '') + 'R ' + res.sample.response.toFixed(2);
      }
      if (user || res.code !== 'course') this.notice(res.code, res.ok, info);
      if (res.ok && res.code !== 'course') this.sound.fx(res.code, G.hash(this.s.seed));
      if (res.code === 'pulse') this.renderer.pulseAt = performance.now() / 1000;
    }
    forecastText() {
      return this.forecast.length ? this.forecast.slice(0, 3).map(q => Math.round(q.n)).join(' / ') : '…';
    }
    requestForecast() {
      const s = this.s,
        w = G.world(s),
        key = [s.seed, s.loc.sid, s.loc.pid, w.cycle].join('|');
      if (this.forecastKey === key) return;
      this.forecastKey = key;
      const data = {
        world: JSON.parse(JSON.stringify(w)),
        planet: G.body(s)
      };
      if (this.worker) this.worker.postMessage({
        type: 'forecast',
        key,
        data
      });else this.forecast = G.forecast(data);
    }
    requestSurvey() {
      const s = this.s,
        key = [s.seed, s.loc.sid, Math.floor(s.tick / 960)].join('|');
      if (key === this.surveyKey) return;
      this.surveyKey = key;
      const data = {
        seed: s.seed,
        id: s.loc.sid,
        age: s.tick / 8
      };
      if (this.worker) this.worker.postMessage({
        type: 'survey',
        key,
        data
      });else this.stars = G.survey(data);
    }
  }
  Object.assign(G, {
    Interface,
    $,
    esc,
    btn,
    doBtn,
    head,
    copy,
    help,
    ri
  });
})();
