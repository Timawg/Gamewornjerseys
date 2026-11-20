const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const imageVersions = new Map();
const imageURL = (path) => {
  const url = path.split('/').map(encodeURIComponent).join('/');
  const version = imageVersions.get(path);
  return version ? `${url}?v=${version}` : url;
};

function jerseyImage(jersey, path, alt, attributes = '') {
  return `<img src="${imageURL(path)}" alt="${escapeHTML(alt)}" ${attributes}>`;
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let jerseys = [], featured = [], currentSlide = 0, filter = 'all';
let activeCollection = location.hash === '#other-teams' ? 'other' : 'modo';
const collectionOf = jersey => jersey.collection || 'modo';
const teamName = jersey => jersey.team || 'MoDo Hockey';
let paused = reducedMotion.matches, hovering = false, focusWithin = false, timer;
const dialog = $('#jersey-dialog');

const messages = {
  sv: {
    otherTeams: 'Övriga lag', otherTitle: 'ÖVRIGA LAG', otherPageTitle: 'Gamewornjerseys — Övriga lag', otherIntro: 'Fler lag. Fler spelare. Samma passion för hockey.', otherEyebrow: 'ÖVRIGA LAG · SAMLINGEN',
    pageTitle: 'Gamewornjerseys — MoDo', metaDescription: 'Gamewornjerseys – en privat samling matchanvända hockeytröjor från MoDo och andra lag. Utforska spelarna, säsongerna och originalbilderna.',
    home: 'Gamewornjerseys – startsida', brand: 'Gamewornjerseys', collections: 'Samlingar', explore: 'Utforska samlingen', language: 'Språk',
    introEyebrow: 'FRÅN ISEN. TILL SAMLINGEN.', introDescription: 'Spelarna. Säsongerna. Tröjorna som var med.', logo: 'MoDo Hockeys logotyp', location: 'ÖRNSKÖLDSVIK, SVERIGE',
    carousel: 'bildspel', slide: 'bild', spotlight: 'I RAMPLJUSET', closerLook: 'En närmare titt på samlingen', heroLabel: 'Utvalda tröjor. Bläddra med vänster och höger piltangent.',
    loading: 'Laddar samlingen…', chooseJersey: 'Välj utvald tröja', pause: 'Pausa bildspelet', play: 'Starta bildspelet', previous: 'Föregående tröja', next: 'Nästa tröja',
    originals: 'Originaltröjor. Originalbilder. Varje detalj bevarad.', history: 'ETT STYCKE HOCKEYHISTORIA', collection: 'Samlingen', filterPlayers: 'Filtrera efter spelare',
    allJerseys: 'Alla tröjor', morePlayers: 'Fler spelare', searchPlaceholder: 'Sök spelare, lag eller säsong', empty: 'Inga tröjor matchar din sökning. Prova en annan spelare eller säsong.',
    footerLove: 'En personlig samling. En gemensam kärlek till hockeyn.', backToTop: 'Till toppen', independent: 'En fristående samling utan koppling till klubbarna.', closeDetails: 'Stäng tröjdetaljer',
    jersey: 'Tröja', homeJersey: 'Hemmatröja', awayJersey: 'Bortatröja', preseasonJersey: 'Försäsongströja', blueJersey: 'Blå tröja',
    slideLabel: '{index} av {total}: {name}', numberShort: 'Nr', viewJersey: 'Visa tröjan', viewPhoto: 'Visa bild', viewNamedPhoto: 'Visa {name}, bild {index}',
    jerseyPhoto: '{name}, MoDo {season}, tröja, bild {index}', showPlayer: 'Visa {name}, {season}', viewNamedJersey: 'Visa {name} {season}, nummer {number}',
    jerseyAlt: '{name}, {team}-tröja {season}', photos: '{count} bilder', shown: '{count} tröjor visas', count: '{jerseys} tröjor · {players} spelare',
    openOriginalPhoto: 'Öppna originalbild {index} i en ny flik', fullPhoto: '{name} {season}, hela tröjan, bild {index}', photoOf: 'Bild {index} av {total}', openOriginal: 'Öppna original',
    detailEyebrow: 'MODO HOCKEY · SAMLINGEN', jerseyNumber: 'Tröjnummer', season: 'Säsong', unspecified: 'Ej angiven', team: 'Lag',
    detailFallback: 'En närmare titt på den här tröjan ur samlingen. Utforska originalbilderna för att se alla detaljer.', jumpPhotos: 'Gå till en tröjbild', jumpPhoto: 'Gå till bild {index}', photo: 'Bild {index}',
    loadError: 'Det gick inte att ladda samlingen. Uppdatera sidan och försök igen.'
  },
  en: {
    otherTeams: 'Other teams', otherTitle: 'OTHER TEAMS', otherPageTitle: 'Gamewornjerseys — Other teams', otherIntro: 'More teams. More players. The same love of hockey.', otherEyebrow: 'OTHER TEAMS · THE COLLECTION',
    pageTitle: 'Gamewornjerseys — MoDo', metaDescription: 'Gamewornjerseys is a personal collection of game-worn hockey jerseys from MoDo and other teams. Explore the players, seasons and original photographs.',
    home: 'Gamewornjerseys home', brand: 'Gamewornjerseys', collections: 'Collections', explore: 'Explore the collection', language: 'Language',
    introEyebrow: 'FROM THE ICE. INTO THE COLLECTION.', introDescription: 'The players. The seasons. The shirts that were there.', logo: 'MoDo Hockey logo', location: 'ÖRNSKÖLDSVIK, SWEDEN',
    carousel: 'carousel', slide: 'slide', spotlight: 'IN THE SPOTLIGHT', closerLook: 'A closer look at the collection', heroLabel: 'Featured jerseys. Use left and right arrow keys to browse.',
    loading: 'Loading the collection…', chooseJersey: 'Choose featured jersey', pause: 'Pause automatic slideshow', play: 'Play automatic slideshow', previous: 'Previous jersey', next: 'Next jersey',
    originals: 'Original jerseys. Original photographs. Every detail preserved.', history: 'A PIECE OF HOCKEY HISTORY', collection: 'The collection', filterPlayers: 'Filter by player',
    allJerseys: 'All jerseys', morePlayers: 'More players', searchPlaceholder: 'Find a player, team or season', empty: 'No jerseys match your search. Try another player or season.',
    footerLove: 'A personal collection. A shared love of the game.', backToTop: 'Back to top', independent: 'Independent collector’s archive. Not affiliated with the clubs.', closeDetails: 'Close jersey details',
    jersey: 'Jersey', homeJersey: 'Home jersey', awayJersey: 'Away jersey', preseasonJersey: 'Preseason jersey', blueJersey: 'Blue jersey',
    slideLabel: '{index} of {total}: {name}', numberShort: 'No.', viewJersey: 'View the jersey', viewPhoto: 'View photo', viewNamedPhoto: 'View {name} photo {index}',
    jerseyPhoto: '{name} MoDo {season} jersey, photo {index}', showPlayer: 'Show {name}, {season}', viewNamedJersey: 'View {name} {season}, number {number}',
    jerseyAlt: '{name} {season}, {team} jersey', photos: '{count} photos', shown: '{count} jerseys shown', count: '{jerseys} jerseys · {players} players',
    openOriginalPhoto: 'Open original photo {index} in a new tab', fullPhoto: '{name} {season}, full jersey photo {index}', photoOf: 'Photo {index} of {total}', openOriginal: 'Open original',
    detailEyebrow: 'MODO HOCKEY · THE COLLECTION', jerseyNumber: 'Jersey number', season: 'Season', unspecified: 'Not specified', team: 'Team',
    detailFallback: 'A closer look at this jersey from the collection. Explore the original photographs to see every detail.', jumpPhotos: 'Jump to jersey photo', jumpPhoto: 'Jump to photo {index}', photo: 'Photo {index}',
    loadError: 'The collection could not be loaded. Please refresh to try again.'
  }
};
let language = 'sv';
try { if (localStorage.getItem('jersey-language') === 'en') language = 'en'; } catch {}
const t = (key, values = {}) => messages[language][key].replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
const kindKeys = {'Jersey':'jersey', 'Home jersey':'homeJersey', 'Away jersey':'awayJersey', 'Preseason jersey':'preseasonJersey', 'Blue jersey':'blueJersey'};
const kindText = (jersey) => t(kindKeys[jersey.kind] || 'jersey');
const translated = (key, values) => escapeHTML(t(key, values));
let loadFailed = false;

function applyLanguage() {
  document.documentElement.lang = language;
  document.title = t(activeCollection === 'other' ? 'otherPageTitle' : 'pageTitle');
  $('meta[name="description"]').content = t('metaDescription');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  for (const [data, attribute] of [['data-i18n-aria','aria-label'], ['data-i18n-alt','alt'], ['data-i18n-placeholder','placeholder'], ['data-i18n-role','aria-roledescription']]) {
    document.querySelectorAll(`[${data}]`).forEach(el => el.setAttribute(attribute, t(el.getAttribute(data))));
  }
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  if (jerseys.length) { renderHero(); renderGrid(); }
  else if (loadFailed) $('#hero-slides').innerHTML = `<p class="loading">${translated('loadError')}</p>`;
  updateCollectionLayout();
  syncPlayback();
}

function updateCollectionLayout() {
  const other = activeCollection === 'other';
  document.body.dataset.collection = activeCollection;
  $('main').id = other ? 'other-teams' : 'modo';
  $('#page-title').innerHTML = `${other ? translated('otherTitle') : 'MODO'}<span class="title-period">.</span>`;
  $('.intro-description').textContent = t(other ? 'otherIntro' : 'introDescription');
  $('.club-seal').hidden = other;
  $('.featured-section').hidden = other;
  document.querySelectorAll('a[data-collection]').forEach(tab => {
    if(tab.dataset.collection === activeCollection) tab.setAttribute('aria-current','page');
    else tab.removeAttribute('aria-current');
  });
  $('footer > a').href = other ? '#other-teams' : '#modo';
}

function selectCollection(collection) {
  if(activeCollection === collection) return;
  activeCollection = collection;
  filter = 'all';
  $('#search').value = '';
  document.querySelectorAll('[data-filter]').forEach(button => {
    const active = button.dataset.filter === 'all';
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  applyLanguage();
}

function summary(jersey) {
  return jersey.description || [jersey.name, jersey.season, kindText(jersey).toLocaleLowerCase(language), 'MoDo Hockey'].filter(Boolean).join(' · ');
}

function renderHero() {
  $('#hero-slides').innerHTML = featured.map((j, i) => {
    const parts = j.name.split(' '), first = parts.shift(), last = parts.join(' ');
    return `<article class="hero-slide${i === currentSlide ? ' active' : ''}" aria-roledescription="${translated('slide')}" aria-label="${translated('slideLabel',{index:i+1,total:featured.length,name:j.name})}" aria-hidden="${i !== currentSlide}" ${i !== currentSlide ? 'inert' : ''}>
      <div class="hero-copy" data-number="${j.number}"><div class="hero-meta"><span class="season-pill">${escapeHTML(j.season || 'MoDo Hockey')}</span><span>${translated('numberShort')} ${j.number} · ${escapeHTML(kindText(j))}</span></div><h3><span>${escapeHTML(first)}</span><span>${escapeHTML(last)}</span></h3><p class="hero-description">${escapeHTML(summary(j))}</p><button class="hero-view" type="button" data-open="${j.id}">${translated('viewJersey')} <span class="button-square" aria-hidden="true"></span></button></div>
      <div class="hero-photos">${j.images.slice(0,2).map((path,n) => `<button type="button" class="hero-photo-button" data-photo-label="${translated('viewPhoto')}" data-open="${j.id}" data-photo="${n}" aria-label="${translated('viewNamedPhoto',{name:j.name,index:n+1})}">${jerseyImage(j,path,t('jerseyPhoto',{name:j.name,season:j.season,index:n+1}),i ? 'loading="lazy"' : 'fetchpriority="high"')}</button>`).join('')}</div></article>`;
  }).join('');
  $('#carousel-dots').innerHTML = featured.map((j,i) => `<button class="carousel-dot${i===currentSlide?' active':''}" type="button" data-slide="${i}" aria-label="${translated('showPlayer',{name:j.name,season:j.season})}" aria-current="${i===currentSlide}"></button>`).join('');
  moveTo(currentSlide);
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
  const shouldPlay = activeCollection === 'modo' && !paused && !hovering && !focusWithin && !document.hidden && !dialog.open;
  if(shouldPlay && featured.length > 1) timer = setInterval(() => moveTo(currentSlide+1),6500);
  $('#autoplay').setAttribute('aria-label',t(paused?'play':'pause'));
  $('#autoplay').innerHTML = `<span aria-hidden="true">${paused?'▷':'Ⅱ'}</span>`;
}

function renderGrid() {
  const search = $('#search').value.toLocaleLowerCase().trim();
  const collectionJerseys = jerseys.filter(j => collectionOf(j) === activeCollection);
  const visible = collectionJerseys.filter(j => {
    const match = filter === 'all' || (filter === 'other' ? !/Forsberg|Näslund/.test(j.name) : j.name.includes(filter));
    return match && `${j.name} ${j.number} ${j.season} ${j.kind} ${kindText(j)} ${teamName(j)}`.toLocaleLowerCase().includes(search);
  });
  $('#jersey-grid').innerHTML = visible.map(j => `<article class="jersey-card"><button type="button" data-open="${j.id}" aria-label="${translated('viewNamedJersey',{name:j.name,season:j.season,number:j.number})}"><div class="card-photo">${jerseyImage(j,j.images[0],t('jerseyAlt',{name:j.name,season:j.season,team:teamName(j)}),'loading="lazy" decoding="async"')}<span class="card-number">#${j.number}</span><span class="photo-count">${translated('photos',{count:j.images.length})}</span></div><div class="card-meta"><span>${escapeHTML(j.season || t('unspecified'))}</span><span>${escapeHTML(activeCollection === 'other' ? teamName(j) : kindText(j))}</span></div><div class="card-footer"><h3>${escapeHTML(j.name)}</h3><span class="card-view">${translated('viewJersey')}</span></div></button></article>`).join('');
  $('#empty-results').hidden = visible.length !== 0;
  $('#result-status').textContent = t('shown',{count:visible.length});
  $('#collection-count').textContent = t('count',{jerseys:collectionJerseys.length,players:new Set(collectionJerseys.map(j=>j.name)).size});
}

function openJersey(id, photo = 0) {
  const j = jerseys.find(j => j.id === id); if(!j) return;
  $('#detail-content').innerHTML = `<div class="detail-layout"><div class="detail-photos">${j.images.map((path,i) => `<a id="detail-photo-${i}" href="${imageURL(path)}" target="_blank" rel="noopener" aria-label="${translated('openOriginalPhoto',{index:i+1})}">${jerseyImage(j,path,t('fullPhoto',{name:j.name,season:j.season,index:i+1}))}<span>${translated('photoOf',{index:i+1,total:j.images.length})} · ${translated('openOriginal')}</span></a>`).join('')}</div><div class="detail-info"><p class="eyebrow">${translated(collectionOf(j) === 'other' ? 'otherEyebrow' : 'detailEyebrow')}</p><h2 id="detail-title">${escapeHTML(j.name)}</h2><dl class="detail-facts"><div><dt>${translated('jerseyNumber')}</dt><dd>#${j.number}</dd></div><div><dt>${translated('season')}</dt><dd>${escapeHTML(j.season || t('unspecified'))}</dd></div><div><dt>${translated('team')}</dt><dd>${escapeHTML(teamName(j))}</dd></div><div><dt>${translated('jersey')}</dt><dd>${escapeHTML(kindText(j))}</dd></div></dl>${j.description ? `<p class="detail-description">${escapeHTML(j.description)}</p>` : `<p class="detail-muted">${translated('detailFallback')}</p>`}<div class="detail-thumbnails" aria-label="${translated('jumpPhotos')}">${j.images.map((path,i) => `<button type="button" data-detail-photo="${i}" aria-label="${translated('jumpPhoto',{index:i+1})}">${jerseyImage(j,path,t('photo',{index:i+1}))}</button>`).join('')}</div></div></div>`;
  dialog.showModal(); dialog.scrollTop=0; syncPlayback();
  if(photo > 0) document.getElementById(`detail-photo-${photo}`).scrollIntoView({block:'start',behavior:'instant'});
}

document.addEventListener('click', (e) => {
  const opener=e.target.closest('[data-open]');
  if(opener) openJersey(opener.dataset.open,Number(opener.dataset.photo || 0));
  const thumbnail=e.target.closest('[data-detail-photo]');
  if(thumbnail) document.getElementById(`detail-photo-${thumbnail.dataset.detailPhoto}`).scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
});
document.querySelectorAll('a[data-collection]').forEach(tab => tab.addEventListener('click', e => {
  e.preventDefault();
  if(location.hash !== tab.hash) history.pushState(null,'',tab.hash);
  selectCollection(tab.dataset.collection);
  window.scrollTo({top:0,behavior:'instant'});
}));
window.addEventListener('hashchange', () => {
  if(location.hash === '#other-teams') selectCollection('other');
  else if(location.hash === '#modo' || location.hash === '') selectCollection('modo');
});
$('.header-link').addEventListener('click', e => {
  if(activeCollection === 'other') { e.preventDefault(); $('#collection').scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth'}); }
});
$('#hero').addEventListener('click', e => { const button=e.target.closest('[data-slide]'); if(button) moveTo(Number(button.dataset.slide),true); });
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
  language = button.dataset.language;
  try { localStorage.setItem('jersey-language', language); } catch {}
  applyLanguage();
}));
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

applyLanguage();
// Apply the initial collection theme before enabling tab-switch transitions.
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('theme-ready')));

fetch('collection.json', {cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('Unable to load collection');return response.json();}).then(data=>{jerseys=data;imageVersions.clear();jerseys.forEach(j=>Object.entries(j.imageVersions || {}).forEach(([path,version])=>imageVersions.set(path,version)));featured=jerseys.filter(j=>collectionOf(j)==='modo' && Number.isFinite(j.featured)).sort((a,b)=>a.featured-b.featured);renderHero();renderGrid();}).catch(()=>{loadFailed=true;$('#hero-slides').innerHTML=`<p class="loading">${translated('loadError')}</p>`;});
