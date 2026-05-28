// SPDX-License-Identifier: AGPL-3.0-or-later
// HAT parser, serializer, and built-in pattern library.

export const HIT_SYMS = new Set(['D','T','K','S','d','t','k','s','•','-']);
export const FIELD_DIGIT_KEYS = ['1','2','3','4','5','6','7','8','9','0'];
export const FIELD_LETTER_KEYS = ['q','w','e','r','z','u','p','a','f','g','h','j','l'];

// ─────────────────────────────────────────────
//  HAT PARSER  (flat cols model, v1.3.4 + legacy)
// ─────────────────────────────────────────────
// col = { R:{hit,mod}, L:{hit,mod}, beatStart:bool, sub:bool, countTok:string|null }

export function parseHAT(text) {
  const lines = text.replace(/\r\n/g,'\n').split('\n');
  const meta = {}, noteMap = {};
  let Rlines=[], Llines=[], Clines=[], sections=[], curSection=null;
  let version134 = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    if (line.startsWith(';;')) {
      const m = line.match(/^;;([^:]+):\s*(.*)$/);
      if (m) {
        const k=m[1].trim().toLowerCase(), v=m[2].trim();
        if (k==='hat') {
          const vm=v.match(/^v(\d+)\.(\d+)(?:\.(\d+))?/i);
          if (vm) { const [maj,min,pat]=[+vm[1],+vm[2],+(vm[3]||0)]; version134=maj>1||(maj===1&&(min>3||(min===3&&pat>=4))); }
          meta[k]=v;
        } else if (k==='section') {
          curSection={label:v,Rlines:[],Llines:[],Clines:[]};
          sections.push(curSection);
        } else meta[k]=v;
      } else {
        const vm=line.match(/^;;HAT\s+v(\d+)\.(\d+)(?:\.(\d+))?/i);
        if (vm) { const [maj,min,pat]=[+vm[1],+vm[2],+(vm[3]||0)]; version134=maj>1||(maj===1&&(min>3||(min===3&&pat>=4))); }
      }
      continue;
    }
    const rm=/^R\s*:/i.test(line), lm=/^L\s*:/i.test(line), cm=/^C\s*:/i.test(line);
    if (rm||lm||cm) {
      const c=line.replace(/^[RLC]\s*:/i,'').trim();
      if (curSection) { if(rm)curSection.Rlines.push(c); else if(lm)curSection.Llines.push(c); else curSection.Clines.push(c); }
      else { if(rm)Rlines.push(c); else if(lm)Llines.push(c); else Clines.push(c); }
    }
  }

  // Note-number map
  if (meta.notes && !meta['note-numbers']) {
    meta._noteNames = meta.notes.trim().split(/\s+/);
  } else if (meta.notes || meta['note-numbers']) {
    if (!meta.notes || !meta['note-numbers'])
      return { ok:false, error:';;notes: and ;;note-numbers: must both be present.' };
    const names=meta.notes.trim().split(/\s+/), nums=meta['note-numbers'].trim().split(/\s+/);
    if (names.length!==nums.length)
      return { ok:false, error:';;notes: and ;;note-numbers: must have equal entry counts.' };
    const seen=new Set();
    for (let i=0;i<nums.length;i++) {
      const n=nums[i];
      if (!/^\d{1,3}$/.test(n)||(n.length>1&&n[0]==='0')) return { ok:false, error:`Invalid note number: "${n}"` };
      if (seen.has(n)) return { ok:false, error:`Duplicate note number: ${n}` };
      seen.add(n); noteMap[n]=names[i];
    }
    meta._noteMap=noteMap; meta._noteNames=names.slice();
  }

  // x-note-json: inline JSON
  if (meta['x-note-json']&&!meta._noteNames) {
    const xnj=meta['x-note-json'].trim();
    if (xnj.startsWith('{')) {
      try {
        const obj=JSON.parse(xnj);
        const keys=Object.keys(obj), nm={};
        let entries;
        if (keys.length&&/^\d+$/.test(keys[0]))
          entries=keys.map(k=>({num:parseInt(k,10),name:obj[k]}));
        else
          entries=Object.entries(obj).map(([name,num])=>({name,num:parseInt(num,10)}));
        entries.sort((a,b)=>a.num-b.num);
        const names=entries.map(e=>e.name);
        for (const e of entries) nm[String(e.num)]=e.name;
        if (names.length) { meta._noteNames=names; meta._noteMap=nm; }
      } catch(e) { /* invalid JSON */ }
    }
  }

  if (!sections.length) sections=[{label:'',Rlines,Llines,Clines}];

  const parsedSections=[], colCoords=[], allCols=[];
  for (let si=0;si<sections.length;si++) {
    const sec=sections[si];
    const cText=sec.Clines.length?sec.Clines.join(' '):null;
    const bars=version134
      ? parseBars134(sec.Rlines.join(' '),sec.Llines.join(' '),cText,noteMap)
      : parseBarsLegacy(sec.Rlines.join(' '),sec.Llines.join(' '),noteMap);
    if (bars.error) return { ok:false, error:bars.error };
    parsedSections.push({label:sec.label,bars:bars.result});
    for (let bi=0;bi<bars.result.length;bi++)
      for (let ci=0;ci<bars.result[bi].cols.length;ci++) {
        allCols.push(bars.result[bi].cols[ci]);
        colCoords.push({sec:si,bar:bi,col:ci});
      }
  }
  if (meta.subdivision) {
    const grps = meta.subdivision.split('+').map(Number);
    if (grps.every(n=>Number.isFinite(n)&&n>0)) applySubdivision(parsedSections, grps);
  }

  return { ok:true, meta, version134, sections:parsedSections, cols:allCols, colCoords };
}

