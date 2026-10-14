/* =========================================================
   APP (Android) — fichas do dia, Clube do Mágico, anúncios AdMob,
   loja em pop-up e ofertas com X depois de 5 segundos.
   Este bloco é inserido dentro do script do jogo por tools/build_app.py,
   então enxerga S, toast, renderAll, applySkin e o resto do jogo.
   ========================================================= */
const CFG = window.APP_CONFIG || {};
const NATIVE = !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
const AdMob = NATIVE && Capacitor.Plugins ? Capacitor.Plugins.AdMob : null;

const AD_UNITS = {
  banner:       'ca-app-pub-4843616770222084/5170472095', // banner_mesa
  interstitial: 'ca-app-pub-4843616770222084/4664039784', // entre rodadas
  rewarded:     'ca-app-pub-4843616770222084/3087234239', // fichas_extras
};
/* ---- economia (tabela no README) ---- */
const DAILY_CHIPS = 1000;          // presente grátis, uma vez por dia
const REWARD_CHIPS = 200;          // por vídeo premiado
const REWARDS_PER_DAY = 5;
const CLUB_CHIPS = 2000;           // Clube do Mágico, por dia, não acumula
const INTERSTITIAL_EVERY = 8;      // rodadas entre anúncios de tela cheia
const NOADS_OFFER_EVERY = 3;       // a cada 3 anúncios de tela cheia, oferece "Sem anúncios"
const THEMES_OFFER_EVERY = 3;      // a cada 3 aberturas do app, oferece os visuais
const OFFER_LOCK_SECONDS = 5;      // X só aparece depois disso
const DAILY_SPEND_CAP = 20;        // R$ por dia em pacotes de fichas
const NOADS_ID = 'sem_anuncios';
const SUB_ID = 'clube_magico';
const SKINS_ALL_ID = 'visuais_todos';
const skinProduct = k => 'visual_' + k;
const PACKS = [
  {id: 'fichas_1000',  chips: 1000,  brl: 1.99, label: '1.000 fichas'},
  {id: 'fichas_5000',  chips: 5000,  brl: 4.99, label: '5.000 fichas'},
  {id: 'fichas_12000', chips: 12000, brl: 9.99, label: '12.000 fichas'},
];
const FALLBACK_PRICE = {sem_anuncios: 'R$ 9,90', visuais_todos: 'R$ 14,90', clube_magico: 'R$ 29,90'};
PACKS.forEach(p => FALLBACK_PRICE[p.id] = 'R$ ' + p.brl.toFixed(2).replace('.', ','));
SKINS.forEach(s => { if (s.k !== 'original') FALLBACK_PRICE[skinProduct(s.k)] = 'R$ 4,90'; });
const fmtBRL = v => v.toFixed(2).replace('.', ',');

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let A = {day: '', dailyClaimed: false, clubClaimed: false, rewardsToday: 0, spentToday: 0, owned: [], roundsSinceAd: 0,
         adult: false, memberUntil: 0, opens: 0, adsShown: 0};
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
function refreshAll(){ renderShop(); renderSkins(); renderControls(); if (!$('promoModal').hidden) renderPromo(); }
function deliver(id){
  const pack = PACKS.find(p => p.id === id);
  if (pack){
    S.balance += pack.chips; A.spentToday += pack.brl; saveA();
    winJingle(true); chipRain(30); animateBalance();
    setResult('Fichas na mesa!', `+${fmt(pack.chips)} fichas`, 'win', 'Boa sorte na próxima carta.');
    save();
  } else if (id === SUB_ID){
    setMember(true); hideBanner(); winJingle(true); chipRain(30);
    toast('Bem-vindo ao Clube do Mágico!');
    closePromo();
  } else {
    grantOwned(id);
    if (id === NOADS_ID){ hideBanner(); toast('Anúncios removidos. Obrigado!'); closePromo(); }
    else { toast('Visual liberado!'); if (allSkinsOwned()) closePromo(); }
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
function canBuyPack(pack){
  rollDay();
  if (S.balance >= 10){ toast('Os pacotes de fichas liberam quando suas fichas acabam.'); return false; }
  if (A.spentToday + pack.brl > DAILY_SPEND_CAP + 0.001){ toast(`Você chegou ao limite de R$ ${DAILY_SPEND_CAP} em fichas hoje. Volta amanhã!`); return false; }
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

function countAdShown(){
  A.adsShown++; A.roundsSinceAd = 0; saveA();
  if (A.adsShown % NOADS_OFFER_EVERY === 0 && !noAds()) setTimeout(() => openPromo('noads'), 700);
}
function appAfterRound(){
  if (noAds()) return;
  A.roundsSinceAd++; saveA();
  if (A.roundsSinceAd < INTERSTITIAL_EVERY) return;
  setTimeout(async () => {
    if (S.busy || S.gamble || !$('promoModal').hidden || !$('shopModal').hidden) return; // nunca no meio de uma jogada
    if (!AdMob){ toast('Anúncio de tela cheia (simulado no navegador)'); countAdShown(); return; }
    if (!interstitialReady){ prepInterstitial(); return; }
    try { await AdMob.showInterstitial(); countAdShown(); } catch(e){}
    interstitialReady = false; prepInterstitial();
  }, 2600);
}
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
  S.balance += REWARD_CHIPS; save(); animateBalance(); winJingle(false); chipRain(14);
  setResult('Valeu por assistir!', `+${fmt(REWARD_CHIPS)} fichas`, 'win', `Restam ${REWARDS_PER_DAY - A.rewardsToday} vídeos hoje.`);
  refreshAll();
}

/* ---------- free chips ---------- */
function claimClub(){
  rollDay(); if (!isMember() || A.clubClaimed) return;
  A.clubClaimed = true; saveA();
  S.balance += CLUB_CHIPS; save(); animateBalance(); winJingle(true); chipRain(30);
  setResult('Clube do Mágico', `+${fmt(CLUB_CHIPS)} fichas`, 'win', 'Amanhã tem mais esperando por você.');
  refreshAll();
}
function claimDaily(){
  rollDay(); if (A.dailyClaimed) return;
  A.dailyClaimed = true; saveA();
  S.balance += DAILY_CHIPS; save(); animateBalance(); winJingle(false); chipRain(18);
  setResult('Abracadabra!', `+${fmt(DAILY_CHIPS)} fichas`, 'win', 'Amanhã o mágico traz mais.');
  refreshAll();
}
function appRenderGift(){
  rollDay();
  const b = $('bGift'), title = b.querySelector('b'), desc = b.querySelector('span');
  b.disabled = S.busy;
  const set = (t, d, cost, on) => { title.textContent = t; desc.textContent = d; $('bGiftCost').textContent = cost; b.classList.toggle('on', on && !S.busy); };
  if (isMember() && !A.clubClaimed) set('Fichas do Clube', `${fmt(CLUB_CHIPS)} fichas do Clube hoje.`, 'Pegar agora', true);
  else if (!A.dailyClaimed) set('Fichas do dia', `${fmt(DAILY_CHIPS)} fichas grátis todo dia.`, 'Pegar agora', true);
  else if (A.rewardsToday < REWARDS_PER_DAY) set('Vídeo premiado', `Assista e ganhe ${REWARD_CHIPS} fichas.`, `${REWARDS_PER_DAY - A.rewardsToday} hoje`, false);
  else { set('Volte amanhã', 'Novas fichas grátis à meia-noite.', 'Amanhã tem mais', false); b.disabled = true; }
}
function appOpenGift(){
  rollDay();
  if (isMember() && !A.clubClaimed) return claimClub();
  if (!A.dailyClaimed) return claimDaily();
  watchReward();
}

/* ---------- shop pop-up (cart button) ---------- */
function packsHtml(){
  const broke = S.balance < 10;
  return `<div class="packs">${PACKS.map(p => {
    const can = broke && A.spentToday + p.brl <= DAILY_SPEND_CAP + 0.001;
    return `<button class="pack" data-buy="${p.id}" ${can ? '' : 'aria-disabled="true"'}>
      <span class="chip mini-chip" style="--c:var(--amber);width:26px;height:26px"></span>
      <b>${p.label}</b><em>${priceOf(p.id)}</em></button>`;
  }).join('')}</div>`;
}
function clubHtml(){
  if (isMember()) return `<div class="club on">
      <div class="club-top"><b>Clube do Mágico</b><span class="tag ok">ativo</span></div>
      <span>${fmt(CLUB_CHIPS)} fichas todo dia e nenhum anúncio.</span>
      ${A.clubClaimed ? '<em class="club-done">Fichas de hoje já recebidas. Volte amanhã!</em>' : `<button class="buy wide" data-act="club">Pegar ${fmt(CLUB_CHIPS)} fichas de hoje</button>`}
    </div>`;
  return `<div class="club">
      <div class="club-top"><b>Clube do Mágico</b><span class="tag">assinatura</span></div>
      <ul><li><b>${fmt(CLUB_CHIPS)} fichas</b> todo dia</li><li>Sem banner e sem anúncios entre rodadas</li><li>Cancele quando quiser no Google Play</li></ul>
      <button class="buy wide" data-buy="${SUB_ID}">Assinar por ${priceOf(SUB_ID)}/mês</button>
    </div>`;
}
function skinsMiniHtml(){
  return `<div class="skin-mini">${SKINS.filter(s => s.k !== 'original').map(s => `
    <button class="sm" data-skin="${s.k}" data-pick="${s.k}">
      <span class="sm-pv"><span class="mb"></span></span>
      <b>${s.n}</b><em>${skinOwned(s.k) ? (s.k === SKIN ? 'Em uso' : 'Usar') : priceOf(skinProduct(s.k))}</em>
    </button>`).join('')}</div>`;
}
function renderShop(){
  const el = $('shopBody'); if (!el || $('shopModal').hidden) return;
  rollDay();
  const left = Math.max(0, DAILY_SPEND_CAP - A.spentToday), broke = S.balance < 10;
  el.innerHTML = `
    <h3 class="sheet-title">Loja</h3>
    ${clubHtml()}
    <p class="eyebrow sheet-sub"><span>Fichas grátis</span></p>
    <div class="free">
      <button class="free-row" data-act="daily" ${A.dailyClaimed ? 'disabled' : ''}>
        <span><b>Fichas do dia</b><small>${fmt(DAILY_CHIPS)} grátis, uma vez por dia</small></span><em>${A.dailyClaimed ? 'Amanhã' : 'Pegar'}</em></button>
      <button class="free-row" data-act="video" ${A.rewardsToday >= REWARDS_PER_DAY ? 'disabled' : ''}>
        <span><b>Vídeo premiado</b><small>+${REWARD_CHIPS} por vídeo · ${REWARDS_PER_DAY - A.rewardsToday} restantes hoje</small></span><em>${A.rewardsToday >= REWARDS_PER_DAY ? 'Amanhã' : 'Assistir'}</em></button>
    </div>
    <p class="eyebrow sheet-sub"><span>Pacotes de fichas</span><span>R$ ${fmtBRL(A.spentToday)} de R$ ${DAILY_SPEND_CAP} hoje</span></p>
    ${packsHtml()}
    <p class="panel-note">${broke ? (left >= PACKS[0].brl ? `Suas fichas acabaram: os pacotes estão liberados até R$ ${fmtBRL(left)} hoje.` : 'Você chegou ao limite de fichas compradas hoje.') : 'Os pacotes liberam quando suas fichas acabam, com limite de R$ 20 por dia.'}</p>
    <p class="eyebrow sheet-sub"><span>Sem anúncios</span></p>
    <div class="shop-row">
      <div><b>Remover anúncios</b><span>Compra única. Os vídeos premiados continuam opcionais.</span></div>
      ${noAds() ? '<em class="owned">Ativo</em>' : `<button class="buy" data-buy="${NOADS_ID}">${priceOf(NOADS_ID)}</button>`}
    </div>
    <p class="eyebrow sheet-sub"><span>Visuais</span></p>
    ${skinsMiniHtml()}
    ${allSkinsOwned() ? '' : `<button class="bundle" data-buy="${SKINS_ALL_ID}">Todos os 5 visuais por ${priceOf(SKINS_ALL_ID)}</button>`}
    <p class="panel-note">A assinatura renova todo mês até você cancelar no Google Play. Fichas não têm valor em dinheiro e não podem ser sacadas nem transferidas.</p>
    <button class="restore" data-act="restore">Restaurar compras</button>`;
}
function openShop(){ $('shopModal').hidden = false; renderShop(); clink(); }
function closeShop(){ $('shopModal').hidden = true; }

/* ---------- offer pop-ups: no close button for the first 5 seconds ---------- */
let promoKind = null, promoTimer = null;
function renderPromo(){
  const el = $('promoBody');
  if (promoKind === 'noads'){
    el.innerHTML = `
      <div class="promo-art noads"><span class="no-sign">AD</span></div>
      <h3 class="promo-title">Jogue sem interrupções</h3>
      <p class="promo-text">Tire o banner e os anúncios entre rodadas para sempre. Os vídeos premiados continuam opcionais, para quando você quiser fichas extras.</p>
      <button class="buy wide big" data-buy="${NOADS_ID}">Remover anúncios por ${priceOf(NOADS_ID)}</button>
      <div class="promo-or"><span>ou</span></div>
      <button class="club-cta" data-buy="${SUB_ID}"><b>Clube do Mágico</b><span>${fmt(CLUB_CHIPS)} fichas por dia e sem anúncios · ${priceOf(SUB_ID)}/mês</span></button>`;
  } else {
    el.innerHTML = `
      <h3 class="promo-title">Novos visuais para a sua mesa</h3>
      <p class="promo-text">Troque o palco, as fichas, o verso da carta e a mão do mágico. Toque em um visual para comprar.</p>
      ${skinsMiniHtml()}
      ${allSkinsOwned() ? '' : `<button class="buy wide big" data-buy="${SKINS_ALL_ID}">Todos os 5 por ${priceOf(SKINS_ALL_ID)}</button>
      <p class="promo-save">Sai por menos de R$ 3 cada, em vez de ${priceOf(skinProduct('vegas'))}.</p>`}`;
  }
}
function openPromo(kind){
  if (!A.adult || !$('promoModal').hidden || !$('shopModal').hidden) return;
  if (kind === 'noads' && noAds()) return;
  if (kind === 'themes' && allSkinsOwned()) return;
  promoKind = kind; renderPromo();
  const modal = $('promoModal'), x = $('promoClose'), ring = $('promoWait');
  modal.hidden = false; x.hidden = true; ring.hidden = false;
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
  solo.addEventListener('click', () => { A.adult = true; saveA(); });
  if (!skinOwned(SKIN)) applySkin('original', false);
  $('skinNote').textContent = 'Cada visual troca o palco, as fichas, o verso da carta, o logo e a mão do mágico.';
  $('skinBundle').hidden = false;
  $('skinBundle').onclick = () => buy(SKINS_ALL_ID);
  $('cartBtn').hidden = false;
  $('cartBtn').onclick = openShop;
  $('shopClose').onclick = closeShop;
  $('shopModal').addEventListener('click', e => { if (e.target.id === 'shopModal') closeShop(); });
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
    const pick = e.target.closest('.sm[data-pick]');
    if (pick) appPickSkin(pick.dataset.pick);
  });
  if (A.adult){
    $('start').hidden = true; MODE = 'solo'; loadLocal(); resetRound();
    setResult('Faça sua aposta', '', '', 'Escolha onde a carta vai cair e toque em Jogar a carta.'); renderAll();
    A.opens++; saveA();
    if (A.opens % THEMES_OFFER_EVERY === 0) setTimeout(() => openPromo('themes'), 1200);
  } else {
    solo.addEventListener('click', () => { A.opens = 1; saveA(); }, {once: true});
  }
  refreshAll();
  setInterval(() => { const d = A.day; rollDay(); if (d !== A.day) refreshAll(); }, 30000);
  initStore(); initAds();
}
