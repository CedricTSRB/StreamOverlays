'use strict';
const $=id=>document.getElementById(id),api=window.tsrb;
const info={twitch:['Twitch','#a970ff','◈','Kanalname, z. B. twitch'],tiktok:['TikTok','#44e2dc','♪','@Benutzername, nur wenn LIVE'],kick:['Kick','#51e27a','K','Kanalname, z. B. xqc'],youtube:['YouTube','#ff555d','▶','Link zum Livestream oder UC-Kanal-ID'],facebook:['Facebook','#619bff','f','Facebook-Seite oder Live-Link'],instagram:['Instagram','#eb80c2','◎','Benutzername oder Profil-Link']};
const states={},messages=[];let selectedFilter='all',query='',obsUrl='';
let toastTimer;
function toast(text){const el=$('toast');el.textContent=text;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2500)}
function statusText(s){return {disconnected:'Nicht verbunden',connecting:'Verbinde …',connected:'Live',error:'Fehler',browser:'Browser'}[s]||'Bereit'}
function updateStatus(platform,state,detail=''){
 states[platform]={state,detail};const el=document.querySelector('[data-platform="'+platform+'"]');if(!el)return;
 const tag=el.querySelector('.state');tag.dataset.state=state;tag.textContent=statusText(state);
 el.querySelector('.platform-detail').textContent=detail|| (state==='disconnected'?'Noch nicht verbunden.':'');
 el.querySelector('.stop').disabled=state==='disconnected'||state==='browser';
 const connected=Object.values(states).filter(x=>x.state==='connected').length;
 $('connected-count').textContent=connected+' aktiv';
 $('status').textContent=connected?connected+' Livechat-'+(connected===1?'Verbindung':'Verbindungen')+' aktiv':'Verbinde die gewünschten Plattformen links';
}
function createPlatforms(){
 const container=$('platform-list');
 for(const [id,p] of Object.entries(info)){
  const el=document.createElement('section');el.className='platform';el.dataset.platform=id;el.style.setProperty('--platform',p[1]);
  const head=document.createElement('div');head.className='platform-head';const name=document.createElement('div');name.className='platform-name';
  const icon=document.createElement('span');icon.className='platform-icon';icon.textContent=p[2];const label=document.createElement('span');label.textContent=p[0];name.append(icon,label);
  const state=document.createElement('span');state.className='state';state.dataset.state='disconnected';state.textContent='Bereit';head.append(name,state);
  const input=document.createElement('input');input.id='target-'+id;input.placeholder=p[3];input.autocomplete='off';input.spellcheck=false;
  try{input.value=localStorage.getItem('tsrb:target:'+id)||''}catch(_){}
  const actions=document.createElement('div');actions.className='platform-actions';
  const go=document.createElement('button');go.textContent=['facebook','instagram'].includes(id)?'Im Browser öffnen':'Verbinden';
  const stop=document.createElement('button');stop.className='stop';stop.textContent='Trennen';stop.disabled=true;
  go.addEventListener('click',async()=>{const value=input.value.trim();try{const response=await api.connect(id,value);localStorage.setItem('tsrb:target:'+id,value);if(response.state==='browser')await api.open(id,value)}catch(e){updateStatus(id,'error',e.message)}});
  stop.addEventListener('click',()=>api.disconnect(id).catch(e=>toast(e.message)));
  input.addEventListener('keydown',e=>{if(e.key==='Enter')go.click()});
  actions.append(go,stop);
  const detail=document.createElement('p');detail.className='platform-detail';detail.textContent=['facebook','instagram'].includes(id)?'Browser-Ansicht; kein Chatimport':'Noch nicht verbunden.';
  el.append(head,input,actions,detail);container.append(el);
  const option=document.createElement('option');option.value=id;option.textContent=p[0];$('filter').append(option);
  states[id]={state:'disconnected'};
 }
}
function draw(){
 const feed=$('messages');feed.querySelectorAll('article.message').forEach(el=>el.remove());
 const fragment=document.createDocumentFragment();let shown=0;
 for(const m of messages){
  if(selectedFilter!=='all'&&m.platform!==selectedFilter)continue;
  if(query&&!((m.user+' '+m.text).toLocaleLowerCase('de').includes(query)))continue;
  const row=document.createElement('article');row.className='message';row.style.setProperty('--platform',info[m.platform]?.[1]||'#b39aff');
  const tag=document.createElement('span');tag.className='platform-tag';tag.textContent=(info[m.platform]?.[0]||m.platform).toUpperCase();
  const body=document.createElement('div');body.className='message-body';
  const name=document.createElement('span');name.className='username';name.textContent=m.user+': ';
  const content=document.createElement('span');content.className='chat-text';content.textContent=m.text;
  const time=document.createElement('time');time.textContent=new Date(m.time).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});time.dateTime=new Date(m.time).toISOString();
  body.append(name,content,time);row.append(tag,body);fragment.append(row);shown++;
 }
 feed.append(fragment);$('empty').hidden=shown>0;
 $('counter').textContent=messages.length+' Nachrichten';
 feed.scrollTop=feed.scrollHeight;
}
function add(m){if(!m?.text)return;messages.push(m);while(messages.length>350)messages.shift();draw();$('last-event').textContent='● Letzte Nachricht: '+new Date(m.time||Date.now()).toLocaleTimeString('de-DE')}
createPlatforms();
$('filter').addEventListener('change',e=>{selectedFilter=e.target.value;draw()});
$('search').addEventListener('input',e=>{query=e.target.value.toLocaleLowerCase('de').trim();draw()});
$('clear').addEventListener('click',async()=>{await api.clear();messages.length=0;draw()});
$('mini-btn').addEventListener('click',()=>api.mini().catch(e=>toast(e.message)));
const dialog=$('obs-dialog');
$('obs-btn').addEventListener('click',()=>{if(obsUrl){$('obs-url').value=obsUrl;dialog.showModal()}else toast('OBS-Quelle wird gestartet …')});
$('dialog-close').addEventListener('click',()=>dialog.close());
$('copy-url').addEventListener('click',()=>navigator.clipboard.writeText(obsUrl).then(()=>toast('OBS-Link kopiert')).catch(()=>{$('obs-url').select();toast('Link markieren und kopieren')}));
$('obs-preview').addEventListener('click',()=>{if(obsUrl)window.open(obsUrl,'_blank','noopener')});
api.onEvent(e=>{
 if(e.type==='message')add(e.message);
 else if(e.type==='status')updateStatus(e.platform,e.state,e.detail);
 else if(e.type==='overlay'){obsUrl=e.url;$('obs-url').value=e.url}
 else if(e.type==='clear'){messages.length=0;draw()}
 else if(e.type==='server-error')toast('OBS-Server: '+e.error);
});
api.snapshot().then(s=>{for(const m of s.history||[])messages.push(m);draw();for(const [id,value] of Object.entries(s.status||{}))updateStatus(id,value.state,value.detail);obsUrl=s.url||'';$('obs-url').value=obsUrl}).catch(e=>toast(e.message));
if(new URLSearchParams(location.search).get('mini')==='1'){document.body.classList.add('mini');const button=document.createElement('button');button.className='quiet';button.textContent='✕';button.title='Mini-Fenster schließen';button.addEventListener('click',()=>api.closeMini());document.querySelector('header').append(button)}
