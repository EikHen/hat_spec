#!/usr/bin/env node
// HAT parser conformance test suite
// Loads parseHAT / serializeHAT from src/js/parser.js via Node vm.
// Run: node tests/run.js

'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── Load parser functions from src/js/parser.js ───────────────────────────

const parserPath = path.resolve(__dirname, '../src/js/parser.js');
// Strip ES module export keywords so the code runs in a plain vm context
const parserCode = fs.readFileSync(parserPath, 'utf8').replace(/\bexport\s+(default\s+)?/g, '');

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(parserCode, sandbox);

const { parseHAT, serializeHAT } = sandbox;
if (typeof parseHAT !== 'function')   { console.error('parseHAT not found'); process.exit(1); }
if (typeof serializeHAT !== 'function') { console.error('serializeHAT not found'); process.exit(1); }

// ── Tiny test harness ─────────────────────────────────────────────────────

let pass = 0, fail = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    pass++;
    process.stdout.write('.');
  } catch (e) {
    fail++;
    failures.push({ name, msg: e.message });
    process.stdout.write('F');
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg ?? 'assertion failed');
}

function eq(a, b, msg) {
  const sa = JSON.stringify(a), sb = JSON.stringify(b);
  if (sa !== sb) throw new Error((msg ? msg + ': ' : '') + `expected ${sb}, got ${sa}`);
}

// ── Version detection ─────────────────────────────────────────────────────

test('v1.3.4 directive form', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  assert(r.version134, 'should be v1.3.4');
});

test('v1.3.4 bare line form', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  assert(r.version134);
});

test('legacy (no version header) → version134=false', () => {
  const r = parseHAT('R: || D | - ||\nL: || - | K ||');
  assert(r.ok, r.error);
  assert(!r.version134, 'should be legacy');
});

test('v1.3.3 → version134=false', () => {
  const r = parseHAT(';;HAT v1.3.3\nR: || D | - ||\nL: || - | K ||');
  assert(r.ok, r.error);
  assert(!r.version134, 'v1.3.3 should use legacy parser');
});

test('future version v2.0 → version134=true (forward compat)', () => {
  const r = parseHAT(';;HAT v2.0\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  assert(r.version134);
});

// ── v1.3.4 bar / beat / sub structure ────────────────────────────────────

test('v1.3.4: single bar, two beats', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - || T - |||\nL: ||| - K || - K |||');
  assert(r.ok, r.error);
  eq(r.sections.length, 1);
  eq(r.sections[0].bars.length, 1);
  const bar = r.sections[0].bars[0];
  eq(bar.cols.length, 4);
  // first col = beat 1, col 0 — NOT beatStart
  eq(bar.cols[0].beatStart, false, 'col 0 beatStart');
  // col 2 = start of beat 2 → beatStart=true
  eq(bar.cols[2].beatStart, true, 'col 2 beatStart');
});

test('v1.3.4: two bars', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - ||| T - |||\nL: ||| - K ||| - K |||');
  assert(r.ok, r.error);
  eq(r.sections[0].bars.length, 2);
});

test('v1.3.4: sub-groups set sub=true on second subgroup start', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - | T - |||\nL: ||| - K | - K |||');
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols.length, 4);
  eq(cols[0].sub, false, 'col 0 sub');
  eq(cols[2].sub, true,  'col 2 sub (second sub-group)');
});

test('v1.3.4: R/L bar count mismatch → error', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - ||| T - |||\nL: ||| - K |||');
  assert(!r.ok);
  assert(r.error.includes('mismatch'), r.error);
});

test('v1.3.4: R/L token count mismatch within beat → error', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D - |||\nL: ||| K |||');
  assert(!r.ok);
  assert(r.error.includes('mismatch'), r.error);
});

// ── Legacy parser ─────────────────────────────────────────────────────────

test('legacy: || = bars, | = sub-groups, no beatStart', () => {
  const r = parseHAT(';;title: x\nR: || D | - | T | - ||\nL: || - | K | - | K ||');
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols.length, 4);
  for (const c of cols) eq(c.beatStart, false, 'beatStart always false in legacy');
  eq(cols[0].sub, false);
  eq(cols[1].sub, true);
  eq(cols[2].sub, true);
  eq(cols[3].sub, true);
});

test('legacy: R/L mismatch → error', () => {
  const r = parseHAT('R: || D | - ||\nL: || K ||');
  assert(!r.ok);
});

// ── C: line (count row) ───────────────────────────────────────────────────

