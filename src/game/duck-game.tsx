'use client';
import {useEffect,useRef,useState} from 'react';
import {advanceGame,createGame,fire,nextRound,requiredHits,startGame,WIDTH,HEIGHT} from './engine';
import {paintCreek} from './art';
import Leaderboard,{useRankedRun} from '../leaderboard/leaderboard';
const BEST_KEY='marcus-duck-creek-best-v1';
export default function DuckGame(){
  const ranking=useRankedRun('duck-creek');
  const canvas=useRef<HTMLCanvasElement>(null),game=useRef(createGame()),aim=useRef({x:480,y:230}),keys=useRef(new Set<string>());
  const pausedRef=useRef(false),soundRef=useRef(false),bestRef=useRef(0),audio=useRef<AudioContext|null>(null);
  const [view,setView]=useState(()=>({...game.current})),[paused,setPaused]=useState(false),[sound,setSound]=useState(false),[best,setBest]=useState(0);
  function sync(){setView({...game.current,results:[...game.current.results]})}
  function pause(value:boolean){pausedRef.current=value;setPaused(value);keys.current.clear()}
  function tone(kind:'hit'|'miss'|'start'){
    if(!soundRef.current)return;
    try{
      const context=audio.current||(audio.current=new AudioContext());if(context.state==='suspended')void context.resume().catch(()=>{});
      const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='square';
      oscillator.frequency.setValueAtTime(kind==='hit'?740:kind==='start'?440:140,context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(kind==='hit'?1100:70,context.currentTime+.12);
      gain.gain.setValueAtTime(.035,context.currentTime);gain.gain.exponentialRampToValueAtTime(.001,context.currentTime+.14);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.15);
    }catch{/* Audio is optional; gameplay remains available. */}
  }
  function shoot(){if(pausedRef.current)return;const result=fire(game.current,aim.current.x,aim.current.y);if(result){tone(result);sync()}}
  function begin(){ranking.begin();startGame(game.current);pause(false);aim.current={x:480,y:230};tone('start');sync();canvas.current?.focus({preventScroll:true})}
  function advanceRound(){nextRound(game.current);pause(false);tone('start');sync();canvas.current?.focus({preventScroll:true})}
  useEffect(()=>{
    try{const stored=Number(localStorage.getItem(BEST_KEY));if(Number.isFinite(stored)&&stored>0){bestRef.current=Math.floor(stored);setBest(bestRef.current)}}catch{}
    const context=canvas.current?.getContext('2d');if(!context)return;
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame=0,last=0,lastSync=0,sceneTime=0;
    const animate=(now:number)=>{
      const dt=last?Math.min((now-last)/1000,.05):0;last=now;
      if(!pausedRef.current){
        sceneTime+=dt;
        if(game.current.phase==='flying'||game.current.phase==='between')advanceGame(game.current,dt);
        const held=keys.current;aim.current.x=Math.max(20,Math.min(WIDTH-20,aim.current.x+((held.has('arrowright')||held.has('d')?1:0)-(held.has('arrowleft')||held.has('a')?1:0))*440*dt));
        aim.current.y=Math.max(40,Math.min(430,aim.current.y+((held.has('arrowdown')||held.has('s')?1:0)-(held.has('arrowup')||held.has('w')?1:0))*360*dt));
      }
      paintCreek(context,game.current,aim.current,sceneTime,reduced);
      if(now-lastSync>100){
        lastSync=now;setView({...game.current,results:[...game.current.results]});
        if(game.current.score>bestRef.current){bestRef.current=game.current.score;setBest(game.current.score);try{localStorage.setItem(BEST_KEY,String(game.current.score))}catch{}}
      }
      frame=requestAnimationFrame(animate);
    };
    frame=requestAnimationFrame(animate);
    const hide=()=>{if(document.hidden&&(game.current.phase==='flying'||game.current.phase==='between'))pause(true)};
    const blur=()=>{keys.current.clear();if(game.current.phase==='flying'||game.current.phase==='between')pause(true)};
    document.addEventListener('visibilitychange',hide);window.addEventListener('blur',blur);
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hide);window.removeEventListener('blur',blur);void audio.current?.close().catch(()=>{})};
  },[]);
  const live=view.phase==='flying'||view.phase==='between';
  const overlay=paused||view.phase==='ready'||view.phase==='roundEnd'||view.phase==='over';
  return <><section className="duck-cabinet" aria-label="Duck Creek arcade game">
    <div className="duck-hud"><div><span>SCORE</span><strong>{String(view.score).padStart(6,'0')}</strong></div><div className="duck-best"><span>PERSONAL BEST</span><strong>{String(best).padStart(6,'0')}</strong></div><div><span>ROUND</span><strong>{String(view.round).padStart(2,'0')}</strong></div><button type="button" className="duck-icon-button" aria-pressed={sound} onClick={()=>{soundRef.current=!soundRef.current;setSound(soundRef.current);if(soundRef.current)tone('start')}}>{sound?'Sound on':'Sound off'}</button><button type="button" className="duck-icon-button" disabled={!live} onClick={()=>pause(!paused)}>{paused?'Resume':'Pause'}</button></div>
    <div className="duck-field"><canvas ref={canvas} width={WIDTH} height={HEIGHT} tabIndex={0} role="img" aria-label="Duck Creek shooting field. Click or tap ducks. Keyboard: arrows or WASD to aim, Space to shoot, P to pause." onPointerMove={event=>{if(event.pointerType==='touch')return;const rect=event.currentTarget.getBoundingClientRect();aim.current={x:(event.clientX-rect.left)/rect.width*WIDTH,y:(event.clientY-rect.top)/rect.height*HEIGHT}}} onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();const rect=event.currentTarget.getBoundingClientRect();aim.current={x:(event.clientX-rect.left)/rect.width*WIDTH,y:(event.clientY-rect.top)/rect.height*HEIGHT};event.currentTarget.focus({preventScroll:true});shoot()}} onKeyDown={event=>{const key=event.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' ','p'].includes(key)){event.preventDefault();if(key===' '&&!event.repeat)shoot();else if(key==='p'&&!event.repeat&&live)pause(!pausedRef.current);else keys.current.add(key)}}} onKeyUp={event=>{keys.current.delete(event.key.toLowerCase())}}>Your browser needs canvas support to play Duck Creek.</canvas>
      {view.phase==='between'&&!paused?<div className="duck-wave-note" role="status">{view.notice}</div>:null}
      {overlay?<div className="duck-overlay"><div className="duck-overlay-card"><span className="duck-pixel-label">{paused?'TAKE A BREATHER':view.phase==='ready'?'WELCOME TO DUCK CREEK':view.phase==='roundEnd'?'NICE SHOOTING':'THAT’S A WRAP'}</span><h2>{paused?'The marsh can wait.':view.phase==='ready'?'A little 8-bit nostalgia.':view.phase==='roundEnd'?'Round cleared.':'One more round?'}</h2><p>{paused?'Your round is paused. Come back when you’re ready.':view.phase==='ready'?'Two ducks. Three shots. Hit 6 of 10 to advance. Simple enough… until they start flying.':view.phase==='roundEnd'?`${view.hits} of 10 ducks hit. The next round brings faster wings and bigger scores.`:`You hit ${view.hits} of 10 ducks this round. ${requiredHits(view.round)} were needed to advance.`}</p>{view.phase==='over'?<strong className="duck-final-score">{view.score.toLocaleString()}<small>FINAL SCORE</small></strong>:null}{view.phase==='over'&&view.score>0?<a className="duck-score-link" href="#duck-creek-scores">Save your score ↓</a>:null}<button type="button" className="duck-start" onClick={()=>{if(paused){pause(false);canvas.current?.focus({preventScroll:true})}else if(view.phase==='roundEnd')advanceRound();else begin()}}>{paused?'Back to the creek':view.phase==='ready'?'Start hunting':view.phase==='roundEnd'?`Play round ${view.round+1}`:'Try again'}<span aria-hidden="true">↗</span></button><small>CLICK / TAP TO SHOOT · ARROWS + SPACE TO PLAY</small></div></div>:null}
    </div>
    <div className="duck-score-strip"><div className="duck-ammo"><span>SHOTS</span><div aria-label={`${view.shots} shots remaining`}>{[0,1,2].map(n=><i key={n} className={n<view.shots?'loaded':''}/>)}</div></div><div className="duck-tally"><span>HITS <b>{view.hits}/10</b></span><div aria-label={`${view.hits} of 10 ducks hit`}>{view.results.map((result,n)=><i key={n} className={result===1?'hit':result===0?'escaped':''}>{result===1?'✓':result===0?'×':'·'}</i>)}</div></div><div className="duck-qualify"><span>TO ADVANCE</span><strong>{requiredHits(view.round)} / 10</strong></div></div>
    <div className="duck-status"><span role="status" aria-live="polite">{paused?'Paused.':view.notice}</span><span>BLUE DUCKS = BONUS POINTS</span></div>
  </section><Leaderboard game="duck-creek" run={ranking.run} rankingError={ranking.rankingError} result={view.phase==='over'?{score:view.score,stats:{round:view.round,hits:view.hits,totalHits:view.totalHits,fired:view.fired,elapsed:view.elapsed}}:null}/></>;
}
