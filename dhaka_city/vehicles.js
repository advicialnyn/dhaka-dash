/* Vehicle physics, collisions (side pushes!) and traffic AI */
const TYPES={
  auto:{m:1,  cs:[-.9,.9],      r:1.0, acc:12,maxV:22,brk:24},
  car: {m:1.6,cs:[-1.1,1.1],    r:1.05,acc:7, maxV:11,brk:16},
  bus: {m:4,  cs:[-3,-1,1,3],   r:1.4, acc:4, maxV:8, brk:10}
};
for(const k in TYPES)TYPES[k].reach=Math.max(...TYPES[k].cs.map(Math.abs))+TYPES[k].r;
const wrapA=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a};

class Vehicle{
  constructor(type,mesh){
    this.type=type;this.t=TYPES[type];this.mesh=mesh;
    this.x=0;this.z=0;this.vx=0;this.vz=0;this.a=0;this.av=0;
    this.im=1/this.t.m;this.ii=this.im/(type==='bus'?12:3);this.stuck=0;
  }
  get fx(){return -Math.sin(this.a)}
  get fz(){return -Math.cos(this.a)}
  get rx(){return Math.cos(this.a)}
  get rz(){return -Math.sin(this.a)}
  get vf(){return this.vx*this.fx+this.vz*this.fz}
  circles(){return this.t.cs.map(o=>({x:this.x+this.fx*o,z:this.z+this.fz*o}))}
  step(dt,th,st){
    const T=this.t,fx=this.fx,fz=this.fz,rx=this.rx,rz=this.rz;
    let vf=this.vx*fx+this.vz*fz,vl=this.vx*rx+this.vz*rz;
    if(th>0)vf+=th*T.acc*Math.max(0,1-Math.max(0,vf)/T.maxV)*dt;
    else if(th<0){if(vf>.3)vf=Math.max(0,vf+th*T.brk*dt);else vf=Math.max(-5,vf+th*T.acc*.6*dt)}
    vf*=Math.exp(-.12*dt);vl*=Math.exp(-6*dt);          // drag + tyre grip (side slide fades)
    const k=Math.min(1,Math.abs(vf)/4),rate=Math.max(.7,2.1-.05*Math.abs(vf))*k*(vf<0?-1:1);
    this.a+=(-st*rate+this.av)*dt;this.av*=Math.exp(-4*dt);
    this.vx=fx*vf+rx*vl;this.vz=fz*vf+rz*vl;
    this.x+=this.vx*dt;this.z+=this.vz*dt;
  }
  sync(){this.mesh.position.set(this.x,0,this.z);this.mesh.rotation.y=this.a}
}

function collidePair(A,B){
  const dx=B.x-A.x,dz=B.z-A.z,br=A.t.reach+B.t.reach;
  if(dx*dx+dz*dz>br*br)return 0;
  let imp=0;
  for(const ca of A.circles())for(const cb of B.circles()){
    let nx=cb.x-ca.x,nz=cb.z-ca.z;const d=Math.hypot(nx,nz),rr=A.t.r+B.t.r;
    if(d>=rr||d<1e-4)continue;
    nx/=d;nz/=d;const pen=rr-d,s=A.im+B.im;
    A.x-=nx*pen*A.im/s;A.z-=nz*pen*A.im/s;B.x+=nx*pen*B.im/s;B.z+=nz*pen*B.im/s;
    const vn=(B.vx-A.vx)*nx+(B.vz-A.vz)*nz;
    if(vn<0){
      const j=-1.35*vn/s;
      A.vx-=j*A.im*nx;A.vz-=j*A.im*nz;B.vx+=j*B.im*nx;B.vz+=j*B.im*nz;
      const px=ca.x+nx*A.t.r,pz=ca.z+nz*A.t.r;
      A.av+=((pz-A.z)*(-j*nx)-(px-A.x)*(-j*nz))*A.ii;
      B.av+=((pz-B.z)*(j*nx)-(px-B.x)*(j*nz))*B.ii;
      A.av=Math.max(-3,Math.min(3,A.av));B.av=Math.max(-3,Math.min(3,B.av));
      imp=Math.max(imp,-vn);
    }
  }
  return imp;
}