test('C: line populates countTok', () => {
  const r = parseHAT(';;HAT v1.3.4\nC: ||| 1 & |||\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols[0].countTok, '1');
  eq(cols[1].countTok, '&');
});

test('C: line accepts e & a and digits', () => {
  const r = parseHAT(';;HAT v1.3.4\nC: ||| 1 e & a |||\nR: ||| D T D T |||\nL: ||| - - - - |||');
  assert(r.ok, r.error);
  const toks = r.sections[0].bars[0].cols.map(c => c.countTok);
  eq(toks, ['1','e','&','a']);
});

test('C: invalid token → error', () => {
  const r = parseHAT(';;HAT v1.3.4\nC: ||| x & |||\nR: ||| D - |||\nL: ||| - K |||');
  assert(!r.ok);
  assert(r.error.includes('count token'), r.error);
});

test('C: col count mismatch → error', () => {
  const r = parseHAT(';;HAT v1.3.4\nC: ||| 1 |||\nR: ||| D - |||\nL: ||| - K |||');
  assert(!r.ok);
  assert(r.error.includes('mismatch'), r.error);
});

// ── Note numbers ──────────────────────────────────────────────────────────

test('note numbers resolve correctly', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;notes: D4 F#4\n;;note-numbers: 1 2\nR: ||| 1 2 |||\nL: ||| - - |||');
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols[0].R.hit, 'D4');
  eq(cols[1].R.hit, 'F#4');
});

test('unknown note number → error', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;notes: D4\n;;note-numbers: 1\nR: ||| 9 - |||\nL: ||| - - |||');
  assert(!r.ok);
  assert(r.error.includes('unknown'), r.error);
});

test('numeric token without note map → error', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| 1 - |||\nL: ||| - - |||');
  assert(!r.ok);
});

test('notes without note-numbers → implicit sequential map via _noteNames', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;notes: D4 F#4 A4\nR: ||| D - |||\nL: ||| - - |||');
  assert(r.ok, r.error);
  assert(Array.isArray(r.meta._noteNames), 'should set _noteNames');
  eq(r.meta._noteNames, ['D4','F#4','A4']);
});

test('notes + note-numbers count mismatch → error', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;notes: D4 F#4\n;;note-numbers: 1 2 3\nR: ||| D - |||\nL: ||| - - |||');
  assert(!r.ok);
});

// ── Directives / metadata ─────────────────────────────────────────────────

test('title directive stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;title: Maqsoum\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta.title, 'Maqsoum');
});

test('unknown directive silently stored', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-author: Me\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-author'], 'Me');
});

test('multiple sections', () => {
  const src = ';;HAT v1.3.4\n;;section: A\nR: ||| D - |||\nL: ||| - K |||\n\n;;section: B\nR: ||| T - |||\nL: ||| - • |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  eq(r.sections.length, 2);
  eq(r.sections[0].label, 'A');
  eq(r.sections[1].label, 'B');
});

test('// comment lines ignored', () => {
  const r = parseHAT(';;HAT v1.3.4\n// this is a comment\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
});

// ── Flam modifier ─────────────────────────────────────────────────────────

test('trailing * modifier', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| D* - |||\nL: ||| -  - |||');
  assert(r.ok, r.error);
  eq(r.sections[0].bars[0].cols[0].R.mod, '*');
  eq(r.sections[0].bars[0].cols[1].R.mod, null);
});

test('leading * modifier', () => {
  const r = parseHAT(';;HAT v1.3.4\nR: ||| *D - |||\nL: ||| -  - |||');
  assert(r.ok, r.error);
  eq(r.sections[0].bars[0].cols[0].R.mod, '*');
});

// ── All hit symbols ───────────────────────────────────────────────────────

test('all hit symbols parse without error', () => {
  const syms = ['D','T','K','S','d','t','k','s','•','-'];
  for (const s of syms) {
    const r = parseHAT(`;;HAT v1.3.4\nR: ||| ${s} - |||\nL: ||| - ${s} |||`);
    assert(r.ok, `symbol '${s}' failed: ${r.error}`);
    eq(r.sections[0].bars[0].cols[0].R.hit, s, `hit for symbol '${s}'`);
  }
});

// ── Serializer roundtrip ──────────────────────────────────────────────────

test('serializer roundtrip preserves bar/col count', () => {
  const src = ';;HAT v1.3.4\n;;title: x\n\nR: ||| D - ||| T - |||\nL: ||| - K ||| - K |||';
  const r1 = parseHAT(src);
  assert(r1.ok, r1.error);
  const out = serializeHAT(r1.meta, r1.sections);
  const r2 = parseHAT(out);
  assert(r2.ok, r2.error);
  eq(r2.sections[0].bars.length, 2);
  eq(r2.sections[0].bars[0].cols.length, 2);
  eq(r2.sections[0].bars[1].cols.length, 2);
});