// ── v1.3.4 split helpers ──────────────────────────────────────────────────

export function splitBars134(t) {
  return t.replace(/^\s*\|{3}\s*/,'').replace(/\s*\|{3}\s*$/,'')
           .split(/\s*\|{3}\s*/).filter(s=>s.trim());
}
export function splitBeats134(t) {
  const s=t.replace(/\|{3}/g,'\x00');
  return s.replace(/^\s*\|{2}\s*/,'').replace(/\s*\|{2}\s*$/,'')
           .split(/\s*\|{2}\s*/).map(b=>b.replace(/\x00/g,'|||').trim()).filter(Boolean);
}
export function splitSubgroups134(t) {
  const s=t.replace(/\|{3}/g,'\x00').replace(/\|{2}/g,'\x01');
  return s.split('|').map(p=>p.replace(/\x00/g,'|||').replace(/\x01/g,'||').trim()).filter(Boolean);
}

export function parseBars134(rText, lText, cText, noteMap) {
  const rBars=splitBars134(rText), lBars=splitBars134(lText);
  if (rBars.length!==lBars.length)
    return { error:`R/L bar count mismatch (${rBars.length} vs ${lBars.length})` };
  const cBars=cText?splitBars134(cText):null;
  if (cBars&&cBars.length!==rBars.length)
    return { error:`C:/R: bar count mismatch` };

  const result=[];
  for (let bi=0;bi<rBars.length;bi++) {
    const rBeats=splitBeats134(rBars[bi]), lBeats=splitBeats134(lBars[bi]);
    if (rBeats.length!==lBeats.length)
      return { error:`Bar ${bi+1}: R/L beat count mismatch` };
    const cBeats=cBars?splitBeats134(cBars[bi]):null;
    if (cBeats&&cBeats.length!==rBeats.length)
      return { error:`Bar ${bi+1}: C:/R: beat count mismatch` };

    const cols=[];
    for (let bti=0;bti<rBeats.length;bti++) {
      const rSgs=splitSubgroups134(rBeats[bti]);
      const rSubStarts=new Set(), rToks=[];
      for (let sgi=0;sgi<rSgs.length;sgi++) {
        const toks=tokenize(rSgs[sgi]);
        if (sgi>0&&toks.length) rSubStarts.add(rToks.length);
        rToks.push(...toks);
      }
      const lToks=tokenize(lBeats[bti].replace(/\|/g,' '));
      if (rToks.length!==lToks.length)
        return { error:`Bar ${bi+1} beat ${bti+1}: R(${rToks.length}) vs L(${lToks.length}) mismatch` };

      const cBeatToks=cBeats?tokenize(cBeats[bti].replace(/\|/g,' ')):null;
      if (cBeatToks&&cBeatToks.length!==rToks.length)
        return { error:`Bar ${bi+1} beat ${bti+1}: C:(${cBeatToks.length}) vs R:(${rToks.length}) mismatch` };
      if (cBeatToks) {
        for (const tok of cBeatToks)
          if (tok!=='e'&&tok!=='&'&&tok!=='a'&&tok!=='.'&&!/^\d+$/.test(tok))
            return { error:`Invalid count token: "${tok}"` };
      }

      for (let ci=0;ci<rToks.length;ci++) {
        const R=parseCell(rToks[ci],noteMap,`B${bi+1}bt${bti+1}c${ci+1}R`);
        const L=parseCell(lToks[ci],noteMap,`B${bi+1}bt${bti+1}c${ci+1}L`);
        if (R.error) return { error:R.error };
        if (L.error) return { error:L.error };
        cols.push({R:R.cell,L:L.cell,beatStart:bti>0&&ci===0,sub:rSubStarts.has(ci),countTok:cBeatToks?cBeatToks[ci]:null});
      }
    }
    result.push({cols});
  }
  return { result };
}

