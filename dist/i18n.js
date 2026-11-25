// Language support: English (source), Spanish and French.
//
// The page is written in English. For another language, every piece of text
// is looked up in a dictionary (i18n/<lang>.js) keyed by the English text and
// replaced in place. Inline elements inside a sentence are kept as the same
// DOM nodes, written as numbered slots in the key: "Read the <0>guide</0>".
// Text that scripts add later (status lines, tab contents, panels) is
// translated as it appears. Text drawn on a canvas goes through the same
// dictionary. Anything without an entry stays in English.

export const LANGUAGES = [['en', 'English'], ['es', 'Español'], ['fr', 'Français']];
const SUPPORTED = LANGUAGES.map(([code]) => code);

function chooseLanguage() {
  let query = null;
  try { query = new URLSearchParams(window.location.search).get('lang'); } catch { /* ignore */ }
  if (query === 'collect') return 'collect';
  if (SUPPORTED.includes(query)) { try { localStorage.setItem('wf-lang', query); } catch { /* private mode */ } return query; }
  try { const saved = localStorage.getItem('wf-lang'); if (SUPPORTED.includes(saved)) return saved; } catch { /* ignore */ }
  return 'en';
}

export const lang = chooseLanguage();
const collecting = lang === 'collect';
const seen = collecting ? (window.__i18nKeys = new Set()) : null;
let dictionary = {};
if (lang !== 'en' && !collecting) {
  try { dictionary = (await import(`./i18n/${lang}.js?v=20261125-steps`)).default; }
  catch (error) { console.warn('Translation file could not be loaded; showing English.', error); }
}
const active = lang !== 'en' && !collecting;

const HAS_LETTER = /\p{L}/u;
const NUMBER = /\d+(?:[.,]\d+)*(?:e[+-]?\d+)?/gi;
const squash = text => text.replace(/\s+/g, ' ').trim();

// Look a string up: exact text first, then the same text with numbers as "#".
export function t(text) {
  if (typeof text !== 'string' || !HAS_LETTER.test(text)) return text;
  const key = squash(text);
  if (collecting) { seen.add(key); return text; }
  if (!active) return text;
  if (Object.prototype.hasOwnProperty.call(dictionary, key)) return dictionary[key];
  const numbers = [];
  const pattern = key.replace(NUMBER, match => { numbers.push(match); return '#'; });
  if (numbers.length && Object.prototype.hasOwnProperty.call(dictionary, pattern)) {
    let index = 0;
    return dictionary[pattern].replace(/\{(\d+)\}|#/g, (m, n) => (n !== undefined ? numbers[+n] : numbers[index++]) ?? m);
  }
  return text;
}

// ---- DOM ----
const SKIP = 'script, style, noscript, pre, code, kbd, .cli-command, [data-i18n-skip]';
const OPAQUE = 'output, input, select, textarea, canvas, svg, img, code, kbd, pre';
const ATTRIBUTES = ['aria-label', 'alt', 'title', 'placeholder'];
const done = new WeakMap();

const hasDirectText = el => { for (const node of el.childNodes) if (node.nodeType === 3 && HAS_LETTER.test(node.nodeValue)) return true; return false; };
const isOpaque = el => el.matches(OPAQUE) || !HAS_LETTER.test(el.textContent);

function serialize(el, slots) {
  let out = '';
  for (const node of el.childNodes) {
    if (node.nodeType === 3) out += node.nodeValue;
    else if (node.nodeType === 1) {
      const index = slots.length;
      slots.push(node);
      out += isOpaque(node) ? `<${index}/>` : `<${index}>${serialize(node, slots)}</${index}>`;
    }
  }
  return out;
}

function rebuild(el, slots, translated) {
  const open = slots.filter(slot => !isOpaque(slot));
  el.replaceChildren();
  open.forEach(slot => slot.replaceChildren());
  const stack = [el];
  for (const token of translated.matchAll(/<(\d+)\/>|<(\d+)>|<\/(\d+)>|([^<]+)/g)) {
    const top = stack[stack.length - 1];
    if (token[1] !== undefined) { if (slots[+token[1]]) top.append(slots[+token[1]]); }
    else if (token[2] !== undefined) { const node = slots[+token[2]]; if (node) { top.append(node); stack.push(node); } }
    else if (token[3] !== undefined) { if (stack.length > 1) stack.pop(); }
    else top.append(document.createTextNode(token[4]));
  }
}

function translateUnit(el) {
  const slots = [];
  const raw = serialize(el, slots);
  if (done.get(el) === raw) return slots;
  const key = squash(raw);
  if (collecting) { seen.add(key); return slots; }
  const translated = t(key);
  if (translated !== key) {
    const lead = /^\s/.test(raw) ? ' ' : '', tail = /\s$/.test(raw) ? ' ' : '';
    rebuild(el, slots, lead + translated + tail);
    done.set(el, serialize(el, []));
  } else done.set(el, raw);
  return slots;
}

function translateAttributes(el) {
  for (const name of ATTRIBUTES) {
    const value = el.getAttribute(name);
    if (value && HAS_LETTER.test(value)) { const next = t(value); if (next !== value) el.setAttribute(name, next); }
  }
}

function walk(el) {
  if (el.nodeType !== 1 || el.matches(SKIP)) return;
  translateAttributes(el);
  if (el.tagName === 'OPTION') { translateUnit(el); return; }
  if (hasDirectText(el)) {
    for (const slot of translateUnit(el)) { translateAttributes(slot); if (slot.matches(OPAQUE)) walk(slot); else slot.querySelectorAll('*').forEach(translateAttributes); }
    return;
  }
  for (const child of [...el.children]) walk(child);
}

function unitRoot(node) {
  let el = node.nodeType === 1 ? node : node.parentElement;
  while (el && el.parentElement && el !== document.body && hasDirectText(el.parentElement)) el = el.parentElement;
  return el;
}

// Canvas labels use the same dictionary.
if (active || collecting) {
  const proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
  if (proto) {
    for (const name of ['fillText', 'strokeText', 'measureText']) {
      const original = proto[name];
      proto[name] = function (text, ...rest) { return original.call(this, typeof text === 'string' ? t(text) : text, ...rest); };
    }
  }
}

export function startI18n() {
  const root = document.documentElement;
  if (active) root.lang = lang;
  if (active || collecting) {
    const title = document.querySelector('title');
    if (title) title.textContent = t(title.textContent);
    document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image:alt"]').forEach(meta => meta.setAttribute('content', t(meta.getAttribute('content') || '')));
    walk(document.body);
    let queue = new Set(), scheduled = false;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'attributes') { queue.add(record.target); continue; }
        const root = unitRoot(record.target);
        if (root) queue.add(root);
        record.addedNodes.forEach(node => { if (node.nodeType === 1) queue.add(node); });
      }
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        const batch = [...queue]; queue = new Set();
        observer.disconnect();
        for (const el of batch) if (el.isConnected) walk(el);
        observer.observe(document.body, options);
      });
    });
    const options = { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ATTRIBUTES };
    observer.observe(document.body, options);
  }
  root.classList.remove('i18n-wait');

  // Language selector: keep the current page when switching.
  document.querySelectorAll('.lang-switch a[data-lang]').forEach(link => {
    const code = link.dataset.lang;
    const current = code === (collecting ? 'en' : lang);
    link.classList.toggle('active', current);
    if (current) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
    link.addEventListener('click', event => {
      event.preventDefault();
      if (current) return;
      try { localStorage.setItem('wf-lang', code); } catch { /* private mode */ }
      const url = new URL(window.location.href);
      url.searchParams.set('lang', code);
      window.location.assign(url.toString());
    });
  });
}
