'use strict';
// Headless chat backend for the OBS dock. Binds to localhost only.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createConnectionManager } = require('./connections');
const { PLATFORMS } = require('./core');
const portValue = process.env.TSRB_OBS_PORT || '18765';
const port = Number(portValue);
const token = process.env.TSRB_OBS_TOKEN || '';
if (!Number.isInteger(port) || port < 0 || port > 65535) throw Error('Invalid TSRB_OBS_PORT');
if (token.length < 24) throw Error('TSRB_OBS_TOKEN must be at least 24 characters');
const manager = createConnectionManager();
const clients = new Set();
let messages = [];
const MAX_BODY = 8192;
const assets = {
 '/dock.css': ['obs-dock.css','text/css; charset=utf-8'],
 '/dock.js': ['obs-dock.js','text/javascript; charset=utf-8'],
 '/overlay.css': ['obs-overlay.css','text/css; charset=utf-8'],
 '/overlay.js': ['obs-overlay.js','text/javascript; charset=utf-8']
};
function headers(type) {
 return {
  'Content-Type': type,
  'Cache-Control':'no-store',
  'Referrer-Policy':'no-referrer',
  'X-Content-Type-Options':'nosniff',
  'Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
 };
}
function respond(res,status,value) {
 res.writeHead(status,headers('application/json; charset=utf-8'));
 res.end(JSON.stringify(value));
}
function authorized(req,u) {
 const candidate = String(req.headers['x-tsrb-token'] || u.searchParams.get('token') || '');
 const a = Buffer.from(candidate);
 const b = Buffer.from(token);
 return a.length === b.length && crypto.timingSafeEqual(a,b);
}
function broadcast(event) {
 const serialized = 'data: ' + JSON.stringify(event) + '\n\n';
 for (const client of clients) {
  try { client.write(serialized); } catch { clients.delete(client); }
 }
}
manager.onEvent(event => {
 if(event.type==='message' && event.message?.text) {
  messages.push(event.message);
  if(messages.length>350)messages.shift();
 }
 broadcast(event);
});
function readJSON(req) {
 return new Promise((resolve,reject)=>{
  if(!(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return reject(Error('Expected JSON'));
  const chunks=[];let size=0;
  req.on('data',chunk=>{
   size+=chunk.length;
   if(size>MAX_BODY){reject(Error('Request too large'));req.destroy();return;}
   chunks.push(chunk);
  });
  req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))}catch{reject(Error('Invalid JSON'))}});
  req.on('error',reject);
 });
}
function serveAsset(res,filename,type) {
 const data=fs.readFileSync(path.join(__dirname,filename));
 res.writeHead(200,headers(type));
 res.end(data);
}
const server=http.createServer(async(req,res)=>{
 try{
  const host=String(req.headers.host||'');
  const parsed=new URL(req.url||'/', 'http://127.0.0.1');
  // No cross-origin commands, no DNS rebinding, no exposure on LAN.
  const boundPort=server.address()?.port || port;
  if(!['127.0.0.1:'+boundPort,'localhost:'+boundPort].includes(host))return respond(res,403,{error:'Invalid host'});
  if(req.method==='GET' && parsed.pathname==='/health')return respond(res,200,{ok:true});
  if(req.method==='GET' && assets[parsed.pathname]) {
   const [file,type]=assets[parsed.pathname]; return serveAsset(res,file,type);
  }
  if(!authorized(req,parsed))return respond(res,403,{error:'Unauthorized'});
  if(req.method==='GET' && (parsed.pathname==='/' || parsed.pathname==='/dock'))return serveAsset(res,'obs-dock.html','text/html; charset=utf-8');
  if(req.method==='GET' && parsed.pathname==='/overlay')return serveAsset(res,'obs-overlay.html','text/html; charset=utf-8');
  if(req.method==='GET' && parsed.pathname==='/api/status')return respond(res,200,{platforms:PLATFORMS,status:manager.getStatus(),history:messages.slice(-50)});
  if(req.method==='GET' && parsed.pathname==='/api/events'){
   res.writeHead(200,{...headers('text/event-stream; charset=utf-8'),'Connection':'keep-alive','X-Accel-Buffering':'no'});
   clients.add(res);res.write('retry: 3000\n: connected\n\n');
   req.on('close',()=>clients.delete(res));return;
  }
  if(req.method==='POST' && ['/api/connect','/api/disconnect','/api/clear'].includes(parsed.pathname)){
   const input=await readJSON(req);
   if(parsed.pathname==='/api/clear'){
    messages=[];broadcast({type:'clear'});return respond(res,200,{ok:true});
   }
   if(!input || typeof input.platform!=='string' || !Object.hasOwn(PLATFORMS,input.platform))return respond(res,400,{error:'Unbekannte Plattform'});
   if(parsed.pathname==='/api/disconnect'){
    manager.stop(input.platform);return respond(res,200,{ok:true});
   }
   if(PLATFORMS[input.platform].mode!=='live')return respond(res,400,{error:'Für diese Plattform gibt es derzeit keinen öffentlichen Livechat-Import'});
   if(typeof input.target!=='string' || input.target.length>400)return respond(res,400,{error:'Ungültige Eingabe'});
   const state=manager.connect(input.platform,input.target);
   return respond(res,202,{state:state.state});
  }
  return respond(res,404,{error:'Nicht gefunden'});
 }catch(e){
  const text=String(e?.message||e);
  return respond(res,400,{error:text.slice(0,300)});
 }
});
const keepAlive=setInterval(()=>{for(const res of clients)try{res.write(': heartbeat\n\n')}catch{clients.delete(res)}},25000);
server.on('error',error=>{console.error('OBS MultiChat server error:',error.message);process.exitCode=1});
server.listen(port,'127.0.0.1',()=>console.log('TSRB_OBS_READY '+server.address().port));
function shutdown(){
 clearInterval(keepAlive);
 manager.closeAll();
 for(const client of clients){try{client.end()}catch{}}
 clients.clear();
 server.close();
}
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
