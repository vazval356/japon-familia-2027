"use strict";


const IC={
 x:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 l:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
 r:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
 cam:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2h5L16 6"/></svg>',
 play:'<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
 pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
 link:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1"/></svg>',
 si:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
 quiza:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M9.2 9a3 3 0 115.4 1.8c-.9 1-2.6 1.6-2.6 3.2M12 18h.01"/></svg>',
 no:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>'
};
const VL={si:'Sí',quiza:'Quizás',no:'No'};
const STL={sel:'Elegido',duda:'En duda',desc:'Descartado',pend:'Sin votar'};
const PLAN_LABEL={J:'Japonal',E:'Excel',N:'Idea nueva'};
const BYID=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const fmt=n=>n.toLocaleString('es-ES');
const WD=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const dlabel=iso=>{const d=new Date(iso+'T12:00:00');return WD[d.getDay()]+' '+d.getDate()+' jul'};
const short=n=>n.replace(/\s*\(.*?\)/g,'').split(':')[0];
function toast(t){const el=$('#toast');el.textContent=t;el.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>el.hidden=true,2800)}
function copyText(txt,ok){const fb=()=>{const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast(ok)}catch(e){toast('No se pudo copiar')}ta.remove()};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(txt).then(()=>toast(ok),fb);else fb()}

/* ================= votos (Supabase) ================= */
const SB_URL='https://nllbgtcuxisbugftehui.supabase.co',SB_KEY='sb_publishable_K72sRnpGjnm6f7_rJ_G-Dw_iGzBIK3W';
const SBH={apikey:SB_KEY,'Content-Type':'application/json'};
const V={online:null,canWrite:true,docs:{},me:'',saved:null,busy:0,lastWrite:0};
try{V.me=(localStorage.getItem('jp27-name')||'').trim()}catch(e){}
try{const c=JSON.parse(localStorage.getItem('jp27-votes')||'{}');if(V.me&&c&&typeof c==='object')V.docs[V.me]=c}catch(e){}
const myVotes=()=>V.me?(V.docs[V.me]||(V.docs[V.me]={})):{};
function votesFor(id){const out=[];for(const [uid,v] of Object.entries(V.docs)){if(uid&&v&&v[id])out.push({uid,v:v[id]})}return out}
function statusOf(id){const vs=votesFor(id);if(!vs.length)return'pend';let s=0,q=0,n=0;vs.forEach(x=>x.v==='si'?s++:x.v==='no'?n++:q++);
  if(n>s)return'desc';if(s>n&&s>=q)return'sel';return'duda'}
const initials=uid=>(uid.trim()[0]||'?').toUpperCase();
const nameOf=uid=>uid===V.me?uid+' (tú)':uid;
const cacheMine=()=>{try{localStorage.setItem('jp27-votes',JSON.stringify(myVotes()))}catch(e){}};
async function sbLoad(){
  const started=Date.now();
  try{
    const r=await fetch(SB_URL+'/rest/v1/votes?select=person,item,vote&limit=10000',{headers:SBH,cache:'no-store'});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const rows=await r.json();const docs={};
    rows.forEach(x=>{if(x&&typeof x.person==='string'&&BYID[x.item]&&VL[x.vote])(docs[x.person]=docs[x.person]||{})[x.item]=x.vote});
    if(V.me&&(V.busy||V.lastWrite>=started))docs[V.me]=Object.assign({},myVotes());
    V.docs=docs;V.online=true;cacheMine();
  }catch(e){V.online=false}
  refreshVotes();
}
async function setVote(id,v){
  if(!V.me){toast('Escribe tu nombre arriba para poder votar');const n=$('#myName');n.scrollIntoView({behavior:'smooth',block:'center'});n.focus();return}
  V.lastWrite=Date.now();const m=myVotes();const del=m[id]===v;if(del)delete m[id];else m[id]=v;cacheMine();refreshVotes();
  V.busy++;
  try{
    let r;
    if(del)r=await fetch(SB_URL+'/rest/v1/votes?person=eq.'+encodeURIComponent(V.me)+'&item=eq.'+encodeURIComponent(id),{method:'DELETE',headers:SBH});
    else r=await fetch(SB_URL+'/rest/v1/votes?on_conflict=person,item',{method:'POST',headers:Object.assign({Prefer:'resolution=merge-duplicates,return=minimal'},SBH),body:JSON.stringify({person:V.me,item:id,vote:v,updated_at:new Date().toISOString()})});
    if(!r.ok)throw new Error('HTTP '+r.status);
    V.saved=new Date();V.online=true;V.lastWrite=Date.now();
  }catch(e){V.online=false;toast('No se ha podido guardar el voto. Comprueba la conexión y vuelve a pulsar.')}
  finally{V.busy--;setWho()}
}
function voteHtml(id){const m=myVotes()[id];return `<div class="vote" data-id="${id}" role="group" aria-label="Tu voto">${['si','quiza','no'].map(v=>`<button type="button" data-v="${v}" aria-pressed="${m===v}">${IC[v]}${VL[v]}</button>`).join('')}</div>`}
function famHtml(id){const vs=votesFor(id);const st=statusOf(id);
  return `<span class="badge ${st}">${STL[st]}</span>${vs.map(x=>`<span class="av ${x.v}" title="${esc(nameOf(x.uid))}: ${VL[x.v]}">${esc(initials(x.uid))}</span>`).join('')}`}
