const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageURL = (path) => path.split('/').map(encodeURIComponent).join('/');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let jerseys = [], featured = [], currentSlide = 0, filter = 'all';
let paused = reducedMotion.matches, hovering = false, focusWithin = false, timer;
const dialog = $('#jersey-dialog');

function summary(jersey) {
  return jersey.description || [jersey.name, jersey.season, jersey.kind.toLowerCase(), 'MoDo Hockey'].filter(Boolean).join(' · ');
}

function renderHero() {
  $('#hero-slides').innerHTML = featured.map((j, i) => {
    const parts = j.name.split(' '), first = parts.shift(), last = parts.join(' ');
    return `<article class="hero-slide${i === 0 ? ' active' : ''}" aria-roledescription="slide" aria-label="${i+1} of ${featured.length}: ${escapeHTML(j.name)}" aria-hidden="${i !== 0}" ${i !== 0 ? 'inert' : ''}>
      <div class="hero-copy" data-number="${j.number}"><div class="hero-meta"><span class="season-pill">${escapeHTML(j.season || 'MoDo Hockey')}</span><span>No. ${j.number} · ${escapeHTML(j.kind)}</span></div><h3><span>${escapeHTML(first)}</span><span>${escapeHTML(last)}</span></h3><p class="hero-description">${escapeHTML(summary(j))}</p><button class="hero-view" type="button" data-open="${j.id}">View the jersey <span class="button-square" aria-hidden="true"></span></button></div>
      <div class="hero-photos">${j.images.slice(0,2).map((path,n) => `<button type="button" class="hero-photo-button" data-open="${j.id}" data-photo="${n}" aria-label="View ${escapeHTML(j.name)} photo ${n+1}"><img src="${imageURL(path)}" alt="${escapeHTML(j.name)} MoDo ${escapeHTML(j.season)} jersey, photo ${n+1}" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></button>`).join('')}</div></article>`;
  }).join('');
  $('#carousel-dots').innerHTML = featured.map((j,i) => `<button class="carousel-dot${i===0?' active':''}" type="button" data-slide="${i}" aria-label="Show ${escapeHTML(j.name)}, ${escapeHTML(j.season)}" aria-current="${i===0}"></button>`).join('');
  $('#hero').addEventListener('click', (e) => {const button=e.target.closest('[data-slide]'); if(button) moveTo(Number(button.dataset.slide), true);});
  syncPlayback();
}

function moveTo(index, manual = false) {
  currentSlide = (index + featured.length) % featured.length;
  document.querySelectorAll('.hero-slide').forEach((slide,i) => {const active = i === currentSlide; slide.classList.toggle('active',active); slide.setAttribute('aria-hidden',String(!active)); slide.inert = !active;});
  document.querySelectorAll('.carousel-dot').forEach((dot,i) => {dot.classList.toggle('active',i===currentSlide);dot.setAttribute('aria-current',String(i===currentSlide));});
  $('#slide-counter').textContent = `${String(currentSlide+1).padStart(2,'0')} / ${String(featured.length).padStart(2,'0')}`;
  if(manual) syncPlayback();
}

function syncPlayback() {
  clearInterval(timer);
  const shouldPlay = !paused && !hovering && !focusWithin && !document.hidden && !dialog.open;
  if(shouldPlay && featured.length > 1) timer = setInterval(() => moveTo(currentSlide+1),6500);
  $('#autoplay').setAttribute('aria-label',paused?'Play automatic slideshow':'Pause automatic slideshow');
  $('#autoplay').innerHTML = `<span aria-hidden="true">${paused?'▷':'Ⅱ'}</span>`;
}

function renderGrid() {
  const search = $('#search').value.toLocaleLowerCase().trim();
  const visible = jerseys.filter(j => {
    const match = filter === 'all' || (filter === 'other' ? !/Forsberg|Näslund/.test(j.name) : j.name.includes(filter));
    return match && `${j.name} ${j.number} ${j.season} ${j.kind}`.toLocaleLowerCase().includes(search);
  });
  $('#jersey-grid').innerHTML = visible.map(j => `<article class="jersey-card"><button type="button" data-open="${j.id}" aria-label="View ${escapeHTML(j.name)} ${escapeHTML(j.season)}, number ${j.number}"><div class="card-photo"><img src="${imageURL(j.images[0])}" alt="${escapeHTML(j.name)} ${escapeHTML(j.season)} MoDo jersey" loading="lazy" decoding="async"><span class="card-number">#${j.number}</span><span class="photo-count">${j.images.length} photos</span></div><div class="card-meta"><span>${escapeHTML(j.season || 'MoDo Hockey')}</span><span>${escapeHTML(j.kind)}</span></div><div class="card-footer"><h3>${escapeHTML(j.name)}</h3><span class="card-view">View jersey</span></div></button></article>`).join('');
  $('#empty-results').hidden = visible.length !== 0;
  $('#result-status').textContent = `${visible.length} jerseys shown`;
  $('#collection-count').textContent = `${jerseys.length} jerseys · ${new Set(jerseys.map(j=>j.name)).size} players`;
}

