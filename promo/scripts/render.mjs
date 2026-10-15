#!/usr/bin/env node
/*
 * Exporta vídeos do desafio em MP4 H.264, 1080x1920, 30 fps, 15 s.
 *
 *   npm run render                              -> 1 vídeo, semente 1, arena aleatória, todas as cenas
 *   npm run render -- --seed 7                  -> outra variação
 *   npm run render -- --arena biblioteca        -> fixa a fase (boteco, porto, biblioteca, montecarlo, vegas, abismo, palacio, torre)
 *   npm run render -- --cenas gancho,aposta,lancamento,revelacao,cta
 *   npm run render -- --aposta naipe --resultado erro --chamada "Baixe agora" --sem-legal
 *   npm run variacoes                           -> 6 variações (sementes 1 a 6)
 *   npm run render -- --variacoes 10 --seed 20  -> 10 variações a partir da semente 20
 *   npm run render -- --saida ~/Videos          -> pasta de saída (padrão: out/)
 *
 * Usa o Chrome que o Remotion baixa sozinho. Para usar um já instalado:
 *   REMOTION_BROWSER_EXECUTABLE=/caminho/do/chrome npm run render
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';

const PROMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCENES = ['gancho', 'aposta', 'lancamento', 'revelacao', 'duelo', 'cta'];

/* ---------- arguments ---------- */
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };
const flag = name => argv.includes(`--${name}`);
const die = msg => { console.error(`render: ${msg}`); process.exit(1); };

const seed = parseInt(opt('seed', '1'), 10);
const count = parseInt(opt('variacoes', '1'), 10);
const cenasArg = opt('cenas', SCENES.join(','));
const cenasList = cenasArg.split(',').map(s => s.trim()).filter(Boolean);
for (const c of cenasList) if (!SCENES.includes(c)) die(`cena desconhecida "${c}". Use: ${SCENES.join(', ')}`);
const cenas = Object.fromEntries(SCENES.map(s => [s, cenasList.includes(s)]));
const aposta = opt('aposta', 'aleatoria');
if (!['aleatoria', 'cor', 'naipe', 'carta'].includes(aposta)) die('--aposta deve ser aleatoria, cor, naipe ou carta');
const resultado = opt('resultado', 'acerto');
if (!['acerto', 'erro'].includes(resultado)) die('--resultado deve ser acerto ou erro');
const outDir = path.resolve(opt('saida', path.join(PROMO, 'out')).replace(/^~(?=$|\/)/, process.env.HOME || '~'));
if (!Number.isFinite(seed) || seed < 0) die('--seed deve ser um número inteiro');
if (!Number.isFinite(count) || count < 1 || count > 50) die('--variacoes deve ficar entre 1 e 50');

/* ---------- assets from the game, then one bundle for every video ---------- */
execFileSync(process.execPath, [path.join(PROMO, 'scripts', 'extract-assets.mjs')], {stdio: 'inherit'});
const data = JSON.parse(fs.readFileSync(path.join(PROMO, 'src', 'data', 'game-data.json'), 'utf8'));
const arena = opt('arena', 'aleatoria');
if (arena !== 'aleatoria' && !data.casinos.some(c => c.k === arena)) die(`arena "${arena}" não existe. Use aleatoria ou: ${data.casinos.map(c => c.k).join(', ')}`);

fs.mkdirSync(outDir, {recursive: true});
console.log('render: preparando o projeto…');
const serveUrl = await bundle({entryPoint: path.join(PROMO, 'src', 'index.ts'), publicDir: path.join(PROMO, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;

const done = [];
for (let n = 0; n < count; n++){
  const inputProps = {
    tipo: 'desafio', arena, seed: seed + n, cenas, aposta, resultado,
    chamada: opt('chamada', 'Jogue agora'), mostrarLegal: !flag('sem-legal'),
  };
  const composition = await selectComposition({serveUrl, id: 'Desafio', inputProps, browserExecutable});
  if (composition.width !== 1080 || composition.height !== 1920 || composition.fps !== 30 || composition.durationInFrames !== 450){
    die(`composição fora do formato: ${composition.width}x${composition.height} ${composition.fps} fps ${composition.durationInFrames} quadros`);
  }
  const name = composition.defaultOutName || `desafio_s${seed + n}`;
  const file = path.join(outDir, `${name}.mp4`);
  let last = -1;
  await renderMedia({
    serveUrl, composition, inputProps, browserExecutable,
    codec: 'h264', pixelFormat: 'yuv420p', colorSpace: 'bt709', crf: 18, imageFormat: 'jpeg', jpegQuality: 92,
    outputLocation: file, overwrite: true,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 100);
      if (pct >= last + 10 || pct === 100){ last = pct; process.stdout.write(`\rrender: ${n + 1}/${count} ${name} ${pct}%   `); }
    },
  });
  process.stdout.write('\n');
  // what is in the video, for picking among variations later
  fs.writeFileSync(file.replace(/\.mp4$/, '.json'), JSON.stringify({arquivo: path.basename(file), formato: '1080x1920 · 30 fps · 15 s · MP4 H.264', props: inputProps}, null, 2) + '\n');
  done.push(file);
}
console.log(`render: pronto. ${done.length} vídeo(s) em ${outDir}`);
for (const f of done) console.log(`  ${path.relative(process.cwd(), f)}`);
