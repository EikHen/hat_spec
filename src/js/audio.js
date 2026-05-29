// SPDX-License-Identifier: AGPL-3.0-or-later
// Web Audio: getActx, playHit, scheduleLoop, startPlayback, stopPlayback.

import { state, getSelCols } from './state.js';

export let _playing = false;
let _actx=null, _noiseBuf=null;

let _masterVolume = 1.0;
export function setMasterVolume(v) { _masterVolume = Math.max(0, Math.min(1, +v || 0)); }

let _doumNote = '';
export function setDoumNote(v) { _doumNote = typeof v === 'string' ? v.trim() : ''; }

let _ghostVolume = 1.0;
export function setGhostVolume(v) { _ghostVolume = Math.max(0, Math.min(1, +v || 0)); }

let _stepIdx=0, _nextStepTime=0, _schedTimer=null, _phRaf=null;
const LOOKAHEAD=0.12, SCHED_MS=40;

// Ring buffer for playhead sync — records (stepIdx, scheduledTime) for each step.
// animatePlayhead walks this to find the step closest to actx.currentTime - latency.
const RING_SIZE=64;
const _ring=new Array(RING_SIZE);
let _ringHead=0, _ringCount=0;

// Late-bound embed ref (set by main.js to avoid circular import)
export const _embedRef = {};
export function setEmbedRef(ref) { Object.assign(_embedRef, ref); }

export function getActx() { if(!_actx)_actx=new AudioContext(); return _actx; }

function getNoiseBuf(actx) {
  if (_noiseBuf) return _noiseBuf;
  const sr=actx.sampleRate, buf=actx.createBuffer(1,sr*1.5,sr), d=buf.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  return (_noiseBuf=buf);
}

