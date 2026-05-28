// SPDX-License-Identifier: AGPL-3.0-or-later
// Shared mutable application state — imported by all modules that need cross-module state.

export let state = { parsed: null, hatText: '' };

// Custom pattern tracking
export let _customPatId = null;   // UUID of active custom pattern (null = viewing a bundled pattern)
export let _customPatterns = [];  // loaded from localStorage on init

// Bar / col selection
export let _selBars = new Set();   // "si-bi" strings
export let _selCols = new Set();   // global col indices
export let _barSelAnchor = null;
export let _colSelAnchor = null;
export let _copiedBars = null;
export let _copiedCols = null;

// Sidebar state
export let activeCat = null;
export let activePatIdx = -1;
export let activeList = null;         // ID of the currently viewed list, or null
export let _listSelection = new Set();// Set of JSON-encoded [type,ref] keys
export let _listLastClickIdx = null;  // for shift-range select
export let _dragSrcIdx = null;        // source index during drag

// Cell hover / paint / type state
export let _hovered = null;   // { el, sec, bar, col, hand }
export let _paintKey = null;
export let _paintDown = false;
export let _typeMode = null;
export let _typeBuf = '';
export let _typeTimer = null;
export let _typeTarget = null;
export let _lastCPress = 0;

// Display mode
export let _showNoteNums = false;

// Setters (ES modules cannot reassign imported `let` bindings from outside)
export function setState(updates) { Object.assign(state, updates); }
export function setCustomPatId(v) { _customPatId = v; }
export function setCustomPatterns(v) { _customPatterns = v; }
export function setSelBars(v) { _selBars = v; }
export function setSelCols(v) { _selCols = v; }
export function setBarSelAnchor(v) { _barSelAnchor = v; }
export function setColSelAnchor(v) { _colSelAnchor = v; }
export function setCopiedBars(v) { _copiedBars = v; }
export function setCopiedCols(v) { _copiedCols = v; }
export function setActiveCat(v) { activeCat = v; }
export function setActivePatIdx(v) { activePatIdx = v; }
export function setActiveList(v) { activeList = v; }
export function setListSelection(v) { _listSelection = v; }
export function setListLastClickIdx(v) { _listLastClickIdx = v; }
export function setDragSrcIdx(v) { _dragSrcIdx = v; }
export function setHovered(v) { _hovered = v; }
export function setPaintKey(v) { _paintKey = v; }
export function setPaintDown(v) { _paintDown = v; }
export function setTypeMode(v) { _typeMode = v; }
export function setTypeBuf(v) { _typeBuf = v; }
export function setTypeTimer(v) { _typeTimer = v; }
export function setTypeTarget(v) { _typeTarget = v; }
export function setLastCPress(v) { _lastCPress = v; }
export function setShowNoteNums(v) { _showNoteNums = v; }
export function getSelCols() { return _selCols; }
