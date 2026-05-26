# HAT Standard Extensions

Standard extensions are optional conventions built on top of the `;;x-*:` private-extension
namespace defined in the base HAT specification. Any conforming HAT parser must silently
preserve unknown `;;x-*:` keys in its metadata dictionary and must never error on them.

Extensions defined here are maintained alongside the base spec and are safe to use across
tools that support them. An extension's absence is never an error.

## Namespace rules (recap)

- All extension keys use the prefix `;;x-` followed by a lowercase hyphenated identifier.
- Parsers that do not recognize an extension **must** preserve the raw key/value and **must not** fail.
- In-document `;;notes:` / `;;note-numbers:` fields always take precedence over any external data.
- Extensions **must not** change the meaning of existing `;;` keys.
- Extensions **must not** require breaking changes to the base parser.

## Index

| File | Key | Summary |
|---|---|---|
| [x-note-json.md](x-note-json.md) | `;;x-note-json:` | External JSON note dictionary |
| [x-chord.md](x-chord.md) | `;;x-chord-<n>:` | Chord definitions and `c<n>` tokens |
| [x-author.md](x-author.md) | `;;x-author:` | Attribution / composer name |
| [x-color-scheme.md](x-color-scheme.md) | `;;x-color-scheme:` | Display theme hint for editors |
| [x-source.md](x-source.md) | `;;x-source:` | Link to recording or reference |

## Proposing new extensions

1. Add a new `x-<name>.md` file in this folder following the existing pattern.
2. Document the key name, value format, and semantics.
3. Define explicit fallback behaviour for tools that do not implement the extension.
4. The extension must not change the meaning of any existing base-spec key.
5. The extension must not require changes to the base parser.
