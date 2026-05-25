# HAT — Handpan ASCII Tab v1.3.3

A plain-text notation system for handpan rhythms. Human-readable in monospace fonts, trivially machine-parseable.

## Version history

| Version | Additions |
|---|---|
| v1.2 | Playability rules relaxed to defaults; optional `\|` subdivisions; simultaneous strikes |
| v1.2.2 | Subdivision minimalism; `(-, -)` silent columns; T/K convention |
| v1.3.0 | Section labels; note targeting; 3-char cells (Style A); triplet grids; `%` inline comments; `;;fields:` |
| v1.3.1 | `triplet-4th` grid; `;;x-*:` extension namespace; `t`/`k` muted-tak symbols; compound-meter clarification; `%% %%` block comments; subdivision mismatch is now a hard parse error |
| v1.3.2 | `;;notes:` + `;;note-numbers:` fields; numeric note aliases in tablature (1–3 digit numbers) |
| v1.3.3 | `;;fields:` removed — superseded by `;;notes:` |

---

## 1. Document structure

A HAT document has three layers, all optional except the version line:

1. **File header** — `;;` metadata lines.
2. **Section labels** — `[name]` or `[name xN]` lines grouping stanzas.
3. **Stanzas** — `R:` / `L:` line pairs containing the rhythm.

```
;;HAT v1.3.3
;;title: Groove in D Kurd
;;tempo: 92
;;time: 4/4
;;grid: 8th
;;tuning: D Kurd
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5

[intro]
R: || D   | -   | •   | -   | D   | -   | T   | -   ||
L: || -   | K   | -   | K   | -   | •   | -   | •   ||

[verse x2]                        % plays twice
R: || F#4 | -   | A4  | -   | B4  | -   | D5  | -   ||
L: || -   | K   | -   | K   | -   | K   | -   | K   ||
```

---

## 2. Symbols

### Hit symbols

| Symbol | Meaning |
|---|---|
| `D` | Doum — center / bass strike |
| `d` | Doum, muted |
| `T` | Tak — open edge tone, **R-line convention** |
| `t` | Tak, muted — damped edge tone, **R-line convention** |
| `K` | Tak — open edge tone, **L-line convention** |
| `k` | Tak, muted — damped edge tone, **L-line convention** |
| `S` | Slap |
| `•` | Ghost — felt movement, inaudible |
| `-` | Rest — hand does nothing |

**T/K/t/k convention:** Uppercase (`T`, `K`) = open tak; lowercase (`t`, `k`) = muted/damped tak. By convention, T/t appear in R lines and K/k in L lines. Parsers must accept any of these in either line — the convention is for human readability only.

**Note names** may replace any hit symbol to address a specific tone field (see §3).

### Modifier

| Symbol | Meaning |
|---|---|
| `*` | Flam (grace note before the main hit) |
| _(none)_ | No modifier |

One modifier per cell, written immediately after the hit symbol.

---

## 3. Cells and separators

### Cell formats

In **Style A** (aligned, with `|`), every cell is exactly **3 characters**. In **Style B** (compact, no `|`), cells are whitespace-separated with no fixed width.

| Content | Style A | Style B |
|---|---|---|
| Doum | `D  ` | `D` |
| Tak-R | `T  ` | `T` |
| Tak-R muted | `t  ` | `t` |
| Tak-R + flam | `T* ` | `T*` |
| Ghost | `•  ` | `•` |
| Rest | `-  ` | `-` |
| Note C#3 | `C#3` | `C#3` |
| Note D4 (natural) | `D4 ` | `D4` |
| Note + flam | _(Style B only)_ | `F#4*` |
| Note number (1-digit) | `0  ` | `0` |
| Note number (2-digit) | `12 ` | `12` |
| Note number (3-digit) | `100` | `100` |
| Note number + flam | _(Style B only)_ | `0*` |

### Note names

A note name targets a specific tone field and implies a standard tone-field strike. The playing hand is determined by the line (R or L).

Format: `[A–G][#\|b]?[0–9]` — pitch class, optional accidental, octave digit.

**Disambiguation:** `D` alone (no digit or accidental following) = Doum. `D` followed by `#`, `b`, or a digit = the note D.

Natural notes (`D4`, `A4`) require one trailing space in Style A to fill 3 characters. Sharps and flats (`C#3`, `Bb5`) are exactly 3 characters. Notes cannot carry a modifier in Style A (3 chars are fully consumed); use Style B for note+modifier (`F#4*`).

### Separators

| Token | Meaning |
|---|---|
| `\|\|` | Bar boundary (mandatory) |
| `\|` | Subdivision boundary (optional, Style A only) |
| whitespace | Cell separator (Style B) |

### Subdivision minimalism

Place `|` only at musically meaningful boundaries. Use the coarsest grouping that preserves the felt phrasing:

