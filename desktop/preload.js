'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const permitted=new Set(['twitch','tiktok','kick','youtube','facebook','instagram']);
contextBridge.exposeInMainWorld('tsrb',Object.freeze({
 platforms:Object.freeze(['twitch','tiktok','kick','youtube','facebook','instagram']),
 connect:(id,target)=>permitted.has(id)?ipcRenderer.invoke('chat:connect',id,String(target||'')):Promise.reject(Error('Unknown platform')),
 disconnect:id=>permitted.has(id)?ipcRenderer.invoke('chat:disconnect',id):Promise.reject(Error('Unknown platform')),
 snapshot:()=>ipcRenderer.invoke('chat:snapshot'),
 open:(id,target)=>permitted.has(id)?ipcRenderer.invoke('chat:open',id,String(target||'')):Promise.reject(Error('Unknown platform')),
 mini:()=>ipcRenderer.invoke('chat:mini'),
 preview:()=>ipcRenderer.invoke('chat:preview'),
 closeMini:()=>ipcRenderer.invoke('chat:close-mini'),
 clear:()=>ipcRenderer.invoke('chat:clear'),
 onEvent:callback=>{if(typeof callback!=='function')return ()=>{};const handler=(_,event)=>callback(event);ipcRenderer.on('multichat:event',handler);return ()=>ipcRenderer.removeListener('multichat:event',handler)}
}));
