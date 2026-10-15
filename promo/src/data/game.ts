// Dados e artes reais do jogo, extraídos de ../src/carta-no-ar.html por scripts/extract-assets.mjs.
import {staticFile} from 'remotion';
import raw from './game-data.json';

export type Casino = {k: string; n: string; em: string; min: number; tint: string; acc: string; felt: string; gold: number; goldMult: number; lvl: number; fee: number};
export type Master = {n: string; s: string; N: number; head: number; rule: string; hi: string};
export type Skin = {k: string; n: string; d: string; phase: string | null; pass: boolean};
export type Suit = {k: 'S' | 'H' | 'D' | 'C'; n: string; s: string; red: boolean};
export type Palette = Record<string, string> & {backArt: string};
export type Card = {suit: Suit['k']; v: number};

type GameData = {
  images: Record<string, string>;
  casinos: Casino[];
  masters: Master[];
  skins: Skin[];
  palettes: Record<string, Palette>;
  suits: Suit[];
  ranks: string[];
  rankNames: string[];
  tabs: {k: string; n: string; m: string}[];
  bets: Record<'color' | 'suit' | 'low' | 'high' | 'seven' | 'face' | 'rank' | 'card', number>;
  duel: {k: string; n: string; pts: number; chance: number}[];
  gloveFit: Record<string, {x: number; y: number; w: number}>;
  legal: string;
};

export const GAME = raw as unknown as GameData;
export const img = (key: string) => {
  const p = GAME.images[key];
  if (!p) throw new Error(`Arte "${key}" não encontrada. Rode "npm run assets".`);
  return staticFile(p);
};

export const CASINOS = GAME.casinos;
export const MASTERS = GAME.masters;
export const suitOf = (k: Suit['k']) => GAME.suits.find(s => s.k === k)!;
export const cardName = (c: Card) => `${GAME.rankNames[c.v - 1]} de ${suitOf(c.suit).n}`;
export const rankOf = (c: Card) => GAME.ranks[c.v - 1];

// the visual that belongs to a stage (each stage sells its own glove + card back)
export const skinForCasino = (k: string) => GAME.skins.find(s => s.phase === k) ?? GAME.skins[0];
export const gloveKey = (k: string) => (GAME.images['glove_' + k] ? k : k === 'meianoite' ? 'safira' : 'original');

// pt-BR number formatting, same as the game's fmt()
export const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
export const fmtX = (m: number) => String(m).replace('.', ',');
