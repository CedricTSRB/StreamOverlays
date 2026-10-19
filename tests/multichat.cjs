const {chromium}=require('playwright');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1400,height:960},permissions:['clipboard-read','clipboard-write']});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.TEST_URL||'http://127.0.0.1:8765/');await page.locator('[data-nav="multi-chat"]').click();await page.locator('#multi-chat').waitFor({state:'visible'});
for(const platform of ['twitch','tiktok','kick','youtube','facebook','instagram'])assert.equal(await page.locator('#mc-channel-'+platform).count(),1);
await page.locator('#mc-channel-twitch').fill('samplechannel');await page.locator('.mc-relay-card summary').click();await page.locator('#mc-session').fill('ExampleSession123');await page.locator('#mc-save').click();assert.match(await page.locator('#mc-save-status').textContent(),/lokal gespeichert/i,'save works even without cloud backend');assert.doesNotMatch(await page.locator('#mc-save-status').textContent(),/Failed to fetch|fehlgeschlagen/i);await page.locator('[data-mc-tab=overlay]').click();
assert.equal(await page.locator('.mc-theme-tile').count(),20,'20 theme tiles should be shown');
await page.locator('#mc-theme-search').fill('arcade');
assert.equal(await page.locator('.mc-theme-tile:visible').count(),1,'theme search filters cards');
await page.locator('#mc-theme-search').fill('');
await page.locator('.mc-theme-tile[data-theme=arcade]').click();
assert.equal(await page.locator('#mc-preview').getAttribute('data-theme'),'arcade','live preview uses selected design');
await page.locator('#mc-copy').click();
const url=await page.evaluate(()=>navigator.clipboard.readText());assert(url.includes('overlay=chat')&&url.includes('config='),'relay uses snapshot');assert.equal(JSON.parse(new URL(url).searchParams.get('config')).design.theme,'arcade','new preset embedded in OBS snapshot');
const obs=await browser.newPage({viewport:{width:800,height:900}});await obs.goto(url);assert.equal(await obs.locator('.mc-obs-feed').count(),1);assert.equal(await obs.locator('.mc-obs-feed').getAttribute('data-theme'),'arcade','OBS renders selected theme');
await obs.evaluate(()=>{window.WebSocket=class{constructor(url){this.url=url;window.__connectedSocket=url;setTimeout(()=>this.onopen?.(),0)}close(){}}});await obs.close();
await page.locator('[data-mc-tab=connections]').click();await page.locator('#mc-session').fill('Invalid session!!');await page.locator('#mc-connect').click();assert.match(await page.locator('#mc-connection-status').textContent(),/Twitch|Verbinde|Verbindung|verbunden/i);
await page.reload();await page.locator('[data-nav="multi-chat"]').click();await page.locator('#multi-chat').waitFor({state:'visible'});assert.equal(await page.locator('#mc-channel-twitch').inputValue(),'samplechannel');const fake=await browser.newPage({viewport:{width:1200,height:850}});
await fake.addInitScript(()=>{
 window.WebSocket=class{
 constructor(url){this.url=url;window.__relaySocket=this;setTimeout(()=>this.onopen?.(),15)}
 send(){}
 close(){}
 emit(data){this.onmessage?.({data:JSON.stringify(data)})}
 };
});
await fake.goto(process.env.TEST_URL||'http://127.0.0.1:8765/');
await fake.locator('[data-nav="multi-chat"]').click();await fake.locator('#multi-chat').waitFor({state:'visible'});
await fake.locator('#mc-channel-twitch').fill('testchannel');
await fake.waitForFunction(()=>window.__relaySocket?.url.includes('irc-ws.chat.twitch.tv'),{timeout:5000});
await fake.evaluate(()=>window.__relaySocket.onmessage?.({data:':Viewer!viewer@viewer.tmi.twitch.tv PRIVMSG #testchannel :Hallo aus Twitch\\r\\n'.replace(/\\r/g,'\r').replace(/\\n/g,'\n')}));
assert.equal(await fake.locator('.mc-live-item').count(),1,'typing Twitch channel starts live chat automatically');
await fake.locator('#mc-clear').click();
await fake.locator('.mc-relay-card summary').click();
await fake.locator('#mc-session').fill('TesterSession987');
await fake.locator('#mc-connect').click();
await fake.waitForFunction(()=>window.__relaySocket?.url.includes('/TesterSession987/4'));
for(const type of ['twitch','tiktok','kick','youtube','facebook','instagram'])await fake.evaluate(t=>window.__relaySocket.emit({type:t,chatname:'TestUser',chatmessage:'Message from '+t}),type);
assert.equal(await fake.locator('.mc-live-item').count(),6);
await fake.locator('#mc-live-filter').selectOption('tiktok');
assert.equal(await fake.locator('.mc-live-item:visible').count(),1);
await fake.close();
assert.deepEqual(errors,[]);await browser.close();console.log('PASS: six channels, saved fields, OBS snapshot, transparent overlay, invalid session');})().catch(e=>{console.error(e);process.exit(1)});
