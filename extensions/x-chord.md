# x-chord — Chord definitions

```
;;x-chord-<n>: <note1> <note2> [<note3> …]
```

Defines a named chord (by number) as a space-separated list of note names.
Chord numbers can then be used in the tablature as `c<n>` tokens — the tool
plays or highlights all notes in the chord simultaneously on that cell.

Chord numbers must be positive integers. Note names must appear in the active
note map (`;;notes:` / `;;note-numbers:` / `;;x-note-json:`).

## Syntax

```
;;x-chord-1: D4 A4
;;x-chord-2: E4 B4
;;x-chord-3: F#4 A4 D5
```

In the tablature, use `c1`, `c2`, `c3`, etc.:

```
R: ||| c1  -   || c2  -   || c3  -   || c1  -   |||
```

## Semantics

- `c<n>` tokens are only valid in `R:` and `L:` lines.
- A conforming tool **may** render chord cells by showing all constituent notes
  simultaneously (e.g. stacked display, combined audio).
- A tool that does not support chords **must** preserve `c<n>` as an unknown
  note name and **must not** error.
- Chord tokens support the `*` flam modifier: `c1*`.
- A chord token `c0` is reserved and **must not** be used.
- Chord numbers are local to the file; they are not globally standardised.

## Example

```
;;HAT v1.3.4
;;title: Harmonic groove
;;notes:    D4 A4 E4 B4 F#4
;;note-numbers: 0  1  2  3  4
;;x-chord-1: D4 A4
;;x-chord-2: A4 E4

R: ||| c1  -   || c2  -   || c1  -   || c2  -   |||
L: ||| -   K   || -   K   || -   K   || -   K   |||
```
