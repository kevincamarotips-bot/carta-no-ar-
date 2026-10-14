/* =========================================================
   APP (Android) — fichas do dia, anúncios AdMob e compras no Google Play.
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
const DAILY_CHIPS = 1000;          // presente grátis, uma vez por dia
const REWARD_CHIPS = 200;          // por vídeo premiado
const REWARDS_PER_DAY = 5;
const INTERSTITIAL_EVERY = 8;      // rodadas entre anúncios de tela cheia
const DAILY_SPEND_CAP = 20;        // R$ por dia em pacotes de fichas
const NOADS_ID = 'sem_anuncios';
const SKINS_ALL_ID = 'visuais_todos';
const skinProduct = k => 'visual_' + k;
const PACKS = [
  {id: 'fichas_1000',  chips: 1000,  brl: 1.99, label: '1.000 fichas'},
  {id: 'fichas_5000',  chips: 5000,  brl: 4.99, label: '5.000 fichas'},
  {id: 'fichas_12000', chips: 12000, brl: 9.99, label: '12.000 fichas'},
];
const FALLBACK_PRICE = {sem_anuncios: 'R$ 9,90', visuais_todos: 'R$ 14,90'};
PACKS.forEach(p => FALLBACK_PRICE[p.id] = 'R$ ' + p.brl.toFixed(2).replace('.', ','));
SKINS.forEach(s => { if (s.k !== 'original') FALLBACK_PRICE[skinProduct(s.k)] = 'R$ 4,90'; });

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
let A = {day: '', dailyClaimed: false, rewardsToday: 0, spentToday: 0, owned: [], roundsSinceAd: 0, adult: false};
try { Object.assign(A, JSON.parse(localStorage.getItem('cartaNoAr.app') || '{}')); } catch(e){}
function saveA(){ try { localStorage.setItem('cartaNoAr.app', JSON.stringify(A)); } catch(e){} }
function rollDay(){ if (A.day !== today()){ A.day = today(); A.dailyClaimed = false; A.rewardsToday = 0; A.spentToday = 0; saveA(); } }
rollDay();

const owns = id => A.owned.includes(id);
const noAds = () => owns(NOADS_ID);
const skinOwned = k => k === 'original' || owns(SKINS_ALL_ID) || owns(skinProduct(k));
function grantOwned(id){ if (!owns(id)){ A.owned.push(id); saveA(); } }

/* ---------- store (Google Play Billing via cordova-plugin-purchase) ---------- */
let storeReady = false;
function priceOf(id){
  try {
    if (window.CdvPurchase && storeReady){
      const p = CdvPurchase.store.get(id, CdvPurchase.Platform.GOOGLE_PLAY);
      const price = p && p.pricing && p.pricing.price;
      if (price) return price;
    }
  } catch(e){}
  return FALLBACK_PRICE[id] || '';
}
function deliver(id){
  const pack = PACKS.find(p => p.id === id);
  if (pack){
    S.balance += pack.chips; A.spentToday += pack.brl; saveA();
    winJingle(true); chipRain(30); animateBalance();
    setResult('Fichas na mesa!', `+${fmt(pack.chips)} fichas`, 'win', 'Boa sorte na próxima carta.');
    save();
  } else {
    grantOwned(id);
    if (id === NOADS_ID){ hideBanner(); toast('Anúncios removidos. Obrigado!'); }
    else toast('Visual liberado!');
  }
  renderShop(); renderSkins(); renderControls();
}
function initStore(){
  const run = () => {
    if (!window.CdvPurchase) return;
    const {store, ProductType, Platform} = CdvPurchase;
    store.register([
      {id: NOADS_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY},
      {id: SKINS_ALL_ID, type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY},
      ...SKINS.filter(s => s.k !== 'original').map(s => ({id: skinProduct(s.k), type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY})),
      ...PACKS.map(p => ({id: p.id, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY})),
    ]);
    store.when()
      .productUpdated(() => { syncOwned(); renderShop(); renderSkins(); })
      .approved(tx => { tx.products.forEach(p => deliver(p.id)); tx.finish(); });
    store.error(err => { if (err && err.code !== CdvPurchase.ErrorCode.PAYMENT_CANCELLED) console.warn('loja', err); });
    store.initialize([Platform.GOOGLE_PLAY]).then(() => { storeReady = true; syncOwned(); renderShop(); renderSkins(); });
  };
  if (window.CdvPurchase) run(); else document.addEventListener('deviceready', run, {once: true});
}
function syncOwned(){
  if (!window.CdvPurchase) return;
  const ids = [NOADS_ID, SKINS_ALL_ID, ...SKINS.filter(s => s.k !== 'original').map(s => skinProduct(s.k))];
  ids.forEach(id => { try { if (CdvPurchase.store.owned(id)) grantOwned(id); } catch(e){} });
  if (noAds()) hideBanner();
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
async function initAds(){
  if (!AdMob) return;
  try {
    await AdMob.initialize({initializeForTesting: !!CFG.adsTest});
    try {
      const info = await AdMob.requestConsentInfo();
      if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await AdMob.showConsentForm();
    } catch(e){}
    AdMob.addListener('bannerAdSizeChanged', size => {
      document.documentElement.style.setProperty('--banner-h', ((size && size.height) || 0) + 'px');
    });
    showBanner(); prepInterstitial(); prepRewarded();
  } catch(e){ console.warn('admob', e); }
}
async function showBanner(){
  if (!AdMob || noAds() || bannerOn) return;
  try { await AdMob.showBanner({...adOpts(AD_UNITS.banner), adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0}); bannerOn = true; } catch(e){}
}
async function hideBanner(){
  document.documentElement.style.setProperty('--banner-h', '0px');
  if (!AdMob || !bannerOn) return;
  try { await AdMob.removeBanner(); } catch(e){}
  bannerOn = false;
}
async function prepInterstitial(){ if (!AdMob || noAds()) return; try { await AdMob.prepareInterstitial(adOpts(AD_UNITS.interstitial)); interstitialReady = true; } catch(e){ interstitialReady = false; } }
async function prepRewarded(){ if (!AdMob) return; try { await AdMob.prepareRewardVideoAd(adOpts(AD_UNITS.rewarded)); rewardedReady = true; } catch(e){ rewardedReady = false; } }

function appAfterRound(){
  if (noAds()) return;
  A.roundsSinceAd++; saveA();
  if (A.roundsSinceAd < INTERSTITIAL_EVERY || !interstitialReady || !AdMob) return;
  setTimeout(async () => {
    if (S.busy || S.gamble) return;          // nunca no meio de uma jogada ou do dobrar ou nada
    try { await AdMob.showInterstitial(); A.roundsSinceAd = 0; saveA(); } catch(e){}
    interstitialReady = false; prepInterstitial();
  }, 2600);
}
async function watchReward(){
  rollDay();
  if (A.rewardsToday >= REWARDS_PER_DAY){ toast('Você já assistiu todos os vídeos de hoje. Volte amanhã!'); return; }
  let ok = false;
  if (!AdMob){ toast('Anúncio simulado no navegador.'); ok = true; }
  else if (!rewardedReady){ toast('O vídeo ainda está carregando. Tente em alguns segundos.'); prepRewarded(); return; }
  else {
    try { const r = await AdMob.showRewardVideoAd(); ok = !!r; } catch(e){ ok = false; }
    rewardedReady = false; prepRewarded();
  }
  if (!ok) return;
  A.rewardsToday++; saveA();
  S.balance += REWARD_CHIPS; save(); animateBalance(); winJingle(false); chipRain(14);
  setResult('Valeu por assistir!', `+${fmt(REWARD_CHIPS)} fichas`, 'win', `Restam ${REWARDS_PER_DAY - A.rewardsToday} vídeos hoje.`);
  renderControls();
}

/* ---------- gift button: daily chips, then rewarded videos ---------- */
function appRenderGift(){
  rollDay();
  const b = $('bGift'), title = b.querySelector('b'), desc = b.querySelector('span');
  b.disabled = S.busy;
  if (!A.dailyClaimed){
    title.textContent = 'Fichas do dia'; desc.textContent = `${fmt(DAILY_CHIPS)} fichas grátis todo dia.`;
    $('bGiftCost').textContent = 'Pegar agora'; b.classList.toggle('on', !S.busy);
  } else if (A.rewardsToday < REWARDS_PER_DAY){
    title.textContent = 'Vídeo premiado'; desc.textContent = `Assista e ganhe ${REWARD_CHIPS} fichas.`;
    $('bGiftCost').textContent = `${REWARDS_PER_DAY - A.rewardsToday} hoje`; b.classList.remove('on');
  } else {
    title.textContent = 'Volte amanhã'; desc.textContent = 'Novas fichas grátis à meia-noite.';
    $('bGiftCost').textContent = 'Amanhã tem mais'; b.disabled = true; b.classList.remove('on');
  }
}
function appOpenGift(){
  rollDay();
  if (!A.dailyClaimed){
    A.dailyClaimed = true; saveA();
    S.balance += DAILY_CHIPS; save(); animateBalance(); winJingle(false); chipRain(18);
    setResult('Abracadabra!', `+${fmt(DAILY_CHIPS)} fichas`, 'win', 'Amanhã o mágico traz mais.');
    renderControls(); return;
  }
  watchReward();
}

/* ---------- shop panel ---------- */
function renderShop(){
  rollDay();
  const el = $('shop'); if (!el) return;
  const left = Math.max(0, DAILY_SPEND_CAP - A.spentToday), broke = S.balance < 10;
  $('shopLimit').textContent = `Hoje: R$ ${fmtBRL(A.spentToday)} de R$ ${DAILY_SPEND_CAP}`;
  el.innerHTML = `
    <div class="shop-row">
      <div><b>Sem anúncios</b><span>Tira o banner e os anúncios entre rodadas. Os vídeos premiados continuam opcionais.</span></div>
      ${noAds() ? '<em class="owned">Ativo</em>' : `<button class="buy" data-buy="${NOADS_ID}">${priceOf(NOADS_ID)}</button>`}
    </div>
    <div class="packs">
      ${PACKS.map(p => {
        const can = broke && A.spentToday + p.brl <= DAILY_SPEND_CAP + 0.001;
        return `<button class="pack" data-buy="${p.id}" ${can ? '' : 'aria-disabled="true"'}>
          <span class="chip mini-chip" style="--c:var(--amber);width:26px;height:26px"></span>
          <b>${p.label}</b><em>${priceOf(p.id)}</em></button>`;
      }).join('')}
    </div>
    <p class="panel-note">${broke
      ? (left >= PACKS[0].brl ? `Suas fichas acabaram. Você ainda pode gastar R$ ${fmtBRL(left)} em fichas hoje.` : 'Você chegou ao limite de fichas compradas hoje. Amanhã tem fichas grátis de novo.')
      : 'Os pacotes liberam só quando suas fichas acabam, com limite de R$ 20 por dia. Fichas não têm valor em dinheiro e não podem ser sacadas nem transferidas.'}</p>
    <button class="restore" id="restoreBtn">Restaurar compras</button>`;
}
const fmtBRL = v => v.toFixed(2).replace('.', ',');
function skinLabel(s){
  if (s.k === SKIN) return 'Em uso';
  if (skinOwned(s.k)) return 'Toque para usar';
  return priceOf(skinProduct(s.k));
}
function appPickSkin(k){
  if (skinOwned(k)) return applySkin(k, true);
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
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-buy]');
    if (b){ if (b.getAttribute('aria-disabled') === 'true'){ const p = PACKS.find(x => x.id === b.dataset.buy); if (p) canBuyPack(p); return; } buy(b.dataset.buy); }
    if (e.target.id === 'restoreBtn'){
      if (window.CdvPurchase && storeReady) CdvPurchase.store.restorePurchases().then(() => { syncOwned(); renderShop(); renderSkins(); toast('Compras restauradas.'); });
      else toast('A loja do Google Play não está disponível agora.');
    }
  });
  if (A.adult){ $('start').hidden = true; MODE = 'solo'; loadLocal(); resetRound(); setResult('Faça sua aposta', '', '', 'Escolha onde a carta vai cair e toque em Jogar a carta.'); renderAll(); }
  renderShop(); renderSkins(); renderControls();
  setInterval(() => { const d = A.day; rollDay(); if (d !== A.day){ renderShop(); renderControls(); } }, 30000);
  initStore(); initAds();
}
