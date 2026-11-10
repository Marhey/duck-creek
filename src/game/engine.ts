export const WIDTH=960,HEIGHT=540;
export type Duck={id:number;x:number;y:number;vx:number;vy:number;age:number;state:'flying'|'hit'|'escaped';bonus:boolean;points:number};
export type Game={phase:'ready'|'flying'|'between'|'roundEnd'|'over';round:number;wave:number;score:number;shots:number;hits:number;fired:number;totalHits:number;elapsed:number;results:number[];ducks:Duck[];time:number;wait:number;notice:string;lastShot:{x:number;y:number;age:number}|null};
export function createGame():Game{return {phase:'ready',round:1,wave:0,score:0,shots:3,hits:0,fired:0,totalHits:0,elapsed:0,results:Array(10).fill(-1),ducks:[],time:0,wait:0,notice:'Ready for a little arcade nostalgia.',lastShot:null}}
export function requiredHits(round:number){return Math.min(8,5+round)}
export function launchWave(game:Game,random=Math.random){
  const speed=1+Math.min(game.round-1,12)*.12;
  game.phase='flying';game.shots=3;game.time=Math.max(4.5,7.5-(game.round-1)*.3);
  game.ducks=Array.from({length:2},(_,id)=>{const bonus=random()>.76;return {id,x:180+random()*600,y:360+random()*40,vx:(random()>.5?1:-1)*(105+random()*55)*speed,vy:-(75+random()*55)*speed,age:-id*.5,state:'flying' as const,bonus,points:(bonus?250:100)*game.round}});
  game.notice=`Round ${game.round}, wave ${game.wave+1}. Two ducks, three shots.`;
}
export function startGame(game:Game,random=Math.random){Object.assign(game,createGame());launchWave(game,random)}
function endWave(game:Game){
  for(const duck of game.ducks)if(duck.state==='flying'){duck.state='escaped';duck.age=0;game.results[game.wave*2+duck.id]=0}
  game.phase='between';game.wait=1.1;
  const pair=game.ducks.every(d=>d.state==='hit');
  if(pair&&game.shots===1){game.score+=100*game.round;game.notice=`Perfect pair! ${100*game.round} bonus points.`}
  else game.notice=pair?'Nice shooting. Both ducks!':'Fly away! A fresh pair is coming.';
}
export function advanceGame(game:Game,elapsed:number,random=Math.random){
  const dt=Math.min(.05,Math.max(0,elapsed));
  if(game.phase==='flying'||game.phase==='between')game.elapsed+=dt;
  if(game.lastShot){game.lastShot.age+=dt;if(game.lastShot.age>.25)game.lastShot=null}
  for(const duck of game.ducks){duck.age+=dt;if(duck.state==='flying'&&duck.age>=0&&game.phase==='flying'){
    duck.x+=duck.vx*dt;duck.y+=duck.vy*dt;
    if(duck.x<55){duck.x=55;duck.vx=Math.abs(duck.vx)}if(duck.x>WIDTH-55){duck.x=WIDTH-55;duck.vx=-Math.abs(duck.vx)}
    if(duck.y<65){duck.y=65;duck.vy=Math.abs(duck.vy)}if(duck.y>375){duck.y=375;duck.vy=-Math.abs(duck.vy)}
  }else if(duck.state==='escaped')duck.y-=300*dt}
  if(game.phase==='flying'){
    game.time-=dt;if(game.time<=0||game.shots===0||game.ducks.every(d=>d.state==='hit'))endWave(game);
  }else if(game.phase==='between'){
    game.wait-=dt;if(game.wait<=0){if(game.wave<4){game.wave++;launchWave(game,random)}else{
      game.phase=game.hits>=requiredHits(game.round)?'roundEnd':'over';
      game.notice=game.phase==='roundEnd'?`Round cleared! ${game.hits} of 10. Get ready for faster flights.`:`Game over. ${game.hits} of 10 ducks hit. ${requiredHits(game.round)} needed to advance.`;
    }}
  }
}
export function fire(game:Game,x:number,y:number){
  if(game.phase!=='flying'||game.shots<=0||!Number.isFinite(x)||!Number.isFinite(y))return null;
  game.shots--;game.fired++;game.lastShot={x,y,age:0};
  const duck=[...game.ducks].reverse().find(d=>d.state==='flying'&&d.age>=0&&((x-d.x)/44)**2+((y-d.y)/34)**2<=1);
  if(duck){duck.state='hit';duck.age=0;game.results[game.wave*2+duck.id]=1;game.hits++;game.totalHits++;game.score+=duck.points;game.notice=`Hit! ${duck.points} points. ${game.shots} shots left.`}
  else game.notice=`Miss. ${game.shots} shots left.`;
  return duck?'hit':'miss';
}
export function nextRound(game:Game,random=Math.random){if(game.phase!=='roundEnd')return;game.round++;game.wave=0;game.hits=0;game.results=Array(10).fill(-1);launchWave(game,random)}
