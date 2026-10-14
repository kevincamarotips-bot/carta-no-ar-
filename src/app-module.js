/* =========================================================
   APP (Android): fichas do dia, Clube do Mágico, anúncios AdMob,
   loja na aba Loja (cresce com a fase da jornada) e ofertas com X depois de 5 segundos.
   Este bloco é inserido dentro do script do jogo por tools/build_app.py,
   então enxerga S, P, CASINOS, phaseMult, toast, renderAll, applySkin e o resto do jogo.
   ========================================================= */
const CFG = window.APP_CONFIG || {};
const NATIVE = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const AdMob = NATIVE && Capacitor.Plugins ? Capacitor.Plugins.AdMob : null;

const AD_UNITS = {
  banner:       'ca-app-pub-4843616770222084/5170472095', // banner_mesa
  interstitial: 'ca-app-pub-4843616770222084/4664039784', // entre rodadas
  rewarded:     'ca-app-pub-4843616770222084/3087234239', // fichas_extras
};
/* ---- economia (tabela no README). Valores da fase 1; a loja multiplica pela fase (PHASE_MULT). ---- */
const DAILY_CHIPS = 1000;          // presente grátis, uma vez por dia
const REWARD_CHIPS = 200;          // por vídeo premiado
const REWARDS_PER_DAY = 5;
const CLUB_CHIPS = 2000;           // Clube do Mágico, por dia, não acumula
const INTERSTITIAL_EVERY = 8;      // rodadas entre anúncios de tela cheia
const NOADS_OFFER_EVERY = 3;       // a cada 3 anúncios de tela cheia, oferece "Sem anúncios"
const THEMES_OFFER_EVERY = 3;      // a cada 3 aberturas do app, oferece os visuais depois de uma vitória
const OFFER_LOCK_SECONDS = 5;      // X só aparece depois disso
const DAILY_SPEND_CAP = 20;        // R$ por dia em pacotes de fichas
const NOADS_ID = 'sem_anuncios';
const SUB_ID = 'clube_magico';
const SKINS_ALL_ID = 'visuais_todos';
const skinProduct = k => 'visual_' + k;
const PACKS = [
  {id: 'fichas_1000',  chips: 1000,  brl: 1.99, n: 'Punhado'},
  {id: 'fichas_5000',  chips: 5000,  brl: 4.99, n: 'Saquinho'},
  {id: 'fichas_12000', chips: 12000, brl: 9.99, n: 'Baú'},
];
const FALLBACK_PRICE = {sem_anuncios: 'R$ 9,90', visuais_todos: 'R$ 14,90', clube_magico: 'R$ 29,90'};
PACKS.forEach(p => FALLBACK_PRICE[p.id] = 'R$ ' + p.brl.toFixed(2).replace('.', ','));
SKINS.forEach(s => { if (s.k !== 'original') FALLBACK_PRICE[skinProduct(s.k)] = 'R$ 4,90'; });
const fmtBRL = v => v.toFixed(2).replace('.', ',');
const phaseIndex = () => { let i = 0; CASINOS.forEach((c, j) => { if (P.unlocked.includes(c.k)) i = j; }); return i; };
const scaled = base => base * phaseMult();

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let A = {day: '', dailyClaimed: false, clubClaimed: false, rewardsToday: 0, spentToday: 0, owned: [], roundsSinceAd: 0,
         adult: false, memberUntil: 0, opens: 0, adsShown: 0, wandDay: ''};
try { Object.assign(A, JSON.parse(localStorage.getItem('cartaNoAr.app') || '{}')); } catch(e){}
function saveA(){ try { localStorage.setItem('cartaNoAr.app', JSON.stringify(A)); } catch(e){} }
function rollDay(){ if (A.day !== today()){ A.day = today(); A.dailyClaimed = false; A.clubClaimed = false; A.rewardsToday = 0; A.spentToday = 0; saveA(); } }
rollDay();

