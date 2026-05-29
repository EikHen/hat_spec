// SPDX-License-Identifier: AGPL-3.0-or-later
// Grid rendering, cell helpers, UI popups, toast.

import { state, _selBars, _selCols, _hovered, _showNoteNums, setHovered } from './state.js';

// ─────────────────────────────────────────────
//  CELL HELPERS
// ─────────────────────────────────────────────

export function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

export function cellClass(cell, hand) {
  if (!cell||cell.hit==='-') return 'hat-cell k-rest';
  const h=cell.hit;
  if (h==='•') return 'hat-cell k-ghost';
  if (h==='D') return `hat-cell hand-${hand} k-D`;
  if (h==='T') return `hat-cell hand-${hand} k-T`;
  if (h==='K') return `hat-cell hand-${hand} k-K`;
  if (h==='S') return `hat-cell hand-${hand} k-S`;
  if (h==='d') return `hat-cell hand-${hand} k-d`;
  if (h==='t') return `hat-cell hand-${hand} k-t`;
  if (h==='k') return `hat-cell hand-${hand} k-k`;
  if (/^c\d+$/.test(h)) return `hat-cell hand-${hand} k-note k-chord`;
  return `hat-cell hand-${hand} k-note`;
}

export function cellText(c) {
  if (!c||c.hit==='-') return '';
  const mod=c.mod==='*'?'*':'', hit=c.hit;
  if (_showNoteNums && state.parsed?.meta) {
    const meta=state.parsed.meta;
    if (meta._noteMap) {
      for (const [num,name] of Object.entries(meta._noteMap)) {
        if (name===hit) return num+mod;
      }
    }
    if (meta._noteNames) {
      const idx=meta._noteNames.indexOf(hit);
      if (idx>=0) return String(idx+1)+mod;
    }
  }
  return hit+mod;
}

function nameToNum(name) {
  const meta=state.parsed?.meta;
  if (!meta) return name;
  if (meta._noteMap) {
    for (const [num,n] of Object.entries(meta._noteMap)) { if (n===name) return num; }
  }
  if (meta._noteNames) { const idx=meta._noteNames.indexOf(name); if (idx>=0) return String(idx+1); }
  return name;
}

export function setCellContent(el, cell) {
  if (cell && /^c\d+$/.test(cell.hit)) {
    const def = state.parsed?.meta?.[`x-chord-${cell.hit.slice(1)}`];
    if (def) {
      const notes = def.trim().split(/\s+/);
      // Chord split-field display follows the editor's names/numbers setting.
      const fmt = _showNoteNums ? n => escHtml(nameToNum(n)) : n => escHtml(n);
      const a = fmt(notes[0] || '');
      const b = fmt(notes[notes.length - 1] || '');
      el.innerHTML = `<span class="ch-tl">${a}</span><span class="ch-br">${b}</span>`;
      return;
    }
  }
  el.textContent = cellText(cell);
}

export function refreshCellEl(sec, bar, col) {
  const { getColObj } = _editorRef;
  const obj=getColObj(sec,bar,col);
  const isBarStart=(col===0);
  const beatCls=(!isBarStart&&obj.beatStart)?' beat-start':'';
  const subCls=(!isBarStart&&!obj.beatStart&&obj.sub)?' sub-start':'';
  const sepCls=beatCls||subCls;
  for (const hand of ['R','L']) {
    const el=document.querySelector(`.hat-cell[data-sec="${sec}"][data-bar="${bar}"][data-col="${col}"][data-hand="${hand}"]`);
    if (!el) continue;
    const selCls=_selCols.has(+el.dataset.colidx)?' col-selected':'';
    el.className=cellClass(obj[hand],hand)+sepCls+selCls;
    setCellContent(el,obj[hand]);
  }
}

// Late-bound reference to editor module (set by main.js after all modules load)
export const _editorRef = {};
export function setEditorRef(ref) { Object.assign(_editorRef, ref); }

let _flipRL = false;
export function setFlipRL(v) { _flipRL = v; }

