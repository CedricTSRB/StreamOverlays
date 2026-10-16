/* Goal Overlays. 100% statische Client-App; keine Twitch-Verbindung im Dashboard. */
(() => {
  'use strict';
  // The social overlay uses its own transparent renderer.
  if(new URLSearchParams(location.search).get('overlay')==='social')return;
  const KEY='subboost-studio-v1';
  const kinds=['subs','followers','timer'];
  const choices=['frame','cyber','pastel','arcade','sparkle','transparent','counter'];
  const fonts={sans:'Arial, Helvetica, sans-serif',mono:'Consolas, monospace',serif:'Georgia, serif',impact:'Impact, sans-serif'};
  const labels={subs:'Abo-Ziel',followers:'Follower-Ziel',timer:'Stream-Timer'};
  const createWidgets=()=>Object.fromEntries(kinds.map(kind=>[kind,{style:'frame',accent:'#7863ee',title:'STREAM GOALS',bgUrl:'',bgData:'',showLabel:true,showNumbers:true,showBar:true,showPercent:false,labelText:'',labelSize:12,numberSize:15,allSize:100,labelX:0,labelY:0,numberX:0,numberY:0,textColor:'',barColor:'',backgroundColor:'',cornerStyle:'default',boxWidth:440,boxHeight:100}]));
  const defaultState={style:'frame',accent:'#7863ee',title:'STREAM GOALS',subs:24,subsTarget:50,followers:128,followersTarget:200,durationMs:43200000,remainingMs:43200000,running:false,startedAt:null,bgUrl:'',bgData:'',selectedWidget:'subs',widgets:createWidgets()};
  const get=id=>document.getElementById(id);
  const clamp=(val,min,max)=>Math.min(max,Math.max(min,Number.isFinite(Number(val))?Number(val):min));
  function load(){
    try{
      const old=JSON.parse(localStorage.getItem('subboost-studio-v1'))||{};
      const d={...defaultState,...old};
      if(!old.widgets){
        let prior={};try{prior=JSON.parse(localStorage.getItem('subboost-studio-independent-widgets-v1'))||{}}catch(_){}
        const base={style:old.style||'frame',accent:old.accent||'#7863ee',title:old.title||'STREAM GOALS',bgUrl:old.bgUrl||'',bgData:old.bgData||''};
        d.widgets=Object.fromEntries(kinds.map(kind=>[kind,{...base,style:prior[kind]?.style||base.style,accent:prior[kind]?.accent||base.accent}]));
        if(prior.subs){if(prior.subs.current!==undefined)d.subs=prior.subs.current;if(prior.subs.target!==undefined)d.subsTarget=prior.subs.target}
        if(prior.followers){if(prior.followers.current!==undefined)d.followers=prior.followers.current;if(prior.followers.target!==undefined)d.followersTarget=prior.followers.target}
        if(prior.timer?.hours&&!old.running){d.durationMs=clamp(prior.timer.hours,1,240)*3600000;d.remainingMs=d.durationMs}
      }
      return d;
    }catch(_){return {...defaultState,widgets:createWidgets()}}
  }
  function normalize(obj){
    const d={...defaultState,...obj};
    d.style=choices.includes(d.style)?d.style:'frame';
    d.accent=/^#[a-f0-9]{6}$/i.test(d.accent)?d.accent:'#7863ee';
    d.title=String(d.title||'STREAM GOALS').slice(0,32);
    d.subs=clamp(d.subs,0,1000000);d.subsTarget=clamp(d.subsTarget,1,1000000);
    d.followers=clamp(d.followers,0,1000000);d.followersTarget=clamp(d.followersTarget,1,1000000);
    d.durationMs=clamp(d.durationMs,3600000,240*3600000);d.remainingMs=clamp(d.remainingMs,0,240*3600000);
    d.running=Boolean(d.running);d.startedAt=Number(d.startedAt)||null;
    d.selectedWidget=kinds.includes(d.selectedWidget)?d.selectedWidget:'subs';
    d.widgets=Object.fromEntries(kinds.map(kind=>{
      const w=d.widgets?.[kind]||{};
      return [kind,{style:choices.includes(w.style)?w.style:d.style,accent:(w.style==='counter'&&String(w.accent).toLowerCase()==='#4f9ed2')?'#9b88d3':(/^#[a-f0-9]{6}$/i.test(w.accent)?w.accent:d.accent),
        title:String(w.title??d.title).slice(0,32),bgUrl:String(w.bgUrl||d.bgUrl||'').slice(0,2048),bgData:String(w.bgData||'').slice(0,1250000),showLabel:w.showLabel!==false,showNumbers:w.showNumbers!==false,showBar:w.showBar!==false,showPercent:w.showPercent===true,labelText:String(w.labelText??'').slice(0,32),labelSize:clamp(w.labelSize??12,8,60),numberSize:clamp(w.numberSize??15,10,90),labelX:clamp(w.labelX??0,-250,250),labelY:clamp(w.labelY??0,-250,250),numberX:clamp(w.numberX??0,-250,250),numberY:clamp(w.numberY??0,-250,250),textColor:/^#[0-9a-f]{6}$/i.test(w.textColor||'')?w.textColor:'',barColor:/^#[0-9a-f]{6}$/i.test(w.barColor||'')?w.barColor:'',backgroundColor:/^#[0-9a-f]{6}$/i.test(w.backgroundColor||'')?w.backgroundColor:'',cornerStyle:['rounded','square'].includes(w.cornerStyle)?w.cornerStyle:'default',boxWidth:clamp(w.boxWidth??440,160,1200),boxHeight:clamp(w.boxHeight??100,65,600),allSize:clamp(w.allSize??100,50,300),fontFamily:fonts[w.fontFamily]?w.fontFamily:'sans',boxX:clamp(w.boxX??0,0,1200),boxY:clamp(w.boxY??0,0,800)}];
    }));
    return d;
  }
  let state=normalize(load());
  const params=new URLSearchParams(window.location.search),obsView=params.get('overlay');
  const overlayMode=['all','subs','followers','timer'].includes(obsView);
  const LIVE_API=String(window.STREAMOVERLAYS_LIVE_API||'').trim().replace(/\/+$/,'');
  const AUTH_KEY='streamoverlays:auth:v1';
  function currentLiveId(){
    if(overlayMode)return params.get('live')||'';
    try{
      const auth=JSON.parse(localStorage.getItem(AUTH_KEY)||'null');
      if(auth?.expiresAt && auth.expiresAt<Date.now())return '';
      return auth?.user?.overlay_id||'';
    }catch(_){return ''}
  }
  let liveData=null,liveError='';
  let liveId=currentLiveId();
  function liveReady(){return !!LIVE_API && /^[a-f0-9]{40}$/.test(liveId)}
  if(overlayMode){state=normalize({...defaultState,widgets:createWidgets()});try{const raw=new URLSearchParams(location.hash.slice(1)).get('config')||params.get('config');if(raw&&raw.length<4000000){const saved=JSON.parse(raw);state=normalize({...defaultState,...saved,bgData:'',widgets:{...createWidgets(),...saved.widgets}})}}catch(_){}}
  const widget=kind=>state.widgets[kind||state.selectedWidget];
  const safePct=(cur,total)=>Math.min(100,Math.max(0,Math.round(cur/Math.max(1,total)*100)));
  const fmt=(ms)=>{const s=Math.max(0,Math.ceil(ms/1000));const hrs=Math.floor(s/3600),m=Math.floor((s%3600)/60),ss=s%60;return `${String(hrs).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(ss).padStart(2,'0')}`};
  const currentTimer=()=>state.running&&state.startedAt?Math.max(0,state.remainingMs-(Date.now()-state.startedAt)):state.remainingMs;
  async function updateLiveCounts(){
    if(!liveReady())return;
    const requestId=liveId;
    try{
      const response=await fetch(LIVE_API+'/live/'+requestId,{cache:'no-store'});
      if(!response.ok)throw Error('HTTP '+response.status);
      const data=await response.json();
      if(requestId!==liveId)return;
      liveData=data;
      liveError='';
      if(data.followers!==null&&Number.isFinite(Number(data.followers)))state.followers=clamp(data.followers,0,1000000);
      if(data.subs!==null&&Number.isFinite(Number(data.subs)))state.subs=clamp(data.subs,0,1000000);
      render();
      const status=get('live-feed-status');
      if(status)status.textContent='Live-Daten von '+(data.channel||'Twitch')+(data.stale?' (letzter bekannter Stand)':'')+' · Aktualisierung ca. alle 30 Sekunden.';
    }catch(_){
      liveError='Twitch-Daten gerade nicht erreichbar';
      if(overlayMode)render();
      const status=get('live-feed-status');
      if(status)status.textContent=liveError+' – bestehende Werte bleiben erhalten.';
    }
  }
  function persist(){if(overlayMode)return;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){notify('Speicher voll: Bild bitte kleiner wählen.')}}
  function persistAndRender(){persist();render()}
  function timerText(){let ms=currentTimer();if(state.running&&ms===0){state.running=false;state.startedAt=null;state.remainingMs=0;persist()}return fmt(ms)}
  function stateText(){return state.running?'Timer läuft': currentTimer()<=0?'Zeit abgelaufen':currentTimer()===state.durationMs?'Bereit zum Starten':'Pausiert'}
  function renderOverlay(el){
    if(!el)return;
    const view=overlayMode?obsView:state.selectedWidget,all=view==='all',w=widget(all?'subs':view);
    el.className=all?'overlay-content mixed-mode':'overlay-content style-'+w.style;
    el.style.setProperty('--accent',w.accent);
    el.classList.toggle('has-custom-text',!!w.textColor);
    el.classList.toggle('has-custom-bar',!!w.barColor);
    el.classList.toggle('has-custom-bg',!!w.backgroundColor);
    el.querySelector('#preview-title').textContent=all?state.title:w.title;
    for(const kind of ['subs','followers']){
      const conf=widget(kind);
      const card=el.querySelector('.'+(kind==='subs'?'subs-card':'followers-card'));
      const count=kind==='subs'?state.subs:state.followers;
      const target=kind==='subs'?state.subsTarget:state.followersTarget;
      const pct=safePct(count,target);
      card.style.setProperty('width',(conf.boxWidth||440)+'px','important');
      card.style.setProperty('height',(conf.boxHeight||100)+'px','important');
      card.style.setProperty('min-height',(conf.boxHeight||100)+'px','important');
      card.style.setProperty('max-height',(conf.boxHeight||100)+'px','important');
      const numbers=card.querySelector('#preview-'+kind);
      const label=card.querySelector('.goal-label-text');
      const row=card.querySelector('.goal-top');
      const bar=card.querySelector('.bar');
      const percent=card.querySelector('.goal-percent');
      const name=conf.labelText.trim()||(conf.style==='counter'?(kind==='subs'?'SUBS:':'FOLLOWS:'):(kind==='subs'?'Abo-Ziel':'Follower-Ziel'));
      label.textContent=name;
      const labelBox=card.querySelector('.goal-label');
      labelBox.style.setProperty('font-size',(15*(conf.allSize||100)/100)+'px','important');
      labelBox.style.transform='';
      numbers.style.setProperty('font-size',(15*(conf.allSize||100)/100)+'px','important');
      card.style.zoom='';
      numbers.style.transform='';
      card.querySelector('.goal-label').hidden=!conf.showLabel;
      numbers.hidden=!conf.showNumbers;
      percent.hidden=!conf.showPercent;
      percent.textContent=pct+'%';
      bar.hidden=!conf.showBar;
      row.hidden=!conf.showLabel&&!conf.showNumbers&&!conf.showPercent;
      card.classList.toggle('numbers-only',!conf.showLabel);
      numbers.replaceChildren();
      numbers.append(document.createTextNode(count+' '));
      const small=document.createElement('small');
      small.textContent='/ '+target;
      small.style.fontSize='inherit';small.style.fontWeight='inherit';numbers.append(small);
      card.querySelector('#'+kind+'-progress').style.width=pct+'%';
    }
    if(overlayMode && params.get('live') && !liveData){
      if(widget('subs').showNumbers)el.querySelector('#preview-subs').textContent=liveError?'Offline':'Verbinde …';
      if(widget('followers').showNumbers)el.querySelector('#preview-followers').textContent=liveError?'Offline':'Verbinde …';
    }else if(liveData && liveData.subs===null){
      if(widget('subs').showNumbers)el.querySelector('#preview-subs').textContent='Nicht verfügbar';
      el.querySelector('#subs-progress').style.width='0%';
    }
    el.querySelector('#preview-timer').textContent=timerText();
    el.querySelector('#timer-state-label').textContent=stateText();
    for(const [kind,cls] of [['subs','subs-card'],['followers','followers-card'],['timer','timer-card']]){
      const card=el.querySelector('.'+cls),c=widget(kind);
      card.hidden=!all&&kind!==view;
      card.className='goal-card '+cls+' style-'+c.style+(c.showLabel?'':' label-off')+(c.showBar?'':' bar-off')+(c.cornerStyle==='rounded'?' corners-rounded':c.cornerStyle==='square'?' corners-square':'');
      card.style.setProperty('--accent',c.accent);
      card.style.setProperty('--text-size',(15*c.allSize/100)+'px');
      card.style.setProperty('--text-font',fonts[c.fontFamily]);
      card.style.setProperty('--text-x',c.labelX+'px');
      card.style.setProperty('--text-y',c.labelY+'px');
      card.style.marginLeft=c.boxX+'px';
      card.style.marginTop=c.boxY+'px';
      card.style.setProperty('width',c.boxWidth+'px','important');
      for(const prop of ['height','min-height','max-height'])card.style.setProperty(prop,c.boxHeight+'px','important');
      card.style.setProperty('--custom-text-color',c.textColor||'initial');
      card.style.setProperty('--custom-bar-color',c.barColor||c.accent);
      card.style.setProperty('--custom-bg-color',c.backgroundColor||'transparent');
      card.classList.toggle('has-custom-text',!!c.textColor);
      card.classList.toggle('has-custom-bar',!!c.barColor);
      card.classList.toggle('has-custom-bg',!!c.backgroundColor);
      const bg=c.bgUrl||c.bgData;
      card.style.backgroundImage=c.style==='image'&&bg?`linear-gradient(#12203255,#12203255),url(${JSON.stringify(bg)})`:'';
    }
    const bg=w.bgUrl||w.bgData;
    el.style.backgroundImage='';
    el.querySelector('.preview-heading').hidden=!all;
    if(!overlayMode){syncGeometryFields();fitPreview();}
  }
  function render(){
    if(overlayMode){renderOverlay(get('obs-content')?.querySelector('.overlay-content'));return}
    renderOverlay(get('overlay-preview'));
    get('sum-subs').innerHTML=`${state.subs} <span>/ ${state.subsTarget}</span>`;
    get('sum-followers').innerHTML=`${state.followers} <span>/ ${state.followersTarget}</span>`;
    get('sum-subs-line').style.width=safePct(state.subs,state.subsTarget)+'%';
    get('sum-followers-line').style.width=safePct(state.followers,state.followersTarget)+'%';
    get('sum-timer').textContent=timerText();get('timer-control-display').textContent=timerText();
    get('sum-timer-status').textContent=stateText();
    get('sum-timer-line').style.width=(100-Math.round(currentTimer()/Math.max(1,state.durationMs)*100))+'%';
    get('timer-toggle').textContent=state.running?'Ⅱ Timer pausieren':currentTimer()===0?'↺ Neu starten':'▶ Timer '+(currentTimer()===state.durationMs?'starten':'fortsetzen');
    const selected=state.selectedWidget,w=widget();
    document.querySelectorAll('[data-widget]').forEach(button=>{
      const active=button.dataset.widget===selected;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));
    });
    get('subs-settings-row').hidden=selected!=='subs';get('followers-settings-row').hidden=selected!=='followers';
    get('goal-counter-settings').hidden=selected==='timer';get('timer-settings').hidden=selected!=='timer';get('goals-divider').hidden=true;
    get('active-preview-label').textContent='· '+labels[selected];
    get('active-design-label').textContent='· '+labels[selected];
    document.querySelectorAll('[data-style]').forEach(tile=>{tile.classList.toggle('selected',tile.dataset.style===w.style);tile.setAttribute('aria-pressed',String(tile.dataset.style===w.style))});
    document.querySelectorAll('[data-hours]').forEach(b=>b.classList.toggle('active',!state.running&&state.durationMs===Number(b.dataset.hours)*3600000));
    get('hex-label').textContent=w.accent.toUpperCase();
    get('overlay-bar-color').value=w.barColor||w.accent;
    const shape=w.cornerStyle==='square'?'square':w.cornerStyle==='rounded'?'rounded':w.style==='frame'||w.style==='sparkle'?'square':'rounded';
    document.querySelectorAll('[data-corner-style]').forEach(button=>{const active=button.dataset.cornerStyle===shape;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active))});
    if(get('counter-display-settings'))get('counter-display-settings').hidden=selected==='timer';
    const copyLabel=get('copy-overlay-all');if(copyLabel.firstChild)copyLabel.firstChild.textContent='Speichern & OBS-Link kopieren ';
  }
  function fitPreview(){
    const el=get('overlay-preview'),area=el.parentElement;
    el.style.zoom=String(Math.min(1,Math.max(.1,(area.clientWidth-48)/Math.max(1,el.offsetWidth))));
  }
  function syncGeometryFields(){
    const w=widget();
    for(const [id,prop] of [['text-x','labelX'],['text-y','labelY'],['box-width','boxWidth'],['box-height','boxHeight'],['box-x','boxX'],['box-y','boxY']]){
      if(document.activeElement!==get(id))get(id).value=w[prop];
    }
  }
  function syncFields(){
    const w=widget();
    for(const [id,v] of [['subs-current',state.subs],['subs-target',state.subsTarget],['followers-current',state.followers],['followers-target',state.followersTarget],['label-name',w.title],['accent',w.accent]]){
      const el=get(id);if(el)el.value=v;
    }
    get('font-family').value=w.fontFamily;
    syncGeometryFields();
    get('custom-hours').value=String(state.durationMs/3600000);
    for(const [id,prop] of [['counter-show-label','showLabel'],['counter-show-numbers','showNumbers'],['counter-show-bar','showBar'],['counter-show-percent','showPercent']])get(id).checked=w[prop];
    get('counter-label-text').value=w.labelText;
    get('all-size').value=w.allSize||100;get('all-size-value').textContent=(w.allSize||100)+' %';
    get('counter-label-text').placeholder=state.selectedWidget==='followers'?'z. B. FOLLOWS:':'z. B. SUBS:';
    for(const [id,output,prop,fallback] of [['overlay-text-color','overlay-text-color-value','textColor','#ffffff'],['overlay-bar-color','overlay-bar-color-value','barColor',w.accent],['overlay-bg-color','overlay-bg-color-value','backgroundColor','#13172a']]){
      get(id).value=w[prop]||fallback;
      get(output).textContent=w[prop]?w[prop].toUpperCase():'Standard';
    }
  }
  function selectWidget(kind){
    if(!kinds.includes(kind))return;
    state.selectedWidget=kind;persist();syncFields();render();
  }
  function changeNum(id,prop,min){get(id).addEventListener('input',ev=>{state[prop]=clamp(ev.target.value,min,1000000);persistAndRender()})}
  function chooseDuration(hours){if(state.running){notify('Timer zuerst pausieren, um die Dauer zu ändern.');return}const ms=clamp(hours,1,240)*3600000;state.durationMs=ms;state.remainingMs=ms;state.startedAt=null;persistAndRender()}
  function toggleTimer(){if(state.running){state.remainingMs=currentTimer();state.running=false;state.startedAt=null}else{if(state.remainingMs<=0)state.remainingMs=state.durationMs;state.running=true;state.startedAt=Date.now()}persistAndRender()}
  function resetTimer(){state.running=false;state.startedAt=null;state.remainingMs=state.durationMs;persistAndRender()}
  let toastTimeout;function notify(message){let el=get('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3200)}
  function linkFor(view){
    persist();
    const widgets=Object.fromEntries(kinds.map(k=>[k,{...widget(k),bgData:view==='all'||view===k?widget(k).bgData:''}]));
    const obj={...state,widgets,bgData:'',remainingMs:currentTimer(),startedAt:state.running?Date.now():null};
    if(!/^https?:$/i.test(location.protocol))notify('Für OBS-Link zuerst auf GitHub Pages veröffentlichen.');
    const url=new URL(window.location.href);url.search='';url.hash='';
    url.searchParams.set('overlay',view);url.hash=new URLSearchParams({config:JSON.stringify(obj)}).toString();
    const id=currentLiveId();
    if(LIVE_API && /^[a-f0-9]{40}$/.test(id) && ['subs','followers','all'].includes(view))url.searchParams.set('live',id);
    return url.toString();
  }
  async function copy(view){const url=linkFor(view);try{await navigator.clipboard.writeText(url);notify('Gespeichert. OBS-Link kopiert – Browser-Quelle: 1920 × 1080.')}catch(_){window.prompt('Diesen OBS-Link kopieren:',url)}}
  if(overlayMode){document.body.classList.add('obs-mode');get('obs-overlay-root').hidden=false;get('obs-overlay-root').dataset.view=obsView;get('obs-overlay-root').classList.toggle('has-timer',['all','timer'].includes(obsView));const cloned=get('overlay-preview').cloneNode(true);cloned.style.zoom='';get('obs-content').appendChild(cloned);const s=document.createElement('style');s.textContent=obsView==='subs'?'.obs-root .followers-card,.obs-root .timer-card,.obs-root .preview-heading{display:none}':obsView==='followers'?'.obs-root .subs-card,.obs-root .timer-card,.obs-root .preview-heading{display:none}':obsView==='timer'?'.obs-root .subs-card,.obs-root .followers-card,.obs-root .preview-heading{display:none}':'';document.head.appendChild(s);get('obs-start-pause').addEventListener('click',toggleTimer);get('obs-reset').addEventListener('click',resetTimer);render();setInterval(render,300);if(liveReady()){updateLiveCounts();setInterval(updateLiveCounts,30000)}return}
  syncFields();
  new ResizeObserver(fitPreview).observe(get('overlay-preview').parentElement);
  document.querySelectorAll('[data-widget]').forEach(el=>el.addEventListener('click',()=>selectWidget(el.dataset.widget)));document.querySelectorAll('[data-style]').forEach(el=>el.addEventListener('click',()=>{const w=widget();w.style=el.dataset.style;if(w.style==='counter'&&['#7863ee','#4f9ed2'].includes(w.accent.toLowerCase()))w.accent='#9b88d3';syncFields();persistAndRender()}));changeNum('subs-current','subs',0);changeNum('subs-target','subsTarget',1);changeNum('followers-current','followers',0);changeNum('followers-target','followersTarget',1);
  get('test-sub').addEventListener('click',()=>{state.subs=Math.min(1000000,state.subs+1);get('subs-current').value=state.subs;persistAndRender()});get('test-follower').addEventListener('click',()=>{state.followers=Math.min(1000000,state.followers+1);get('followers-current').value=state.followers;persistAndRender()});
  get('accent').addEventListener('input',ev=>{widget().accent=ev.target.value;get('hex-label').textContent=ev.target.value.toUpperCase();if(!widget().barColor)get('overlay-bar-color').value=ev.target.value;persistAndRender()});get('label-name').addEventListener('input',ev=>{widget().title=ev.target.value;state.title=ev.target.value;persistAndRender()});
  for(const [id,prop] of [['counter-show-label','showLabel'],['counter-show-numbers','showNumbers'],['counter-show-bar','showBar'],['counter-show-percent','showPercent']])get(id).addEventListener('change',ev=>{widget()[prop]=ev.target.checked;persistAndRender()});
  get('all-size').addEventListener('input',ev=>{widget().allSize=Number(ev.target.value);get('all-size-value').textContent=ev.target.value+' %';persistAndRender()});
  get('reset-text-position').addEventListener('click',()=>{Object.assign(widget(),{labelX:0,labelY:0,numberX:0,numberY:0});persistAndRender()});
  // Editor-only corner grip; OBS output never gets a resize handle.
  if(!new URLSearchParams(location.search).has('overlay')){
    for(const kind of kinds){const card=get('overlay-preview')?.querySelector('.'+kind+'-card');if(card){const grip=document.createElement('span');grip.className='tsrb-resize-grip';grip.title='Overlay-Größe durch Ziehen ändern';grip.setAttribute('aria-label','Overlay-Größe ändern');card.appendChild(grip)}}
  }
  let resizeDrag=null;
  const resizePreview=get('overlay-preview');
  resizePreview.addEventListener('pointerdown',ev=>{
    const grip=ev.target.closest('.tsrb-resize-grip');
    if(!grip||ev.button!==0)return;
    const card=grip.closest('.goal-card');
    const kind=kinds.find(key=>card?.classList.contains(key+'-card'));
    if(!kind||kind!==state.selectedWidget)return;
    const w=widget(kind);
    const scale=resizePreview.getBoundingClientRect().width/Math.max(1,resizePreview.offsetWidth);
    resizeDrag={kind,pointerId:ev.pointerId,x:ev.clientX,y:ev.clientY,width:w.boxWidth,height:w.boxHeight,scale:scale||1};
    resizePreview.setPointerCapture(ev.pointerId);
    ev.preventDefault();ev.stopPropagation();
  });
  resizePreview.addEventListener('pointermove',ev=>{
    if(!resizeDrag||ev.pointerId!==resizeDrag.pointerId)return;
    const w=widget(resizeDrag.kind);
    w.boxWidth=clamp(Math.round(resizeDrag.width+(ev.clientX-resizeDrag.x)/resizeDrag.scale),160,1200);
    w.boxHeight=clamp(Math.round(resizeDrag.height+(ev.clientY-resizeDrag.y)/resizeDrag.scale),65,600);
    render();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])resizePreview.addEventListener(type,ev=>{
    if(!resizeDrag||ev.pointerId!==resizeDrag.pointerId)return;
    resizeDrag=null;
    persist();
    if(resizePreview.hasPointerCapture(ev.pointerId))resizePreview.releasePointerCapture(ev.pointerId);
  });
  let drag=null;
  const preview=get('overlay-preview');
  preview.addEventListener('pointerdown',ev=>{
    const target=ev.target.closest('.goal-top,.timer-card-content');
    if(!target||ev.button!==0||resizeDrag)return;
    const card=target.closest('.goal-card'),kind=kinds.find(k=>card.classList.contains(k+'-card'));
    if(kind!==state.selectedWidget)return;
    const w=widget(kind);
    drag={kind,id:ev.pointerId,x:ev.clientX,y:ev.clientY,startX:w.labelX,startY:w.labelY};
    preview.setPointerCapture(ev.pointerId);ev.preventDefault();
  });
  preview.addEventListener('pointermove',ev=>{
    if(!drag||ev.pointerId!==drag.id)return;
    const scale=preview.getBoundingClientRect().width/Math.max(1,preview.offsetWidth),w=widget(drag.kind);
    w.labelX=Math.round(clamp(drag.startX+(ev.clientX-drag.x)/scale,-250,250));
    w.labelY=Math.round(clamp(drag.startY+(ev.clientY-drag.y)/scale,-250,250));
    render();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])preview.addEventListener(type,ev=>{
    if(!drag||ev.pointerId!==drag.id)return;
    drag=null;persist();
    if(preview.hasPointerCapture(ev.pointerId))preview.releasePointerCapture(ev.pointerId);
  });
  get('font-family').addEventListener('change',ev=>{widget().fontFamily=ev.target.value;persistAndRender()});
  for(const [id,prop,min,max] of [['text-x','labelX',-250,250],['text-y','labelY',-250,250],['box-width','boxWidth',160,1200],['box-height','boxHeight',65,600],['box-x','boxX',0,1200],['box-y','boxY',0,800]]){
    get(id).addEventListener('input',ev=>{if(ev.target.value==='')return;widget()[prop]=clamp(ev.target.value,min,max);persistAndRender()});
    get(id).addEventListener('change',()=>{get(id).value=widget()[prop]});
  }
  get('counter-label-text').addEventListener('input',ev=>{widget().labelText=ev.target.value.slice(0,32);persistAndRender()});
  for(const [id,output,prop] of [['overlay-text-color','overlay-text-color-value','textColor'],['overlay-bar-color','overlay-bar-color-value','barColor'],['overlay-bg-color','overlay-bg-color-value','backgroundColor']])get(id).addEventListener('input',ev=>{widget()[prop]=ev.target.value;get(output).textContent=ev.target.value.toUpperCase();persistAndRender()});
  document.querySelectorAll('[data-reset-color]').forEach(button=>button.addEventListener('click',()=>{widget()[button.dataset.resetColor]='';syncFields();persistAndRender()}));
  document.querySelectorAll('[data-corner-style]').forEach(button=>button.addEventListener('click',()=>{widget().cornerStyle=button.dataset.cornerStyle;syncFields();persistAndRender()}));
  get('timer-toggle').addEventListener('click',toggleTimer);get('timer-reset').addEventListener('click',resetTimer);document.querySelectorAll('[data-hours]').forEach(b=>b.addEventListener('click',()=>chooseDuration(b.dataset.hours)));get('custom-hours').addEventListener('change',ev=>{if(Number(ev.target.value)>0)chooseDuration(ev.target.value)});
  get('copy-overlay-all').addEventListener('click',()=>copy(state.selectedWidget));for(const [id,view] of [['copy-all','all'],['copy-subs','subs'],['copy-followers','followers'],['copy-timer','timer']])get(id).addEventListener('click',()=>copy(view));get('open-preview').addEventListener('click',()=>window.open(linkFor(state.selectedWidget),'_blank','noopener,noreferrer'));
  get('reset-all').addEventListener('click',()=>{if(window.confirm('Alle lokalen Einstellungen zurücksetzen?')){state=normalize({...defaultState,widgets:createWidgets()});try{localStorage.removeItem('subboost-studio-independent-widgets-v1')}catch(_){}persist();syncFields();render();notify('Einstellungen zurückgesetzt.')}});render();setInterval(render,300);
  if(liveReady()) {updateLiveCounts();setInterval(updateLiveCounts,30000)}
  window.addEventListener('streamoverlays:auth',event=>{
    liveId=event.detail?.user?.overlay_id||'';
    liveData=null;liveError='';
    if(liveReady())updateLiveCounts();
    else {
      const status=get('live-feed-status');
      if(status)status.textContent='Live-Tracking nicht verbunden.';
    }
  });
})();
