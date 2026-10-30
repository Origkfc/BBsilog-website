(function(){
 const root=document.querySelector('.hero-glass-reviews');if(!root)return;
 const controls=document.createElement('div');controls.className='review-scroll-controls';
 const label=document.createElement('small');label.textContent='Swipe / scroll to read reviews · Auto-resumes after a short pause';controls.append(label);root.append(controls);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let viewport=null,last=0,frame,position=0,held=false,resumeAt=0,wasPaused=true;
 const pause=()=>{resumeAt=performance.now()+3500;wasPaused=true};
 function setup(){
  const track=root.querySelector('.hero-glass-track');if(!track||track.dataset.scrollReady)return;
  track.dataset.scrollReady='true';
  if(!viewport){
   viewport=document.createElement('div');viewport.className='review-scroll-window';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Customer reviews. Scroll or swipe to pause; scrolling resumes automatically.');track.before(viewport);
   viewport.addEventListener('pointerdown',()=>{held=true;pause()},{passive:true});
   for(const event of ['wheel','keydown'])viewport.addEventListener(event,pause,{passive:true});
   viewport.addEventListener('scroll',()=>{if(held||performance.now()<resumeAt)pause()},{passive:true});
  }
  if(track.parentNode!==viewport)viewport.replaceChildren(track);
 }
 for(const event of ['pointerup','pointercancel'])addEventListener(event,()=>{if(held){held=false;pause()}},{passive:true});
 addEventListener('blur',()=>{if(held){held=false;pause()}});
 new MutationObserver(setup).observe(root,{childList:true,subtree:true});setup();
 function tick(now){
  const elapsed=Math.min(50,now-last||0);last=now;
  const paused=held||now<resumeAt||document.hidden||reduced.matches;
  if(paused)wasPaused=true;
  if(!paused&&viewport){
   if(wasPaused){position=viewport.scrollLeft;wasPaused=false}
   const first=viewport.querySelector('.hero-glass-set'),track=viewport.firstElementChild;
   if(first&&track){const distance=first.offsetWidth+(parseFloat(getComputedStyle(track).gap)||0);position+=elapsed*.018;if(position>=distance)position-=distance;viewport.scrollLeft=position;}
  }
  frame=requestAnimationFrame(tick);
 }
 frame=requestAnimationFrame(tick);addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});
})();