| Context | Recommended | Avoid |
|---|---|---|
| 4/4 in 8ths | No `\|`, or one at the halfway point | `\|` between every cell |
| 7/8 (3+2+2) | `\|` after cells 3 and 5 | `\|` after every cell |
| 3+3+2 in 16ths | `\|` after cells 3 and 6 | `\|` at halfway |

---

## 4. Layout

Body lines come in `R:` / `L:` pairs. Cells must align vertically between the two lines.

```
R: || X   | X   | X   | X   ||
L: || X   | X   | X   | X   ||
```

Multiple stanza pairs may appear within one section to break long patterns across lines.

---

## 5. Header keys

| Key | Meaning |
|---|---|
| `HAT v1.3.3` | Version declaration — must be the first `;;` line |
| `title:` | Pattern or song name |
| `tempo:` | Beats per minute |
| `time:` | Time signature, e.g. `4/4`, `7/8`, `12/8` |
| `grid:` | Cell duration — see grid table below |
| `tuning:` | Handpan tuning, e.g. `D Kurd` |
| `notes:` | Available note names, space-separated ascending pitch, e.g. `D4 E4 F#4 A4 B4` — also required when `note-numbers:` is used (see §5.1) |
| `note-numbers:` | Numbers aliasing each note in `notes:`, same order, 1–3 digits each (see §5.1) |
| `legend:` | Freeform symbol legend |
| `x-*:` | Private extension — any key starting with `x-` (see below) |

### Grid values

| Value | Cell duration |
|---|---|
| `4th` | Quarter note |
| `8th` | Eighth note |
| `16th` | Sixteenth note |
| `32nd` | Thirty-second note |
| `triplet-4th` | Triplet quarter note — 3 cells per half-note duration |
| `triplet-8th` | Triplet eighth note — 3 cells per quarter-note beat |
| `triplet-16th` | Triplet sixteenth note — 3 cells per eighth-note beat |

**Compound meters:** For 6/8, 9/8, 12/8, use `;;time: 12/8` + `;;grid: 8th`. Do **not** use a triplet grid value for compound time. The `time:` key is descriptive only — cell duration is determined solely by `grid:`. Parsers must not infer triplet duration from a compound `time:` value.

### Extension namespace `;;x-*:`

Any `;;` key beginning with `x-` is a private extension. Parsers must silently preserve its value in the metadata dict but must not act on it. Example:

```
;;x-editor-theme: dark
;;x-accent-grid: 0,4,8
```

This prevents tool-specific headers from colliding with future official keys.

### §5.1 Note-number aliases

When `;;notes:` and `;;note-numbers:` are both present, each note name in `;;notes:` is aliased by the corresponding number in `;;note-numbers:`. In the tablature body, a 1–3 digit decimal number is treated exactly like the note name it aliases.

```
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5
;;note-numbers: 0 1 2 3 4 5 6 7
```

Here `0` = `D4`, `1` = `E4`, `5` = `D5`, and so on. The two notations are interchangeable in any mix within a single document:

```
R: || 0   | -   | •   | -   | 3   | -   | 5   | -   ||
L: || -   | K   | -   | K   | -   | K   | -   | K   ||
```

is equivalent to:

```
R: || D4  | -   | •   | -   | A4  | -   | D5  | -   ||
L: || -   | K   | -   | K   | -   | K   | -   | K   ||
```

**Constraints:**

- Both `;;notes:` and `;;note-numbers:` must appear together. Providing only one is a parse error.
- The two lists must have the same number of entries. A length mismatch is a parse error.
- Each number in `;;note-numbers:` must be unique. Duplicate numbers are a parse error.
- Numbers are 1–3 decimal digits (range 0–999). Leading zeros are not permitted (e.g., `07` is a parse error).
- Ascending from 0 is recommended but not required.
- When `;;notes:` is present, every note name and every resolved note number used in the body must appear in the `;;notes:` list → PARSE ERROR otherwise.

**Style A cell widths for note numbers:**

| Digits | Example cell | Width |
|---|---|---|
| 1 | `0  ` | 3 chars (number + 2 spaces) |
| 2 | `12 ` | 3 chars (number + 1 space) |
| 3 | `100` | 3 chars (number fills cell) |

Note numbers cannot carry a modifier in Style A (the cell is fully consumed at 3 chars for 3-digit numbers). Use Style B for number + modifier (`0*`).

---

## 6. Sections

```
[intro]               % plays once (default)
[verse x2]            % plays twice total
[chorus]
```

- Section names are any non-whitespace token inside `[...]`.
- `xN` (integer ≥ 2) declares the section plays N times in total.
- A section label applies to **all consecutive R/L stanza pairs that follow it**, until the next label or end of file.
- If no label precedes the first stanza, those stanzas belong to an implied unnamed section.
- Playback order is top-to-bottom. A sequencer may re-order by name.

