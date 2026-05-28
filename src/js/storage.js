// SPDX-License-Identifier: AGPL-3.0-or-later
// StorageStore, ListStore, genId — all localStorage interaction lives here.

export let _listUndoStack = [];

export const StorageStore = {
  PREFIX: 'hat_pat_',
  ACTIVE_KEY: 'hat_active_id',
  save(id, hat, meta={}) {
    try {
      localStorage.setItem(this.PREFIX + id, JSON.stringify({
        id, hat,
        title: meta.title || 'Untitled',
        time: meta.time || '',
        grid: meta.grid || '',
        updatedAt: Date.now()
      }));
    } catch(e) {}
  },
  load(id) {
    try { const r = localStorage.getItem(this.PREFIX + id); return r ? JSON.parse(r) : null; } catch(e) { return null; }
  },
  remove(id) { try { localStorage.removeItem(this.PREFIX + id); } catch(e) {} },
  list() {
    const items = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          try { const v = JSON.parse(localStorage.getItem(key)); if (v) items.push(v); } catch(e) {}
        }
      }
    } catch(e) {}
    return items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  },
  setActive(id) { try { if (id) localStorage.setItem(this.ACTIVE_KEY, id); else localStorage.removeItem(this.ACTIVE_KEY); } catch(e) {} },
  getActive() { try { return localStorage.getItem(this.ACTIVE_KEY); } catch(e) { return null; } }
};

// Each list: { id, name, items: [{type:'library'|'custom', ref:string}] }
// Library ref: "cat::name"   Custom ref: uuid
export const ListStore = {
  KEY: 'hat_lists',
  getAll() { try { const r=localStorage.getItem(this.KEY); return r?JSON.parse(r):[]; } catch(e){ return []; } },
  _save(lists) { try { localStorage.setItem(this.KEY, JSON.stringify(lists)); } catch(e){} },
  _snap() { _listUndoStack.push(localStorage.getItem(this.KEY)||'[]'); if(_listUndoStack.length>60)_listUndoStack.shift(); },
  create(name) {
    this._snap();
    const lists=this.getAll(), id=genId();
    lists.push({id, name, items:[]});
    this._save(lists); return id;
  },
  rename(id, name) {
    this._snap();
    const lists=this.getAll(), l=lists.find(x=>x.id===id);
    if(l){ l.name=name; this._save(lists); }
  },
  remove(id) { this._snap(); this._save(this.getAll().filter(x=>x.id!==id)); },
  addItem(listId, type, ref) {
    const lists=this.getAll(), l=lists.find(x=>x.id===listId);
    if(!l) return;
    if(!l.items.find(i=>i.type===type&&i.ref===ref)){ this._snap(); l.items.push({type,ref}); this._save(lists); }
  },
  removeItem(listId, type, ref) {
    this._snap();
    const lists=this.getAll(), l=lists.find(x=>x.id===listId);
    if(!l) return;
    l.items=l.items.filter(i=>!(i.type===type&&i.ref===ref)); this._save(lists);
  },
  moveItem(listId, type, ref, dir) {
    this._snap();
    const lists=this.getAll(), l=lists.find(x=>x.id===listId);
    if(!l) return;
    const idx=l.items.findIndex(i=>i.type===type&&i.ref===ref);
    if(idx<0) return;
    const ni=idx+dir;
    if(ni<0||ni>=l.items.length) return;
    [l.items[idx],l.items[ni]]=[l.items[ni],l.items[idx]];
    this._save(lists);
  },
  reorderItem(listId, fromIdx, toIdx) {
    this._snap();
    const lists=this.getAll(), l=lists.find(x=>x.id===listId);
    if(!l||fromIdx===toIdx) return;
    const [item]=l.items.splice(fromIdx,1);
    l.items.splice(toIdx,0,item);
    this._save(lists);
  }
};

export function genId() {
  try { return crypto.randomUUID(); } catch(e) { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
}
