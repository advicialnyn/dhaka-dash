/* Scene, camera, lights and vehicle models */
if(typeof THREE==='undefined'){
  document.body.innerHTML='<p style="color:#f4e9d8;padding:30px;font-size:18px">Three.js লোড হয়নি। ইন্টারনেট চালু করে পেজ রিফ্রেশ করুন।</p>';
  throw new Error('THREE missing');
}
const World=(()=>{
  const SKY=0xe8a76a;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(SKY);
  scene.fog=new THREE.Fog(SKY,45,190);
  const camera=new THREE.PerspectiveCamera(62,1,.1,320);
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  document.getElementById('stage').appendChild(renderer.domElement);
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}
  addEventListener('resize',resize);resize();
  scene.add(new THREE.HemisphereLight(0xffe2c0,0x44352a,.95));
  const sun=new THREE.DirectionalLight(0xffd9a8,.7);sun.position.set(-30,60,20);scene.add(sun);

  const unit=new THREE.BoxGeometry(1,1,1);
  const wheelGeo=new THREE.CylinderGeometry(.42,.42,.3,14);
  const mats={};
  const M=c=>mats[c]||(mats[c]=new THREE.MeshLambertMaterial({color:c}));
  const box=(w,h,d,c,x=0,y=0,z=0)=>{const m=new THREE.Mesh(unit,M(c));m.scale.set(w,h,d);m.position.set(x,y,z);return m};
  const wheel=(x,y,z)=>{const m=new THREE.Mesh(wheelGeo,M(0x111111));m.rotation.z=Math.PI/2;m.position.set(x,y,z);return m};

  /* models: front faces -z */
  function makeAuto(){
    const g=new THREE.Group();
    g.add(box(2,1,3.2,0x2fa36b,0,.85,0));
    g.add(box(1.9,.18,2.2,0xf2b632,0,2.15,.2));
    for(const x of[-.9,.9])for(const z of[-.8,1.1])g.add(box(.08,1,.08,0x222222,x,1.6,z));
    g.add(box(1.8,.3,.15,0x8fd3ff,0,1.7,-.95));
    g.add(box(.4,.25,.1,0xfff3c4,-.6,.9,-1.62),box(.4,.25,.1,0xfff3c4,.6,.9,-1.62));
    g.add(wheel(0,.42,-1.2),wheel(-1,.42,1.1),wheel(1,.42,1.1));
    return g;
  }
  function makeCar(c){
    const g=new THREE.Group();
    g.add(box(2,.8,4,c,0,.8,0));
    g.add(box(1.7,.7,2,0x222a33,0,1.5,.2));
    g.add(box(.4,.2,.1,0xfff3c4,-.65,.9,-2.02),box(.4,.2,.1,0xfff3c4,.65,.9,-2.02));
    g.add(wheel(-1,.42,-1.3),wheel(1,.42,-1.3),wheel(-1,.42,1.3),wheel(1,.42,1.3));
    return g;
  }
  function makeBus(){
    const g=new THREE.Group();
    g.add(box(2.6,2.8,8,0xd9482b,0,1.9,0));
    g.add(box(2.64,.9,7,0x1d2630,0,2.6,0));
    g.add(box(2.64,.3,8,0xf4e9d8,0,1.3,0));
    g.add(box(.5,.3,.1,0xfff3c4,-.8,1,-4.02),box(.5,.3,.1,0xfff3c4,.8,1,-4.02));
    g.add(wheel(-1.3,.5,-2.6),wheel(1.3,.5,-2.6),wheel(-1.3,.5,2.6),wheel(1.3,.5,2.6));
    return g;
  }
  return{scene,camera,renderer,box,M,makeAuto,makeCar,makeBus};
})();
