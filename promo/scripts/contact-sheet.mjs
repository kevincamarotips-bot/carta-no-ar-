#!/usr/bin/env node
/*
 * Pré-visualização rápida sem abrir o Studio: uma imagem com uma linha por variação
 * e uma coluna por cena (um quadro do meio de cada cena), com fase, aposta e carta de cada uma.
 *
 *   npm run previa                                  -> sementes 1 a 6 em out/previa.png
 *   npm run previa -- --seed 10 --variacoes 8 --arena torre --cenas gancho,revelacao,cta
 */
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';

const PROMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCENES = ['gancho', 'aposta', 'lancamento', 'revelacao', 'duelo', 'cta'];
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf(`--${name}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def; };

const seed = parseInt(opt('seed', '1'), 10);
const count = Math.min(12, Math.max(1, parseInt(opt('variacoes', '6'), 10)));
const cenasList = opt('cenas', SCENES.join(',')).split(',').map(s => s.trim());
const base = {
  tipo: 'desafio', arena: opt('arena', 'aleatoria'), seed,
  cenas: Object.fromEntries(SCENES.map(s => [s, cenasList.includes(s)])),
  aposta: opt('aposta', 'aleatoria'), resultado: opt('resultado', 'acerto'), chamada: opt('chamada', 'Jogue agora'), mostrarLegal: true,
};
const inputProps = {seeds: Array.from({length: count}, (_, i) => seed + i), base};

execFileSync(process.execPath, [path.join(PROMO, 'scripts', 'extract-assets.mjs')], {stdio: 'inherit'});
const outDir = path.join(PROMO, 'out');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(PROMO, 'src', 'index.ts'), publicDir: path.join(PROMO, 'public')});
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || null;
const composition = await selectComposition({serveUrl, id: 'Previa', inputProps, browserExecutable});
const output = path.join(outDir, opt('arquivo', 'previa.png'));
await renderStill({serveUrl, composition, inputProps, browserExecutable, output, imageFormat: 'png', overwrite: true, timeoutInMilliseconds: 120000});
console.log(`previa: ${path.relative(process.cwd(), output)} (${composition.width}x${composition.height})`);
