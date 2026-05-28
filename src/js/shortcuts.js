// SPDX-License-Identifier: AGPL-3.0-or-later
// Keyboard shortcuts, grid mouse events, paint-mode.

import {
  state,
  _hovered, setHovered,
  _paintKey, setPaintKey,
  _paintDown, setPaintDown,
  _selBars, setSelBars,
  _selCols, setSelCols,
  activeList,
  _listSelection, setListSelection,
  _listLastClickIdx, setListLastClickIdx,
  _typeMode, setTypeMode,
  _typeBuf, setTypeBuf,
  _typeTimer, setTypeTimer,
  _typeTarget, setTypeTarget,
  _lastCPress, setLastCPress,
} from './state.js';
import { FIELD_DIGIT_KEYS } from './parser.js';
import { KEY_HIT, TYPE_DELAY } from './editor.js';
import { renderGrid } from './renderer.js';
import { ListStore } from './storage.js';

// Late-bound refs (set by main.js)
export const _editorRef = {};
export function setEditorRef(ref) { Object.assign(_editorRef, ref); }

export const _audioRef = {};
export function setAudioRef(ref) { Object.assign(_audioRef, ref); }

export const _rendererRef = {};
export function setRendererRef(ref) { Object.assign(_rendererRef, ref); }

// ─────────────────────────────────────────────
//  GRID MOUSE EVENTS
// ─────────────────────────────────────────────

export function initGridEvents(EMBED_MODE) {
  const gridWrap = document.getElementById('grid-wrap');

  gridWrap.addEventListener('mouseover', e => {
    if (EMBED_MODE && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
      document.body.tabIndex = -1;
      document.body.focus({ preventScroll: true });
    }
    const el = e.target.closest('.hat-cell'); if (!el) return;
    if (_hovered?.el) _hovered.el.classList.remove('hovered');
    setHovered({ el, sec: +el.dataset.sec, bar: +el.dataset.bar, col: +el.dataset.col, hand: el.dataset.hand });
    el.classList.add('hovered');
    if (_paintDown && _paintKey !== null && state.parsed?.ok) {
      const { applyHit } = _editorRef;
      if (applyHit) applyHit(_hovered.sec, _hovered.bar, _hovered.col, _hovered.hand, _paintKey);
    }
  });

  gridWrap.addEventListener('mouseout', e => {
    const el = e.target.closest('.hat-cell');
    if (el && _hovered?.el === el) el.classList.remove('hovered');
  });

  gridWrap.addEventListener('mousedown', e => {
    const el = e.target.closest('.hat-cell'); if (!el || !state.parsed?.ok) return;
    setPaintDown(true);
    if (_paintKey === null) {
      const { pushUndo, cycleCell } = _editorRef;
      if (pushUndo) pushUndo();
      if (cycleCell) cycleCell(+el.dataset.sec, +el.dataset.bar, +el.dataset.col, el.dataset.hand);
    }
  });

  window.addEventListener('mouseup', () => { setPaintDown(false); });

  document.getElementById('grid-scroll').addEventListener('click', e => {
    if (e.target.closest('.hat-cell,.bar-num,.colsel-cell,.subdiv-btn,.count-cell,.bar-ctrl-btn,.section-add-bar,.section-label,button')) return;
    if (_selBars.size === 0 && _selCols.size === 0) return;
    setSelBars(new Set()); setSelCols(new Set());
    renderGrid(state.parsed);
  });
}

// ─────────────────────────────────────────────
//  KEYBOARD
// ─────────────────────────────────────────────

function listKeyParse(k) { const [type, ref] = JSON.parse(k); return { type, ref }; }

