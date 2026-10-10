/* StreamOverlays Live API — Cloudflare Worker with D1.
   Twitch client credentials & TOKEN_KEY_BASE64 must be Worker secrets, NEVER Github files.
   Scope: total followers / active subscribers. Values refresh at most once every 30s.
*/
const SCOPES='moderator:read:followers channel:read:subscriptions';
const now=()=>Date.now();
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
const hash=async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,'0')).join('');
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
const bad=(message,status=400)=>json({error:message},status);
const site=(env)=>new URL(env.SITE_URL);
const workerOrigin=(env)=>new URL(env.CALLBACK_URL).origin;
const secureCookie=(value,maxAge)=>'so_state='+value+'; Path=/auth; HttpOnly; Secure; SameSite=Lax; Max-Age='+maxAge;
function cors(request,response,env){
  const origin=request.headers.get('Origin');
  if(origin && origin===site(env).origin){
    const h=new Headers(response.headers);
    h.set('Access-Control-Allow-Origin',origin);
    h.set('Vary','Origin');
    h.set('Access-Control-Allow-Headers','Authorization, Content-Type');
    h.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');
    return new Response(response.body,{status:response.status,headers:h});
  }
  return response;
}
function requireOrigin(req,env){
  return req.headers.get('Origin')===site(env).origin;
}
function oauthUrl(env,state){
  const u=new URL('https://id.twitch.tv/oauth2/authorize');
  u.searchParams.set('response_type','code');
  u.searchParams.set('client_id',env.TWITCH_CLIENT_ID);
  u.searchParams.set('redirect_uri',env.CALLBACK_URL);
  u.searchParams.set('scope',SCOPES);
  u.searchParams.set('state',state);
  return u.toString();
}
async function twitchToken(env,parameters){
  const r=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:env.TWITCH_CLIENT_ID,client_secret:env.TWITCH_CLIENT_SECRET,...parameters})});
  if(!r.ok)throw new Error('Twitch OAuth konnte nicht abgeschlossen werden');
  const body=await r.json();
  if(!body.access_token || !body.refresh_token)throw new Error('Twitch-Tokens unvollständig');
  return body;
}
async function encryptionKey(env){
  const raw=Uint8Array.from(atob(env.TOKEN_KEY_BASE64),c=>c.charCodeAt(0));
  if(raw.length!==32)throw new Error('TOKEN_KEY_BASE64 muss 32 Bytes enthalten');
  return crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
}
async function encrypt(env,text){
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const enc=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await encryptionKey(env),new TextEncoder().encode(text)));
  const result=new Uint8Array(iv.length+enc.length);result.set(iv);result.set(enc,iv.length);
  return btoa(String.fromCharCode(...result));
}
async function decrypt(env,text){
  const input=Uint8Array.from(atob(text),c=>c.charCodeAt(0));
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:input.slice(0,12)},await encryptionKey(env),input.slice(12));
  return new TextDecoder().decode(plain);
}
async function helix(path,token,env){
  return fetch('https://api.twitch.tv/helix/'+path,{headers:{Authorization:'Bearer '+token,'Client-Id':env.TWITCH_CLIENT_ID}});
}
async function session(req,env){
  const auth=req.headers.get('Authorization')||'';
  if(!/^Bearer [a-f0-9]{64}$/.test(auth))return null;
  const key=await hash(auth.slice(7));
  return env.DB.prepare('SELECT users.user_id, users.display_name, users.overlay_id FROM sessions INNER JOIN users ON users.user_id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(key,now()).first();
}
async function callback(req,env,url){
  const queryState=url.searchParams.get('state')||'';
  const cookie=(req.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('so_state='))?.slice(9)||'';
  if(!queryState || !cookie || queryState!==cookie || !/^[a-f0-9]{64}$/.test(queryState))return bad('Ungültiger Anmeldestatus',403);
  const error=url.searchParams.get('error');
  if(error)return bad('Anmeldung bei Twitch abgebrochen');
  const code=url.searchParams.get('code');
  if(!code)return bad('Kein Twitch-Autorisierungscode');
  const tokens=await twitchToken(env,{grant_type:'authorization_code',code,redirect_uri:env.CALLBACK_URL});
  const response=await helix('users',tokens.access_token,env);
  if(!response.ok)return bad('Twitch-Profil konnte nicht gelesen werden',502);
  const user=(await response.json()).data?.[0];
  if(!user?.id)return bad('Twitch-Profil fehlt',502);
  const current=await env.DB.prepare('SELECT overlay_id FROM users WHERE user_id=?').bind(user.id).first();
  const overlayId=current?.overlay_id||random().slice(0,40);
  const access=await encrypt(env,tokens.access_token),refresh=await encrypt(env,tokens.refresh_token);
  await env.DB.prepare('INSERT INTO users(user_id,display_name,overlay_id,access_enc,refresh_enc,expires_at) VALUES(?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name,access_enc=excluded.access_enc,refresh_enc=excluded.refresh_enc,expires_at=excluded.expires_at')
    .bind(user.id,user.display_name||user.login,overlayId,access,refresh,now()+tokens.expires_in*1000).run();
  const ticket=random();
  await env.DB.prepare('INSERT INTO tickets(ticket_hash,user_id,expires_at) VALUES(?,?,?)').bind(await hash(ticket),user.id,now()+300000).run();
  const dest=site(env);dest.searchParams.set('twitch_ticket',ticket);dest.hash='studio';
  return new Response(null,{status:302,headers:{Location:dest.toString(),'Set-Cookie':secureCookie('',0),'Cache-Control':'no-store','Referrer-Policy':'no-referrer'}});
}
async function exchange(req,env){
  if(!requireOrigin(req,env))return bad('Unerlaubter Ursprung',403);
  const data=await req.json().catch(()=>null);
  if(!/^[a-f0-9]{64}$/.test(data?.ticket||''))return bad('Ungültiger Code');
  const consumed=await env.DB.prepare('DELETE FROM tickets WHERE ticket_hash=? AND expires_at>? RETURNING user_id').bind(await hash(data.ticket),now()).first();
  if(!consumed)return bad('Anmeldung abgelaufen. Bitte erneut verbinden.',403);
  const token=random();
  await env.DB.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await hash(token),consumed.user_id,now()+30*86400000).run();
  const user=await env.DB.prepare('SELECT user_id,display_name,overlay_id FROM users WHERE user_id=?').bind(consumed.user_id).first();
  return json({token,user,expiresIn:30*86400});
}
async function live(id,env){
  if(!/^[a-f0-9]{40}$/.test(id))return bad('Unbekanntes Overlay',404);
  let user=await env.DB.prepare('SELECT * FROM users WHERE overlay_id=?').bind(id).first();
  if(!user)return bad('Unbekanntes Overlay',404);
  if(user.cached_at && now()-user.cached_at<30000)return json({followers:user.followers,subs:user.subs,updatedAt:user.cached_at,channel:user.display_name});
  try{
    let token=await decrypt(env,user.access_enc);
    if(user.expires_at<now()+120000){
      const refreshed=await twitchToken(env,{grant_type:'refresh_token',refresh_token:await decrypt(env,user.refresh_enc)});
      token=refreshed.access_token;
      await env.DB.prepare('UPDATE users SET access_enc=?,refresh_enc=?,expires_at=? WHERE user_id=?')
        .bind(await encrypt(env,refreshed.access_token),await encrypt(env,refreshed.refresh_token),now()+refreshed.expires_in*1000,user.user_id).run();
    }
    const [f,s]=await Promise.all([
      helix('channels/followers?broadcaster_id='+encodeURIComponent(user.user_id)+'&first=1',token,env),
      helix('subscriptions?broadcaster_id='+encodeURIComponent(user.user_id)+'&first=1',token,env)
    ]);
    if(!f.ok)throw Error('Twitch-Follower nicht abrufbar: '+f.status);
    const follow=await f.json();
    const subscription=s.ok?await s.json():null;
    const followers=Number.isFinite(follow.total)?follow.total:null;
    const subs=subscription&&Number.isFinite(subscription.total)?subscription.total:null;
    await env.DB.prepare('UPDATE users SET followers=?,subs=?,cached_at=? WHERE user_id=?').bind(followers,subs,now(),user.user_id).run();
    return json({followers,subs,updatedAt:now(),channel:user.display_name,subsAvailable:s.ok});
  }catch(err){
    if(user.cached_at)return json({followers:user.followers,subs:user.subs,updatedAt:user.cached_at,channel:user.display_name,stale:true});
    return bad('Live-Daten gerade nicht verfügbar',503);
  }
}
export default {
  async fetch(req,env){
    try{
      if(!env.DB||!env.TWITCH_CLIENT_ID||!env.TWITCH_CLIENT_SECRET||!env.TOKEN_KEY_BASE64||!env.SITE_URL||!env.CALLBACK_URL)
        return bad('Backend ist noch nicht eingerichtet',503);
      const url=new URL(req.url);
      if(url.origin!==workerOrigin(env))return bad('Host stimmt nicht mit OAuth-Callback überein',403);
      if(req.method==='OPTIONS'){
        if(!requireOrigin(req,env))return bad('Unerlaubter Ursprung',403);
        return cors(req,new Response(null,{status:204}),env);
      }
      let result;
      if(req.method==='GET'&&url.pathname==='/auth/start'){
        const state=random();
        result=new Response(null,{status:302,headers:{Location:oauthUrl(env,state),'Set-Cookie':secureCookie(state,600),'Cache-Control':'no-store'}});
      }else if(req.method==='GET'&&url.pathname==='/auth/callback')result=await callback(req,env,url);
      else if(req.method==='POST'&&url.pathname==='/auth/exchange')result=await exchange(req,env);
      else if(req.method==='GET'&&url.pathname==='/auth/me'){
        if(!requireOrigin(req,env))result=bad('Unerlaubter Ursprung',403);
        else {
          const u=await session(req,env);
          result=u?json({user:u}):bad('Nicht angemeldet',401);
        }
      }else if(req.method==='POST'&&url.pathname==='/auth/logout'){
        if(!requireOrigin(req,env))result=bad('Unerlaubter Ursprung',403);
        else {
          const auth=req.headers.get('Authorization')||'';
          if(/^Bearer [a-f0-9]{64}$/.test(auth))await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(auth.slice(7))).run();
          result=json({ok:true});
        }
      }else if(req.method==='GET'&&url.pathname.startsWith('/live/'))result=await live(url.pathname.slice(6),env);
      else result=bad('Nicht gefunden',404);
      return cors(req,result,env);
    }catch(err){
      return cors(req,bad('Interner Fehler; Konfiguration und Logs prüfen',500),env);
    }
  }
};
