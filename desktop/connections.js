'use strict';
const EventEmitter=require('node:events');
const {parseTarget,parseIrc,fromYoutube,fromTikTok,fromKick,PLATFORMS}=require('./core');
function createConnectionManager(deps={}){
 const emitter=new EventEmitter(),instances=new Map(),states=new Map();
 const emit=(type,payload)=>emitter.emit('event',{type,...payload});
 function publish(platform,state,detail=''){states.set(platform,{state,detail});emit('status',{platform,state,detail})}
 function message(value){if(value?.text)emit('message',{message:value})}
 function stop(platform){const active=instances.get(platform);if(active){instances.delete(platform);try{active.close?.()}catch(_){}}publish(platform,'disconnected')}
 function connect(platform,input){
  if(!Object.hasOwn(PLATFORMS,platform))throw Error('Unbekannte Plattform');
  const target=parseTarget(platform,input);
  stop(platform);
  if(PLATFORMS[platform].mode==='browser'){publish(platform,'browser','Plattform im Browser öffnen – kein direkter Chat-Import verfügbar');return {state:'browser',target}}
  publish(platform,'connecting','Verbindung wird aufgebaut …');
  let cancelled=false;
  const cleanups=[];const close=()=>{cancelled=true;for(const fn of cleanups)try{fn()}catch(_){}};
  instances.set(platform,{close,target});
  const active=()=>!cancelled&&instances.get(platform)?.close===close;
  function fail(error){if(active())publish(platform,'error',String(error?.message||error).slice(0,250))}
  if(platform==='twitch'){
   let ws;let interval;
   try{
    const WebSocket=deps.WebSocket||require('ws');
    const name=target.channel;ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    cleanups.push(()=>{clearInterval(interval);ws?.removeAllListeners?.();ws?.terminate?.()});
    const send=text=>{if(ws?.readyState===WebSocket.OPEN)ws.send(text)};
    ws.on('open',()=>{if(!active())return;send('CAP REQ :twitch.tv/tags twitch.tv/commands');send('NICK justinfan'+Math.floor(Math.random()*900000+100000));send('JOIN #'+name);publish(platform,'connected','Lesezugriff auf #'+name);interval=setInterval(()=>send('PING :tsrb'),60000)});
    ws.on('message',raw=>{if(!active())return;for(const line of String(raw).split(/\r?\n/)){
      if(line.startsWith('PING ')){send(line.replace('PING ','PONG '));continue}
      const chat=parseIrc(line);if(chat)message(chat);
      if(/Login authentication failed|Improperly formatted auth/.test(line))fail('Anonymer IRC-Login abgelehnt');
      if(/ NOTICE /.test(line)&&/Cannot join|banned|suspended/i.test(line))fail(line.slice(-180));
    }});
    ws.on('error',fail);ws.on('close',()=>{if(active())publish(platform,'disconnected','Twitch-Verbindung geschlossen')});
   }catch(e){fail(e)}return {state:'connecting',target};
  }
  if(platform==='tiktok'){
   (async()=>{try{
    const connector=deps.tiktok||await import('tiktok-live-connector');
    const Tiktok=connector.TikTokLiveConnection||connector.default?.TikTokLiveConnection;
    if(!Tiktok)throw Error('TikTok-Connector nicht verfügbar');
    // TikTok-Live-Connector v2.5 requires an explicit options object.
    // Passing only the username throws while reading options.processInitialData.
    const conn=new Tiktok(target.channel,{
     processInitialData:true,
     fetchRoomInfoOnConnect:true,
     enableExtendedGiftInfo:false,
     authenticateWs:false,
     useMobile:false
    });cleanups.push(()=>conn.disconnect?.());
    conn.on('chat',data=>{if(active())message(fromTikTok(data))});
    conn.on('disconnected',()=>{if(active())publish(platform,'disconnected','TikTok LIVE getrennt')});
    conn.on('error',error=>fail(error?.exception||error));
    await conn.connect();
    if(active())publish(platform,'connected','TikTok LIVE '+target.channel+' verbunden');
   }catch(e){fail(e)}})();return {state:'connecting',target};
  }
  if(platform==='youtube'){
   (async()=>{try{
    const connector=deps.youtube||require('youtube-chat');const LiveChat=connector.LiveChat||connector.default?.LiveChat;
    if(!LiveChat)throw Error('YouTube-Connector nicht verfügbar');
    if(target.handle)throw Error('Bitte den aktuellen YouTube-Live-Link oder eine Kanal-ID (UC…) verwenden; @Handle wird hier nicht automatisch aufgelöst.');
    const live=new LiveChat(target.liveId?{liveId:target.liveId}:{channelId:target.channelId});
    cleanups.push(()=>live.stop?.());
    live.on('chat',c=>{if(active())message(fromYoutube(c))});
    live.on('error',fail);
    const ok=await live.start();
    if(!ok)throw Error('Kein aktiver öffentlicher YouTube-Livechat gefunden');
    if(active())publish(platform,'connected','YouTube Livechat verbunden');
   }catch(e){fail(e)}})();return {state:'connecting',target};
  }
  if(platform==='kick'){
   (async()=>{try{
    const connector=deps.kick||await import('kick-live-connector');
    const Kick=connector.KickConnection||connector.default?.KickConnection;
    const Events=connector.Events||connector.default?.Events;
    if(!Kick)throw Error('Kick-Connector nicht verfügbar');
    const kick=new Kick(target.channel);cleanups.push(()=>kick.disconnect?.());
    kick.on(Events?.ChatMessage||'ChatMessage',c=>{if(active())message(fromKick(c))});
    kick.on('error',fail);
    await kick.connect();
    if(active())publish(platform,'connected','Kick-Chat '+target.channel+' verbunden');
   }catch(e){fail(e)}})();return {state:'connecting',target};
  }
 }
 return {connect,stop,onEvent:fn=>{emitter.on('event',fn);return ()=>emitter.off('event',fn)},getStatus:()=>Object.fromEntries(states),closeAll:()=>{for(const p of [...instances.keys()])stop(p)}};
}
module.exports={createConnectionManager};