// ─────────────────────────────────────────────
//  SECTION COLLAPSE STATE
// ─────────────────────────────────────────────

let _collapsedSections = new Set(); // Set<si>
export function toggleSectionCollapse(si) {
  if (_collapsedSections.has(si)) _collapsedSections.delete(si); else _collapsedSections.add(si);
}
export function clearCollapsedSections() { _collapsedSections.clear(); }

// Remap collapsed indices after moving a section (avoids clearing all state)
export function remapCollapsedAfterMove(fromSi, actualTo) {
  const next = new Set();
  for (const idx of _collapsedSections) {
    if (idx === fromSi) { next.add(actualTo); }
    else if (fromSi < actualTo) { next.add(idx > fromSi && idx <= actualTo ? idx - 1 : idx); }
    else                        { next.add(idx >= actualTo && idx < fromSi ? idx + 1 : idx); }
  }
  _collapsedSections = next;
}

// Toggle: collapse all if any expanded, expand all if all collapsed
export function toggleCollapseAll() {
  const n = state.parsed?.sections?.length ?? 0;
  if (_collapsedSections.size === n) { _collapsedSections.clear(); }
  else { _collapsedSections = new Set(Array.from({length: n}, (_, i) => i)); }
}

// ─────────────────────────────────────────────
//  GRID LAYOUT HELPERS
// ─────────────────────────────────────────────

let _gridScrollWidth = 0;
export function setGridScrollWidth(w) { _gridScrollWidth = w; }

// Active drag cleanup refs — cancelled on every renderGrid call
let _cancelBarDrag = null;
let _cancelSecDrag = null;

function findBarUnder(x, y, exclude) {
  const el = document.elementFromPoint(x, y);
  const b = el?.closest('.bar-block');
  return (b && b !== exclude) ? b : null;
}

function makeLabelCol() {
  const lblCol=document.createElement('div');
  lblCol.style.cssText='display:flex;flex-direction:column;padding-top:19px;padding-bottom:24px;align-items:center;flex-shrink:0;';
  const cLbl=document.createElement('div'); cLbl.className='row-label C'; cLbl.textContent='C';
  cLbl.style.marginBottom='14px'; lblCol.appendChild(cLbl);
  (_flipRL ? ['L','R'] : ['R','L']).forEach((h,i)=>{
    const l=document.createElement('div'); l.className=`row-label ${h}`; l.textContent=h;
    l.style.height='30px';
    if (i===0) l.style.marginBottom='4px';
    lblCol.appendChild(l);
  });
  return lblCol;
}

// Pre-compute which bars go on each visual row given available pixel width.
// One label col (14px) per row; bar_block = 42*cols+8; flex gap = 14px.
function computeRows(bars, availW) {
  const GAP=14, LABEL_W=14;
  const rows=[[]];
  let rowUsed=LABEL_W;
  for (let bi=0;bi<bars.length;bi++) {
    const bw=8+42*bars[bi].cols.length;
    if (rows[rows.length-1].length>0 && rowUsed+GAP+bw>availW) {
      rows.push([]); rowUsed=LABEL_W;
    }
    rows[rows.length-1].push(bi);
    rowUsed+=GAP+bw;
  }
  return rows.filter(r=>r.length>0);
}

// ─────────────────────────────────────────────
//  GRID RENDER
// ─────────────────────────────────────────────