const owns = id => A.owned.includes(id);
// membership is confirmed with Google Play on every start; the cached date covers short offline spells
const isMember = () => A.memberUntil > Date.now();
function setMember(active){
  if (active){ A.memberUntil = Math.max(A.memberUntil, Date.now() + 3 * 864e5); }
  else A.memberUntil = 0;
  saveA();
}
const noAds = () => owns(NOADS_ID) || isMember();
const skinOwned = k => k === 'original' || owns(SKINS_ALL_ID) || owns(skinProduct(k));
const allSkinsOwned = () => SKINS.every(s => skinOwned(s.k));
// the bundle opens every look right away; a single look is sold on its own stage
function appSkinOpen(s){ return owns(SKINS_ALL_ID); }
function grantOwned(id){ if (!owns(id)){ A.owned.push(id); saveA(); } }

/* ---------- store (Google Play Billing via cordova-plugin-purchase) ---------- */
let storeReady = false;
function priceOf(id){
  try {
    if (window.CdvPurchase && storeReady){
      const p = CdvPurchase.store.get(id, CdvPurchase.Platform.GOOGLE_PLAY);
      let price = p && p.pricing && p.pricing.price;
      if (!price && p && p.offers && p.offers[0] && p.offers[0].pricingPhases && p.offers[0].pricingPhases[0]) price = p.offers[0].pricingPhases[0].price;
      if (price) return price;
    }
  } catch(e){}
  return FALLBACK_PRICE[id] || '';
}
function refreshAll(){ renderShop(); renderSkins(); renderGift(); renderControls(); if (!$('promoModal').hidden) renderPromo(); }
function deliver(id){
  const pack = PACKS.find(p => p.id === id);
  if (pack){
    const chips = scaled(pack.chips);
    S.balance += chips; A.spentToday += pack.brl; saveA();
    winJingle(true); chipRain(30); animateBalance();
    setResult('Fichas na mesa!', `+${fmt(chips)} fichas`, 'win', 'Boa sorte na próxima carta.');
    save(); toast(`+${fmt(chips)} fichas`);
  } else if (id === SUB_ID){
    setMember(true); hideBanner(); unlockSound(); chipRain(30);
    toast('Bem-vindo ao Clube do Mágico!');
    closePromo();
  } else {
    grantOwned(id); unlockSound();
    if (id === NOADS_ID){ hideBanner(); toast('Anúncios removidos. Obrigado!'); closePromo(); }
    else {
      const k = id === SKINS_ALL_ID ? null : id.replace('visual_', '');
      toast(k ? 'Visual liberado!' : 'Todos os visuais liberados!');
      if (k) applySkin(k, false);
      if (allSkinsOwned() || k) closePromo();
    }
  }
  refreshAll();
}
function initStore(){
  const run = () => {
    if (!window.CdvPurchase) return;
    const {store, ProductType, Platform} = CdvPurchase;
    store.register([
      {id: NOADS_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY},
      {id: SUB_ID, type: ProductType.PAID_SUBSCRIPTION, platform: Platform.GOOGLE_PLAY},
      {id: SKINS_ALL_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY},
      ...SKINS.filter(s => s.k !== 'original').map(s => ({id: skinProduct(s.k), type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY})),
      ...PACKS.map(p => ({id: p.id, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY})),
    ]);
    store.when()
      .productUpdated(() => { syncOwned(); refreshAll(); })
      .approved(tx => { tx.products.forEach(p => deliver(p.id)); tx.finish(); });
    store.error(err => { if (err && err.code !== CdvPurchase.ErrorCode.PAYMENT_CANCELLED) console.warn('loja', err); });
    store.initialize([Platform.GOOGLE_PLAY]).then(() => { storeReady = true; syncOwned(); refreshAll(); });
  };
  if (window.CdvPurchase) run(); else document.addEventListener('deviceready', run, {once: true});
}
function syncOwned(){
  if (!window.CdvPurchase) return;
  const ids = [NOADS_ID, SKINS_ALL_ID, ...SKINS.filter(s => s.k !== 'original').map(s => skinProduct(s.k))];
  ids.forEach(id => { try { if (CdvPurchase.store.owned(id)) grantOwned(id); } catch(e){} });
  if (storeReady){ try { const m = CdvPurchase.store.owned(SUB_ID); if (m) setMember(true); else if (A.memberUntil) setMember(false); } catch(e){} }
  if (noAds()) hideBanner(); else showBanner();
}
async function buy(id){
  const pack = PACKS.find(p => p.id === id);
  if (pack && !canBuyPack(pack)) return;
  if (!NATIVE || !window.CdvPurchase){
    toast('Compra simulada: no navegador nada é cobrado.');
    deliver(id); return;
  }
  const p = CdvPurchase.store.get(id, CdvPurchase.Platform.GOOGLE_PLAY);
  if (!storeReady || !p || !p.canPurchase){ toast('A loja do Google Play não respondeu. Tente de novo em instantes.'); return; }
  const err = await p.getOffer().order();
  if (err && err.code !== CdvPurchase.ErrorCode.PAYMENT_CANCELLED) toast('A compra não foi concluída. Nada foi cobrado.');
}
// packs open only when the chips no longer cover the minimum bet of the current stage
const isBroke = () => S.balance < casino().min;
function canBuyPack(pack){
  rollDay();
  if (!isBroke()){ toast('Os pacotes liberam quando suas fichas não pagam mais a aposta mínima do palco.'); return false; }
  if (A.spentToday + pack.brl > DAILY_SPEND_CAP + 0.001){ toast(`Você chegou ao limite de R$ ${DAILY_SPEND_CAP} em fichas hoje. Volte amanhã!`); return false; }
  return true;
}

