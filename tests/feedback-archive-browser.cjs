const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const rel = new URL(req.url, 'http://localhost').pathname;
  if (!rel.startsWith('/files/') || rel.includes('..')) return res.writeHead(404).end();
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) return res.writeHead(404).end();
  res.setHeader('Content-Type', ({ '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css' })[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  try {
    const page = await browser.newPage({ viewport:{ width:390, height:844 } });
    const errors = [], deletions = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = { rating:4, message:'Browser-only test feedback', source:'website', publish_consent:true, status:'pending', created_at:'2026-10-01T00:00:00Z' };
    let rows = [
      { ...base, id:11, customer_name:'Earlier archive', archived_at:'2026-10-29T00:00:00Z' },
      { ...base, id:12, customer_name:'Latest archive', archived_at:'2026-10-31T00:00:00Z' },
      { ...base, id:13, customer_name:'Active review', archived_at:null }
    ];
    let failDelete = false;
    await page.addInitScript(() => sessionStorage.setItem('bbsilog_feedback_token', 'browser-test-token'));
    await page.route('https://ufhblydcgwffwpwdlksm.supabase.co/**', async route => {
      const request = route.request(), url = request.url();
      let response = true;
      if (url.includes('/rpc/bbsilog_delete_archived_feedback')) {
        const body = request.postDataJSON();
        deletions.push(body);
        if (failDelete) return route.fulfill({ status:500, contentType:'application/json', body:'{}' });
        assert.deepEqual(body, { p_id:12, p_confirmation:'DELETE' });
        rows = rows.filter(row => row.id !== body.p_id);
      } else if (url.includes('/bbsilog_feedback?')) {
        if (request.method() === 'PATCH') {
          const id = Number(new URL(url).searchParams.get('id').slice(3));
          rows = rows.map(row => row.id === id ? { ...row, ...request.postDataJSON() } : row);
          response = rows.filter(row => row.id === id);
        } else response = rows;
      }
      return route.fulfill({ status:200, contentType:'application/json', body:JSON.stringify(response) });
    });
    const url = (process.env.RELEASE_URL ? new URL('/files/feedback-admin.html', process.env.RELEASE_URL).href : 'http://127.0.0.1:' + server.address().port + '/files/feedback-admin.html');
    await page.goto(url, { waitUntil:'domcontentloaded' });
    await page.getByRole('button', { name:'All (1)', exact:true }).waitFor();
    assert.equal(await page.getByRole('button', { name:'Delete permanently', exact:true }).isVisible(), false);
    await page.getByRole('button', { name:'Deleted / Archived (2)', exact:true }).click();
    assert.equal(await page.locator('#archiveNotice').isVisible(), true);
    assert.match(await page.locator('#archiveNotice').innerText(), /50.*51st/);
    assert.match(await page.locator('.review').first().innerText(), /Latest archive/);
    await page.locator('.review').first().getByRole('button', { name:'Delete permanently' }).click();
    const dialog = page.getByRole('dialog');
    assert.equal(await dialog.isVisible(), true);
    assert.equal(await page.getByRole('button', { name:'Cancel', exact:true }).evaluate(el => el === document.activeElement), true);
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(), false);
    assert.equal(deletions.length, 0);
    await page.locator('.review').first().getByRole('button', { name:'Delete permanently' }).click();
    await dialog.getByRole('button', { name:'Cancel', exact:true }).click();
    assert.equal(deletions.length, 0);
    // Server failure remains visible, does not remove the review, and permits retry.
    failDelete = true;
    await page.locator('.review').first().getByRole('button', { name:'Delete permanently' }).click();
    await dialog.getByRole('button', { name:'Delete permanently' }).click();
    await page.locator('#deleteFeedbackError').getByText(/Request failed/).waitFor();
    assert.equal(await page.locator('.review').count(), 2);
    failDelete = false;
    await dialog.getByRole('button', { name:'Delete permanently' }).click();
    await page.getByRole('button', { name:'Deleted / Archived (1)', exact:true }).waitFor();
    assert.equal(await dialog.isVisible(), false);
    assert.equal(await page.locator('.review').count(), 1);
    assert.match(await page.locator('#status').innerText(), /permanently deleted/);
    // Restore stays available and removes the item from the archive view.
    await page.getByRole('button', { name:'Restore feedback', exact:true }).click();
    await page.getByRole('button', { name:'Deleted / Archived (0)', exact:true }).waitFor();
    await page.getByRole('button', { name:'All (2)', exact:true }).click();
    assert.equal(await page.locator('#archiveNotice').isHidden(), true);
    for (const width of [320,390,1190]) {
      await page.setViewportSize({ width, height:844 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: archive notice, newest-first order, confirmation/cancel, error/retry, exact deletion, restore, mobile layout.');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