export function renderGrid(parsed) {
  // Cancel any in-progress drag
  if (_cancelBarDrag) { _cancelBarDrag(); _cancelBarDrag = null; }
  if (_cancelSecDrag) { _cancelSecDrag(); _cancelSecDrag = null; }

  const { selectBar, selectCol, addColToBar, removeLastColFromBar,
          pushUndo, syncSourceFromModel, toggleBeat, toggleSubdiv,
          openCountEditor, openSectionLabelEditor,
          deleteSection, moveBar, moveSection } = _editorRef;

  const gridScroll=document.getElementById('grid-scroll');
  const savedScrollTop=gridScroll.scrollTop, savedScrollLeft=gridScroll.scrollLeft;
  const wrap=document.getElementById('grid-wrap');
  wrap.innerHTML='';
  let gci=0;

  const avail=(_gridScrollWidth||gridScroll.clientWidth)-24;

  for (let si=0; si<parsed.sections.length; si++) {
    const sec=parsed.sections[si];
    const isCollapsed=_collapsedSections.has(si);
    const secDiv=document.createElement('div'); secDiv.className='hat-section'; secDiv.dataset.si=si;

    // ── Section header (always rendered) ──
    const secHeader=document.createElement('div'); secHeader.className='section-header';

    const collapseBtn=document.createElement('button'); collapseBtn.className='sec-collapse-btn';
    collapseBtn.textContent=isCollapsed?'▶':'▼';
    collapseBtn.title=isCollapsed?'Expand section':'Collapse section';
    collapseBtn.onclick=e=>{e.stopPropagation();toggleSectionCollapse(si);renderGrid(state.parsed);};
    secHeader.appendChild(collapseBtn);

    const lblEl=document.createElement('div');
    lblEl.className='section-label'+(sec.label?'':' label-empty');
    lblEl.textContent=sec.label||(isCollapsed?`Section ${si+1}`:'');
    lblEl.title='Click to rename';
    lblEl.onclick=()=>openSectionLabelEditor(lblEl,si);
    secHeader.appendChild(lblEl);

    if (isCollapsed) {
      const barCount=document.createElement('span'); barCount.className='sec-bar-count';
      barCount.textContent=`${sec.bars.length} bar${sec.bars.length===1?'':'s'}`;
      secHeader.appendChild(barCount);
    }

    const hdrSpacer=document.createElement('div'); hdrSpacer.style.flex='1';
    secHeader.appendChild(hdrSpacer);

    const delBtn=document.createElement('button'); delBtn.className='sec-del-btn';
    delBtn.textContent='×'; delBtn.title='Delete section';
    delBtn.onclick=e=>{e.stopPropagation();deleteSection(si);};
    secHeader.appendChild(delBtn);

    if (isCollapsed && moveSection) {
      const dragHandle=document.createElement('span'); dragHandle.className='sec-drag-handle';
      dragHandle.title='Drag to reorder'; dragHandle.textContent='⠿';
      dragHandle.addEventListener('mousedown',e=>{
        if (e.button!==0) return;
        e.preventDefault(); e.stopPropagation();
        secDiv.classList.add('sec-dragging');
        const clearUI=()=>document.querySelectorAll('.hat-section').forEach(s=>s.classList.remove('sec-drop-before','sec-drop-after'));
        const onMove=e=>{
          clearUI();
          const t=document.elementFromPoint(e.clientX,e.clientY)?.closest('.hat-section');
          if (t&&t!==secDiv){const r=t.getBoundingClientRect();t.classList.add(e.clientY<r.top+r.height/2?'sec-drop-before':'sec-drop-after');}
        };
        const onUp=e=>{
          cleanup(); clearUI();
          const t=document.elementFromPoint(e.clientX,e.clientY)?.closest('.hat-section');
          if (t&&t!==secDiv){const r=t.getBoundingClientRect();const tSi=+t.dataset.si;moveSection(si,e.clientY<r.top+r.height/2?tSi:tSi+1);}
        };
        const cleanup=()=>{
          document.removeEventListener('mousemove',onMove);
          document.removeEventListener('mouseup',onUp);
          secDiv.classList.remove('sec-dragging');
          _cancelSecDrag=null;
        };
        _cancelSecDrag=cleanup;
        document.addEventListener('mousemove',onMove);
        document.addEventListener('mouseup',onUp);
      });
      secHeader.appendChild(dragHandle);
    }

    secDiv.appendChild(secHeader);

    // ── Grid (skip when collapsed) ──
    if (!isCollapsed) {
      const gridDiv=document.createElement('div'); gridDiv.className='hat-grid';

      // Build bar blocks in order (determines gci)
      const barBlocks=[];
      for (let bi=0; bi<sec.bars.length; bi++) {
        const bar=sec.bars[bi];
        const barKey=`${si}-${bi}`;
        const barBlock=document.createElement('div');
        barBlock.className='bar-block'+(_selBars.has(barKey)?' bar-selected':'');
        barBlock.dataset.bar=bi;

        // Bar reorder handle (left side, absolute)
        if (moveBar) {
          const orderHandle=document.createElement('div'); orderHandle.className='bar-order-handle'; orderHandle.title='Drag to reorder bar';
          orderHandle.addEventListener('mousedown',e=>{
            if (e.button!==0) return;
            e.preventDefault(); e.stopPropagation();
            barBlock.classList.add('bar-dragging');
            const clearUI=()=>document.querySelectorAll('.bar-block').forEach(b=>b.classList.remove('bar-drop-before','bar-drop-after'));
            const onMove=e=>{
              clearUI();
              const t=findBarUnder(e.clientX,e.clientY,barBlock);
              if (t){const r=t.getBoundingClientRect();t.classList.add(e.clientX<r.left+r.width/2?'bar-drop-before':'bar-drop-after');}
            };
            const onUp=e=>{
              cleanup(); clearUI();
              const t=findBarUnder(e.clientX,e.clientY,barBlock);
              if (t){const r=t.getBoundingClientRect();const before=e.clientX<r.left+r.width/2;const dsi=+t.closest('.hat-section').dataset.si;const dbi=+t.dataset.bar;moveBar(si,bi,dsi,before?dbi:dbi+1);}
            };
            const cleanup=()=>{
              document.removeEventListener('mousemove',onMove);
              document.removeEventListener('mouseup',onUp);
              barBlock.classList.remove('bar-dragging');
              _cancelBarDrag=null;
            };
            _cancelBarDrag=cleanup;
            document.addEventListener('mousemove',onMove);
            document.addEventListener('mouseup',onUp);
          });
          barBlock.appendChild(orderHandle);
        }

        const barNum=document.createElement('div');
        barNum.className='bar-num'+(_selBars.has(barKey)?' bar-selected':'');
        barNum.style.cursor='pointer';
        barNum.title='Click to select; Shift+click to add';
        barNum.onclick=e=>{e.stopPropagation();selectBar(si,bi,e.shiftKey,e.ctrlKey||e.metaKey);};
        barNum.appendChild(document.createTextNode(bi+1));
        barBlock.appendChild(barNum);

        const barRows=document.createElement('div'); barRows.className='bar-rows';
        const countRow=document.createElement('div'); countRow.className='count-row';
        const subdivRow=document.createElement('div'); subdivRow.className='subdiv-row';
        const rowR=document.createElement('div'); rowR.className='row-R';
        const rowL=document.createElement('div'); rowL.className='row-L';
        const colSelRow=document.createElement('div'); colSelRow.className='colsel-row';

        for (let ci=0;ci<bar.cols.length;ci++) {
          const col=bar.cols[ci], fi=gci;
          const isBarStart=(ci===0);
          const beatCls=(!isBarStart&&col.beatStart)?' beat-start':'';
          const subCls=(!isBarStart&&!col.beatStart&&col.sub)?' sub-start':'';
          const sepCls=beatCls||subCls;

          const cntCell=document.createElement('div');
          cntCell.className='count-cell'+sepCls+(col.countTok?' has-tok':'');
          cntCell.textContent=col.countTok==='.'?'·':(col.countTok||'');
          cntCell.title='Click to edit count token';
          cntCell.dataset.sec=si; cntCell.dataset.bar=bi; cntCell.dataset.col=ci;
          cntCell.onclick=e=>{e.stopPropagation();openCountEditor(cntCell,si,bi,ci);};
          countRow.appendChild(cntCell);

          const sdBtn=document.createElement('div');
          if (isBarStart) {
            sdBtn.className='subdiv-btn bar-start'; sdBtn.title='Bar start (|||)';
          } else if (col.beatStart) {
            sdBtn.className='subdiv-btn beat-start'; sdBtn.title='Beat boundary (||) — click to remove';
            sdBtn.onclick=()=>toggleBeat(si,bi,ci);
          } else if (col.sub) {
            sdBtn.className='subdiv-btn on'+sepCls; sdBtn.title='Sub-group (|) — click to toggle';
            sdBtn.onclick=()=>toggleSubdiv(si,bi,ci);
          } else {
            sdBtn.className='subdiv-btn'+sepCls; sdBtn.title='Click to add sub-group (|)';
            sdBtn.onclick=()=>toggleSubdiv(si,bi,ci);
          }
          subdivRow.appendChild(sdBtn);

          const cR=document.createElement('div');
          cR.className=cellClass(col.R,'R')+(_selCols.has(fi)?' col-selected':'')+sepCls;
          setCellContent(cR,col.R);
          cR.dataset.sec=si;cR.dataset.bar=bi;cR.dataset.col=ci;cR.dataset.hand='R';cR.dataset.colidx=fi;
          rowR.appendChild(cR);

          const cL=document.createElement('div');
          cL.className=cellClass(col.L,'L')+(_selCols.has(fi)?' col-selected':'')+sepCls;
          setCellContent(cL,col.L);
          cL.dataset.sec=si;cL.dataset.bar=bi;cL.dataset.col=ci;cL.dataset.hand='L';cL.dataset.colidx=fi;
          rowL.appendChild(cL);

          const selCell=document.createElement('div');
          selCell.className='colsel-cell'+(_selCols.has(fi)?' col-selected':'')+sepCls;
          selCell.title=`Col ${fi+1} — click/Shift/Ctrl to select`;
          selCell.onclick=e=>{e.stopPropagation();selectCol(fi,e.shiftKey,e.ctrlKey||e.metaKey);};
          colSelRow.appendChild(selCell);

          gci++;
        }

        if (_flipRL) barRows.append(countRow,subdivRow,rowL,rowR,colSelRow);
        else barRows.append(countRow,subdivRow,rowR,rowL,colSelRow);
        barBlock.appendChild(barRows);

        // Column-count resize handle (right side, absolute)
        const handle=document.createElement('div'); handle.className='bar-drag-handle'; handle.title='Drag to add/remove columns';
        let dragStartX=0, dragStartCols=0, dragCurrentCols=0;
        const onColDragMove=e=>{
          const target=Math.max(1,dragStartCols+Math.round((e.clientX-dragStartX)/20));
          if (target>dragCurrentCols){addColToBar(si,bi);dragCurrentCols++;}
          else if (target<dragCurrentCols){removeLastColFromBar(si,bi);dragCurrentCols--;}
        };
        const onColDragUp=()=>document.removeEventListener('mousemove',onColDragMove);
        handle.addEventListener('mousedown',e=>{
          e.preventDefault();e.stopPropagation();
          dragStartX=e.clientX;dragStartCols=bar.cols.length;dragCurrentCols=dragStartCols;
          document.addEventListener('mousemove',onColDragMove);
          document.addEventListener('mouseup',onColDragUp,{once:true});
        });
        barBlock.appendChild(handle);
        barBlocks.push(barBlock);
      }

      // Distribute bars into rows; one label column per row
      const rows=computeRows(sec.bars,avail);
      for (const rowBis of rows) {
        const rowDiv=document.createElement('div'); rowDiv.className='hat-grid-row';
        rowDiv.appendChild(makeLabelCol());
        for (const bi of rowBis) rowDiv.appendChild(barBlocks[bi]);
        gridDiv.appendChild(rowDiv);
      }
      secDiv.appendChild(gridDiv);
    }

    wrap.appendChild(secDiv);
  }
  gridScroll.scrollTop=savedScrollTop; gridScroll.scrollLeft=savedScrollLeft;
  if (_hovered && _hovered.el && !_hovered.el.isConnected) {
    const el=wrap.querySelector(`.hat-cell[data-sec="${_hovered.sec}"][data-bar="${_hovered.bar}"][data-col="${_hovered.col}"][data-hand="${_hovered.hand}"]`);
    if (el){setHovered({..._hovered,el});el.classList.add('hovered');}else setHovered(null);
  }
}

