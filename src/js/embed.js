// SPDX-License-Identifier: AGPL-3.0-or-later
// Embed postMessage bridge — all inbound/outbound iframe communication.

import { state } from './state.js';
import { applySettings } from './config.js';
import { PATTERNS } from './parser.js';
import { StorageStore, ListStore, genId, _listUndoStack } from './storage.js';
import {
  activeList, setActiveList,
  _customPatId,
  _customPatterns, setCustomPatterns,
  activePatIdx,
} from './state.js';

export const EMBED_MODE = (window.parent !== window) ||
  (new URLSearchParams(location.search).get('embed') === '1');

export function _postToHost(msg) {
  if (!EMBED_MODE) return;
  window.parent.postMessage({ version: 1, ...msg }, '*');
}

// Late-bound refs (set by main.js)
export const _editorRef = {};
export function setEditorRef(ref) { Object.assign(_editorRef, ref); }

export const _sidebarRef = {};
export function setSidebarRef(ref) { Object.assign(_sidebarRef, ref); }

// Audio ref: { setMasterVolume, setNoteSustain, updateVolSettings, updateSustainSettings }
// updateVol*/updateSustain* are closures defined in main.js that also sync _appSettings + DOM.
export const _audioRef = {};
export function setAudioRef(ref) { Object.assign(_audioRef, ref); }

// Called by main.js to receive a copy of display settings whenever hat:set-theme is applied.
// Lets main.js keep _appSettings.display in sync with the actual host-provided theme.
let _onThemeApplied = null;
export function setOnThemeApplied(fn) { _onThemeApplied = fn; }

// ─────────────────────────────────────────────
//  OUTBOUND: hat:pattern-changed (debounced)
// ─────────────────────────────────────────────

let _patChangedTimer = null;
export function _emitPatternChanged() {
  if (!EMBED_MODE) return;
  clearTimeout(_patChangedTimer);
  _patChangedTimer = setTimeout(() => {
    const id = _customPatId || (activePatIdx >= 0 ? PATTERNS[activePatIdx]?.name || String(activePatIdx) : 'unknown');
    const title = state.parsed?.meta?.title || 'Untitled';
    _postToHost({ type: 'hat:pattern-changed', id, title, hat: state.hatText || '' });
  }, 250);
}

// ─────────────────────────────────────────────
//  INBOUND HANDLERS
// ─────────────────────────────────────────────

// Session-default notes (set by hat:set-notes, applied to new patterns)
let _defaultNotes = null;
let _defaultNoteNumbers = null;

// Injected library pattern IDs (dedup guard)
const _injectedIds = new Set();

function _handleSetNotes(msg) {
  if (!state.parsed?.ok) return;
  const { syncSourceFromModel, renderGrid } = _editorRef;
  const notes = Array.isArray(msg.notes) ? msg.notes : [];
  const nums  = Array.isArray(msg.noteNumbers) ? msg.noteNumbers : notes.map((_, i) => i + 1);
  _defaultNotes = notes;
  _defaultNoteNumbers = nums;
  state.parsed.meta.notes           = notes.join(' ');
  state.parsed.meta['note-numbers'] = nums.join(' ');
  state.parsed.meta._noteNames = notes.slice();
  const nm = {};
  nums.forEach((n, i) => { if (notes[i]) nm[String(n)] = notes[i]; });
  state.parsed.meta._noteMap = nm;
  if (syncSourceFromModel) syncSourceFromModel();
  if (renderGrid) renderGrid(state.parsed);
}

function _handleLoadPattern(msg) {
  if (typeof msg.hat !== 'string') return;
  const { loadHAT } = _editorRef;
  const { buildSidebar } = _sidebarRef;
  if (msg.id) {
    const idx = PATTERNS.findIndex(p => p.id === msg.id);
    if (idx >= 0) { PATTERNS[idx] = { ...PATTERNS[idx], hat: msg.hat, id: msg.id }; }
    else { PATTERNS.push({ name: msg.id, hat: msg.hat, id: msg.id, cat: 'imported' }); }
    if (buildSidebar) buildSidebar();
  }
  if (loadHAT) loadHAT(msg.hat);
}

