(function(){
 const Q=BBSILOGQR;
 let saved=null,fingerprint=null,busy=false,requestId=null;
 const step=document.getElementById('orderStep4');
 step.querySelector('h2').textContent='Your order QR';
 step.querySelector('p').textContent='Save the QR image and send it to BBSILOG in Messenger. Staff will verify the saved order and confirm availability and payment.';
 const optionalCopy=step.querySelector('button[onclick="copyOrder()"]');if(optionalCopy)optionalCopy.textContent='Copy order details (optional)';
 const box=Q.node('section',undefined,'qr-panel');box.hidden=true;box.id='savedOrderQR';step.prepend(box);
 const promo=Q.node('p','Website orders get 3% off food. A completed-order review earns a 5% voucher for your next order. Discounts do not stack.','promo-note');
 document.getElementById('orderStep2').prepend(promo);
 const field=Q.node('div');const label=Q.node('label','Have a 5% review voucher? (optional)');label.htmlFor='reviewVoucher';
 const voucher=Q.node('input');voucher.id='reviewVoucher';voucher.placeholder='Paste voucher code or QR link';voucher.autocomplete='off';
 field.append(label,voucher,Q.node('small','Use the same mobile number. One use · 30 days · 5% replaces the website 3%.'));
 document.getElementById('orderStep3').append(field);
 function payload(){
  return {name:document.getElementById('orderCustomerName').value.trim(),phone:normalizedOrderPhone(),fulfillment:document.getElementById('fulfillment').value,payment:document.getElementById('payment').value,zone:document.getElementById('deliveryZone').value,address:document.getElementById('address').value.trim(),notes:document.getElementById('notes').value.trim(),items:Object.entries(cart).map(([i,qty])=>({name:products[i].name,qty})),voucher:voucher.value.trim()?Q.parse(voucher.value):null};
 }
 refreshMessengerUnlock=function(){
  let ready=false;try{ready=!!saved&&fingerprint===JSON.stringify(payload())&&!validateCustomerOrder()}catch{}
  const link=document.getElementById('orderMessenger');link.hidden=!ready;link.setAttribute('aria-disabled',String(!ready));link.tabIndex=ready?0:-1;
  if(ready)link.href='https://m.me/bbsilog.tapsilogan';else link.removeAttribute('href');
  document.getElementById('orderCopyStatus').textContent=ready?'Order saved. Save the QR image, then open Messenger and attach it. Copying text is optional.':'Confirm your current order details to generate a valid QR.';
  return ready;
 };
 const originalSummary=buildCustomerOrderSummary;
 buildCustomerOrderSummary=function(){
  const text=originalSummary();
  let matches=false;try{matches=saved&&fingerprint===JSON.stringify(payload())}catch{}
  if(!matches)return text;
  const discount=Math.round(Number(saved.subtotal)*saved.discount_rate)/100;
  return text+'\n\nSaved order: '+saved.code+'\nWebsite food discount: '+saved.discount_rate+'% (not stackable)\nEstimated discount: '+Q.money(discount)+'\nEstimated discounted food total: '+Q.money(saved.subtotal-discount)+(saved.unpriced?' + items to confirm':'')+'\nOrder QR / receipt: '+Q.link(saved.token)+'\nStaff: scan/verify the QR in BBSILOG Admin. The saved system total is authoritative.';
 };
 const originalNext=orderNext;
 orderNext=async function(){
  if(orderStage!==3)return originalNext();
  if(busy)return;
  const error=validateCustomerOrder();if(error){toast(error.message);return}
  busy=true;document.getElementById('orderNext').disabled=true;
  try{
   const data=payload(),signature=JSON.stringify(data);
   if(signature!==fingerprint){requestId=crypto.randomUUID();saved=null;fingerprint=signature;}
   const result=saved||await Q.api('bbsilog_create_order',{p_request:{...data,request_id:requestId}});
   if(JSON.stringify(payload())!==signature||orderStage!==3)throw Error('Order changed. Confirm the updated details again.');
   saved=result;box.replaceChildren(Q.node('h3','Your order QR · '+result.code));
   const image=Q.node('div',undefined,'qr-image');Q.qr(image,Q.link(result.token));
   const link=Q.node('a','Open receipt / save QR');link.href=Q.link(result.token);link.target='_blank';link.rel='noopener';
   const save=Q.node('button','Save QR image');save.type='button';save.onclick=()=>Q.download(image,result.code+'.png').catch(e=>toast(e.message));
   box.append(image,save,Q.node('p',result.discount_rate+'% food discount · Staff must verify this QR.'),link,Q.node('small','Keep this QR private. It grants access to your order receipt.'));
   box.hidden=false;invalidateCopiedOrder();setOrderStage(4);refreshMessengerUnlock();
  }catch(error){toast(error.message);box.hidden=true;}
  finally{busy=false;refreshWizardControls();}
 };
 const oldCopy=copyOrder;
 copyOrder=async function(){try{if(!saved||fingerprint!==JSON.stringify(payload())){toast('Confirm the updated order first to generate its QR.');return}await oldCopy();}catch(e){toast(e.message)}};
 voucher.addEventListener('input',invalidateCopiedOrder);
 const rewardOrder=new URLSearchParams(location.search).get('review_order');
 if(rewardOrder){
  const intro=Q.node('p','Review your completed order to receive a one-use 5% voucher. Any honest rating qualifies; publication is optional.','promo-note');
  document.querySelector('.feedback').prepend(intro);
 }
 window.showReviewVoucher=function(result){
  let host=document.getElementById('earnedVoucher');
  if(!host){host=Q.node('section',undefined,'qr-panel');host.id='earnedVoucher';document.querySelector('.feedback').append(host)}
  host.replaceChildren(Q.node('h3','Salamat! Your 5% voucher is ready.'));
  const image=Q.node('div',undefined,'qr-image');Q.qr(image,Q.link(result.voucher,'voucher'));
  const code=Q.node('input');code.value=result.voucher;code.readOnly=true;code.setAttribute('aria-label','Your voucher code');
  const save=Q.node('button','Save 5% voucher QR');save.type='button';save.onclick=()=>Q.download(image,'bbsilog-5-percent-voucher.png').catch(e=>toast(e.message));
  host.append(image,save,code,Q.node('p','One use · Same mobile number · Valid until '+new Date(result.expires_at).toLocaleDateString()+'. Replaces the 3% website discount.'));
  host.scrollIntoView({behavior:'smooth',block:'center'});
 };
})();