// ─────────────────────────────────────────────
//  INLINE COUNT EDITOR
// ─────────────────────────────────────────────

export function openCountEditor(cellEl, sec, bar, col) {
  const { getColObj, pushUndo, syncSourceFromModel } = _editorRef;
  document.getElementById('count-inp')?.remove();
  const colObj=getColObj(sec,bar,col);
  const rect=cellEl.getBoundingClientRect();
  const inp=document.createElement('input');
  inp.id='count-inp'; inp.type='text'; inp.value=colObj.countTok||'';
  inp.style.cssText=`left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;`;
  document.body.appendChild(inp); inp.focus(); inp.select();
  function commit() {
    inp.remove();
    const v=inp.value.trim();
    if (v===''||v==='e'||v==='&'||v==='a'||v==='.'||/^\d+$/.test(v)) {
      pushUndo(); colObj.countTok=v||null;
      syncSourceFromModel(); renderGrid(state.parsed);
    } else setStatus(`Invalid count token "${v}" — use 1 2 3… e & a . or empty`);
  }
  inp.addEventListener('keydown',e=>{
    if (e.key==='Enter'){e.stopPropagation();commit();}
    if (e.key==='Escape'){e.stopPropagation();inp.remove();}
  });
  inp.addEventListener('blur',commit);
}

