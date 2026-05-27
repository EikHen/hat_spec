# HAT List — `.hatlist.json`

A HAT List is a JSON file that groups an ordered collection of HAT patterns into a named set — useful for setlists, lesson plans, or practice sequences.

---

## Structure

```json
{
  "version": 1,
  "type": "hat-list",
  "name": "Warm-up set",
  "patterns": [
    {
      "name": "Maqsoum",
      "cat": "Arabic",
      "time": "4/4",
      "grid": "8th",
      "hat": ";;HAT v1.3.4\n;;title: Maqsoum\n..."
    },
    {
      "name": "My groove",
      "time": "5/4",
      "grid": "8th",
      "hat": ";;HAT v1.3.4\n;;title: My groove\n..."
    }
  ]
}
```

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `version` | integer | yes | Format version. Currently `1`. |
| `type` | string | yes | Must be `"hat-list"`. |
| `name` | string | yes | Human-readable list name. |
| `patterns` | array | yes | Ordered list of pattern objects. |

### Pattern object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display name. |
| `hat` | string | yes | Full HAT document text (newlines as `\n`). |
| `cat` | string | no | Category label (e.g. `"Arabic"`). |
| `time` | string | no | Time signature (e.g. `"4/4"`). |
| `grid` | string | no | Grid subdivision (e.g. `"8th"`). |

The `hat` field is authoritative. `name`, `cat`, `time`, and `grid` are display metadata; they should match the `;;title:`, `;;time:`, and `;;grid:` headers inside `hat` but are not required to.

---

## File extension and MIME type

`.hatlist.json` · `application/json`

---

## Notes

- Order in `patterns` is significant; tools must preserve it.
- The file is self-contained: all HAT text is embedded so no external dependencies are needed to share it.
- For an unordered bundle of custom patterns use `"type": "hat-custom-patterns"` and omit `name`. The `patterns` array structure is identical.