const _NOTE_SEMI = {C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
export function noteToHz(name) {
  const m = name.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!m) return 440;
  const semi = _NOTE_SEMI[m[1]];
  if (semi === undefined) return 440;
  const midi = 12 * (parseInt(m[2], 10) + 1) + semi;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function playHit(actx, t, hit, _scale=1) {
  if (!hit||hit==='-') return;
  if (/^c\d+$/.test(hit)) {
    const def = state.parsed?.meta?.[`x-chord-${hit.slice(1)}`];
    if (def) {
      const notes = def.trim().split(/\s+/);
      notes.forEach(n => playHit(actx, t, n, _scale / notes.length));
    }
    return;
  }
  const nb=getNoiseBuf(actx);

  function noise(t2,dur,bpFreq,bpQ,vol,hpFreq) {
    const src=actx.createBufferSource(); src.buffer=nb;
    const filt=actx.createBiquadFilter();
    if (bpFreq) { filt.type='bandpass'; filt.frequency.value=bpFreq; filt.Q.value=bpQ||1; }
    else { filt.type='highpass'; filt.frequency.value=hpFreq||200; }
    const g=actx.createGain(); g.gain.setValueAtTime(vol*_scale*_masterVolume,t2); g.gain.exponentialRampToValueAtTime(0.001,t2+dur);
    src.connect(filt); filt.connect(g); g.connect(actx.destination); src.start(t2); src.stop(t2+dur+0.01);
  }

  function tone(t2,freq,type,vol,dur,pitchDrop) {
    const osc=actx.createOscillator(); osc.type=type;
    if (pitchDrop){ osc.frequency.setValueAtTime(freq*1.6,t2); osc.frequency.exponentialRampToValueAtTime(freq,t2+0.08); }
    else osc.frequency.value=freq;
    const g=actx.createGain(); g.gain.setValueAtTime(vol*_scale*_masterVolume,t2); g.gain.exponentialRampToValueAtTime(0.001,t2+dur);
    osc.connect(g); g.connect(actx.destination); osc.start(t2); osc.stop(t2+dur+0.01);
  }

  switch(hit) {
    case 'D':
      if (_doumNote) {
        const dFreq=noteToHz(_doumNote), dur2=2.0;
        tone(t,dFreq,'sine',0.50,dur2); tone(t,dFreq*2.0,'sine',0.16,dur2*0.55); tone(t,dFreq*3.0,'sine',0.06,dur2*0.35);
        noise(t,0.018,0,0,0.08,900);
      } else { tone(t,92,'sine',0.60,0.75,true); noise(t,0.028,0,0,0.30,280); }
      break;
    case 'd': tone(t,92,'sine',0.28,0.15,true);  noise(t,0.012,0,0,0.12,280); break;
    case 'T': noise(t,0.15,870,5.5,0.60); tone(t,520,'sine',0.22,0.035); break;
    case 't': noise(t,0.06,870,5.5,0.28); tone(t,520,'sine',0.10,0.018); break;
    case 'K': noise(t,0.14,640,4.5,0.58); tone(t,370,'sine',0.19,0.035); break;
    case 'k': noise(t,0.05,640,4.5,0.24); tone(t,370,'sine',0.08,0.018); break;
    case 'S': noise(t,0.10,0,0,0.52,1500); tone(t,310,'sawtooth',0.16,0.030); break;
    case 's': noise(t,0.04,0,0,0.22,1500); break;
    case '•': noise(t,0.09,500,10,0.24*_ghostVolume); tone(t,240,'sine',0.056*_ghostVolume,0.08); break;
    default: {
      const freq = noteToHz(hit);
      const dur = 2.0;
      tone(t, freq,       'sine', 0.50, dur);
      tone(t, freq * 2.0, 'sine', 0.16, dur * 0.55);
      tone(t, freq * 3.0, 'sine', 0.06, dur * 0.35);
      noise(t, 0.018, 0, 0, 0.08, 900);
      break;
    }
  }
}

export function gridStepSec() {
  const bpm=+document.getElementById('bpm').value;
  const grid=state.parsed?.meta?.grid||'8th';
  return 60/(bpm*(grid==='4th'?1:grid==='16th'?4:2));
}

function ringPush(stepIdx, scheduledTime) {
  _ring[_ringHead % RING_SIZE] = { stepIdx, scheduledTime };
  _ringHead++;
  if (_ringCount < RING_SIZE) _ringCount++;
}

function ringClear() { _ringHead=0; _ringCount=0; }

function scheduleLoop() {
  if (!_playing||!state.parsed?.ok) return;
  const actx=getActx(), cols=state.parsed.cols;
  if (!cols?.length) return;
  // Resume if context was suspended by browser (autoplay policy / inactivity)
  if (actx.state==='suspended') actx.resume().catch(()=>{});
  const step=gridStepSec();
  while (_nextStepTime<actx.currentTime+LOOKAHEAD) {
    const colIdx=_stepIdx%cols.length;
    const col=cols[colIdx];
    ringPush(colIdx, _nextStepTime);
    if (col) {
      const tOffMs=(_nextStepTime-actx.currentTime)*1000;
      const barIdx=Math.floor(_stepIdx/cols.length);
      const { _postToHost } = _embedRef;
      if (_postToHost) {
        if (col.R?.hit && col.R.hit!=='-') _postToHost({type:'hat:hit',hand:'R',symbol:col.R.hit,isNote:col.R.hit.length>1,colIndex:colIdx,barIndex:barIdx,tOffsetMs:tOffMs});
        if (col.L?.hit && col.L.hit!=='-') _postToHost({type:'hat:hit',hand:'L',symbol:col.L.hit,isNote:col.L.hit.length>1,colIndex:colIdx,barIndex:barIdx,tOffsetMs:tOffMs});
      }
      playHit(actx,_nextStepTime,col.R?.hit); playHit(actx,_nextStepTime,col.L?.hit);
    }
    _nextStepTime+=step; _stepIdx++;
    if (_stepIdx>=cols.length) {
      if (!document.getElementById('loop-chk').checked){ setTimeout(stopPlayback,(_nextStepTime-actx.currentTime)*1000+100); return; }
      _stepIdx=0;
    }
  }
}

function highlightCol(idx) {
  document.querySelectorAll('.hat-cell.playing').forEach(el=>el.classList.remove('playing'));
  if (idx>=0) document.querySelectorAll(`.hat-cell[data-colidx="${idx}"]`).forEach(el=>el.classList.add('playing'));
}

function animatePlayhead() {
  if (!_playing) return;
  if (_actx && state.parsed?.cols?.length && _ringCount > 0) {
    const latency=(_actx.outputLatency||0)+(_actx.baseLatency||0);
    const now=_actx.currentTime - latency;
    // Walk the ring buffer to find the entry whose scheduledTime is closest to now
    let bestIdx=-1, bestDiff=Infinity;
    const start=Math.max(0, _ringHead - _ringCount);
    for (let i=start; i<_ringHead; i++) {
      const entry=_ring[i % RING_SIZE];
      const diff=now - entry.scheduledTime;
      if (diff >= 0 && diff < bestDiff) { bestDiff=diff; bestIdx=entry.stepIdx; }
    }
    if (bestIdx >= 0) highlightCol(bestIdx);
  }
  _phRaf=requestAnimationFrame(animatePlayhead);
}

export function startPlayback() {
  if (!state.parsed?.ok) return;
  const actx=getActx(); if (actx.state==='suspended') actx.resume().catch(()=>{});
  const selCols=getSelCols();
  const startIdx=selCols.size>0?Math.min(...selCols):0;
  ringClear();
  _stepIdx=startIdx; _nextStepTime=actx.currentTime+0.05; _playing=true;
  document.getElementById('play-btn').textContent='⏹';
  _schedTimer=setInterval(scheduleLoop,SCHED_MS); animatePlayhead();
  const { _postToHost } = _embedRef;
  if (_postToHost) _postToHost({type:'hat:playback-state',playing:true,bpm:state.parsed.meta.tempo||120,grid:state.parsed.meta.grid||'8th'});
}

export function stopPlayback() {
  _playing=false; clearInterval(_schedTimer); cancelAnimationFrame(_phRaf);
  ringClear();
  document.getElementById('play-btn').textContent='▶'; highlightCol(-1);
  const { _postToHost } = _embedRef;
  if (_postToHost) _postToHost({type:'hat:playback-state',playing:false,bpm:state.parsed?.meta?.tempo||120,grid:state.parsed?.meta?.grid||'8th'});
}

// Resume audio context when page becomes visible (e.g. returning from another tab)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _playing && _actx) {
    _actx.resume().catch(()=>{});
  }
});