// ─────────────────────────────────────────────
//  SECTION LABEL EDITOR
// ─────────────────────────────────────────────

export function openSectionLabelEditor(lblEl, si) {
  const { pushUndo, syncSourceFromModel } = _editorRef;
  const inp=document.createElement('input'); inp.type='text';
  inp.value=state.parsed.sections[si].label||'';
  inp.style.cssText='font-size:11px;text-transform:uppercase;letter-spacing:0.06em;background:var(--bg3);color:var(--fg);border:1px solid var(--accent);border-radius:3px;padding:1px 4px;width:120px;font:inherit;outline:none;';
  lblEl.replaceWith(inp); inp.focus(); inp.select();
  function commit() {
    pushUndo(); state.parsed.sections[si].label=inp.value.trim();
    syncSourceFromModel(); renderGrid(state.parsed);
  }
  inp.addEventListener('keydown',e=>{
    if (e.key==='Enter'){e.stopPropagation();commit();}
    if (e.key==='Escape'){e.stopPropagation();renderGrid(state.parsed);}
  });
  inp.addEventListener('blur',commit);
}

// ─────────────────────────────────────────────
//  NOTE / CHORD PICKER
// ─────────────────────────────────────────────

export function fieldKeyBadge(i) {
  if (i<9) return String(i+1);
  if (i===9) return '0';
  return ''; // Notes 11+ have no default keyboard shortcut
}