// ── Legacy parser (v1.3.3) ────────────────────────────────────────────────

export function parseBarsLegacy(rText, lText, noteMap) {
  const rBars=splitBarsLegacy(rText), lBars=splitBarsLegacy(lText);
  if (rBars.length!==lBars.length)
    return { error:`R/L bar count mismatch (${rBars.length} vs ${lBars.length})` };
  const result=[];
  for (let bi=0;bi<rBars.length;bi++) {
    const rSubs=splitSubsLegacy(rBars[bi]), lSubs=splitSubsLegacy(lBars[bi]);
    if (rSubs.length!==lSubs.length)
      return { error:`Bar ${bi+1}: R/L subdivision count mismatch` };
    const cols=[];
    for (let si=0;si<rSubs.length;si++) {
      const rt=tokenize(rSubs[si]), lt=tokenize(lSubs[si]);
      if (rt.length!==lt.length)
        return { error:`Bar ${bi+1} sub ${si+1}: R(${rt.length}) vs L(${lt.length}) token mismatch` };
      for (let ci=0;ci<rt.length;ci++) {
        const R=parseCell(rt[ci],noteMap,`B${bi+1}S${si+1}C${ci+1}R`);
        const L=parseCell(lt[ci],noteMap,`B${bi+1}S${si+1}C${ci+1}L`);
        if (R.error) return { error:R.error };
        if (L.error) return { error:L.error };
        cols.push({R:R.cell,L:L.cell,beatStart:false,sub:si>0&&ci===0,countTok:null});
      }
    }
    result.push({cols});
  }
  return { result };
}

export function splitBarsLegacy(t) {
  return t.replace(/^\s*\|\|\s*/,'').replace(/\s*\|\|\s*$/,'').split(/\s*\|\|\s*/).filter(s=>s.trim());
}
export function splitSubsLegacy(t) {
  return t.replace(/\|\|/g,'\x00').split(/\s*(?<!\x00)\|(?!\x00)\s*/)
           .map(s=>s.replace(/\x00/g,'||').trim()).filter(Boolean);
}
export function tokenize(t) { return t.trim().split(/\s+/).filter(Boolean); }

export function parseCell(tok, noteMap, ctx) {
  if (!tok) return { error:`${ctx}: empty token` };
  let mod=null, t=tok;
  if (t.endsWith('*'))  { mod='*'; t=t.slice(0,-1); }
  if (t.startsWith('*')){ mod='*'; t=t.slice(1); }
  if (/^\d+$/.test(t)) {
    if (!Object.keys(noteMap).length) return { error:`${ctx}: numeric token but no ;;note-numbers:` };
    if (t.length>1&&t[0]==='0') return { error:`${ctx}: leading zero in note number` };
    const name=noteMap[t]; if (!name) return { error:`${ctx}: note number "${t}" unknown` };
    return { cell:{hit:name, mod} };
  }
  return { cell:{hit:t, mod} };
}

// ─────────────────────────────────────────────
//  SERIALIZER
// ─────────────────────────────────────────────

export function serializeNotesLine(key, value) {
  const PREFIX_LEN=16;
  const pfx=`;;${key}: `;
  const pad=' '.repeat(Math.max(0,PREFIX_LEN-pfx.length));
  return pfx+pad+value.trim().split(/\s+/).map(v=>v.padEnd(4)).join('').trimEnd();
}

