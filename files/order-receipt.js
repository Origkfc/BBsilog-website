(async()=>{
 const Q=BBSILOGQR,params=new URLSearchParams(location.search),status=document.getElementById('receiptStatus');
 const host=document.getElementById('receiptQR'),save=document.getElementById('saveQR'),print=document.getElementById('printQR');
 let code,kind=params.has('voucher')?'voucher':'order',valid=false,busy=false;
 const refresh=Q.node('button','Check QR status');refresh.type='button';host.before(refresh);
 const notice=Q.node('p','Validity is checked with BBSILOG. Back / Revise or a replacement checkout invalidates an old order QR. A screenshot alone does not guarantee a discount.','note');host.before(notice);
 const review=document.getElementById('reviewOrder');
 const reviewHint=Q.node('p','Makakapag-review ka rito pagkatapos makumpleto ng staff ang order.','note');
 review.before(reviewHint);host.before(review);host.before(reviewHint);
 async function update(){
  if(busy||!code)return;busy=true;save.disabled=true;print.disabled=true;refresh.disabled=true;
  try{
   const result=await Q.api('bbsilog_qr_status',{p_code:code});valid=result.valid;
   status.textContent=(result.status==='used'&&kind==='order'?'Order completed · Nagamit na ang discount sa order na ito.':result.message)+' · Last checked '+new Date().toLocaleTimeString('en-PH',{timeZone:'Asia/Manila'});
   status.className=valid?'qr-valid':'qr-error';
   host.hidden=!valid;
   if(valid)Q.qr(host,Q.link(code,kind));
   review.hidden=true;reviewHint.hidden=kind!=='order';
   const details=document.getElementById('receiptDetails');details.replaceChildren();
   if(kind==='order'){
    const order=await Q.api('bbsilog_order_receipt',{p_token:code});Q.details(details,order);
    if(order.status==='completed'&&!order.review_id){reviewHint.hidden=true;review.hidden=false;review.textContent='Leave review · Up to one 5% voucher per mobile number today';review.href='/?review_order='+encodeURIComponent(code)+'#feedback'}
    if(order.review_id)reviewHint.hidden=true;
    if(order.reward){
     details.append(Q.node('h2','Your 5% review voucher'));
     const link=Q.node('a','View voucher QR and current status');link.href=Q.link(order.reward,'voucher');details.append(link);
    }else if(order.review_id)details.append(Q.node('p','Your review was saved. The daily reward limit may apply; no extra voucher was issued for this order.'));
   }else{
    const input=Q.node('input');input.readOnly=true;input.value=code;input.setAttribute('aria-label','Voucher code');details.append(input,Q.node('p','One 5% reward per mobile number per Philippine day. Voucher: single use, 30 days, same mobile number; applies to your next order.'));
    if(result.expires_at)details.append(Q.node('p','Expires: '+new Date(result.expires_at).toLocaleDateString('en-PH',{timeZone:'Asia/Manila'})));
   }
  }catch(e){valid=false;host.hidden=true;status.textContent='Status unverified: '+e.message+' Connect to the internet and check again before sending this QR.';status.className='qr-error'}
  finally{busy=false;save.disabled=!valid;print.disabled=!valid;refresh.disabled=false}
 }
 try{code=Q.parse(params.get('order')||params.get('voucher')||'')}catch(e){status.textContent=e.message;save.hidden=true;print.hidden=true;refresh.hidden=true;return}
 refresh.onclick=update;
 save.onclick=async()=>{await update();if(valid)Q.download(host).catch(e=>status.textContent=e.message)};
 print.onclick=async()=>{await update();if(valid)window.print()};
 await update();setInterval(()=>{if(!document.hidden)update()},10000);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
})();
