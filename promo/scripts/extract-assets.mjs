#!/usr/bin/env node
/*
 * Lê o jogo (../src/carta-no-ar.html) e copia para o gerador de vídeos:
 *   - as artes reais (logo, 8 palcos, 8 mestres, luvas, versos das cartas, fichas, ícones)
 *     em public/game/;
 *   - os dados reais (fases, mestres, visuais, cores de cada visual, apostas e pagamentos,
 *     pontuação do duelo, texto legal) em src/data/game-data.json.
 *
 * O jogo não é alterado. Rode de novo sempre que o jogo mudar: o vídeo acompanha.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROMO = path.resolve(HERE, '..');
const ROOT = path.resolve(PROMO, '..');
const GAME = path.join(ROOT, 'src', 'carta-no-ar.html');
const BUILD = path.join(ROOT, 'tools', 'build_app.py');
const OUT_IMG = path.join(PROMO, 'public', 'game');
const OUT_DATA = path.join(PROMO, 'src', 'data', 'game-data.json');

const fail = msg => { console.error(`extract-assets: ${msg}`); process.exit(1); };
if (!fs.existsSync(GAME)) fail(`não achei o jogo em ${GAME}`);
const html = fs.readFileSync(GAME, 'utf8');

/* ---------- helpers ---------- */
const EXT = {'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg'};
fs.rmSync(OUT_IMG, {recursive: true, force: true});
fs.mkdirSync(OUT_IMG, {recursive: true});
fs.mkdirSync(path.dirname(OUT_DATA), {recursive: true});

function saveUri(name, uri){
  const m = /^data:([a-z/+]+);base64,(.+)$/s.exec(uri);
  if (!m) fail(`imagem ${name} não está em base64`);
  const file = `${name}.${EXT[m[1]] || 'bin'}`;
  fs.writeFileSync(path.join(OUT_IMG, file), Buffer.from(m[2], 'base64'));
  return `game/${file}`;
}

