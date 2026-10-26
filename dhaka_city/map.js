/* Mini map: tap it to enlarge */
const MiniMap=(()=>{
  const c=document.getElementById('map'),g=c.getContext('2d'),S=300,sc=S/(SZ+30),o=15;
  c.addEventListener('click',()=>c.classList.toggle('big'));
  const X=x=>(x+o)*sc,Y=z=>(z+o)*sc;
  function draw(pl,traffic,msn){
    g.clearRect(0,0,S,S);
    g.strokeStyle='#6b6b73';g.lineWidth=7;g.lineCap='round';
    for(let i=0;i<N;i++){
      g.beginPath();g.moveTo(X(i*P),Y(0));g.lineTo(X(i*P),Y(SZ));g.stroke();
      g.beginPath();g.moveTo(X(0),Y(i*P));g.lineTo(X(SZ),Y(i*P));g.stroke();
    }
    g.fillStyle='#3dffa0';
    for(const s of City.stations){g.fillRect(X(s.x)-9,Y(s.z)-9,18,18);}
    g.fillStyle='#1b1410';g.font='bold 14px sans-serif';g.textAlign='center';g.textBaseline='middle';
    for(const s of City.stations)g.fillText('⚡',X(s.x),Y(s.z)+1);
    g.fillStyle='#bbb';
    for(const v of traffic){g.beginPath();g.arc(X(v.x),Y(v.z),v.type==='bus'?4:3,0,7);g.fill()}
    if(msn){
      const t=msn.stage?msn.dp:msn.pk;
      g.fillStyle=msn.stage?'#4ade80':'#4dabff';g.beginPath();g.arc(X(t.x),Y(t.z),9,0,7);g.fill();
      g.strokeStyle='#fff';g.lineWidth=2;g.stroke();
    }
    g.save();g.translate(X(pl.x),Y(pl.z));g.rotate(-pl.a);
    g.fillStyle='#f2b632';g.beginPath();g.moveTo(0,-11);g.lineTo(8,9);g.lineTo(0,5);g.lineTo(-8,9);g.closePath();g.fill();
    g.restore();
  }
  return{draw};
})();
