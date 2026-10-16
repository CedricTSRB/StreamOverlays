/* 36 original goal-overlay presets, inspired by Pinterest style categories.
   No third-party images, artwork or paid assets are embedded. */
(()=>{
  'use strict';
  const presets=[
  {
    "id": "pixel-dungeon",
    "name": "Pixel Dungeon",
    "category": "Gaming",
    "accent": "#8be36b",
    "bg": "#111e1d",
    "secondary": "#1d4030",
    "ink": "#f1ffdf",
    "motif": "▣",
    "description": "Pixel-Rahmen · Segmentleiste",
    "recipe": "pixel"
  },
  {
    "id": "neon-circuit",
    "name": "Neon Circuit",
    "category": "Gaming",
    "accent": "#31f5e1",
    "bg": "#070f1a",
    "secondary": "#142d3e",
    "ink": "#e6ffff",
    "motif": "⌁",
    "description": "Leiterbahnen · Neon-Puls",
    "recipe": "circuit"
  },
  {
    "id": "vector-hud",
    "name": "Vector HUD",
    "category": "Gaming",
    "accent": "#7bbcff",
    "bg": "#081523",
    "secondary": "#172c4b",
    "ink": "#eff8ff",
    "motif": "⌖",
    "description": "Visier · Radarlinie",
    "recipe": "hud"
  },
  {
    "id": "blueprint",
    "name": "Blueprint Grid",
    "category": "Gaming",
    "accent": "#67c4ff",
    "bg": "#07314a",
    "secondary": "#0c4e66",
    "ink": "#f7ffff",
    "motif": "✦",
    "description": "Technische Rasterzeichnung",
    "recipe": "blueprint"
  },
  {
    "id": "holo-wave",
    "name": "Holo Wave",
    "category": "Gaming",
    "accent": "#bd96ff",
    "bg": "#182040",
    "secondary": "#42356d",
    "ink": "#fcf7ff",
    "motif": "◇",
    "description": "Prismatische Lichtbahnen",
    "recipe": "holo"
  },
  {
    "id": "terminal-green",
    "name": "Terminal 87",
    "category": "Gaming",
    "accent": "#7aff9e",
    "bg": "#07150e",
    "secondary": "#123522",
    "ink": "#c9ffd3",
    "motif": ">_",
    "description": "Code-Textur · Scanline",
    "recipe": "terminal"
  },
  {
    "id": "vhs-glitch",
    "name": "VHS Glitch",
    "category": "Retro",
    "accent": "#fd719e",
    "bg": "#171322",
    "secondary": "#4c2443",
    "ink": "#fff2f6",
    "motif": "REC",
    "description": "Bildstörung · Videokassette",
    "recipe": "vhs"
  },
  {
    "id": "cassette",
    "name": "Cassette Tape",
    "category": "Retro",
    "accent": "#ffa966",
    "bg": "#2f261e",
    "secondary": "#674332",
    "ink": "#fff1df",
    "motif": "▤",
    "description": "Bandspulen · Streifen",
    "recipe": "cassette"
  },
  {
    "id": "retro-arcade",
    "name": "Arcade Pixel",
    "category": "Retro",
    "accent": "#fcd85c",
    "bg": "#251139",
    "secondary": "#622a80",
    "ink": "#fff3c2",
    "motif": "★",
    "description": "8-Bit-Spielhallen-Look",
    "recipe": "arcade"
  },
  {
    "id": "synth-sunset",
    "name": "Synth Sunset",
    "category": "Retro",
    "accent": "#ff6bba",
    "bg": "#2c153f",
    "secondary": "#85385b",
    "ink": "#fff0fc",
    "motif": "☀",
    "description": "80er-Sonne · Horizont",
    "recipe": "synth"
  },
  {
    "id": "cloud-candy",
    "name": "Cloud Candy",
    "category": "Kawaii",
    "accent": "#95d3ff",
    "bg": "#6178c9",
    "secondary": "#9e7dcf",
    "ink": "#fff",
    "motif": "☁",
    "description": "Wolken · weiche Kanten",
    "recipe": "cloud"
  },
  {
    "id": "kawaii-heart",
    "name": "Heart Pop",
    "category": "Kawaii",
    "accent": "#ff9abd",
    "bg": "#7d3d76",
    "secondary": "#aa6a98",
    "ink": "#fff7fa",
    "motif": "♡",
    "description": "Herzen · Sticker-Kontur",
    "recipe": "heart"
  },
  {
    "id": "boba-pop",
    "name": "Boba Pop",
    "category": "Kawaii",
    "accent": "#e4c19c",
    "bg": "#63475a",
    "secondary": "#b08083",
    "ink": "#fff9ea",
    "motif": "●",
    "description": "Bubble-Tea-Punkte",
    "recipe": "boba"
  },
  {
    "id": "sakura",
    "name": "Sakura Bloom",
    "category": "Kawaii",
    "accent": "#ffb5d2",
    "bg": "#622f5c",
    "secondary": "#aa6692",
    "ink": "#fff4fc",
    "motif": "✿",
    "description": "Kirschblüten · Blütenblatt",
    "recipe": "sakura"
  },
  {
    "id": "forest-rune",
    "name": "Forest Canopy",
    "category": "Nature",
    "accent": "#98d17b",
    "bg": "#122923",
    "secondary": "#2f5944",
    "ink": "#e9ffe7",
    "motif": "❧",
    "description": "Blätter · Waldboden",
    "recipe": "forest"
  },
  {
    "id": "moss-stone",
    "name": "Moss & Stone",
    "category": "Nature",
    "accent": "#bacc84",
    "bg": "#363d31",
    "secondary": "#657353",
    "ink": "#f7f7e8",
    "motif": "◈",
    "description": "Naturstein · Flechten",
    "recipe": "moss"
  },
  {
    "id": "ocean-depth",
    "name": "Deep Ocean",
    "category": "Nature",
    "accent": "#6be8ed",
    "bg": "#053149",
    "secondary": "#0e5770",
    "ink": "#e7fdff",
    "motif": "≈",
    "description": "Wellen · Tiefsee",
    "recipe": "ocean"
  },
  {
    "id": "sunrise",
    "name": "Golden Sunrise",
    "category": "Nature",
    "accent": "#ffd095",
    "bg": "#713e4c",
    "secondary": "#d06f66",
    "ink": "#fff2df",
    "motif": "◒",
    "description": "Sonnenaufgang · Horizont",
    "recipe": "sunrise"
  },
  {
    "id": "gold-plate",
    "name": "Gold Royale",
    "category": "Premium",
    "accent": "#f0ca6e",
    "bg": "#1d1b17",
    "secondary": "#504532",
    "ink": "#fff7df",
    "motif": "♛",
    "description": "Doppel-Goldrahmen",
    "recipe": "gold"
  },
  {
    "id": "marble-royal",
    "name": "Marble Pearl",
    "category": "Premium",
    "accent": "#c9a3e8",
    "bg": "#f0e9e5",
    "secondary": "#d8cfda",
    "ink": "#392d43",
    "motif": "◆",
    "description": "Marmor · Gravur",
    "recipe": "marble"
  },
  {
    "id": "art-deco",
    "name": "Art Deco",
    "category": "Premium",
    "accent": "#e6b86a",
    "bg": "#152935",
    "secondary": "#284953",
    "ink": "#f7edd7",
    "motif": "❖",
    "description": "Fächer · geometrische Linien",
    "recipe": "deco"
  },
  {
    "id": "noir-strip",
    "name": "Film Noir",
    "category": "Dark",
    "accent": "#ececf0",
    "bg": "#101014",
    "secondary": "#24272f",
    "ink": "#fafafa",
    "motif": "◼",
    "description": "Schwarzweiß · Filmstreifen",
    "recipe": "noir"
  },
  {
    "id": "gothic-rose",
    "name": "Gothic Rose",
    "category": "Dark",
    "accent": "#f0788a",
    "bg": "#1c101e",
    "secondary": "#48243c",
    "ink": "#ffe3ed",
    "motif": "✝",
    "description": "Spitzbogen · Rosenrot",
    "recipe": "gothic"
  },
  {
    "id": "witch-sigil",
    "name": "Witch Sigil",
    "category": "Dark",
    "accent": "#ba9aff",
    "bg": "#1a1428",
    "secondary": "#35284d",
    "ink": "#e8dcff",
    "motif": "☽",
    "description": "Magisches Siegel",
    "recipe": "witch"
  },
  {
    "id": "nebula",
    "name": "Nebula Dust",
    "category": "Space",
    "accent": "#8c9bff",
    "bg": "#101430",
    "secondary": "#403372",
    "ink": "#e9eeff",
    "motif": "✦",
    "description": "Nebelwolken · Sterne",
    "recipe": "nebula"
  },
  {
    "id": "moon-phases",
    "name": "Moon Phases",
    "category": "Space",
    "accent": "#f4e9c7",
    "bg": "#171d33",
    "secondary": "#374260",
    "ink": "#faf6ea",
    "motif": "☾",
    "description": "Mondphasen · Lichtreflex",
    "recipe": "moon"
  },
  {
    "id": "constellation",
    "name": "Constellation",
    "category": "Space",
    "accent": "#9fd8fd",
    "bg": "#101a29",
    "secondary": "#243c51",
    "ink": "#f0f9ff",
    "motif": "✧",
    "description": "Sternkarten · Sternlinien",
    "recipe": "stars"
  },
  {
    "id": "paper-note",
    "name": "Paper Notes",
    "category": "Minimal",
    "accent": "#e2b24e",
    "bg": "#fff2c9",
    "secondary": "#eedca5",
    "ink": "#46341b",
    "motif": "✎",
    "description": "Notizzettel · Büroklammer",
    "recipe": "paper"
  },
  {
    "id": "ink-editorial",
    "name": "Editorial Ink",
    "category": "Minimal",
    "accent": "#404956",
    "bg": "#f6f6f2",
    "secondary": "#e3e5df",
    "ink": "#1b1e24",
    "motif": "—",
    "description": "Magazin · Typografie",
    "recipe": "editorial"
  },
  {
    "id": "brutalist",
    "name": "Brutalist",
    "category": "Minimal",
    "accent": "#ff6b38",
    "bg": "#ebede6",
    "secondary": "#c6cec2",
    "ink": "#1b241d",
    "motif": "!!",
    "description": "Kräftige Rahmen · Schrift",
    "recipe": "brutal"
  },
  {
    "id": "racing-stripes",
    "name": "Racing GT",
    "category": "Energy",
    "accent": "#ff6d48",
    "bg": "#151820",
    "secondary": "#3b3f4e",
    "ink": "#fff",
    "motif": "➤",
    "description": "Rennstreifen · Tacholook",
    "recipe": "racing"
  },
  {
    "id": "scoreboard",
    "name": "Scoreboard",
    "category": "Energy",
    "accent": "#c8f76e",
    "bg": "#20291e",
    "secondary": "#3d4d31",
    "ink": "#f7ffe9",
    "motif": "●",
    "description": "Stadionanzeige · LED",
    "recipe": "score"
  },
  {
    "id": "lava-core",
    "name": "Lava Core",
    "category": "Energy",
    "accent": "#ff8740",
    "bg": "#2a0d11",
    "secondary": "#6f2426",
    "ink": "#fff0d9",
    "motif": "♨",
    "description": "Magma · Glut",
    "recipe": "lava"
  },
  {
    "id": "crystal-shard",
    "name": "Crystal Shard",
    "category": "Fantasy",
    "accent": "#94dfff",
    "bg": "#173047",
    "secondary": "#376081",
    "ink": "#eefbff",
    "motif": "◇",
    "description": "Kristall · Facetten",
    "recipe": "crystal"
  },
  {
    "id": "alchemy",
    "name": "Alchemy Lab",
    "category": "Fantasy",
    "accent": "#d4ae7a",
    "bg": "#31251b",
    "secondary": "#604331",
    "ink": "#fff0d5",
    "motif": "⚗",
    "description": "Alchemie · Pergament",
    "recipe": "alchemy"
  },
  {
    "id": "dragon-scale",
    "name": "Dragon Scale",
    "category": "Fantasy",
    "accent": "#79cf9e",
    "bg": "#102722",
    "secondary": "#316650",
    "ink": "#e4ffeb",
    "motif": "♜",
    "description": "Schuppen · Fantasy-Rahmen",
    "recipe": "dragon"
  }
];
  window.STREAMOVERLAYS_GOAL_PRESETS=Object.freeze(presets);
  if(new URLSearchParams(location.search).has('overlay'))return;
  const grid=document.getElementById('styles-grid');
  if(!grid)return;
  const categories=['Alle','Klassiker',...new Set(presets.map(p=>p.category))];
  const tools=document.createElement('div');
  tools.className='goal-gallery-tools';
  tools.innerHTML='<label class="goal-gallery-search"><span>Design suchen</span><input id="goal-theme-search" type="search" placeholder="z. B. Pixel, Kawaii, Retro ..." autocomplete="off"></label><label class="goal-gallery-category"><span>Kategorie</span><select id="goal-theme-category"></select></label><span class="goal-gallery-count" id="goal-theme-count" role="status"></span>';
  const select=tools.querySelector('#goal-theme-category');
  for(const category of categories){const option=document.createElement('option');option.value=category;option.textContent=category;select.appendChild(option)}
  grid.before(tools);
  const classic=new Set(['frame','cyber','pastel','arcade','sparkle','transparent','counter']);
  for(const tile of grid.querySelectorAll('.style-tile')){
    tile.dataset.category='Klassiker';
    const sample=tile.querySelector('.style-art small');if(sample)sample.remove();
  }
  for(const item of presets){
    const tile=document.createElement('button');tile.type='button';
    tile.className='style-tile goal-preset-tile';tile.dataset.style=item.id;tile.dataset.category=item.category;tile.setAttribute('aria-pressed','false');
    tile.setAttribute('aria-label',item.name+' Design auswählen');
    const art=document.createElement('span');art.className='style-art gp-thumb art-'+item.id;
    art.style.setProperty('--accent',item.accent);
    const deco=document.createElement('i');deco.setAttribute('aria-hidden','true');
    const title=document.createElement('strong');title.textContent='SUB GOAL';
    const meter=document.createElement('b');meter.setAttribute('aria-hidden','true');
    art.append(deco,title,meter);
    const label=document.createElement('span');label.className='style-label';
    label.append(document.createTextNode(item.name+' '));
    const check=document.createElement('span');check.className='select-check';check.textContent='✓';label.append(check);
    const desc=document.createElement('span');desc.className='style-desc';desc.textContent=item.description;
    tile.append(art,label,desc);
    grid.append(tile);
  }
  const counter=tools.querySelector('#goal-theme-count');
  const search=tools.querySelector('#goal-theme-search');
  function refresh(){
    const text=search.value.trim().toLocaleLowerCase('de');
    const category=select.value;
    let n=0;
    for(const tile of grid.querySelectorAll('.style-tile')){
      const content=(tile.querySelector('.style-label')?.textContent||'')+' '+(tile.querySelector('.style-desc')?.textContent||'');
      const matchText=content.toLocaleLowerCase('de').includes(text);
      const matchCategory=category==='Alle'||tile.dataset.category===category;
      tile.hidden=!(matchText&&matchCategory);
      if(!tile.hidden)n++;
    }
    counter.textContent=n+' von '+grid.querySelectorAll('.style-tile').length+' Designs';
  }
  search.addEventListener('input',refresh);
  select.addEventListener('change',refresh);
  refresh();
})();
