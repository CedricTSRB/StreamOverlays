'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const EventEmitter=require('node:events');
const {createConnectionManager}=require('../connections');

test('TikTok connection passes required v2.5 options, handles chat and disconnect',async()=>{
 let client;
 class TikTokLiveConnection extends EventEmitter{
  constructor(username,options){
   super();client=this;
   assert.equal(username,'some_creator');
   assert.deepEqual(options,{
    processInitialData:true,
    fetchRoomInfoOnConnect:true,
    enableExtendedGiftInfo:false,
    authenticateWs:false,
    useMobile:false
   });
  }
  async connect(){return {roomId:'123'};}
  disconnect(){this.didDisconnect=true;}
 }
 const manager=createConnectionManager({tiktok:{TikTokLiveConnection}});
 const events=[];manager.onEvent(event=>events.push(event));
 assert.equal(manager.connect('tiktok','@Some_Creator').state,'connecting');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(manager.getStatus().tiktok.state,'connected');
 client.emit('chat',{user:{uniqueId:'visitor'},comment:'Hallo zusammen!'});
 const chat=events.find(event=>event.type==='message');
 assert.equal(chat.message.platform,'tiktok');
 assert.equal(chat.message.user,'visitor');
 assert.equal(chat.message.text,'Hallo zusammen!');
 client.emit('error',{info:'Error while connecting',exception:new Error('Test: connection lost')});
 assert.equal(manager.getStatus().tiktok.state,'error');
 assert.equal(manager.getStatus().tiktok.detail,'Test: connection lost');
 manager.stop('tiktok');
 assert.equal(client.didDisconnect,true);
 assert.equal(manager.getStatus().tiktok.state,'disconnected');
});

test('TikTok connection surfaces offline errors without crashing the app',async()=>{
 class TikTokLiveConnection extends EventEmitter{
  async connect(){throw new Error('Streamer ist nicht LIVE');}
  disconnect(){}
 }
 const manager=createConnectionManager({tiktok:{TikTokLiveConnection}});
 const events=[];manager.onEvent(event=>events.push(event));
 assert.equal(manager.connect('tiktok','examplecreator').state,'connecting');
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(manager.getStatus().tiktok.state,'error');
 assert.match(manager.getStatus().tiktok.detail,/nicht LIVE/);
 assert.ok(events.some(event=>event.type==='status'&&event.state==='error'));
 manager.closeAll();
});
