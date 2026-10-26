/* Game logic, HUD, sound, main loop */
const $=id=>document.getElementById(id);
const bn=n=>String(Math.floor(n)).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const HL={
  bus:["বাসের সামনে অটো: চালক বললেন, ‘ব্রেক ছিল, মনে ছিল না’","বাস মালিক সমিতি: ঘটনার সঙ্গে আমাদের কোনো সম্পর্ক নেই"],
  mob:["উত্তেজিত জনতার হাতে অটোচালক: পুলিশ বলল, ‘খবর পেয়ে আসছি’","ধোলাই শেষে মামলা হলো ‘অজ্ঞাতনামা’ ব্যক্তির নামে"],
  battery:["মাঝরাস্তায় চার্জ শেষ: অটো ঠেলে নিলেন যাত্রীরাই","লোডশেডিংয়ে চার্জ হয়নি: অটো এখন রাস্তার শোভা"]
};
let st='menu',P=null,obs=[],score,batt,anger,v,spawnT,chT,shake,dist,hitCD,best=0,AC,mute=false;
try{best=+localStorage.getItem('dd3_best')||0}catch(e){}

/* sound */
function ac(){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();AC.resume()}catch(e){}}
function beep(f,d=.12,ty='square'){
  if(mute||!AC)return;
  try{
    const o=AC.createOscillator(),gn=AC.createGain(),t=AC.currentTime;
    o.type=ty;o.frequency.value=f;
    gn.gain.setValueAtTime(.08,t);gn.gain.exponentialRampToValueAtTime(.001,t+d);
    o.connect(gn);gn.connect(AC.destination);o.start();o.stop(t+d);
  }catch(e){}
}
$('snd').onclick=e=>{mute=!mute;e.target.textContent=mute?'🔇':'🔊';ac()};
Input.onTouch=ac;
Input.onHorn=()=>{ac();beep(300,.25,'sawtooth')};
Input.onEnter=()=>{if(st!=='play')start()};

/* state */
function init(){
  obs.forEach(o=>World.scene.remove(o.m));obs=[];
  if(!P){P={m:World.makeAuto()};World.scene.add(P.m)}
  P.x=0;P.a=0;score=0;batt=100;anger=0;v=15;shake=0;dist=0;hitCD=0;spawnT=0;chT=5;
  P.m.position.set(0,0,0);P.m.rotation.set(0,0,0);
}
function showMenu(){
  $('ov').innerHTML=`<h1>ঢাকা ড্যাশ 3D</h1><p class="sub">ব্যাটারির অটো, ঢাকার জ্যাম, আর আপনার সাহস</p>
  <ul><li>💥 গাড়িতে ধাক্কা দিলে ক্ষতি বাড়ে, পাবলিকও রাগে</li><li>🚌 বাস ছুঁলেই খেলা শেষ</li><li>⚡ হলুদ চার্জার ধরে ব্যাটারি ভরুন</li><li>🏃 পাবলিক ১০০% হলে ধোলাই</li></ul>
  <p class="sub">সেরা ক্ষতি: ৳ ${bn(best)}</p><button id="go">চালু করুন</button>`;
  $('ov').style.display='flex';$('go').onclick=start;
}
function start(){ac();init();st='play';$('ov').style.display='none'}
function over(r){
  if(st!=='play')return;
  st='over';const s=Math.floor(score);
  if(s>best){best=s;try{localStorage.setItem('dd3_best',s)}catch(e){}}
  beep(90,.5,'sawtooth');
  const a=HL[r],ic={bus:'🚌',mob:'🏃',battery:'🪫'}[r];
  $('ov').innerHTML=`<div style="font-size:48px">${ic}</div><h2>খেলা শেষ</h2><div class="hl">${a[Math.random()*a.length|0]}</div>
  <p>জাতীয় ক্ষতি <b>৳ ${bn(s)}</b><br>সেরা ৳ ${bn(best)}</p><button id="go">আবার চালান</button>`;
  $('ov').style.display='flex';$('go').onclick=start;
}

