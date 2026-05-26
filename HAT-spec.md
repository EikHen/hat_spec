# HAT — Handpan ASCII Tab v1.3.4

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
| v1.3.4 | Separator hierarchy redesigned: `\|` visual-only, `\|\|` beat boundary, `\|\|\|` bar boundary; formal BPM definition via beat groups; optional `C:` subdivision-count line |

---

## 1. Document structure

A HAT document has three layers, all optional except the version line:

1. **File header** — `;;` metadata lines.
2. **Section labels** — `[name]` or `[name xN]` lines grouping stanzas.
3. **Stanzas** — optional `C:` count line followed by mandatory `R:` / `L:` line pairs.

```
;;HAT v1.3.4
;;title: Groove in D Kurd
;;tempo: 120
;;time: 4/4
;;grid: 8th
;;tuning: D Kurd
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5

[intro]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| D  - || •  - || D  - || T  - |||
L: ||| -  K || -  K || -  • || -  • |||

[melody]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| F#4 - || A4  - || B4  - || D5  - |||
L: ||| -  K  || -  K  || -  K  || -  K  |||
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
| `S` | Slap / knock — any percussive body hit (slap on shell, knock on port, rim hit) |
| `s` | Slap / knock, muted — same as `S` but damped |
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

In **Style A** (aligned), every cell is exactly **3 characters**, separated by whitespace within beat groups. In **Style B** (compact), cells are whitespace-separated with no fixed width.

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

### Note names

A note name targets a specific tone field and implies a standard tone-field strike. The playing hand is determined by the line (R or L).

Format: `[A–G][#\|b]?[0–9]` — pitch class, optional accidental, octave digit.

**Disambiguation:** `D` alone (no digit or accidental following) = Doum. `D` followed by `#`, `b`, or a digit = the note D.

### Separators

| Token | Role |
|---|---|
| `\|\|\|` | **Bar boundary** — mandatory at the start and end of each bar; separates bars on a single line |
| `\|\|` | **Beat boundary** — separates beats within a bar; defines the BPM unit (see §4) |
| `\|` | **Visual sub-group** — optional, carries no formal constraint; useful to mark sub-beat groupings that align with the `C:` count line |
| whitespace | Cell separator within a beat group |

The hierarchy is strict: `|||` > `||` > `|` > whitespace. A `||` token is always a beat boundary, never accidentally a bar boundary; `|||` is always a bar boundary.

### Count line — `C:`

An optional `C:` line immediately above an `R:` / `L:` stanza labels each grid cell with its rhythmic position. Valid `C:` tokens are:

- Positive integers with no leading zeros (e.g. `1`, `2`, `12`)
- The symbols `e`, `&`, and `a`

The `C:` line must use the same `|||` / `||` structure as the accompanying `R:` / `L:` lines. The token count per beat (between `||` markers) must equal the R/L cell count for that beat. `|` sub-group markers are optional in `C:` lines.

**Recommended count syllables:**

| Grid / meter | Beat count syllables |
|---|---|
| 8th notes, simple meter | `1 &` (2 per beat) |
| 16th notes, simple meter | `1 e & a` (4 per beat) |
| 8th notes, compound (dotted-quarter beat) | `1 e &` or `1 & a` (3 per beat) |
| 4th notes, any meter | `1` (1 per beat — use `||` between every cell) |
| Asymmetric beat of 3 | `1 e &` or `1 & a` |
| Asymmetric beat of 2 | `1 &` |

---

## 4. Beats and tempo

### Beat definition

A **beat** is the rhythmic unit spanned by one `||` group (cells between two consecutive `||` markers within a bar, or between the opening `|||` and the first `||`, or between the last `||` and the closing `|||`).

`;;tempo: X` specifies **X beats per minute**, where one beat = one `||` group.

### Relationship to grid

The cell duration (`;;grid:`) combined with the cells-per-beat count determines the actual note value of one beat:

| Grid | Cells per beat | Beat note value |
|---|---|---|
| `8th` | 2 | quarter note (♩) |
| `8th` | 3 | dotted quarter (♩.) |
| `16th` | 4 | quarter note (♩) |
| `16th` | 2 | eighth note (♪) |
| `4th` | 1 | quarter note (♩) |
| `4th` | 2 | half note (𝅗𝅥) |

This makes `;;tempo:` unambiguous regardless of grid resolution: a pattern in `8th` grid with `||` every 2 cells and one in `16th` grid with `||` every 4 cells both express ♩ = tempo.

### Asymmetric meters

In asymmetric patterns (e.g. 7/8 with 3+2+2 beat grouping), beat groups may differ in length. `||` marks the felt beat pulse; BPM refers to the rate of those felt beats. Performers feel 3 beats per bar in 7/8 (3+2+2), even though the first beat is longer than the others.

For quarter-note grids in asymmetric compound cycles (e.g. Rupak 7/4 in 3+2+2), the `||` groups represent the phrase-level beats (3, 2, 2 quarter notes) and BPM = phrase-beats per minute.

---

## 5. Layout

Body lines come in stanzas. Each stanza consists of an optional `C:` line followed by mandatory `R:` and `L:` lines:

```
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| X  X || X  X || X  X || X  X |||
L: ||| X  X || X  X || X  X || X  X |||
```

Multiple stanza pairs may appear within one section to break long patterns across lines. Multi-bar patterns may be written on a single R/L/C line with `|||` separating bars:

```
C: ||| 1  & || 2  & ||| 1  & || 2  & |||
R: ||| D  - || T  - ||| D  - || T  - |||
L: ||| -  K || -  K ||| -  K || -  K |||
```

---

## 6. Header keys

| Key | Meaning |
|---|---|
| `HAT v1.3.4` | Version declaration — must be the first `;;` line |
| `title:` | Pattern or song name |
| `tempo:` | Beats (`\|\|` groups) per minute |
| `time:` | Time signature, e.g. `4/4`, `7/8`, `12/8` |
| `grid:` | Cell duration — see grid table below |
| `subdivision:` | Beat grouping for asymmetric meters, e.g. `3+2+2` |
| `tuning:` | Handpan tuning, e.g. `D Kurd` |
| `notes:` | Available note names, space-separated, e.g. `D4 E4 F#4 A4 B4` |
| `note-numbers:` | Numbers aliasing each note in `notes:`, same order (see §6.1) |
| `legend:` | Freeform symbol legend |
| `x-*:` | Private extension — any key starting with `x-` |

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

Any `;;` key beginning with `x-` is a private extension. Parsers must silently preserve its value in the metadata dict but must not act on it.

### §6.1 Note-number aliases

When `;;notes:` and `;;note-numbers:` are both present, each note name in `;;notes:` is aliased by the corresponding number in `;;note-numbers:`. In the tablature body, a 1–3 digit decimal number is treated exactly like the note name it aliases.

**Constraints:**

- Both `;;notes:` and `;;note-numbers:` must appear together. Providing only one is a parse error.
- The two lists must have the same number of entries. A length mismatch is a parse error.
- Each number in `;;note-numbers:` must be unique. Duplicate numbers are a parse error.
- Numbers are 1–3 decimal digits (range 0–999). Leading zeros are not permitted.
- When `;;notes:` is present, every note name and every resolved note number used in the body must appear in the `;;notes:` list → PARSE ERROR otherwise.

---

## 7. Sections

```
[intro]               % plays once (default)
[verse x2]            % plays twice total
[chorus]
```

- Section names are any non-whitespace token inside `[...]`.
- `xN` (integer ≥ 2) declares the section plays N times in total.
- A section label applies to **all consecutive stanzas that follow it**, until the next label or end of file.
- If no label precedes the first stanza, those stanzas belong to an implied unnamed section.

---

## 8. Comments

### Inline comments — `%`

`%` starts a comment running to end of line. Valid anywhere in a body line or on its own line.

`%` inside a `;;` metadata line is **not** treated as a comment.

### Block comments — `%% … %%`

`%%` opens a block comment; the next `%%` closes it. Everything between (including newlines) is stripped.

**Processing order:** block comments are stripped first (global pass), then inline `%` comments are stripped line by line, then parsing proceeds.

---

## 9. Playability defaults

**Default 1 — One hand active per column.** Exactly one of (R, L) plays or ghosts; the other rests.
> *Relaxation:* Both may be active `(active, active)` for polyrhythms and unisons. Both may rest `(-, -)` at a genuine silence.

**Default 2 — Strict alternation.** One hand owns odd cells, the other owns even cells.
> *Relaxation:* Break alternation for asymmetric groupings (3+3+2, swing, clave) when felt phrasing demands it.

**Default 3 — Ghosts maintain the active hand's pulse.** When the active hand has nothing to play, write `•` not `-`.

**Default 4 — Hand assignment follows position.** The hand that plays a sound is determined by where it falls in the alternation, not by what sound it is.

---

## 10. Parser specification

```
Input:  HAT document string.
Output: metadata dict + list of sections,
        each with (name, repeat, stanzas[]),
        each stanza: optional count_line[] + ordered list of (R_cell, L_cell) timesteps.

── Pre-processing ──────────────────────────────────────────────────────────

1. Strip block comments: remove all content between "%%" pairs.

2. Strip inline comments: for each non-";;" line, remove from first "%" to
   end of line; discard empty results.

── Version detection ───────────────────────────────────────────────────────

3. Read the first ";;" line. If it is ";;HAT v1.3.4" or later, apply the
   v1.3.4 separator semantics (||| = bar, || = beat, | = visual).
   If it is ";;HAT v1.3.3" or earlier, apply legacy semantics
   (|| = bar, | = subdivision group — both carry formal constraints).
   If no version line is present, assume v1.3.4 semantics.

── Parsing ─────────────────────────────────────────────────────────────────

4. Scan lines top-to-bottom. Maintain: current_section (default unnamed).

   ";;HAT v…"         → set version.
   ";;x-<key>: <val>" → store in metadata, take no further action.
   ";;<key>: <val>"   → store in metadata.
   "[name]"           → open new section, repeat = 1.
   "[name xN]"        → open new section, repeat = N.
   "C: …"             → count line; pair with next R:/L: stanza.
   "R: …" or "L: …"  → body line; accumulate into current section.
   (anything else)    → skip.

── Stanza assembly (v1.3.4 semantics) ──────────────────────────────────────

5. Within each section, pair consecutive R:/L: lines into stanzas.
   A preceding C: line (if any) belongs to that stanza.
   Unpaired R: or L: lines are a parse error.

6. For each stanza, process R and L (and optional C) in parallel:

   a. Strip the "R:" / "L:" / "C:" prefix.

   b. Split on "|||" → bars (discard empty leading/trailing tokens).
      Assert: R and L have the same bar count. Error otherwise.

   c. For each bar, split on "||" → beats.
      Assert: R and L have the same beat count per bar. Error otherwise.

   d. Within each beat, record "|" positions (cell indices) in R and L.
      If both R and L have "|" markers and they differ → PARSE ERROR.
      (If only one line has "|" markers and the other does not, the
      markers are silently treated as absent — they are visual only.)
      Replace "|" with whitespace; split on whitespace → cells.
      Assert: R and L yield the same cell count per beat. Error otherwise.

   e. Parse each cell token:
        '-'            → REST
        '•'            → GHOST
        'D' 'T' 'K'
        't' 'k' 'S'
        'd'            → HIT (see note disambiguation below)
        'A'–'G'
        (excl. above)  → NOTE
        '0'–'9'
        (all digits)   → NUMBER; resolve via note-number map → NOTE
                         if map absent or number unknown → PARSE ERROR
                         if leading zero and len > 1 → PARSE ERROR

      Note disambiguation: 'D' followed by '#', 'b', or a digit → NOTE.
      Note parsing: pitch [acc] [octave] [modifier '*']

   f. If a C: line is present for this stanza:
        i.  Apply the same "|||" / "||" / "|" splitting as R/L.
        ii. Assert: bar count and beat count match R/L. Error otherwise.
        iii.Assert: cell count per beat matches R/L. Error otherwise.
        iv. Assert: each token is a positive integer (no leading zeros),
            'e', '&', or 'a'. Any other token → PARSE ERROR.
        v.  Store count tokens paired 1-to-1 with (R, L) timesteps.

── Beat metadata ────────────────────────────────────────────────────────────

7. For each stanza, record for each timestep:
     bar_index       — 0-based bar number
     beat_index      — 0-based beat within bar
     col_index       — 0-based cell within beat
     sub_group       — 0-based "|" visual-group index within beat (if any)
     count_token     — C: token for this timestep (or null)

── Validation ──────────────────────────────────────────────────────────────

8. Column constraints (per timestep i):
     All four column types are valid:
       (active, -)    (-, active)    (active, active)    (-, -)

9. Note validation (applied after header parsing):
     If ";;notes:" is present, every note name used in the body must
     appear in that list → PARSE ERROR otherwise.
     If exactly one of ";;notes:" / ";;note-numbers:" is present → PARSE ERROR.
     If both are present: apply §6.1 constraints.

── Emission ────────────────────────────────────────────────────────────────

10. For each section, emit its stanzas repeated `repeat` times.
    Each timestep (R_cell, L_cell) has duration = cell_duration(grid).
    One beat = cells_per_beat × cell_duration; tempo = beats per minute.

    Cell durations:
      4th          = 1 quarter note
      8th          = 1 eighth note
      16th         = 1 sixteenth note
      32nd         = 1 thirty-second note
      triplet-4th  = ⅓ of a half-note
      triplet-8th  = ⅓ of a quarter note
      triplet-16th = ⅓ of an eighth note
```

---

## 11. Worked examples

### A — Maqsoum (4/4, 8th note, quarter-note beats)

```
;;HAT v1.3.4
;;time: 4/4
;;grid: 8th
;;tempo: 120

C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| D  - || •  - || D  - || T  - |||
L: ||| -  K || -  K || -  • || -  • |||
```

Four beats, two 8th notes each. At ;;tempo: 120, one beat = 0.5 s → ♩ = 120.

### B — Note targeting with sections

```
;;HAT v1.3.4
;;tuning: D Kurd
;;time: 4/4
;;grid: 8th
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5

[groove x2]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| D  - || •  - || D  - || T  - |||
L: ||| -  K || -  K || -  • || -  • |||

[melody]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| F#4 - || A4  - || B4  - || D5  - |||
L: ||| -  K  || -  K  || -  K  || -  K  |||
```

### C — Compound meter: Reng (6/8, dotted-quarter beats)

```
;;HAT v1.3.4
;;time: 6/8
;;grid: 8th
;;tempo: 60

C: ||| 1  e  & || 2  e  & |||
R: ||| D  -  T || -  •  - |||
L: ||| -  •  - || D  -  K |||
```

Two beats, three 8th notes each. At ;;tempo: 60, one beat = 1 s → ♩. = 60.

### D — Asymmetric meter: Persian 7/8 (3+2+2 beat groups)

```
;;HAT v1.3.4
;;time: 7/8
;;grid: 8th
;;subdivision: 3+2+2
;;tempo: 100

C: ||| 1  e  & || 2  & || 3  & |||
R: ||| D  -  • || T  - || T  - |||
L: ||| -  •  - || -  • || -  • |||
```

Three felt beats of 3, 2, 2 eighth notes. ;;tempo: 100 = 100 felt beats per minute.

### E — 16th note grid with optional `|` visual sub-groups

```
;;HAT v1.3.4
;;time: 2/4
;;grid: 16th
;;tempo: 120

C: ||| 1  e | &  a || 2  e | &  a |||
R: ||| D  - | •  - || •  - | T  - |||
L: ||| -  • | -  K || -  • | -  • |||
```

Two beats of four 16th notes each. The `|` markers subdivide each beat into pairs of 16th notes (visual only — parsers may ignore mismatches). At ;;tempo: 120, ♩ = 120.

### F — Indian tala: Keherwa (8/4, quarter-note grid)

```
;;HAT v1.3.4
;;time: 8/4
;;grid: 4th
;;subdivision: 4+4
;;tempo: 80

C: ||| 1 || 2 || 3 || 4 ||| 1 || 2 || 3 || 4 |||
R: ||| D || - || • || - ||| D || - || T || - |||
L: ||| - || K || - || • ||| - || K || - || • |||
```

Two bars of four quarter-note beats. ;;tempo: 80 → ♩ = 80.

### G — Multi-bar pattern: Son Clave 3-2

```
;;HAT v1.3.4
;;time: 4/4
;;grid: 8th
;;tempo: 120

C: ||| 1  & || 2  & || 3  & || 4  & ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| D  - || •  - || •  - || D  - ||| •  - || T  - || T  - || •  - |||
L: ||| -  • || -  D || -  • || -  • ||| -  • || -  • || -  • || -  • |||
```

### H — Note-number aliases

```
;;HAT v1.3.4
;;tuning: D Kurd
;;time: 4/4
;;grid: 8th
;;notes: D4 E4 F#4 A4 B4 D5 E5 F#5
;;note-numbers: 0 1 2 3 4 5 6 7

[groove]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| D  - || •  - || D  - || T  - |||
L: ||| -  K || -  K || -  • || -  • |||

[melody]
C: ||| 1  & || 2  & || 3  & || 4  & |||
R: ||| 2  - || 3  - || 4  - || 5  - |||
L: ||| -  K || -  K || -  K || -  K |||
```

### I — Triplet feel (triplet-8th grid)

```
;;HAT v1.3.4
;;time: 4/4
;;grid: triplet-8th
;;tempo: 120

%% Each || group is one quarter-note beat (3 triplet-8th cells). %%

C: ||| 1  e  & || 2  e  & || 3  e  & || 4  e  & |||
R: ||| D  •  - || D  •  - || T  •  - || T  •  - |||
L: ||| -  -  K || -  -  K || -  -  K || -  -  K |||
```

---

## 12. Minimum well-formed document

```
;;HAT v1.3.4
;;grid: 8th

R: ||| D |||
L: ||| - |||
```

`;;grid:` is the only required key beyond the version declaration. A single bar with a single beat containing a single cell is valid.

---

## 13. Legacy compatibility (v1.3.3 and earlier)

Parsers that support multiple versions should detect the version from the `;;HAT v…` header and apply the corresponding separator semantics:

| Version | Bar separator | Beat/subdivision separator |
|---|---|---|
| v1.3.3 and earlier | `\|\|` | `\|` (formal, positions must match R/L) |
| v1.3.4 and later | `\|\|\|` | `\|\|` (beats); `\|` visual only |

A v1.3.4 parser receiving a v1.3.3 document should re-parse using `||` as bar boundaries. The `C:` line is not present in v1.3.3 documents.
