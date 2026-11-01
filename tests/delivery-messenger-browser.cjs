const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{let rel=new URL(req.url,'http://localhost').pathname;if(rel==='/')rel='/index.html';if(!/^\/(index\.html|files\/)/.test(rel)||rel.includes('..'))return res.writeHead(404).end();const file=path.join(root,rel);if(!fs.existsSync(file))return res.writeHead(404).end();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.webp':'image/webp','.png':'image/png','.mp4':'video/mp4','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[],requests=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
    await page.route('https://ufhblydcgwffwpwdlksm.supabase.co/**',r=>r.fulfill({status:200,contentType:'application/json',body:'[]'}));
    await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{async writeText(text){window.copiedOrder=text}}}));
    await page.goto(process.env.RELEASE_URL||'http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>{showOrder();panelCategory('Silog meals')});
    await page.locator('#panelMeals .plus').first().click();
    await page.locator('#orderNext').click();await page.locator('#orderNext').click();
    assert.deepEqual(await page.locator('.wizard-progress span').allTextContents(),['1 · Order','2 · Review','3 · Details','4 · Confirm']);
    assert.equal(await page.locator('#orderStepMap').count(),0);
    await page.locator('#orderCustomerName').fill('Delivery Test');await page.locator('#orderCustomerPhone').fill('09171234567');
    await page.locator('#fulfillment').selectOption('Delivery');
    assert.equal(await page.locator('#orderNext').isDisabled(),true);
    await page.locator('#deliveryCoverage').check();await page.locator('#orderNext').click();assert.equal(await page.locator('#orderStep3').isVisible(),true);assert.equal(await page.locator('#address').evaluate(el=>el===document.activeElement),true);
    await page.locator('#address').fill('Silanganan St., Brgy. 26, Maypajo, South Caloocan');
    await page.locator('#payment').selectOption('GCash');
    assert.match(await page.locator('#gcashPayment').innerText(),/Please wait for BBSILOG.*full payment total in Messenger/);
    assert.doesNotMatch(await page.locator('#gcashPayment').innerText(),/After paying|send your GCash receipt/);
    assert.equal(await page.locator('#gcashPayment img').count(),1);
    await page.locator('#orderNext').click();
    assert.match(await page.locator('#confirmOrderText').innerText(),/Food subtotal: ₱120/);
    assert.match(await page.locator('#confirmOrderText').innerText(),/Delivery fee: To be confirmed and added in Messenger/);
    assert.doesNotMatch(await page.locator('#confirmOrderText').innerText(),/estimate|km|Final total: ₱/);
    assert.match(await page.locator('#wizardCount').innerText(),/Food subtotal ₱120/);
    assert.equal(await page.locator('#orderMessenger').isHidden(),true);
    await page.locator('button[onclick="copyOrder()"]').click();
    assert.equal(await page.locator('#orderMessenger').isVisible(),true);
    assert.match(await page.evaluate(()=>window.copiedOrder),/full payment total in Messenger before I pay/);
    // Editing after copying invalidates the copied summary and locks Messenger.
    await page.locator('#orderBack').click();await page.locator('#notes').fill('Updated request');await page.locator('#orderNext').click();
    assert.equal(await page.locator('#orderMessenger').isHidden(),true);
    await page.locator('#orderBack').click();await page.locator('#fulfillment').selectOption('Pickup');await page.locator('#orderNext').click();
    assert.match(await page.locator('#confirmOrderText').innerText(),/Service: Pickup/);
    assert.doesNotMatch(await page.locator('#confirmOrderText').innerText(),/Delivery fee:/);
    for(const width of [320,390,1190]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.locator('.order').evaluate(el=>el.scrollWidth>el.clientWidth),false);
    }
    assert.equal(requests.some(url=>/leaflet|delivery-map|delivery-fees|osrm|nominatim/i.test(url)),false);
    assert.deepEqual(errors,[]);
    console.log('PASS: four-step pickup/delivery, address checks, wait-before-GCash, no map/estimate, food subtotal, copy-before-Messenger and edit invalidation.');
  }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
