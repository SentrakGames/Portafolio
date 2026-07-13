function ph(title,sub,c1,c2){
  const svg=`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>
    <rect width='800' height='450' fill='url(#g)'/>
    <rect x='24' y='24' width='752' height='402' fill='none' stroke='#34d17f' stroke-width='2' opacity='.5'/>
    <text x='400' y='215' font-family='Georgia' font-size='46' fill='#fff' text-anchor='middle' font-weight='bold'>${title}</text>
    <text x='400' y='255' font-family='Arial' font-size='20' fill='#34d17f' text-anchor='middle'>${sub}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
const SAMPLE=[
 {title:"Astral Drift",tagline:"Roguelike de naves con física de gravedad",year:"2024",role:"Solo dev",genre:"Roguelike / Arcade",
  tech:["Unity","C#","Shader Graph"],featured:true,github:"https://github.com/sentrak/astral-drift",play:"https://sentrak.itch.io/astral-drift",
  description:"Un roguelike arcade donde pilotas una nave a través de campos gravitatorios procedurales.",
  achievements:["Sistema de gravedad en tiempo real","Generación procedural con semilla compartible","Publicado en itch.io"],
  learnings:"Optimización de simulaciones físicas con particionado espacial.",
  comments:"Empezó como game jam de 48h.",
  media:[{type:"image",src:ph("ASTRAL DRIFT","Gameplay","#1a2540","#0b0d10")},{type:"image",src:ph("ASTRAL DRIFT","Boss","#402a1a","#0b0d10")}]},
];

let PROJECTS=[];
let activeTech="Todos";

async function loadProjects(){
  try{
    const res=await fetch('projects.json',{cache:'no-store'});
    if(!res.ok) throw new Error('no projects.json');
    const data=await res.json();
    if(Array.isArray(data)&&data.length){PROJECTS=data;return;}
    throw new Error('empty');
  }catch(e){
    PROJECTS=SAMPLE;
  }
}

function allTech(){
  const s=new Set();
  PROJECTS.forEach(p=>(p.tech||[]).forEach(t=>s.add(t)));
  return ["Todos",...[...s].sort()];
}

function renderFilters(){
  const f=document.getElementById('filters');
  f.innerHTML='';
  allTech().forEach(t=>{
    const b=document.createElement('button');
    b.className='chip'+(t===activeTech?' active':'');
    b.textContent=t;
    b.onclick=()=>{activeTech=t;renderFilters();renderGrid();};
    f.appendChild(b);
  });
}

function firstImage(p){
  const m=(p.media||[]).find(x=>x.type==='image');
  if(m) return {type:'image',src:m.src};
  const v=(p.media||[]).find(x=>x.type==='video');
  if(v) return {type:'video',src:v.src};
  const y=(p.media||[]).find(x=>x.type==='youtube');
  if(y) return {type:'youtube',src:'https://img.youtube.com/vi/'+y.src+'/hqdefault.jpg'};
  return {type:'image',src:ph(p.title||'Proyecto','','#1b2027','#0b0d10')};
}

function renderGrid(){
  const grid=document.getElementById('grid');
  grid.innerHTML='';
  const list=PROJECTS.filter(p=>activeTech==='Todos'||(p.tech||[]).includes(activeTech));
  if(!list.length){grid.innerHTML='<div class="empty">No hay proyectos con ese filtro todavía.</div>';return;}
  list.forEach((p)=>{
    const idx=PROJECTS.indexOf(p);
    const card=document.createElement('div');
    card.className='card';
    const cover=firstImage(p);
    const nMedia=(p.media||[]).length;
    const coverHTML=cover.type==='video'
      ? `<video src="${cover.src}" muted></video>`
      : `<img src="${cover.src}" alt="${p.title}" loading="lazy">`;
    card.innerHTML=`
      <div class="thumb">
        ${p.featured?'<span class="badge">★ Destacado</span>':''}
        ${coverHTML}
        ${nMedia>1?`<span class="mediacount">▦ ${nMedia}</span>`:''}
      </div>
      <div class="body">
        <h3>${p.title||''}</h3>
        <div class="tag">${p.tagline||''}</div>
        <div class="meta">${(p.tech||[]).slice(0,4).map(t=>`<span class="tk">${t}</span>`).join('')}</div>
      </div>`;
    card.onclick=()=>openModal(idx);
    grid.appendChild(card);
  });
}

let curSlide=0, curMedia=[];

function openModal(i){
  const p=PROJECTS[i];
  curMedia=p.media&&p.media.length?p.media:[{type:'image',src:ph(p.title||'','','#1b2027','#0b0d10')}];
  curSlide=0;
  buildSlides();
  document.getElementById('mbody').innerHTML=buildBody(p);
  document.getElementById('modalBack').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modalBack').classList.remove('open');
  document.getElementById('slides').innerHTML='';
  document.body.style.overflow='';
}

function buildSlides(){
  const wrap=document.getElementById('slides');
  const dots=document.getElementById('dots');
  const thumbs=document.getElementById('thumbs');
  wrap.innerHTML='';dots.innerHTML='';thumbs.innerHTML='';
  const multi=curMedia.length>1;
  document.getElementById('prev').style.display=multi?'grid':'none';
  document.getElementById('next').style.display=multi?'grid':'none';
  dots.style.display=multi?'flex':'none';
  thumbs.style.display=multi?'flex':'none';

  curMedia.forEach((m,idx)=>{
    const s=document.createElement('div');
    s.className='slide'+(idx===0?' active':'');
    s.dataset.idx=idx;s.dataset.type=m.type;s.dataset.src=m.src;
    if(idx===0) s.innerHTML=slideInner(m);
    wrap.appendChild(s);

    if(multi){
      const d=document.createElement('div');
      d.className='dot'+(idx===0?' active':'');
      d.onclick=()=>goTo(idx);dots.appendChild(d);

      const t=document.createElement('div');
      t.className='t'+(idx===0?' active':'');
      t.onclick=()=>goTo(idx);
      if(m.type==='image') t.innerHTML=`<img src="${m.src}" alt="">`;
      else if(m.type==='video') t.innerHTML=`<video src="${m.src}" muted></video><span class="pl">▶</span>`;
      else t.innerHTML=`<img src="https://img.youtube.com/vi/${m.src}/mqdefault.jpg" alt=""><span class="pl">▶</span>`;
      thumbs.appendChild(t);
    }
  });
}
function slideInner(m){
  if(m.type==='image') return `<img src="${m.src}" alt="">`;
  if(m.type==='video') return `<video src="${m.src}" controls playsinline></video>`;
  if(m.type==='youtube') return `<iframe src="https://www.youtube.com/embed/${m.src}?rel=0" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe>`;
  return '';
}
function goTo(idx){
  const slides=[...document.querySelectorAll('.slide')];
  const dots=[...document.querySelectorAll('.dot')];
  const thumbs=[...document.querySelectorAll('.thumbs .t')];
  slides.forEach(s=>{
    if(+s.dataset.idx===idx){
      if(!s.innerHTML) s.innerHTML=slideInner({type:s.dataset.type,src:s.dataset.src});
      s.classList.add('active');
    }else{
      s.classList.remove('active');
      const v=s.querySelector('video');if(v)v.pause();
      if(s.dataset.type==='youtube') s.innerHTML='';
    }
  });
  dots.forEach((d,i)=>d.classList.toggle('active',i===idx));
  thumbs.forEach((t,i)=>t.classList.toggle('active',i===idx));
  curSlide=idx;
}
function next(){goTo((curSlide+1)%curMedia.length);}
function prev(){goTo((curSlide-1+curMedia.length)%curMedia.length);}

function buildBody(p){
  const facts=[];
  if(p.year) facts.push(`<span class="fact"><b>Año</b>${p.year}</span>`);
  if(p.role) facts.push(`<span class="fact"><b>Rol</b>${p.role}</span>`);
  if(p.genre) facts.push(`<span class="fact"><b>Género</b>${p.genre}</span>`);
  (p.tech||[]).forEach(t=>facts.push(`<span class="fact">${t}</span>`));

  let html=`<h2>${p.title||''}</h2>`;
  if(p.tagline) html+=`<p class="mtag">${p.tagline}</p>`;
  if(facts.length) html+=`<div class="mfacts">${facts.join('')}</div>`;
  if(p.description) html+=`<div class="mblock"><h4>Descripción</h4><p>${p.description}</p></div>`;
  if((p.achievements||[]).length) html+=`<div class="mblock"><h4>Logros principales</h4><ul>${p.achievements.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
  if(p.learnings) html+=`<div class="mblock"><h4>Aprendizajes</h4><p>${p.learnings}</p></div>`;
  if(p.comments) html+=`<div class="mblock comment"><h4>Comentario personal</h4><p>${p.comments}</p></div>`;

  const actions=[];
  if(p.github) actions.push(`<a class="btn gold" href="${p.github}" target="_blank" rel="noopener">⌘ Ver código en GitHub</a>`);
  if(p.play) actions.push(`<a class="btn" href="${p.play}" target="_blank" rel="noopener">🎮 Jugar</a>`);
  if(actions.length) html+=`<div class="mactions">${actions.join('')}</div>`;
  return html;
}

document.getElementById('next').onclick=next;
document.getElementById('prev').onclick=prev;
document.getElementById('modalClose').onclick=closeModal;
document.getElementById('modalBack').onclick=(e)=>{if(e.target.id==='modalBack')closeModal();};
document.addEventListener('keydown',(e)=>{
  if(!document.getElementById('modalBack').classList.contains('open'))return;
  if(e.key==='Escape')closeModal();
  if(e.key==='ArrowRight')next();
  if(e.key==='ArrowLeft')prev();
});

(async function init(){
  await loadProjects();
  renderFilters();
  renderGrid();
})();
