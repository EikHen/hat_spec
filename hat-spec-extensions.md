# HAT Standard Extensions

**Version:** 1.0
**Status:** Draft
**Companion to:** HAT-spec.md

Standard extensions are optional conventions built on top of the `;;x-*:` private-extension
namespace defined in the base HAT specification. Any conforming HAT parser must silently
preserve unknown `;;x-*:` keys in its metadata dictionary and must never error on them.

Extensions defined here are maintained alongside the base spec and are safe to use across
tools that support them. An extension's absence is never an error.

---

## Extension namespace rules (recap)

- All extension keys use the prefix `;;x-` followed by a lowercase hyphenated identifier.
- Parsers that do not recognize an extension **must** preserve the raw key/value and **must not** fail.
- In-document `;;notes:` / `;;note-numbers:` fields always take precedence over any external data.
- Extensions **must not** change the meaning of existing `;;` keys.
- Extensions **must not** require breaking changes to the base parser.

---

## x-note-json — External note dictionary

```
;;x-note-json: <url-or-path>
```

Points to a JSON file that maps note names to note numbers. Allows sharing a tuning
dictionary across multiple HAT files without repeating `;;notes:` and `;;note-numbers:` inline.

### JSON format

A single JSON object. Keys are note name strings (same format as `;;notes:` entries).
Values are note numbers as integers or numeric strings.

```json
{
  "D4":  0,
  "E4":  1,
  "F#4": 2,
  "A4":  3,
  "B4":  4,
  "D5":  5,
  "E5":  6,
  "F#5": 7
}
```

### Semantics

- A conforming tool **may** fetch/read the referenced file and populate its note tables from it.
- `;;notes:` and `;;note-numbers:` in the document always take precedence.
- If the file is unavailable, the tool **must** continue parsing using only in-document fields.
- Integer and string values are equivalent (`5` and `"5"` both map to note number 5).
- Duplicate names or numbers within the JSON → tool-defined behaviour; a warning is recommended.

### Example

```
;;HAT v1.3.4
;;tuning: D Kurd 9
;;x-note-json: ./tunings/d-kurd-9.json

R: ||| D   -   || T   -   || D   -   || T   -   |||
L: ||| -   K   || -   K   || -   •   || -   •   |||
```

---

## x-chord — Chord definitions

```
;;x-chord-<n>: <note1> <note2> [<note3> …]
```

Defines a named chord (by number) as a space-separated list of note names.
Chord numbers can then be used in the tablature as `c<n>` tokens — the tool
plays or highlights all notes in the chord simultaneously on that cell.

Chord numbers must be positive integers. Note names must appear in the active
note map (`;;notes:` / `;;note-numbers:` / `;;x-note-json:`).

### Syntax

```
;;x-chord-1: D4 A4
;;x-chord-2: E4 B4
;;x-chord-3: F#4 A4 D5
```

In the tablature, use `c1`, `c2`, `c3`, etc.:

```
R: ||| c1  -   || c2  -   || c3  -   || c1  -   |||
```

### Semantics

- `c<n>` tokens are only valid in `R:` and `L:` lines.
- A conforming tool **may** render chord cells by showing all constituent notes
  simultaneously (e.g. stacked display, combined audio).
- A tool that does not support chords **must** preserve `c<n>` as an unknown
  note name and **must not** error.
- Chord tokens support the `*` flam modifier: `c1*`.
- A chord token `c0` is reserved and **must not** be used.
- Chord numbers are local to the file; they are not globally standardised.

### Example

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

---

## x-author — Attribution

```
;;x-author: <freeform string>
```

Composer or transcriber name. Tools may display this in metadata panels or export headers.

**Example:**

```
;;x-author: Manu Delago
```

---

## x-color-scheme — Display hint

```
;;x-color-scheme: <identifier>
```

Suggests a preferred rendering theme to editors. Defined identifiers: `dark`, `light`,
`high-contrast`. Editors **may** ignore this.

---

## x-source — Recording or reference link

```
;;x-source: <url>
```

A URL pointing to a recording, video, or reference transcription the pattern was derived from.
Tools may display this as a clickable link.

---

## Proposing new standard extensions

1. Document the key name, value format, and semantics in a PR against this file.
2. Define explicit fallback behaviour for tools that do not implement the extension.
3. The extension must not change the meaning of any existing base-spec key.
4. The extension must not require changes to the base parser.