test('serializer roundtrip preserves hit values', () => {
  const src = ';;HAT v1.3.4\n\nR: ||| D - || T - |||\nL: ||| - K || - • |||';
  const r1 = parseHAT(src);
  assert(r1.ok, r1.error);
  const out = serializeHAT(r1.meta, r1.sections);
  const r2 = parseHAT(out);
  assert(r2.ok, r2.error);
  const cols = r2.sections[0].bars[0].cols;
  eq(cols[0].R.hit, 'D'); eq(cols[0].L.hit, '-');
  eq(cols[1].R.hit, '-'); eq(cols[1].L.hit, 'K');
  eq(cols[2].R.hit, 'T'); eq(cols[2].L.hit, '-');
  eq(cols[3].R.hit, '-'); eq(cols[3].L.hit, '•');
});

test('serializer roundtrip preserves beatStart', () => {
  const src = ';;HAT v1.3.4\n\nR: ||| D - || T - |||\nL: ||| - K || - K |||';
  const r1 = parseHAT(src);
  assert(r1.ok, r1.error);
  const out = serializeHAT(r1.meta, r1.sections);
  const r2 = parseHAT(out);
  assert(r2.ok, r2.error);
  const cols = r2.sections[0].bars[0].cols;
  eq(cols[0].beatStart, false);
  eq(cols[2].beatStart, true);
});

test('serializer roundtrip preserves countTok', () => {
  const src = ';;HAT v1.3.4\n\nC: ||| 1 & |||\nR: ||| D - |||\nL: ||| - K |||';
  const r1 = parseHAT(src);
  assert(r1.ok, r1.error);
  const out = serializeHAT(r1.meta, r1.sections);
  const r2 = parseHAT(out);
  assert(r2.ok, r2.error);
  eq(r2.sections[0].bars[0].cols[0].countTok, '1');
  eq(r2.sections[0].bars[0].cols[1].countTok, '&');
});

test('serializer omits C: when not all cols have countTok', () => {
  const src = ';;HAT v1.3.4\n\nR: ||| D - |||\nL: ||| - K |||';
  const r1 = parseHAT(src);
  assert(r1.ok, r1.error);
  const out = serializeHAT(r1.meta, r1.sections);
  assert(!out.includes('\nC:'), 'C: should not be emitted when countToks missing');
});

test('serializer always emits ;;HAT v1.3.4 header', () => {
  const src = ';;HAT v1.3.4\nR: ||| D - |||\nL: ||| - K |||';
  const r = parseHAT(src);
  const out = serializeHAT(r.meta, r.sections);
  assert(out.startsWith(';;HAT v1.3.4'), 'must start with ;;HAT v1.3.4');
});

// ── Spec reference patterns ───────────────────────────────────────────────

test('spec Maqsoum parse', () => {
  const src = ';;HAT v1.3.4\n;;title: Maqsoum\n;;time: 4/4\n;;grid: 8th\n\nC: ||| 1   &   || 2   &   || 3   &   || 4   &   |||\nR: ||| D   -   || •   -   || D   -   || T   -   |||\nL: ||| -   K   || -   K   || -   •   || -   •   |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  eq(r.sections[0].bars[0].cols.length, 8);
  eq(r.sections[0].bars[0].cols[0].R.hit, 'D');
  eq(r.sections[0].bars[0].cols[2].beatStart, true);
});

test('spec Maqsoum roundtrip', () => {
  const src = ';;HAT v1.3.4\n;;title: Maqsoum\n;;time: 4/4\n;;grid: 8th\n\nC: ||| 1   &   || 2   &   || 3   &   || 4   &   |||\nR: ||| D   -   || •   -   || D   -   || T   -   |||\nL: ||| -   K   || -   K   || -   •   || -   •   |||';
  const r1 = parseHAT(src);
  const out = serializeHAT(r1.meta, r1.sections);
  const r2 = parseHAT(out);
  assert(r2.ok, r2.error);
  eq(r2.sections[0].bars[0].cols.length, 8);
  eq(r2.meta.title, 'Maqsoum');
});

test('spec Bulería parse', () => {
  const src = ';;HAT v1.3.4\n;;title: Bulería\n;;time: 12/8\n;;grid: 8th\n;;subdivision: 3+3+2+2+2\n\nC: ||| 1   e   &   || 2   e   &   || 3   &   || 4   &   || 5   &   |||\nR: ||| D   -   •   || T   -   •   || D   -   || T   -   || D   -   |||\nL: ||| -   •   -   || -   •   -   || -   •   || -   •   || -   •   |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  eq(r.sections[0].bars[0].cols.length, 12);
  eq(r.meta.subdivision, '3+3+2+2+2');
});

// ── Subdivision sync (;;subdivision: ↔ || separators) ────────────────────

