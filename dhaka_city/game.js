/* Game: missions, battery, public anger, camera, HUD, main loop */
const $=id=>document.getElementById(id);
const bn=n=>String(Math.floor(n)).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const HL={
  mob:["উত্তেজিত জনতার হাতে অটোচালক: পুলিশ বলল, ‘খবর পেয়ে আসছি’","ধোলাই শেষে মামলা হলো ‘অজ্ঞাতনামা’ ব্যক্তির নামে","গাড়ির মালিকরা একজোট: অটো এখন ‘আলোচনার বিষয়’"],
  battery:["মাঝরাস্তায় চার্জ শেষ: অটো ঠেলে নিলেন যাত্রীরাই","লোডশেডিংয়ে চার্জ হয়নি: অটো এখন রাস্তার শোভা"]
};
let st='menu',pl,traffic=[],all=[],score=0,batt=100,anger=0,shake=0,hitCD=0,msn=null,camA=0,best=0,AC,mute=false,flash='',flashT=0,charging=false,cdBeep=0;
try{best=+localStorage.getItem('dd4_best')||0}catch(e){}

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

/* vehicles */
const CARCOL=[0x3b82c4,0xe8e8e8,0x8b5cf6,0xe07b39,0xc9a227,0xb23a48];
pl=new Vehicle('auto',World.makeAuto());World.scene.add(pl.mesh);
for(let i=0;i<17;i++){
  const bus=i>=14,v=new Vehicle(bus?'bus':'car',bus?World.makeBus():World.makeCar(CARCOL[i%CARCOL.length]));
  World.scene.add(v.mesh);traffic.push(v);
}
all=[pl,...traffic];

/* mission marker */
const marker=new THREE.Group();
const beamMat=new THREE.MeshBasicMaterial({color:0x4dabff,transparent:true,opacity:.35,depthWrite:false,fog:false});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,80,14,1,true),beamMat);beam.position.y=40;
const ringM=new THREE.Mesh(new THREE.RingGeometry(3,4.4,28),new THREE.MeshBasicMaterial({color:0x4dabff,side:THREE.DoubleSide,fog:false}));
ringM.rotation.x=-Math.PI/2;ringM.position.y=.5;marker.add(beam,ringM);World.scene.add(marker);
function setMarker(p,col){marker.position.set(p.x,0,p.z);beamMat.color.setHex(col);ringM.material.color.setHex(col)}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const roadPoint=()=>{const i=Math.random()*N|0,t=((Math.random()*(N-1)|0)+.3+Math.random()*.4)*P;return Math.random()<.5?{x:i*P,z:t}:{x:t,z:i*P}};
function newMission(){
  let pk,dp,k=0;
  do{pk=roadPoint()}while(dist(pk,pl)<70&&k++<40);
  k=0;do{dp=roadPoint()}while(dist(dp,pk)<110&&k++<40);
  msn={stage:0,pk,dp,fare:Math.round(dist(pk,dp)*.9)};
  setMarker(pk,0x4dabff);
}
function say(t){flash=t;flashT=2.2}

/* state */
function init(){
  score=0;batt=100;anger=0;shake=0;hitCD=0;charging=false;
  pl.x=2*P-3.2;pl.z=2*P+20;pl.vx=pl.vz=pl.av=0;pl.a=0;camA=0;
  traffic.forEach(v=>placeAI(v,pl,all));
  newMission();
}
function showMenu(){
  $('ov').innerHTML=`<h1>ঢাকা ড্যাশ: শহর</h1><p class="sub">ব্যাটারির অটো নিয়ে পুরো শহর ঘুরুন</p>
  <ul><li>🔵 নীল বিমে যাত্রী তুলুন, 🟢 সবুজ বিমে নামান, ভাড়া পান</li><li>💥 গাড়িকে পাশ থেকে ধাক্কা দিলে সরে যায়, কিন্তু পাবলিক রাগে</li><li>⚡ সবুজ চার্জ স্টেশনে থামলে ব্যাটারি ভরে</li><li>🗺️ মানচিত্রে ট্যাপ করলে বড় হয়</li></ul>
  <p class="sub">সেরা আয়: ৳ ${bn(best)}</p><button id="go">চালু করুন</button>`;
  $('ov').style.display='flex';$('go').onclick=start;
}
function start(){ac();init();st='play';$('ov').style.display='none'}
function over(r){
  if(st!=='play')return;
  st='over';const s=Math.floor(score);
  if(s>best){best=s;try{localStorage.setItem('dd4_best',s)}catch(e){}}
  beep(90,.5,'sawtooth');
  const a=HL[r],ic={mob:'🏃',battery:'🪫'}[r];
  $('ov').innerHTML=`<div style="font-size:48px">${ic}</div><h2>খেলা শেষ</h2><div class="hl">${a[Math.random()*a.length|0]}</div>
  <p>আজকের আয় <b>৳ ${bn(s)}</b><br>সেরা ৳ ${bn(best)}</p><button id="go">আবার চালান</button>`;
  $('ov').style.display='flex';$('go').onclick=start;
}

