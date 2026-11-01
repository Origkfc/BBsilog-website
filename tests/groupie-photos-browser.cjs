const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let rel=new URL(req.url,'http://localhost').pathname;if(rel==='/')rel='/index.html';if(!/^\/(index\.html|files\/)/.test(rel)||rel.includes('..'))return res.writeHead(404).end();const file=path.join(root,rel);if(!fs.existsSync(file))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{
const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const fixtures=await page.evaluate(()=>{
 function make(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff1b4';x.fillRect(0,0,w,h);const size=Math.min(w,h)/5;for(const [color,a,b] of [['red',0,0],['lime',w-size,0],['blue',0,h-size],['magenta',w-size,h-size]]){x.fillStyle=color;x.fillRect(a,b,size,size)}x.fillStyle='#35180b';x.font=Math.min(w,h)/8+'px sans-serif';x.fillText('FULL GROUP PHOTO',w/10,h/2);return c.toDataURL('image/png')}
 return {wide:make(2400,1000),portrait:make(900,1800)};
});
for(const [name,data] of Object.entries(fixtures))await page.route('**/files/'+name+'-fixture.png',r=>r.fulfill({contentType:'image/png',body:Buffer.from(data.split(',')[1],'base64')}));
const url=process.env.RELEASE_URL||'http://127.0.0.1:'+server.address().port+'/?motion=custom';const origin=new URL(url).origin;
await page.route('https://ufhblydcgwffwpwdlksm.supabase.co/**',route=>{
 const url=route.request().url();let body=[];
 if(url.includes('/object/sign/'))body={signedURL:origin+'/files/'+(url.includes('portrait')?'portrait':'wide')+'-fixture.png'};
 else if(url.includes('/rest/v1/bbsilog_feedback'))body=['wide','portrait'].map((layout,i)=>({id:101+i,customer_name:'Browser-only fixture',rating:5,message:'All members of this group should remain visible.',source:'website',photo_path:layout+'.webp',photo_layout:'groupie',photo_consent:true}));
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
});
await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForSelector('#publicReviews .customer-review-photo.groupie');
for(const [name,ratio] of [['wide',2.4],['portrait',.5]]){
 await page.locator('input[name=photoLayout][value=groupie]').check();const previousSrc=await page.locator('#photoPreview').evaluate(el=>el.querySelector('img')?.src||'');await page.locator('#photoFile').setInputFiles({name:name+'.png',mimeType:'image/png',buffer:Buffer.from(fixtures[name].split(',')[1],'base64')});
 await page.waitForFunction(previous=>{const im=document.querySelector('#photoPreview img');return im?.complete&&im.naturalWidth>0&&im.src!==previous},previousSrc);
 const preview=await page.locator('#photoPreview img').evaluate(img=>({ratio:img.naturalWidth/img.naturalHeight,fit:getComputedStyle(img).objectFit,w:img.naturalWidth,h:img.naturalHeight}));
 assert.equal(preview.ratio,ratio);assert.equal(Math.max(preview.w,preview.h),1440);assert.equal(preview.fit,'contain');
 // Check all four corner markers survived conversion, not just the dimensions.
 const corners=await page.locator('#photoPreview img').evaluate(img=>{const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);return [[1,1],[c.width-2,1],[1,c.height-2],[c.width-2,c.height-2]].map(([a,b])=>[...x.getImageData(a,b,1,1).data].slice(0,3))});
 assert.ok(corners[0][0]>200&&corners[0][1]<40);assert.ok(corners[1][1]>200&&corners[1][0]<40);assert.ok(corners[2][2]>200&&corners[2][0]<40);assert.ok(corners[3][0]>200&&corners[3][2]>200);
 await page.locator('#photoPreview').screenshot({path:root+'/tests/groupie-preview-'+name+'.png'});
}
for(const width of [320,390,1190]){
 await page.setViewportSize({width,height:930});
 for(const selector of ['#publicReviews .customer-review-photo.groupie','.glass-review.has-groupie>.customer-review-photo.groupie']){
  const images=page.locator(selector);assert.ok(await images.count()>=2);
  await images.first().scrollIntoViewIfNeeded();await images.first().evaluate(im=>im.decode());
  assert.ok((await images.evaluateAll(xs=>xs.map(im=>getComputedStyle(im).objectFit))).every(fit=>fit==='contain'));

 }
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 if(width===390)await page.locator('#publicReviews').screenshot({path:root+'/tests/groupie-public-390.png'});
 await page.locator('#limited-edition').scrollIntoViewIfNeeded();
 for(const [name,slug] of [['Garlic Pepper Beef','garlic-pepper-beef-actual'],['Chicken Ala King','chicken-ala-king-actual']]){
  const card=page.locator('.limited-card').filter({hasText:name});const img=card.locator('img');assert.ok((await img.getAttribute('src')).includes(slug));await img.scrollIntoViewIfNeeded();await page.waitForFunction(slug=>{const img=document.querySelector('.limited-card img[src*="'+slug+'"]');return img?.complete&&img.naturalWidth>0},slug);assert.equal(await img.evaluate(im=>getComputedStyle(im).objectFit),'contain');
 }
 if(width===1190)await page.locator('#limited-edition').screenshot({path:root+'/tests/actual-meals-1190.png'});
}
assert.deepEqual(errors,[]);
// Exercise the real admin stylesheet without signing in or changing real feedback.
await page.goto(origin+'/files/feedback-admin.html',{waitUntil:'domcontentloaded',timeout:60000});await page.evaluate(origin=>{const card=document.createElement('article');card.className='review';const img=document.createElement('img');img.className='admin-review-photo groupie';img.src=origin+'/files/wide-fixture.png';card.append(img);document.querySelector('main').append(card)},origin);
await page.waitForFunction(()=>document.querySelector('.admin-review-photo')?.naturalWidth>0);assert.equal(await page.locator('.admin-review-photo').evaluate(im=>getComputedStyle(im).objectFit),'contain');assert.deepEqual(errors,[]);
console.log('PASS: actual meal photos, full groupie preview/upload corners, public tickets and admin, mobile/desktop. No real feedback submitted.');
}finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
