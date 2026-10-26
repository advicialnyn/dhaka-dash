/* Keyboard + touch input */
const Input=(()=>{
  const K={},T={};
  addEventListener('keydown',e=>{
    const k=e.key.toLowerCase();K[k]=1;
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k))e.preventDefault();
    if(k==='h'&&Input.onHorn)Input.onHorn();
    if(k==='enter'&&Input.onEnter)Input.onEnter();
  });
  addEventListener('keyup',e=>{K[e.key.toLowerCase()]=0});
  document.querySelectorAll('#ctl button').forEach(b=>{
    const k=b.dataset.k;
    b.addEventListener('pointerdown',e=>{e.preventDefault();T[k]=1;b.classList.add('on');if(Input.onTouch)Input.onTouch()});
    ['pointerup','pointercancel','pointerleave'].forEach(n=>b.addEventListener(n,()=>{T[k]=0;b.classList.remove('on')}));
  });
  return{
    get left(){return K.arrowleft||K.a||T.l},
    get right(){return K.arrowright||K.d||T.r},
    get boost(){return K.arrowup||K.w||K.shift||K[' ']||T.b},
    get brake(){return K.arrowdown||K.s||T.k},
    onHorn:null,onEnter:null,onTouch:null
  };
})();
