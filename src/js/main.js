// SPDX-License-Identifier: AGPL-3.0-or-later
// main.js — entry point: wires all modules, registers event listeners, runs init.

import { state, setCustomPatterns, setCustomPatId, setActivePatIdx, _showNoteNums, setShowNoteNums, _selBars, _hovered } from './state.js';
import { parseHAT, PATTERNS } from './parser.js';
import { StorageStore, ListStore, genId } from './storage.js';
import { loadSettings, saveSettings, applySettings } from './config.js';

import {
  renderGrid, setStatus, showToast,
  openNotePicker, openChordPicker, openCountEditor, openSectionLabelEditor,
  refreshCellEl,
  setEditorRef as rendererSetEditorRef,
  setGridScrollWidth,
  clearCollapsedSections, remapCollapsedAfterMove, toggleCollapseAll,
} from './renderer.js';

import {
  pushUndo, undo,
  loadHAT, reparse, syncSourceFromModel,
  applyHit, cycleCell, toggleFlam, toggleSubdiv, toggleBeat,
  insertColBefore, insertColAfter, deleteCol, deleteSelectedBars,
  addColToBar, removeLastColFromBar,
  selectBar, selectCol,
  cloneBar,
  copySelected, pasteSelected,
  commitTypeBuf,
  setEmbedRef as editorSetEmbedRef,
  setSidebarRef as editorSetSidebarRef,
  setRendererRef as editorSetRendererRef,
} from './editor.js';

import {
  startPlayback, stopPlayback, _playing,
  setEmbedRef as audioSetEmbedRef,
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

editorSetEmbedRef({ _emitPatternChanged, _postToHost });
editorSetSidebarRef({ _listUndoStack, ListStore, renderListPills, renderPatternList });
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
  pushUndo, undo, addSection,
  applyHit, cycleCell, toggleFlam, toggleSubdiv, toggleBeat,
  insertColBefore, insertColAfter, deleteCol, deleteSelectedBars,
  copySelected, pasteSelected, commitTypeBuf,
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

document.getElementById('btn-note-mode').onclick = () => {
  setShowNoteNums(!_showNoteNums);
  const btn = document.getElementById('btn-note-mode');
  btn.textContent = _showNoteNums ? 'Numbers' : 'Names';
  btn.classList.toggle('active', _showNoteNums);
  if (state.parsed?.ok) renderGrid(state.parsed);
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
  document.getElementById('np-time').value = '4/4';
  document.getElementById('np-grid').value = '8th';
  document.getElementById('np-bpm').value = '120';
  document.getElementById('new-pat-modal').classList.add('show');
  document.getElementById('np-title').focus();
};
document.getElementById('np-cancel').onclick = () => document.getElementById('new-pat-modal').classList.remove('show');
document.getElementById('np-ok').onclick = () => {
  const title = document.getElementById('np-title').value.trim() || 'Untitled';
  const time  = document.getElementById('np-time').value;
  const grid  = document.getElementById('np-grid').value;
  const bpm   = document.getElementById('np-bpm').value;
  const id    = genId();
  const hat = `;;HAT v1.3.4\n;;title: ${title}\n;;time: ${time}\n;;grid: ${grid}\n;;tempo: ${bpm}\n\nR: ||| -   -   || -   -   || -   -   || -   -   |||\nL: ||| -   -   || -   -   || -   -   || -   -   |||`;
  StorageStore.save(id, hat, { title, time, grid });
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

// Source panel toggle
(function initSourceToggle() {
  const settings = loadSettings();
  applySettings(settings);
  document.getElementById('source-toggle').onclick = () => {
    const wrap = document.getElementById('source-wrap');
    const collapsed = !wrap.classList.contains('collapsed');
    applySettings({ srcCollapsed: collapsed });
    saveSettings({ srcCollapsed: collapsed });
  };
})();

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
