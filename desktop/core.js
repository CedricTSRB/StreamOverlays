'use strict';
const PLATFORMS=Object.freeze({
 twitch:{name:'Twitch',color:'#a970ff',mode:'live',hint:'Kanalname oder twitch.tv/…',icon:'◈'},
 tiktok:{name:'TikTok',color:'#44e2dc',mode:'live',hint:'@Benutzername oder TikTok-Live-Link',icon:'♪'},
 kick:{name:'Kick',color:'#51e27a',mode:'live',hint:'Kanalname oder kick.com/…',icon:'K'},
 youtube:{name:'YouTube',color:'#ff555d',mode:'live',hint:'YouTube-Live-Link, Kanal-ID oder @Handle',icon:'▶'},
 facebook:{name:'Facebook',color:'#619bff',mode:'browser',hint:'Facebook-Seite oder Live-Link',icon:'f'},
 instagram:{name:'Instagram',color:'#eb80c2',mode:'browser',hint:'Profilname oder Profil-Link',icon:'◎'}
});
function parseTarget(platform,input){
 if(!Object.hasOwn(PLATFORMS,platform))throw Error('Unbekannte Plattform');
 let raw=String(input||'').trim().slice(0,400);
 if(!raw)throw Error('Bitte einen Kanal oder Stream-Link eingeben');
 if(platform==='youtube'){
  if(/^https?:\/\//i.test(raw)){
   let u;try{u=new URL(raw)}catch{throw Error('Ungültiger YouTube-Link')}
   if(!/(^|\.)(youtube\.com|youtu\.be)$/.test(u.hostname.toLowerCase()))throw Error('Bitte einen YouTube-Link eingeben');
   let id=u.hostname.toLowerCase().endsWith('youtu.be')?u.pathname.slice(1):u.searchParams.get('v')||u.pathname.match(/^\/(?:live|embed|shorts)\/([\w-]{11})/)?.[1];
   if(id&&/^[\w-]{11}$/.test(id))return {liveId:id};
   const channelId=u.pathname.match(/\/channel\/(UC[\w-]{22})/)?.[1];
   if(channelId)return {channelId};
   const handle=u.pathname.match(/\/@([\w.-]{2,40})/)?.[1];
   if(handle)return {handle:'@'+handle};
   throw Error('Benötigt YouTube-Live-Link, Kanal-ID oder @Handle');
  }
  if(/^[\w-]{11}$/.test(raw))return {liveId:raw};
  if(/^UC[\w-]{22}$/.test(raw))return {channelId:raw};
  if(/^@[\w.-]{2,40}$/.test(raw))return {handle:raw};
  throw Error('Benötigt YouTube-Live-Link, Video-ID, Kanal-ID oder @Handle');
 }
 if(/^https?:\/\//i.test(raw)){
  let u;try{u=new URL(raw)}catch{throw Error('Ungültiger Link')}
  const domain=String(u.hostname).toLowerCase();
  const good={twitch:['twitch.tv'],kick:['kick.com'],tiktok:['tiktok.com'],facebook:['facebook.com','fb.watch'],instagram:['instagram.com']}[platform]||[];
  if(!good.some(d=>domain===d||domain.endsWith('.'+d)))throw Error('Link gehört nicht zur ausgewählten Plattform');
  if(platform==='tiktok'){raw=u.pathname.match(/\/@([\w.]{2,24})/)?.[1]||''}
  else if(platform==='facebook'){return {url:u.href}}
  else if(platform==='instagram'){raw=u.pathname.split('/').filter(Boolean)[0]||''}
  else raw=u.pathname.split('/').filter(Boolean)[0]||'';
 }
 raw=raw.replace(/^[@#]/,'');
 if(platform==='facebook')return {url:'https://www.facebook.com/'+encodeURIComponent(raw)};
 if(platform==='instagram'){if(!/^[\w.]{1,30}$/.test(raw))throw Error('Ungültiger Instagram-Name');return {url:'https://www.instagram.com/'+encodeURIComponent(raw)+'/'}}
 if(platform==='tiktok'&&!/^[\w.]{2,24}$/.test(raw))throw Error('Ungültiger TikTok-Name');
 if(platform==='twitch'&&!/^[a-z\d_]{3,25}$/i.test(raw))throw Error('Ungültiger Twitch-Kanal');
 if(platform==='kick'&&!/^[a-z\d_-]{2,40}$/i.test(raw))throw Error('Ungültiger Kick-Kanal');
 return {channel:raw.toLowerCase()}
}
function ircTags(prefix){
 const tags={};if(!prefix?.startsWith('@'))return tags;
 for(const pair of prefix.slice(1).split(';')){const i=pair.indexOf('=');if(i<0)continue;tags[pair.slice(0,i)]=pair.slice(i+1).replace(/\\s/g,' ').replace(/\\:/g,';').replace(/\\r/g,'\r').replace(/\\n/g,'\n').replace(/\\\\/g,'\\')}
 return tags;
}
function parseIrc(line){
 const m=String(line).match(/^(?:(@[^ ]+) )?:([^! ]+)![^ ]+ PRIVMSG #([^ ]+) :([\s\S]*)$/);
 if(!m)return null;
 const tags=ircTags(m[1]);
 return {platform:'twitch',user:tags['display-name']||m[2],text:m[4],id:tags.id||'',badges:tags.badges||'',channel:m[3],time:Date.now()};
}
function safeMessage(platform,user,text,extra={}){
 return {platform:String(platform).slice(0,20),user:String(user||'Unbekannt').slice(0,80),text:String(text||'').slice(0,3000),id:String(extra.id||'').slice(0,130),time:Number(extra.time)||Date.now(),badges:String(extra.badges||'').slice(0,150),channel:String(extra.channel||'').slice(0,90)};
}
function fromYoutube(chat){
 const text=Array.isArray(chat.message)?chat.message.map(c=>c.text||c.emojiText||c.alt||'').join(''):String(chat.message||'');
 return safeMessage('youtube',chat.author?.name||'YouTube',text,{id:chat.id,badges:chat.isModerator?'mod':chat.isOwner?'broadcaster':'',time:chat.timestamp&&new Date(chat.timestamp).getTime()});
}
function fromTikTok(data){
 const u=data.user||{};
 return safeMessage('tiktok',u.uniqueId||data.uniqueId||u.nickname||'TikTok',data.comment,{id:data.msgId||data.msgIdStr||'',badges:u.badges?'supporter':''});
}
function fromKick(data){
 const username=data.sender?.username||data.sender?.slug||data.user?.username||'Kick';
 const text=typeof data.content==='string'?data.content:data.message||'';
 return safeMessage('kick',username,text,{id:data.id||'',badges:data.sender?.identity?.badges?.map(x=>x.type).join(',')||''});
}
module.exports={PLATFORMS,parseTarget,parseIrc,safeMessage,fromYoutube,fromTikTok,fromKick};
