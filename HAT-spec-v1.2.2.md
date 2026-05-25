# HAT — Handpan ASCII Tab v1.2.2

A plain-text notation system for handpan rhythms. Human-readable in monospace fonts, trivially machine-parseable.

## What's new in v1.2

- **Playability rules relaxed** — strict alternation and one-hand-per-position are now defaults, not requirements. They may be broken when the felt rhythm demands it.
- **Subdivision separators (`|`) are now optional** within a bar. When included, they must reflect the felt rhythm and match between R and L lines.
- **Simultaneous strikes allowed** — both hands may play the same cell whenever the rhythm calls for it.

## What's new in v1.2.2

- **Subdivision minimalism rule** — use the fewest `|` markers that correctly convey the felt grouping.
- **Silent columns explicitly allowed** — a `(-, -)` column is a valid silent time step. The v1.2 parser validation rule that prohibited `(-, -)` was self-contradictory with the 3-against-2 polyrhythm example and is removed.
- **Simultaneous strikes clarified** — both hands active in the same column is allowed whenever the rhythm requires it, not only for polyrhythms.

---

## 1. Document structure

A HAT document has two parts:

1. **Header** — lines prefixed with `;;` containing metadata.
2. **Body** — pairs of `R:` and `L:` lines containing the rhythm.

```
;;HAT v1.2.2
;;title: Maqsoum
;;tempo: 90
;;time: 4/4
;;grid: 8th
;;tuning: D Kurd

R: || D  | -  | •  | -  | D  | -  | T  | -  ||
L: || -  | K  | -  | K  | -  | •  | -  | •  ||
```

---

## 2. Symbols

### Hit symbols (first character of a cell)

| Symbol | Meaning |
|---|---|
| `D` | Doum — bass / center note ("ding") |
| `T` | Tak — edge tone, conventionally used in the **R line** |
| `K` | Tak — edge tone, conventionally used in the **L line** |
| `S` | Slap |
| `d` | Doum, muted |
| `•` | Ghost note (felt, not heard) |
| `-` | Rest — this hand does nothing this cell |

### Modifier symbols (second character of a cell, optional)

| Symbol | Meaning |
|---|---|
| `*` | Flam (grace note before main hit) |
| _(omitted)_ | No modifier |

The modifier slot is reserved for future extension. When present, it is always exactly one character immediately following the hit symbol.

**T / K convention:** Both `T` and `K` produce the same tak sound; the distinction is purely notational. By convention, write `T` for taks in the R line and `K` for taks in the L line. This lets a reader identify the playing hand at a glance, without having to check which line a cell belongs to. Parsers must accept both symbols in either line — the convention is a readability guideline, not a validity constraint.

---

## 3. Cells and separators

A cell is `[hit]` or `[hit][modifier]` — 1 or 2 characters.

| Token | Meaning |
|---|---|
| `\|\|` | Bar separator (mandatory) |
| `\|` | Subdivision separator (optional) |
| whitespace | Cell separator |

Two equivalent styles within a bar:

**Style A — with subdivisions** (each cell padded to 2 chars for vertical alignment with `|`):

```
|| D  | -  | T* | -  ||
|| -  | •  | -  | •  ||
```

**Style B — without subdivisions** (cells separated by whitespace):

```
|| D - T* - ||
|| - • - • ||
```

Style A and B are semantically identical. When subdivisions are present, they should group cells by the felt rhythm (e.g. by beat in a fine grid, or by sub-group in an asymmetric meter). **Subdivision positions must match between the R and L lines of a stanza.**

### Subdivision minimalism

Use the **fewest `|` markers** that correctly convey the felt grouping. Specifically:

- Mark musically meaningful boundaries only — beat boundaries, phrase boundaries, or sub-group separators in asymmetric meters (e.g. one `|` per group in a 3+2+2).
- Never add `|` between every cell just because the grid is fine.
- If no grouping clarity is gained, omit `|` entirely and use Style B.
- The coarsest grouping that preserves the rhythm's phrasing intent is the correct one.

**Examples:**

| Situation | Good | Avoid |
|---|---|---|
| 4/4 in 8ths (8 cells) | No `\|`, or one `\|` at the halfway point | `\|` between every cell |
| 3+2+2 in 7/8 (7 cells) | `\|` after cells 3 and 5 | `\|` after every cell or after cell 4 |
| 3+3+2 in 16ths (8 cells) | `\|` after cells 3 and 6 | `\|` at the halfway point (breaks the felt grouping) |

---

## 4. Layout

The body is composed of `R:` / `L:` line pairs. `R` is the right hand, `L` is the left hand. Cells in R must vertically align with their counterparts in L (whether using Style A or B).

```
R: || X | X | X | X ||
L: || X | X | X | X ||
```

Multiple pairs may appear in sequence to break long patterns across lines.

---

## 5. Header keys

| Key | Meaning |
|---|---|
| `HAT v1.2.2` | Version declaration (first line, no key) |
| `title:` | Pattern name |
| `tempo:` | Beats per minute |
| `time:` | Time signature (e.g. `4/4`, `2/4`, `6/8`) |
| `grid:` | Smallest subdivision (`8th`, `16th`, etc.) |
| `tuning:` | Handpan tuning (e.g. `D Kurd`) |
| `legend:` | Optional inline legend |