/* ---------- ads (AdMob) ---------- */
let bannerOn = false, interstitialReady = false, rewardedReady = false;
const adOpts = id => ({adId: id, isTesting: !!CFG.adsTest});
const setBannerSpace = px => document.documentElement.style.setProperty('--banner-h', px + 'px');
async function initAds(){
  if (!AdMob) return;
  try {
    await AdMob.initialize({initializeForTesting: !!CFG.adsTest});
    try {
      const info = await AdMob.requestConsentInfo();
      if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
    } catch(e){}
    AdMob.addListener('bannerAdSizeChanged', size => { const h = size && size.height; if (h > 0 && bannerOn) setBannerSpace(Math.ceil(h)); });
    showBanner(); prepInterstitial(); prepRewarded();
  } catch(e){ console.warn('admob', e); }
}
async function showBanner(){
  if (!AdMob || noAds() || bannerOn) return;
  try {
    await AdMob.showBanner({...adOpts(AD_UNITS.banner), adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0});
    bannerOn = true;
    // reserve room right away; the size event refines it if it arrives
    setBannerSpace(Math.max(66, Math.round(innerWidth * 0.17)));
  } catch(e){}
}
async function hideBanner(){
  setBannerSpace(0);
  if (!AdMob || !bannerOn) return;
  try { await AdMob.removeBanner(); } catch(e){}
  bannerOn = false;
}
async function prepInterstitial(){ if (!AdMob || noAds()) return; try { await AdMob.prepareInterstitial(adOpts(AD_UNITS.interstitial)); interstitialReady = true; } catch(e){ interstitialReady = false; } }
async function prepRewarded(){ if (!AdMob) return; try { await AdMob.prepareRewardVideoAd(adOpts(AD_UNITS.rewarded)); rewardedReady = true; } catch(e){ rewardedReady = false; } }