test(';;subdivision: sets beatStart from groups', () => {
  // 6 cols, subdivision 2+3+1 → beats at cols 0, 2, 5
  const src = ';;HAT v1.3.4\n;;subdivision: 2+3+1\n\nR: ||| D - D T K D |||\nL: ||| - - - - - - |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols.length, 6);
  eq(cols[0].beatStart, false, 'col 0: first beat, not beatStart');
  eq(cols[1].beatStart, false, 'col 1');
  eq(cols[2].beatStart, true,  'col 2: start of beat 2');
  eq(cols[3].beatStart, false, 'col 3');
  eq(cols[4].beatStart, false, 'col 4');
  eq(cols[5].beatStart, true,  'col 5: start of beat 3');
});

test(';;subdivision: overrides || placement from tablature', () => {
  // Tablature has || at col 3, but subdivision 2+4 says beats at col 0 and 2
  const src = ';;HAT v1.3.4\n;;subdivision: 2+4\n\nR: ||| D - || D T K D |||\nL: ||| - - || - - - - |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  const cols = r.sections[0].bars[0].cols;
  eq(cols.length, 6);
  eq(cols[2].beatStart, true,  'col 2: beat from subdivision (overrides tablature ||)');
  eq(cols[3].beatStart, false, 'col 3: not a beat according to subdivision');
});

test(';;subdivision: auto-generates count tokens when no C: line', () => {
  const src = ';;HAT v1.3.4\n;;subdivision: 3+2+1\n\nR: ||| D T K D T D |||\nL: ||| - - - - - - |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  const toks = r.sections[0].bars[0].cols.map(c => c.countTok);
  // Beat 1 (3 cols): 1, e, &  — Beat 2 (2 cols): 2, &  — Beat 3 (1 col): 3
  eq(toks, ['1','e','&','2','&','3']);
});

test(';;subdivision: does NOT overwrite existing count tokens from C: line', () => {
  // C: line explicitly sets tokens 3, &, 7, a — different from what applySubdivision
  // would generate (1, &, 2, &). The explicit C: should win.
  const src = ';;HAT v1.3.4\n;;subdivision: 2+2\n\nC: ||| 3 & || 7 a |||\nR: ||| D - || T - |||\nL: ||| - K || - K |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  const toks = r.sections[0].bars[0].cols.map(c => c.countTok);
  eq(toks, ['3','&','7','a']);
});

test('serializer pads count tokens to 3 chars (aligns with cells)', () => {
  const src = ';;HAT v1.3.4\n;;subdivision: 2+2\n\nR: ||| D - || T - |||\nL: ||| - K || - K |||';
  const r = parseHAT(src);
  assert(r.ok, r.error);
  const out = serializeHAT(r.meta, r.sections);
  // C: line should have 3-char padded tokens: '1  ', '&  ', '2  ', '&  '
  assert(out.includes('C:'), 'should emit C: line');
  const cLine = out.split('\n').find(l => l.startsWith('C:'));
  const rLine = out.split('\n').find(l => l.startsWith('R:'));
  assert(cLine && rLine, 'both C: and R: must be present');
  // Token positions should align: find index of first 'D' in R and first count token in C
  eq(cLine.length, rLine.length, 'C: and R: lines must have equal length');
});

// ── Extension metadata preserved ──────────────────────────────────────────

test('x-author stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-author: Alice\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-author'], 'Alice');
});

test('x-color-scheme stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-color-scheme: dark\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-color-scheme'], 'dark');
});

test('x-source stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-source: https://example.com/vid\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-source'], 'https://example.com/vid');
});

test('x-chord-n stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-chord-1: D4 F#4 A4\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-chord-1'], 'D4 F#4 A4');
});

test('x-note-json stored in meta', () => {
  const r = parseHAT(';;HAT v1.3.4\n;;x-note-json: ./notes.json\nR: ||| D - |||\nL: ||| - K |||');
  assert(r.ok, r.error);
  eq(r.meta['x-note-json'], './notes.json');
});

// ── Fixture files ─────────────────────────────────────────────────────────

const fixDir = path.resolve(__dirname, 'parsing');

function loadFixtures(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.hat.txt'))
           .map(f => ({ name: f, src: fs.readFileSync(path.join(dir, f), 'utf8') }));
}

for (const f of loadFixtures(path.join(fixDir, 'valid'))) {
  test(`fixture valid/${f.name}`, () => {
    const r = parseHAT(f.src);
    assert(r.ok, `Expected ok, got error: ${r.error}`);
  });
}

for (const f of loadFixtures(path.join(fixDir, 'invalid'))) {
  test(`fixture invalid/${f.name}`, () => {
    const r = parseHAT(f.src);
    assert(!r.ok, `Expected parse failure for ${f.name}`);
  });
}

// ── Results ───────────────────────────────────────────────────────────────

console.log('\n');
if (failures.length) {
  console.log('FAILURES:');
  for (const f of failures) console.log(`  ✗ ${f.name}\n    ${f.msg}`);
  console.log();
}
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
