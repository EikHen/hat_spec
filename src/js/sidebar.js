// SPDX-License-Identifier: AGPL-3.0-or-later
// Sidebar: category pills, list pills, pattern list, load/delete helpers.

import {
  state,
  activeCat, setActiveCat,
  activeList, setActiveList,
  activePatIdx, setActivePatIdx,
  _customPatId, setCustomPatId,
  _customPatterns, setCustomPatterns,
  _listSelection, setListSelection,
  _listLastClickIdx, setListLastClickIdx,
  _dragSrcIdx, setDragSrcIdx,
} from './state.js';
import { PATTERNS } from './parser.js';
import { StorageStore, ListStore } from './storage.js';
import { escHtml, showToast } from './renderer.js';

// Late-bound editor ref (set by main.js to avoid circular import)
export const _editorRef = {};
export function setEditorRef(ref) { Object.assign(_editorRef, ref); }

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────

function listKey(item) { return JSON.stringify([item.type, item.ref]); }

// ─────────────────────────────────────────────
//  SIDEBAR BUILD
// ─────────────────────────────────────────────

export function buildSidebar() {
  const catsEl = document.getElementById('cats');
  catsEl.innerHTML = '';

  // "Mine" pill for custom patterns
  const minePill = document.createElement('span');
  minePill.className = 'cat-pill' + (activeCat === '__custom' && !activeList ? ' active' : '');
  minePill.textContent = 'Mine';
  minePill.onclick = () => { setActiveList(null); setCat('__custom', minePill); };
  catsEl.appendChild(minePill);

  const allPill = document.createElement('span');
  allPill.className = 'cat-pill' + (activeCat === null && !activeList ? ' active' : '');
  allPill.textContent = 'All';
  allPill.onclick = () => { setActiveList(null); setCat(null, allPill); };
  catsEl.appendChild(allPill);

  const cats = [...new Set(PATTERNS.map(p => p.cat))];
  for (const cat of cats) {
    const pill = document.createElement('span');
    pill.className = 'cat-pill' + (activeCat === cat && !activeList ? ' active' : '');
    pill.textContent = cat;
    pill.onclick = () => { setActiveList(null); setCat(cat, pill); };
    catsEl.appendChild(pill);
  }

  renderListPills();
  renderPatternList();
}

export function setCat(cat, pill) {
  setActiveCat(cat);
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  if (!activeList) pill.classList.add('active');
  renderPatternList();
}

// ─────────────────────────────────────────────
//  LIST PILLS + MANAGEMENT
// ─────────────────────────────────────────────

export function renderListPills() {
  const el = document.getElementById('list-pills');
  el.innerHTML = '';
  const lists = ListStore.getAll();

  lists.forEach(lst => {
    const pill = document.createElement('span');
    pill.className = 'cat-pill list-pill' + (activeList === lst.id ? ' active' : '');
    pill.title = 'Double-click to rename';
    const nameNode = document.createTextNode(lst.name);
    pill.appendChild(nameNode);
    pill.onclick = () => {
      const next = (activeList === lst.id) ? null : lst.id;
      if (next !== activeList) { setListSelection(new Set()); setListLastClickIdx(null); }
      setActiveList(next);
      renderListPills();
      renderPatternList();
    };
    pill.ondblclick = e => { e.stopPropagation(); startRenameList(pill, lst.id, lst.name); };
    // Delete ×
    const x = document.createElement('span');
    x.className = 'list-del-x'; x.textContent = '×'; x.title = 'Delete list';
    x.onclick = e => {
      e.stopPropagation();
      if (!confirm(`Delete list "${lst.name}"?`)) return;
      ListStore.remove(lst.id);
      if (activeList === lst.id) setActiveList(null);
      renderListPills(); renderPatternList();
    };
    pill.appendChild(x);
    el.appendChild(pill);
  });

  // "+ list" button
  const nb = document.createElement('span');
  nb.className = 'list-new-btn'; nb.textContent = '+ list'; nb.title = 'New list';
  nb.onclick = () => {
    const name = prompt('List name:');
    if (!name || !name.trim()) return;
    const id = ListStore.create(name.trim());
    setActiveList(id);
    renderListPills(); renderPatternList();
  };
  el.appendChild(nb);
}

export function startRenameList(pill, id, currentName) {
  const inp = document.createElement('input');
  inp.type = 'text'; inp.value = currentName; inp.className = 'list-rename-inp';
  pill.innerHTML = ''; pill.appendChild(inp);
  inp.focus(); inp.select();
  const commit = () => { const v = inp.value.trim(); if (v) ListStore.rename(id, v); renderListPills(); };
  inp.onblur = commit;
  inp.onkeydown = e => {
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { inp.value = currentName; inp.blur(); }
  };
}

// ─────────────────────────────────────────────
//  ADD-TO-LIST DROPDOWN
// ─────────────────────────────────────────────

export function closeListDropdown() {
  const el = document.getElementById('list-dropdown');
  if (el) el.remove();
}