function collideSolids(V,list){
  let imp=0;
  for(const c of V.circles())for(const b of list){
    const qx=Math.max(b.x0,Math.min(c.x,b.x1)),qz=Math.max(b.z0,Math.min(c.z,b.z1));
    let nx=c.x-qx,nz=c.z-qz,d=Math.hypot(nx,nz),pen;
    if(d>=V.t.r)continue;
    if(d<1e-4){ // centre inside the box: leave by the nearest edge
      const l=c.x-b.x0,r=b.x1-c.x,t=c.z-b.z0,bo=b.z1-c.z,m=Math.min(l,r,t,bo);
      nx=nz=0;
      if(m===l)nx=-1;else if(m===r)nx=1;else if(m===t)nz=-1;else nz=1;
      pen=V.t.r+m;
    }else{nx/=d;nz/=d;pen=V.t.r-d}
    V.x+=nx*pen;V.z+=nz*pen;
    const vn=V.vx*nx+V.vz*nz;
    if(vn<0){V.vx-=1.25*vn*nx;V.vz-=1.25*vn*nz;V.vx*=.97;V.vz*=.97;imp=Math.max(imp,-vn)}
  }
  return imp;
}

/* ---------- traffic AI: follows lanes on the road grid, turns at junctions, brakes for obstacles ---------- */
function setTarget(v,x,z,stage){v.tx=x;v.tz=z;v.stage=stage}
function placeAI(v,player,all){
  for(let k=0;k<30;k++){
    const ix=Math.random()*N|0,iz=Math.random()*N|0,nb=City.neighbors(ix,iz),n=nb[Math.random()*nb.length|0];
    const dx=n[0]-ix,dz=n[1]-iz,t=12+Math.random()*(P-30);
    const x=ix*P+dx*t+dz*3.2,z=iz*P+dz*t-dx*3.2;
    if(k<29){
      if(Math.hypot(x-player.x,z-player.z)<45)continue;
      if(all.some(o=>o!==v&&Math.hypot(o.x-x,o.z-z)<12))continue;
    }
    v.x=x;v.z=z;v.vx=v.vz=v.av=0;v.a=Math.atan2(-dx,-dz);
    v.from=[ix,iz];v.to=n;v.dx=dx;v.dz=dz;v.stuck=0;
    v.vd=v.type==='bus'?5+Math.random()*2:7+Math.random()*4;
    const lp=City.lanePoint(n[0],n[1],dx,dz);setTarget(v,lp.x,lp.z,1);
    return;
  }
}
function aiControl(v,all){
  let ax=v.tx-v.x,az=v.tz-v.z;
  if(Math.hypot(ax,az)<4.5||ax*v.fx+az*v.fz<1){
    if(v.stage===1){ // reached the junction: pick a way on, aim for the lane corner first
      const N0=v.to,nb=City.neighbors(N0[0],N0[1]),opts=nb.filter(n=>!(n[0]===v.from[0]&&n[1]===v.from[1]));
      const list=opts.length?opts:nb,n=list[Math.random()*list.length|0];
      const odx=v.dx,odz=v.dz,ndx=n[0]-N0[0],ndz=n[1]-N0[1];
      const W={x:N0[0]*P+odz*3.2+ndz*3.2*(odx*ndx+odz*ndz===0?1:0),z:N0[1]*P-odx*3.2-ndx*3.2*(odx*ndx+odz*ndz===0?1:0)};
      v.from=N0;v.to=n;v.dx=ndx;v.dz=ndz;setTarget(v,W.x,W.z,0);
    }else{
      const lp=City.lanePoint(v.to[0],v.to[1],v.dx,v.dz);setTarget(v,lp.x,lp.z,1);
    }
    ax=v.tx-v.x;az=v.tz-v.z;
  }
  const dA=wrapA(Math.atan2(-ax,-az)-v.a);
  const st=-Math.max(-1,Math.min(1,dA*2.2));
  const vf=v.vf;
  let vd=v.vd;if(v.stage===0||Math.abs(dA)>.5)vd=Math.min(vd,5);
  let th=Math.max(-1,Math.min(1,(vd-vf)*.6));
  for(const o of all){
    if(o===v)continue;
    const rx=o.x-v.x,rz=o.z-v.z,ahead=rx*v.fx+rz*v.fz,lat=Math.abs(rx*v.rx+rz*v.rz);
    if(ahead>0&&ahead<7+Math.max(0,vf)*1.3+o.t.reach&&lat<2.9){th=ahead<5+o.t.reach+vf*.6?-1:Math.min(th,0);break}
  }
  if(Math.abs(vf)<.5)v.stuck+=.016;else v.stuck=0;
  return{th,st};
}
