# x-note-json — External note dictionary

```
;;x-note-json: <url-or-path>
```

Points to a JSON file that maps note names to note numbers. Allows sharing a tuning
dictionary across multiple HAT files without repeating `;;notes:` and `;;note-numbers:` inline.

## JSON format

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

## Semantics

- A conforming tool **may** fetch/read the referenced file and populate its note tables from it.
- `;;notes:` and `;;note-numbers:` in the document always take precedence.
- If the file is unavailable, the tool **must** continue parsing using only in-document fields.
- Integer and string values are equivalent (`5` and `"5"` both map to note number 5).
- Duplicate names or numbers within the JSON → tool-defined behaviour; a warning is recommended.

## Example

```
;;HAT v1.3.4
;;tuning: D Kurd 9
;;x-note-json: ./tunings/d-kurd-9.json

R: ||| D   -   || T   -   || D   -   || T   -   |||
L: ||| -   K   || -   K   || -   •   || -   •   |||
```
