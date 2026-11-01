const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{const rel=new URL(req.url,'http://localhost').pathname;const file=path.join(root,rel==='/'?'index.html':rel);if(!file.startsWith(root)||!fs.existsSync(file)||!fs.statSync(file).isFile())return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://ufhblydcgwffwpwdlksm.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
  // Fixtures prevent repeated test runs from downloading public map tiles.
  await page.route('https://tile.openstreetmap.org/**',r=>r.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=','base64')}));
  let failLibrary=true;
  await page.route('**/files/vendor/leaflet/leaflet.js',route=>{if(failLibrary){failLibrary=false;return route.abort()}return route.continue()});
  const base=process.env.RELEASE_URL||'http://127.0.0.1:'+server.address().port;
  await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.equal(await page.evaluate(()=>typeof L),'undefined','Map library lazy loads');
  assert.equal(await page.locator('main .updates').count(),0);
  assert.equal(await page.locator('footer .footer-follow').innerText(),'Follow BBSILOG ↗');
  await page.locator('#limited-edition').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.limited-card').dataset.scrollRevealed==='true');
  await page.evaluate(()=>showOrder());await page.locator('#panelMeals .plus').first().click();
  await page.locator('#orderNext').click();await page.locator('#orderNext').click();
  await page.locator('#orderCustomerName').fill('Delivery Test');await page.locator('#orderCustomerPhone').fill('09171234567');await page.locator('#payment').selectOption('Cash');
  await page.locator('#fulfillment').selectOption('Delivery');await page.locator('#deliveryCoverage').check();await page.locator('#address').fill('Maypajo, South Caloocan');
  await page.locator('#orderNext').click();
  await page.waitForFunction(()=>!document.getElementById('deliveryMapError').hidden);
  assert.match(await page.locator('#deliveryMapError').innerText(),/could not load/);
  await page.locator('#deliveryMapRetry').click();await page.waitForSelector('#deliveryMap.leaflet-container');
  assert.equal(await page.locator('#orderNext').isDisabled(),true,'Pin needed');
  await page.evaluate(()=>Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){fail({code:1})}}}));
  await page.locator('#deliveryLocate').click();
  assert.equal(await page.locator('#deliveryLocate').isEnabled(),true,'Location denial keeps manual map available');
  await page.locator('#deliveryUseCenter').click();
  assert.equal(await page.locator('#deliveryFee').innerText(),'₱40');
  assert.equal(await page.locator('#deliveryMapTotal').innerText(),'₱160');
  assert.equal(await page.locator('#orderNext').isDisabled(),true,'Pin acknowledgement needed');
  await page.locator('#deliveryPinConfirmed').check();await page.locator('#orderNext').click();
  const summary=await page.locator('#confirmOrderText').innerText();
  assert.match(summary,/Estimated delivery fee: ₱40/);assert.match(summary,/total: ₱160/);assert.match(summary,/Delivery pin: https:\/\/www.google.com\/maps/);
  await page.locator('#orderBack').click();
  assert.equal(await page.locator('#deliveryPinConfirmed').isChecked(),true,'Back preserves pin');
  await page.locator('#deliveryMap').focus();
  for(let i=0;i<10;i++){await page.keyboard.press('ArrowUp');await page.waitForTimeout(350);}
  await page.waitForTimeout(600);await page.locator('#deliveryUseCenter').click();
  assert.equal(await page.locator('#deliveryFee').innerText(),'Pickup only');assert.equal(await page.locator('#orderNext').isDisabled(),true,'Outside coverage cannot confirm');
  await page.locator('#orderBack').click();await page.locator('#fulfillment').selectOption('Pickup');await page.locator('#orderNext').click();
  const pickup=await page.locator('#confirmOrderText').innerText();assert.match(pickup,/Service: Pickup/);assert.doesNotMatch(pickup,/Estimated delivery fee|Delivery pin/);
  await page.locator('#orderBack').click();await page.locator('#fulfillment').selectOption('Delivery');await page.locator('#orderNext').click();
  assert.equal(await page.locator('#deliveryFee').innerText(),'—','Old pin cleared when switching pickup');
  await page.locator('#deliveryUseCenter').click();
  // Mobile and desktop visual/overflow proof, without writing an order or customer data.
  for(const width of [320,390,1190]){
   await page.setViewportSize({width,height:930});await page.waitForTimeout(100);
   assert.equal(await page.locator('.order').evaluate(el=>el.scrollWidth>el.clientWidth),false,'No order overflow at '+width);
   await page.locator('#orderStepMap').screenshot({path:root+'/tests/delivery-map-'+width+'.png'});
  }
  assert.deepEqual(errors,[]);
  console.log('PASS: lazy map, fee/total, pin confirmation, out-of-range block, back/edit, pickup, responsive widths, footer and one-time reveal.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
