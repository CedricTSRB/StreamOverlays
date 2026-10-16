'use strict';
const token=new URL(location.href).searchParams.get('token')||'';
const colors={twitch:'#a970ff',tiktok:'#44e2dc',kick:'#51e27a',youtube:'#ff555d'};
const feed=document.getElementById('feed');
function add(m){
 if(!m||!m.text)return;
 const row=document.createElement('div');row.className='message';row.style.setProperty('--brand',colors[m.platform]||'#b8a7ff');
 const source=document.createElement('span');source.className='source';source.textContent=String(m.platform||'chat').toUpperCase();
 const user=document.createElement('span');user.className='user';user.textContent=String(m.user||'Unbekannt')+': ';
 const content=document.createElement('span');content.className='text';content.textContent=m.text;
 row.append(source,user,content);feed.append(row);
 while(feed.children.length>8)feed.firstElementChild.remove();
}
if(token){
 fetch('/api/status',{headers:{'X-TSRB-Token':token}}).then(r=>r.ok?r.json():Promise.reject()).then(s=>(s.history||[]).slice(-8).forEach(add)).catch(()=>{});
 const events=new EventSource('/api/events?token='+encodeURIComponent(token));
 events.onmessage=e=>{try{const event=JSON.parse(e.data);if(event.type==='message')add(event.message);if(event.type==='clear')feed.textContent=''}catch{}};
}
