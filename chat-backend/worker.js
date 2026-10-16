/* TSRB MultiChat configuration API.
 * Stores channel names and overlay design only. No platform passwords or provider tokens.
 * Editing requires an existing Twitch OAuth session from streamoverlays-live.
 * OBS receives read-only public settings by an unguessable 40-character overlay ID.
 */
const ORIGIN='https://cedrictsrb.github.io';
const DEFAULT_CONFIG={channels:{twitch:'',kick:'',tiktok:'',youtube:''},design:{theme:'glass',accent:'#ad8aff',fontSize:22,position:'bottom',maxMessages:7,showPlatform:true}};
const now=()=>Date.now();
function reply(body,status=200){
 return new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8',
 'Access-Control-Allow-Origin':ORIGIN,
 'Access-Control-Allow-Headers':'Authorization, Content-Type',
 'Access-Control-Allow-Methods':'GET,PUT,OPTIONS',
 'Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'no-referrer'
 }});
}
const fail=(reason,status=400)=>reply({error:reason},status);
function normalize(data){
 if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Ungültige Chat-Einstellungen');
 const channels=data.channels||{},design=data.design||{};
 if(typeof channels!=='object'||Array.isArray(channels)||typeof design!=='object'||Array.isArray(design))throw Error('Ungültige Felder');
 const result={channels:{},design:{}};
 const names={
  twitch:/^[a-zA-Z0-9_]{0,25}$/,
  kick:/^[a-zA-Z0-9_-]{0,40}$/,
  tiktok:/^[a-zA-Z0-9_.]{0,24}$/,
  youtube:/^[a-zA-Z0-9_@.\-]{0,60}$/
 };
 for(const [key,re] of Object.entries(names)){
  const name=String(channels[key]??'').trim().replace(/^@/,'');
  if(!re.test(name))throw Error('Ungültiger Kanalname: '+key);
  result.channels[key]=name.toLowerCase();
 }
 const allowed=['glass','minimal','neon'];
 result.design.theme=allowed.includes(design.theme)?design.theme:'glass';
 const color=String(design.accent??DEFAULT_CONFIG.design.accent);
 result.design.accent=/^#[0-9a-fA-F]{6}$/.test(color)?color:DEFAULT_CONFIG.design.accent;
 const size=Number(design.fontSize);
 result.design.fontSize=Number.isFinite(size)?Math.round(Math.min(38,Math.max(14,size))):22;
 result.design.position=['top','bottom'].includes(design.position)?design.position:'bottom';
 const count=Number(design.maxMessages);
 result.design.maxMessages=Number.isFinite(count)?Math.round(Math.min(15,Math.max(3,count))):7;
 result.design.showPlatform=design.showPlatform!==false;
 return result;
}
async function authorize(request,db){
 const value=request.headers.get('Authorization')||'';
 if(!/^Bearer [a-f0-9]{64}$/.test(value))return null;
 const token=value.slice(7);
 const hex=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');
 return db.prepare('SELECT users.user_id AS user_id, users.overlay_id AS overlay_id, users.display_name AS display_name FROM sessions INNER JOIN users ON sessions.user_id=users.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(hex,now()).first();
}
export default {
 async fetch(request,env){
  try{
   const url=new URL(request.url);
   if(request.method==='OPTIONS'){
    if(request.headers.get('Origin')!==ORIGIN)return fail('Origin nicht erlaubt',403);
    return new Response(null,{status:204,headers:{
     'Access-Control-Allow-Origin':ORIGIN,
     'Access-Control-Allow-Headers':'Authorization, Content-Type',
     'Access-Control-Allow-Methods':'GET,PUT,OPTIONS',
     'Access-Control-Max-Age':'300','Vary':'Origin'
    }});
   }
   if(request.method==='GET'&&url.pathname==='/health')return reply({ok:true,service:'streamoverlays-chat'});
   if(!env.DB)return fail('Datenbank nicht eingerichtet',503);
   const publicMatch=url.pathname.match(/^\/api\/config\/([a-f0-9]{40})$/);
   if(request.method==='GET'&&publicMatch){
    const row=await env.DB.prepare('SELECT config_json,updated_at FROM chat_configs WHERE overlay_id=?').bind(publicMatch[1]).first();
    if(!row)return fail('Noch keine Chat-Konfiguration gespeichert',404);
    return reply({config:JSON.parse(row.config_json),revision:row.updated_at});
   }
   if(url.pathname==='/api/me'&&['GET','PUT'].includes(request.method)){
    if(request.headers.get('Origin')!==ORIGIN)return fail('Origin nicht erlaubt',403);
    const user=await authorize(request,env.DB);
    if(!user)return fail('Bitte zuerst mit Twitch verbinden',401);
    if(request.method==='GET'){
     const row=await env.DB.prepare('SELECT config_json,updated_at FROM chat_configs WHERE overlay_id=? AND user_id=?').bind(user.overlay_id,user.user_id).first();
     return reply({overlayId:user.overlay_id,user:user.display_name,config:row?JSON.parse(row.config_json):DEFAULT_CONFIG,revision:row?.updated_at||0});
    }
    const length=Number(request.headers.get('Content-Length')||0);
    if(length>5000)return fail('Chat-Konfiguration zu groß',413);
    const raw=await request.text();
    if(raw.length>5000)return fail('Chat-Konfiguration zu groß',413);
    let input;
    try{input=JSON.parse(raw)}catch{return fail('Ungültige JSON-Daten');}
    let config;
    try{config=normalize(input)}catch(e){return fail(e.message)}
    const stamp=now();
    await env.DB.prepare(
     'INSERT INTO chat_configs (overlay_id,user_id,config_json,updated_at) VALUES (?,?,?,?) ON CONFLICT(overlay_id) DO UPDATE SET config_json=excluded.config_json,updated_at=excluded.updated_at WHERE chat_configs.user_id=excluded.user_id'
    ).bind(user.overlay_id,user.user_id,JSON.stringify(config),stamp).run();
    return reply({ok:true,overlayId:user.overlay_id,config,revision:stamp});
   }
   return fail('Nicht gefunden',404);
  }catch(err){
   console.log('MultiChat API:',String(err?.message||err).slice(0,180));
   return fail('Interner Fehler. Konfiguration überprüfen.',500);
  }
 }
};