function update(dt){
  const play=st==='play';
  const steer=play?(Input.right?1:0)-(Input.left?1:0):0;
  const gas=play&&Input.gas,brk=play&&Input.brake;
  pl.step(dt,gas?1:brk?-1:0,steer);
  for(const v of traffic){
    const c=aiControl(v,all);v.step(dt,c.th,c.st);
    if(v.x<-60||v.x>SZ+60||v.z<-60||v.z>SZ+60||(v.stuck>6&&dist(v,pl)>30)||v.stuck>12)placeAI(v,pl,all);
  }
  let imp=0;
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const m=collidePair(all[i],all[j]);if(i===0)imp=Math.max(imp,m)}
  let wall=0;
  for(const v of all){const m=collideSolids(v,City.solidsAt(v.x,v.z));if(v===pl)wall=m}
  for(const v of all)v.sync();
  hitCD-=dt;shake*=.9;
  if(!play)return;

  if(imp>2.5&&hitCD<=0){anger+=Math.min(24,imp*1.8);hitCD=.35;shake=6+imp;beep(120,.2,'sawtooth')}
  if(wall>5&&hitCD<=0){hitCD=.35;shake=4+wall;beep(80,.2,'sawtooth')}
  anger=Math.max(0,anger-dt*1.8);
  if(anger>=100)return over('mob');

  const vf=pl.vf;
  charging=false;
  for(const s of City.stations)for(const p of s.pads)if(Math.hypot(pl.x-p.x,pl.z-p.z)<3.6&&Math.abs(vf)<4)charging=true;
  if(charging){batt=Math.min(100,batt+28*dt);cdBeep-=dt;if(cdBeep<=0){beep(660,.08,'triangle');cdBeep=.45}}
  else batt-=dt*(.12+(gas?.65:0));
  if(batt<=0)return over('battery');

  const tgt=msn.stage?msn.dp:msn.pk;
  if(dist(pl,tgt)<7&&Math.abs(vf)<9){
    if(msn.stage===0){msn.stage=1;setMarker(msn.dp,0x4ade80);beep(700,.15,'triangle');say('যাত্রী উঠেছে! গন্তব্যে চলুন')}
    else{score+=msn.fare;say('ভাড়া পেলেন ৳ '+bn(msn.fare));beep(900,.2,'triangle');newMission()}
  }
  flashT-=dt;
}

function camera(dt){
  const c=World.camera,k=Math.min(1,dt*4);
  if(st==='play'){
    let d=pl.a;
    if(pl.vf<-1)d=pl.a+Math.PI;
    camA+=wrapA(d-camA)*k;
  }else camA+=dt*.25;
  const fx=-Math.sin(camA),fz=-Math.cos(camA),j=shake>.1?(Math.random()-.5)*shake*.06:0;
  const back=st==='play'?10:16;
  c.position.set(pl.x-fx*back,5.5+j,pl.z-fz*back);
  c.lookAt(pl.x+fx*6,1.5,pl.z+fz*6);
  const tf=62+Math.max(0,pl.vf)*.6;
  c.fov+=(tf-c.fov)*k;c.updateProjectionMatrix();
}

function hud(){
  $('tCh').textContent='চার্জ '+bn(batt)+'%';
  $('bCh').style.width=Math.max(0,batt)+'%';
  $('bCh').style.background=batt<25?'#e5484d':'#4ade80';
  $('tAn').textContent='পাবলিক '+bn(anger)+'%';
  $('bAn').style.width=Math.min(100,anger)+'%';
  $('tSc').textContent='৳ '+bn(score);
  let m='';
  if(msn){
    const t=msn.stage?msn.dp:msn.pk,d=bn(dist(pl,t));
    m=msn.stage?`🟢 গন্তব্যে পৌঁছান: ${d} মি (ভাড়া ৳ ${bn(msn.fare)})`:`🔵 যাত্রী তুলুন: ${d} মি`;
  }
  if(charging)m='⚡ চার্জ হচ্ছে... থেমে থাকুন';
  else if(flashT>0)m=flash;
  $('msn').textContent=m;$('msn').style.display=st==='play'&&m?'block':'none';
  $('spd').textContent=st==='play'?bn(Math.abs(pl.vf)*3.6)+' কিমি/ঘণ্টা':'';
}

let last=0;
function loop(ts){
  const dt=Math.min(.033,(ts-last)/1000||0);last=ts;
  update(dt);camera(dt);hud();MiniMap.draw(pl,traffic,st==='play'?msn:null);
  World.renderer.render(World.scene,World.camera);
  requestAnimationFrame(loop);
}
init();showMenu();requestAnimationFrame(loop);