const idle = () => !S.busy && !S.gamble && $('promoModal').hidden && !$('stage').classList.contains('full');
function countAdShown(){
  A.adsShown++; A.roundsSinceAd = 0; saveA();
  if (A.adsShown % NOADS_OFFER_EVERY === 0 && !noAds()) setTimeout(() => openPromo('noads'), 700);
}
function appAfterRound(){
  const won = S.history[0] && S.history[0].win;
  if (themesArmed && won){ themesArmed = false; whenIdle(() => openPromo('themes'), 2400); }
  if (noAds()) return;
  A.roundsSinceAd++; saveA();
  if (A.roundsSinceAd < INTERSTITIAL_EVERY) return;
  setTimeout(async () => {
    if (!idle()) return; // nunca no meio de uma jogada; tenta de novo na próxima rodada
    if (!AdMob){ toast('Anúncio de tela cheia (simulado no navegador)'); countAdShown(); return; }
    if (!interstitialReady){ prepInterstitial(); return; }
    try { await AdMob.showInterstitial(); countAdShown(); } catch(e){}
    interstitialReady = false; prepInterstitial();
  }, 2600);
}
function whenIdle(fn, delay){ setTimeout(function again(){ if (idle()) fn(); else setTimeout(again, 1500); }, delay); }
async function watchReward(){
  rollDay();
  if (A.rewardsToday >= REWARDS_PER_DAY){ toast('Você já assistiu todos os vídeos de hoje. Volte amanhã!'); return; }
  let ok = false;
  if (!AdMob){ toast('Vídeo simulado no navegador.'); ok = true; }
  else if (!rewardedReady){ toast('O vídeo ainda está carregando. Tente em alguns segundos.'); prepRewarded(); return; }
  else {
    try { const r = await AdMob.showRewardVideoAd(); ok = !!r; } catch(e){ ok = false; }
    rewardedReady = false; prepRewarded();
  }
  if (!ok) return;
  A.rewardsToday++; saveA();
  const chips = scaled(REWARD_CHIPS);
  S.balance += chips; save(); animateBalance(); winJingle(false); chipRain(14);
  setResult('Valeu por assistir!', `+${fmt(chips)} fichas`, 'win', `Restam ${REWARDS_PER_DAY - A.rewardsToday} vídeos hoje.`);
  toast(`+${fmt(chips)} fichas`);
  refreshAll();
}

/* ---------- free chips ---------- */
function claimClub(){
  rollDay(); if (!isMember() || A.clubClaimed) return;
  A.clubClaimed = true; saveA();
  const chips = scaled(CLUB_CHIPS);
  S.balance += chips; save(); animateBalance(); winJingle(true); chipRain(30);
  setResult('Clube do Mágico', `+${fmt(chips)} fichas`, 'win', 'Amanhã tem mais esperando por você.');
  toast(`+${fmt(chips)} fichas do Clube`);
  refreshAll();
}
function claimDaily(){
  rollDay(); if (A.dailyClaimed) return;
  A.dailyClaimed = true; saveA();
  const chips = scaled(DAILY_CHIPS);
  S.balance += chips; save(); animateBalance(); winJingle(false); chipRain(18);
  setResult('Abracadabra!', `+${fmt(chips)} fichas`, 'win', 'Amanhã o mágico traz mais.');
  toast(`+${fmt(chips)} fichas`);
  refreshAll();
}
function appRenderGift(){
  rollDay();
  const b = $('bGift'); if (!b) return;
  const title = b.querySelector('b'), desc = b.querySelector('span');
  b.disabled = S.busy;
  const set = (t, d, cost) => { title.textContent = t; desc.textContent = d; $('bGiftCost').textContent = cost; };
  if (isMember() && !A.clubClaimed) set('Fichas do Clube', `${fmt(scaled(CLUB_CHIPS))} fichas do Clube hoje.`, 'Pegar agora');
  else if (!A.dailyClaimed) set('Fichas do dia', `${fmt(scaled(DAILY_CHIPS))} fichas grátis todo dia.`, 'Pegar agora');
  else if (A.rewardsToday < REWARDS_PER_DAY) set('Vídeo premiado', `Assista e ganhe ${fmt(scaled(REWARD_CHIPS))} fichas.`, `${REWARDS_PER_DAY - A.rewardsToday} hoje`);
  else { set('Volte amanhã', 'Novas fichas grátis à meia-noite.', 'Amanhã'); b.disabled = true; }
}
function appOpenGift(){
  rollDay();
  if (isMember() && !A.clubClaimed) return claimClub();
  if (!A.dailyClaimed) return claimDaily();
  watchReward();
}

/* ---------- Clube perk: one free Varinha a day, covering up to 10 minimum bets ---------- */
function appWandDiscount(){ return isMember() && A.wandDay !== today() ? casino().min * 10 : 0; }
function appUseFreeWand(){ A.wandDay = today(); saveA(); }

