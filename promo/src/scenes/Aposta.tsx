import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GAME, fmtX, type Card} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CardBack, CardFront} from '../components/PlayingCard';
import {Chip} from '../components/Stage';
import {Suit} from '../components/Suit';
import type {BetKind, Variation} from '../variation';

// 2 · The bet, with pictures instead of words: three tiles (Cor, Naipe, Carta exata) with the game's real payouts.
// The chosen tile grows, the others dim, and a painted chip drops on it.
const SUITS: Card['suit'][] = ['S', 'H', 'D', 'C'];
const TILE_W = 300, TILE_H = 400;

const Disc: React.FC<{red: boolean; size: number; on?: boolean}> = ({red, size, on = true}) => (
  <div style={{width: size, height: size, borderRadius: '50%', background: red ? 'var(--card-red)' : 'var(--card-black)', border: `${size * 0.07}px solid var(--cream)`,
    boxSizing: 'border-box', opacity: on ? 1 : 0.25, boxShadow: on ? '0 0 30px color-mix(in srgb, var(--gold) 50%, transparent)' : 'none'}} />
);

const Art: React.FC<{kind: BetKind; v: Variation; picked: boolean; chosen: number}> = ({kind, v, picked, chosen}) => {
  if (kind === 'cor'){
    const dim = (red: boolean) => !picked || chosen < 0.5 || v.bet.red === red;
    return <div style={{display: 'flex', gap: 22}}><Disc red size={104} on={dim(true)} /><Disc red={false} size={104} on={dim(false)} /></div>;
  }
  if (kind === 'naipe'){
    return (
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18}}>
        {SUITS.map(s => {
          const on = !picked || chosen < 0.5 || v.bet.suit === s;
          return <Suit key={s} k={s} size={92} color={s === 'H' || s === 'D' ? 'var(--card-red)' : 'var(--cream)'}
            style={{opacity: on ? 1 : 0.2, transform: `scale(${picked && v.bet.suit === s ? 1 + 0.25 * chosen : 1})`}} />;
        })}
      </div>
    );
  }
  const w = 150, flip = picked ? chosen : 0;
  return (
    <div style={{position: 'relative', width: w, height: w * 162 / 116, transformStyle: 'preserve-3d', transform: `rotateY(${180 - 180 * flip}deg)`}}>
      <CardFront card={v.bet.card ?? null} w={w} />
      <CardBack src={v.backSrc} w={w} />
    </div>
  );
};

const Tile: React.FC<{kind: BetKind; v: Variation; f: number; i: number; pickAt: number}> = ({kind, v, f, i, pickAt}) => {
  const picked = v.bet.kind === kind;
  const chosen = interpolate(f, [pickAt, pickAt + 8], [0, 1], clamp);
  const scale = picked ? 1 + 0.12 * chosen : 1 - 0.08 * chosen;
  const mult = kind === 'cor' ? GAME.bets.color : kind === 'naipe' ? GAME.bets.suit : GAME.bets.card;
  const chipDrop = picked ? interpolate(f, [pickAt + 4, pickAt + 14], [-260, 0], {...clamp, easing: t => 1 - Math.pow(1 - t, 3)}) : 0;
  const r = rise(f, 4 + i * 4, 12, 60);
  return (
    <div style={{position: 'relative', width: TILE_W, height: TILE_H, borderRadius: 40, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 34,
      background: picked && chosen > 0 ? 'color-mix(in srgb, var(--plum) 70%, var(--violet))' : 'var(--plum)',
      border: `4px solid ${picked && chosen > 0 ? 'var(--gold)' : 'var(--line-2)'}`,
      boxShadow: picked && chosen > 0 ? '0 0 70px color-mix(in srgb, var(--gold) 45%, transparent)' : '0 18px 40px rgba(0,0,0,.4)',
      opacity: r.opacity, filter: picked ? undefined : `brightness(${1 - 0.5 * chosen}) saturate(${1 - 0.4 * chosen})`, transform: `${r.transform} scale(${scale})`, perspective: 1200}}>
      <Art kind={kind} v={v} picked={picked} chosen={chosen} />
      <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 60, color: 'var(--amber)'}}>×{fmtX(mult)}</div>
      {picked && f >= pickAt + 4 && (
        <Chip i={v.casinoIndex} size={110} style={{position: 'absolute', top: -46, right: -34, transform: `translateY(${chipDrop}px) rotate(${chipDrop / 3}deg)`}} />
      )}
    </div>
  );
};

export const Aposta: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const pickAt = Math.round(duration * 0.45);
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 6, 5), alignItems: 'center'}}>
      <div style={{position: 'absolute', top: 180, display: 'flex', gap: 30, transform: `scale(${0.9 + 0.1 * pop(f, 0, 14)})`}}>
        {(['cor', 'naipe', 'carta'] as BetKind[]).map((k, i) => <Tile key={k} kind={k} v={v} f={f} i={i} pickAt={pickAt} />)}
      </div>
    </AbsoluteFill>
  );
};