---

## 7. Comments

### Inline comments — `%`

`%` starts a comment running to end of line. Valid anywhere in a body line or on its own line.

```
[chorus]              % repeat with variation on second pass
R: || D   | -   | T   | -   || % strong downbeat
L: || -   | K   | -   | K   ||
```

`%` inside a `;;` metadata line is **not** treated as a comment — metadata lines are parsed as `key: value` only.

### Block comments — `%% … %%`

`%%` opens a block comment; the next `%%` closes it. Everything between (including newlines) is stripped. Block comments may span multiple lines or appear inline.

```
%%
Practice note: bars 3–4 are an improvised transition.
Keep the left-hand pulse steady throughout.
%%

[bridge]
R: || D   | -   | T   | -   ||
L: || -   | K   | -   | K   ||
```

Single-line block comment: `%% tempo pushes here — play ahead of the beat %%`

**Processing order:** block comments are stripped first (global pass), then inline `%` comments are stripped line by line, then parsing proceeds.

---

## 8. Playability defaults

Apply these unless the rhythm specifically requires otherwise.

**Default 1 — One hand active per column.** Exactly one of (R, L) plays or ghosts; the other rests.
> *Relaxation:* Both may be active `(active, active)` for polyrhythms and unisons. Both may rest `(-, -)` at a genuine silence.

**Default 2 — Strict alternation.** One hand owns odd cells, the other owns even cells.
> *Relaxation:* Break alternation for asymmetric groupings (3+3+2, swing, clave) when felt phrasing demands it.

**Default 3 — Ghosts maintain the active hand's pulse.** When the active hand has nothing to play, write `•` not `-`. `-` means this hand genuinely rests.

**Default 4 — Hand assignment follows position.** The hand that plays a sound is determined by where it falls in the alternation, not by what sound it is. Doums and notes swap hands freely.

---

## 9. Parser specification

```
Input:  HAT document string.
Output: metadata dict + list of sections,
        each with (name, repeat, stanzas[]),
        each stanza an ordered list of (R_cell, L_cell) timesteps.

── Pre-processing ──────────────────────────────────────────────────────────

1. Strip block comments: scan the full document string; remove all content
   from the first occurrence of "%%" to the next "%%", inclusive. Repeat
   until no "%%" pairs remain.

2. Strip inline comments: for each line that does NOT start with ";;",
   remove from the first "%" to end of line; trim trailing whitespace.
   Discard if the result is empty.

── Parsing ─────────────────────────────────────────────────────────────────

3. Scan lines top-to-bottom. Maintain: current_section (default unnamed).

   ";;HAT v…"         → set version; must be the first ;; line seen.
   ";;x-<key>: <val>" → store in metadata, take no further action.
   ";;<key>: <val>"   → store in metadata.
   "[name]"           → open new section, repeat = 1.
   "[name xN]"        → open new section, repeat = N.
   "R: …"  or "L: …" → body line; accumulate into current section.
   (anything else)    → skip.

── Stanza assembly ─────────────────────────────────────────────────────────

4. Within each section, pair consecutive R:/L: lines into stanzas.
   R must precede L; unpaired lines are a parse error.

5. For each stanza, process R and L in parallel:

   a. Strip the "R:" / "L:" prefix.

   b. Split on "||" → bars (discard empty leading/trailing tokens).

   c. Assert: R and L have the same bar count. Error otherwise.

   d. For each bar (R-bar, L-bar) in parallel:
        i.  Record "|" positions (cell indices) in R-bar.
        ii. Record "|" positions in L-bar.
        iii.If either set is non-empty and the two sets differ → PARSE ERROR.
             Subdivision positions must match exactly; L positions are not
             silently discarded.
        iv. Replace "|" with " " in both bars; split on whitespace → cells.
        v.  Assert: R-bar and L-bar yield the same cell count. Error otherwise.

   e. Parse each cell token (stripped of whitespace):

        '-'          → REST
        '•'          → GHOST
        'D' 'T' 'K'
        't' 'k' 'S'
        'd'          → HIT; if token[1] ∈ {'#','b','0'–'9'} AND token[0]=='D'
                         → NOTE (see note parsing below)
                       else modifier = token[1] if token[1]=='*' else None
        'A'–'G'
        (excl. above)→ NOTE

        '0'–'9'
        (all digits) → NUMBER; look up in note-number map (from ;;notes:/;;note-numbers:)
                         → resolve to the mapped note name → NOTE (as above)
                       if note-number map is not defined → PARSE ERROR
                       if number not found in map → PARSE ERROR
                       if leading zero and len > 1 (e.g. "07") → PARSE ERROR

        Note parsing:
          pitch ← token[0]
          i ← 1
          acc ← token[i] if token[i] ∈ {'#','b'} else ''
          if acc: i++
          octave ← token[i] if token[i].isdigit() else None
          if octave: i++
          modifier ← token[i] if i < len(token) and token[i]=='*' else None
          → Note(pitch, acc, octave, modifier)

── Validation ──────────────────────────────────────────────────────────────

6. Column constraints (per timestep i):
     All four column types are valid:
       (active, -)    (-, active)    (active, active)    (-, -)
     "active" = any symbol other than '-'.

7. Note validation (applied after header parsing, before body parsing):
     - If ";;notes:" is present, every note name used in the body must appear in
       that list → PARSE ERROR otherwise.
     - If exactly one of ";;notes:" / ";;note-numbers:" is present → PARSE ERROR.
     - If both are present:
         i.  The two lists must have the same entry count → PARSE ERROR if not.
         ii. All entries in ";;note-numbers:" must be valid 1–3 digit decimal
             integers with no leading zeros → PARSE ERROR otherwise.
         iii.Entries in ";;note-numbers:" must be unique → PARSE ERROR if duplicate.
         iv. Build the note-number map: number → note-name (parallel index).
         v.  Every note number used in the body must appear in the map
             → PARSE ERROR otherwise.

── Emission ────────────────────────────────────────────────────────────────

8. For each section, emit its stanzas in order, repeated `repeat` times.
   Each timestep (R_cell, L_cell) has duration = cell_duration(grid, tempo).

   Cell durations:
     4th          = 1 beat
     8th          = ½ beat
     16th         = ¼ beat
     32nd         = ⅛ beat
     triplet-4th  = ⅓ of a half-note  (= ⅔ beat)
     triplet-8th  = ⅓ of a beat
     triplet-16th = ⅓ of a half-beat
```

