'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {parseTarget,parseIrc,fromTikTok,fromYoutube,fromKick}=require('../core');
const {createConnectionManager}=require('../connections');
test('safe platform names and target validation',()=>{
 assert.deepEqual(parseTarget('twitch','https://www.twitch.tv/Example_'),{channel:'example_'});
 assert.deepEqual(parseTarget('tiktok','https://www.tiktok.com/@Streamer123/live'),{channel:'streamer123'});
 assert.deepEqual(parseTarget('kick','https://kick.com/Gamer_1'),{channel:'gamer_1'});
 assert.deepEqual(parseTarget('youtube','https://www.youtube.com/live/AbCdEFgHi12'),{liveId:'AbCdEFgHi12'});
 assert.deepEqual(parseTarget('youtube','UC'+'a'.repeat(22)),{channelId:'UC'+'a'.repeat(22)});
 assert.deepEqual(parseTarget('youtube','@Streamer42'),{handle:'@Streamer42'});
 assert.throws(()=>parseTarget('tiktok','https://evil.test/@user'),/Link gehört/);
 assert.throws(()=>parseTarget('twitch','wrong channel!'),/Ungültiger/);
 assert.throws(()=>parseTarget('youtube','https://evil.test/v=AbCdEFgHi12'),/YouTube-Link/);
 assert.throws(()=>parseTarget('unknown','test'),/Unbekannte/);
});
test('IRC parser respects tags and user text',()=>{
 const m=parseIrc('@display-name=Test\\sUser;badges=moderator/1;id=abc :test!test@test PRIVMSG #channel :Hi <script>alert(1)</script>');
 assert.equal(m.user,'Test User');assert.equal(m.text,'Hi <script>alert(1)</script>');assert.equal(m.id,'abc');assert.equal(m.platform,'twitch');
 assert.equal(parseIrc(':server 001 test :hello'),null);
});
test('normalize YouTube TikTok Kick messages',()=>{
 assert.equal(fromTikTok({user:{uniqueId:'caster'},comment:'Hi TikTok'}).text,'Hi TikTok');
 assert.equal(fromYoutube({author:{name:'streamer'},message:[{text:'Hello '},{text:'YT'}]}).text,'Hello YT');
 assert.equal(fromKick({sender:{username:'kickmod'},content:'Hi Kick'}).user,'kickmod');
});
test('platform connector lifecycle with injection',async()=>{
 let active,disconnected=false;
 class FakeTikTok {
  constructor(name){assert.equal(name,'streamer');active=this}
  on(ev,fn){this[ev]=fn}
  async connect(){return {roomId:123}}
  disconnect(){disconnected=true}
 }
 const manager=createConnectionManager({tiktok:{TikTokLiveConnection:FakeTikTok}});
 const events=[];manager.onEvent(e=>events.push(e));
 const reply=manager.connect('tiktok','streamer');assert.equal(reply.state,'connecting');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(manager.getStatus().tiktok.state,'connected');
 active.chat({user:{uniqueId:'fan'},comment:'Test comment'});
 assert.equal(events.find(e=>e.type==='message').message.text,'Test comment');
 manager.stop('tiktok');assert.equal(disconnected,true);
 assert.equal(manager.getStatus().tiktok.state,'disconnected');
});
test('unavailable browser-only services are honest',()=>{
 const m=createConnectionManager();const v=m.connect('facebook','testpage');
 assert.equal(v.state,'browser');assert.equal(m.getStatus().facebook.state,'browser');
});
