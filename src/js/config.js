// SPDX-License-Identifier: AGPL-3.0-or-later
// config.js — versioned user settings: load, validate, save, apply CSS vars.

export const DEFAULTS = {
  version: 1,
  general: {
    noteDisplay: 'names'    // 'names' | 'numbers'
  },
  audio: {
    masterVolume: 1.0,
    ghostVolume: 0.5,       // volume multiplier for ghost notes (0–1); max is 2× louder
    doumNote: '',           // empty = default percussion; e.g. 'D3' plays that note
    noteSustain: 2.0        // seconds — decay duration for pan note hits (default/doum)
  },
  layout: {
    flipRL: false           // swap R and L rows in the rendered grid (display-only)
  },
  display: {
    font: 'var(--font-mono)',
    colors: {
      // Surfaces
      bg:  '#2e2e34',
      bg2: '#38383f',
      bg3: '#424249',
      bg4: '#505059',
      // Text
      fg:     '#eaeaea',
      fg2:    '#b8b8b8',
      fg3:    '#727278',
      accent: '#7dd4ff',
      border: '#48484f',
      // Hands
      R:    '#7dd4ff', Rdim: '#3870a8', Rbg: '#163045',
      L:    '#ffc050', Ldim: '#8a6020', Lbg: '#3a2808',
      // Hits
      'hit-D':    '#7dd4ff',
      'hit-T':    '#5ab0f0',
      'hit-K':    '#ffc050',
      'hit-S':    '#d878f8',
      'hit-note': '#78e068',
      // Cells
      'cell-rest-bg':  '#2a2a2f',
      'cell-D-bg':     '#163450',
      'cell-T-bg':     '#12283c',
      'cell-K-bg':     '#3d2808',
      'cell-S-bg':     '#301244',
      'cell-ghost-bg': '#272729',
      'cell-note-bg':  '#132a13',
      // Grid / bars
      'bar-bg':          '#2a2a32',
      'bar-border':      '#555570',
      'bar-selected-bg': '#1a2a40',
      // Separators
      'sep-beat':     '#4a7aaa',
      'sep-beat-dim': '#3a5a88',
      'sep-sub':      '#505068',
      'sep-sub-dim':  '#3e3e58',
      // Count row
      'count-tok-fg': '#9ab8d8',
      'count-tok-bg': 'rgba(66,104,152,0.18)',
      // Selection
      'col-sel-cell':  'rgba(240,160,64,0.27)',
      'col-sel-strip': 'rgba(240,160,64,0.17)',
      // Misc
      scrim:   'rgba(0,0,0,0.55)',
      playing: 'rgba(255,255,255,0.87)',
    }
  }
};

export function validateSettings(cfg) {
  if (!cfg || typeof cfg !== 'object') return false;
  if (cfg.version !== 1) return false;
  if (!cfg.general || typeof cfg.general !== 'object') return false;
  if (!cfg.audio   || typeof cfg.audio   !== 'object') return false;
  if (!cfg.layout  || typeof cfg.layout  !== 'object') return false;
  if (!cfg.display || typeof cfg.display !== 'object') return false;
  return true;
}

export function loadSettings() {
  let app = DEFAULTS;
  try {
    const raw = localStorage.getItem('hat_settings');
    if (raw) {
      const p = JSON.parse(raw);
      if (validateSettings(p)) {
        app = {
          version: 1,
          general: { ...DEFAULTS.general, ...p.general },
          audio:   { ...DEFAULTS.audio,   ...p.audio   },
          layout:  { ...DEFAULTS.layout,  ...p.layout  },
          display: {
            font:   p.display.font || DEFAULTS.display.font,
            colors: { ...DEFAULTS.display.colors, ...p.display.colors }
          }
        };
      }
    }
  } catch(e) {}
  return {
    ...app,
    srcCollapsed: localStorage.getItem('hat_src_collapsed') === '1'
  };
}

export function saveSettings(settings) {
  try {
    if ('srcCollapsed' in settings) {
      localStorage.setItem('hat_src_collapsed', settings.srcCollapsed ? '1' : '0');
    }
    if (validateSettings(settings)) {
      localStorage.setItem('hat_settings', JSON.stringify({
        version: settings.version,
        general: settings.general,
        audio:   settings.audio,
        layout:  settings.layout,
        display: settings.display
      }));
    }
  } catch(e) {}
}

// Applies the display portion of settings (CSS vars, font) and the srcCollapsed panel state.
// Does NOT save, trigger renders, or modify other state modules — caller is responsible.
export function applySettings(settings) {
  // Source panel (only if srcCollapsed key is explicitly present)
  if ('srcCollapsed' in settings) {
    const wrap = document.getElementById('source-wrap');
    const btn  = document.getElementById('source-toggle');
    if (wrap && btn) {
      if (settings.srcCollapsed) {
        wrap.classList.add('collapsed');
        btn.textContent = '▸ Source';
      } else {
        wrap.classList.remove('collapsed');
        btn.textContent = '▾ Source';
      }
    }
  }

  // CSS custom properties from display.colors
  if (settings.display?.colors) {
    const root = document.documentElement;
    for (const [k, v] of Object.entries(settings.display.colors)) {
      if (typeof v === 'string') root.style.setProperty(`--${k}`, v);
    }
  }

  // Font
  if (settings.display?.font) {
    document.documentElement.style.setProperty('--font-ui', settings.display.font);
  }
}
