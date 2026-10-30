(function(){
 const Q=BBSILOGQR;
 let saved=null,fingerprint=null,busy=false,requestId=null,qrState='unverified',statusBusy=false;
 function read(key){try{return localStorage.getItem(key)}catch{return null}}
 function write(key,value){try{if(value)localStorage.setItem(key,value);else localStorage.removeItem(key)}catch{}}
 const checkoutId=read('bbsilog_checkout_id')||crypto.randomUUID();write('bbsilog_checkout_id',checkoutId);
 const step=document.getElementById('orderStep4');
 step.querySelector('h2').textContent='Your order QR';
 step.querySelector('p').textContent='Save the valid QR image and send it to BBSILOG in Messenger. Back / Revise invalidates the old QR. Staff verifies the saved order before applying a discount.';
 const optionalCopy=step.querySelector('button[onclick="copyOrder()"]');if(optionalCopy)optionalCopy.textContent='Copy order details (optional)';
 const box=Q.node('section',undefined,'qr-panel');box.hidden=true;box.id='savedOrderQR';step.prepend(box);
 const promo=Q.node('p','Website orders get 3% off food. Review a completed order to earn a 5% voucher for your next purchase: maximum ONE voucher per mobile number per Philippine calendar day. Discounts do not stack.','promo-note');
 document.getElementById('orderStep2').prepend(promo);
 const notice=Q.node('p','Confirm generates one active checkout QR in this browser. Reconfirming replaces the previous QR; old screenshots become invalid.','promo-note');
 document.getElementById('orderStep3').append(notice);
 const field=Q.node('div');const label=Q.node('label','Have a 5% review voucher? (optional)');label.htmlFor='reviewVoucher';
 const voucher=Q.node('input');voucher.id='reviewVoucher';voucher.placeholder='Paste voucher code or QR link';voucher.autocomplete='off';
 field.append(label,voucher,Q.node('small','Use the same mobile number. One use · 30 days · 5% replaces the website 3%.'));
 document.getElementById('orderStep3').append(field);
 const revived=read('bbsilog_active_order_token');
 if(revived){
  const p=Q.node('p','You previously generated an order QR. If you confirm a new order in this browser, its old pending QR will be invalidated.','promo-note');
  const a=Q.node('a','View its current status');a.href=Q.link(revived);a.target='_blank';a.rel='noopener';p.append(document.createTextNode(' '),a);document.getElementById('orderStep1').append(p);
 }
 function payload(){
  return {checkout_id:checkoutId,name:document.getElementById('orderCustomerName').value.trim(),phone:normalizedOrderPhone(),fulfillment:document.getElementById('fulfillment').value,payment:document.getElementById('payment').value,zone:document.getElementById('deliveryZone').value,address:document.getElementById('address').value.trim(),notes:document.getElementById('notes').value.trim(),items:Object.entries(cart).map(([i,qty])=>({name:products[i].name,qty})),voucher:voucher.value.trim()?Q.parse(voucher.value):null};
 }
 function matches(){try{return !!saved&&fingerprint===JSON.stringify(payload())&&!validateCustomerOrder()}catch{return false}}
 refreshMessengerUnlock=function(){
  const ready=matches()&&qrState==='valid',link=document.getElementById('orderMessenger');link.hidden=!ready;link.setAttribute('aria-disabled',String(!ready));link.tabIndex=ready?0:-1;
  if(ready)link.href='https://m.me/bbsilog.tapsilogan';else link.removeAttribute('href');
  document.getElementById('orderCopyStatus').textContent=ready?'Valid saved order. Save the QR image, then open Messenger and attach it. Copying text is optional.':'Only a currently valid QR can be sent. Confirm updated details or check QR status.';
  return ready;
 };
 async function checkStatus(){
  if(!saved||statusBusy)return;
  statusBusy=true;const token=saved.token;
  try{
   const result=await Q.api('bbsilog_qr_status',{p_code:token});if(!saved||saved.token!==token)return;
   qrState=result.status;
   const el=document.getElementById('orderQRValidity');
   if(el){el.textContent=result.message+' · Checked '+new Date().toLocaleTimeString('en-PH',{timeZone:'Asia/Manila'});el.className=result.valid?'qr-valid':'qr-error';}
  }catch{
   qrState='unverified';const el=document.getElementById('orderQRValidity');
   if(el){el.textContent='Status could not be checked. Connect to the internet and tap Check status. Do not send the QR until it is verified.';el.className='qr-error'}
  }finally{
   statusBusy=false;const button=document.getElementById('saveOrderQRImage');if(button)button.disabled=qrState!=='valid';refreshMessengerUnlock();
  }
 }
 const originalSummary=buildCustomerOrderSummary;
 buildCustomerOrderSummary=function(){
  const text=originalSummary();if(!matches())return text;
  const discount=Math.round(Number(saved.subtotal)*saved.discount_rate)/100;
  return text+'\n\nSaved order: '+saved.code+'\nFood discount: '+saved.discount_rate+'% (not stackable)\nEstimated discount: '+Q.money(discount)+'\nEstimated discounted food total: '+Q.money(saved.subtotal-discount)+(saved.unpriced?' + items to confirm':'')+'\nOrder QR / receipt: '+Q.link(saved.token)+'\nStatus must be verified by staff. Old QR codes become invalid after Back / Revise or a replacement checkout.';
 };
 const originalNext=orderNext,originalBack=orderBack;
 orderNext=async function(){
  if(busy)return;
  if(orderStage!==3)return originalNext();
  const error=validateCustomerOrder();if(error){toast(error.message);return}
  busy=true;document.getElementById('orderNext').disabled=true;
  try{
   const data=payload(),signature=JSON.stringify(data);
   if(signature!==fingerprint){requestId=crypto.randomUUID();saved=null;fingerprint=signature;}
   const result=saved||await Q.api('bbsilog_create_order',{p_request:{...data,request_id:requestId}});
   if(JSON.stringify(payload())!==signature||orderStage!==3)throw Error('Order changed. Confirm updated details again.');
   saved=result;qrState='unverified';write('bbsilog_active_order_token',result.token);
   box.replaceChildren(Q.node('h3','Your order QR · '+result.code));
   const validity=Q.node('p','Checking QR status…','note');validity.id='orderQRValidity';validity.setAttribute('role','status');validity.setAttribute('aria-live','polite');
   const image=Q.node('div',undefined,'qr-image');Q.qr(image,Q.link(result.token));
   const link=Q.node('a','Open receipt / QR status');link.href=Q.link(result.token);link.target='_blank';link.rel='noopener';
   const save=Q.node('button','Save QR image');save.type='button';save.id='saveOrderQRImage';save.disabled=true;save.onclick=async()=>{await checkStatus();if(qrState==='valid')Q.download(image,result.code+'.png').catch(e=>toast(e.message))};
   const check=Q.node('button','Check status');check.type='button';check.onclick=checkStatus;
   const revise=Q.node('button','Back / Revise order');revise.type='button';revise.onclick=()=>orderBack();
   box.append(validity,image,save,check,revise,Q.node('p',result.discount_rate+'% food discount · Staff must verify this QR.'),link,Q.node('small','One active QR per checkout browser. Back / Revise invalidates this QR. One 5% review reward per mobile number per day, Philippine time. Keep this QR private.'));
   box.hidden=false;invalidateCopiedOrder();setOrderStage(4);await checkStatus();
  }catch(error){toast(error.message);box.hidden=true;if(error.message.includes('no longer valid')){saved=null;fingerprint=null;requestId=null;}}
  finally{busy=false;refreshWizardControls();}
 };
 orderBack=async function(){
  if(busy)return;
  if(orderStage===4&&saved){
   if(!confirm('Going back will INVALIDATE this QR, including saved screenshots. After your changes, confirm again to receive a NEW QR. Continue?'))return;
   busy=true;document.getElementById('orderBack').disabled=true;
   try{
    const result=await Q.api('bbsilog_cancel_order_qr',{p_token:saved.token});
    toast(result.message);saved=null;fingerprint=null;requestId=null;qrState='invalid';box.hidden=true;write('bbsilog_active_order_token',null);invalidateCopiedOrder();originalBack();
   }catch(e){toast('Could not invalidate the QR. Stay here and reconnect, then try Back / Revise again.');await checkStatus()}
   finally{busy=false;document.getElementById('orderBack').disabled=false;}
   return;
  }
  originalBack();
 };
 const oldCopy=copyOrder;
 copyOrder=async function(){await checkStatus();if(!matches()||qrState!=='valid'){toast('Confirm a valid order QR before copying.');return}await oldCopy()};
 voucher.addEventListener('input',invalidateCopiedOrder);
 setInterval(()=>{if(!document.hidden&&saved)checkStatus()},10000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkStatus()});addEventListener('storage',e=>{if(e.key==='bbsilog_active_order_token')checkStatus()});
 const rewardOrder=new URLSearchParams(location.search).get('review_order');
 if(rewardOrder){
  const intro=Q.node('p','Review your paid, completed order. Any honest rating qualifies; publication is optional. Limit: ONE 5% review voucher per mobile number per day (Philippine time). If you already earned one today, your review will still be saved without another voucher.','promo-note');
  document.querySelector('.feedback').prepend(intro);
 }
 window.showReviewVoucher=function(result){
  let host=document.getElementById('earnedVoucher');
  if(!host){host=Q.node('section',undefined,'qr-panel');host.id='earnedVoucher';host.setAttribute('role','status');document.querySelector('.feedback').append(host)}
  if(result.eligible===false){host.replaceChildren(Q.node('h3','Salamat! Your review was saved.'),Q.node('p',result.message));host.scrollIntoView({behavior:'smooth',block:'center'});return}
  host.replaceChildren(Q.node('h3','Your 5% voucher for today is ready!'),Q.node('p',result.message||'One reward per mobile number per Philippine calendar day.'));
  const image=Q.node('div',undefined,'qr-image');Q.qr(image,Q.link(result.voucher,'voucher'));
  const code=Q.node('input');code.value=result.voucher;code.readOnly=true;code.setAttribute('aria-label','Your voucher code');
  const save=Q.node('button','Save 5% voucher QR');save.type='button';save.onclick=()=>Q.download(image,'bbsilog-5-percent-voucher.png').catch(e=>toast(e.message));
  const link=Q.node('a','View voucher validity / status');link.href=Q.link(result.voucher,'voucher');link.target='_blank';link.rel='noopener';
  host.append(image,save,code,link,Q.node('p','One use · Same mobile number · Valid until '+new Date(result.expires_at).toLocaleDateString('en-PH',{timeZone:'Asia/Manila'})+'. Replaces 3%; discounts do not stack.'));
  host.scrollIntoView({behavior:'smooth',block:'center'});
 };
})();