/* ---------- strip on the Mesa when chips run low ---------- */
const CHEST_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="#3a2306" stroke-width="2" stroke-linejoin="round"><path d="M3 10h18v10H3z"/><path d="M3 10a9 5 0 0 1 18 0"/><path d="M10 13h4v3h-4z"/></svg>';
const PLAY_SVG = '<svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>';
function appRenderOffer(low, broke){
  const el = $('offerStrip');
  $('wandPerk').hidden = isMember();
  if (!low || MODE === 'live'){ el.hidden = true; return; }
  rollDay();
  el.hidden = false; el.className = 'offer-strip' + (broke ? ' broke' : '');
  const vidLeft = REWARDS_PER_DAY - A.rewardsToday, vid = fmt(scaled(REWARD_CHIPS));
  if (broke){
    const canBuy = DAILY_SPEND_CAP - A.spentToday >= PACKS[0].brl;
    el.innerHTML = `<span class="os-tx"><b>Suas fichas acabaram</b><small>${canBuy ? `Pacotes liberados · até R$ ${DAILY_SPEND_CAP} por dia` : 'Você chegou ao limite de compras de hoje'}</small></span>
      ${canBuy ? `<div class="os-packs">${PACKS.map((p, j) => `<button class="os-pack ${j === 2 ? 'best' : ''}" data-buy="${p.id}" ${A.spentToday + p.brl > DAILY_SPEND_CAP + 0.001 ? 'aria-disabled="true"' : ''}>${j === 2 ? '<em>Mais fichas</em>' : ''}<b>${fmt(scaled(p.chips))}</b><span>${priceOf(p.id)}</span></button>`).join('')}</div>` : ''}
      ${!A.dailyClaimed ? `<button class="os-link" data-act="daily">ou pegue suas ${fmt(scaled(DAILY_CHIPS))} fichas do dia</button>` : vidLeft > 0 ? `<button class="os-link" data-act="video">ou assista um vídeo e ganhe ${vid} grátis</button>` : ''}`;
  } else {
    el.innerHTML = `<span class="os-ic" aria-hidden="true">${CHEST_SVG}</span><span class="os-tx"><b>Fichas acabando</b><small>Ganhe mais sem gastar nada.</small></span>
      ${!A.dailyClaimed ? `<button class="os-btn" data-act="daily">+${fmt(scaled(DAILY_CHIPS))}</button>` : vidLeft > 0 ? `<button class="os-btn" data-act="video">${PLAY_SVG}+${vid}</button>` : ''}
      ${isMember() ? '' : '<button class="os-btn ghost" data-go="loja">Clube</button>'}`;
  }
}