function _handleLoadLibrary(msg) {
  if (!Array.isArray(msg.patterns)) return;
  const { buildSidebar } = _sidebarRef;
  const merge = msg.merge !== false;
  if (!merge) {
    for (let i = PATTERNS.length - 1; i >= 0; i--) {
      if (_injectedIds.has(PATTERNS[i].id)) PATTERNS.splice(i, 1);
    }
    _injectedIds.clear();
  }
  let added = 0;
  for (const p of msg.patterns) {
    if (!p.id || !p.hat) continue;
    if (merge && _injectedIds.has(p.id)) continue;
    PATTERNS.push({ name: p.id, hat: p.hat, cat: p.category || 'library', id: p.id });
    _injectedIds.add(p.id);
    added++;
  }
  if (added > 0 && buildSidebar) buildSidebar();
}

export function importHatList(data) {
  const { loadHAT, parseHAT } = _editorRef;
  const { buildSidebar, showToast } = _sidebarRef;
  const ids = [];
  for (const p of data.patterns) {
    if (!p.hat) continue;
    const parsed = parseHAT ? parseHAT(p.hat) : { ok: false, meta: {} };
    const meta = parsed.ok ? parsed.meta : {};
    const id = genId();
    StorageStore.save(id, p.hat, {
      title: p.name || meta.title || 'Untitled',
      time:  p.time || meta.time  || '',
      grid:  p.grid || meta.grid  || ''
    });
    ids.push(id);
  }
  setCustomPatterns(StorageStore.list());

  if (data.type === 'hat-list' && data.name && ids.length) {
    _listUndoStack.push(localStorage.getItem(ListStore.KEY) || '[]');
    const listId = genId();
    const lists = ListStore.getAll();
    lists.push({ id: listId, name: data.name, items: ids.map(id => ({ type: 'custom', ref: id })) });
    ListStore._save(lists);
    setActiveList(listId);
  }

  if (buildSidebar) buildSidebar();
  const count = ids.length;
  const msg2 = `Imported ${count} pattern${count !== 1 ? 's' : ''}${data.name ? ` into "${data.name}"` : ''}`;
  if (showToast) showToast(msg2);
}

// ─────────────────────────────────────────────
//  MESSAGE DISPATCHER
// ─────────────────────────────────────────────

export function initEmbedListener() {
  if (!EMBED_MODE) return;
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    const msg = event.data;
    if (!msg || typeof msg.type !== 'string') return;
    switch (msg.type) {
      case 'hat:set-notes':    _handleSetNotes(msg); break;
      case 'hat:load-pattern': _handleLoadPattern(msg); break;
      case 'hat:load-library': _handleLoadLibrary(msg); break;
      case 'hat:set-theme': {
        if (!msg.vars || typeof msg.vars !== 'object') { console.debug('hat:set-theme: no vars provided', msg); break; }
        // Convert CSS var names (--bg → bg) into the display config shape. Not saved (ephemeral).
        const colors = {}, display = {};
        for (const [k, v] of Object.entries(msg.vars)) {
          if (typeof v !== 'string') continue;
          const key = k.startsWith('--') ? k.slice(2) : k;
          if (key === 'font-ui') display.font = v;
          else colors[key] = v;
        }
        if (Object.keys(colors).length) display.colors = colors;
        if (Object.keys(display).length) {
          applySettings({ display });
          if (_onThemeApplied) _onThemeApplied(display);
        }
        break;
      }
      case 'hat:set-volume': {
        const vol = Math.max(0, Math.min(1, +msg.masterVolume || 0));
        const { setMasterVolume, updateVolSettings } = _audioRef;
        if (setMasterVolume) setMasterVolume(vol);
        if (updateVolSettings) updateVolSettings(vol);
        break;
      }
      case 'hat:set-sustain': {
        const sustain = Math.max(0.2, Math.min(8, +msg.sustain || 2.0));
        const { setNoteSustain, updateSustainSettings } = _audioRef;
        if (setNoteSustain) setNoteSustain(sustain);
        if (updateSustainSettings) updateSustainSettings(sustain);
        break;
      }
      case 'hat:ping':
        _postToHost({ type: 'hat:ready', specVersion: '1.3.4' });
        break;
      default:
        console.debug('hat: unknown incoming message type', msg.type);
    }
  });
}
