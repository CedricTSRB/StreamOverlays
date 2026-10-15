const {app,BrowserWindow,shell}=require('electron');
const path=require('path');
app.whenReady().then(()=>{const win=new BrowserWindow({width:1120,height:780,minWidth:760,minHeight:540,backgroundColor:'#10131d',webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true}});win.removeMenu();win.loadFile(path.join(__dirname,'index.html'));win.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))shell.openExternal(url);return {action:'deny'}});});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});