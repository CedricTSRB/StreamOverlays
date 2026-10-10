
/* Fixed social-media stickers, with separate controls and a transparent OBS link. */
(function(){
  'use strict';
  const get=id=>document.getElementById(id);
  const platforms=[
    {id:'twitch',label:'Twitch',svg:'<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#9146FF" stroke="#111" stroke-width="1.9" stroke-linejoin="round" d="M5 2H29V21L22 28H16L12 31H9V27H3V9Z"/><path fill="#fff" d="M9 7H25V20L21 24H15L12 27V24H9Z"/><path fill="#9146FF" d="M14 11H17V19H14ZM20 11H23V19H20Z"/></svg>'},
    {id:'kick',label:'Kick',svg:'<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#53FC18" stroke="#111" stroke-width="2" stroke-linejoin="round" d="M4 4H15V13H18V8H28V17H23V20H28V29H18V24H15V29H4Z"/><path fill="#111" d="M9 9H12V24H9ZM19 14H22V18H19Z"/></svg>'},
    {id:'youtube',label:'YouTube',svg:'<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="2" y="5" width="28" height="22" rx="7" fill="#FF0033" stroke="#111" stroke-width="2"/><path d="M13 11V21L22 16Z" fill="#fff"/></svg>'},
    {id:'twitter',label:'Twitter',svg:'<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#1DA1F2" stroke="#111" stroke-width=".45" stroke-linejoin="round" d="M23.953 4.57a10 10 0 0 1-2.825.775 4.958 4.958 0 0 0 2.163-2.723 9.99 9.99 0 0 1-3.127 1.195 4.916 4.916 0 0 0-8.384 4.482A13.944 13.944 0 0 1 1.64 3.162a4.916 4.916 0 0 0 1.523 6.557 4.903 4.903 0 0 1-2.229-.616v.063a4.918 4.918 0 0 0 3.946 4.818 4.935 4.935 0 0 1-2.224.084 4.93 4.93 0 0 0 4.6 3.42A9.886 9.886 0 0 1 1.14 19.54a13.955 13.955 0 0 0 7.548 2.213c9.057 0 14.01-7.503 14.01-14.01 0-.213-.005-.425-.014-.636a10.012 10.012 0 0 0 2.46-2.548z"/></svg>'},
    {id:'tiktok',label:'TikTok',svg:'<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#25F4EE" d="M16 3h7c.3 4.5 2.8 6.3 6 7v7c-3.2 0-5.4-1-7-2.3V23c0 12.7-20.1 11.4-20-1.4.1-6.5 4.7-10 11.6-9.8v7.4C10 18.5 9 20 9 22c0 4 6.8 4.2 6.9-.4z" transform="translate(-1 1)"/><path fill="#FE2C55" d="M16 3h7c.3 4.5 2.8 6.3 6 7v7c-3.2 0-5.4-1-7-2.3V23c0 12.7-20.1 11.4-20-1.4.1-6.5 4.7-10 11.6-9.8v7.4C10 18.5 9 20 9 22c0 4 6.8 4.2 6.9-.4z" transform="translate(1 -1)"/><path fill="#111" stroke="#111" stroke-width="1" d="M16 3h7c.3 4.5 2.8 6.3 6 7v7c-3.2 0-5.4-1-7-2.3V23c0 12.7-20.1 11.4-20-1.4.1-6.5 4.7-10 11.6-9.8v7.4C10 18.5 9 20 9 22c0 4 6.8 4.2 6.9-.4z"/></svg>'},
    {id:'instagram',label:'Instagram',svg:'<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="instagram-gradient" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#FFDC80"/><stop offset=".35" stop-color="#F77737"/><stop offset=".68" stop-color="#E1306C"/><stop offset="1" stop-color="#833AB4"/></linearGradient></defs><rect x="2" y="2" width="28" height="28" rx="8" fill="url(#instagram-gradient)" stroke="#111" stroke-width="1.5"/><rect x="7" y="7" width="18" height="18" rx="6" fill="none" stroke="#fff" stroke-width="2.2"/><circle cx="16" cy="16" r="4.5" stroke="#fff" fill="none" stroke-width="2.2"/><circle cx="24" cy="8" r="1.5" fill="#fff"/></svg>'}
  ];
  const KEY='goal-overlays-social-v1';
  const defaults={size:38,gap:20,orientation:'row',accounts:platforms.map(p=>({id:p.id,name:'ADIN',enabled:true,showName:true}))};
  const params=new URLSearchParams(location.search);
  const obs=params.get('overlay')==='social';
  function normalized(raw){
    const data=raw&&typeof raw==='object'?raw:{};
    return {
      size:Math.max(20,Math.min(80,Number(data.size)||defaults.size)),
      gap:Math.max(0,Math.min(60,Number(data.gap)||0)),
      orientation:data.orientation==='column'?'column':'row',
      accounts:platforms.map(p=>{
        const v=Array.isArray(data.accounts)?data.accounts.find(a=>a&&a.id===p.id):null;
        return {id:p.id,name:String(v?.name??'ADIN').slice(0,40),enabled:v?.enabled!==false,showName:v?.showName!==false};
      })
    };
  }
  let local=null;
  try{local=JSON.parse(localStorage.getItem(KEY)||'null')}catch(_){}
  let state=normalized(local||defaults);
  if(obs){
    try{const raw=params.get('config');if(raw&&raw.length<10000)state=normalized(JSON.parse(raw))}catch(_){}
  }
  function save(){if(obs)return;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(_){}}
  function strip(accounts=state.accounts){
    const row=document.createElement('div');
    row.className='social-strip'+(state.orientation==='column'?' is-vertical':'');
    row.style.setProperty('--social-size',state.size+'px');
    row.style.setProperty('--social-gap',state.gap+'px');
    for(const p of platforms){
      const config=accounts.find(a=>a.id===p.id);
      if(!config?.enabled)continue;
      const item=document.createElement('div');item.className='social-item';
      const icon=document.createElement('span');icon.className='social-glyph';icon.innerHTML=p.svg;
      item.appendChild(icon);
      if(config.showName!==false){
        const name=document.createElement('span');name.className='social-name';name.textContent=config.name||p.label;
        item.appendChild(name);
      }
      row.appendChild(item);
    }
    return row;
  }
  function draw(){
    const target=obs?get('obs-content'):get('social-preview');
    if(target)target.replaceChildren(strip());
    const sizeLabel=get('social-size-value');if(sizeLabel)sizeLabel.textContent=state.size+' px';
    const gapLabel=get('social-gap-value');if(gapLabel)gapLabel.textContent=state.gap+' px';
    updateObsSizes();
  }
  // Measure the current logo/text styling instead of guessing OBS dimensions.
  // For the six example sizes, currently enabled accounts are measured first.
  function updateObsSizes(){
    const target=get('social-obs-size-list');
    if(!target)return;
    const ordered=[...state.accounts.filter(a=>a.enabled),...state.accounts.filter(a=>!a.enabled)];
    const selected=state.accounts.filter(a=>a.enabled).length;
    const measuring=document.createElement('div');
    measuring.className='social-measure';
    document.body.appendChild(measuring);
    const output=document.createDocumentFragment();
    const round10=value=>Math.ceil(value/10)*10;
    try{
      for(let count=1;count<=platforms.length;count++){
        const accounts=ordered.slice(0,count).map(a=>({...a,enabled:true}));
        const sample=strip(accounts);
        sample.style.flexWrap='nowrap';
        sample.style.maxWidth='none';
        sample.style.width='max-content';
        sample.style.justifyContent='flex-start';
        measuring.appendChild(sample);
        const rect=sample.getBoundingClientRect();
        sample.remove();
        const width=round10(Math.max(100,rect.width+36));
        const height=round10(Math.max(80,rect.height+36));
        const option=document.createElement('div');
        option.className='social-obs-size'+(selected===count?' is-current':'');
        const label=document.createElement('span');
        label.textContent=count+' Logo'+(count===1?'':'s');
        const dimensions=document.createElement('strong');
        dimensions.textContent=width+' × '+height+' px';
        option.append(label,dimensions);
        output.appendChild(option);
      }
    } finally { measuring.remove(); }
    target.replaceChildren(output);
    const currentLabel=get('social-obs-current');
    if(currentLabel)currentLabel.textContent=selected
      ? selected+' ausgewählt · '+(state.orientation==='column'?'untereinander':'nebeneinander')
      : 'Wähle mindestens ein Logo für dein Overlay.';
  }
  if(obs){
    document.body.classList.add('obs-mode','social-obs-mode');
    const root=get('obs-overlay-root');
    root.hidden=false;root.dataset.view='social';root.classList.remove('has-timer');
    draw();
    return;
  }
  const editor=get('social-media');
  if(!editor)return;
  const list=get('social-account-list');
  for(const p of platforms){
    const cfg=state.accounts.find(a=>a.id===p.id);
    const row=document.createElement('div');row.className='social-account-row';
    const enabled=document.createElement('input');enabled.type='checkbox';enabled.className='social-enable';enabled.checked=cfg.enabled;enabled.setAttribute('aria-label',p.label+' anzeigen');
    const label=document.createElement('label');label.className='social-platform';const mini=document.createElement('span');mini.className='social-mini';mini.innerHTML=p.svg;label.append(mini,document.createTextNode(p.label));
    const name=document.createElement('input');name.type='text';name.maxLength=40;name.placeholder='Benutzername';name.value=cfg.name;name.setAttribute('aria-label',p.label+' Benutzername');name.disabled=!cfg.enabled;
    const nameToggle=document.createElement('label');nameToggle.className='social-name-toggle';
    const showName=document.createElement('input');showName.type='checkbox';showName.checked=cfg.showName!==false;
    showName.disabled=!cfg.enabled;showName.setAttribute('aria-label',p.label+' Namen anzeigen');
    const toggleText=document.createElement('span');toggleText.textContent='Name anzeigen';
    nameToggle.append(showName,toggleText);
    enabled.addEventListener('change',()=>{
      cfg.enabled=enabled.checked;name.disabled=!cfg.enabled;showName.disabled=!cfg.enabled;save();draw();
    });
    name.addEventListener('input',()=>{cfg.name=name.value.slice(0,40);save();draw()});
    showName.addEventListener('change',()=>{cfg.showName=showName.checked;save();draw()});
    row.append(enabled,label,name,nameToggle);list.appendChild(row);
  }
  const size=get('social-size'),gap=get('social-gap'),direction=get('social-layout');
  size.value=state.size;gap.value=state.gap;direction.value=state.orientation;
  size.addEventListener('input',()=>{state.size=Number(size.value);save();draw()});
  gap.addEventListener('input',()=>{state.gap=Number(gap.value);save();draw()});
  direction.addEventListener('change',()=>{state.orientation=direction.value;save();draw()});
  function url(){
    const result=new URL(location.href);result.hash='';result.search='';
    result.searchParams.set('overlay','social');
    result.searchParams.set('config',JSON.stringify(state));
    return result.toString();
  }
  get('social-copy').addEventListener('click',async()=>{
    const address=url();try{await navigator.clipboard.writeText(address);get('social-copy').textContent='✓ Link kopiert';setTimeout(()=>{get('social-copy').textContent='OBS-Link kopieren ↗'},2000)}
    catch(_){window.prompt('OBS-Link kopieren:',address)}
  });
  get('social-open').addEventListener('click',()=>window.open(url(),'_blank','noopener,noreferrer'));
  function route(){
    const inSocial=location.hash==='#social-media';
    editor.hidden=!inSocial;
    document.querySelector('.main .page').hidden=inSocial;
    const crumb=document.querySelector('.topbar .crumb strong');
    if(crumb)crumb.textContent=inSocial?'Social Media Overlay':'Overlay Studio';
    document.querySelectorAll('.sidebar .nav-link').forEach(a=>a.classList.toggle('active',inSocial?a.getAttribute('href')==='#social-media':a.getAttribute('href')!=='#social-media'&&a.getAttribute('href')===(location.hash||'#studio')));
    if(inSocial)draw();
  }
  window.addEventListener('hashchange',route);route();draw();
})();