/* ---------- shop (Loja tab) ---------- */
function phaseHtml(){
  const i = phaseIndex(), c = CASINOS[i], next = CASINOS[i + 1];
  const steps = CASINOS.map((x, j) => `<span class="ph-step ${j < i ? 'done' : j === i ? 'here' : ''}"><i>${j + 1}</i><small>×${PHASE_MULT[j]}</small></span>`).join('');
  const nextHtml = next
    ? `<p class="ph-next">No <b>${next.n}</b> tudo na loja rende <b>×${PHASE_MULT[i + 1]}</b>. Entrada: ${fmt(next.cost)} fichas.</p>
       <div class="cs-progress"><i style="width:${Math.min(100, S.balance / next.cost * 100).toFixed(1)}%"></i></div>
       <button class="pill-btn ghost" data-go="jornada">Ver a jornada</button>`
    : '<p class="ph-next">Você chegou ao palco final. A loja já rende o máximo.</p>';
  return `<div class="card ph-card">
      <p class="eyebrow"><span>Sua loja cresce com a jornada</span><span>Fase ${i + 1}</span></p>
      <div class="ph-head"><b>${c.n}</b><span class="ph-mult">×${phaseMult()}</span></div>
      <p class="ph-sub">Fichas do dia, vídeos, Clube e pacotes rendem ${phaseMult() === 1 ? 'o valor base' : `${phaseMult()} vezes o valor base`} nesta fase.</p>
      <div class="ph-steps">${steps}</div>
      ${nextHtml}
    </div>`;
}
function packsHtml(){
  const broke = isBroke();
  return `<div class="packs">${PACKS.map((p, j) => {
    const can = broke && A.spentToday + p.brl <= DAILY_SPEND_CAP + 0.001;
    return `<button class="pack ${j === 2 ? 'best' : ''}" data-buy="${p.id}" ${can ? '' : 'aria-disabled="true"'}>
      ${j === 2 ? '<span class="pk-tag">Mais fichas</span>' : ''}
      <span class="chip mini-chip" style="--c:var(--amber);width:28px;height:28px"></span>
      <small>${p.n}</small><b>${fmt(scaled(p.chips))}</b><em>${priceOf(p.id)}</em></button>`;
  }).join('')}</div>`;
}
function clubHtml(){
  if (isMember()) return `<div class="club on">
      <div class="club-top"><b>Clube do Mágico</b><span class="tag ok">ativo</span></div>
      <span>${fmt(scaled(CLUB_CHIPS))} fichas todo dia nesta fase, 1 Varinha grátis por dia e nenhum anúncio.</span>
      ${A.clubClaimed ? '<em class="club-done">Fichas de hoje já recebidas. Volte amanhã!</em>' : `<button class="buy wide" data-act="club">Pegar ${fmt(scaled(CLUB_CHIPS))} fichas de hoje</button>`}
    </div>`;
  return `<div class="club">
      <div class="club-top"><b>Clube do Mágico</b><span class="tag">assinatura</span></div>
      <ul><li><b>${fmt(scaled(CLUB_CHIPS))} fichas</b> todo dia, crescendo com a sua fase</li><li>1 Varinha Mágica grátis por dia</li><li>Sem banner e sem anúncios entre rodadas</li><li>Cancele quando quiser no Google Play</li></ul>
      <button class="buy wide" data-buy="${SUB_ID}">Assinar por ${priceOf(SUB_ID)}/mês</button>
    </div>`;
}
function skinCardsHtml(){
  return `<div class="skin-mini">${SKINS.filter(s => s.k !== 'original').map(s => {
    const ph = skinPhase(s), open = skinOpen(s), own = skinOwned(s.k);
    const label = own ? (s.k === SKIN ? 'Em uso' : open ? 'Usar' : 'Seu') : open ? priceOf(skinProduct(s.k)) : `Fase ${CASINOS.indexOf(ph) + 1}`;
    return `<button class="sm ${open ? '' : 'locked'} ${s.k === SKIN ? 'on' : ''}" data-skin="${s.k}" data-sm="${s.k}">
      <span class="sm-pv"><span class="mb"></span></span>
      <b>${s.n}</b><em>${label}</em>
    </button>`;
  }).join('')}</div>`;
}
function renderShop(){
  const el = $('lojaBody'); if (!el || VIEW !== 'loja') return;
  rollDay();
  const left = Math.max(0, DAILY_SPEND_CAP - A.spentToday), broke = isBroke();
  el.innerHTML = `
    ${phaseHtml()}
    ${clubHtml()}
    <p class="eyebrow sheet-sub"><span>Fichas grátis</span></p>
    <div class="free">
      <button class="free-row" data-act="daily" ${A.dailyClaimed ? 'disabled' : ''}>
        <span><b>Fichas do dia</b><small>${fmt(scaled(DAILY_CHIPS))} grátis, uma vez por dia</small></span><em>${A.dailyClaimed ? 'Amanhã' : 'Pegar'}</em></button>
      <button class="free-row" data-act="video" ${A.rewardsToday >= REWARDS_PER_DAY ? 'disabled' : ''}>
        <span><b>Vídeo premiado</b><small>+${fmt(scaled(REWARD_CHIPS))} por vídeo · ${REWARDS_PER_DAY - A.rewardsToday} restantes hoje</small></span><em>${A.rewardsToday >= REWARDS_PER_DAY ? 'Amanhã' : 'Assistir'}</em></button>
    </div>
    <p class="eyebrow sheet-sub"><span>Pacotes de fichas</span><span>R$ ${fmtBRL(A.spentToday)} de R$ ${DAILY_SPEND_CAP} hoje</span></p>
    ${packsHtml()}
    <p class="panel-note">${broke ? (left >= PACKS[0].brl ? `Suas fichas não pagam mais a aposta mínima ${casino().em}: os pacotes estão liberados até R$ ${fmtBRL(left)} hoje.` : 'Você chegou ao limite de fichas compradas hoje.') : `Os pacotes liberam quando suas fichas não pagam a aposta mínima do palco (${fmt(casino().min)}), com limite de R$ ${DAILY_SPEND_CAP} por dia.`}</p>
    <p class="eyebrow sheet-sub"><span>Visuais da jornada</span><span>um por palco</span></p>
    ${skinCardsHtml()}
    ${allSkinsOwned() ? '' : `<button class="bundle" data-buy="${SKINS_ALL_ID}"><b>Todos os 5 visuais agora</b><span>Use todos sem esperar a jornada · ${priceOf(SKINS_ALL_ID)}</span></button>`}
    <p class="eyebrow sheet-sub"><span>Sem anúncios</span></p>
    <div class="shop-row">
      <div><b>Remover anúncios</b><span>Compra única. Os vídeos premiados continuam opcionais.</span></div>
      ${noAds() ? '<em class="owned">Ativo</em>' : `<button class="buy" data-buy="${NOADS_ID}">${priceOf(NOADS_ID)}</button>`}
    </div>
    <p class="panel-note">A assinatura renova todo mês até você cancelar no Google Play. Fichas não têm valor em dinheiro e não podem ser sacadas, trocadas nem transferidas.</p>
    <button class="restore" data-act="restore">Restaurar compras</button>`;
}

