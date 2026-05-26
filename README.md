```
  ██╗  ██╗ █████╗ ████████╗
  ██║  ██║██╔══██╗╚══██╔══╝
  ███████║███████║   ██║
  ██╔══██║██╔══██║   ██║
  ██║  ██║██║  ██║   ██║
  ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝
  Handpan ASCII Tablature
```

HAT is a plain-text tablature format for handpan and tongue drum.
It captures rhythm, dynamics, and tuning in a format that is readable in any text editor,
version-controllable with git, and trivially parseable by tools.

---

## What HAT provides

| Need | HAT answer |
|---|---|
| Write down a rhythm | R: / L: lines with hit symbols |
| Show beat structure | `\|\|\|` bar · `\|\|` beat · `\|` visual group |
| Count/subdivisions | C: line with `1 e & a` tokens |
| Specific notes | `;;notes:` + `;;note-numbers:` or `;;x-note-json:` |
| Dynamics / flams | `*` modifier (e.g. `D*`) |
| Multiple sections | `;;section: verse` |
| Sharing / archiving | Plain UTF-8 text, `.hat.txt` extension |

---

## Quick example — Maqsoum (4/4, eighth notes)

```
;;HAT v1.3.4
;;title: Maqsoum
;;time: 4/4
;;grid: 8th

C: ||| 1   &   || 2   &   || 3   &   || 4   &   |||
R: ||| D   -   || •   -   || D   -   || T   -   |||
L: ||| -   K   || -   K   || -   •   || -   •   |||
```

Reading it:

- `|||` opens and closes the bar.
- `||` marks beat boundaries (4 beats here).
- `C:` gives the count — beat 1 lands on `D` (Doum), beat 2 on ghost (`•`), etc.
- `R:` is the right hand, `L:` the left hand.
- `D` Doum · `T` Tak (right) · `K` Tak (left) · `S` Slap/knock · `•` ghost · `-` rest

---

## With a tuning map

```
;;HAT v1.3.4
;;title: Scale run
;;tuning: D Kurd 9
;;notes:    D4 E4 F#4 A4 B4 D5 E5 F#5 A5
;;note-numbers: 0  1  2   3  4  5  6  7   8

R: ||| 0  1  2  3  4  5  6  7  8 |||
L: ||| -  -  -  -  -  -  -  -  - |||
```

Numeric tokens resolve to named notes via the `;;notes:` / `;;note-numbers:` map.
An external JSON dictionary can replace the inline map via `;;x-note-json:` (see
`hat-spec-extensions.md`).

---

## Files

| File | Description |
|---|---|
| `HAT-spec.md` | Full language specification |
| `extensions/` | Standard optional extensions (`;;x-*:`), one file each |
| `rhythm-library.md` | Reference rhythm library |
| `src/editor.html` | Browser-based visual editor |

## License

AGPL-3.0-or-later — see `LICENSE`.
