(function(){
 const Q=BBSILOGQR;
 const nav=document.getElementById('adminNavigation'),feedback=document.getElementById('feedbackView'),pitchers=document.getElementById('pitchersView'),scan=document.getElementById('qrVerifyView');
 let stream=null,raf=0,lastFrame=0;
 function stop(){cancelAnimationFrame(raf);raf=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}document.getElementById('qrCamera').hidden=true;}
 function tab(name){
  stop();feedback.hidden=name!=='feedback';pitchers.hidden=name!=='pitchers';scan.hidden=name!=='scan';
  nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  if(!pitchers.hidden)loadPitchers();
 }
 nav.querySelectorAll('button').forEach(b=>b.onclick=()=>tab(b.dataset.view));
 const oldShow=showInbox;showInbox=function(){oldShow();nav.hidden=false};
 document.getElementById('logout').addEventListener('click',()=>{stop();nav.hidden=true;document.getElementById('verifiedQR').replaceChildren()});
 function notice(text,error=false){const host=document.getElementById('qrVerifyStatus');host.textContent=text;host.className=error?'qr-error':'note';}
 async function loadPitchers(){
  const host=document.getElementById('pitcherList');host.textContent='Loading…';
  try{
   const data=await Q.api('bbsilog_admin_pitchers',{},true);
   document.getElementById('pitcherStats').textContent='Total: '+data.total+' · Available: '+data.available+' · Claimed: '+data.claimed;
   const filter=document.getElementById('pitcherFilter').value;
   const rows=data.rewards.filter(r=>filter==='all'||(filter==='claimed')===Boolean(r.used_at));host.replaceChildren();
   if(!rows.length)host.textContent='No pitcher rewards in this category.';
   for(const reward of rows){
    const card=Q.node('article',undefined,'review');
    card.append(Q.node('h3',reward.used_at?'Claimed':'Available'),Q.node('p',(reward.customer_name||'Customer')+' · '+reward.phone),Q.node('p','Issued: '+new Date(reward.created_at).toLocaleString()));
    if(reward.used_at)card.append(Q.node('p','Claimed: '+new Date(reward.used_at).toLocaleString()));
    host.append(card);
   }
   if(data.total>data.rewards.length)host.append(Q.node('p','Showing the most recent '+data.rewards.length+' rewards.','note'));
  }catch(e){host.textContent=e.message}
 }
 document.getElementById('refreshPitchers').onclick=loadPitchers;document.getElementById('pitcherFilter').onchange=loadPitchers;
 async function verifyPitcher(code){
  const host=document.getElementById('verifiedQR');
  const result=await Q.api('bbsilog_pitcher_admin',{p_code:code,p_action:'verify'},true);
  host.replaceChildren(Q.node('h3','Free iced tea pitcher'),Q.node('p','Customer: '+result.customer_name+' · '+result.phone),Q.node('p','Feedback: '+result.message),Q.node('p',result.used?'QR code has been used.':'Available for the next dine-in visit.'));
  if(result.photo_path){const photo=Q.node('img');photo.alt='Customer photo for staff verification';photo.className='admin-review-photo '+result.photo_layout;host.append(photo);try{photo.src=await loadReviewPhoto(result.photo_path)}catch{photo.replaceWith(Q.node('p','Photo unavailable. Do not claim until staff can verify it.','qr-error'));return}}
  if(result.used){notice('QR code has been used.',true);return}
  const claim=Q.node('button','Claim free pitcher — one use');claim.onclick=async()=>{claim.disabled=true;try{const after=await Q.api('bbsilog_pitcher_admin',{p_code:code,p_action:'claim'},true);if(after.used){notice(after.claimed_now?'Claim recorded. This QR can no longer be used.':'QR code has already been used.',!after.claimed_now);claim.remove()}}catch(e){notice(e.message,true);claim.disabled=false}};host.append(claim);notice('Valid QR · Check customer photo and feedback before claiming.');
 }
 async function verify(raw){
  stop();document.getElementById('verifiedQR').replaceChildren();notice('Checking saved system record…');
  try{if(!/^BBSILOG-PITCHER:[0-9a-f-]{36}$/i.test(raw.trim()))throw Error('Please scan a valid free pitcher reward QR.');await verifyPitcher(raw.trim().split(':')[1])}
  catch(e){notice(e.message,true)}
 }
 document.getElementById('verifyQRForm').onsubmit=e=>{e.preventDefault();verify(document.getElementById('qrCodeInput').value)};
 const video=document.getElementById('qrCamera'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 function decode(source,w,h){const scale=Math.min(1,900/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);ctx.drawImage(source,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);return jsQR(pixels.data,pixels.width,pixels.height)?.data}
 document.getElementById('startQRScan').onclick=async()=>{
  try{stop();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;video.hidden=false;await video.play();notice('Point the camera at a free pitcher reward QR.');
   function frame(time){if(!stream)return;if(time-lastFrame>200&&video.readyState>=2){lastFrame=time;const text=decode(video,video.videoWidth,video.videoHeight);if(text){verify(text);return}}raf=requestAnimationFrame(frame)}raf=requestAnimationFrame(frame);
  }catch{stop();notice('Camera unavailable. Upload a QR screenshot or paste its code instead.',true)}
 };
 document.getElementById('stopQRScan').onclick=stop;
 document.getElementById('uploadQR').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  try{const image=await createImageBitmap(file);const text=decode(image,image.width,image.height);image.close();if(!text)throw Error('No readable QR found. Try a clearer image.');verify(text)}catch(e){notice(e.message,true)}e.target.value='';
 };
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});addEventListener('pagehide',stop);
 if(!document.getElementById('inbox').hidden)nav.hidden=false;
})();
