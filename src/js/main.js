// SPDX-License-Identifier: AGPL-3.0-or-later
// main.js — entry point: wires all modules, registers event listeners, runs init.

import { state, setCustomPatterns, setCustomPatId, setActivePatIdx, _showNoteNums, setShowNoteNums, _selBars, _hovered, _customPatId } from './state.js';
import { parseHAT, PATTERNS } from './parser.js';
import { StorageStore, ListStore, genId } from './storage.js';
import { DEFAULTS, loadSettings, saveSettings, applySettings, validateSettings } from './config.js';

import {
  renderGrid, setStatus, showToast,
  openNotePicker, openChordPicker, openCountEditor, openSectionLabelEditor,
  refreshCellEl,
  setEditorRef as rendererSetEditorRef,
  setGridScrollWidth,
  clearCollapsedSections, remapCollapsedAfterMove, toggleCollapseAll,
  setFlipRL,
} from './renderer.js';

import {
  pushUndo, undo, redo,
  loadHAT, reparse, syncSourceFromModel,
  applyHit, cycleCell, toggleFlam, toggleSubdiv, toggleBeat,
  insertColBefore, insertColAfter, deleteCol, deleteSelectedBars,
  addColToBar, removeLastColFromBar,
  selectBar, selectCol,
  cloneBar,
  copySelected, pasteSelected,
  commitTypeBuf, setCountTok,
  setEmbedRef as editorSetEmbedRef,
  setSidebarRef as editorSetSidebarRef,
  setRendererRef as editorSetRendererRef,
} from './editor.js';

import {
  startPlayback, stopPlayback, _playing,
  setEmbedRef as audioSetEmbedRef,
  setMasterVolume, setGhostVolume, setDoumNote,
} from './audio.js';

import {
  buildSidebar, renderPatternList, renderListPills,
  loadPattern, loadCustomPattern,
  setEditorRef as sidebarSetEditorRef,
  initSidebarUI,
} from './sidebar.js';

import {
  EMBED_MODE, _postToHost, _emitPatternChanged, initEmbedListener, importHatList,
  setEditorRef as embedSetEditorRef,
  setSidebarRef as embedSetSidebarRef,
  setOnThemeApplied,
} from './embed.js';

import {
  initGridEvents, initKeyboard,
  setEditorRef as shortcutsSetEditorRef,
  setAudioRef as shortcutsSetAudioRef,
  setRendererRef as shortcutsSetRendererRef,
} from './shortcuts.js';

import { _listUndoStack } from './storage.js';

// ─────────────────────────────────────────────
//  WIRE CROSS-MODULE LATE-BOUND REFS
// ─────────────────────────────────────────────