function openJersey(id, photo = 0) {
  const j = jerseys.find(j => j.id === id); if(!j) return;
  $('#detail-content').innerHTML = `<div class="detail-layout"><div class="detail-photos">${j.images.map((path,i) => `<a id="detail-photo-${i}" href="${imageURL(path)}" target="_blank" rel="noopener" aria-label="Open original photo ${i+1} in a new tab"><img src="${imageURL(path)}" alt="${escapeHTML(j.name)} ${escapeHTML(j.season)}, full jersey photo ${i+1}"><span>Photo ${i+1} of ${j.images.length} · Open original</span></a>`).join('')}</div><div class="detail-info"><p class="eyebrow">MODO HOCKEY · THE COLLECTION</p><h2 id="detail-title">${escapeHTML(j.name)}</h2><dl class="detail-facts"><div><dt>Jersey number</dt><dd>#${j.number}</dd></div><div><dt>Season</dt><dd>${escapeHTML(j.season || 'Not specified')}</dd></div><div><dt>Team</dt><dd>MoDo Hockey</dd></div><div><dt>Jersey</dt><dd>${escapeHTML(j.kind)}</dd></div></dl>${j.description ? `<p class="detail-description">${escapeHTML(j.description)}</p>` : '<p class="detail-muted">A closer look at this jersey from the collection. Explore the original photographs to see every detail.</p>'}<div class="detail-thumbnails" aria-label="Jump to jersey photo">${j.images.map((path,i) => `<button type="button" data-detail-photo="${i}" aria-label="Jump to photo ${i+1}"><img src="${imageURL(path)}" alt="Photo ${i+1}"></button>`).join('')}</div></div></div>`;
  dialog.showModal(); dialog.scrollTop=0; syncPlayback();
  if(photo > 0) document.getElementById(`detail-photo-${photo}`).scrollIntoView({block:'start',behavior:'instant'});
}

document.addEventListener('click', (e) => {
  const opener=e.target.closest('[data-open]');
  if(opener) openJersey(opener.dataset.open,Number(opener.dataset.photo || 0));
  const thumbnail=e.target.closest('[data-detail-photo]');
  if(thumbnail) document.getElementById(`detail-photo-${thumbnail.dataset.detailPhoto}`).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
});
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',(e)=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',syncPlayback);
$('#next').addEventListener('click',()=>moveTo(currentSlide+1,true));
$('#previous').addEventListener('click',()=>moveTo(currentSlide-1,true));
$('#autoplay').addEventListener('click',()=>{paused=!paused;syncPlayback();});
$('#hero').addEventListener('mouseenter',()=>{hovering=true;syncPlayback();});
$('#hero').addEventListener('mouseleave',()=>{hovering=false;syncPlayback();});
$('#hero').addEventListener('focusin',()=>{focusWithin=true;syncPlayback();});
$('#hero').addEventListener('focusout',(e)=>{if(!$('#hero').contains(e.relatedTarget)){focusWithin=false;syncPlayback();}});
$('#hero').addEventListener('keydown',(e)=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();moveTo(currentSlide+(e.key==='ArrowRight'?1:-1),true);}});
let touchStart;
$('#hero').addEventListener('touchstart',e=>{touchStart={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};},{passive:true});
$('#hero').addEventListener('touchend',e=>{if(!touchStart)return;const dx=e.changedTouches[0].clientX-touchStart.x,dy=e.changedTouches[0].clientY-touchStart.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))moveTo(currentSlide+(dx<0?1:-1),true);touchStart=null;},{passive:true});
document.addEventListener('visibilitychange',syncPlayback);
reducedMotion.addEventListener('change',()=>{paused=reducedMotion.matches;syncPlayback();});
$('#search').addEventListener('input',renderGrid);
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});renderGrid();}));

fetch('collection.json').then(response=>{if(!response.ok)throw new Error('Unable to load collection');return response.json();}).then(data=>{jerseys=data;featured=jerseys.filter(j=>j.featured!==null).sort((a,b)=>a.featured-b.featured);renderHero();renderGrid();}).catch(()=>{$('#hero-slides').innerHTML='<p class="loading">The collection could not be loaded. Please refresh to try again.</p>';});