function spawn(){
  const t=dist/60,bus=Math.random()<Math.min(.35,.12+t*.004);
  const cols=[0x3b82c4,0xe8e8e8,0x8b5cf6,0xe07b39,0xc9a227];
  const o=bus?{type:'bus',m:World.makeBus(),hw:1.3,hd:4,s:8}
             :{type:'car',m:World.makeCar(cols[Math.random()*cols.length|0]),hw:1,hd:2,s:3+Math.random()*4};
  o.x=(Math.random()*2-1)*(6-o.hw);o.z=-110;
  o.m.position.set(o.x,0,o.z);World.scene.add(o.m);obs.push(o);
}

function update(dt){
  const steer=(Input.right?1:0)-(Input.left?1:0);
  const B=Input.boost,S=Input.brake;
  const tv=B?26:S?5:15;
  v+=(tv-v)*Math.min(1,dt*(S?5:2.5));
  P.x=Math.max(-5.8,Math.min(5.8,P.x+steer*9*dt));
  P.a+=(steer*.3-P.a)*Math.min(1,dt*8);
  dist+=v*dt;score+=v*dt*.4;
  World.scroll(v*dt);
  batt-=dt*(B?4.5:S?.8:2);
  anger=Math.max(0,anger-dt*3);hitCD-=dt;shake*=.9;
  if(batt<=0)return over('battery');
  if(anger>=100)return over('mob');
  const t=dist/60;
  spawnT-=dt;
  if(spawnT<=0){spawn();spawnT=Math.max(.45,1.1-t*.02)*(.7+Math.random()*.6)}
  chT-=dt;
  if(chT<=0){
    const o={type:'ch',m:World.makeCharger(),hw:1,hd:1,s:0,x:(Math.random()*2-1)*5,z:-110};
    World.scene.add(o.m);obs.push(o);chT=7+Math.random()*4;
  }
  for(const o of obs){
    o.z+=(v-o.s)*dt;
    if(o.dead){
      o.x+=o.vx*dt;o.m.rotation.y+=dt*8;o.m.position.y+=dt*4;o.life-=dt;
      o.m.scale.setScalar(Math.max(.01,o.life/.8));
    }else{
      if(o.type==='ch')o.m.rotation.y+=dt*3;
      if(Math.abs(o.x-P.x)<o.hw+.85&&Math.abs(o.z)<o.hd+1.45){
        if(o.type==='ch'){batt=Math.min(100,batt+35);o.gone=true;beep(880,.15,'triangle')}
        else if(o.type==='bus'){shake=14;return over('bus')}
        else if(hitCD<=0){
          hitCD=.35;o.dead=true;o.vx=(o.x>=P.x?1:-1)*14;o.life=.8;
          score+=300+Math.random()*700;anger+=16;v*=.45;shake=10;beep(120,.2,'sawtooth');
        }
      }
    }
    o.m.position.x=o.x;o.m.position.z=o.z;
  }
  obs=obs.filter(o=>{
    const gone=o.gone||o.z>25||o.z<-170||(o.dead&&o.life<=0);
    if(gone)World.scene.remove(o.m);
    return !gone;
  });
}

function camera(dt){
  const c=World.camera,k=Math.min(1,dt*5);
  c.position.x+=(P.x*.6-c.position.x)*k;
  c.position.y=5.2+(shake>.1?(Math.random()-.5)*shake*.08:0);
  c.position.z=9.5;
  c.lookAt(P.x*.8,1.4,-14);
  const tf=62+(v-15)*.8;
  c.fov+=(tf-c.fov)*k;c.updateProjectionMatrix();
}

function hud(){
  $('tCh').textContent='চার্জ '+bn(batt)+'%';
  $('bCh').style.width=Math.max(0,batt)+'%';
  $('bCh').style.background=batt<25?'#e5484d':'#4ade80';
  $('tAn').textContent='পাবলিক '+bn(anger)+'%';
  $('bAn').style.width=Math.min(100,anger)+'%';
  $('tSc').textContent='৳ '+bn(score);
}

let last=0;
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000||0);last=ts;
  if(st==='play')update(dt);else World.scroll(4*dt);
  P.m.position.x=P.x;
  P.m.rotation.y=-P.a;P.m.rotation.z=-P.a*.12;
  camera(dt);hud();
  World.renderer.render(World.scene,World.camera);
  requestAnimationFrame(loop);
}
init();showMenu();requestAnimationFrame(loop);
