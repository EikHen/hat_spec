// SPDX-License-Identifier: AGPL-3.0-or-later
// config.js — app settings (source panel collapse, etc.)

export function loadSettings() {
  return {
    srcCollapsed: localStorage.getItem('hat_src_collapsed') === '1',
  };
}

export function saveSettings(settings) {
  try {
    if ('srcCollapsed' in settings)
      localStorage.setItem('hat_src_collapsed', settings.srcCollapsed ? '1' : '0');
  } catch(e) {}
}

export function applySettings(settings) {
  const wrap = document.getElementById('source-wrap');
  const btn  = document.getElementById('source-toggle');
  if (!wrap || !btn) return;
  if (settings.srcCollapsed) {
    wrap.classList.add('collapsed');
    btn.textContent = '▸ Source';
  } else {
    wrap.classList.remove('collapsed');
    btn.textContent = '▾ Source';
  }
}
