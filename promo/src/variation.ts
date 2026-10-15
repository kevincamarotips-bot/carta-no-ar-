// Turns the props + seed into one concrete, deterministic video: stage, visual, card, bet, payout and hook.
// Everything shown comes from the game's real rules (game-data.json): no invented bets or payouts.
import {staticFile} from 'remotion';
import {CASINOS, GAME, MASTERS, type Card, type Casino, type Master, type Palette, type Skin, fmtX, skinForCasino, suitOf} from './data/game';
import type {DesafioProps} from './schema';

export type BetKind = 'cor' | 'naipe' | 'carta';
export type Bet = {
  kind: BetKind;
  label: string;          // what the player picked: "Vermelho", "Copas", "Rei de Copas"
  title: string;          // the game's tab name: Cor, Naipe, Carta exata
  mult: number;
  chance: string;         // "50%", "25%", "1 em 52"
  stake: number;
  wins: boolean;
  payout: number;         // stake × mult when it wins (the game's payoutFor)
  red?: boolean;
  suit?: Card['suit'];
  card?: Card;
};

export type Hook = {kicker: string; title: string; sub: string};

export type Variation = {
  seed: number;
  casinoIndex: number;
  casino: Casino;
  skin: Skin;
  palette: Palette;
  backSrc: string;        // the painted card back of the stage's visual
  master: Master;
  card: Card;
  bet: Bet;
  hook: Hook;
  hookIndex: number;
};

const SUIT_KEYS: Card['suit'][] = ['S', 'H', 'D', 'C'];

// short hooks: the picture does the explaining
const hooks = (): Hook[] => [
  {kicker: 'Desafio', title: 'Adivinhe a carta', sub: ''},
  {kicker: 'Desafio', title: 'Cor, naipe ou carta?', sub: ''},
  {kicker: 'Desafio', title: '1 em 52', sub: ''},
  {kicker: 'Desafio', title: 'Acerte o naipe', sub: ''},
];

// deterministic, well-spread pseudo-random number in [0, 1) for a text key (FNV-1a + murmur finaliser)
export function rand(key: string){
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++){ h ^= key.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function resolveVariation(p: DesafioProps): Variation {
  const r = (k: string) => rand(`${k}:${p.seed}`);
  const pick = <T,>(arr: T[], k: string) => arr[Math.floor(r(k) * arr.length) % arr.length];

  const casinoIndex = p.arena === 'aleatoria' ? Math.floor(r('arena') * CASINOS.length) % CASINOS.length : Math.max(0, CASINOS.findIndex(c => c.k === p.arena));
  const casino = CASINOS[casinoIndex];
  const skin = skinForCasino(casino.k);
  const palette = GAME.palettes[skin.k] ?? GAME.palettes.original;
  const master = MASTERS[casinoIndex];

  const card: Card = {suit: pick(SUIT_KEYS, 'suit'), v: 1 + Math.floor(r('rank') * 13) % 13};
  const kind: BetKind = p.aposta === 'aleatoria' ? pick<BetKind>(['cor', 'naipe', 'carta'], 'bet') : p.aposta;
  const win = p.resultado === 'acerto';
  const min = casino.min;
  let bet: Bet;

  if (kind === 'cor'){
    const cardRed = suitOf(card.suit).red, red = win ? cardRed : !cardRed;
    const stake = min * 10, mult = GAME.bets.color;
    bet = {kind, label: red ? 'Vermelho' : 'Preto', title: 'Cor', mult, chance: '50%', stake, wins: win, payout: Math.round(stake * mult), red};
  } else if (kind === 'naipe'){
    const others = SUIT_KEYS.filter(s => s !== card.suit);
    const suit = win ? card.suit : pick(others, 'wrong-suit');
    const stake = min * 5, mult = GAME.bets.suit;
    bet = {kind, label: suitOf(suit).n, title: 'Naipe', mult, chance: '25%', stake, wins: win, payout: Math.round(stake * mult), suit, red: suitOf(suit).red};
  } else {
    let guess: Card = card;
    if (!win){
      // a near miss: same suit, a neighbouring value
      guess = {suit: card.suit, v: card.v === 13 ? 12 : card.v + 1};
    }
    const stake = min * 2, mult = GAME.bets.card;
    bet = {kind, label: `${GAME.rankNames[guess.v - 1]} de ${suitOf(guess.suit).n}`, title: 'Carta exata', mult, chance: '1 em 52', stake, wins: win, payout: Math.round(stake * mult), card: guess, suit: guess.suit, red: suitOf(guess.suit).red};
  }

  const hs = hooks();
  // a hook that names a bet points at that bet
  let hookIndex = Math.floor(r('hook') * hs.length) % hs.length;
  if (hookIndex === 2 && kind !== 'carta') hookIndex = 0;
  if (hookIndex === 3 && kind !== 'naipe') hookIndex = 1;

  return {seed: p.seed, casinoIndex, casino, skin, palette, backSrc: staticFile(palette.backArt), master, card, bet, hook: hs[hookIndex], hookIndex};
}

// palette → CSS custom properties with the game's own names (--ink, --gold, --card-red…)
export function paletteVars(pal: Palette): Record<string, string> {
  const o: Record<string, string> = {};
  for (const [k, v] of Object.entries(pal)) if (k !== 'backArt' && k !== 'back-art' && !k.startsWith('f-') && !v.includes('url(')) o[`--${k}`] = v;
  return o;
}