Any `;;` line is metadata. Order is not significant beyond the version declaration appearing first.

---

## 6. Playability defaults

These are recommended defaults for natural playability. A generator should follow them **unless the rhythm specifically requires otherwise** — in which case the relaxations below apply.

### Default 1 — One hand active per position

At every cell column, exactly one hand has something (hit or ghost) and the other has `-`.

> **Relaxation:** Both hands may be active in the same column `(active, active)` whenever the rhythm calls for it — for polyrhythms, unison accents, or any moment where both hands naturally coincide. Both hands may also be silent `(-, -)` at the same column when the rhythm has a genuine rest at that position.

### Default 2 — Strict alternation

Hands alternate at the grid resolution: one hand owns even cells, the other owns odd cells.

> **Relaxation:** For asymmetric groupings (3+3+2, 6/8 swing, son clave, etc.) a single hand may take consecutive cells when this serves the felt rhythm better than forced alternation. Still keep one hand active per position (Default 1) unless the rhythm has a genuine rest.

### Default 3 — Ghosts maintain the active hand's pulse

When the hand whose "turn" it is has no audible hit at a position, write `•` (ghost), not `-`. `-` is reserved for the hand whose turn it isn't, or for a genuine full rest where neither hand plays.

### Default 4 — Hand assignment follows position

Which hand plays a given sound is determined by where it falls in the alternation, not by the sound itself. Doums can swap hands freely when alternation requires it. When alternation is relaxed (Default 2 broken), hand assignment is guided by the felt phrase structure instead.

---

## 7. Parser specification

```
Input: a HAT document (string).
Output: metadata dict + ordered list of timesteps, each with (R_event, L_event).

Algorithm:
1. Split input into lines.
2. For each line:
   a. If starts with ";;": parse as metadata (first such line matches "HAT v<version>";
      others match "key: value").
   b. If starts with "R:" or "L:": treat as body line.
   c. Otherwise: skip.
3. Pair consecutive R:/L: lines into stanzas. R precedes L.
4. For each stanza:
   a. Strip the "R:" / "L:" prefix.
   b. Split the remainder on "||" → bars (discard empty leading/trailing splits).
   c. For each bar:
      - Replace "|" with " " (subdivisions are purely visual, no semantic role).
      - Split on whitespace → cells.
      - For each cell:
        * char[0] → hit symbol; must be one of: D T K S d • -
        * char[1] (if present) → modifier; must be * (or space, treated as none)
   d. Assert R and L have same bar count and same cell count per bar.
5. Emit timeline: at each cell index i, produce (R_cell, L_cell).
   Cell duration is the grid value at the given tempo.

Validation:
- If "|" subdivisions are present, their cell-index positions must match between R and L.
- A column may be any of:
    (active, -)   — R plays, L rests
    (-, active)   — L plays, R rests
    (active, active) — both hands play (unison, polyrhythm, or coinciding accent)
    (-, -)        — silent step; both hands rest at this time position
- "Active" means any symbol other than "-".
- No other constraint is placed on column content.
```

---

## 8. Worked examples

### Example A — Maqsoum (follows all defaults)

```
;;HAT v1.2.2
;;title: Maqsoum
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | D  | -  | T  | -  ||
L: || -  | K  | -  | K  | -  | •  | -  | •  ||
```

Strict R-on-downbeats, L-on-offbeats alternation. All defaults satisfied. One `|` per beat to mark the 4/4 feel — the minimum grouping that makes the beat structure clear. The Maqsoum is a single conceptual phrase, so it occupies one bar.

### Example B — 3+3+2 grouping (Default 2 relaxed)

```
;;HAT v1.2.2
;;title: 3+3+2 layer
;;grid: 8th

R: || D  •  -  | D  •  -  | T  -  ||
L: || -  -  •  | -  -  •  | -  •  ||
```

R takes two consecutive cells (hit + ghost) before L enters. Alternation breaks to follow the 3+3+2 felt grouping. Default 1 still holds. Subdivisions use exactly two `|` markers — one after each group of 3 and after the group of 2 — the minimum that conveys the asymmetric phrasing.

### Example C — 3-against-2 polyrhythm

```
;;HAT v1.2.2
;;title: 3 over 2
;;time: 2/4
;;grid: 16th

R: || D - D - D - ||
L: || D - - D - - ||
```

R plays three even doums (every 2 cells), L plays two even doums (every 3 cells). Column breakdown:

| Cell | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| R | D | - | D | - | D | - |
| L | D | - | - | D | - | - |
| Type | (D,D) | (-,-) | (D,-) | (-,D) | (D,-) | (-,-) |

Cells 1 is a unison strike `(active, active)`. Cells 2 and 6 are silent steps `(-, -)`. Both are valid in v1.2.2. Subdivisions omitted — Style B is sufficient for this sparse pattern.

### Example D — No subdivisions (Style B)

```
R: || D - • - D - T - ||
L: || - K - K - • - • ||
```

Semantically identical to Example A's Maqsoum, written without `|` subdivision markers. Style B is preferred here since a single bar of 8 cells is easy to read without grouping aids.

---

## 9. Minimum well-formed document

```
;;HAT v1.2.2
;;grid: 8th

R: || D - ||
L: || - • ||
```

Two cells, one bar, valid.
