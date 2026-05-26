# World Rhythm Library — HAT v1.3.4 Edition

A reference library of traditional and global rhythms transcribed into Handpan ASCII Tab (HAT) v1.3.4 format. Each rhythm is presented in its **base/canonical form**, adapted for handpan playability per HAT v1.3.4 defaults:

- Strict R-L alternation at the grid resolution wherever possible
- Felt-grouping alternation (Default 2 relaxed) for asymmetric meters like 3+3+2
- Simultaneous strikes allowed when the rhythm calls for it (polyrhythms, unison accents)
- Silent steps `(-, -)` allowed when the rhythm has a genuine rest
- Left-hand taks written as `K`; right-hand taks written as `T`
- Doums (`D`) freely swap hands as alternation requires
- Ghost notes (`•`) maintain pulse on the active hand; `-` marks the resting hand

All files are HAT v1.3.4.

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

[→ arabic/maqsoum.hat.txt](rhythms/arabic/maqsoum.hat.txt)

### Belledi / Masmoudi Saghir (4/4)

Heavier-feeling cousin of Maqsoum with two opening doums. Pattern: D D - T D - T -.

[→ arabic/belledi.hat.txt](rhythms/arabic/belledi.hat.txt)

### Saidi (4/4)

Sister rhythm to Maqsoum and Belledi. Pattern: D - T D D - T -. The double doum across beats 2&-3 gives it bounce.

[→ arabic/saidi.hat.txt](rhythms/arabic/saidi.hat.txt)

### Malfuf (2/4)

A 3+3+2 sixteenth-note pattern found around the world. Pattern: D - - T - - T -.

[→ arabic/malfuf.hat.txt](rhythms/arabic/malfuf.hat.txt)

### Khaligi (2/4)

Like Malfuf but with two doums for extra weight. Pattern: D - - D - - T -.

[→ arabic/khaligi.hat.txt](rhythms/arabic/khaligi.hat.txt)

### Ayoub (2/4)

A short, bouncy Sufi rhythm. Pattern: D - T D. The second doum forces a hand swap — see HAT spec Example C.

[→ arabic/ayoub.hat.txt](rhythms/arabic/ayoub.hat.txt)

### Wahda (4/4)

"One" — defined by a single doum on beat 1. Played here as a halftime Malfuf shape.

[→ arabic/wahda.hat.txt](rhythms/arabic/wahda.hat.txt)

### Sombati / Chiftetelli (4/4)

Doubletime Chiftetelli without the double doum. Son-clave-adjacent, with accent on beat 4 instead of beat 4&. Pattern: D - T - - T D -.

[→ arabic/sombati.hat.txt](rhythms/arabic/sombati.hat.txt)

---

## Middle Eastern — Persian

### Reng (6/8)

A common Persian 6/8 dance feel. Two felt beats per bar with doums anchoring each. Pattern: D - T D - T.

[→ persian/reng.hat.txt](rhythms/persian/reng.hat.txt)

### Persian 7/8 (3+2+2)

Common in Persian dance music. Three-then-two-then-two grouping.

[→ persian/persian-7-8.hat.txt](rhythms/persian/persian-7-8.hat.txt)

---

## Mediterranean — Greek

### Hasapiko (4/4)

Greek "butcher's dance" rhythm. Steady, danceable, often paired with Rebetiko songs. Pattern: D - T - D - T -.

[→ greek/hasapiko.hat.txt](rhythms/greek/hasapiko.hat.txt)

### Kalamatianos (7/8)

Greek folk dance in 7/8, grouped 3+2+2. The slow beat carries the doum, the two quick beats carry the taks.

[→ greek/kalamatianos.hat.txt](rhythms/greek/kalamatianos.hat.txt)

### Zeybekiko (9/8)

Greek dance in 9/8, grouped 2+2+2+3 (the long beat at the end). Stately, often played slow.

[→ greek/zeybekiko.hat.txt](rhythms/greek/zeybekiko.hat.txt)

---

## Mediterranean — Spanish (Flamenco)

