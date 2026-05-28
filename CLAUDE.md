# hat_spec — CLAUDE.md

## Project Overview

A web-based **HAT (Handpan Arrangement Tablature)** editor and spec. The `.hat.txt` format describes handpan music; this repo contains the spec, a browser editor, a linter, and tests.

## Structure

```
hat_spec/
├── HAT-spec.md          # The HAT format specification
├── hat-list.md          # List of known HAT files
├── rhythm-library.md    # Rhythm library documentation
├── index.html           # Main app entry point
├── src/
│   ├── editor.html      # Editor UI
│   ├── css/             # Modular CSS (variables, layout, components)
│   └── js/              # ES modules
│       ├── main.js      # App bootstrap
│       ├── editor.js    # Editor logic
│       ├── parser.js    # HAT format parser
│       ├── renderer.js  # Renders parsed HAT to DOM
│       ├── state.js     # App state management
│       ├── storage.js   # Persistence (localStorage)
│       ├── audio.js     # Audio playback
│       ├── sidebar.js   # Sidebar UI
│       ├── embed.js     # Embed mode
│       ├── config.js    # Configuration
│       └── shortcuts.js # Keyboard shortcuts
├── scripts/
│   ├── bundle-rhythms.mjs  # Bundles rhythm library
│   └── hat-lint.mjs        # HAT file linter
├── tests/
│   ├── run.js           # Test runner
│   ├── parsing/         # Valid + invalid .hat.txt parse tests
│   └── extensions/      # Extension format examples
└── extensions/          # Extension spec docs
```

## Code Exploration

**Prefer CodeGraph over filesystem scanning:**

- `codegraph_search` — find symbols by name instead of grep
- `codegraph_context` — get task-relevant code context
- `codegraph_callers` / `codegraph_callees` — trace call flow
- `codegraph_impact` — see what's affected before changing something
- `codegraph_node` — get source for a specific symbol

Use `grep` for literal text not indexed by CodeGraph (e.g., HAT format strings, CSS classes). Use full file reads only when the complete source is needed — prefer targeted grep or codegraph lookups first.
