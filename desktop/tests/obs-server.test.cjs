'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {spawn}=require('node:child_process');
const {once}=require('node:events');
const token='test-secret-token-abcdefghijklmnopqrstuvwxyz';
let child,port,base;
test.before(async()=>{
 child=spawn(process.execPath,[path.join(__dirname,'..','obs-server.js')],{env:{...process.env,TSRB_OBS_PORT:'0',TSRB_OBS_TOKEN:token},stdio:['ignore','pipe','pipe']});
 let output='';
 const ready=new Promise((resolve,reject)=>{
  const timeout=setTimeout(()=>reject(Error('Server did not start: '+output)),12000);
  child.stdout.on('data',chunk=>{
   output+=chunk.toString();
   const match=output.match(/TSRB_OBS_READY (\d+)/);
   if(match){clearTimeout(timeout);resolve(Number(match[1]))}
  });
  child.once('exit',code=>{clearTimeout(timeout);reject(Error('Backend exited '+code+': '+output))});
 });
 port=await ready;base='http://127.0.0.1:'+port;
});
test.after(async()=>{
 if(child&&!child.killed){
  child.kill();
  await Promise.race([once(child,'exit').catch(()=>{}),new Promise(resolve=>setTimeout(resolve,3000))]);
 }
});
test('local backend health works',async()=>{
 const res=await fetch(base+'/health');assert.equal(res.status,200);assert.deepEqual(await res.json(),{ok:true});
});
test('private dock and API reject calls without token',async()=>{
 for(const route of ['/dock','/overlay','/api/status','/api/events']){
  const res=await fetch(base+route);assert.equal(res.status,403,route);
 }
});
test('only same-origin host is accepted (DNS rebinding mitigation)',async()=>{
 const res=await fetch(base+'/api/status',{headers:{host:'malicious.example:'+port,'X-TSRB-Token':token}});
 assert.equal(res.status,403);
});
test('dock and overlay assets, auth and statuses are served',async()=>{
 const res=await fetch(base+'/dock?token='+token);assert.equal(res.status,200);
 assert.match(await res.text(),/TSRB MultiChat/);
 const overlay=await fetch(base+'/overlay?token='+token);assert.equal(overlay.status,200);
 const status=await fetch(base+'/api/status',{headers:{'X-TSRB-Token':token}});
 const data=await status.json();assert.equal(status.status,200);assert.equal(data.platforms.tiktok.name,'TikTok');
});
test('invalid platform and browser-only import are rejected',async()=>{
 for(const data of [{platform:'invalid',target:'abc'},{platform:'facebook',target:'test'}]){
  const res=await fetch(base+'/api/connect?token='+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal(res.status,400);
 }
});
test('invalid Twitch and TikTok usernames are rejected safely',async()=>{
 for(const data of [{platform:'twitch',target:'?!'},{platform:'tiktok',target:'!'}]){
  const res=await fetch(base+'/api/connect?token='+token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  assert.equal(res.status,400);
 }
});
test('clearing feed returns success and JSON-only POSTs required',async()=>{
 const rejected=await fetch(base+'/api/clear?token='+token,{method:'POST',body:'hi'});
 assert.equal(rejected.status,400);
 const result=await fetch(base+'/api/clear?token='+token,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
 assert.equal(result.status,200);
 assert.deepEqual(await result.json(),{ok:true});
});