export function openNotePicker(targetEl) {
  const { pushUndo, applyHit } = _editorRef;
  document.getElementById('hat-note-popup')?.remove();
  if (!state.parsed?.ok||!_hovered) return;
  const notes=state.parsed.meta._noteNames||[];
  const rect=targetEl.getBoundingClientRect();
  const popup=document.createElement('div');
  popup.id='hat-note-popup'; popup.className='note-popup';
  popup.style.left=`${Math.min(rect.left,window.innerWidth-230)}px`;
  popup.style.top=`${rect.bottom+6}px`;

  if (notes.length>0) {
    const lbl=document.createElement('div'); lbl.className='note-popup-lbl'; lbl.textContent='Pick note:';
    popup.appendChild(lbl);
    const grid=document.createElement('div'); grid.className='note-popup-grid';
    notes.forEach((note,i)=>{
      const btn=document.createElement('button'); btn.className='note-popup-btn';
      const kEl=document.createElement('span'); kEl.className='npop-key'; kEl.textContent=fieldKeyBadge(i);
      btn.append(kEl,document.createTextNode(note));
      btn.onmousedown=e=>{e.preventDefault();e.stopPropagation();commitNote(note);};
      grid.appendChild(btn);
    });
    popup.appendChild(grid);
  }

  const inp=document.createElement('input'); inp.type='text'; inp.className='note-popup-inp';
  inp.placeholder=notes.length?'or type note name…':'Note name (e.g. D4)';
  inp.onkeydown=e=>{
    if (e.key==='Enter'){e.stopPropagation();commitNote(inp.value.trim());}
    if (e.key==='Escape'){e.stopPropagation();popup.remove();}
  };
  popup.appendChild(inp); document.body.appendChild(popup); inp.focus();

  requestAnimationFrame(()=>{
    if (popup.getBoundingClientRect().bottom>window.innerHeight-8)
      popup.style.top=`${rect.top-popup.offsetHeight-6}px`;
  });

  function commitNote(note) {
    popup.remove(); if (!note||!_hovered||!state.parsed?.ok) return;
    pushUndo(); applyHit(_hovered.sec,_hovered.bar,_hovered.col,_hovered.hand,note);
  }
  const closeOut=e=>{if(!popup.contains(e.target)&&e.target!==targetEl){popup.remove();document.removeEventListener('mousedown',closeOut);}};
  setTimeout(()=>document.addEventListener('mousedown',closeOut),0);
}