export function showAddToListDropdown(e, type, ref) {
  e.stopPropagation();
  closeListDropdown();
  const lists = ListStore.getAll();
  const menu = document.createElement('div');
  menu.id = 'list-dropdown'; menu.className = 'list-dropdown';

  const addToList = (listId, listName) => {
    closeListDropdown();
    ListStore.addItem(listId, type, ref);
    showToast(`Added to "${listName}"`);
    renderListPills(); renderPatternList();
  };

  if (lists.length > 0) {
    lists.forEach(lst => {
      const row = document.createElement('div');
      row.className = 'list-dd-item'; row.textContent = lst.name;
      row.onclick = () => addToList(lst.id, lst.name);
      menu.appendChild(row);
    });
    const sep = document.createElement('div'); sep.className = 'list-dd-sep';
    menu.appendChild(sep);
  }

  const newRow = document.createElement('div');
  newRow.className = 'list-dd-item list-dd-new'; newRow.textContent = '+ New list…';
  newRow.onclick = () => {
    closeListDropdown();
    const name = prompt('List name:');
    if (!name || !name.trim()) return;
    const id = ListStore.create(name.trim());
    ListStore.addItem(id, type, ref);
    showToast(`Added to "${name.trim()}"`);
    renderListPills(); renderPatternList();
  };
  menu.appendChild(newRow);

  document.body.appendChild(menu);
  const rect = e.target.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  setTimeout(() => document.addEventListener('click', closeListDropdown, { once: true }), 0);
}

// ─────────────────────────────────────────────
//  PATTERN LIST RENDER
// ─────────────────────────────────────────────