function deleteSection(si) {
  if (!state.parsed?.ok) return;
  pushUndo();
  state.parsed.sections.splice(si, 1);
  if (!state.parsed.sections.length) {
    const empty=()=>({R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
    state.parsed.sections=[{label:'',bars:[{cols:[empty()]}]}];
  }
  clearCollapsedSections();
  syncSourceFromModel(); renderGrid(state.parsed);
}

function moveBar(fromSi, fromBi, toSi, toBi) {
  if (!state.parsed?.ok) return;
  let actualTo = toBi;
  if (fromSi === toSi) {
    if (actualTo === fromBi || actualTo === fromBi+1) return;
    if (actualTo > fromBi) actualTo--;
  }
  pushUndo();
  const [bar] = state.parsed.sections[fromSi].bars.splice(fromBi, 1);
  state.parsed.sections[toSi].bars.splice(actualTo, 0, bar);
  state.parsed.sections = state.parsed.sections.filter(s => s.bars.length > 0);
  if (!state.parsed.sections.length) {
    const empty=()=>({R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
    state.parsed.sections=[{label:'',bars:[{cols:[empty()]}]}];
  }
  syncSourceFromModel(); renderGrid(state.parsed);
}

function moveSection(fromSi, toSi) {
  if (!state.parsed?.ok) return;
  if (fromSi === toSi || fromSi+1 === toSi) return;
  pushUndo();
  const [sec] = state.parsed.sections.splice(fromSi, 1);
  const actualTo = toSi > fromSi ? toSi-1 : toSi;
  state.parsed.sections.splice(actualTo, 0, sec);
  remapCollapsedAfterMove(fromSi, actualTo);
  syncSourceFromModel(); renderGrid(state.parsed);
}

function addBarToCurrentSection() {
  if (!state.parsed?.ok) return;
  let si = state.parsed.sections.length - 1;
  if (_selBars.size > 0) { si = +[..._selBars][0].split('-')[0]; }
  else if (_hovered) { si = _hovered.sec; }
  pushUndo();
  const empty = () => ({R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
  state.parsed.sections[si].bars.push({cols:[empty()]});
  syncSourceFromModel(); renderGrid(state.parsed);
}

rendererSetEditorRef({
  pushUndo, syncSourceFromModel,
  selectBar, selectCol,
  addColToBar, removeLastColFromBar,
  toggleBeat, toggleSubdiv,
  openCountEditor, openSectionLabelEditor,
  deleteSection, moveBar, moveSection,
});

// ─────────────────────────────────────────────
//  PATTERN DELETE + UNDO/REDO
// ─────────────────────────────────────────────

const _patDeleteUndoStack = [];
const _patDeleteRedoStack = [];

function deleteActiveCustomPattern() {
  if (!_customPatId) return;
  const cp = StorageStore.load(_customPatId);
  if (!cp) return;
  _patDeleteUndoStack.push({ id: _customPatId, hat: cp.hat, title: cp.title, time: cp.time||'', grid: cp.grid||'' });
  _patDeleteRedoStack.length = 0;
  StorageStore.remove(_customPatId);
  setCustomPatterns(StorageStore.list());
  setCustomPatId(null); StorageStore.setActive(null); setActivePatIdx(-1);
  renderPatternList();
  const customs = StorageStore.list();
  if (customs.length > 0) loadCustomPattern(customs[0].id);
  else if (PATTERNS.length > 0) loadPattern(0);
  showToast('Pattern deleted — Ctrl+Z to restore');
}

function checkPatDeleteUndo() {
  if (!_patDeleteUndoStack.length) return false;
  const entry = _patDeleteUndoStack.pop();
  StorageStore.save(entry.id, entry.hat, { title: entry.title, time: entry.time, grid: entry.grid });
  setCustomPatterns(StorageStore.list());
  _patDeleteRedoStack.push(entry);
  setActivePatIdx(-1); setCustomPatId(entry.id); StorageStore.setActive(entry.id);
  loadHAT(entry.hat);
  renderPatternList();
  showToast('Pattern restored');
  return true;
}

function checkPatDeleteRedo() {
  if (!_patDeleteRedoStack.length) return;
  const entry = _patDeleteRedoStack.pop();
  _patDeleteUndoStack.push(entry);
  StorageStore.remove(entry.id);
  setCustomPatterns(StorageStore.list());
  if (_customPatId === entry.id) { setCustomPatId(null); StorageStore.setActive(null); setActivePatIdx(-1); }
  renderPatternList();
  const customs = StorageStore.list();
  if (customs.length > 0) loadCustomPattern(customs[0].id);
  else if (PATTERNS.length > 0) loadPattern(0);
  showToast('Pattern re-deleted — Ctrl+Z to restore');
}

editorSetEmbedRef({ _emitPatternChanged, _postToHost });
editorSetSidebarRef({ _listUndoStack, ListStore, renderListPills, renderPatternList, checkPatDeleteUndo, checkPatDeleteRedo });
editorSetRendererRef({ refreshCellEl, showToast });

audioSetEmbedRef({ _postToHost });

sidebarSetEditorRef({ loadHAT });

embedSetEditorRef({ loadHAT, syncSourceFromModel, renderGrid, parseHAT });
embedSetSidebarRef({ buildSidebar, showToast });

function addSection() {
  if (!state.parsed?.ok) return;
  const label = window.prompt('Section name:', '');
  if (label === null) return;
  pushUndo();
  const empty = () => ({ R: { hit: '-', mod: null }, L: { hit: '-', mod: null }, beatStart: false, sub: false, countTok: null });
  let splitSec = -1, splitBar = -1;
  if (_selBars.size > 0) {
    const key = [..._selBars].sort()[0]; [splitSec, splitBar] = key.split('-').map(Number);
  } else if (_hovered) { splitSec = _hovered.sec; splitBar = _hovered.bar; }
  if (splitSec >= 0) {
    const sec = state.parsed.sections[splitSec];
    const newBars = sec.bars.splice(splitBar);
    state.parsed.sections.splice(splitSec + 1, 0, { label: label.trim(), bars: newBars.length ? newBars : [{ cols: [empty()] }] });
    if (sec.bars.length === 0) state.parsed.sections.splice(splitSec, 1);
    if (!state.parsed.sections.length) state.parsed.sections = [{ label: '', bars: [{ cols: [empty()] }] }];
  } else {
    state.parsed.sections.push({ label: label.trim(), bars: [{ cols: [empty()] }] });
  }
  syncSourceFromModel(); renderGrid(state.parsed);
}

shortcutsSetEditorRef({
  pushUndo, undo, redo, addSection,
  applyHit, cycleCell, toggleFlam, toggleSubdiv, toggleBeat,
  insertColBefore, insertColAfter, deleteCol, deleteSelectedBars,
  copySelected, pasteSelected, commitTypeBuf,
  setCountTok, deleteActiveCustomPattern,
});
shortcutsSetAudioRef({
  get _playing() { return _playing; },
  startPlayback, stopPlayback,
});
shortcutsSetRendererRef({ openNotePicker, openChordPicker, renderPatternList });

// ─────────────────────────────────────────────
//  GRID + KEYBOARD
// ─────────────────────────────────────────────

initGridEvents(EMBED_MODE);
initKeyboard();

// ─────────────────────────────────────────────
//  TOOLBAR BUTTONS
// ─────────────────────────────────────────────

document.getElementById('play-btn').onclick = () => _playing ? stopPlayback() : startPlayback();

const bpmRange = document.getElementById('bpm');
const bpmNum = document.getElementById('bpm-num');
bpmRange.oninput = () => { bpmNum.value = bpmRange.value; };
bpmNum.oninput = () => {
  const v = +bpmNum.value;
  if (!isNaN(v) && v >= 40 && v <= 240) bpmRange.value = v;
};
bpmNum.addEventListener('blur', () => {
  const v = Math.max(40, Math.min(240, +bpmNum.value || 120));
  bpmRange.value = v; bpmNum.value = v;
});
bpmNum.addEventListener('keydown', e => { if (e.key === 'Enter') bpmNum.blur(); });

let _taps = [];
document.getElementById('tap-btn').onclick = () => {
  const now = performance.now();
  _taps = _taps.filter(t => now - t < 4000); _taps.push(now);
  if (_taps.length >= 2) {
    const avg = (_taps[_taps.length - 1] - _taps[0]) / (_taps.length - 1);
    const bpm = Math.round(60000 / avg);
    if (bpm >= 40 && bpm <= 240) { bpmRange.value = bpm; bpmNum.value = bpm; }
  }
};

document.getElementById('btn-shortcuts').onclick = () => {
  document.getElementById('shortcut-panel').classList.toggle('open');
};

document.getElementById('btn-add-bar').onclick = addBarToCurrentSection;
document.getElementById('btn-add-section').onclick = addSection;
document.getElementById('btn-collapse-all').onclick = () => {
  if (state.parsed?.ok) { toggleCollapseAll(); renderGrid(state.parsed); }
};

// Re-render when grid scroll area width changes so row-label layout stays correct
(function initGridResize() {
  const el = document.getElementById('grid-scroll');
  let lastW = 0;
  new ResizeObserver(entries => {
    const w = entries[0].contentBoxSize?.[0]?.inlineSize ?? entries[0].contentRect.width;
    if (Math.abs(w - lastW) > 1) {
      lastW = w; setGridScrollWidth(w);
      if (state.parsed?.ok) renderGrid(state.parsed);
    }
  }).observe(el);
})();

// New pattern modal
document.getElementById('btn-new').onclick = () => {
  document.getElementById('np-title').value = '';
  document.getElementById('np-fields').value = '8';
  document.getElementById('np-bpm').value = '120';
  document.getElementById('new-pat-modal').classList.add('show');
  document.getElementById('np-title').focus();
};
document.getElementById('np-cancel').onclick = () => document.getElementById('new-pat-modal').classList.remove('show');
document.getElementById('np-ok').onclick = () => {
  const title  = document.getElementById('np-title').value.trim() || 'Untitled';
  const bpm    = document.getElementById('np-bpm').value;
  const fields = Math.max(1, Math.min(64, parseInt(document.getElementById('np-fields').value) || 8));
  const t4 = '.   ', r4 = '-   ';
  const cToks = Array(fields).fill(t4).join('');
  const rToks = Array(fields).fill(r4).join('');
  const id  = genId();
  const hat = `;;HAT v1.3.4\n;;title: ${title}\n;;tempo: ${bpm}\n\nC: ||| ${cToks}|||\nR: ||| ${rToks}|||\nL: ||| ${rToks}|||`;
  StorageStore.save(id, hat, { title });
  setCustomPatterns(StorageStore.list());
  setActivePatIdx(-1); setCustomPatId(id); StorageStore.setActive(id);
  loadHAT(hat);
  document.getElementById('new-pat-modal').classList.remove('show');
  renderPatternList();
  showToast(`Created "${title}"`);
};
document.getElementById('new-pat-modal').onclick = e => {
  if (e.target === document.getElementById('new-pat-modal')) document.getElementById('new-pat-modal').classList.remove('show');
};

// Import modal
document.getElementById('btn-import').onclick = () => {
  document.getElementById('overlay').classList.add('show');
  document.getElementById('import-text').value = '';
  document.getElementById('import-text').focus();
};
document.getElementById('import-file-btn').onclick = () => document.getElementById('import-file-input').click();
document.getElementById('import-file-input').onchange = e => {
  const file = e.target.files[0]; if (!file) return;
  const errEl = document.getElementById('import-file-err');
  errEl.style.display = 'none';
  const reader = new FileReader();
  reader.onload = ev => {
    const text = ev.target.result;
    if (file.name.endsWith('.json')) {
      try {
        const data = JSON.parse(text);
        if (data.version === 1 && (data.type === 'hat-list' || data.type === 'hat-custom-patterns') && Array.isArray(data.patterns)) {
          importHatList(data);
          document.getElementById('overlay').classList.remove('show');
          return;
        }
        errEl.textContent = 'Unrecognised JSON format (expected hat-list or hat-custom-patterns v1).';
        errEl.style.display = 'block';
      } catch(ex) {
        errEl.textContent = 'Invalid JSON: ' + ex.message;
        errEl.style.display = 'block';
      }
      return;
    }
    const parsed = parseHAT(text);
    if (!parsed.ok) {
      errEl.textContent = 'Invalid HAT file: ' + parsed.error;
      errEl.style.display = 'block';
    } else {
      document.getElementById('import-text').value = text;
      errEl.style.display = 'none';
    }
  };
  reader.readAsText(file);
  e.target.value = '';
};
document.getElementById('import-cancel').onclick = () => document.getElementById('overlay').classList.remove('show');
document.getElementById('import-ok').onclick = () => {
  const t = document.getElementById('import-text').value.trim();
  if (t) {
    const id = genId();
    const parsed = parseHAT(t);
    const meta = parsed.ok ? parsed.meta : {};
    StorageStore.save(id, t, meta);
    setCustomPatterns(StorageStore.list());
    setActivePatIdx(-1); setCustomPatId(id); StorageStore.setActive(id);
    loadHAT(t);
    renderPatternList();
    showToast('Pattern imported');
  }
  document.getElementById('overlay').classList.remove('show');
};
document.getElementById('overlay').onclick = e => {
  if (e.target === document.getElementById('overlay')) document.getElementById('overlay').classList.remove('show');
};

// Export modal
document.getElementById('btn-export').onclick = () => {
  import('./state.js').then(({ _customPatterns }) => {
    const sel = document.getElementById('export-what');
    sel.innerHTML = '';
    const optCur = document.createElement('option');
    optCur.value = '__current'; optCur.textContent = 'Current pattern (.hat.txt)';
    sel.appendChild(optCur);
    ListStore.getAll().forEach(lst => {
      const o = document.createElement('option');
      o.value = 'list::' + lst.id;
      o.textContent = `List: ${lst.name} (.hatlist.json)`;
      sel.appendChild(o);
    });
    if (_customPatterns.length > 0) {
      const o = document.createElement('option');
      o.value = '__custom'; o.textContent = 'All custom patterns (.hatlist.json)';
      sel.appendChild(o);
    }
    document.getElementById('export-modal').classList.add('show');
  });
};
function downloadBlob(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename; a.click();
}
document.getElementById('export-cancel').onclick = () => document.getElementById('export-modal').classList.remove('show');
document.getElementById('export-modal').onclick = e => {
  if (e.target === document.getElementById('export-modal')) document.getElementById('export-modal').classList.remove('show');
};
document.getElementById('export-ok').onclick = () => {
  import('./state.js').then(({ _customPatterns }) => {
    const val = document.getElementById('export-what').value;
    if (val === '__current') {
      const title = (state.parsed?.meta?.title || 'pattern').replace(/\s+/g, '-').toLowerCase();
      downloadBlob(document.getElementById('source').value, title + '.hat.txt', 'text/plain');
    } else if (val === '__custom') {
      const payload = JSON.stringify({
        version: 1, type: 'hat-custom-patterns',
        patterns: _customPatterns.map(cp => ({ name: cp.title, time: cp.time || '', grid: cp.grid || '', hat: cp.hat }))
      }, null, 2);
      downloadBlob(payload, 'custom-patterns.hatlist.json', 'application/json');
    } else if (val.startsWith('list::')) {
      const listId = val.slice(6);
      const lst = ListStore.getAll().find(l => l.id === listId);
      if (!lst) return;
      const patterns = lst.items.map(item => {
        if (item.type === 'library') {
          const [cat, pname] = item.ref.split('::');
          const p = PATTERNS.find(x => x.cat === cat && x.name === pname);
          return p ? { name: p.name, cat: p.cat, time: p.time, grid: p.grid, hat: p.hat } : null;
        } else {
          const cp = StorageStore.load(item.ref);
          return cp ? { name: cp.title, time: cp.time || '', grid: cp.grid || '', hat: cp.hat } : null;
        }
      }).filter(Boolean);
      const payload = JSON.stringify({ version: 1, type: 'hat-list', name: lst.name, patterns }, null, 2);
      const fname = lst.name.replace(/\s+/g, '-').toLowerCase() + '.hatlist.json';
      downloadBlob(payload, fname, 'application/json');
    }
    document.getElementById('export-modal').classList.remove('show');
  });
};

// Notes panel
document.getElementById('btn-notes').onclick = () => {
  if (!state.parsed?.ok) return;
  const m = state.parsed.meta;
  document.getElementById('notes-input').value = m.notes || m._noteNames?.join(' ') || '';
  document.getElementById('note-numbers-input').value = m['note-numbers'] || '';
  document.getElementById('notes-overlay').classList.add('show');
  document.getElementById('notes-input').focus();
};
document.getElementById('notes-cancel').onclick = () => document.getElementById('notes-overlay').classList.remove('show');
document.getElementById('notes-ok').onclick = () => {
  if (!state.parsed?.ok) return;
  const notes = document.getElementById('notes-input').value.trim();
  const nums  = document.getElementById('note-numbers-input').value.trim();
  pushUndo();
  if (notes) { state.parsed.meta.notes = notes; } else { delete state.parsed.meta.notes; delete state.parsed.meta['note-numbers']; }
  if (nums) state.parsed.meta['note-numbers'] = nums; else delete state.parsed.meta['note-numbers'];
  document.getElementById('notes-overlay').classList.remove('show');
  syncSourceFromModel(); reparse();
};
document.getElementById('notes-overlay').onclick = e => {
  if (e.target === document.getElementById('notes-overlay')) document.getElementById('notes-overlay').classList.remove('show');
};

// Inline title edit on double-click
document.getElementById('card-title').addEventListener('dblclick', () => {
  if (!state.parsed?.ok) return;
  const el = document.getElementById('card-title');
  const orig = el.textContent;
  const inp = document.createElement('input');
  inp.type = 'text'; inp.value = state.parsed.meta.title || '';
  inp.style.cssText = 'font-size:13px;font-weight:700;background:var(--bg3);color:var(--fg);border:1px solid var(--accent);border-radius:3px;padding:1px 4px;width:180px;outline:none;';
  el.replaceWith(inp); inp.focus(); inp.select();
  let committed = false;
  function commit() {
    if (committed) return; committed = true;
    const v = inp.value.trim() || 'Untitled';
    const span = document.createElement('span'); span.id = 'card-title'; span.textContent = v;
    inp.replaceWith(span);
    if (!state.parsed?.ok) return;
    pushUndo(); state.parsed.meta.title = v;
    syncSourceFromModel();
  }
  function cancel() {
    if (committed) return; committed = true;
    const span = document.createElement('span'); span.id = 'card-title'; span.textContent = orig;
    inp.replaceWith(span);
  }
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.stopPropagation(); commit(); }
    if (e.key === 'Escape') { e.stopPropagation(); cancel(); }
  });
  inp.addEventListener('blur', commit);
});

// ─────────────────────────────────────────────
//  SETTINGS SYSTEM
// ─────────────────────────────────────────────

let _appSettings = loadSettings();

// Applies all settings to state modules + CSS vars. Does not trigger renderGrid.
function applyAllSettings(cfg) {
  if (!EMBED_MODE) applySettings(cfg);           // CSS vars + font (skip in embed — host owns theme)
  else if ('srcCollapsed' in cfg) applySettings({ srcCollapsed: cfg.srcCollapsed });
  setFlipRL(cfg.layout?.flipRL || false);
  setMasterVolume(cfg.audio?.masterVolume ?? 1.0);
  setGhostVolume(cfg.audio?.ghostVolume ?? 1.0);
  setDoumNote(cfg.audio?.doumNote || '');
  setShowNoteNums(cfg.general?.noteDisplay === 'numbers');
}

applyAllSettings(_appSettings);

// In embed mode, keep _appSettings.display in sync with host theme so the Settings
// modal (Display tab) and Export show the actual current colors, not dark defaults.
if (EMBED_MODE) {
  setOnThemeApplied((display) => {
    _appSettings = {
      ..._appSettings,
      display: {
        font:   display.font   || _appSettings.display?.font,
        colors: { ...(_appSettings.display?.colors || {}), ...(display.colors || {}) },
      },
    };
  });
  // Add notice in Display tab that colors are managed by the host application
  const displayPane = document.getElementById('settings-pane-display');
  if (displayPane) {
    const notice = document.createElement('p');
    notice.className = 'settings-hint';
    notice.style.cssText = 'margin-bottom:10px;font-style:italic;';
    notice.textContent = 'Colors are provided by the host application. Changes apply for the current session only.';
    displayPane.prepend(notice);
  }
}

// Source panel toggle
document.getElementById('source-toggle').onclick = () => {
  const wrap = document.getElementById('source-wrap');
  _appSettings = { ..._appSettings, srcCollapsed: !wrap.classList.contains('collapsed') };
  applySettings({ srcCollapsed: _appSettings.srcCollapsed });
  saveSettings(_appSettings);
};

// ── Settings modal helpers ──

const COLOR_GROUPS = [
  { label: 'Surfaces',  keys: ['bg', 'bg2', 'bg3', 'bg4'] },
  { label: 'Text',      keys: ['fg', 'fg2', 'fg3', 'accent', 'border'] },
  { label: 'Right hand',keys: ['R', 'Rdim', 'Rbg'] },
  { label: 'Left hand', keys: ['L', 'Ldim', 'Lbg'] },
  { label: 'Hits',      keys: ['hit-D', 'hit-T', 'hit-K', 'hit-S', 'hit-note'] },
  { label: 'Cells',     keys: ['cell-rest-bg', 'cell-D-bg', 'cell-T-bg', 'cell-K-bg', 'cell-S-bg', 'cell-ghost-bg', 'cell-note-bg'] },
  { label: 'Grid',      keys: ['bar-bg', 'bar-border', 'bar-selected-bg', 'sep-beat', 'sep-beat-dim', 'sep-sub', 'sep-sub-dim'] },
  { label: 'Count Row', keys: ['count-tok-fg', 'count-tok-bg'] },
  { label: 'Selection', keys: ['col-sel-cell', 'col-sel-strip'] },
  { label: 'Misc',      keys: ['scrim', 'playing'] },
];

function isValidNote(name) {
  return !name || /^[A-G][b#]?-?\d+$/.test(name);
}

let _prevDoumNote = '';

// ── Custom color picker ──

const COLOR_PALETTE = [
  '#ffffff','#c8e0f8','#a8a8b8','#5a5a6a','#2e2e34',
  '#7dd4ff','#5ab0f0','#3a8fd8','#1a6cb8','#0a4a88',
  '#ffc050','#e0903a','#c06028','#783810','#2e1808',
  '#78e068','#3ab858','#d878f8','#a848d0','#f06060',
];

let _openDrop = null;

// Close any open picker when clicking elsewhere
document.addEventListener('click', () => {
  if (_openDrop) { _openDrop.classList.remove('placed'); _openDrop = null; }
});

function createColorWidget(key, initialVal, onChange) {
  const wrap   = document.createElement('div');   wrap.className = 'cp-wrap';
  const swatch = document.createElement('button'); swatch.type = 'button'; swatch.className = 'cp-swatch';
  swatch.style.background = initialVal; swatch.title = '--' + key;
  const inp = document.createElement('input'); inp.type = 'text'; inp.className = 'cp-inp';
  inp.value = initialVal; inp.spellcheck = false;

  const drop = document.createElement('div'); drop.className = 'cp-drop';
  const grid = document.createElement('div'); grid.className = 'cp-grid';
  for (const hex of COLOR_PALETTE) {
    const dot = document.createElement('button'); dot.type = 'button'; dot.className = 'cp-dot';
    dot.style.background = hex; dot.title = hex;
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      inp.value = hex; swatch.style.background = hex;
      drop.classList.remove('placed'); _openDrop = null;
      onChange(hex);
    });
    grid.appendChild(dot);
  }
  drop.appendChild(grid);
  document.body.appendChild(drop);

  swatch.addEventListener('click', (e) => {
    e.stopPropagation();
    if (drop.classList.contains('placed')) {
      drop.classList.remove('placed'); _openDrop = null;
    } else {
      if (_openDrop) { _openDrop.classList.remove('placed'); }
      _openDrop = drop;
      const r = swatch.getBoundingClientRect();
      drop.style.left = r.left + 'px';
      drop.style.top  = (r.bottom + 4) + 'px';
      drop.classList.add('placed');
    }
  });
  drop.addEventListener('click', (e) => e.stopPropagation());

  inp.addEventListener('change', () => {
    const v = inp.value.trim();
    swatch.style.background = v;
    onChange(v);
  });

  wrap.appendChild(swatch); wrap.appendChild(inp);
  return { wrap, swatch, inp, drop };
}

const _cpDrops = [];

function buildColorTable(cfg) {
  // Remove previously created drop elements from body
  for (const d of _cpDrops) d.remove();
  _cpDrops.length = 0;

  const container = document.getElementById('settings-color-table');
  container.innerHTML = '';
  for (const grp of COLOR_GROUPS) {
    const hdr = document.createElement('div'); hdr.className = 'settings-color-group'; hdr.textContent = grp.label;
    container.appendChild(hdr);
    for (const key of grp.keys) {
      const val = cfg.display?.colors?.[key] ?? DEFAULTS.display.colors[key] ?? '#888888';
      const row = document.createElement('div'); row.className = 'settings-color-row';
      const lbl = document.createElement('span'); lbl.className = 'settings-color-key'; lbl.textContent = '--' + key;
      const widget = createColorWidget(key, val, (newVal) => {
        if (!_appSettings.display?.colors) {
          _appSettings = { ..._appSettings, display: { ..._appSettings.display, colors: { ...DEFAULTS.display.colors } } };
        }
        _appSettings.display.colors[key] = newVal;
        applySettings(_appSettings);
        saveSettings(_appSettings);
      });
      _cpDrops.push(widget.drop);
      row.appendChild(lbl); row.appendChild(widget.wrap);
      container.appendChild(row);
    }
  }
}

function populateSettingsModal(cfg) {
  // General
  const nd = cfg.general?.noteDisplay || 'names';
  document.querySelector(`input[name="noteDisplay"][value="${nd}"]`).checked = true;
  const doumVal = cfg.audio?.doumNote || '';
  document.getElementById('settings-doum-note').value = doumVal;
  document.getElementById('settings-doum-err').textContent = '';
  _prevDoumNote = doumVal;
  // Audio
  const vol = cfg.audio?.masterVolume ?? 1.0;
  document.getElementById('settings-volume').value = vol;
  document.getElementById('settings-volume-val').textContent = Math.round(vol * 100) + '%';
  const gvol = cfg.audio?.ghostVolume ?? 1.0;
  document.getElementById('settings-ghost-volume').value = gvol;
  document.getElementById('settings-ghost-volume-val').textContent = Math.round(gvol * 100) + '%';
  // Layout
  document.getElementById('settings-fliprl').checked = cfg.layout?.flipRL || false;
  // Display
  document.getElementById('settings-font').value = cfg.display?.font || DEFAULTS.display.font;
  buildColorTable(cfg);
}

function openSettingsModal() {
  populateSettingsModal(_appSettings);
  // Show first tab
  document.querySelectorAll('.settings-tab').forEach((t, i) => {
    t.classList.toggle('active', i === 0); t.setAttribute('aria-selected', String(i === 0));
  });
  document.querySelectorAll('.settings-pane').forEach((p, i) => { p.hidden = i !== 0; });
  document.getElementById('settings-modal').classList.add('show');
  document.getElementById('settings-modal').querySelector('.settings-tab').focus();
}

// ── Settings modal events ──

document.getElementById('btn-settings').onclick = openSettingsModal;

document.getElementById('settings-close').onclick = () => document.getElementById('settings-modal').classList.remove('show');
document.getElementById('settings-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('settings-modal')) document.getElementById('settings-modal').classList.remove('show');
});
document.getElementById('settings-modal').addEventListener('keydown', e => {
  if (e.key === 'Escape') document.getElementById('settings-modal').classList.remove('show');
});

// Tabs
document.querySelectorAll('.settings-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.settings-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    document.querySelectorAll('.settings-pane').forEach(p => { p.hidden = true; });
    tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
    document.getElementById('settings-pane-' + tab.dataset.tab).hidden = false;
  });
});

