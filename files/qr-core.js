(function(){
 const base='https://ufhblydcgwffwpwdlksm.supabase.co',key='sb_publishable_d10Qrzk0LHaoVYnttjtOyQ_g-049cX3';
 async function api(name,args={},admin=false){
  const bearer=admin?sessionStorage.getItem('bbsilog_feedback_token'):key;
  const response=await fetch(base+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+bearer,'Content-Type':'application/json'},body:JSON.stringify(args)});
  const data=await response.json();
  if(!response.ok)throw Error(data.message||'Could not verify. Please try again.');
  return data;
 }
 function parse(value){
  let text=value.trim();
  if(/^https?:/i.test(text)){
   const u=new URL(text);
   if(u.origin!==location.origin&&u.hostname!=='bbsilog-website.vercel.app')throw Error('Not a BBSILOG QR code');
   text=u.searchParams.get('order')||u.searchParams.get('voucher')||'';
  }
  if(!/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|BB-[0-9A-F]{8})$/i.test(text))throw Error('Invalid BBSILOG QR code');
  return text;
 }
 function link(code,type='order'){return location.origin+'/files/order-receipt.html?'+type+'='+encodeURIComponent(code)}
 function qr(host,text){const code=qrcode(0,'M');code.addData(text);code.make();host.innerHTML=code.createSvgTag({cellSize:5,margin:4,scalable:true});host.querySelector('svg').setAttribute('aria-label','BBSILOG QR code');}
 function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el}
 async function download(host,filename='bbsilog-qr.png'){
  const svg=host.querySelector('svg');if(!svg)throw Error('QR image unavailable');
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
  try{
   const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=canvas.height=900;
   const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,900,900);ctx.drawImage(image,0,0,900,900);
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
   const fileURL=URL.createObjectURL(blob),a=document.createElement('a');a.href=fileURL;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(fileURL),10000);
  }finally{URL.revokeObjectURL(url)}
 }
 const money=n=>'₱'+Number(n||0).toFixed(2);
 function details(host,order){
  host.replaceChildren(node('h3',order.code||'Order'));
  host.append(node('p',(order.customer_name||'')+' · '+(order.phone||'')));
  for(const item of order.items||[])host.append(node('p',item.qty+' × '+item.name+' · '+(item.price===null?'Price to confirm':money(item.price*item.qty))));
  host.append(node('p',order.fulfillment+' · '+order.payment));
  if(order.address)host.append(node('p',order.address));
  if(order.notes)host.append(node('p','Notes: '+order.notes));
  const subtotal=order.final_food??order.subtotal;
  const discount=order.discount_amount??Math.round(Number(subtotal)*order.discount_rate)/100;
  host.append(node('p','Food subtotal: '+money(subtotal)+(order.unpriced&&order.final_food===null?' + items to confirm':'')));
  host.append(node('p',order.discount_rate+'% discount: −'+money(discount)));
  host.append(node('strong',(order.final_total===null||order.final_total===undefined?'Estimated food total: ':'Final total: ')+money(order.final_total??Number(subtotal)-discount)));
  host.append(node('p','Delivery fees are separate. Unpriced items and availability require staff confirmation.','note'));
 }
 window.BBSILOGQR={api,parse,link,qr,node,money,details,download};
})();
