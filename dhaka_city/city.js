/* City: road grid, buildings, charging stations, collision solids */
const P=74,N=6,SZ=(N-1)*P;           // road spacing, intersections per side, map size
const City=(()=>{
  const S=World.scene,box=World.box;
  const solids={},stations=[];
  const STN=[[0,1],[3,0],[1,3],[4,4]]; // blocks that hold a charging station

  S.add(box(900,.1,900,0x4a3f33,SZ/2,-.15,SZ/2));
  for(let i=0;i<N;i++){
    S.add(box(12,.12,SZ+12,0x2f2f33,i*P,0,SZ/2));
    S.add(box(SZ+12,.12,12,0x2f2f33,SZ/2,0,i*P));
  }
  /* lane dashes (one draw call) */
  const pos=[];
  for(let i=0;i<N;i++)for(let s=6;s<SZ;s+=9){
    if(Math.abs(s-Math.round(s/P)*P)<9)continue;
    pos.push([i*P,s,.25,4],[s,i*P,4,.25]);
  }
  const dash=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xb9b9b9}),pos.length);
  const mx=new THREE.Matrix4(),q=new THREE.Quaternion();
  pos.forEach((p,i)=>{mx.compose(new THREE.Vector3(p[0],.08,p[1]),q,new THREE.Vector3(p[2],.02,p[3]));dash.setMatrixAt(i,mx)});
  S.add(dash);

  /* building material with window texture */
  const c=document.createElement('canvas');c.width=c.height=64;
  const cg=c.getContext('2d');
  cg.fillStyle='#d8cfc0';cg.fillRect(0,0,64,64);
  cg.fillStyle='#364352';cg.fillRect(14,12,36,34);
  cg.fillStyle='#4d6074';cg.fillRect(14,12,36,12);
  const tex=new THREE.CanvasTexture(c);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;
  const bmat={};
  const bm=col=>bmat[col]||(bmat[col]=new THREE.MeshLambertMaterial({color:col,map:tex}));
  function bgeo(w,h,d){
    const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
    const r=a=>Math.max(1,Math.round(a));
    const sc=[[r(d/5),r(h/4)],[r(d/5),r(h/4)],[1,1],[1,1],[r(w/5),r(h/4)],[r(w/5),r(h/4)]];
    for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*sc[f][0],uv.getY(i)*sc[f][1])}
    return g;
  }
  const pal=[0xc9a58a,0xa8b4c4,0xd9c27a,0xc58f9e,0x9fb59a,0xe0d4c0];
  for(let bi=-1;bi<N;bi++)for(let bj=-1;bj<N;bj++){
    const ring=bi<0||bj<0||bi>=N-1||bj>=N-1;
    const x0=bi*P+7,x1=(bi+1)*P-7,z0=bj*P+7,z1=(bj+1)*P-7;
    const isSt=STN.some(s=>s[0]===bi&&s[1]===bj);
    S.add(box(x1-x0+2,.3,z1-z0+2,0x7a6a5c,(x0+x1)/2,.15,(z0+z1)/2));
    const list=[];
    const hw=(x1-x0)/2,hd=(z1-z0)/2;
    for(let ix=0;ix<2;ix++)for(let iz=0;iz<2;iz++){
      if(isSt&&iz===0)continue;
      const lx0=x0+ix*hw,lx1=lx0+hw,lz0=z0+iz*hd,lz1=lz0+hd;
      const h=ring?20+Math.random()*25:8+Math.random()*20;
      const m=new THREE.Mesh(bgeo(hw-.4,h,hd-.4),bm(pal[Math.random()*pal.length|0]));
      m.position.set((lx0+lx1)/2,.3+h/2,(lz0+lz1)/2);S.add(m);
      list.push({x0:lx0,x1:lx1,z0:lz0,z1:lz1});
    }
    solids[bi+','+bj]=list;
    if(isSt){
      const cx=(x0+x1)/2,zc=z0+14;
      S.add(box(28,.6,14,0xe8c13a,cx,6,zc));
      for(const dx of[-13,13])for(const dz of[-6,6])S.add(box(.7,6,.7,0x555555,cx+dx,3,zc+dz));
      const pads=[];
      for(const dx of[-7,7]){
        const ring3=new THREE.Mesh(new THREE.RingGeometry(1.4,2.6,24),new THREE.MeshBasicMaterial({color:0x3dffa0,side:THREE.DoubleSide}));
        ring3.rotation.x=-Math.PI/2;ring3.position.set(cx+dx,.4,zc);S.add(ring3);
        pads.push({x:cx+dx,z:zc});
      }
      S.add(box(.8,11,.8,0x444444,cx,5.5,z0+2));
      S.add(box(9,3.2,.6,0x1fa35a,cx,11,z0+2));
      S.add(box(1,2.4,.7,0xf2b632,cx,11,z0+1.6));
      stations.push({x:cx,z:zc,pads});
    }
  }
  const solidsAt=(x,z)=>solids[Math.floor(x/P)+','+Math.floor(z/P)]||[];
  const neighbors=(ix,iz)=>[[ix+1,iz],[ix-1,iz],[ix,iz+1],[ix,iz-1]].filter(n=>n[0]>=0&&n[1]>=0&&n[0]<N&&n[1]<N);
  /* left-hand traffic: lane is on the left of the travel direction */
  const lanePoint=(ix,iz,dx,dz)=>({x:ix*P+dz*3.2,z:iz*P-dx*3.2});
  return{solidsAt,neighbors,lanePoint,stations};
})();
