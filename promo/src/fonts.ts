// The game's three typefaces, bundled locally (no network needed at render time):
// Marcellus (display), Bricolage Grotesque (body), DM Mono (numbers).
import '@fontsource/marcellus/400.css';
import '@fontsource-variable/bricolage-grotesque/index.css';
import '@fontsource/dm-mono/500.css';
import {continueRender, delayRender} from 'remotion';

export const F = {
  display: '"Marcellus", Georgia, serif',
  body: '"Bricolage Grotesque Variable", "Bricolage Grotesque", system-ui, sans-serif',
  mono: '"DM Mono", ui-monospace, Menlo, monospace',
};

const SAMPLE = 'Adivinhe a carta ÁÉÍÓÚÇÃÕáéíóúçãõâêô ×−+·… 0123456789';
let started = false;
export function waitForFonts(){
  if (started || typeof document === 'undefined') return;
  started = true;
  const handle = delayRender('Carregando as fontes do jogo');
  Promise.all([
    document.fonts.load('400 40px "Marcellus"', SAMPLE),
    document.fonts.load('400 40px "Bricolage Grotesque Variable"', SAMPLE),
    document.fonts.load('800 40px "Bricolage Grotesque Variable"', SAMPLE),
    document.fonts.load('500 40px "DM Mono"', SAMPLE),
  ]).then(() => document.fonts.ready).then(() => continueRender(handle), () => continueRender(handle));
}