// General: note display
document.querySelectorAll('input[name="noteDisplay"]').forEach(radio => {
  radio.addEventListener('change', () => {
    _appSettings = { ..._appSettings, general: { ..._appSettings.general, noteDisplay: radio.value } };
    setShowNoteNums(radio.value === 'numbers');
    saveSettings(_appSettings);
    if (state.parsed?.ok) renderGrid(state.parsed);
  });
});

// General: doum note
document.getElementById('settings-doum-note').addEventListener('change', () => {
  const inp = document.getElementById('settings-doum-note');
  const errEl = document.getElementById('settings-doum-err');
  const val = inp.value.trim();
  if (!isValidNote(val)) {
    errEl.textContent = `"${val}" is not a valid note (e.g. D3, A2, C#4)`;
    inp.value = _prevDoumNote;
    return;
  }
  errEl.textContent = '';
  _prevDoumNote = val;
  _appSettings = { ..._appSettings, audio: { ..._appSettings.audio, doumNote: val } };
  setDoumNote(val);
  saveSettings(_appSettings);
});

// Audio: master volume
document.getElementById('settings-volume').addEventListener('input', () => {
  const vol = +document.getElementById('settings-volume').value;
  document.getElementById('settings-volume-val').textContent = Math.round(vol * 100) + '%';
  _appSettings = { ..._appSettings, audio: { ..._appSettings.audio, masterVolume: vol } };
  setMasterVolume(vol);
  saveSettings(_appSettings);
});

