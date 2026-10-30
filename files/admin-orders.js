(function(){
 const Q=BBSILOGQR;
 const nav=document.getElementById('adminNavigation'),feedback=document.getElementById('feedbackView'),orders=document.getElementById('ordersView'),scan=document.getElementById('qrVerifyView');
 let currentCode=null,currentResult=null,stream=null,raf=0,lastFrame=0,view='pending';
 function stop(){cancelAnimationFrame(raf);raf=0;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}document.getElementById('qrCamera').hidden=true;}
 function tab(name){
  stop();feedback.hidden=name!=='feedback';orders.hidden=!['orders','archives'].includes(name);scan.hidden=name!=='scan';
  nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
  if(!orders.hidden){view=name==='archives'?'archives':'pending';loadOrders();}
 }
 nav.querySelectorAll('button').forEach(b=>b.onclick=()=>tab(b.dataset.view));
 const oldShow=showInbox;showInbox=function(){oldShow();nav.hidden=false};
 document.getElementById('logout').addEventListener('click',()=>{stop();nav.hidden=true;document.getElementById('verifiedQR').replaceChildren()});
 function notice(text,error=false){const host=document.getElementById('qrVerifyStatus');host.textContent=text;host.className=error?'qr-error':'note';}
 async function loadOrders(){
  const host=document.getElementById('ordersList');host.textContent='Loading…';
  try{
   const data=await Q.api('bbsilog_admin_orders',{p_view:view},true);
   document.getElementById('orderStats').textContent='Used 3%: '+data.counts.three+' · Used 5%: '+data.counts.five+' · Total discounts: '+Q.money(data.counts.savings)+' · Pending: '+data.counts.pending;
   document.getElementById('ordersHeading').textContent=view==='archives'?'Used QR / Archives':'Pending website orders';
   host.replaceChildren();
   const filter=document.getElementById('archiveRate').value;
   const rows=(data.orders||[]).filter(o=>filter==='all'||String(o.discount_rate)===filter);
   if(!rows.length)host.textContent='No orders in this category.';
   for(const order of rows){
    const card=Q.node('article',undefined,'review');
    card.append(Q.node('h3',order.code+' · '+order.discount_rate+'% · '+order.status),Q.node('p',order.customer_name+' · '+order.phone),Q.node('p',new Date(order.completed_at||order.created_at).toLocaleString()),Q.node('p',(order.status==='completed'?'Final total: ':'Known food subtotal: ')+Q.money(order.final_total??order.subtotal)));
    const button=Q.node('button',order.status==='pending'?'Verify / complete':'View used QR record');button.onclick=()=>{tab('scan');verify(order.token)};card.append(button);host.append(card);
   }
  }catch(e){host.textContent=e.message}
 }
 document.getElementById('refreshOrders').onclick=loadOrders;document.getElementById('archiveRate').onchange=loadOrders;
 function renderVerified(result){
  const host=document.getElementById('verifiedQR');host.replaceChildren();
  currentResult=result;
  if(result.error)host.append(Q.node('h3',result.error,'qr-error'));
  const data=result.data;
  if(result.type==='order')Q.details(host,data);
  else host.append(Q.node('h3','5% review voucher'),Q.node('p','Mobile: '+data.phone),Q.node('p','Expires: '+new Date(data.expires_at).toLocaleString()));
  if(result.used){host.append(Q.node('p',result.redeemed?'Redemption recorded successfully.':'Invalid for another redemption: QR code has been used.','qr-error'));return}
  const amount=Q.node('input');amount.type='number';amount.min='0';amount.step='.01';amount.value='0';amount.id='qrExtraAmount';
  const fee=Q.node('input');fee.type='number';fee.min='0';fee.step='.01';fee.value='0';fee.id='qrDeliveryFee';
  if(result.type==='voucher'||data.unpriced){const label=Q.node('label',result.type==='voucher'?'Confirmed food subtotal':'Total for items marked price to confirm');label.htmlFor=amount.id;host.append(label,amount)}
  const label=Q.node('label','Delivery fee (not discounted)');label.htmlFor=fee.id;host.append(label,fee);
  const check=Q.node('input');check.type='checkbox';check.id='qrPaidConfirmed';
  const confirmation=Q.node('label',undefined,'qr-check');confirmation.append(check,document.createTextNode('I confirm payment was received and this order was fulfilled.'));host.append(confirmation);
  const use=Q.node('button',result.type==='voucher'?'Redeem 5% QR — single use':'Complete order & use QR');use.disabled=true;check.onchange=()=>use.disabled=!check.checked;
  use.onclick=async()=>{
   use.disabled=true;
   try{
    const r=await Q.api('bbsilog_admin_qr',{p_code:currentCode,p_action:result.type==='voucher'?'redeem':'complete',p_unpriced_total:Number(amount.value),p_delivery_fee:Number(fee.value)},true);
    renderVerified(r);notice('Recorded. This QR cannot be redeemed again.');
   }catch(e){notice(e.message,true);use.disabled=!check.checked}
  };
  host.append(use);
  if(result.type==='order'){
   const cancel=Q.node('button','Cancel pending order','secondary');cancel.onclick=async()=>{if(!confirm('Cancel this pending order?'))return;try{await Q.api('bbsilog_admin_qr',{p_code:currentCode,p_action:'cancel'},true);host.replaceChildren(Q.node('p','Order cancelled. QR is invalid.'));}catch(e){notice(e.message,true)}};host.append(cancel);
   const receipt=Q.node('a','Open customer receipt / review link');receipt.href=Q.link(data.token);receipt.target='_blank';receipt.rel='noopener';host.append(receipt);
  }
 }
 async function verify(raw){
  stop();document.getElementById('verifiedQR').replaceChildren();notice('Checking saved system record…');
  try{currentCode=Q.parse(raw);const result=await Q.api('bbsilog_admin_qr',{p_code:currentCode},true);renderVerified(result);notice(result.used?'QR code has been used':'Valid QR · Not yet used',result.used)}
  catch(e){notice(e.message,true)}
 }
 document.getElementById('verifyQRForm').onsubmit=e=>{e.preventDefault();verify(document.getElementById('qrCodeInput').value)};
 const video=document.getElementById('qrCamera'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
 function decode(source,w,h){const scale=Math.min(1,900/Math.max(w,h));canvas.width=Math.round(w*scale);canvas.height=Math.round(h*scale);ctx.drawImage(source,0,0,canvas.width,canvas.height);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);return jsQR(pixels.data,pixels.width,pixels.height)?.data}
 document.getElementById('startQRScan').onclick=async()=>{
  try{stop();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});video.srcObject=stream;video.hidden=false;await video.play();notice('Point the camera at a BBSILOG order or voucher QR.');
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
