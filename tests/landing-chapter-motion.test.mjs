import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function compile(file, dependencies, globals = {}) {
  const module = { exports: {} };
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  vm.runInNewContext(compiled, { module, exports: module.exports, require: id => dependencies[id] ?? require(id), ...globals });
  return module.exports;
}
const rules = compile('src/lib/marketing/chapter-motion.ts', {});

function harness(reduced = false) {
  const effects = [], elements = [], frames = new Map(), documentListeners = new Map(), mediaListeners = new Map();
  let observer, id = 0, now = 0;
  const document = { hidden: false, addEventListener: (name, fn) => documentListeners.set(name, fn), removeEventListener: name => documentListeners.delete(name) };
  const media = { matches: reduced, addEventListener: (name, fn) => mediaListeners.set(name, fn), removeEventListener: name => mediaListeners.delete(name) };
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const { ChapterMotion } = compile('src/components/marketing/ChapterMotion.tsx', {
    react: {
      useRef: () => { const element = { dataset: {} }; elements.push(element); return { current: element }; },
      useEffect: fn => effects.push(fn)
    },
    '@/lib/marketing/chapter-motion': rules,
    './chapters.module.css': { default: { motion: 'motion' } }
  }, {
    document, window: { IntersectionObserver: Observer }, IntersectionObserver: Observer,
    innerHeight: 1000, matchMedia: () => media,
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; },
    cancelAnimationFrame: frame => frames.delete(frame)
  });
  const cleanups = [];
  return {
    elements, frames,
    mount(name) { ChapterMotion({ name, children: name, duration: 600 }); cleanups.push(effects.shift()()); },
    visible(values) { observer.callback(values.map((visibility, index) => ({ target: elements[index], intersectionRect: { height: visibility * 600 }, boundingClientRect: { height: 600 } }))); },
    tick(count = 1) { for (let i = 0; i < count; i++) { now += 50; const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn(now)); } },
    hide(hidden) { document.hidden = hidden; documentListeners.get('visibilitychange')(); },
    reduce() { media.matches = true; mediaListeners.get('change')(); },
    cleanup() { cleanups.forEach(fn => fn()); assert.equal(frames.size, 0); assert.equal(documentListeners.size, 0); assert.equal(mediaListeners.size, 0); }
  };
}

test('finite chapters choose one meaningful visible scene and hold the last phase', () => {
  assert.equal(rules.chooseVisibleChapter([{ visibility: .2, complete: false }]), -1);
  assert.equal(rules.chooseVisibleChapter([{ visibility: .8, complete: true }, { visibility: .7, complete: false }, { visibility: .6, complete: false }]), 1);
  assert.equal(rules.chapterPhase(-5, 600), 0);
  assert.equal(rules.chapterPhase(300, 600), 3);
  assert.equal(rules.chapterPhase(9000, 600), 6);
});

test('hidden and offscreen time do not advance a chapter, then playback resumes', () => {
  const h = harness(); h.mount('evidence'); h.visible([.9]); h.tick(5);
  const phase = h.elements[0].dataset.phase;
  h.hide(true); h.tick(60);
  assert.equal(h.elements[0].dataset.phase, phase);
  assert.equal(h.elements[0].dataset.playing, 'false');
  assert.equal(h.frames.size, 0);
  h.hide(false); h.visible([0]); h.tick(60);
  assert.equal(h.elements[0].dataset.phase, phase);
  h.visible([.9]); h.tick(30);
  assert.equal(h.elements[0].dataset.phase, '6');
  assert.equal(h.elements[0].dataset.playing, 'false');
  assert.equal(h.frames.size, 0);
  h.visible([0]); h.visible([.9]); h.tick(10);
  assert.equal(h.elements[0].dataset.phase, '6');
  h.cleanup();
});

test('only one chapter plays and a completed scene hands off without another scroll', () => {
  const h = harness(); h.mount('first'); h.mount('second'); h.visible([.9, .8]); h.tick(5);
  assert.equal(h.elements.filter(e => e.dataset.playing === 'true').length, 1);
  assert.equal(h.elements[1].dataset.phase, '0');
  h.tick(30);
  assert.ok(h.elements.every(e => e.dataset.phase === '6' && e.dataset.playing === 'false'));
  h.cleanup();
});

test('reduced motion is static on mount and finishes an in-progress illustration', () => {
  const staticPage = harness(true); staticPage.mount('static'); staticPage.visible([1]); staticPage.tick(5);
  assert.equal(staticPage.elements[0].dataset.phase, '6');
  assert.equal(staticPage.elements[0].dataset.playing, 'false');
  staticPage.cleanup();
  const h = harness(); h.mount('animated'); h.visible([1]); h.tick(4); h.reduce();
  assert.equal(h.elements[0].dataset.phase, '6');
  assert.equal(h.elements[0].dataset.playing, 'false');
  assert.equal(h.frames.size, 0);
  h.cleanup();
});