### Rumba Flamenca (4/4)

Pop-influenced flamenco rhythm, related to Cuban rumba but distinct. Pattern: D - T - D T - T.

[→ flamenco/rumba-flamenca.hat.txt](rhythms/flamenco/rumba-flamenca.hat.txt)

### Tangos Flamencos (4/4)

Not the Argentinian tango — a different flamenco form. Strong accent on beat 2 like a backbeat. Pattern: - T D T - T D T (rest-accent-doum pulse).

[→ flamenco/tangos-flamencos.hat.txt](rhythms/flamenco/tangos-flamencos.hat.txt)

### Bulería (12/8)

Cornerstone flamenco rhythm in 12 counts, with characteristic accents on 12, 3, 6/7, 8, 10. Twelve 8th notes; grouping varies but commonly felt as 6+6 or 3+3+2+2+2.

[→ flamenco/buleria.hat.txt](rhythms/flamenco/buleria.hat.txt)

---

## Indian — North Indian (Hindustani)

### Teentaal (16-beat)

The most common tala in Hindustani classical music. 16 beats grouped 4+4+4+4. The 9th beat (khali) is "empty" — traditionally marked by a wave instead of a clap.

[→ indian/teentaal.hat.txt](rhythms/indian/teentaal.hat.txt)

### Keherwa (8-beat)

Common 8-beat tala used in semi-classical and folk music. Two halves of 4 beats each; the second half is the "answer." Base bol pattern: Dha Dhin Na Na | Dha Dhin Dhin Na → D K _ _ | D K T _.

[→ indian/keherwa.hat.txt](rhythms/indian/keherwa.hat.txt)

### Dadra (6-beat)

A 6-beat tala used in light classical, folk, and devotional music. Grouped 3+3. Base bol pattern: Dha Dhin Na | Dha Tin Na → D K _ | D T _. The second group (khali) has D on the left hand.

[→ indian/dadra.hat.txt](rhythms/indian/dadra.hat.txt)

### Rupak (7-beat)

7-beat tala grouped 3+2+2. Uniquely, it starts on the khali (empty) beat — giving it a distinctive forward-leaning pull. Base bol pattern: Tin Tin Na | Dha Dhin | Dha Dhin → T K _ | D T | D T.

[→ indian/rupak.hat.txt](rhythms/indian/rupak.hat.txt)

---

## African — West African

### Djembe 6/8 (Standard West African feel)

The fundamental 6/8 djembe groove. Two felt beats per bar with each broken into three. Pattern: D _ T D _ T.

[→ african/west-african-6-8.hat.txt](rhythms/african/west-african-6-8.hat.txt)

### Kuku (4/4)

A celebratory dance rhythm from the forest region of Guinea. Simplified base pattern. Originally polyrhythmic across multiple drums; this is a single-line handpan reduction.

[→ african/kuku.hat.txt](rhythms/african/kuku.hat.txt)

---

## African — North African

### Gnawa (6/8)

Sufi-trance music from Morocco, traditionally played on guembri (3-string bass lute) and qraqab (iron castanets). Driving 6/8 with strong downbeats.

[→ african/gnawa.hat.txt](rhythms/african/gnawa.hat.txt)

### Chaabi (4/4)

Moroccan popular folk rhythm. Often felt with a swung 16th-note shuffle, simplified here.

[→ african/chaabi.hat.txt](rhythms/african/chaabi.hat.txt)

---

## Latin American — Afro-Cuban

### Son Clave 3-2 (4/4, 2 bars)

The foundational clave of Cuban music. Five hits over two bars of 4/4. The "3 side" comes first (three hits), then the "2 side" (two hits).

[→ afro-cuban/son-clave-3-2.hat.txt](rhythms/afro-cuban/son-clave-3-2.hat.txt)

### Rumba Clave 3-2 (4/4, 2 bars)

The clave for Cuban rumba styles. Differs from son clave by shifting the third hit of the "3 side" one 8th note later (to beat 4& instead of beat 4).

