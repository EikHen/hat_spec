// SPDX-License-Identifier: AGPL-3.0-or-later
// Undo stack, cell editing, structural edits, load/reparse, selection, copy/paste.

import {
  state, setState,
  _selBars, _selCols, _copiedBars, _copiedCols, _hovered,
  _customPatId,
  activeList,
  _colSelAnchor,
  setSelBars, setSelCols, setBarSelAnchor, setColSelAnchor,
  setCopiedBars, setCopiedCols,
  setCustomPatterns,
  setHovered,
  _typeMode, _typeBuf, _typeTimer, _typeTarget,
  setTypeMode, setTypeBuf, setTypeTimer, setTypeTarget,
} from './state.js';
import { parseHAT, serializeHAT } from './parser.js';
import { renderGrid, setStatus, clearCollapsedSections } from './renderer.js';
import { StorageStore } from './storage.js';

// _emitPatternChanged is imported lazily via ref to avoid circular init
export const _embedRef = {};
export function setEmbedRef(ref) { Object.assign(_embedRef, ref); }

// ─────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────

export const CYCLE_R=['-','D','T','S','d','t','•'];
export const CYCLE_L=['-','D','K','S','d','k','•'];
export const KEY_HIT={'D':'D','d':'d','T':'T','t':'t','K':'K','k':'k','S':'S','s':'s','.':'•','-':'-'};
export const TYPE_DELAY=500;

// ─────────────────────────────────────────────
//  UNDO
// ─────────────────────────────────────────────

export let _undoStack = [];

export function pushUndo() {
  _undoStack.push(document.getElementById('source').value);
  if (_undoStack.length>60) _undoStack.shift();
}

export function undo() {
  const { _listUndoStack, ListStore, renderListPills, renderPatternList, checkPatDeleteUndo } = _sidebarRef;
  if (activeList && _listUndoStack && _listUndoStack.length) {
    try { localStorage.setItem(ListStore.KEY, _listUndoStack.pop()); } catch(e){}
    renderListPills(); renderPatternList();
  } else if (checkPatDeleteUndo && checkPatDeleteUndo()) {
    // pattern deletion undone
  } else if (_undoStack.length) {
    setHovered(null); loadHAT(_undoStack.pop());
  }
}

export function redo() {
  const { checkPatDeleteRedo } = _sidebarRef;
  if (checkPatDeleteRedo) checkPatDeleteRedo();
}

// Late-bound sidebar ref (set by main.js)
export const _sidebarRef = {};
export function setSidebarRef(ref) { Object.assign(_sidebarRef, ref); }

// Late-bound renderer ref (set by main.js)
export const _rendererRef = {};
export function setRendererRef(ref) { Object.assign(_rendererRef, ref); }

// ─────────────────────────────────────────────
//  CELL ACCESS
// ─────────────────────────────────────────────

export function getColObj(sec, bar, col) { return state.parsed.sections[sec].bars[bar].cols[col]; }

// ─────────────────────────────────────────────
//  CELL EDITING
// ─────────────────────────────────────────────

export function applyHit(sec, bar, col, hand, hit) {
  const obj=getColObj(sec,bar,col);
  obj[hand]={hit,mod:obj[hand]?.mod||null};
  syncSourceFromModel(); renderGrid(state.parsed);
}

export function cycleCell(sec, bar, col, hand) {
  const obj=getColObj(sec,bar,col), cycle=hand==='R'?CYCLE_R:CYCLE_L;
  const cur=obj[hand]?.hit||'-';
  applyHit(sec,bar,col,hand,cycle[(cycle.indexOf(cur)+1)%cycle.length]);
}

export function setCountTok(sec, bar, col, tok) {
  const obj=getColObj(sec,bar,col);
  pushUndo(); obj.countTok=tok||null;
  syncSourceFromModel(); renderGrid(state.parsed);
}

