#!/usr/bin/env node
/**
 * hat-lint.mjs — validate and optionally upgrade rhythm .hat.txt files.
 *
 * Uses parseHAT + serializeHAT extracted directly from src/editor.html so
 * the validation logic is always in sync with the live parser.
 *
 * Usage:
 *   node scripts/hat-lint.mjs           # report only
 *   node scripts/hat-lint.mjs --fix     # rewrite files to HAT v1.3.4 format
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const fix  = process.argv.includes('--fix');

// ── Extract parser + serializer from src/editor.html ──────────────────────────
const editorSrc = readFileSync(join(ROOT, 'src/editor.html'), 'utf8');

const scriptStart = editorSrc.indexOf('<script>') + '<script>'.length;
const scriptEnd   = editorSrc.lastIndexOf('</script>');
if (scriptStart < 8 || scriptEnd < 0) {
  console.error('ERROR: cannot locate <script> block in editor.html'); process.exit(1);
}
const scriptContent = editorSrc.slice(scriptStart, scriptEnd);

// Slice out only the parser + serializer section (no browser APIs in this range)
const parserStart = scriptContent.indexOf('\nfunction parseHAT(');
const parserEnd   = scriptContent.indexOf('\n//  BUILT-IN PATTERNS');
if (parserStart < 0 || parserEnd < 0) {
  console.error('ERROR: cannot locate parser boundaries in editor.html'); process.exit(1);
}
const parserBlock = scriptContent.slice(parserStart, parserEnd);

// Instantiate in Node.js — all functions are declarations, so hoisting works.
let parseHAT, serializeHAT;
try {
  ({ parseHAT, serializeHAT } =
    new Function(`${parserBlock}\nreturn { parseHAT, serializeHAT };`)());
} catch (e) {
  console.error('ERROR: parser extraction failed —', e.message); process.exit(1);
}

// ── Run over every rhythm file listed in rhythms/index.json ───────────────────
const index = JSON.parse(readFileSync(join(ROOT, 'rhythms/index.json'), 'utf8'));

let nOk = 0, nLegacy = 0, nError = 0, nFixed = 0;

for (const entry of index) {
  const filePath = join(ROOT, 'rhythms', entry.file);
  let src;
  try { src = readFileSync(filePath, 'utf8'); }
  catch { console.log(`  ✗ MISSING   ${entry.file}`); nError++; continue; }

  const result = parseHAT(src);

  if (!result.ok) {
    console.log(`  ✗ ERROR     ${entry.file}`);
    console.log(`              ${result.error}`);
    nError++;
    continue;
  }

  if (!result.version134) {
    if (fix) {
      const upgraded = serializeHAT(result.meta, result.sections) + '\n';
      writeFileSync(filePath, upgraded, 'utf8');
      console.log(`  ↑ UPGRADED  ${entry.file}`);
      nFixed++;
    } else {
      console.log(`  ↑ LEGACY    ${entry.file}  (no ;;HAT v1.3.4 header)`);
      nLegacy++;
    }
  } else {
    console.log(`  ✓ OK        ${entry.file}`);
    nOk++;
  }
}

console.log('');
console.log(`Results: ${nOk} OK, ${nLegacy} legacy, ${nError} errors` +
  (fix ? `, ${nFixed} upgraded` : ''));
if (nLegacy > 0 && !fix) console.log('Run with --fix to upgrade legacy files to HAT v1.3.4.');