/* ---------- offer pop-ups: no close button for the first 5 seconds, at most one per session ---------- */
let promoKind = null, promoTimer = null, offersThisSession = 0, themesArmed = false;
function renderPromo(){
  const el = $('promoBody');
  if (promoKind === 'noads'){
    el.innerHTML = `
      <div class="promo-art noads"><span class="no-sign">AD</span></div>
      <h3 class="promo-title">Jogue sem interrupções</h3>
      <p class="promo-text">Tire o banner e os anúncios entre rodadas para sempre. Os vídeos premiados continuam opcionais, para quando você quiser fichas extras.</p>
      <button class="buy wide big" data-buy="${NOADS_ID}">Remover anúncios por ${priceOf(NOADS_ID)}</button>
      <div class="promo-or"><span>ou</span></div>
      <button class="club-cta" data-buy="${SUB_ID}"><b>Clube do Mágico</b><span>${fmt(scaled(CLUB_CHIPS))} fichas por dia, 1 Varinha grátis e sem anúncios · ${priceOf(SUB_ID)}/mês</span></button>`;
  } else {
    const c = casino(), s = SKINS.find(x => x.phase === c.k);
    const feature = s && !skinOwned(s.k) ? s : null;
    el.innerHTML = `
      <h3 class="promo-title">${feature ? `O visual ${c.em}` : 'Visuais da jornada'}</h3>
      <p class="promo-text">${feature ? `${feature.n}: ${feature.d} Troca o palco, as fichas, o verso da carta e a mão do mágico.` : 'Cada palco tem um visual exclusivo. Leve todos de uma vez e use já, sem esperar a jornada.'}</p>
      ${feature ? `<div class="promo-skin" data-skin="${feature.k}"><span class="sm-pv"><span class="mb"></span></span></div>
      <button class="buy wide big" data-buy="${skinProduct(feature.k)}">${feature.n} por ${priceOf(skinProduct(feature.k))}</button>
      <div class="promo-or"><span>ou</span></div>` : skinCardsHtml()}
      ${allSkinsOwned() ? '' : `<button class="club-cta" data-buy="${SKINS_ALL_ID}"><b>Todos os 5 visuais</b><span>Use todos agora · ${priceOf(SKINS_ALL_ID)}</span></button>`}`;
  }
}
function openPromo(kind){
  if (!A.adult || A.opens < 2 || offersThisSession >= 1 || !$('promoModal').hidden) return; // nunca na primeira sessão
  if (kind === 'noads' && noAds()) return;
  if (kind === 'themes' && allSkinsOwned()) return;
  offersThisSession++;
  promoKind = kind; renderPromo();
  const modal = $('promoModal'), x = $('promoClose'), ring = $('promoWait');
  modal.hidden = false; x.hidden = true; ring.hidden = false; shimmer(5, 988);
  let left = OFFER_LOCK_SECONDS;
  $('promoCount').textContent = left;
  ring.style.setProperty('--p', 1);
  clearInterval(promoTimer);
  promoTimer = setInterval(() => {
    left--;
    $('promoCount').textContent = Math.max(left, 0);
    ring.style.setProperty('--p', Math.max(left, 0) / OFFER_LOCK_SECONDS);
    if (left <= 0){ clearInterval(promoTimer); ring.hidden = true; x.hidden = false; }
  }, 1000);
}
function closePromo(){
  clearInterval(promoTimer); $('promoModal').hidden = true; promoKind = null;
}

