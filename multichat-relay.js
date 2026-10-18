/* Browser-side receive-only chat bridge; sources must be captured by Social Stream Ninja. */
(()=>{'use strict';
const allowed=new Set(['twitch','tiktok','kick','youtube','facebook','instagram']);
function clean(v){return String(v||'').replace(/<[^>]*>/g,'').replace(/[\x00-\x1f]/g,' ').slice(0,2200)}
function parse(raw){
 let d=raw;
 if(d?.data?.chatname)d=d.data;
 else if(d?.value?.chatname)d=d.value;
 if(!d||typeof d!=='object')return null;
 let type=String(d.type||d.platform||'').toLowerCase();
 if(type==='youtubeshorts')type='youtube';
 if(type==='tiktoklive')type='tiktok';
 if(!allowed.has(type)||!d.chatname)return null;
 const text=clean(d.chatmessage||d.message||'');
 if(!text.trim())return null;
 return {platform:type,user:clean(d.chatname).slice(0,80),text,id:clean(d.id||''),time:Date.now(),source:clean(d.sourceName||'')};
}
function connect(session,handle,status){
 if(!/^[A-Za-z0-9_-]{6,90}$/.test(session||'')){status?.('error','Ungültige Session-ID');return ()=>{}}
 let ws=null,timer=null,attempt=0,active=true;
 function open(){
  if(!active)return;
  status?.('connecting','Social Stream Ninja wird verbunden …');
  try{
   ws=new WebSocket('wss://io.socialstream.ninja/join/'+encodeURIComponent(session)+'/4');
   ws.onopen=()=>{attempt=0;status?.('connected','Verbindung hergestellt – Quellen müssen in Social Stream Ninja aktiv sein')};
   ws.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch{return}for(const item of Array.isArray(d)?d:[d]){const m=parse(item);if(m)handle(m)}};
   ws.onerror=()=>status?.('error','WebSocket-Verbindung gestört');
   ws.onclose=()=>{if(active){status?.('disconnected','Verbindung getrennt – neuer Versuch …');timer=setTimeout(open,Math.min(30000,1000*2**Math.min(5,attempt++)))}};
  }catch(e){status?.('error',e.message);timer=setTimeout(open,5000)}
 }
 open();return ()=>{active=false;clearTimeout(timer);if(ws){ws.onclose=null;ws.close()}};
}
window.TSRB_CHAT_BRIDGE=Object.freeze({parse,connect});
})();