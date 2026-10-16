const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:["--no-sandbox","--disable-dev-shm-usage","--disable-gpu"]});
 const context=await browser.newContext({viewport:{width:1440,height:1100},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.TEST_URL||'http://127.0.0.1:8765/';await page.goto(base);await page.waitForTimeout(400);
 const set=async(id,value)=>page.locator('#'+id).evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));},String(value));
 const rect=async(sel)=>page.locator(sel).evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}});
 for(const kind of ['subs','followers','timer']){
  await page.locator('[data-widget='+kind+']').click();
  await page.locator('[data-editor-tab=fine]').click();
  await set('box-width',550);await set('box-height',140);await set('text-x',12);await set('text-y',8);
  await page.locator('#font-family').selectOption('mono');
  const card='#overlay-preview .'+kind+'-card',bar=card+' > .bar';
  const before=await rect(card),barBefore=kind!=='timer'?await rect(bar):null;
  await set('all-size',200);
  assert.deepEqual(await rect(card),before,'font must not move/resize box');
  if(barBefore)assert.deepEqual(await rect(bar),barBefore,'font must not move/resize bar');
  const sizes=await page.locator(card+(kind==='timer'?' .timer-card-content':' .goal-top')).evaluate(el=>[el,...el.querySelectorAll('*')].map(e=>getComputedStyle(e).fontSize));
  assert(sizes.every(x=>x==='30px'),JSON.stringify(sizes));
  const text=page.locator(card+(kind==='timer'?' .timer-card-content':' .goal-top'));
  await text.scrollIntoViewIfNeeded();const r=await text.boundingBox();const scale=await page.locator('#overlay-preview').evaluate(e=>e.getBoundingClientRect().width/e.offsetWidth);await page.mouse.move(r.x+10,r.y+10);await page.mouse.down();await page.mouse.move(r.x+10+30*scale,r.y+10+20*scale);await page.mouse.up();
  assert.equal(await page.locator('#text-x').inputValue(),'42');assert.equal(await page.locator('#text-y').inputValue(),'28');
  await page.locator('#copy-overlay-all').click();const url=await page.evaluate(()=>navigator.clipboard.readText());assert(url.includes('#config='));
  const isolated=await browser.newContext({viewport:{width:1920,height:1080}});const obs=await isolated.newPage();await obs.goto(url);
  assert.equal(await obs.locator('.obs-content .'+kind+'-card').evaluate(e=>getComputedStyle(e).width),'550px');
  assert.equal(await obs.locator('.obs-content .'+kind+'-card').evaluate(e=>getComputedStyle(e).getPropertyValue('--text-x')),'42px');
  assert.equal(await obs.locator('html').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
  assert.equal(await obs.locator('.tsrb-resize-grip').count(),0);
  await isolated.close();
 }
 // Corner resizing, visibility toggles, independent positions and timer behavior.
 await page.locator('[data-widget=timer]').click();await page.locator('[data-editor-tab=fine]').click();
 await set('box-x',35);await set('box-y',22);
 const grip=page.locator('#overlay-preview .timer-card .tsrb-resize-grip');await grip.scrollIntoViewIfNeeded();
 const gr=await grip.boundingBox();const gs=await page.locator('#overlay-preview').evaluate(e=>e.getBoundingClientRect().width/e.offsetWidth);
 await page.mouse.move(gr.x+gr.width/2,gr.y+gr.height/2);await page.mouse.down();await page.mouse.move(gr.x+gr.width/2+20*gs,gr.y+gr.height/2+20*gs);await page.mouse.up();
 assert.equal(await page.locator('#box-width').inputValue(),'570');assert.equal(await page.locator('#box-height').inputValue(),'160');
 await page.locator('[data-editor-tab=goals]').click();await page.locator('#timer-toggle').click();
 const time=await page.locator('#preview-timer').textContent();await page.waitForTimeout(1100);assert.notEqual(await page.locator('#preview-timer').textContent(),time);
 await page.locator('#timer-toggle').click();const paused=await page.locator('#preview-timer').textContent();await page.waitForTimeout(1100);assert.equal(await page.locator('#preview-timer').textContent(),paused);
 await page.locator('#timer-reset').click();
 await page.locator('[data-widget=subs]').click();
 for(const id of ['counter-show-label','counter-show-numbers','counter-show-bar'])await page.locator('#'+id).uncheck();
 assert.equal(await page.locator('#overlay-preview .subs-card .goal-top').isVisible(),false);assert.equal(await page.locator('#overlay-preview .subs-card .bar').isVisible(),false);
 for(const id of ['counter-show-label','counter-show-numbers','counter-show-bar'])await page.locator('#'+id).check();
 // Every design preserves geometry, custom colors and unified type.
 await page.locator('[data-widget=subs]').click();await page.locator('[data-editor-tab=designs]').click();
 for(const style of ['neon','glass','fill','sharp','outline','transparent','counter','image']){
  await page.locator('[data-style='+style+']').click();await set('overlay-text-color','#12abcd');await set('overlay-bar-color','#aa1234');await set('overlay-bg-color','#123456');
  assert.equal(await page.locator('#preview-subs small').evaluate(e=>getComputedStyle(e).fontSize),'30px');
  assert.equal(await page.locator('#preview-subs').evaluate(e=>getComputedStyle(e).color),'rgb(18, 171, 205)');
  assert.equal(await page.locator('#subs-progress').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(170, 18, 52)');
 }
 // Local images survive export and fresh-browser reload.
 await page.locator('[data-editor-tab=fine]').click();
 await page.locator('#background-file').setInputFiles({name:'test.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')});
 await page.waitForTimeout(100);await page.locator('[data-editor-tab=designs]').click();await page.locator('[data-reset-color=backgroundColor]').click();
 await page.locator('#copy-overlay-all').click();const imageURL=await page.evaluate(()=>navigator.clipboard.readText());const obs=await context.newPage();await obs.goto(imageURL);
 assert((await obs.locator('.obs-content .subs-card').evaluate(e=>getComputedStyle(e).backgroundImage)).includes('data:image/png'));
 await page.reload();await page.locator('[data-editor-tab=fine]').click();assert.equal(await page.locator('#text-x').inputValue(),'42');
 await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'/tmp/editor-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/editor-mobile.png',fullPage:true});
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile page should not overflow');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: widgets, fonts, geometry, dragging, eight designs, colors, persistence, snapshot export, uploaded image, transparency and mobile layout');
})().catch(e=>{console.error(e);process.exit(1)});