export function toggleFlam(sec, bar, col, hand) {
  const obj=getColObj(sec,bar,col), c=obj[hand]||{hit:'-',mod:null};
  obj[hand]={hit:c.hit,mod:c.mod==='*'?null:'*'};
  syncSourceFromModel();
  const { refreshCellEl } = _rendererRef;
  if (refreshCellEl) refreshCellEl(sec,bar,col);
}

// ─────────────────────────────────────────────
//  SUBDIVISION / BEAT
// ─────────────────────────────────────────────

function updateSubdivisionMeta() {
  const bar=state.parsed?.sections?.[0]?.bars?.[0];
  if (!bar?.cols?.length) return;
  const groups=[];
  let count=0;
  for (let i=0;i<bar.cols.length;i++) {
    if (i>0&&bar.cols[i].beatStart) { groups.push(count); count=0; }
    count++;
  }
  groups.push(count);
  if (groups.length>1) state.parsed.meta.subdivision=groups.join('+');
  else delete state.parsed.meta.subdivision;
}

export function toggleSubdiv(sec, bar, col) {
  if (col===0) return;
  const c=getColObj(sec,bar,col);
  pushUndo();
  if (c.beatStart) {
    c.beatStart=false; c.sub=true;
    updateSubdivisionMeta();
  } else {
    c.sub=!c.sub;
  }
  syncSourceFromModel(); renderGrid(state.parsed);
}

export function toggleBeat(sec, bar, col) {
  if (col===0) return;
  pushUndo();
  const c=getColObj(sec,bar,col);
  c.beatStart=!c.beatStart;
  if (c.beatStart) c.sub=false;
  updateSubdivisionMeta();
  syncSourceFromModel(); renderGrid(state.parsed);
}

// ─────────────────────────────────────────────
//  STRUCTURAL EDITS
// ─────────────────────────────────────────────

