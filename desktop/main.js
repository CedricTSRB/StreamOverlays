'use strict';
const {app,BrowserWindow,ipcMain,shell,screen}=require('electron');
const path=require('node:path');
const http=require('node:http');
const {createConnectionManager}=require('./connections');
const {PLATFORMS,parseTarget}=require('./core');
let mainWindow=null,miniWindow=null,server=null;
const manager=createConnectionManager();
let history=[],clients=new Set(),overlayPort=0;
const push=event=>{
 if(event.type==='message'){history.push(event.message);if(history.length>350)history.shift()}
 for(const win of [mainWindow,miniWindow])if(win&&!win.isDestroyed())win.webContents.send('multichat:event',event);
 if(event.type==='message'){
  const packet='data: '+JSON.stringify(event.message)+'\n\n';
  for(const res of clients)try{res.write(packet)}catch(_){clients.delete(res)}
 }
};
manager.onEvent(push);
const allowedExternal=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['twitch.tv','tiktok.com','youtube.com','youtu.be','kick.com','facebook.com','instagram.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d))}catch{return false}};
function createWindow(mini=false){
 const win=new BrowserWindow({width:mini?440:1270,height:mini?620:850,minWidth:mini?330:940,minHeight:mini?300:630,alwaysOnTop:mini,frame:!mini,title:mini?'TSRB MultiChat – Mini':'TSRB MultiChat',backgroundColor:'#0d1220',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,preload:path.join(__dirname,'preload.js')}});
 win.removeMenu();win.loadFile(path.join(__dirname,'index.html'),mini?{query:{mini:'1'}}:undefined);
 win.webContents.setWindowOpenHandler(({url})=>{if(allowedExternal(url))shell.openExternal(url);return {action:'deny'}});
 win.on('closed',()=>{if(mini)miniWindow=null;else mainWindow=null});
 return win;
}
function htmlSafe(text){return String(text).replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]))}
function overlayHtml(){
 return `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TSRB MultiChat OBS</title><style>html,body{margin:0;background:transparent;color:white;font:600 19px system-ui;overflow:hidden}#feed{padding:16px;max-width:850px;display:flex;flex-direction:column;gap:9px}.chat{background:#0b1025c9;border-left:4px solid var(--c);padding:10px 14px;border-radius:9px;overflow-wrap:anywhere;text-shadow:0 1px 2px black}.tag{font-size:12px;opacity:.8;margin-right:10px}.user{font-weight:900;color:var(--c)}.content{font-weight:500}@media(prefers-reduced-motion:no-preference){.chat{animation:rise .25s ease-out}@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}}</style><div id="feed" aria-live="polite"></div><script>
 const feed=document.getElementById('feed');const colors=${JSON.stringify(Object.fromEntries(Object.entries(PLATFORMS).map(([id,p])=>[id,p.color])))};
 function add(m){if(!m?.text)return;const row=document.createElement('div');row.className='chat';row.style.setProperty('--c',colors[m.platform]||'#bbadff');const tag=document.createElement('span');tag.className='tag';tag.textContent=(m.platform||'CHAT').toUpperCase();const user=document.createElement('span');user.className='user';user.textContent=m.user+': ';const body=document.createElement('span');body.className='content';body.textContent=m.text;row.append(tag,user,body);feed.append(row);while(feed.children.length>8)feed.firstElementChild.remove()}
 fetch('/history').then(r=>r.json()).then(list=>list.slice(-8).forEach(add)).catch(()=>{});
 const stream=new EventSource('/events');stream.onmessage=e=>{try{add(JSON.parse(e.data))}catch{}};
 <\/script></html>`;
}
function startOverlay(){
 server=http.createServer((req,res)=>{
  const pathname=(req.url||'').split('?')[0];
  if(pathname==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','Access-Control-Allow-Origin':'http://127.0.0.1'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return}
  if(pathname==='/history'){res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(history.slice(-20)));return}
  if(pathname==='/'||pathname==='/overlay'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'"});res.end(overlayHtml());return}
  res.writeHead(404);res.end('Not found');
 });
 server.listen(0,'127.0.0.1',()=>{overlayPort=server.address().port;push({type:'overlay',url:'http://127.0.0.1:'+overlayPort+'/overlay'})});
 server.on('error',e=>push({type:'server-error',error:e.message}));
}
app.whenReady().then(()=>{
 ipcMain.handle('chat:connect',(_,platform,input)=>manager.connect(platform,input));
 ipcMain.handle('chat:disconnect',(_,platform)=>{manager.stop(platform);return true});
 ipcMain.handle('chat:snapshot',()=>({history,status:manager.getStatus(),url:overlayPort?'http://127.0.0.1:'+overlayPort+'/overlay':''}));
 ipcMain.handle('chat:open',(_,platform,input)=>{const target=parseTarget(platform,input);const url=target.url||({twitch:'https://www.twitch.tv/',tiktok:'https://www.tiktok.com/@',kick:'https://kick.com/',youtube:'https://www.youtube.com/'}[platform]||'')+(target.channel||target.handle||'');if(allowedExternal(url))return shell.openExternal(url);throw Error('Ungültiges Ziel')});
 ipcMain.handle('chat:preview',()=>{if(!overlayPort)throw Error('OBS-Server noch nicht bereit');const u='http://127.0.0.1:'+overlayPort+'/overlay';const win=new BrowserWindow({width:930,height:760,backgroundColor:'#111626',title:'TSRB MultiChat · OBS Vorschau',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});win.loadURL(u);return true});
 ipcMain.handle('chat:mini',()=>{if(miniWindow&&!miniWindow.isDestroyed()){miniWindow.focus();return true}miniWindow=createWindow(true);return true});
 ipcMain.handle('chat:close-mini',()=>{if(miniWindow&&!miniWindow.isDestroyed())miniWindow.close();return true});
 ipcMain.handle('chat:clear',()=>{history=[];push({type:'clear'});return true});
 mainWindow=createWindow();startOverlay();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
app.on('before-quit',()=>{manager.closeAll();for(const res of clients)res.end();clients.clear();server?.close()});
