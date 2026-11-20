'use strict';

// Offline non-browser event host. It tests the final bundle's DOM handlers and uses native Skia
// for Canvas 2D. Browser layout, permissions and WebGPU are outside its scope.
const fs = require('node:fs'),
  vm = require('node:vm'),
  path = require('node:path'),
  assert = require('node:assert/strict');
const {
    createCanvas
  } = require('@napi-rs/canvas'),
  {
    uiJourney
  } = require('./ui_scenario.js');
const html = fs.readFileSync(path.join(__dirname, '../GENESIS_Beyond_Matter.html'), 'utf8');
const sharedScript = html.split('<script id="genesis-kernel">')[1].split('</script>')[0];
const script = sharedScript + '\n' + html.split('<script>')[1].split('</script>')[0];
const validStr = v => String(v).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function props(source) {
  const obj = {};
  for (const m of source.matchAll(/([\w-]+)="([^"]*)"/g)) obj[m[1]] = validStr(m[2]);
  return obj;
}
function plain(markup) {
  return validStr(markup.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}
const nodes = new Map(),
  stable = new Set(),
  memory = new Map(),
  store = {
    getItem: k => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, v)
  };
let focused,
  now = 0,
  frame;
const docEvents = {};
let exportedFile;
class Element {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.dataset = {};
    this.handlers = {};
    this.children = [];
    this.dynamic = [];
    this.markup = '';
    this.value = '';
    this.hidden = false;
    this.scrollTop = 0;
    this.open = false;
    this.style = {};
  }
  addEventListener(k, fn) {
    (this.handlers[k] ??= []).push(fn);
  }
  fire(k, e = {}) {
    for (const fn of this.handlers[k] || []) fn({
      target: this,
      preventDefault() {},
      ...e
    });
  }
  setAttribute(k, v) {
    this[k] = v;
  }
  focus() {
    focused = this;
  }
  closest() {
    return this;
  }
  click() {
    if (this.tagName === 'A') exportedFile = require('node:buffer').resolveObjectURL(this.href);
    else this.fire('click');
  }
  append() {}
  remove() {}
  showModal() {
    this.open = true;
  }
  close() {
    this.open = false;
    this.fire('close');
  }
  get lastChild() {
    return this.children.at(-1);
  }
  get innerHTML() {
    return this.markup;
  }
  set innerHTML(v) {
    this.markup = v;
    for (const id of this.dynamic) if (!stable.has(id)) nodes.delete(id);
    this.dynamic = [];
    this.children = [];
    for (const m of v.matchAll(/<(input|select|canvas|b|p|div)\b([^>]*)>/g)) {
      const p = props(m[2]);
      if (!p.id) continue;
      const el = make(m[1], p.id);
      el.value = p.value || '';
      if (m[1] === 'canvas') {
        el.width = Number(p.width) || 300;
        el.height = Number(p.height) || 150;
      }
      this.dynamic.push(p.id);
    }
    for (const m of v.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const p = props(m[1]),
        e = new Element('button');
      e.dataset = {
        ui: p['data-ui'],
        k: p['data-k'],
        v: p['data-v']
      };
      e.disabled = /\sdisabled(?:\s|$)/.test(m[1]);
      e.textContent = plain(m[2]);
      this.children.push(e);
    }
  }
}
function make(tag, id = '') {
  const el = new Element(tag, id);
  if (tag === 'canvas') {
    const backing = createCanvas(1, 1);
    for (const k of ['width', 'height']) Object.defineProperty(el, k, {
      get: () => backing[k],
      set: v => {
        backing[k] = v;
      }
    });
    el.getContext = () => backing.getContext('2d');
    el.getBoundingClientRect = () => ({
      width: 600,
      height: 390,
      left: 0,
      top: 0
    });
  }
  if (id) nodes.set(id, el);
  return el;
}
function startHost() {
  nodes.clear();
  stable.clear();
  frame = null;
  const body = html.split('<body>')[1].split('<script>')[0];
  for (const m of body.matchAll(/<(\w+)\b([^>]*)>/g)) {
    const p = props(m[2]);
    if (p.id) {
      make(m[1], p.id);
      stable.add(p.id);
    }
  }
  nodes.get('genesis-kernel').textContent = sharedScript;
  const document = {
    getElementById: k => nodes.get(k) || null,
    get activeElement() {
      return focused;
    },
    documentElement: {
      lang: 'bg'
    },
    body: make('body'),
    hidden: false,
    createElement: tag => tag === 'canvas' ? createCanvas(1, 1) : make(tag),
    addEventListener: (k, f) => {
      (docEvents[k] ??= []).push(f);
    }
  };
  const window = {
    addEventListener() {},
    scrollTo() {},
    matchMedia: () => ({
      matches: true
    })
  };
  const ctx = vm.createContext({
    document,
    window,
    navigator: {},
    localStorage: store,
    Blob,
    URL,
    devicePixelRatio: 1,
    crypto: require('node:crypto').webcrypto,
    requestAnimationFrame: f => {
      frame = f;
    },
    performance: {
      now: () => now
    },
    console,
    setTimeout,
    clearTimeout,
    Math,
    Number,
    String,
    JSON,
    Array,
    Object,
    Map,
    Set,
    Error,
    Infinity
  });
  vm.runInContext(script, ctx);
  return ctx;
}
let ctx = startHost();
const driver = {
  async click(id, k, scope) {
    const sources = scope ? [nodes.get(scope)] : ['dcontent', 'side', 'rail', 'intro', 'menutop', 'playtop', 'fieldfoot'].map(v => nodes.get(v));
    const button = sources.filter(Boolean).flatMap(e => e.children).find(e => e.dataset.ui === id && (k === undefined || e.dataset.k === String(k)));
    assert(button, 'Missing control ' + id + '/' + k);
    assert(!button.disabled, 'Disabled control ' + id + '/' + k);
    nodes.get('app').fire('click', {
      target: button
    });
  },
  async begin() {
    await this.click('lang', undefined, 'menutop');
    await this.click('start', undefined, 'intro');
  },
  async settle() {
    for (let i = 0; i < 850 && nodes.get('toast').dataset.code === 'course'; i++) {
      now += 130;
      frame(now);
    }
    now += 128;
    frame(now);
  },
  async code(code) {
    assert.equal(nodes.get('toast').dataset.code, code, nodes.get('toast').textContent);
  },
  async stock(k) {
    const re = new RegExp('res-' + k + '[^>]*>[\\s\\S]*?<b>([0-9]+)</b>');
    return Number(nodes.get('status').markup.match(re)[1]);
  },
  async select(id, value) {
    const el = nodes.get(id);
    assert(el, 'Select ' + id);
    el.value = value;
    nodes.get('app').fire('change', {
      target: el
    });
  },
  async epoch() {
    return plain(nodes.get('fieldhead').markup.match(/class="fieldtitle">([^<]+)/)[1]);
  },
  async place() {
    return plain(nodes.get('fieldhead').markup.match(/class="fieldsub">([^<]+)/)[1]).split(' · ')[0];
  },
  async side() {
    return plain(nodes.get('side').markup);
  },
  async persistence() {
    await this.click('saves', undefined, 'playtop');
    await this.click('export');
    await this.code('exported');
    assert(exportedFile && exportedFile.size > 0);
    const fileInput = nodes.get('importfile');
    const changeFile = async blob => {
      fileInput.files = [blob];
      for (const handler of fileInput.handlers.change) await handler({target:fileInput});
    };
    await changeFile(new Blob(['invalid']));
    await this.code('invalid');
    assert.equal(await this.epoch(),'Transcendence');
    await changeFile(exportedFile);
    await this.code('loaded');
    const manual = store.getItem('genesis.beyondmatter.slot.manual');
    assert(manual);
    ctx = startHost();
    await this.click('resume', undefined, 'intro');
    assert.equal(await this.epoch(), 'Transcendence');
    await this.click('panel', 'archive', 'rail');
    assert((await this.side()).includes('Spatial fold'));
  }
};
uiJourney(driver).then(r => {
  console.log(JSON.stringify({
    host: 'Node DOM event fixture + native Skia',
    portableFileRoundTrip: true, corruptFileRejected: true,
    ...r
  }, null, 2));
}).catch(e => {
  console.error(e);
  process.exitCode = 1;
});
