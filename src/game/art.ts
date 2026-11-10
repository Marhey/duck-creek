import {WIDTH,HEIGHT,type Game} from './engine';
const sprite=[
'.............gggg.......',
'............gggggg......',
'............ggkggooo....',
'...........ggggggoooo...',
'...........wwwwww.......',
'......bbbbbbbbwww.......',
'....bbbbbbbbbbww........',
'..bbbbbbbbbbbbb.........',
'.ttbbbbbbbbbbbb.........',
'..ttbbbbbbbbbb..........',
'....tttttttt............',
'......tttt..............',
];
function pixelDuck(ctx:CanvasRenderingContext2D,x:number,y:number,dir:number,flap:number,bonus=false,scale=4){
  ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(dir,1);
  const palette:Record<string,string>={g:bonus?'#486997':'#3c7353',k:'#132d30',o:'#eea347',w:'#f5e9c9',b:bonus?'#a9c5d2':'#ae7460',t:'#38484a'};
  for(let row=0;row<sprite.length;row++)for(let col=0;col<sprite[row].length;col++){const color=palette[sprite[row][col]];if(color){ctx.fillStyle=color;ctx.fillRect((col-12)*scale,(row-6)*scale,scale,scale)}}
  ctx.fillStyle=bonus?'#6388a0':'#775b51';
  if(flap%2===0){ctx.fillRect(-12,-32,12,32);ctx.fillRect(-24,-40,12,16);ctx.fillRect(-32,-44,8,12)}
  else{ctx.fillRect(-12,0,16,20);ctx.fillRect(-24,12,12,16);ctx.fillRect(-28,22,8,12)}
  ctx.restore();
}
function cloud(ctx:CanvasRenderingContext2D,x:number,y:number,scale=1){ctx.fillStyle='#fff2cc';for(const [a,b,w,h] of [[0,8,62,12],[12,0,33,28],[44,12,34,12]])ctx.fillRect(Math.round(x+a*scale),y+b*scale,w*scale,h*scale)}
export function paintCreek(ctx:CanvasRenderingContext2D,game:Game,aim:{x:number;y:number},time:number,reduced:boolean){
  ctx.clearRect(0,0,WIDTH,HEIGHT);ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#e7bf8c';ctx.fillRect(0,0,WIDTH,HEIGHT);ctx.fillStyle='#f2d4a2';ctx.fillRect(0,100,WIDTH,260);
  ctx.fillStyle='#f9e7b5';ctx.fillRect(708,66,64,64);ctx.fillRect(700,80,80,36);
  const drift=reduced?0:time*3%100;
  cloud(ctx,94+drift,75,1.2);cloud(ctx,420+drift*.5,145,.8);cloud(ctx,790-drift*.3,180,.6);
  ctx.fillStyle='#9daa81';for(let i=0;i<16;i++)ctx.fillRect(i*70,318-(i%4)*13,74,94);
  ctx.fillStyle='#638b75';for(let i=0;i<19;i++)ctx.fillRect(i*58-10,350-(i%3)*16,65,84);
  ctx.fillStyle='#426e65';ctx.fillRect(0,388,WIDTH,110);ctx.fillStyle='#8db3a0';ctx.fillRect(0,404,WIDTH,4);
  ctx.fillStyle='#b4c0a0';for(let i=0;i<25;i++){const x=(i*87+(reduced?0:time*7))%WIDTH;ctx.fillRect(x,420+(i%5)*14,16+(i%4)*8,3)}
  // Original pixel marsh silhouettes and cattails.
  ctx.fillStyle='#244d49';ctx.fillRect(0,474,WIDTH,66);ctx.fillRect(0,458,190,30);ctx.fillRect(748,448,212,45);
  for(let i=0;i<55;i++){const x=i*19;ctx.fillRect(x,452-(i%5)*7,5,55);ctx.fillRect(x+5,461-(i%4)*7,5,34)}
  for(const x of [26,53,91,850,886,926]){ctx.fillStyle='#34594d';ctx.fillRect(x,363+(x%3)*10,5,125);ctx.fillStyle='#765a42';ctx.fillRect(x-4,350+(x%3)*10,12,30)}
  ctx.fillStyle='#183c39';ctx.fillRect(0,514,WIDTH,26);ctx.fillStyle='#587452';for(let i=0;i<48;i++)ctx.fillRect(i*22,517,10,3);
  if(game.phase==='ready'){pixelDuck(ctx,580,230,1,reduced?0:Math.floor(time*4));pixelDuck(ctx,785,290,-1,reduced?1:Math.floor(time*4)+1,true)}
  for(const duck of game.ducks){if(duck.age<0)continue;if(duck.state==='flying'||duck.state==='escaped')pixelDuck(ctx,duck.x,duck.y,duck.vx>0?1:-1,Math.floor(duck.age*8),duck.bonus);else if(duck.age<.7){
    const r=14+duck.age*22;ctx.strokeStyle='#fff5ce';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(duck.x-r,duck.y);ctx.lineTo(duck.x+r,duck.y);ctx.moveTo(duck.x,duck.y-r);ctx.lineTo(duck.x,duck.y+r);ctx.stroke();
    ctx.fillStyle='#163d38';ctx.font='bold 22px monospace';ctx.textAlign='center';ctx.fillText('+'+duck.points,duck.x,duck.y-25-duck.age*30);
  }}
  if(game.phase==='flying'){
    ctx.fillStyle='#1c4140';ctx.font='bold 14px monospace';ctx.textAlign='left';ctx.fillText('WAVE '+(game.wave+1)+' / 5',28,32);ctx.textAlign='right';ctx.fillText(Math.max(0,game.time).toFixed(1)+'s',WIDTH-28,32);
    ctx.strokeStyle='#173d3b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(aim.x,aim.y,15,0,Math.PI*2);ctx.moveTo(aim.x-23,aim.y);ctx.lineTo(aim.x-8,aim.y);ctx.moveTo(aim.x+8,aim.y);ctx.lineTo(aim.x+23,aim.y);ctx.moveTo(aim.x,aim.y-23);ctx.lineTo(aim.x,aim.y-8);ctx.moveTo(aim.x,aim.y+8);ctx.lineTo(aim.x,aim.y+23);ctx.stroke();
    ctx.fillStyle='#fff4d1';ctx.fillRect(aim.x-2,aim.y-2,4,4);
  }
  if(game.lastShot){ctx.strokeStyle='#fff7da';ctx.lineWidth=3;ctx.beginPath();ctx.arc(game.lastShot.x,game.lastShot.y,12+game.lastShot.age*110,0,Math.PI*2);ctx.stroke()}
}
