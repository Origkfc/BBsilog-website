(async()=>{
 const Q=BBSILOGQR,params=new URLSearchParams(location.search),status=document.getElementById('receiptStatus');
 document.getElementById('saveQR').onclick=()=>Q.download(document.getElementById('receiptQR')).catch(e=>status.textContent=e.message);
 try{
  const raw=params.get('order')||params.get('voucher'),code=Q.parse(raw||'');
  if(params.has('voucher')){
   Q.qr(document.getElementById('receiptQR'),Q.link(code,'voucher'));
   status.textContent='5% review voucher · Staff will verify availability, expiry, and whether it has been used.';
   const input=Q.node('input');input.readOnly=true;input.value=code;document.getElementById('receiptDetails').append(input);
   return;
  }
  const order=await Q.api('bbsilog_order_receipt',{p_token:code});
  status.textContent=order.status==='completed'?'QR code has been used · Completed order':order.status==='cancelled'?'Order cancelled':'Order saved · Awaiting staff confirmation';
  Q.qr(document.getElementById('receiptQR'),Q.link(code));Q.details(document.getElementById('receiptDetails'),order);
  if(order.status==='completed'&&!order.review_id){const a=document.getElementById('reviewOrder');a.hidden=false;a.href='/?review_order='+encodeURIComponent(code)+'#feedback'}
  if(order.reward){
   const host=document.getElementById('receiptDetails');
   host.append(Q.node('h2','Your 5% review voucher'));
   const qr=Q.node('div',undefined,'qr-image');Q.qr(qr,Q.link(order.reward,'voucher'));host.append(qr);
   host.append(Q.node('p','Single use. Staff will verify its current status.'));
  }
 }catch(e){status.textContent=e.message;status.className='qr-error';document.getElementById('printQR').hidden=true}
})();