[→ afro-cuban/rumba-clave-3-2.hat.txt](rhythms/afro-cuban/rumba-clave-3-2.hat.txt)

### Bembé / 6/8 Standard Pattern

The "Standard Pattern" of African and Afro-Caribbean music — the most widespread bell pattern in the world. Hits on positions 1, 3, 5, 6, 8, 10, 12 (7 of 12).

[→ afro-cuban/bembe.hat.txt](rhythms/afro-cuban/bembe.hat.txt)

### Tumbao (4/4)

The bass-pattern foundation of Cuban son and salsa. Anticipates beat 1 from beat 4& of the previous bar.

[→ afro-cuban/tumbao.hat.txt](rhythms/afro-cuban/tumbao.hat.txt)

---

## Latin American — Brazilian

### Samba (2/4)

The heartbeat of Brazilian carnival. Surdo doum on beat 2; offbeat taks throughout. Notated here with the characteristic syncopation in 16ths.

[→ brazilian/samba.hat.txt](rhythms/brazilian/samba.hat.txt)

### Bossa Nova (4/4)

Cool, syncopated 4/4 derived from Samba. The "Brazilian clave" (a 3-2 style pattern with slightly different placement than Cuban clave).

[→ brazilian/bossa-nova.hat.txt](rhythms/brazilian/bossa-nova.hat.txt)

### Baião (2/4)

The foundational rhythm of Forró music from Northeastern Brazil. Structurally identical to the Arabic Khaligi (3+3+2 family), with two doums and a closing tak: D - - D - - T -.

[→ brazilian/baiao.hat.txt](rhythms/brazilian/baiao.hat.txt)

### Partido Alto (4/4)

A samba subgenre with a distinctive 2-bar syncopated pattern. Bossa-adjacent but with stronger accents.

[→ brazilian/partido-alto.hat.txt](rhythms/brazilian/partido-alto.hat.txt)

---

## Brazilian — Forró Family

Forró is the umbrella term for a constellation of Northeastern Brazilian dance music styles, traditionally played by the *trio nordestino*: accordion (sanfona), zabumba (double-headed bass drum, played with mallet on one side and stick on the other), and triangle. The rhythms below are the major Forró subgenres. **Baião** — the foundational Forró rhythm — appears in the Brazilian section above and is not repeated here.

These are simplified base patterns; regional, stylistic, and performer-specific variations are extensive.

### Xote (4/4)

The slower, more lyrical Forró rhythm. Roots in European polka and schottische, brought to the Northeast in the 19th century. Used for flowing, embraced couple dancing — the "slow song" of Forró. Characterized by a "bum tchá bum-bum tchá" pulse with a syncopated pickup leading back to the downbeat.

[→ forro/xote.hat.txt](rhythms/forro/xote.hat.txt)

### Arrasta-pé (2/4)

"Dragging the feet" — fast, energetic Forró rhythm, often played at the climax of a Forró set or at June festivals (Festa Junina). The zabumba plays a busy, galloping pattern with doubled doums: D D - T D D - T.

[→ forro/arrasta-pe.hat.txt](rhythms/forro/arrasta-pe.hat.txt)

### Coco (2/4)

A rhythm and dance from the coastal Northeast (Pernambuco, Alagoas), closely related to Baião. Often performed with call-and-response vocals and clapping, sometimes without melodic instruments. Shares the 3+3+2 family feel but with a more syncopated, danceable accent pattern.

[→ forro/coco.hat.txt](rhythms/forro/coco.hat.txt)

### Xaxado (2/4)

The dance and rhythm of the cangaceiros — armed bandits of the Brazilian Northeast in the early 20th century. Named for the *xa-xa* shuffling sound of leather sandals on dry ground. Simple, marching duple pulse, traditionally danced in a line with rifles tapped against the floor in place of formal percussion.

[→ forro/xaxado.hat.txt](rhythms/forro/xaxado.hat.txt)

### Quadrilha (2/4)

Brazilian adaptation of the European *quadrille* — a square dance rhythm. Central to Festa Junina (June Festival) celebrations, danced in formation with a caller giving instructions. Straight, march-like, easy to follow.