export function serializeHAT(meta, sections) {
  const lines=[';;HAT v1.3.4'], skip=new Set(['_noteMap','_noteNames']);
  const order=['title','time','grid','tempo','subdivision','notes','note-numbers'];
  const written=new Set();
  for (const k of order) if (meta[k]!==undefined&&!skip.has(k)&&!k.startsWith('_')) {
    lines.push(k==='notes'||k==='note-numbers' ? serializeNotesLine(k,meta[k]) : `;;${k}: ${meta[k]}`);
    written.add(k);
  }
  for (const k of Object.keys(meta)) if (!written.has(k)&&!skip.has(k)&&!k.startsWith('_')&&k!=='hat') lines.push(`;;${k}: ${meta[k]}`);
  lines.push('');
  for (const sec of sections) {
    if (sec.label) { lines.push(`;;section: ${sec.label}`, ''); }
    const rParts=[], lParts=[], cParts=[];
    const hasCLine = sec.bars.every(bar=>bar.cols.every(col=>!!col.countTok));
    for (const bar of sec.bars) {
      const beats=[];
      let curBeat=[];
      for (const col of bar.cols) {
        if (col.beatStart&&curBeat.length>0) { beats.push(curBeat); curBeat=[]; }
        curBeat.push(col);
      }
      if (curBeat.length) beats.push(curBeat);
      if (!beats.length) beats.push([]);

      const rBeat=[], lBeat=[], cBeat=[];
      for (const beat of beats) {
        const rSg=[[]], lSg=[[]], cSg=[[]];
        for (const col of beat) {
          if (col.sub&&rSg[rSg.length-1].length>0) { rSg.push([]); lSg.push([]); cSg.push([]); }
          rSg[rSg.length-1].push(fmtCell(col.R));
          lSg[lSg.length-1].push(fmtCell(col.L));
          cSg[cSg.length-1].push((col.countTok||'·').padEnd(3));
        }
        rBeat.push(rSg.map(g=>g.join(' ')).join(' | '));
        lBeat.push(lSg.map(g=>g.join(' ')).join(' | '));
        cBeat.push(cSg.map(g=>g.join(' ')).join(' | '));
      }
      rParts.push('||| '+rBeat.join(' || '));
      lParts.push('||| '+lBeat.join(' || '));
      cParts.push('||| '+cBeat.join(' || '));
    }
    if (hasCLine) lines.push('C: '+cParts.join(' ')+' |||');
    lines.push('R: '+rParts.join(' ')+' |||');
    lines.push('L: '+lParts.join(' ')+' |||');
  }
  return lines.join('\n');
}

export function fmtCell(c) { if (!c||c.hit==='-') return '-  '; return (c.hit+(c.mod||'')).padEnd(3); }

// ─────────────────────────────────────────────
//  SUBDIVISION
// ─────────────────────────────────────────────

export function subdivCountToks(beatNum, n) {
  const res = [String(beatNum)];
  if (n < 2) return res;
  if (n === 2) { res.push('&'); return res; }
  const cycle = ['e','&','a'];
  for (let i=0;i<n-1;i++) res.push(cycle[i%3]);
  return res;
}

export function applySubdivision(sections, groups) {
  if (!groups || !groups.length || groups.some(n=>!(n>0))) return;
  const barSize = groups.reduce((a,b)=>a+b, 0);
  for (const sec of sections) {
    for (const bar of sec.bars) {
      if (bar.cols.length !== barSize) continue;
      const noCountSet = bar.cols.every(c=>!c.countTok);
      let pos=0;
      for (let gi=0;gi<groups.length;gi++) {
        const toks = noCountSet ? subdivCountToks(gi+1, groups[gi]) : null;
        for (let i=0;i<groups[gi];i++) {
          const col=bar.cols[pos];
          col.beatStart = (gi>0 && i===0);
          if (toks) col.countTok = toks[i]||null;
          pos++;
        }
      }
    }
  }
}

// ─────────────────────────────────────────────
//  BUILT-IN PATTERNS
// ─────────────────────────────────────────────

export const PATTERNS = [
  { cat:'Spec', name:'Maqsoum',         time:'4/4', grid:'8th', hat:
`// HAT v1.3.4 reference — always updated to latest spec version\n;;HAT v1.3.4\n;;title: Maqsoum\n;;time: 4/4\n;;grid: 8th\n\nC: ||| 1   &   || 2   &   || 3   &   || 4   &   |||\nR: ||| D   -   || •   -   || D   -   || T   -   |||\nL: ||| -   K   || -   K   || -   •   || -   •   |||` },
  { cat:'Spec', name:'Bulería',         time:'12/8', grid:'8th', hat:
`// HAT v1.3.4 reference — always updated to latest spec version\n;;HAT v1.3.4\n;;title: Bulería\n;;time: 12/8\n;;grid: 8th\n;;subdivision: 3+3+2+2+2\n;;tuning: D Kurd\n;;notes:        D4  F4  A4  Bb4 C5  D5  F5  G4  E4  Bb3 G5  A5\n;;note-numbers: 1   2   3   4   5   6   7   8   9   10  11  12\n;;x-chord-1: D4 A4 D5\n;;x-chord-2: F4 C5 F5\n;;x-chord-3: G4 D5 G5\n\nC: ||| 1   e   &   || 2   e   &   || 3   &   || 4   &   || 5   &   |||\nR: ||| c1  -   3   || T   -   6   || c2  -   || 3   -   || c1  -   |||\nL: ||| -   3   -   || -   •   -   || -   •   || -   •   || -   3   |||` },
];