export function openChordPicker(targetEl) {
  const { pushUndo, applyHit } = _editorRef;
  document.getElementById('hat-chord-popup')?.remove();
  document.getElementById('hat-note-popup')?.remove();
  if (!state.parsed?.ok||!_hovered) return;
  const chords=[];
  let ci=1;
  while (state.parsed.meta[`x-chord-${ci}`]) {
    chords.push({token:`c${ci}`,def:state.parsed.meta[`x-chord-${ci}`]});
    ci++;
  }
  const rect=targetEl.getBoundingClientRect();
  const popup=document.createElement('div');
  popup.id='hat-chord-popup'; popup.className='note-popup';
  popup.style.left=`${Math.min(rect.left,window.innerWidth-260)}px`;
  popup.style.top=`${rect.bottom+6}px`;

  if (chords.length>0) {
    const lbl=document.createElement('div'); lbl.className='note-popup-lbl'; lbl.textContent='Pick chord:';
    popup.appendChild(lbl);
    const grid=document.createElement('div'); grid.className='note-popup-grid';
    chords.forEach(({token,def})=>{
      const btn=document.createElement('button'); btn.className='note-popup-btn';
      const kEl=document.createElement('span'); kEl.className='npop-key'; kEl.textContent=token;
      btn.append(kEl,document.createTextNode(def));
      btn.onmousedown=e=>{e.preventDefault();e.stopPropagation();commitChord(token);};
      grid.appendChild(btn);
    });
    popup.appendChild(grid);
  }

  const inp=document.createElement('input'); inp.type='text'; inp.className='note-popup-inp';
  inp.placeholder=chords.length?'or type chord token (e.g. c3)…':'Chord token (e.g. c1)';
  inp.onkeydown=e=>{
    if (e.key==='Enter'){e.stopPropagation();commitChord(inp.value.trim());}
    if (e.key==='Escape'){e.stopPropagation();popup.remove();}
  };
  popup.appendChild(inp); document.body.appendChild(popup); inp.focus();

  requestAnimationFrame(()=>{
    if (popup.getBoundingClientRect().bottom>window.innerHeight-8)
      popup.style.top=`${rect.top-popup.offsetHeight-6}px`;
  });

  function commitChord(token) {
    popup.remove(); if (!token||!_hovered||!state.parsed?.ok) return;
    pushUndo(); applyHit(_hovered.sec,_hovered.bar,_hovered.col,_hovered.hand,token);
  }
  const closeOut=e=>{if(!popup.contains(e.target)&&e.target!==targetEl){popup.remove();document.removeEventListener('mousedown',closeOut);}};
  setTimeout(()=>document.addEventListener('mousedown',closeOut),0);
}

// ─────────────────────────────────────────────
//  TOAST / STATUS
// ─────────────────────────────────────────────

export function setStatus(msg) { document.getElementById('status').textContent=msg; }

let _toastTimer = null;
export function showToast(msg, ms=2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('visible'), ms);
}