function setWho(){
  const w=$('#who'),t=$('#whoTxt');const people=Object.keys(V.docs).filter(k=>Object.keys(V.docs[k]||{}).length);
  const who=people.length?` Han votado: ${people.join(', ')}.`:' Todavía no ha votado nadie.';
  if(V.online===null){t.textContent='Conectando con la votación…';return}
  if(!V.online){w.classList.add('local');t.textContent='No se puede conectar con la votación ahora mismo. Comprueba la conexión; tus votos se quedan guardados en este dispositivo y se envían cuando vuelvas a votar.';return}
  w.classList.remove('local');
  t.textContent=(V.me?`Votas como ${V.me}. Cada voto se guarda al momento y lo ve toda la familia.`:'Escribe tu nombre para empezar a votar (usad siempre el mismo).')+who+(V.saved?` Último voto guardado a las ${V.saved.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}.`:'');
}
function renderTally(){
  const c={sel:0,duda:0,desc:0,pend:0};ITEMS.forEach(i=>c[statusOf(i.id)]++);
  $('#tally').innerHTML=['sel','duda','desc','pend'].map(k=>`<button type="button" class="${k}" data-goto="${k}"><b>${c[k]}</b><span>${{sel:'Elegidos',duda:'En duda',desc:'Descartados',pend:'Sin votar'}[k]}</span></button>`).join('');
  const mine=Object.keys(myVotes()).length;$('#prog').style.width=(mine/ITEMS.length*100)+'%';
  $('#ptxt').textContent=V.me?`${V.me}, has votado ${mine} de ${ITEMS.length} sitios.`:`Escribe tu nombre para votar los ${ITEMS.length} sitios.`;
}
$('#tally').addEventListener('click',e=>{const b=e.target.closest('[data-goto]');if(!b)return;const k=b.dataset.goto;
  state.st=k==='pend'?'mine':k;document.querySelectorAll('#stSeg button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.st===state.st));render();$('#lugares').scrollIntoView({behavior:'smooth'})});
function refreshVotes(){
  document.querySelectorAll('.vote[data-id]').forEach(el=>{const m=myVotes()[el.dataset.id];el.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===m))});
  document.querySelectorAll('[data-fam]').forEach(el=>{el.innerHTML=famHtml(el.dataset.fam)});
  document.querySelectorAll('.card[data-id]').forEach(c=>{c.className='card st-'+statusOf(c.dataset.id)});
  const fl=$('#famList');if(fl)fl.innerHTML=famListHtml(fl.dataset.id);
  renderTally();renderSummary();renderMap();renderPlans(true);setWho();
}
function famListHtml(id){const vs=votesFor(id);if(!vs.length)return '<div style="color:var(--muted)">Nadie ha votado todavía.</div>';
  return vs.map(x=>`<div><span class="av ${x.v}">${esc(initials(x.uid))}</span>${esc(nameOf(x.uid))}: <b>${VL[x.v]}</b></div>`).join('')}
document.addEventListener('click',e=>{const b=e.target.closest('.vote button');if(!b)return;e.stopPropagation();setVote(b.closest('.vote').dataset.id,b.dataset.v)});
$('#myName').value=V.me;
$('#nameForm').addEventListener('submit',e=>{e.preventDefault();const n=$('#myName').value.replace(/\s+/g,' ').trim().slice(0,30);
  if(!n){toast('Escribe un nombre');return}
  const prev=V.me;V.me=n;try{localStorage.setItem('jp27-name',n)}catch(x){}
  if(prev!==n){V.docs[n]=V.docs[n]||{};cacheMine()}
  toast(V.docs[n]&&Object.keys(V.docs[n]).length?`Hola ${n}: tienes ${Object.keys(V.docs[n]).length} votos guardados`:`Hola ${n}: ya puedes votar`);refreshVotes()});
function sbStart(){sbLoad();setInterval(()=>{if(document.visibilityState==='visible')sbLoad()},15000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sbLoad()})}

