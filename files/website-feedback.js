// Include only after the BBSILOG feedback database has been installed and tested.
// Public key only. Never put a Supabase secret/service-role key in this file.
(function(){
 const base='https://ufhblydcgwffwpwdlksm.supabase.co',key='sb_publishable_d10Qrzk0LHaoVYnttjtOyQ_g-049cX3';
 const headers={apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'};
 const stripPlaceholder=document.querySelector('.hero-glass-reviews .hero-glass-track')?.cloneNode(true);
 async function showApproved(){
  try{
   const res=await fetch(base+'/rest/v1/bbsilog_feedback?select=customer_name,rating,message,created_at&order=created_at.desc&limit=30',{headers});
   if(!res.ok)throw Error('reviews unavailable');
   const rows=await res.json();
   const reviews=rows.map(r=>({name:r.customer_name||'BBSILOG customer',text:r.message,rating:r.rating,publishConsent:true,status:'approved'}));
   renderPublicReviews(reviews);
   const note=document.querySelector('#feedback #publicReviews + .demo-note');if(note)note.textContent=reviews.length?'Reviews shown with customer permission.':'No approved public reviews yet.';
   const strip=document.querySelector('.hero-glass-reviews');
   if(!strip)return;
   const caption=strip.querySelector('.hero-glass-caption');if(caption)caption.textContent=reviews.length?'Customer stories · shared with permission':'Customer stories · awaiting approved reviews';
   if(!reviews.length){if(stripPlaceholder)strip.querySelector('.hero-glass-track')?.replaceWith(stripPlaceholder.cloneNode(true));return;}
   const track=document.createElement('div');track.className='hero-glass-track';const set=document.createElement('div');set.className='hero-glass-set';
   for(const r of reviews){const card=document.createElement('article');card.className='glass-review';const name=document.createElement('b');name.textContent=r.name;const text=document.createElement('p');text.textContent=r.text;const stars=document.createElement('small');stars.textContent='★'.repeat(r.rating);card.append(name,text,stars);set.append(card)}
   const copy=set.cloneNode(true);copy.setAttribute('aria-hidden','true');track.append(set,copy);strip.querySelector('.hero-glass-track')?.replaceWith(track);
  }catch{ /* Keep the explicit awaiting-reviews placeholder when offline. */ }
 }
 feedbackDemo=async function(event){
  event.preventDefault();if(!rating){toast('Please choose your star rating first.');return}
  const form=event.currentTarget,button=form.querySelector('button[type=submit]');const message=document.getElementById('feedbackText').value.trim();if(!message||message.length>1500){toast('Please enter feedback of up to 1,500 characters.');return}
  button.disabled=true;
  try{
   const res=await fetch(base+'/rest/v1/bbsilog_feedback',{method:'POST',headers:{...headers,Prefer:'return=minimal'},body:JSON.stringify({customer_name:document.getElementById('name').value.trim()||null,rating,message,publish_consent:document.getElementById('consent').checked})});
   if(!res.ok)throw Error('unavailable');form.reset();rate(0);toast('Salamat! Your feedback was sent privately.');
  }catch{toast('Feedback could not be sent. Please try again later.')}finally{button.disabled=false}
 };
 document.getElementById('feedbackText').maxLength=1500;
 const note=document.querySelector('.feedback .demo-note');if(note)note.textContent='Feedback is private unless you give permission and BBSILOG approves it for display.';
 showApproved();
 setInterval(()=>{if(!document.hidden)showApproved()},60000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)showApproved()});
})();