export function renderPatternList() {
  const listEl = document.getElementById('pattern-list');
  const q = document.getElementById('search').value.toLowerCase();
  listEl.innerHTML = '';

  // ── List view ──
  if (activeList) {
    const lst = ListStore.getAll().find(l => l.id === activeList);
    if (!lst) { setActiveList(null); renderListPills(); return renderPatternList(); }

    lst.items.forEach((item, idx) => {
      let pat = null, name = '', meta = '', isActive = false;
      if (item.type === 'library') {
        const [cat, pname] = item.ref.split('::');
        pat = PATTERNS.find(p => p.cat === cat && p.name === pname);
        if (pat) {
          name = pat.name; meta = `${pat.cat} · ${pat.time} · ${pat.grid}`;
          isActive = PATTERNS.indexOf(pat) === activePatIdx;
        }
      } else {
        pat = StorageStore.load(item.ref);
        if (pat) {
          name = pat.title; meta = `${pat.time || ''}${pat.grid ? ' · ' + pat.grid : ''}`;
          isActive = item.ref === _customPatId;
        }
      }

      const key = listKey(item);
      const isSel = _listSelection.has(key);
      const row = document.createElement('div');
      row.className = 'pat-item list-item'
        + (isActive ? ' active' : '')
        + (isSel ? ' list-selected' : '')
        + (!pat ? ' pat-item-missing' : '');
      row.draggable = true;
      row.dataset.idx = String(idx);

      // Drag handle
      const handle = document.createElement('span');
      handle.className = 'drag-handle'; handle.textContent = '⠿'; handle.title = 'Drag to reorder';
      handle.setAttribute('draggable', 'false');
      row.appendChild(handle);

      if (pat) {
        const nameDiv = document.createElement('div'); nameDiv.className = 'pat-name';
        nameDiv.innerHTML = escHtml(name) + (item.type === 'custom' ? '<span class="pat-badge custom">custom</span>' : '');
        const metaDiv = document.createElement('div'); metaDiv.className = 'pat-meta';
        metaDiv.textContent = meta;
        row.appendChild(nameDiv); row.appendChild(metaDiv);
        row.style.paddingRight = '30px';
      } else {
        const nd = document.createElement('div'); nd.className = 'pat-name';
        nd.style.cssText = 'color:var(--fg3);font-style:italic'; nd.textContent = 'pattern not found';
        const md = document.createElement('div'); md.className = 'pat-meta'; md.textContent = item.ref;
        row.appendChild(nd); row.appendChild(md);
        row.style.paddingRight = '30px';
      }

      // Remove button
      const rm = document.createElement('button');
      rm.className = 'pat-del-btn'; rm.textContent = '×'; rm.title = 'Remove from list';
      rm.setAttribute('draggable', 'false');
      rm.onclick = e => {
        e.stopPropagation();
        const sel = new Set(_listSelection); sel.delete(key); setListSelection(sel);
        ListStore.removeItem(activeList, item.type, item.ref);
        renderPatternList();
      };
      row.appendChild(rm);

      // Click: select (shift = range) + load
      row.onclick = e => {
        if (e.shiftKey && _listLastClickIdx !== null) {
          const lo = Math.min(_listLastClickIdx, idx), hi = Math.max(_listLastClickIdx, idx);
          const sel = new Set();
          for (let i = lo; i <= hi; i++) sel.add(listKey(lst.items[i]));
          setListSelection(sel);
          renderPatternList();
        } else {
          setListSelection(new Set([key]));
          setListLastClickIdx(idx);
          if (pat) {
            if (item.type === 'library') loadPattern(PATTERNS.indexOf(pat));
            else loadCustomPattern(item.ref);
          } else {
            renderPatternList();
          }
        }
      };

      // Drag events
      row.ondragstart = e => {
        setDragSrcIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
        setTimeout(() => row.classList.add('dragging'), 0);
      };
      row.ondragend = () => {
        setDragSrcIdx(null);
        row.classList.remove('dragging');
        listEl.querySelectorAll('.drag-over-above,.drag-over-below').forEach(el => {
          el.classList.remove('drag-over-above', 'drag-over-below');
        });
      };
      row.ondragover = e => {
        if (_dragSrcIdx === null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
        listEl.querySelectorAll('.drag-over-above,.drag-over-below').forEach(el => {
          el.classList.remove('drag-over-above', 'drag-over-below');
        });
        row.classList.add(e.clientY < mid ? 'drag-over-above' : 'drag-over-below');
      };
      row.ondragleave = () => row.classList.remove('drag-over-above', 'drag-over-below');
      row.ondrop = e => {
        e.preventDefault();
        if (_dragSrcIdx === null || _dragSrcIdx === idx) return;
        const mid = row.getBoundingClientRect().top + row.getBoundingClientRect().height / 2;
        let target = e.clientY < mid ? idx : idx + 1;
        if (_dragSrcIdx < target) target--;
        ListStore.reorderItem(activeList, _dragSrcIdx, target);
        row.classList.remove('drag-over-above', 'drag-over-below');
        renderPatternList();
      };

      listEl.appendChild(row);
    });

    if (lst.items.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:14px 10px;font-size:11px;color:var(--fg3);text-align:center;';
      empty.textContent = 'Empty list. Use + on any pattern to add it here.';
      listEl.appendChild(empty);
    }
    return;
  }

  // ── Normal view ──

  // Custom patterns first (when "Mine" or "All")
  if (activeCat === null || activeCat === '__custom') {
    _customPatterns.forEach(cp => {
      if (q && !cp.title.toLowerCase().includes(q)) return;
      const isActive = cp.id === _customPatId;
      const item = document.createElement('div');
      item.className = 'pat-item' + (isActive ? ' active' : '');
      item.innerHTML = `<div class="pat-name">${escHtml(cp.title)}<span class="pat-badge custom">custom</span></div><div class="pat-meta">${escHtml(cp.time || '')}${cp.grid ? ' · ' + escHtml(cp.grid) : ''}</div>`;
      item.onclick = () => loadCustomPattern(cp.id);
      const lb = document.createElement('button');
      lb.className = 'pat-list-btn shift'; lb.textContent = '+'; lb.title = 'Add to list';
      lb.onclick = e => showAddToListDropdown(e, 'custom', cp.id);
      item.appendChild(lb);
      const del = document.createElement('button');
      del.className = 'pat-del-btn'; del.textContent = '×'; del.title = 'Delete pattern';
      del.onclick = e => { e.stopPropagation(); deleteCustomPattern(cp.id); };
      item.appendChild(del);
      listEl.appendChild(item);
    });
  }

  if (activeCat === '__custom') return;

  PATTERNS.forEach((p, i) => {
    if (activeCat && p.cat !== activeCat) return;
    if (q && !p.name.toLowerCase().includes(q) && !p.cat.toLowerCase().includes(q)) return;
    const item = document.createElement('div');
    item.className = 'pat-item' + (i === activePatIdx ? ' active' : '');
    item.innerHTML = `<div class="pat-name">${escHtml(p.name)}</div><div class="pat-meta">${escHtml(p.cat)} · ${escHtml(p.time)} · ${escHtml(p.grid)}</div>`;
    item.onclick = () => loadPattern(i);
    const lb = document.createElement('button');
    lb.className = 'pat-list-btn'; lb.textContent = '+'; lb.title = 'Add to list';
    lb.onclick = e => showAddToListDropdown(e, 'library', `${p.cat}::${p.name}`);
    item.appendChild(lb);
    listEl.appendChild(item);
  });
}

// ─────────────────────────────────────────────
//  LOAD PATTERN
// ─────────────────────────────────────────────

export function loadPattern(idx) {
  const { loadHAT } = _editorRef;
  setActivePatIdx(idx);
  setCustomPatId(null);
  StorageStore.setActive(null);
  const p = PATTERNS[idx];
  if (loadHAT) loadHAT(p.hat);
  renderPatternList();
}

export function loadCustomPattern(id) {
  const { loadHAT } = _editorRef;
  const cp = StorageStore.load(id);
  if (!cp) return;
  setActivePatIdx(-1);
  setCustomPatId(id);
  StorageStore.setActive(id);
  if (loadHAT) loadHAT(cp.hat);
  renderPatternList();
}

export function deleteCustomPattern(id) {
  if (!confirm('Delete this custom pattern?')) return;
  StorageStore.remove(id);
  setCustomPatterns(_customPatterns.filter(p => p.id !== id));
  if (_customPatId === id) { setCustomPatId(null); StorageStore.setActive(null); }
  renderPatternList();
  showToast('Pattern deleted');
}
