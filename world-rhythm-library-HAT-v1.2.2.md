# World Rhythm Library — HAT v1.2.2 Edition

A reference library of traditional and global rhythms transcribed into Handpan ASCII Tab (HAT) v1.2.2 format. Each rhythm is presented in its **base/canonical form**, adapted for handpan playability per HAT v1.2.2 defaults:

- Strict R-L alternation at the grid resolution wherever possible
- Felt-grouping alternation (Default 2 relaxed) for asymmetric meters like 3+3+2
- Simultaneous strikes allowed when the rhythm calls for it (polyrhythms, unison accents)
- Silent steps `(-, -)` allowed when the rhythm has a genuine rest
- Left-hand taks written as `K`; right-hand taks written as `T`
- Doums (`D`) freely swap hands as alternation requires
- Ghost notes (`•`) maintain pulse on the active hand; `-` marks the resting hand

All blocks are HAT v1.2.2. The `;;HAT v1.2.2` line is omitted for brevity but applies throughout.

**Source inspiration:** Categories drawn from the Handpan Dojo World Rhythm Library by David Kuckhermann. Patterns here are canonical/textbook versions from common pedagogy, not direct transcriptions of his specific handpan interpretations.

---

## Table of Contents

1. [Middle Eastern — Arabic & Turkish](#middle-eastern--arabic--turkish)
2. [Middle Eastern — Persian](#middle-eastern--persian)
3. [Mediterranean — Greek](#mediterranean--greek)
4. [Mediterranean — Spanish (Flamenco)](#mediterranean--spanish-flamenco)
5. [Indian — North Indian (Hindustani)](#indian--north-indian-hindustani)
6. [African — West African](#african--west-african)
7. [African — North African](#african--north-african)
8. [Latin American — Afro-Cuban](#latin-american--afro-cuban)
9. [Latin American — Brazilian](#latin-american--brazilian)
10. [Brazilian — Forró Family](#brazilian--forró-family)
11. [Global — Drum Set Grooves](#global--drum-set-grooves)
12. [Global — Odd-Metre Rhythms](#global--odd-metre-rhythms)
13. [Global — Cross-Rhythms / Polyrhythms](#global--cross-rhythms--polyrhythms)

---

## Middle Eastern — Arabic & Turkish

### Maqsoum (4/4)

The most iconic Arabic dance rhythm. Pattern: D T - T D - T -.

```
;;title: Maqsoum
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | D  | -  | T  | -  ||
L: || -  | K  | -  | K  | -  | •  | -  | •  ||
```

### Belledi / Masmoudi Saghir (4/4)

Heavier-feeling cousin of Maqsoum with two opening doums. Pattern: D D - T D - T -.

```
;;title: Belledi
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | D  | -  | T  | -  ||
L: || -  | D  | -  | K  | -  | •  | -  | •  ||
```

### Saidi (4/4)

Sister rhythm to Maqsoum and Belledi. Pattern: D - T D D - T -. The double doum across beats 2&-3 gives it bounce.

```
;;title: Saidi
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | •  | -  | D  | -  | •  | -  | •  ||
```

### Malfuf (2/4)

A 3+3+2 sixteenth-note pattern found around the world. Pattern: D - - T - - T -.

```
;;title: Malfuf
;;time: 2/4
;;grid: 16th

R: || D - • - | • - T - ||
L: || - • - K | - • - • ||
```

### Khaligi (2/4)

Like Malfuf but with two doums for extra weight. Pattern: D - - D - - T -.

```
;;title: Khaligi
;;time: 2/4
;;grid: 16th

R: || D - • - | • - T - ||
L: || - • - D | - • - • ||
```

### Ayoub (2/4)

A short, bouncy Sufi rhythm. Pattern: D - T D. The second doum forces a hand swap — see HAT spec Example C.

```
;;title: Ayoub
;;time: 2/4
;;grid: 8th

R: || D | - | T | - ||
L: || - | • | - | D ||
```

### Wahda (4/4)

"One" — defined by a single doum on beat 1. Played here as a halftime Malfuf shape.

```
;;title: Wahda
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | •  | -  | T  | -  ||
L: || -  | •  | -  | K  | -  | •  | -  | •  ||
```

### Sombati / Chiftetelli (4/4)

Doubletime Chiftetelli without the double doum. Son-clave-adjacent, with accent on beat 4 instead of beat 4&. Pattern: D - T - - T D -.

```
;;title: Sombati
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | •  | -  | D  | -  ||
L: || -  | •  | -  | •  | -  | K  | -  | •  ||
```

---

## Middle Eastern — Persian

### Reng (6/8)

A common Persian 6/8 dance feel. Two felt beats per bar with doums anchoring each. Pattern: D - T D - T.

```
;;title: Reng
;;time: 6/8
;;grid: 8th

R: || D | - | T | - | • | - ||
L: || - | • | - | D | - | K ||
```

### Persian 7/8 (3+2+2)

Common in Persian dance music. Three-then-two-then-two grouping.

```
;;title: Persian 7/8
;;time: 7/8
;;grid: 8th
;;subdivision: 3+2+2

R: || D - • | T - | T - ||
L: || - • - | - • | - • ||
```

---

## Mediterranean — Greek

### Hasapiko (4/4)

Greek "butcher's dance" rhythm. Steady, danceable, often paired with Rebetiko songs. Pattern: D - T - D - T -.

```
;;title: Hasapiko
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | •  | -  | •  | -  | •  | -  | •  ||
```

### Kalamatianos (7/8)

Greek folk dance in 7/8, grouped 3+2+2. The slow beat carries the doum, the two quick beats carry the taks.

```
;;title: Kalamatianos
;;time: 7/8
;;grid: 8th
;;subdivision: 3+2+2

R: || D - • | T - | T - ||
L: || - • - | - • | - • ||
```

### Zeybekiko (9/8)

Greek dance in 9/8, grouped 2+2+2+3 (the long beat at the end). Stately, often played slow.

```
;;title: Zeybekiko
;;time: 9/8
;;grid: 8th
;;subdivision: 2+2+2+3

R: || D - | T - | D - | T - • ||
L: || - • | - • | - • | - • - ||
```

---

## Mediterranean — Spanish (Flamenco)

### Rumba Flamenca (4/4)

Pop-influenced flamenco rhythm, related to Cuban rumba but distinct. Pattern: D - T - D T - T.

```
;;title: Rumba Flamenca
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | •  | -  ||
L: || -  | •  | -  | •  | -  | K  | -  | K  ||
```

### Tangos Flamencos (4/4)

Not the Argentinian tango — a different flamenco form. Strong accent on beat 2 like a backbeat. Pattern: - T D T - T D T (rest-accent-doum pulse).

```
;;title: Tangos Flamencos
;;time: 4/4
;;grid: 8th

R: || •  | -  | D  | -  | •  | -  | D  | -  ||
L: || -  | K  | -  | K  | -  | K  | -  | K  ||
```

### Bulería (12/8)

Cornerstone flamenco rhythm in 12 counts, with characteristic accents on 12, 3, 6/7, 8, 10. Twelve 8th notes; grouping varies but commonly felt as 6+6 or 3+3+2+2+2.

```
;;title: Bulería
;;time: 12/8
;;grid: 8th
;;subdivision: 3+3+2+2+2

R: || D - • | T - • | D - | T - | D - ||
L: || - • - | - • - | - • | - • | - • ||
```

---

## Indian — North Indian (Hindustani)

### Teentaal (16-beat)

The most common tala in Hindustani classical music. 16 beats grouped 4+4+4+4. The 9th beat (khali) is "empty" — traditionally marked by a wave instead of a clap.

```
;;title: Teentaal
;;time: 16/4
;;grid: 4th
;;subdivision: 4+4+4+4

R: || D | T | T | D || D | T | T | D || • | T | T | D || D | T | T | D ||
L: || - | • | • | - || - | • | • | - || - | • | • | - || - | • | • | - ||
```

### Keherwa (8-beat)

Common 8-beat tala used in semi-classical and folk music. Two halves of 4 beats each; the second half is the "answer." Base bol pattern: Dha Dhin Na Na | Dha Dhin Dhin Na → D K _ _ | D K T _.

```
;;title: Keherwa
;;time: 8/4
;;grid: 4th
;;subdivision: 4+4

R: || D  | -  | •  | -  || D  | -  | T  | -  ||
L: || -  | K  | -  | •  || -  | K  | -  | •  ||
```

### Dadra (6-beat)

A 6-beat tala used in light classical, folk, and devotional music. Grouped 3+3. Base bol pattern: Dha Dhin Na | Dha Tin Na → D K _ | D T _. The second group (khali) has D on the left hand.

```
;;title: Dadra
;;time: 6/4
;;grid: 4th
;;subdivision: 3+3

R: || D  | -  | •  || -  | T  | -  ||
L: || -  | K  | -  || D  | -  | •  ||
```

### Rupak (7-beat)

7-beat tala grouped 3+2+2. Uniquely, it starts on the khali (empty) beat — giving it a distinctive forward-leaning pull. Base bol pattern: Tin Tin Na | Dha Dhin | Dha Dhin → T K _ | D T | D T.

```
;;title: Rupak
;;time: 7/4
;;grid: 4th
;;subdivision: 3+2+2

R: || T  | -  | •  || -  | T  || -  | T  ||
L: || -  | K  | -  || D  | -  || D  | -  ||
```

---

## African — West African

### Djembe 6/8 (Standard West African feel)

The fundamental 6/8 djembe groove. Two felt beats per bar with each broken into three. Pattern: D _ T D _ T.

```
;;title: West African 6/8
;;time: 6/8
;;grid: 8th

R: || D | - | T | - | • | - ||
L: || - | • | - | D | - | K ||
```

### Kuku (4/4)

A celebratory dance rhythm from the forest region of Guinea. Simplified base pattern. Originally polyrhythmic across multiple drums; this is a single-line handpan reduction.

```
;;title: Kuku
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | K  | -  | •  | -  | K  | -  | •  ||
```

---

## African — North African

### Gnawa (6/8)

Sufi-trance music from Morocco, traditionally played on guembri (3-string bass lute) and qraqab (iron castanets). Driving 6/8 with strong downbeats.

```
;;title: Gnawa
;;time: 6/8
;;grid: 8th

R: || D | - | T | D | - | T ||
L: || - | • | - | - | • | - ||
```

### Chaabi (4/4)

Moroccan popular folk rhythm. Often felt with a swung 16th-note shuffle, simplified here.

```
;;title: Chaabi
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | T  | T  | -  ||
L: || -  | K  | -  | K  | -  | -  | -  | K  ||
```

---

## Latin American — Afro-Cuban

### Son Clave 3-2 (4/4, 2 bars)

The foundational clave of Cuban music. Five hits over two bars of 4/4. The "3 side" comes first (three hits), then the "2 side" (two hits).

```
;;title: Son Clave 3-2
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | •  | -  | D  | -  || •  | -  | T  | -  | T  | -  | •  | -  ||
L: || -  | •  | -  | D  | -  | •  | -  | •  || -  | •  | -  | •  | -  | •  | -  | •  ||
```

### Rumba Clave 3-2 (4/4, 2 bars)

The clave for Cuban rumba styles. Differs from son clave by shifting the third hit of the "3 side" one 8th note later (to beat 4& instead of beat 4).

```
;;title: Rumba Clave 3-2
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | •  | -  | •  | -  || D  | -  | T  | -  | T  | -  | •  | -  ||
L: || -  | •  | -  | D  | -  | •  | -  | D  || -  | •  | -  | •  | -  | •  | -  | •  ||
```

### Bembé / 6/8 Standard Pattern

The "Standard Pattern" of African and Afro-Caribbean music — the most widespread bell pattern in the world. Hits on positions 1, 3, 5, 6, 8, 10, 12 (7 of 12).

```
;;title: Bembé
;;time: 12/8
;;grid: 8th

R: || D | - | T | - | T | - || • | - | • | - | • | - ||
L: || - | • | - | • | - | D || - | K | - | K | - | K ||
```

### Tumbao (4/4)

The bass-pattern foundation of Cuban son and salsa. Anticipates beat 1 from beat 4& of the previous bar.

```
;;title: Tumbao
;;time: 4/4
;;grid: 8th

R: || •  | -  | T  | -  | D  | -  | •  | -  ||
L: || -  | •  | -  | K  | -  | •  | -  | D  ||
```

---

## Latin American — Brazilian

### Samba (2/4)

The heartbeat of Brazilian carnival. Surdo doum on beat 2; offbeat taks throughout. Notated here with the characteristic syncopation in 16ths.

```
;;title: Samba
;;time: 2/4
;;grid: 16th

R: || D - T - | • - D - ||
L: || - • - • | - K - K ||
```

### Bossa Nova (4/4)

Cool, syncopated 4/4 derived from Samba. The "Brazilian clave" (a 3-2 style pattern with slightly different placement than Cuban clave).

```
;;title: Bossa Nova
;;time: 4/4
;;grid: 8th

R: || D  | -  | •  | -  | T  | -  | •  | -  ||
L: || -  | •  | -  | K  | -  | •  | -  | K  ||
```

### Baião (2/4)

The foundational rhythm of Forró music from Northeastern Brazil. Structurally identical to the Arabic Khaligi (3+3+2 family), with two doums and a closing tak: D - - D - - T -.

```
;;title: Baião
;;time: 2/4
;;grid: 16th

R: || D - • - | • - T - ||
L: || - • - D | - • - • ||
```

### Partido Alto (4/4)

A samba subgenre with a distinctive 2-bar syncopated pattern. Bossa-adjacent but with stronger accents.

```
;;title: Partido Alto
;;time: 4/4
;;grid: 8th

R: || •  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | D  | -  | K  | -  | K  | -  | •  ||
```

---

## Brazilian — Forró Family

Forró is the umbrella term for a constellation of Northeastern Brazilian dance music styles, traditionally played by the *trio nordestino*: accordion (sanfona), zabumba (double-headed bass drum, played with mallet on one side and stick on the other), and triangle. The rhythms below are the major Forró subgenres. **Baião** — the foundational Forró rhythm — appears in the Brazilian section above and is not repeated here.

These are simplified base patterns; regional, stylistic, and performer-specific variations are extensive.

### Xote (4/4)

The slower, more lyrical Forró rhythm. Roots in European polka and schottische, brought to the Northeast in the 19th century. Used for flowing, embraced couple dancing — the "slow song" of Forró. Characterized by a "bum tchá bum-bum tchá" pulse with a syncopated pickup leading back to the downbeat.

```
;;title: Xote
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | •  | -  | •  | -  | •  | -  | K  ||
```

### Arrasta-pé (2/4)

"Dragging the feet" — fast, energetic Forró rhythm, often played at the climax of a Forró set or at June festivals (Festa Junina). The zabumba plays a busy, galloping pattern with doubled doums: D D - T D D - T.

```
;;title: Arrasta-pé
;;time: 2/4
;;grid: 16th

R: || D - • - | D - • - ||
L: || - D - K | - D - K ||
```

### Coco (2/4)

A rhythm and dance from the coastal Northeast (Pernambuco, Alagoas), closely related to Baião. Often performed with call-and-response vocals and clapping, sometimes without melodic instruments. Shares the 3+3+2 family feel but with a more syncopated, danceable accent pattern.

```
;;title: Coco
;;time: 2/4
;;grid: 16th

R: || D - T - | D - • - ||
L: || - • - • | - K - K ||
```

### Xaxado (2/4)

The dance and rhythm of the cangaceiros — armed bandits of the Brazilian Northeast in the early 20th century. Named for the *xa-xa* shuffling sound of leather sandals on dry ground. Simple, marching duple pulse, traditionally danced in a line with rifles tapped against the floor in place of formal percussion.

```
;;title: Xaxado
;;time: 2/4
;;grid: 8th

R: || D | - | D | - ||
L: || - | K | - | K ||
```

### Quadrilha (2/4)

Brazilian adaptation of the European *quadrille* — a square dance rhythm. Central to Festa Junina (June Festival) celebrations, danced in formation with a caller giving instructions. Straight, march-like, easy to follow.

```
;;title: Quadrilha
;;time: 2/4
;;grid: 8th

R: || D | - | T | - ||
L: || - | K | - | K ||
```

---

## Global — Drum Set Grooves

### Rock Backbeat (4/4)

The defining groove of popular music. Kick (D) on 1 and 3; snare (T) on 2 and 4. Hi-hat (ghosts) fills the 8th-note grid.

```
;;title: Rock Backbeat
;;time: 4/4
;;grid: 8th

R: || D  | -  | T  | -  | D  | -  | T  | -  ||
L: || -  | •  | -  | •  | -  | •  | -  | •  ||
```

### Funk (4/4)

Syncopated kick patterns plus the standard backbeat. Anticipated kick on 3& is the signature.

```
;;title: Funk
;;time: 4/4
;;grid: 16th

R: || D - • • | T - • D | • • D - | T - • • ||
L: || - • K • | - • K • | - • K • | - • K • ||
```

---

## Global — Odd-Metre Rhythms

### 5/8 (3+2)

Quick-quick-quick / quick-quick. Long beat first.

```
;;title: 5/8 (3+2)
;;time: 5/8
;;grid: 8th
;;subdivision: 3+2

R: || D - • | T - ||
L: || - • - | - • ||
```

### 5/8 (2+3)

Quick-quick / quick-quick-quick. Long beat second.

```
;;title: 5/8 (2+3)
;;time: 5/8
;;grid: 8th
;;subdivision: 2+3

R: || D - | T - • ||
L: || - • | - • - ||
```

### 7/8 (3+2+2)

The most common 7/8 grouping. Long-short-short.

```
;;title: 7/8 (3+2+2)
;;time: 7/8
;;grid: 8th
;;subdivision: 3+2+2

R: || D - • | T - | T - ||
L: || - • - | - • | - • ||
```

### 7/8 (2+2+3)

Short-short-long. Common in Bulgarian and Macedonian folk.

```
;;title: 7/8 (2+2+3)
;;time: 7/8
;;grid: 8th
;;subdivision: 2+2+3

R: || D - | T - | D - • ||
L: || - • | - • | - • - ||
```

### 9/8 (2+2+2+3)

Karsilama / Turkish 9/8. Three short groups then a long.

```
;;title: 9/8 (2+2+2+3)
;;time: 9/8
;;grid: 8th
;;subdivision: 2+2+2+3

R: || D - | T - | D - | T - • ||
L: || - • | - • | - • | - • - ||
```

---

## Global — Cross-Rhythms / Polyrhythms

These rhythms relax Default 1 (one hand per cell) to allow simultaneous strikes. The two hands play independent pulse rates that coincide on shared downbeats.

### 2 against 3

Two hits in the L hand against three in the R hand over the same time span. The most common polyrhythm in West African and Cuban music.

```
;;title: 2 against 3
;;time: 6/8
;;grid: 8th

R: || D | • | D | • | D | • ||
L: || D | - | - | D | - | - ||
```

R plays even triplets (3 hits). L plays even duplets (2 hits). Both coincide on cell 1.

### 3 against 2

Same polyrhythm, hands swapped — three hits in L against two in R. Just a different perspective on the same interlock.

```
;;title: 3 against 2
;;time: 6/8
;;grid: 8th

R: || D | - | - | D | - | - ||
L: || D | • | D | • | D | • ||
```

### 3 against 4

Three hits in L against four in R over 12 cells. They coincide only on cell 1.

```
;;title: 3 against 4
;;time: 12/8
;;grid: 8th

R: || D | • | • | D | • | • | D | • | • | D | • | • ||
L: || D | - | - | - | D | - | - | - | D | - | - | - ||
```

R plays even quarter notes (4 hits). L plays even dotted-quarter notes (3 hits).

### 4 against 3

Hands swapped from 3-against-4 — four hits in L against three in R.

```
;;title: 4 against 3
;;time: 12/8
;;grid: 8th

R: || D | - | - | - | D | - | - | - | D | - | - | - ||
L: || D | • | • | D | • | • | D | • | • | D | • | • ||
```

---

## Notes on Use

**These are base patterns, not the only valid versions.** Each rhythm has countless variations developed by performers across decades or centuries. Use these as starting points to internalize the feel, then explore variations, accents, embellishments, and improvisations.

**Hand consistency:** The default phase used throughout this library is R-on-downbeats / L-on-offbeats. Left-handed players can mirror everything by swapping R and L lines without changing the rhythm.

**Tempo and dynamics are not encoded** in these examples (the spec supports `;;tempo:` if needed). Each tradition has its own typical tempo range — Maqsoum at ~90–120 BPM, Bossa at ~120, Wahda often slow (~70), Felahi much faster (~150), and so on.

**Polyrhythms** require independent-hand training. Practice each hand separately to lock its pulse, then layer them. The cells where both hands strike simultaneously are the anchors that make the polyrhythm cohere.