function skinLabel(s){
  if (s.k === SKIN) return 'Em uso';
  if (skinOwned(s.k)) return 'Toque para usar';
  return priceOf(skinProduct(s.k));
}
function appPickSkin(k){
  if (skinOwned(k)){ applySkin(k, true); refreshAll(); return; }
  buy(skinProduct(k));
}

/* ---------- start ---------- */
function appInit(){
  document.body.classList.add('app-build');
  const solo = document.querySelector('.mode[data-mode="solo"]');
  solo.querySelector('b').textContent = 'Jogar';
  solo.querySelector('span:not(.glyph)').textContent = 'Toque para confirmar que você tem 18 anos ou mais e entrar na mesa.';
  solo.querySelector('em').textContent = `${fmt(DAILY_CHIPS)} fichas grátis por dia`;
  solo.addEventListener('click', () => { if (!A.adult){ A.adult = true; A.opens = 1; saveA(); } });
  if (!skinOwned(SKIN) || !skinOpen(SKINS.find(s => s.k === SKIN))) applySkin('original', false);
  $('skinNote').textContent = 'Cada palco da jornada vende um visual exclusivo. O pacote com todos libera os cinco na hora.';
  $('lojaSub').textContent = 'Fichas, Clube do Mágico, visuais e sem anúncios.';
  $('promoClose').onclick = () => closePromo();
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-act]');
    if (act && !act.disabled){
      const a = act.dataset.act;
      if (a === 'club') claimClub();
      if (a === 'daily') claimDaily();
      if (a === 'video') watchReward();
      if (a === 'restore'){
        if (window.CdvPurchase && storeReady) CdvPurchase.store.restorePurchases().then(() => { syncOwned(); refreshAll(); toast('Compras restauradas.'); });
        else toast('A loja do Google Play não está disponível agora.');
      }
    }
    const b = e.target.closest('[data-buy]');
    if (b){ if (b.getAttribute('aria-disabled') === 'true'){ const p = PACKS.find(x => x.id === b.dataset.buy); if (p) canBuyPack(p); return; } buy(b.dataset.buy); }
    const sm = e.target.closest('[data-sm]');
    if (sm){
      const s = SKINS.find(x => x.k === sm.dataset.sm);
      if (!skinOpen(s)){ toast(`Este visual é vendido ${skinPhase(s).em}, ou no pacote com todos.`); return; }
      if (s.k !== SKIN) appPickSkin(s.k);
    }
  });
  if (A.adult){
    $('start').hidden = true; MODE = 'solo'; loadLocal(); resetRound();
    setResult('Faça sua aposta', '', '', 'Escolha onde a carta vai cair e toque em Jogar a carta.'); renderAll();
    A.opens++; saveA();
    // the looks offer waits for a win in this session instead of greeting the player at the door
    if (A.opens % THEMES_OFFER_EVERY === 0) themesArmed = true;
  }
  refreshAll();
  setInterval(() => { const d = A.day; rollDay(); if (d !== A.day) refreshAll(); }, 30000);
  initStore(); initAds();
}
