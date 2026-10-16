/* Stream-Szenen: 24 original animated scene sets; Pinterest links show inspiration only. */
(()=>{
'use strict';
const params=new URLSearchParams(location.search);
const obs=params.get('overlay')==='scene';
const screens=[['soon','Starting Soon','STARTING SOON','Der Stream beginnt gleich'],['brb','Be Right Back','BE RIGHT BACK','Bin gleich wieder da'],['ending','Stream Ending','STREAM ENDING','Danke fürs Zuschauen']];
const packs=[
['Cyber Violet','#100723','#9b6cff','#2ce4ed','Gaming','914934480554665582'],
['Pixel Lagoon','#061d30','#51d5fd','#a8fae4','Pixel','637259416041327907'],
['Galaxy Drift','#080c29','#7c85ff','#ec85e6','Weltraum','704391197986638001'],
['Haunted Fog','#140c1e','#af83d7','#fa597e','Horror','815573814622501232'],
['Kawaii Rose','#290e2e','#ff8fc9','#f9df9c','Kawaii','624241198647845219'],
['Retro Windows','#211e43','#ac91ff','#c4f6fa','Retro','1059049668603416190'],
['Midnight Café','#152433','#b98267','#8ce4f0','Cozy','624241198452417493'],
['Sage Room','#172d29','#9acdb1','#f5e1a2','Cozy','624241198832244980'],
['Golden Stars','#14151d','#e7be69','#c5a6ff','Elegant','915075218011524393'],
['Alien Signal','#0c1a25','#68f7bb','#c795ff','Gaming','624241198660277687'],
['Space Candy','#180b32','#f090fa','#8edcff','Weltraum','624241198685069456'],
['Pixel Lavender','#1b1537','#e9a4ee','#9abbff','Pixel','624241198443129162'],
['Peach Sunset','#2c1428','#ffb0a0','#f5e2bd','Kawaii','624241198650059769'],
['Mono Noir','#0d1015','#f5f5f5','#8f9faf','Minimal','624241198832244988'],
['Cherry Blossom','#2d142a','#ffa6cc','#fbe8fb','Kawaii','624241198699678058'],
['Cozy Lofi','#192032','#d3b1e8','#f6d998','Lo-Fi','624241198435505707'],
['Frog Arcade','#172c21','#8de693','#f6e588','Pixel','624241198443129162'],
['Neon Grid','#091224','#35c2ff','#fa62d4','Gaming','624241198431385046'],
['Bunny Plush','#251a32','#fac3dc','#ae9cff','Kawaii','624241198577482824'],
['Crystal Mint','#0d2428','#79f3dd','#8bcbff','Minimal','900931100445224653'],
['Synthwave 88','#20122d','#ff7ab9','#ffce7a','Retro','624241198434371578'],
['Starlight Blue','#091a38','#98bdff','#f6cb7f','Weltraum','624241198495702174'],
['Autumn Chill','#281a16','#eeb37c','#bcdbb5','Lo-Fi','1149754979861793657'],
['Vaporwave','#241434','#f99fdf','#84efff','Retro','624241198660277687']
];
const key='streamoverlays-scenes-v1',defaults={pack:0,name:'DEIN KANAL',caption:'',stage:'soon'};let state={...defaults};
try{state={...defaults,...JSON.parse(localStorage.getItem(key)||'{}')}}catch(_){}
if(obs){try{state={...defaults,...JSON.parse(params.get('config')||'{}')}}catch(_){}}
const truncate=(s,max=48)=>String(s||'').slice(0,max);
state.pack=Math.max(0,Math.min(packs.length-1,Number(state.pack)||0));
state.stage=screens.some(x=>x[0]===state.stage)?state.stage:'soon';state.name=truncate(state.name);state.caption=truncate(state.caption);
function save(){if(obs)return;try{localStorage.setItem(key,JSON.stringify(state))}catch(_){}}
function createScene(index,stage,small=false){
const p=packs[index]||packs[0],screen=screens.find(s=>s[0]===stage)||screens[0];
const node=document.createElement('div');node.className='ss-screen ss-theme-'+index+(small?' ss-small':'');
node.style.setProperty('--ss-bg',p[1]);node.style.setProperty('--ss-a',p[2]);node.style.setProperty('--ss-b',p[3]);
node.innerHTML='<div class="ss-stars" aria-hidden="true"></div><div class="ss-orbit ss-orbit-one" aria-hidden="true"></div><div class="ss-orbit ss-orbit-two" aria-hidden="true"></div><div class="ss-grid-lines" aria-hidden="true"></div><div class="ss-center"><span class="ss-topline">✦ LIVE STREAM ✦</span><h2></h2><p></p><div class="ss-progress"><span></span></div><strong class="ss-channel"></strong></div><div class="ss-corner ss-tl">◢</div><div class="ss-corner ss-br">◤</div>';
node.querySelector('h2').textContent=screen[2];node.querySelector('p').textContent=state.caption||screen[3];node.querySelector('.ss-channel').textContent=state.name||'DEIN KANAL';return node;
}
if(obs){
document.documentElement.classList.add('ss-obs-html');document.body.classList.add('ss-obs-body');
document.getElementById('app-shell')?.setAttribute('hidden','');
const root=document.getElementById('obs-overlay-root');if(root)root.hidden=true;
const canvas=document.createElement('main');canvas.className='ss-obs-canvas';canvas.append(createScene(state.pack,state.stage));document.body.append(canvas);return;
}
const work=document.createElement('section');work.className='ss-workspace';work.id='stream-scenes';work.hidden=true;
work.innerHTML='<div class="ss-header"><span class="section-index">CREATOR TOOLS / STREAM-SZENEN</span><h1>Deine Stream-Szenen.</h1><p>Such dir ein Design aus und sieh dir alle drei passenden Bildschirme an. 24 eigenständige animierte Design-Sets mit Pinterest-Inspiration.</p></div><div class="ss-feature"><div class="ss-feature-main"><span class="section-index">01 / GROẞE VORSCHAU</span><div class="ss-controls"><label>Dein Kanalname <input id="ss-name" maxlength="48" placeholder="Dein Kanalname"></label><label>Eigener Untertitel (optional) <input id="ss-caption" maxlength="48" placeholder="Der Stream beginnt gleich"></label></div><div id="ss-feature-preview"></div><div class="ss-stage-switch"><button type="button" data-ss-stage="soon">Starting Soon</button><button type="button" data-ss-stage="brb">Be Right Back</button><button type="button" data-ss-stage="ending">Stream Ending</button></div><div class="ss-feature-actions"><button type="button" class="btn btn-primary" id="ss-copy">OBS-Link kopieren ↗</button><button type="button" class="btn btn-outline" id="ss-open">Vollbildvorschau ⤢</button><button type="button" class="btn btn-outline" id="ss-image">Bilddatei speichern ↓</button></div><p class="ss-note">Animiert in OBS mit einer Browserquelle (1920 × 1080). Die Bilddatei ist eine statische SVG-Datei. Änderungen erfordern einen neuen OBS-Link.</p></div><div class="ss-trio-panel"><span class="section-index">02 / ALLE DREI BILDSCHIRME</span><div id="ss-trio" class="ss-trio"></div></div></div><div class="ss-library-head"><div><span class="section-index">03 / DESIGN AUSWÄHLEN</span><h2>24 Stream-Bundles</h2><p>Jedes Design besteht aus Starting Soon, Be Right Back und Stream Ending. Eigenständig gestaltet statt fremde Pinterest-Bilder zu kopieren.</p></div><div class="ss-filter"><label for="ss-filter">Kategorie</label><select id="ss-filter"><option value="Alle">Alle Designs</option></select></div></div><div class="ss-library" id="ss-library"></div>';
document.querySelector('.main')?.append(work);
const nav=document.querySelector('.sidebar nav');
if(nav&&!nav.querySelector('[data-nav="stream-scenes"]'))nav.insertAdjacentHTML('beforeend','<a href="#stream-scenes" class="nav-link" data-nav="stream-scenes"><span class="nav-ico">▣</span> Stream-Szenen</a>');
const $=id=>document.getElementById(id);
for(const cat of [...new Set(packs.map(p=>p[4]))]){const el=document.createElement('option');el.textContent=cat;el.value=cat;$('ss-filter').append(el)}
function url(){const result=new URL(location.href);result.hash='';result.search='';result.searchParams.set('overlay','scene');result.searchParams.set('config',JSON.stringify(state));return result.href}
function feature(){save();$('ss-feature-preview').replaceChildren(createScene(state.pack,state.stage));$('ss-trio').replaceChildren(...screens.map(screen=>{
const wrapper=document.createElement('div');wrapper.className='ss-trio-item';wrapper.append(createScene(state.pack,screen[0],true));
const foot=document.createElement('div');foot.className='ss-trio-foot';const label=document.createElement('strong');label.textContent=screen[1];
const actions=document.createElement('div');actions.className='ss-trio-actions';
const link=document.createElement('button');link.className='ss-mini-button';link.type='button';link.textContent='OBS ↗';link.addEventListener('click',()=>copy(screen[0],link));
const img=document.createElement('button');img.className='ss-mini-button';img.type='button';img.textContent='Bild ↓';img.addEventListener('click',()=>download(screen[0]));
actions.append(link,img);foot.append(label,actions);wrapper.append(foot);return wrapper
}));document.querySelectorAll('[data-ss-stage]').forEach(b=>b.classList.toggle('is-selected',b.dataset.ssStage===state.stage));document.querySelectorAll('.ss-pack').forEach(b=>b.classList.toggle('is-selected',Number(b.dataset.pack)===state.pack))}
function gallery(){const filter=$('ss-filter').value,lib=$('ss-library');lib.replaceChildren();packs.forEach((p,i)=>{
if(filter!=='Alle'&&filter!==p[4])return;
const holder=document.createElement('div');holder.className='ss-pack-holder';const tile=document.createElement('button');tile.type='button';tile.className='ss-pack'+(i===state.pack?' is-selected':'');tile.dataset.pack=i;
tile.append(createScene(i,'soon',true));
const title=document.createElement('strong');title.textContent=p[0];const desc=document.createElement('span');desc.textContent=p[4]+' · 3 Bildschirme';tile.append(title,desc);
tile.addEventListener('click',()=>{state.pack=i;feature();document.querySelector('.ss-feature').scrollIntoView({behavior:'smooth',block:'start'})});
const more=document.createElement('a');more.href='https://www.pinterest.com/search/pins/?q='+encodeURIComponent(p[4]+' stream starting soon be right back ending bundle');more.target='_blank';more.rel='noopener noreferrer';more.textContent='Pinterest-Inspiration ↗';more.title='Pinterest-Suche nach ähnlichen Stream-Bundles. Keine fremden Vorlagen werden verwendet.';
holder.append(tile,more);lib.append(holder);
})}
async function copy(stage,button){state.stage=stage;feature();try{await navigator.clipboard.writeText(url());if(button){button.textContent='✓';setTimeout(()=>button.textContent='OBS ↗',1400)}else{$('ss-copy').textContent='✓ Link kopiert';setTimeout(()=>$('ss-copy').textContent='OBS-Link kopieren ↗',1400)}}catch(_){window.prompt('OBS-Link kopieren:',url())}}
function xml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
function download(stage){
const pack=packs[state.pack],title=screens.find(s=>s[0]===stage);
const subtitle=state.caption||title[3],channel=state.name||'DEIN KANAL';
const dots=Array.from({length:95},(_,i)=>{const x=(i*419+71)%1919,y=(i*269+139)%1079,r=(i%4===0)?3:1.8;return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(i%2?pack[2]:pack[3])+'" opacity=".47"/>'}).join('');
const svg='<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><defs><radialGradient id="a"><stop stop-color="'+pack[2]+'" stop-opacity=".36"/><stop offset="1" stop-color="'+pack[1]+'" stop-opacity="0"/></radialGradient><linearGradient id="b"><stop stop-color="'+pack[2]+'"/><stop offset="1" stop-color="'+pack[3]+'"/></linearGradient></defs><rect width="1920" height="1080" fill="'+pack[1]+'"/><ellipse cx="1560" cy="80" rx="850" ry="730" fill="url(#a)"/><ellipse cx="230" cy="1050" rx="900" ry="800" fill="url(#a)" opacity=".6"/>'+dots+'<circle cx="1660" cy="80" r="370" fill="none" stroke="'+pack[2]+'" stroke-opacity=".42" stroke-width="3"/><circle cx="90" cy="1040" r="270" fill="none" stroke="'+pack[3]+'" stroke-opacity=".4" stroke-width="3"/><g font-family="Arial,sans-serif" text-anchor="middle"><text x="960" y="380" font-weight="bold" font-size="30" letter-spacing="10" fill="'+pack[3]+'">✦ LIVE STREAM ✦</text><text x="960" y="565" font-size="110" font-weight="900" fill="white" letter-spacing="6">'+xml(title[2])+'</text><text x="960" y="650" font-size="35" fill="white">'+xml(truncate(subtitle,48))+'</text><rect x="710" y="735" rx="5" width="500" height="8" fill="#ffffff55"/><rect x="710" y="735" rx="5" width="210" height="8" fill="url(#b)"/><text x="960" y="822" font-size="28" letter-spacing="5" fill="'+pack[3]+'">'+xml(truncate(channel,48))+'</text></g></svg>';
const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});const href=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=href;anchor.download='stream-'+stage+'-'+state.pack+'.svg';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(href),1200)}
$('ss-name').value=state.name;$('ss-caption').value=state.caption;
$('ss-name').addEventListener('input',e=>{state.name=truncate(e.target.value);feature()});
$('ss-caption').addEventListener('input',e=>{state.caption=truncate(e.target.value);feature()});
$('ss-filter').addEventListener('change',gallery);
document.querySelectorAll('[data-ss-stage]').forEach(el=>el.addEventListener('click',()=>{state.stage=el.dataset.ssStage;feature()}));
$('ss-copy').addEventListener('click',()=>copy(state.stage));$('ss-open').addEventListener('click',()=>window.open(url(),'_blank','noopener,noreferrer'));$('ss-image').addEventListener('click',()=>download(state.stage));
function route(){const active=location.hash==='#stream-scenes';work.hidden=!active;if(active){
const page=document.querySelector('.main .page');if(page)page.hidden=true;
const social=document.getElementById('social-media');if(social)social.hidden=true;
const crumb=document.querySelector('.topbar .crumb strong');if(crumb)crumb.textContent='Stream-Szenen';
document.querySelectorAll('.sidebar .nav-link').forEach(a=>a.classList.toggle('active',a.dataset.nav==='stream-scenes'));
}else nav?.querySelector('[data-nav="stream-scenes"]')?.classList.remove('active')}
window.addEventListener('hashchange',route);gallery();feature();route();
})();