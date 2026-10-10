/* Dashboard Twitch connection. No Twitch app secret is ever stored in this static site.
 * Backend exchanges OAuth code, encrypts provider tokens, and returns a revocable
 * dashboard session. OBS links contain ONLY a non-guessable public overlay identifier.
 */
(()=>{
  'use strict';
  const api=String(window.STREAMOVERLAYS_LIVE_API||'').trim().replace(/\/+$/,'');
  const tokenKey='streamoverlays:auth:v1';
  const button=document.getElementById('live-connect');
  const logout=document.getElementById('live-disconnect');
  const status=document.getElementById('live-connect-status');
  if(!button || !status)return;
  const current=()=>{try{const x=JSON.parse(localStorage.getItem(tokenKey)||'null');return x?.token&&x?.user?.overlay_id?x:null}catch(_){return null}};
  const publish=auth=>window.dispatchEvent(new CustomEvent('streamoverlays:auth',{detail:{user:auth?.user||null}}));
  const setStatus=text=>{status.textContent=text};
  const show=auth=>{
    if(!api){
      button.disabled=true;button.textContent='Twitch-Verbindung noch nicht verfügbar';
      logout.hidden=true;
      setStatus('Der Betreiber muss einmal die sichere Twitch-Anbindung freischalten. Bis dahin funktionieren die bisherigen Demo-Overlays weiterhin.');
      return;
    }
    button.disabled=false;
    if(auth?.user){
      button.textContent='Twitch erneut verbinden';
      logout.hidden=false;
      setStatus('Verbunden als '+auth.user.display_name+'. Deine OBS-Links für Abo- und Follower-Ziele enthalten nun deinen persönlichen Live-Kanal.');
    }else{
      button.textContent='Mit Twitch verbinden';
      logout.hidden=true;
      setStatus('Einmal bei Twitch anmelden und Zugriff bestätigen. Danach werden Follower und Abos automatisch in deinem OBS-Overlay aktualisiert.');
    }
  };
  const params=new URLSearchParams(location.search);
  const ticket=params.get('twitch_ticket');
  if(ticket){
    params.delete('twitch_ticket');
    const rest=params.toString();
    history.replaceState(null,'',location.pathname+(rest?'?'+rest:'')+(location.hash||''));
  }
  show(current());
  button.addEventListener('click',()=>{if(api)location.assign(api+'/auth/start')});
  logout.addEventListener('click',async()=>{
    const existing=current();
    localStorage.removeItem(tokenKey);
    show(null);publish(null);
    if(existing?.token&&api)try{await fetch(api+'/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+existing.token}})}catch(_){}
  });
  async function exchange(){
    if(!ticket)return;
    if(!api){setStatus('Anmeldung nicht möglich: Backend ist noch nicht verbunden.');return;}
    if(!/^[a-f0-9]{64}$/.test(ticket)){setStatus('Ungültige Twitch-Anmeldungsantwort.');return;}
    button.disabled=true;
    setStatus('Twitch-Verbindung wird eingerichtet …');
    try{
      const r=await fetch(api+'/auth/exchange',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ticket})
      });
      const result=await r.json();
      if(!r.ok||!result.token||!result.user)throw Error(result.error||'Anmeldung fehlgeschlagen');
      localStorage.setItem(tokenKey,JSON.stringify({token:result.token,user:result.user,expiresAt:Date.now()+result.expiresIn*1000}));
      show(current());publish(current());
    }catch(err){setStatus('Twitch-Verbindung fehlgeschlagen: '+err.message);button.disabled=false;}
  }
  if(!ticket && current()?.expiresAt < Date.now()){
    localStorage.removeItem(tokenKey);show(null);
  }
  if(ticket)exchange();
})();