[→ forro/quadrilha.hat.txt](rhythms/forro/quadrilha.hat.txt)

---

## Global — Drum Set Grooves

### Rock Backbeat (4/4)

The defining groove of popular music. Kick (D) on 1 and 3; snare (T) on 2 and 4. Hi-hat (ghosts) fills the 8th-note grid.

[→ drum-set/rock-backbeat.hat.txt](rhythms/drum-set/rock-backbeat.hat.txt)

### Funk (4/4)

Syncopated kick patterns plus the standard backbeat. Anticipated kick on 3& is the signature.

[→ drum-set/funk.hat.txt](rhythms/drum-set/funk.hat.txt)

---

## Global — Odd-Metre Rhythms

### 5/8 (3+2)

Quick-quick-quick / quick-quick. Long beat first.

[→ odd-metres/5-8-3plus2.hat.txt](rhythms/odd-metres/5-8-3plus2.hat.txt)

### 5/8 (2+3)

Quick-quick / quick-quick-quick. Long beat second.

[→ odd-metres/5-8-2plus3.hat.txt](rhythms/odd-metres/5-8-2plus3.hat.txt)

### 7/8 (3+2+2)

The most common 7/8 grouping. Long-short-short.

[→ odd-metres/7-8-3plus2plus2.hat.txt](rhythms/odd-metres/7-8-3plus2plus2.hat.txt)

### 7/8 (2+2+3)

Short-short-long. Common in Bulgarian and Macedonian folk.

[→ odd-metres/7-8-2plus2plus3.hat.txt](rhythms/odd-metres/7-8-2plus2plus3.hat.txt)

### 9/8 (2+2+2+3)

Karsilama / Turkish 9/8. Three short groups then a long.

[→ odd-metres/9-8-2plus2plus2plus3.hat.txt](rhythms/odd-metres/9-8-2plus2plus2plus3.hat.txt)

---

## Global — Cross-Rhythms / Polyrhythms

These rhythms relax Default 1 (one hand per cell) to allow simultaneous strikes. The two hands play independent pulse rates that coincide on shared downbeats.

### 2 against 3

Two hits in the L hand against three in the R hand over the same time span. The most common polyrhythm in West African and Cuban music. R plays even triplets (3 hits). L plays even duplets (2 hits). Both coincide on cell 1.

[→ polyrhythm/2-against-3.hat.txt](rhythms/polyrhythm/2-against-3.hat.txt)

### 3 against 2

Same polyrhythm, hands swapped — three hits in L against two in R. Just a different perspective on the same interlock.

[→ polyrhythm/3-against-2.hat.txt](rhythms/polyrhythm/3-against-2.hat.txt)

### 3 against 4

Three hits in L against four in R over 12 cells. They coincide only on cell 1. R plays even quarter notes (4 hits). L plays even dotted-quarter notes (3 hits).

[→ polyrhythm/3-against-4.hat.txt](rhythms/polyrhythm/3-against-4.hat.txt)

### 4 against 3

Hands swapped from 3-against-4 — four hits in L against three in R.

[→ polyrhythm/4-against-3.hat.txt](rhythms/polyrhythm/4-against-3.hat.txt)

---

## Notes on Use

**These are base patterns, not the only valid versions.** Each rhythm has countless variations developed by performers across decades or centuries. Use these as starting points to internalize the feel, then explore variations, accents, embellishments, and improvisations.

**Hand consistency:** The default phase used throughout this library is R-on-downbeats / L-on-offbeats. Left-handed players can mirror everything by swapping R and L lines without changing the rhythm.

**Tempo and dynamics are not encoded** in these examples (the spec supports `;;tempo:` if needed). Each tradition has its own typical tempo range — Maqsoum at ~90–120 BPM, Bossa at ~120, Wahda often slow (~70), Felahi much faster (~150), and so on.

**Polyrhythms** require independent-hand training. Practice each hand separately to lock its pulse, then layer them. The cells where both hands strike simultaneously are the anchors that make the polyrhythm cohere.
