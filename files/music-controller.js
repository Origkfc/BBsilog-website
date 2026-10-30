(function(root){
 'use strict';
 function createMusicController(audio,button,beat){
  let wanted=true,starting=null;
  function label(pending=false){
   button.textContent=wanted?'♫ Sound: On'+(pending?' · Tap to start':''):'♫ Sound: Off';
   button.setAttribute('aria-pressed',String(wanted));
   button.title=pending?'Music is enabled. Tap anywhere to start playback.':wanted?'Turn music off':'Turn music on';
  }
  function start(){
   if(starting||!wanted||!audio.paused)return starting;
   // Start play in the user gesture; a rejected autoplay waits for their first tap.
   starting=audio.play().then(()=>{
    if(!wanted){audio.pause();return}
    label();Promise.resolve(beat()).catch(()=>{});
   }).catch(()=>{if(wanted)label(true)}).finally(()=>{starting=null});
   return starting;
  }
  function toggle(){
   if(!audio.paused||starting){wanted=false;audio.pause();label();return}
   wanted=true;label();return start();
  }
  function interact(event){if(wanted&&audio.paused&&!event.target.closest('#musicToggle'))start()}
  audio.volume=.35;label();start();
  return {toggle,interact};
 }
 root.createBBSILOGMusicController=createMusicController;
 if(typeof document==='undefined')return;
 const controller=createMusicController(document.getElementById('bgMusic'),document.getElementById('musicToggle'),async()=>{await connectBeatAudio();startBeatAnimation()});
 root.toggleMusic=controller.toggle;
 document.addEventListener('pointerdown',controller.interact);
 document.addEventListener('keydown',controller.interact);
})(window);
