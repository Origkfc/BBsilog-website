(function(){
 const root=document.querySelector('.hero-glass-reviews');if(!root)return;
 const controls=document.createElement('div');controls.className='review-scroll-controls';
 const label=document.createElement('small');label.textContent='Swipe / scroll to read reviews · Auto-resumes after a short pause';controls.append(label);root.append(controls);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let viewport=null,last=0,frame,position=0,held=false,resumeAt=0,wasPaused=true,visible=false,distance=0;
 const pause=()=>{resumeAt=performance.now()+3500;wasPaused=true};
 function setup(){
  const track=root.querySelector('.hero-glass-track');if(!track)return;if(track.dataset.scrollReady){measure();if(track.firstElementChild)resize.observe(track.firstElementChild);return;}
  track.dataset.scrollReady='true';
  if(!viewport){
   viewport=document.createElement('div');viewport.className='review-scroll-window';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-label','Customer reviews. Scroll or swipe to pause; scrolling resumes automatically.');track.before(viewport);
   viewport.addEventListener('pointerdown',()=>{held=true;pause()},{passive:true});
   for(const event of ['wheel','keydown'])viewport.addEventListener(event,pause,{passive:true});
   viewport.addEventListener('scroll',()=>{if(held||performance.now()<resumeAt)pause()},{passive:true});
  }
  if(track.parentNode!==viewport)viewport.replaceChildren(track);
  measure();resize.observe(track);if(track.firstElementChild)resize.observe(track.firstElementChild);
 }
 for(const event of ['pointerup','pointercancel'])addEventListener(event,()=>{if(held){held=false;pause()}},{passive:true});
 addEventListener('blur',()=>{if(held){held=false;pause()}});
 function measure(){const track=viewport?.firstElementChild,first=track?.querySelector('.hero-glass-set');distance=first?first.offsetWidth+(parseFloat(getComputedStyle(track).gap)||0):0}
 const resize=new ResizeObserver(measure);
 new MutationObserver(setup).observe(root,{childList:true,subtree:true});setup();
 function tick(now){
  frame=0;if(!visible||document.hidden||reduced.matches){last=0;return}
  const elapsed=Math.min(50,now-last||0);last=now;
  const paused=held||now<resumeAt||document.hidden||reduced.matches;
  if(paused)wasPaused=true;
  if(!paused&&viewport){
   if(wasPaused){position=viewport.scrollLeft;wasPaused=false}
   if(distance>0){position+=elapsed*.018;if(position>=distance)position-=distance;viewport.scrollLeft=position;}
  }
  frame=requestAnimationFrame(tick);
 }
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;wasPaused=true;if(visible&&!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick)}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync()}).observe(root);
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 addEventListener('pagehide',()=>cancelAnimationFrame(frame));addEventListener('pageshow',sync);
})();