// Audio: ghost note volume
document.getElementById('settings-ghost-volume').addEventListener('input', () => {
  const gvol = +document.getElementById('settings-ghost-volume').value;
  document.getElementById('settings-ghost-volume-val').textContent = Math.round(gvol * 100) + '%';
  _appSettings = { ..._appSettings, audio: { ..._appSettings.audio, ghostVolume: gvol } };
  setGhostVolume(gvol);
  saveSettings(_appSettings);
});

// Layout: flip R/L
document.getElementById('settings-fliprl').addEventListener('change', () => {
  const flip = document.getElementById('settings-fliprl').checked;
  _appSettings = { ..._appSettings, layout: { ..._appSettings.layout, flipRL: flip } };
  setFlipRL(flip);
  saveSettings(_appSettings);
  if (state.parsed?.ok) renderGrid(state.parsed);
});

// Display: font
document.getElementById('settings-font').addEventListener('change', () => {
  const font = document.getElementById('settings-font').value.trim() || DEFAULTS.display.font;
  _appSettings = { ..._appSettings, display: { ..._appSettings.display, font } };
  applySettings(_appSettings);
  saveSettings(_appSettings);
});

// Reset to defaults
document.getElementById('settings-reset').addEventListener('click', () => {
  _appSettings = { ...DEFAULTS, srcCollapsed: _appSettings.srcCollapsed };
  applyAllSettings(_appSettings);
  saveSettings(_appSettings);
  populateSettingsModal(_appSettings);
  if (state.parsed?.ok) renderGrid(state.parsed);
});