/* ================= portada ================= */
$('#mosaic').innerHTML=['fushimi','shibuyasky','miyajima','dotonbori','chureito'].map(id=>{const i=BYID[id];return `<button type="button" data-open="${id}" aria-label="Abrir ${esc(i.n)}"><img src="${i.photos[0].m}" alt="" decoding="async"><span>${esc(i.city)}</span></button>`}).join('');

/* ================= lugares ================= */
const state={cats:new Set(),city:'all',plan:'all',q:'',st:'all'};let current=ITEMS.slice();
(function(){const counts={};ITEMS.forEach(i=>i.cats.forEach(c=>counts[c]=(counts[c]||0)+1));
  $('#catChips').innerHTML=Object.entries(CATS).map(([k,v])=>`<button type="button" class="chip" data-cat="${k}" aria-pressed="false" style="--dc:var(--c-${k})"><span class="dot"></span>${v}<span class="n">${counts[k]||0}</span></button>`).join('');
  const cities=[...new Set(ITEMS.map(i=>i.city))].sort((a,b)=>a.localeCompare(b,'es'));
  $('#city').innerHTML='<option value="all">Todas</option>'+cities.map(c=>`<option>${esc(c)}</option>`).join('');})();
function card(i){
  const tags=i.cats.map(c=>`<span class="tag" style="--dc:var(--c-${c})"><span class="dot"></span>${CATS[c]}</span>`).join('');
  const plans=i.plan.map(p=>`<span class="plan ${p}">${PLAN_LABEL[p]}</span>`).join('');
  return `<article class="card st-${statusOf(i.id)}" data-id="${i.id}">
    <button type="button" class="ph" data-open="${i.id}" aria-label="Abrir ficha de ${esc(i.n)}"><img class="bgimg" src="${i.photos[0].m}" alt="" loading="lazy" decoding="async"><img class="fg" src="${i.photos[0].m}" alt="" loading="lazy" decoding="async">
      <span class="pill city">${esc(i.city)}</span>${i.status?'<span class="pill alert">Aviso</span>':''}
      <span class="pill n">${IC.cam}${i.photos.length}</span>${(VIDEOS[i.id]&&VIDEOS[i.id].length)?`<span class="pill vid-n">${IC.play}${VIDEOS[i.id].length}</span>`:''}
</button>
    <div class="cbody"><button type="button" class="ttl" data-open="${i.id}"><h3>${esc(i.n)}</h3><span class="jpn">${esc(i.jp)}</span></button><div class="tags">${plans}${tags}</div><p>${esc(i.d)}</p>
      <div class="cfoot"><div class="top"><div class="fam" data-fam="${i.id}">${famHtml(i.id)}</div><button type="button" class="open-link" data-open="${i.id}">Ficha ${IC.r}</button></div>${voteHtml(i.id)}</div></div></article>`;
}
function render(){
  const q=norm(state.q.trim());
  current=ITEMS.filter(i=>(!state.cats.size||i.cats.some(c=>state.cats.has(c)))
    &&(state.city==='all'||i.city===state.city)&&(state.plan==='all'||i.plan.includes(state.plan))
    &&(state.st==='all'||(state.st==='mine'?!myVotes()[i.id]:statusOf(i.id)===state.st))
    &&(!q||norm([i.n,i.jp,i.d,i.more,i.tip,i.city,(i.ver||[]).join(' ')].join(' ')).includes(q)));
  $('#grid').innerHTML=current.length?current.map(card).join(''):`<div class="empty">${state.st==='mine'?'¡Ya has votado todos los sitios de este filtro!':'No hay lugares con estos filtros. Prueba a quitar alguno.'}</div>`;
  $('#count').textContent=`${current.length} de ${ITEMS.length} lugares`;
}
$('#catChips').addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;const c=b.dataset.cat;state.cats.has(c)?state.cats.delete(c):state.cats.add(c);b.setAttribute('aria-pressed',state.cats.has(c));render()});
$('#city').addEventListener('change',e=>{state.city=e.target.value;render()});
$('#q').addEventListener('input',e=>{state.q=e.target.value;render()});
$('#planSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.plan=b.dataset.plan;document.querySelectorAll('#planSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
$('#stSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;state.st=b.dataset.st;document.querySelectorAll('#stSeg button').forEach(x=>x.setAttribute('aria-pressed',x===b));render()});
document.addEventListener('click',e=>{const o=e.target.closest('[data-open]');if(o&&!e.target.closest('.vote')){e.preventDefault();openSheet(o.dataset.open)}});

/* ================= ficha ================= */
const APPEARS={};PLANS.forEach(p=>p.days.forEach(d=>(d.links||[]).forEach(id=>{(APPEARS[id]=APPEARS[id]||[]).push({p,d})})));

const sheet=$('#sheet');let shId=null,shIdx=0;
let MINI=null;
function miniMap(id){if(!COORDS[id])return '';const rid=regionOf(id);
  return `<div><h4>Dónde está</h4><div class="mini" id="miniMap"></div>${rid?`<button type="button" class="btn" style="margin-top:8px" data-tomap="${rid}">${IC.pin} Ver en el mapa de ${esc(REGIONS[rid].n)}</button>`:''}</div>`}
function placeMini(){if(MINI){MINI.remove();MINI=null}const el=document.getElementById('miniMap');if(!el||!shId||!COORDS[shId])return;
  loadLeaflet().then(L=>{if(!L||!document.getElementById('miniMap'))return;const c=COORDS[shId];
    MINI=L.map('miniMap',{zoomControl:false,attributionControl:true,scrollWheelZoom:false}).setView(c,15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(MINI);
    L.marker(c,{icon:L.divIcon({className:'',html:'<span class="lpin in" style="width:22px;height:22px"></span>',iconSize:[22,22],iconAnchor:[11,11]})}).addTo(MINI)})}
function videosHtml(id){const v=VIDEOS[id];if(!v||!v.length)return '';
  return `<div><h4>Vídeos</h4><div class="vids">${v.map(x=>`<button type="button" class="vid" data-vid="${esc(x.id)}" aria-label="Reproducir vídeo: ${esc(x.title)}"><span class="vth"><img src="https://i.ytimg.com/vi/${esc(x.id)}/mqdefault.jpg" alt="" loading="lazy"><span class="play">${IC.play}</span></span><span class="vt">${esc(x.title)}</span><span class="vd">${esc(x.dur)} · ${esc(x.ch)}${x.lang==='en'?' · en inglés':''}</span></button>`).join('')}</div></div>`}
function openSheet(id){
  const i=BYID[id];if(!i)return;shId=id;shIdx=0;
  const ap=APPEARS[id]||[];
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(i.maps);
  const list=current.length?current:ITEMS;let pos=list.findIndex(x=>x.id===id);const L=pos<0?ITEMS:list;if(pos<0)pos=ITEMS.findIndex(x=>x.id===id);
  const prev=L[(pos-1+L.length)%L.length],next=L[(pos+1)%L.length];
  $('#sh').innerHTML=`
   <div class="hero">
     <div class="hero-track" id="hTrack">${i.photos.map((s,k)=>`<figure><img class="bgimg" src="${s.m}" alt="" ${k?'loading="lazy"':''}><img class="fg" src="${s.l}" srcset="${s.m} 480w, ${s.l} ${s.w}w" sizes="(max-width:860px) 100vw, 1100px" alt="${esc(i.n)}, foto ${k+1}" ${k?'loading="lazy"':''} decoding="async"></figure>`).join('')}</div>
     ${i.photos.length>1?`<button type="button" class="hnav prev" aria-label="Foto anterior">${IC.l}</button><button type="button" class="hnav next" aria-label="Foto siguiente">${IC.r}</button><span class="hcount" id="hCount">1 / ${i.photos.length}</span>`:''}
     <button type="button" class="hclose" id="shClose" aria-label="Cerrar">${IC.x}</button>
   </div>
   ${i.photos.length>1?`<div class="thumbs" id="thumbs">${i.photos.map((s,k)=>`<button type="button" data-k="${k}" aria-label="Ver foto ${k+1}" aria-current="${k===0}"><img src="${s.m}" alt="" loading="lazy"></button>`).join('')}</div>`:''}
   <div class="hero-txt"><h2 id="shTitle">${esc(i.n)}</h2><div class="jpn">${esc(i.jp)} · ${esc(i.city)}</div></div>
   <div class="sh-body">
     <div class="sh-main">
       <div class="tags">${i.plan.map(p=>`<span class="plan ${p}">${PLAN_LABEL[p]}</span>`).join('')}${i.cats.map(c=>`<span class="tag" style="--dc:var(--c-${c})"><span class="dot"></span>${CATS[c]}</span>`).join('')}</div>
       ${i.status?`<div class="statusbox"><b>Aviso:</b> ${esc(i.status)}</div>`:''}
       ${i.check?`<div class="okline">✓ ${esc(i.check)}</div>`:''}
       <p class="lead">${esc(i.d)}</p>
       <p>${esc(i.more)}</p>
       <div><h4>Qué no perderse</h4><ul>${(i.ver||[]).map(v=>`<li>${esc(v)}</li>`).join('')}</ul></div>
       <div class="tipbox"><b>Consejo:</b> ${esc(i.tip)}</div>
       ${videosHtml(id)}
       <div><h4>Enlaces</h4><div class="actions">
         <a class="btn" href="${maps}" target="_blank" rel="noopener">${IC.pin} Cómo llegar (Google Maps)</a>
         <button type="button" class="btn" id="shLink">${IC.link} Copiar enlace</button></div></div>
     </div>
     <aside class="sh-aside">
       <div class="box"><h4>¿Vamos?</h4>${voteHtml(id,true)}<div class="famlist" id="famList" data-id="${id}">${famListHtml(id)}</div></div>
       <dl class="facts"><div><dt>Tiempo</dt><dd>${esc(i.t)}</dd></div><div><dt>Precio</dt><dd>${esc(i.p)}</dd></div><div><dt>Cómo llegar</dt><dd>${esc(i.how)}</dd></div></dl>
       ${miniMap(id)}
       ${ap.length?`<div><h4>En los itinerarios</h4><div class="inplans">${ap.map(({p,d})=>`<span><b style="color:var(--${p.kind==='J'?'shu':'ai'})">${esc(p.short)}</b> · ${dlabel(d.date)}</span>`).join('')}</div></div>`:`<div><h4>En los itinerarios</h4><p style="margin:0;font-size:14px;color:var(--muted)">No está en ningún itinerario: si lo elegís, habría que hacerle hueco en un día libre.</p></div>`}
     </aside>
   </div>
   <div class="sh-foot"><button type="button" class="btn" data-go="${prev.id}">${IC.l} ${esc(short(prev.n))}</button><button type="button" class="btn" data-go="${next.id}">${esc(short(next.n))} ${IC.r}</button></div>`;
  if(!sheet.open){try{sheet.showModal()}catch(e){sheet.setAttribute('open','')}}
  $('#sh').scrollTop=0;const tr=$('#hTrack');tr.scrollLeft=0;
  tr.addEventListener('scroll',()=>{const k=Math.round(tr.scrollLeft/tr.clientWidth);if(k!==shIdx){shIdx=k;updGal()}},{passive:true});
  requestAnimationFrame(placeMini);
  try{history.replaceState(null,'','#p-'+id)}catch(e){}
}
function updGal(){const i=BYID[shId];const c=$('#hCount');if(c)c.textContent=(shIdx+1)+' / '+i.photos.length;document.querySelectorAll('#thumbs button').forEach(b=>b.setAttribute('aria-current',+b.dataset.k===shIdx))}
function goGal(k){const i=BYID[shId];shIdx=(k+i.photos.length)%i.photos.length;const tr=$('#hTrack');tr.scrollTo({left:shIdx*tr.clientWidth,behavior:'smooth'});updGal()}
function closeSheet(){document.querySelectorAll('#sh iframe').forEach(f=>f.remove());if(MINI){MINI.remove();MINI=null}if(sheet.close)sheet.close();else sheet.removeAttribute('open')}
sheet.addEventListener('close',()=>{try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}});
sheet.addEventListener('click',e=>{
  if(e.target===sheet)return closeSheet();
  if(e.target.closest('#shClose'))return closeSheet();
  if(e.target.closest('.hnav.prev'))return goGal(shIdx-1);
  if(e.target.closest('.hnav.next'))return goGal(shIdx+1);
  const t=e.target.closest('#thumbs button');if(t)return goGal(+t.dataset.k);
  const vb=e.target.closest('.vid');if(vb){const id=vb.dataset.vid;if(!/^[\w-]{6,20}$/.test(id))return;const d=document.createElement('div');d.className='vframe';const f=document.createElement('iframe');f.src='https://www.youtube-nocookie.com/embed/'+id+'?autoplay=1&rel=0&modestbranding=1&hl=es';f.title=vb.getAttribute('aria-label');f.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';f.allowFullscreen=true;d.appendChild(f);vb.replaceWith(d);return}
  const g=e.target.closest('[data-go]');if(g){document.querySelectorAll('#sh iframe').forEach(f=>f.remove());return openSheet(g.dataset.go)}
  const tm=e.target.closest('[data-tomap]');if(tm){closeSheet();mapState.region=tm.dataset.tomap;mapState.fit=true;renderMapTabs();$('#mapas').scrollIntoView({behavior:'smooth'});ensureMap().then(renderMap);return}
  if(e.target.closest('#shLink'))copyText(location.href.split('#')[0]+'#p-'+shId,'Enlace copiado');
});
sheet.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')goGal(shIdx-1);if(e.key==='ArrowRight')goGal(shIdx+1)});

/* ================= mapas (Leaflet + OpenStreetMap) ================= */
const MAP_ORDER=Object.keys(REGIONS);
function regionOf(id){const c=COORDS[id];if(!c)return null;for(const r of MAP_ORDER){if(r==='kansai')continue;const b=REGIONS[r].b;if(c[0]>=b[0][0]&&c[0]<=b[1][0]&&c[1]>=b[0][1]&&c[1]<=b[1][1])return r}
  const b=REGIONS.kansai&&REGIONS.kansai.b;return b&&c[0]>=b[0][0]&&c[0]<=b[1][0]&&c[1]>=b[0][1]&&c[1]<=b[1][1]?'kansai':null}
const idsIn=r=>{const b=REGIONS[r].b;return ITEMS.filter(i=>{const c=COORDS[i.id];return c&&c[0]>=b[0][0]&&c[0]<=b[1][0]&&c[1]>=b[0][1]&&c[1]<=b[1][1]}).map(i=>i.id)};
const mapState={region:'tokio',mode:'votes',fit:true};
let LEAF=null,LMAP=null,LLAYER=null,leafP=null;
function loadLeaflet(){if(window.L)return Promise.resolve(window.L);if(leafP)return leafP;
  leafP=new Promise(res=>{const l=document.createElement('link');l.rel='stylesheet';l.href='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';document.head.appendChild(l);
    const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';s.onload=()=>res(window.L);s.onerror=()=>res(null);document.head.appendChild(s)});return leafP}
function ensureMap(){return loadLeaflet().then(L=>{if(!L)return null;if(!LMAP){LMAP=L.map('leafMap',{scrollWheelZoom:false,tap:true});
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© colaboradores de OpenStreetMap'}).addTo(LMAP);LLAYER=L.layerGroup().addTo(LMAP)}return L})}
function renderMapTabs(){$('#mapTabs').innerHTML=MAP_ORDER.map(r=>`<button type="button" class="chip" data-region="${r}" style="--dc:var(--ai)" aria-pressed="${r===mapState.region}">${esc(REGIONS[r].n)}<span class="n">${idsIn(r).length}</span></button>`).join('')}
$('#mapTabs').addEventListener('click',e=>{const b=e.target.closest('[data-region]');if(!b)return;mapState.region=b.dataset.region;mapState.fit=true;renderMapTabs();ensureMap().then(renderMap)});
$('#mapMode').innerHTML='<option value="votes">Votos de la familia</option>'+PLANS.map(p=>`<option value="${p.id}">Itinerario: ${esc(p.name)}</option>`).join('');
$('#mapMode').addEventListener('change',e=>{mapState.mode=e.target.value;renderMap()});
function inPlan(pid,id){return PBY[pid].days.some(d=>(d.links||[]).includes(id))}
function renderMap(){
  const ids=idsIn(mapState.region);const votes=mapState.mode==='votes';
  const cls=id=>votes?statusOf(id):(inPlan(mapState.mode,id)?'in':'out');
  ids.sort((a,b)=>COORDS[a][1]-COORDS[b][1]);const num={};ids.forEach((id,k)=>num[id]=k+1);
  const groups=votes?[['sel','Vamos a verlo','var(--yes)'],['duda','En duda','var(--maybe)'],['pend','Sin votar','#888'],['desc','Descartado','var(--no)']]
    :[['in','Entra en este itinerario','var(--shu)'],['out','No entra','var(--no)']];
  $('#legend').innerHTML=groups.map(([k,l,c])=>`<span><i style="background:${k==='pend'?'#fff':c}"></i>${l}</span>`).join('');
  $('#mapList').innerHTML=`<h3 style="font-size:17px">${esc(REGIONS[mapState.region].n)}</h3>`+groups.map(([k,l,c])=>{const g=ids.filter(id=>cls(id)===k);if(!g.length)return '';
    return `<div><h4><span class="badge" style="background:${k==='pend'?'var(--sunk)':c};color:${k==='pend'?'var(--muted)':'#fff'}">${g.length}</span>${l}</h4><ol>${g.map(id=>`<li><button type="button" data-open="${id}"><span class="num" style="background:${k==='pend'?'#666':c}">${num[id]}</span>${esc(BYID[id].n)}</button></li>`).join('')}</ol></div>`}).join('');
  if(!LMAP||!window.L)return;const L=window.L;LLAYER.clearLayers();
  ids.forEach(id=>{L.marker(COORDS[id],{icon:L.divIcon({className:'',html:`<span class="lpin ${cls(id)}">${num[id]}</span>`,iconSize:[26,26],iconAnchor:[13,13]}),title:BYID[id].n,riseOnHover:true})
    .bindTooltip(short(BYID[id].n),{direction:'top',offset:[0,-12]}).on('click',()=>openSheet(id)).addTo(LLAYER)});
  if(mapState.fit){mapState.fit=false;LMAP.invalidateSize();const pts=ids.map(id=>COORDS[id]);if(pts.length)LMAP.fitBounds(pts,{padding:[30,30],maxZoom:15});else LMAP.fitBounds(REGIONS[mapState.region].b)}
}
new IntersectionObserver((es,o)=>{if(es.some(e=>e.isIntersecting)){o.disconnect();ensureMap().then(renderMap)}},{rootMargin:'300px'}).observe($('#leafMap'));

/* ================= resumen ================= */
const CITY_ORDER=['Tokio','Alrededores de Tokio','Monte Fuji','Hakone','Kioto','Nara','Osaka','Kobe','Himeji','Hiroshima','Miyajima','Miyajima / Hakone','Tokio ↔ Kioto','Tokio → Kioto','Tokio / Nagoya','Todas'];
function renderSummary(){
  const by={};ITEMS.forEach(i=>(by[i.city]=by[i.city]||[]).push(i));
  const cities=Object.keys(by).sort((a,b)=>(CITY_ORDER.indexOf(a)+99)%99-(CITY_ORDER.indexOf(b)+99)%99);
  $('#summary').innerHTML=cities.map(c=>{const g={sel:[],duda:[],desc:[],pend:[]};by[c].forEach(i=>g[statusOf(i.id)].push(i));
    return `<div class="scity"><h3>${esc(c==='Todas'?'En cualquier ciudad':c)}</h3>${[['sel','Elegidos','var(--yes)'],['duda','En duda','var(--maybe)'],['desc','Descartados','var(--no)'],['pend','Sin votar','var(--muted)']].map(([k,l,col])=>g[k].length?`<div class="grp"><b style="color:${col}">${l} · ${g[k].length}</b><ul>${g[k].map(i=>{const vs=votesFor(i.id);const s=vs.filter(x=>x.v==='si').length,n=vs.filter(x=>x.v==='no').length,q=vs.length-s-n;return `<li><button type="button" data-open="${i.id}">${esc(i.n)}</button>${vs.length?`<span class="tv">${s} sí · ${q} quizás · ${n} no</span>`:''}</li>`}).join('')}</ul></div>`:'').join('')}</div>`}).join('');
}
$('#copySum').addEventListener('click',()=>{
  const sel=ITEMS.filter(i=>statusOf(i.id)==='sel'),du=ITEMS.filter(i=>statusOf(i.id)==='duda');
  if(!sel.length&&!du.length){toast('Todavía no hay nada elegido');return}
  const by=a=>{const o={};a.forEach(i=>(o[i.city]=o[i.city]||[]).push(i.n));return Object.entries(o).map(([c,l])=>`${c}:\n`+l.map(n=>'• '+n).join('\n')).join('\n\n')};
  copyText('Japón 2027 · lo elegido\n\n'+by(sel)+(du.length?'\n\nEn duda:\n'+du.map(i=>'• '+i.n).join('\n'):''),'Resumen copiado');
});

/* ================= comprobado ================= */
$('#checks').innerHTML=CHECKS.map(c=>`<div class="chk"><span class="st ${c.s}">${c.s==='bad'?'Ya no está · quitado':c.s==='warn'?'Ha cambiado':'Sigue igual'}</span><h4>${esc(c.t)}</h4><p>${esc(c.d)}</p>${c.id&&BYID[c.id]?`<button type="button" class="btn" data-open="${c.id}" style="justify-self:start">Ver ficha</button>`:''}${c.src?`<a href="${c.src}" target="_blank" rel="noopener">Fuente: ${esc(new URL(c.src).hostname.replace('www.',''))}</a>`:''}</div>`).join('');

/* ================= itinerarios ================= */
const PBY=Object.fromEntries(PLANS.map(p=>[p.id,p]));
let selA='japonal',selB='e3o1';
function coverage(p){const sel=ITEMS.filter(i=>statusOf(i.id)==='sel').map(i=>i.id);if(!sel.length)return null;const inP=sel.filter(id=>inPlan(p.id,id));return [inP.length,sel.length]}
function planCard(p){
  const sel=p.id===selA?'A':p.id===selB?'B':'';const cv=coverage(p);
  const fl=[];if(p.fuji)fl.push('<span>Fuji</span>');if(p.hakone)fl.push('<span>Hakone</span>');if(p.ryokan)fl.push(`<span>Ryokan ${p.ryokan}</span>`);if(p.gap)fl.push('<span class="w">Falta hotel Tokio</span>');
  return `<button type="button" class="pcard ${p.kind}" data-p="${p.id}" ${sel?`data-sel="${sel}"`:''}>${sel?`<span class="selmark" style="background:var(--${sel==='A'?'shu':'ai'})">${sel}</span>`:''}
    <span class="k">${p.kind==='J'?'Agencia':'Por libre'}</span><h4>${esc(p.name)}</h4>
    <span class="tot">${fmt(p.low)} €${p.high?` <small>a ${fmt(p.high)} €</small>`:''}</span>
    <span class="nights">${p.n} noches · ${esc(p.nights)}</span>${cv?`<span class="cover-v">Cubre ${cv[0]} de ${cv[1]} sitios elegidos</span>`:''}<span class="flags">${fl.join('')}</span></button>`;
}
function planPanel(p,w){const c=w==='A'?'shu':'ai';
  return `<div class="panel" style="--pc:var(--${c})"><h3><span style="color:var(--${c})">${w}</span> · ${esc(p.name)}</h3>
   <dl><dt>Noches</dt><dd>${p.n} · ${esc(p.nights)}</dd><dt>Vuelo</dt><dd>${esc(p.flight)}</dd>
   <dt>Hoteles</dt><dd>${p.hotels.map(esc).join('<br>')}${p.kind==='E'?'<br><span style="color:var(--muted);font-size:12.5px">Precios: barato / alto (5★), 2 habitaciones</span>':''}</dd>
   <dt>Total</dt><dd><b>${fmt(p.low)} €</b>${p.high?` (barato) · ${fmt(p.high)} € (alto)`:''} · ${fmt(p.pp)} €/persona${p.food?`<br><span style="color:var(--muted)">Con comidas: ${fmt(p.food)} € a ${fmt(p.foodh)} €</span>`:''}</dd></dl>
   <div class="warns">${p.notes.map(n=>`<div>${esc(n)}</div>`).join('')}</div></div>`}
function renderPlans(soft){
  $('#plans').innerHTML=PLANS.map(planCard).join('');
  if(!soft){const opts=PLANS.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');$('#selA').innerHTML=opts;$('#selB').innerHTML=opts}
  $('#selA').value=selA;$('#selB').value=selB;
  const A=PBY[selA],B=PBY[selB];
  $('#planDetail').innerHTML=planPanel(A,'A')+planPanel(B,'B');
  const dates=[...new Set([...A.days,...B.days].map(d=>d.date))].sort();
  const cell=(p,date,cls)=>{const d=p.days.find(x=>x.date===date);
    if(!d)return `<div class="${cls}" data-l="${cls}"><span class="none">${date<p.days[0].date?'Aún en España':'Ya en España'}</span></div>`;
    return `<div class="${cls}" data-l="${cls}"><span class="cn">${esc(d.city)}</span>${esc(d.text)}${(d.links&&d.links.length)?`<div class="lk">${d.links.filter(id=>BYID[id]).map(id=>`<button type="button" data-open="${id}"><i class="${statusOf(id)}"></i>${esc(short(BYID[id].n))}</button>`).join('')}</div>`:''}</div>`};
  $('#days').innerHTML=`<div class="day h"><div>Fecha</div><div class="A">A · ${esc(A.name)}</div><div class="B">B · ${esc(B.name)}</div></div>`+dates.map(dt=>`<div class="day"><div class="d">${dlabel(dt)}</div>${cell(A,dt,'A')}${cell(B,dt,'B')}</div>`).join('');
}
$('#plans').addEventListener('click',e=>{const b=e.target.closest('.pcard');if(!b)return;const id=b.dataset.p;if(id===selA)return;if(id===selB){selB=selA}selA=id;renderPlans(true)});
$('#selA').addEventListener('change',e=>{selA=e.target.value;renderPlans(true)});
$('#selB').addEventListener('change',e=>{selB=e.target.value;renderPlans(true)});

/* ================= navegación ================= */
const navLinks=[...document.querySelectorAll('nav.sec a')];
const io=new IntersectionObserver(es=>{es.forEach(en=>{if(en.isIntersecting)navLinks.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+en.target.id))})},{rootMargin:'-40% 0px -55% 0px'});
document.querySelectorAll('main section').forEach(s=>io.observe(s));

render();renderTally();renderMapTabs();renderMap();renderSummary();renderPlans();setWho();
function fromHash(){const h=location.hash.slice(1);if(h.startsWith('p-')&&BYID[h.slice(2)])openSheet(h.slice(2))}
fromHash();window.addEventListener('hashchange',fromHash);
sbStart();