---

## 10. Worked examples

### A — Maqsoum (all defaults, 3-char Style A)

```
;;HAT v1.3.3
;;time: 4/4
;;grid: 8th

R: || D   | -   | •   | -   | D   | -   | T   | -   ||
L: || -   | K   | -   | K   | -   | •   | -   | •   ||
```

### B — Note targeting with sections

```
;;HAT v1.3.3
;;tuning: D Kurd
;;time: 4/4
;;grid: 8th
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5

[groove x2]
R: || D   | -   | •   | -   | D   | -   | T   | -   ||
L: || -   | K   | -   | K   | -   | •   | -   | •   ||

[melody]
R: || F#4 | -   | A4  | -   | B4  | -   | D5  | -   ||
L: || -   | K   | -   | K   | -   | K   | -   | K   ||
```

### C — Triplet-8th swing (3 cells per beat, 12 cells/bar in 4/4)

```
;;HAT v1.3.3
;;time: 4/4
;;grid: triplet-8th
;;tempo: 120

%% Each | group is one quarter-note beat (3 triplet-8th cells).
   R plays the downbeat, L plays the tail of each triplet. %%

R: || D   •   -   | D   •   -   | T   •   -   | T   •   -   ||
L: || -   -   K   | -   -   K   | -   -   K   | -   -   K   ||
```

### D — Muted taks and extension metadata

```
;;HAT v1.3.3
;;time: 4/4
;;grid: 8th
;;x-editor-id: session-42     % private extension, ignored by parsers

R: || D   | -   | t   | -   | D   | -   | T   | -   ||  % t = muted tak
L: || -   | k   | -   | K   | -   | •   | -   | •   ||  % k = muted tak-L
```

### E — 3-against-2 polyrhythm (Style B, silent steps)

```
;;HAT v1.3.3
;;time: 2/4
;;grid: 16th

R: || D - D - D - ||
L: || D - - D - - ||
```

Cell 1 is a unison `(D, D)`. Cells 2 and 6 are silent `(-, -)`. Both are valid.

### F — Note-number aliases (Style A)

```
;;HAT v1.3.3
;;tuning: D Kurd
;;time: 4/4
;;grid: 8th
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5
;;note-numbers: 0 1 2 3 4 5 6 7

[groove]
R: || D   | -   | •   | -   | D   | -   | T   | -   ||
L: || -   | K   | -   | K   | -   | •   | -   | •   ||

[melody]
R: || 2   | -   | 3   | -   | 4   | -   | 5   | -   ||
L: || -   | K   | -   | K   | -   | K   | -   | K   ||
```

`2` resolves to `F#4`, `3` to `A4`, `4` to `B4`, `5` to `D5`. The groove section uses standard hit symbols; the melody section uses note numbers. Both are valid in the same document.

---

## 11. Minimum well-formed document

```
;;HAT v1.3.3
;;grid: 8th

R: || D   ||
L: || -   ||
```

`;;grid:` is the only required key beyond the version declaration.
