'use strict';
const token=new URL(location.href).searchParams.get('token')||'';
const $=id=>document.getElementById(id);
const platforms=[
 ['twitch','Twitch','#a970ff','Kanalname oder Twitch-Link'],
 ['tiktok','TikTok','#44e2dc','@Benutzername (LIVE)'],
 ['kick','Kick','#51e27a','Kanalname oder Kick-Link'],
 ['youtube','YouTube','#ff555d','YouTube LIVE-Link / Video-ID']
];
const feed=[];
const limit=250;
let selected='all';
function notify(text){$('toast').textContent=String(text||'').slice(0,220)}
async function api(route,data){
 const response=await fetch('/api/'+route,{
  method:data===undefined?'GET':'POST',
  headers:{'X-TSRB-Token':token,...(data===undefined?{}:{'Content-Type':'application/json'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})
 });
 let result={};
 try{result=await response.json()}catch{}
 if(!response.ok)throw Error(result.error||'Verbindung fehlgeschlagen');
 return result;
}
function updateStatus(id,state,detail){
 const el=document.querySelector('[data-platform="'+id+'"]');
 if(!el)return;
 const badge=el.querySelector('.pstatus');
 badge.dataset.state=state;
 badge.textContent={connecting:'Verbinde …',connected:'LIVE',error:'Fehler',disconnected:'Getrennt'}[state]||state;
 el.querySelector('.pdetail').textContent=detail||'';
 el.querySelector('.disconnect').disabled=state==='disconnected';
}
function render(){
 const box=$('chat');
 box.textContent='';
 let shown=0;
 for(const m of feed){
  if(selected!=='all'&&m.platform!==selected)continue;
  const row=document.createElement('article');row.className='message';
  const info=platforms.find(p=>p[0]===m.platform)||[m.platform,m.platform,'#afa6ee'];
  row.style.setProperty('--brand',info[2]);
  const platform=document.createElement('span');platform.className='platform-name';platform.textContent=info[1].toUpperCase()+' · ';
  const user=document.createElement('b');user.textContent=String(m.user||'Unbekannt')+': ';
  const content=document.createElement('span');content.textContent=String(m.text||'');
  const time=document.createElement('time');time.textContent=new Date(m.time||Date.now()).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
  row.append(platform,user,content,time);box.append(row);shown++;
 }
 if(!shown){const empty=document.createElement('p');empty.className='empty';empty.textContent='Noch keine Nachrichten für diese Auswahl.';box.append(empty)}
 box.scrollTop=box.scrollHeight;
}
function addMessage(m){
 if(!m||!m.text)return;
 feed.push(m);while(feed.length>limit)feed.shift();
 render();
}
for(const [id,name,color,hint] of platforms){
 const wrap=document.createElement('section');wrap.className='platform';wrap.dataset.platform=id;wrap.style.setProperty('--brand',color);
 const head=document.createElement('div');head.className='phead';
 const pname=document.createElement('span');pname.className='pname';
 const dot=document.createElement('span');dot.className='pmark';pname.append(dot,document.createTextNode(name));
 const state=document.createElement('span');state.className='pstatus';state.dataset.state='disconnected';state.textContent='Getrennt';
 head.append(pname,state);
 const controls=document.createElement('div');controls.className='controls';
 const input=document.createElement('input');input.placeholder=hint;input.autocomplete='off';input.spellcheck=false;
 try{input.value=localStorage.getItem('tsrb-obs:'+id)||''}catch{}
 const btn=document.createElement('button');btn.textContent='Verbinden';
 const stop=document.createElement('button');stop.textContent='×';stop.className='disconnect';stop.title='Trennen';stop.disabled=true;
 const detail=document.createElement('p');detail.className='pdetail';detail.textContent='Nur öffentliche Live-Chats';
 const connect=async()=>{
  try{
   await api('connect',{platform:id,target:input.value.trim()});
   try{localStorage.setItem('tsrb-obs:'+id,input.value.trim())}catch{}
  }catch(e){updateStatus(id,'error',e.message)}
 };
 btn.addEventListener('click',connect);
 input.addEventListener('keydown',e=>{if(e.key==='Enter')connect()});
 stop.addEventListener('click',()=>api('disconnect',{platform:id}).catch(e=>notify(e.message)));
 controls.append(input,btn,stop);wrap.append(head,controls,detail);$('platforms').append(wrap);
 const option=document.createElement('option');option.value=id;option.textContent=name;$('filter').append(option);
}
$('filter').addEventListener('change',()=>{selected=$('filter').value;render()});
$('clear').addEventListener('click',()=>api('clear',{}).catch(e=>notify(e.message)));
$('copy-overlay').addEventListener('click',()=>{
 const url=location.origin+'/overlay?token='+encodeURIComponent(token);
 navigator.clipboard.writeText(url).then(()=>notify('OBS-Overlay-Link kopiert')).catch(()=>notify('Link: '+url));
});
async function initialize(){
 if(!token){notify('Ungültiger Dock-Link: Zugriffstoken fehlt');return}
 try{
  const snapshot=await api('status');$('health').textContent='● Bereit';
  for(const [id,s] of Object.entries(snapshot.status||{}))updateStatus(id,s.state,s.detail);
  for(const message of snapshot.history||[])addMessage(message);
 }catch(e){$('health').textContent='● Offline';notify(e.message)}
 const url='/api/events?token='+encodeURIComponent(token);
 const events=new EventSource(url);
 events.onopen=()=>{$('health').textContent='● Verbunden'};
 events.onerror=()=>{$('health').textContent='● Warte auf Server …'};
 events.onmessage=e=>{
  try{
   const event=JSON.parse(e.data);
   if(event.type==='message')addMessage(event.message);
   else if(event.type==='status')updateStatus(event.platform,event.state,event.detail);
   else if(event.type==='clear'){feed.length=0;render()}
  }catch{}
 };
}
initialize();
