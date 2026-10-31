// Public key only. Never put a Supabase secret/service-role key in this file.
(function(){
 const base='https://ufhblydcgwffwpwdlksm.supabase.co',key='sb_publishable_d10Qrzk0LHaoVYnttjtOyQ_g-049cX3';
 const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const bucket='bbsilog-feedback-photos';
 let lastReviewsData=null, cameraStream=null, capturedPhoto=null;
 const form=document.querySelector('.feedback');
 const camera=document.getElementById('feedbackCamera'), preview=document.getElementById('photoPreview'), photoStatus=document.getElementById('photoStatus');
 const mode=()=>document.querySelector('input[name="photoLayout"]:checked')?.value||'selfie';
 function note(message){if(photoStatus)photoStatus.textContent=message;}
 function stopCamera(){if(cameraStream){cameraStream.getTracks().forEach(track=>track.stop());cameraStream=null;}if(camera){camera.pause();camera.srcObject=null;camera.hidden=true;}const capture=document.getElementById('capturePhoto');if(capture)capture.hidden=true;}
 function setPhoto(blob){capturedPhoto=blob;stopCamera();if(!preview)return;preview.replaceChildren();if(blob){const image=document.createElement('img');image.alt=mode()==='groupie'?'Preview of your group photo':'Preview of your selfie';image.src=URL.createObjectURL(blob);preview.append(image);preview.hidden=false;document.getElementById('removePhoto').hidden=false;note('Photo ready. It will stay private until BBSILOG approves it and you allow it to be featured.');}else{preview.hidden=true;document.getElementById('removePhoto').hidden=true;note('Photo is optional. Camera permission is requested only when you tap Open camera.');}}
 async function toWebp(source){const bitmap=await createImageBitmap(source);const scale=Math.min(1,1440/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Could not prepare photo.')),'image/webp',.84));}
 document.getElementById('openCamera')?.addEventListener('click',async()=>{try{stopCamera();cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:mode()==='selfie'?'user':'environment'},audio:false});camera.srcObject=cameraStream;camera.hidden=false;await camera.play();document.getElementById('capturePhoto').hidden=false;note('Camera is on. Frame your photo and tap Take photo.');}catch{stopCamera();note('Camera unavailable or permission was declined. You can choose a photo from your device instead.');}});
 document.getElementById('capturePhoto')?.addEventListener('click',async()=>{try{capturedPhoto=await toWebp(camera);setPhoto(capturedPhoto);}catch{note('Could not capture that photo. Please try again.');}});
 document.getElementById('choosePhoto')?.addEventListener('click',()=>document.getElementById('photoFile').click());
 document.getElementById('photoFile')?.addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){note('Choose an image file.');return;}try{setPhoto(await toWebp(file));}catch{note('Could not prepare the selected photo. Try another image.');}event.target.value='';});
 document.getElementById('removePhoto')?.addEventListener('click',()=>setPhoto(null));
 document.querySelectorAll('input[name="photoLayout"]').forEach(input=>input.addEventListener('change',()=>{if(capturedPhoto)setPhoto(capturedPhoto);if(cameraStream)document.getElementById('openCamera').click();}));
 async function signPhoto(path){if(!path)return null;const res=await fetch(base+'/storage/v1/object/sign/'+bucket+'/'+path,{method:'POST',headers,body:JSON.stringify({expiresIn:604800})});if(!res.ok)return null;const data=await res.json();const url=data.signedURL||data.signedUrl;if(!url)return null;return url.startsWith('http')?url:base+(url.startsWith('/storage/v1/')?'':'/storage/v1')+url;}
 async function showApproved(){
  try{
   // Anonymous SELECT is restricted to approved, publishable, unarchived rows by RLS.
   const res=await fetch(base+'/rest/v1/bbsilog_feedback?select=customer_name,rating,message,created_at,source,avatar_path,photo_path,photo_layout,photo_consent&order=created_at.desc&limit=30',{headers});
   if(!res.ok)throw Error('reviews unavailable');
   const rows=await res.json();const snapshot=JSON.stringify(rows);if(snapshot===lastReviewsData)return;
   const reviews=await Promise.all(rows.map(async r=>({name:r.customer_name||'BBSILOG customer',text:r.message,rating:r.rating,source:r.source,avatar_path:r.avatar_path,photo_layout:r.photo_layout,photo_url:r.photo_consent&&r.photo_path?await signPhoto(r.photo_path).catch(()=>null):null,publicationApproved:true,status:'approved'})));
   renderPublicReviews(reviews);
   const noteEl=document.querySelector('#feedback #publicReviews + .demo-note');if(noteEl)noteEl.textContent=reviews.length?'Customer reviews featured by BBSILOG. Messenger imports have no star rating unless one was provided.':'No approved public reviews yet.';
   const strip=document.querySelector('.hero-glass-reviews');if(!strip){lastReviewsData=snapshot;return;}
   const caption=strip.querySelector('.hero-glass-caption');if(caption)caption.textContent=reviews.length?'Customer stories · From our customers':'Customer reviews · No featured reviews yet';
   if(!reviews.length){strip.querySelector('.hero-glass-track')?.replaceChildren();lastReviewsData=snapshot;return;}
   const track=document.createElement('div');track.className='hero-glass-track';const set=document.createElement('div');set.className='hero-glass-set';track.style.setProperty('--reviews-duration',BBSILOGReviewModel.reviewDuration(reviews.length));
   for(const r of reviews){const card=document.createElement('article');card.className='glass-review'+(r.photo_layout==='groupie'&&r.photo_url?' has-groupie':'');const photo=BBSILOGReviewModel.photoElement(r);const identity=BBSILOGReviewModel.identityElement(r);const text=document.createElement('p');text.textContent=r.text;const stars=document.createElement('small');stars.textContent=BBSILOGReviewModel.ratingLabel(r);if(photo){if(r.photo_layout==='selfie')identity.prepend(photo);else card.append(photo);}card.append(identity,text,stars);set.append(card);}
   const copy=set.cloneNode(true);copy.setAttribute('aria-hidden','true');track.append(set,copy);strip.querySelector('.hero-glass-track')?.replaceWith(track);lastReviewsData=snapshot;
  }catch{const host=document.getElementById('publicReviews');if(host&&!host.querySelector('.review-card'))host.textContent='Customer reviews are temporarily unavailable. Please try again shortly.';}
 }
 feedbackDemo=async function(event){
  event.preventDefault();if(!rating){toast('Please choose your star rating first.');return}
  const button=form.querySelector('button[type=submit]'),message=document.getElementById('feedbackText').value.trim();if(!message||message.length>1500){toast('Please enter feedback of up to 1,500 characters.');return}
  button.disabled=true;
  try{
   let photoPath=null;
   if(capturedPhoto){const id=crypto.randomUUID();photoPath='incoming/'+id+'.webp';const upload=await fetch(base+'/storage/v1/object/'+bucket+'/'+photoPath,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'image/webp','x-upsert':'false'},body:capturedPhoto});if(!upload.ok)throw Error('photo upload');}
   const payload={customer_name:document.getElementById('name').value.trim()||null,rating,message,publish_consent:document.getElementById('consent').checked,photo_path:photoPath,photo_layout:photoPath?mode():null,photo_consent:photoPath?document.getElementById('photoConsent').checked:false};
   const res=await fetch(base+'/rest/v1/bbsilog_feedback',{method:'POST',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify(payload)});if(!res.ok)throw Error('Feedback could not be saved.');
   stopCamera();setPhoto(null);form.reset();rate(0);note('Photo is optional. Camera permission is requested only when you tap Open camera.');toast('Salamat! Your feedback was sent privately.');
  }catch(error){toast(error.message||'Feedback could not be sent. Please try again later.');}finally{button.disabled=false;}
 };
 form?.addEventListener('reset',()=>{stopCamera();setPhoto(null);});
 window.addEventListener('pagehide',stopCamera);
 document.getElementById('feedbackText').maxLength=1500;
 const noteEl=document.querySelector('.feedback .demo-note');if(noteEl)noteEl.textContent='Feedback and photos stay private unless you allow them to be featured and BBSILOG approves them.';
 note('Photo is optional. Camera permission is requested only when you tap Open camera.');showApproved();
 setInterval(()=>{if(!document.hidden)showApproved()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)showApproved()});
})();