// Export settings
document.getElementById('settings-export').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(_appSettings, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hat-settings.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

// Import settings
document.getElementById('settings-import').addEventListener('click', () => {
  document.getElementById('settings-import-input').click();
});
document.getElementById('settings-import-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!validateSettings(parsed)) { alert('Invalid settings file.'); return; }
      _appSettings = {
        version: 1,
        general: { ...DEFAULTS.general, ...parsed.general },
        audio:   { ...DEFAULTS.audio,   ...parsed.audio   },
        layout:  { ...DEFAULTS.layout,  ...parsed.layout  },
        display: {
          font:   parsed.display?.font || DEFAULTS.display.font,
          colors: { ...DEFAULTS.display.colors, ...parsed.display?.colors }
        },
        srcCollapsed: _appSettings.srcCollapsed
      };
      applyAllSettings(_appSettings);
      saveSettings(_appSettings);
      populateSettingsModal(_appSettings);
      if (state.parsed?.ok) renderGrid(state.parsed);
    } catch { alert('Could not read settings file.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});

// Shortcut panel close
document.getElementById('sc-close').onclick = () => document.getElementById('shortcut-panel').classList.remove('open');

// Source textarea
let _parseTimer = null;
document.getElementById('source').addEventListener('input', () => { clearTimeout(_parseTimer); _parseTimer = setTimeout(reparse, 300); });
document.getElementById('source').addEventListener('focus', stopPlayback);

// Sidebar search
document.getElementById('search').addEventListener('input', renderPatternList);

// ─────────────────────────────────────────────
//  INIT SEQUENCE
// ─────────────────────────────────────────────

setCustomPatterns(StorageStore.list());
buildSidebar();
initSidebarUI();

const _savedId = StorageStore.getActive();
const _savedCp = _savedId ? StorageStore.load(_savedId) : null;
if (_savedCp) {
  setActivePatIdx(-1); setCustomPatId(_savedId);
  loadHAT(_savedCp.hat);
  renderPatternList();
} else {
  loadPattern(0);
}

// Load rhythm library from bundle or async fetch
if (window.RHYTHM_LIBRARY && window.RHYTHM_LIBRARY.length) {
  for (const p of window.RHYTHM_LIBRARY) PATTERNS.push(p);
  buildSidebar();
} else {
  (async () => {
    try {
      const resp = await fetch('../rhythms/index.json');
      if (!resp.ok) return;
      const index = await resp.json();
      const results = await Promise.allSettled(
        index.map(async entry => {
          const r = await fetch(`../rhythms/${entry.file}`);
          if (!r.ok) throw new Error();
          const hat = await r.text();
          return { cat: entry.cat, name: entry.name, time: entry.time, grid: entry.grid, hat };
        })
      );
      let added = 0;
      for (const result of results) {
        if (result.status === 'fulfilled') { PATTERNS.push(result.value); added++; }
      }
      if (added > 0) buildSidebar();
    } catch(e) { /* external library unavailable */ }
  })();
}

// Embed listener + ready signal
initEmbedListener();
_postToHost({ type: 'hat:ready', specVersion: '1.3.4' });