export function insertColBefore(sec, bar, col) {
  pushUndo();
  state.parsed.sections[sec].bars[bar].cols.splice(col,0,{R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
  syncSourceFromModel(); renderGrid(state.parsed);
}
export function insertColAfter(sec, bar, col) {
  pushUndo();
  state.parsed.sections[sec].bars[bar].cols.splice(col+1,0,{R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
  syncSourceFromModel(); renderGrid(state.parsed);
}
export function deleteCol(sec, bar, col) {
  const cols=state.parsed.sections[sec].bars[bar].cols;
  if (cols.length<=1) return;
  pushUndo(); cols.splice(col,1); syncSourceFromModel(); renderGrid(state.parsed);
}
export function deleteSelectedBars() {
  if (!state.parsed?.ok||_selBars.size===0) return;
  const sorted=[..._selBars].map(k=>k.split('-').map(Number)).sort((a,b)=>b[0]-a[0]||b[1]-a[1]);
  pushUndo();
  for (const [si,bi] of sorted) state.parsed.sections[si].bars.splice(bi,1);
  const before=state.parsed.sections.length;
  state.parsed.sections=state.parsed.sections.filter(s=>s.bars.length>0);
  if (state.parsed.sections.length!==before) clearCollapsedSections();
  if (!state.parsed.sections.length) {
    const empty={R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null};
    state.parsed.sections=[{label:'',bars:[{cols:[empty]}]}];
  }
  setSelBars(new Set());
  syncSourceFromModel(); renderGrid(state.parsed);
}
export function addColToBar(sec, bar) {
  pushUndo(); state.parsed.sections[sec].bars[bar].cols.push({R:{hit:'-',mod:null},L:{hit:'-',mod:null},beatStart:false,sub:false,countTok:null});
  syncSourceFromModel(); renderGrid(state.parsed);
}
export function removeLastColFromBar(sec, bar) {
  const cols=state.parsed.sections[sec].bars[bar].cols;
  if (cols.length<=1) return;
  pushUndo(); cols.pop(); syncSourceFromModel(); renderGrid(state.parsed);
}

// ─────────────────────────────────────────────
//  SYNC SOURCE FROM MODEL
// ─────────────────────────────────────────────

export function syncSourceFromModel() {
  if (_hovered) setHovered({sec:_hovered.sec, bar:_hovered.bar, col:_hovered.col, hand:_hovered.hand, el:null, countCell:_hovered.countCell});
  const text=serializeHAT(state.parsed.meta,state.parsed.sections);
  document.getElementById('source').value=text; state.hatText=text;
  if (_customPatId) { StorageStore.save(_customPatId, text, state.parsed.meta); setCustomPatterns(StorageStore.list()); }
  if (_embedRef._emitPatternChanged) _embedRef._emitPatternChanged();
  const m=state.parsed.meta;
  document.getElementById('card-title').textContent=m.title||'Untitled';
  document.getElementById('card-meta').textContent=[m.time,m.grid,m.subdivision,m.tempo?m.tempo+' BPM':''].filter(Boolean).join(' · ');
  const allCols=[],colCoords=[];
  for (let si=0;si<state.parsed.sections.length;si++)
    for (let bi=0;bi<state.parsed.sections[si].bars.length;bi++)
      for (let ci=0;ci<state.parsed.sections[si].bars[bi].cols.length;ci++) {
        allCols.push(state.parsed.sections[si].bars[bi].cols[ci]);
        colCoords.push({sec:si,bar:bi,col:ci});
      }
  state.parsed.cols=allCols; state.parsed.colCoords=colCoords;
}

// ─────────────────────────────────────────────
//  LOAD / REPARSE
// ─────────────────────────────────────────────

export function loadHAT(text) {
  clearCollapsedSections();
  state.hatText=text; document.getElementById('source').value=text;
  reparse();
  if (_embedRef._emitPatternChanged) _embedRef._emitPatternChanged();
}

export function reparse() {
  setHovered(null);
  setSelBars(new Set()); setSelCols(new Set());
  const text=document.getElementById('source').value;
  state.hatText=text;
  const parsed=parseHAT(text);
  const st=document.getElementById('parse-status');
  if (!parsed.ok) {
    st.textContent='✗ '+parsed.error; st.style.color='#f06060'; setStatus('Parse error');
    return;
  }
  setState({ parsed });
  st.textContent='✓'; st.style.color='#60c060';
  const m=parsed.meta;
  document.getElementById('card-title').textContent=m.title||'Untitled';
  document.getElementById('card-meta').textContent=[m.time,m.grid,m.subdivision,m.tempo?m.tempo+' BPM':''].filter(Boolean).join(' · ');
  if (_customPatId) {
    StorageStore.save(_customPatId, text, m);
    setCustomPatterns(StorageStore.list());
    if (_sidebarRef.renderPatternList) _sidebarRef.renderPatternList();
  }
  renderGrid(parsed);
  setStatus('');
}

// ─────────────────────────────────────────────
//  SELECTION
// ─────────────────────────────────────────────

export function selectBar(si, bi, shift, range) {
  const key=`${si}-${bi}`;
  if (shift&&_selBars.size>0) {
    const next=new Set(_selBars);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelBars(next);
  } else {
    setSelBars((_selBars.has(key)&&_selBars.size===1)?new Set():new Set([key]));
    setBarSelAnchor(_selBars.size>0?key:null); setSelCols(new Set());
  }
  renderGrid(state.parsed);
}

export function selectCol(fi, shift, range) {
  if (range&&_colSelAnchor!==null) {
    const next=new Set(_selCols);
    const lo=Math.min(_colSelAnchor,fi),hi=Math.max(_colSelAnchor,fi);
    for (let i=lo;i<=hi;i++) next.add(i);
    setSelCols(next); setSelBars(new Set());
  } else if (shift&&_selCols.size>0) {
    const next=new Set(_selCols);
    if (next.has(fi)) next.delete(fi); else next.add(fi);
    setSelCols(next);
  } else {
    setSelCols((_selCols.has(fi)&&_selCols.size===1)?new Set():new Set([fi]));
    setColSelAnchor(_selCols.size>0?fi:null); setSelBars(new Set());
  }
  renderGrid(state.parsed);
}

// ─────────────────────────────────────────────
//  COPY / PASTE / CLONE
// ─────────────────────────────────────────────

export function cloneBar(bar) { return {cols:bar.cols.map(c=>({R:{...c.R},L:{...c.L},beatStart:c.beatStart,sub:c.sub,countTok:c.countTok}))}; }
export function cloneCol(col) { return {R:{...col.R},L:{...col.L},beatStart:col.beatStart,sub:col.sub,countTok:col.countTok}; }

export function setCopiedBarsState(v) { setCopiedBars(v); setCopiedCols(null); }

export function copySelected() {
  if (!state.parsed?.ok) return;
  const { showToast } = _rendererRef;
  if (_selBars.size>0) {
    const bars=[..._selBars].sort().map(key=>{
      const [si,bi]=key.split('-').map(Number);
      return cloneBar(state.parsed.sections[si].bars[bi]);
    });
    setCopiedBars(bars); setCopiedCols(null);
    if (showToast) showToast(`${bars.length} bar(s) copied — Ctrl+V to paste`);
  } else if (_selCols.size>0) {
    const sorted=[..._selCols].sort((a,b)=>a-b);
    const cols=sorted.map(fi=>{
      const coord=state.parsed.colCoords[fi]; if(!coord) return null;
      return cloneCol(state.parsed.sections[coord.sec].bars[coord.bar].cols[coord.col]);
    }).filter(Boolean);
    setCopiedCols(cols); setCopiedBars(null);
    if (showToast) showToast(`${cols.length} col(s) copied — Ctrl+V to paste`);
  } else if (_hovered) {
    setCopiedBars([cloneBar(state.parsed.sections[_hovered.sec].bars[_hovered.bar])]);
    setCopiedCols(null);
    if (showToast) showToast('Bar copied — Ctrl+V to paste');
  }
}

export function pasteSelected() {
  if (!state.parsed?.ok) return;
  const { showToast } = _rendererRef;
  if (_copiedBars?.length) {
    let si=0, bi=state.parsed.sections[0].bars.length-1;
    if (_selBars.size>0) { const k=[..._selBars].sort().pop(); [si,bi]=k.split('-').map(Number); }
    else if (_hovered) { si=_hovered.sec; bi=_hovered.bar; }
    pushUndo();
    state.parsed.sections[si].bars.splice(bi+1,0,..._copiedBars.map(cloneBar));
    syncSourceFromModel(); renderGrid(state.parsed);
    if (showToast) showToast(`${_copiedBars.length} bar(s) pasted`);
  } else if (_copiedCols?.length&&_hovered) {
    const {sec,bar,col}=_hovered;
    const bc=state.parsed.sections[sec].bars[bar].cols;
    pushUndo();
    _copiedCols.forEach((cc,i)=>{const ci=col+i;if(ci<bc.length){bc[ci].R={...cc.R};bc[ci].L={...cc.L};}});
    syncSourceFromModel(); renderGrid(state.parsed);
    if (showToast) showToast(`${_copiedCols.length} col(s) pasted`);
  }
}

// ─────────────────────────────────────────────
//  BUFFERED NOTE / CHORD INPUT
// ─────────────────────────────────────────────

export function commitTypeBuf() {
  clearTimeout(_typeTimer); setTypeTimer(null);
  const mode=_typeMode, buf=_typeBuf, tgt=_typeTarget;
  setTypeMode(null); setTypeBuf(''); setTypeTarget(null);
  if (!tgt||!state.parsed?.ok) return;
  if (mode==='note') {
    const idx=parseInt(buf,10)-1;
    const notes=state.parsed.meta._noteNames||[];
    if (idx>=0&&notes[idx]) { pushUndo(); applyHit(tgt.sec,tgt.bar,tgt.col,tgt.hand,notes[idx]); renderGrid(state.parsed); }
  } else if (mode==='chord'&&buf) {
    pushUndo(); applyHit(tgt.sec,tgt.bar,tgt.col,tgt.hand,'c'+buf); renderGrid(state.parsed);
  }
}