// pulls `const NAME = <literal>;` out of the game script and evaluates just that literal
function literal(name, open = '['){
  const start = html.indexOf(`const ${name} = ${open}`);
  if (start < 0) fail(`não achei "const ${name}" no jogo`);
  const close = open === '[' ? ']' : '}';
  let i = html.indexOf(open, start), depth = 0, str = null;
  for (; i < html.length; i++){
    const ch = html[i];
    if (str){ if (ch === '\\'){ i++; continue; } if (ch === str) str = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`'){ str = ch; continue; }
    if (ch === open) depth++;
    else if (ch === close && --depth === 0) break;
  }
  const src = html.slice(html.indexOf(open, start), i + 1);
  return new Function(`return (${src});`)();
}

function cssVars(block){
  const o = {};
  for (const m of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) o[m[1]] = m[2].trim();
  return o;
}

/* ---------- images ---------- */
const images = {};

const logo = /<img class="hud-logo[^"]*" src="(data:[^"]+)"/.exec(html);
if (!logo) fail('não achei a logo');
images.logo = saveUri('logo', logo[1]);

const rootArt = /:root\{(--bk0:url\("data:.*?)\}/s.exec(html);
if (!rootArt) fail('não achei os versos e fichas (--bk0…)');
for (const m of rootArt[1].matchAll(/--((?:bk|chip)\d):url\("(data:[^"]+)"\)/g)) images[m[1]] = saveUri(m[1], m[2]);

const ART = literal('ART', '{');
for (const [k, uri] of Object.entries(ART)) images[k] = saveUri(k, uri);

for (const need of ['bk0', 'bk7', 'chip0', 'chip3', 'stage0', 'stage7', 'master0', 'master7', 'glove_original']){
  if (!images[need]) fail(`faltou a arte ${need}`);
}

/* ---------- game data ---------- */
const CASINOS = literal('CASINOS');
const MASTERS = literal('MASTERS').map(({n, s, N, head, rule, hi}) => ({n, s, N, head, rule, hi}));
const SKINS = literal('SKINS').map(({k, n, d, phase, pass}) => ({k, n, d, phase: phase || null, pass: !!pass}));
const SUITS = literal('SUITS');
const RANKS = literal('RANKS');
const RNAMES = literal('RNAMES');
const TABS = literal('TABS');
const GLOVE_FIT = literal('GLOVE_FIT', '{');

// colour palette of every visual: base :root block + [data-skin="k"] overrides
const baseRoot = /:root\{\s*(--ink:[\s\S]*?)\n\}/.exec(html);
if (!baseRoot) fail('não achei as variáveis de cor base');
const base = cssVars(baseRoot[1]);
const palettes = {};
for (const m of html.matchAll(/\[data-skin="(\w+)"\]\{([^}]+)\}/g)) palettes[m[1]] = {...base, ...cssVars(m[2])};
for (const s of SKINS) if (!palettes[s.k]) fail(`sem paleta para o visual ${s.k}`);
// --back-art points at one of the painted card backs
for (const p of Object.values(palettes)){
  const bk = /var\(--(bk\d)\)/.exec(p['back-art'] || '');
  p.backArt = bk ? images[bk[1]] : images.bk0;
}

// bet multipliers straight from def(key)
const defSrc = /function def\(key\)\{([\s\S]*?)\n\}/.exec(html);
if (!defSrc) fail('não achei a tabela de apostas def(key)');
const mult = re => { const m = re.exec(defSrc[1]); if (!m) fail(`multiplicador não encontrado: ${re}`); return +m[1]; };
const BETS = {
  color: mult(/t==='color'\) return \{mult:([\d.]+)/),
  suit: mult(/t==='suit'\)\s+return \{mult:([\d.]+)/),
  low: mult(/a==='low'\)\s+return \{mult:([\d.]+)/),
  high: mult(/a==='high'\)\s+return \{mult:([\d.]+)/),
  seven: mult(/a==='seven'\) return \{mult:([\d.]+)/),
  face: mult(/a==='face'\)\s+return \{mult:([\d.]+)/),
  rank: mult(/t==='rank'\) return \{mult:([\d.]+)/),
  card: mult(/t==='card'\) return \{mult:([\d.]+)/),
};

// duel: points per category ("Cor +1 · 50%", …)
const duel = [...html.matchAll(/\['(cor|naipe|valor)', '(\w+)', '\+(\d) · (\d+)%'\]/g)].map(m => ({k: m[1], n: m[2], pts: +m[3], chance: +m[4]}));
if (duel.length !== 3) fail('não achei a pontuação do duelo');

// legal line shown in the Android app
let legal = 'Fichas virtuais sem valor em dinheiro. Jogo apenas para entretenimento, para maiores de 18 anos.';
if (fs.existsSync(BUILD)){
  const m = /<p class="app-legal">([^<]+)<\/p>/.exec(fs.readFileSync(BUILD, 'utf8'));
  if (m) legal = m[1].trim();
}

const data = {
  source: 'src/carta-no-ar.html',
  extractedAt: new Date().toISOString(),
  images,
  casinos: CASINOS.map(({k, n, em, min, tint, acc, felt, gold, goldMult, lvl, fee}) => ({k, n, em, min, tint, acc, felt, gold, goldMult, lvl, fee})),
  masters: MASTERS,
  skins: SKINS,
  palettes,
  suits: SUITS,
  ranks: RANKS,
  rankNames: RNAMES,
  tabs: TABS,
  bets: BETS,
  duel,
  gloveFit: GLOVE_FIT,
  legal,
};
fs.writeFileSync(OUT_DATA, JSON.stringify(data, null, 2) + '\n');
console.log(`extract-assets: ${Object.keys(images).length} artes em public/game, ${CASINOS.length} fases, ${MASTERS.length} mestres, ${SKINS.length} visuais.`);