export function initKeyboard() {
  document.addEventListener('keydown', e => {
    const inInput = ['TEXTAREA','INPUT'].includes(document.activeElement.tagName);
    const {
      pushUndo, undo, copySelected, pasteSelected, deleteSelectedBars,
      applyHit, toggleFlam, toggleSubdiv, toggleBeat,
      insertColBefore, insertColAfter, deleteCol, commitTypeBuf,
    } = _editorRef;
    const { openNotePicker, openChordPicker, renderPatternList } = _rendererRef;
    const { _playing, startPlayback, stopPlayback } = _audioRef;

    // ? = shortcut panel toggle
    if (!inInput && e.key === '?') {
      e.preventDefault();
      document.getElementById('shortcut-panel').classList.toggle('open');
      return;
    }

    // Escape = close panels
    if (e.key === 'Escape') {
      document.getElementById('shortcut-panel').classList.remove('open');
      return;
    }

    // Space = play/pause
    if (!inInput && e.key === ' ') {
      e.preventDefault();
      if (_playing) stopPlayback(); else startPlayback();
      return;
    }

    // Ctrl/Meta combos
    if ((e.ctrlKey || e.metaKey) && !inInput) {
      if (e.key === 'z') { e.preventDefault(); if (undo) undo(); return; }
      if (e.key === 'c') { e.preventDefault(); if (copySelected) copySelected(); return; }
      if (e.key === 'v') { e.preventDefault(); if (pasteSelected) pasteSelected(); return; }
      return;
    }
    if (e.ctrlKey || e.metaKey || inInput) return;

    // Backspace/Delete on list selection
    if (activeList && _listSelection.size > 0 && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      _listSelection.forEach(k => {
        const { type, ref } = listKeyParse(k);
        ListStore.removeItem(activeList, type, ref);
      });
      setListSelection(new Set()); setListLastClickIdx(null);
      if (renderPatternList) renderPatternList();
      return;
    }

    // Delete selected bars
    if (_selBars.size > 0 && (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'x')) {
      e.preventDefault();
      if (deleteSelectedBars) deleteSelectedBars();
      return;
    }

    // Feed ongoing type buffer
    if (_typeMode && FIELD_DIGIT_KEYS.includes(e.key)) {
      e.preventDefault();
      setTypeBuf(_typeBuf + e.key);
      clearTimeout(_typeTimer);
      setTypeTimer(setTimeout(() => { if (commitTypeBuf) commitTypeBuf(); }, TYPE_DELAY));
      return;
    }

    if (!_hovered || !state.parsed?.ok) return;

    const { sec, bar, col, hand } = _hovered;

    // Direct hit key
    if (KEY_HIT[e.key] !== undefined) {
      e.preventDefault();
      if (pushUndo) pushUndo();
      if (applyHit) applyHit(sec, bar, col, hand, KEY_HIT[e.key]);
      setPaintKey(KEY_HIT[e.key]);
      return;
    }

    switch (e.key) {
      case '*': case '^':
        e.preventDefault();
        if (pushUndo) pushUndo();
        if (toggleFlam) toggleFlam(sec, bar, col, hand);
        renderGrid(state.parsed);
        return;
      case 'I': e.preventDefault(); if (toggleSubdiv) toggleSubdiv(sec, bar, col); return;
      case 'B': e.preventDefault(); if (toggleBeat) toggleBeat(sec, bar, col); return;
      case 'i': e.preventDefault(); if (insertColBefore) insertColBefore(sec, bar, col); return;
      case 'o': e.preventDefault(); if (insertColAfter) insertColAfter(sec, bar, col); return;
      case 'x': case 'Delete': case 'Backspace':
        e.preventDefault(); if (deleteCol) deleteCol(sec, bar, col); return;
      case 'n': e.preventDefault(); if (openNotePicker) openNotePicker(_hovered.el); return;
      case 'c': {
        e.preventDefault();
        const now = Date.now();
        if (now - _lastCPress < 350) {
          if (commitTypeBuf) commitTypeBuf();
          setLastCPress(0);
          if (openChordPicker) openChordPicker(_hovered.el);
        } else {
          if (commitTypeBuf) commitTypeBuf();
          setTypeMode('chord'); setTypeBuf(''); setTypeTarget({ sec, bar, col, hand });
          clearTimeout(_typeTimer);
          setTypeTimer(setTimeout(() => { if (commitTypeBuf) commitTypeBuf(); }, TYPE_DELAY));
          setLastCPress(now);
        }
        return;
      }
    }

    // Digit keys → buffered note input
    if (FIELD_DIGIT_KEYS.includes(e.key)) {
      const notes = state.parsed.meta._noteNames || [];
      if (!notes.length) return;
      e.preventDefault();
      setTypeMode('note'); setTypeBuf(e.key); setTypeTarget({ sec, bar, col, hand });
      clearTimeout(_typeTimer);
      setTypeTimer(setTimeout(() => { if (commitTypeBuf) commitTypeBuf(); }, TYPE_DELAY));
    }
  });

  document.addEventListener('keyup', e => {
    const mapped = KEY_HIT[e.key] !== undefined ? KEY_HIT[e.key] : e.key;
    if (_paintKey !== null && (_paintKey === mapped || _paintKey === e.key)) setPaintKey(null);
  });
}
