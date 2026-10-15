import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GAME, fmt, fmtX, type Card} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CardFront} from '../components/PlayingCard';
import {CasinoBadge, Chip} from '../components/Stage';
import {Suit} from '../components/Suit';
import type {BetKind, Variation} from '../variation';

// 2 · "Faça sua aposta": three of the game's real bets (Cor, Naipe, Carta exata) as Mesa cells,
// with the real payouts and chances. The picked one lights up and takes a chip with the stake.
const SUITS: Card['suit'][] = ['S', 'H', 'D', 'C'];

const Cell: React.FC<{kind: BetKind; v: Variation; f: number; i: number; pickAt: number}> = ({kind, v, f, i, pickAt}) => {
  const picked = v.bet.kind === kind;
  const on = picked && f >= pickAt;
  const chipP = picked ? pop(f, pickAt, 12) : 0;
  const bump = picked ? interpolate(f, [pickAt, pickAt + 4, pickAt + 8], [1, 1.05, 1], clamp) : 1;
  const meta = {
    cor: {lbl: 'Cor', mult: GAME.bets.color, chance: '50%'},
    naipe: {lbl: 'Naipe', mult: GAME.bets.suit, chance: '25%'},
    carta: {lbl: 'Carta exata', mult: GAME.bets.card, chance: '1 em 52'},
  }[kind];

  let big: React.ReactNode;
  if (kind === 'cor'){
    big = picked
      ? <span style={{color: v.bet.red ? 'var(--card-red)' : 'var(--cream)'}}>{v.bet.label}</span>
      : <span><span style={{color: 'var(--card-red)'}}>Vermelho</span> ou Preto</span>;
  } else if (kind === 'naipe'){
    big = picked && v.bet.suit
      ? <span style={{display: 'flex', alignItems: 'center', gap: 18}}><Suit k={v.bet.suit} size={58} color={v.bet.red ? 'var(--card-red)' : 'var(--cream)'} />{v.bet.label}</span>
      : <span style={{display: 'flex', gap: 16}}>{SUITS.map(s => <Suit key={s} k={s} size={54} color={s === 'H' || s === 'D' ? 'var(--card-red)' : 'var(--cream)'} />)}</span>;
  } else {
    big = picked && v.bet.card ? <span>{v.bet.label}</span> : <span>Uma das 52</span>;
  }

  return (
    <div style={{position: 'relative', width: 920, height: 150, boxSizing: 'border-box', borderRadius: 38, padding: '26px 34px',
      display: 'flex', alignItems: 'center', gap: 30,
      background: on ? 'color-mix(in srgb, var(--plum) 75%, var(--violet))' : 'var(--plum)',
      border: `3px solid ${on ? 'color-mix(in srgb, var(--gold) 75%, transparent)' : 'var(--line-2)'}`,
      boxShadow: on ? '0 0 50px color-mix(in srgb, var(--gold) 30%, transparent)' : '0 14px 30px rgba(0,0,0,.35)',
      ...(() => { const r = rise(f, 8 + i * 5, 12, 40); return {opacity: r.opacity, transform: `${r.transform} scale(${bump})`}; })()}}>
      {kind === 'carta' && (
        <div style={{position: 'relative', width: 74, height: 74 * 162 / 116, flex: 'none'}}>
          <CardFront card={picked && v.bet.card ? v.bet.card : null} w={74} />
        </div>
      )}
      <div style={{display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0}}>
        <div style={{fontFamily: F.body, fontWeight: 600, fontSize: 32, color: 'var(--muted)'}}>{meta.lbl}</div>
        <div style={{fontFamily: F.display, fontSize: 58, lineHeight: 1, color: 'var(--cream)', whiteSpace: 'nowrap'}}>{big}</div>
      </div>
      <div style={{marginLeft: 'auto', textAlign: 'right', fontFamily: F.mono, fontWeight: 500, fontSize: 30, color: 'var(--muted)', lineHeight: 1.35, flex: 'none'}}>
        paga <b style={{color: 'var(--amber)', fontWeight: 500, fontSize: 44}}>×{fmtX(meta.mult)}</b>
        <div>chance {meta.chance}</div>
      </div>
      {picked && chipP > 0 && (
        <div style={{position: 'absolute', top: -24, right: 34, display: 'flex', alignItems: 'center', gap: 10, fontFamily: F.mono, fontWeight: 500, fontSize: 30,
          background: 'var(--ink)', borderRadius: 999, padding: '4px 20px 4px 4px', color: 'var(--cream)', transform: `scale(${chipP})`, border: '2px solid var(--line-2)'}}>
          <Chip i={2} size={44} style={{boxShadow: 'none'}} />{fmt(v.bet.stake)}
        </div>
      )}
    </div>
  );
};

export const Aposta: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const fade = sceneFade(f, duration, 6, 5);
  const pickAt = Math.round(duration * 0.5);
  return (
    <AbsoluteFill style={{opacity: fade, alignItems: 'center'}}>
      <CasinoBadge phase={v.casinoIndex + 1} name={v.casino.n} style={{position: 'absolute', top: 90, ...rise(f, 0, 10, 16)}} />
      <h2 style={{position: 'absolute', top: 170, margin: 0, fontFamily: F.display, fontWeight: 400, fontSize: 118, color: 'var(--cream)', textShadow: '0 6px 30px rgba(0,0,0,.6)', ...rise(f, 2, 12, 30)}}>
        Faça sua aposta
      </h2>
      <p style={{position: 'absolute', top: 310, margin: 0, fontFamily: F.body, fontSize: 44, color: 'color-mix(in srgb, var(--cream) 85%, transparent)', ...rise(f, 6, 12, 20)}}>
        Escolha antes de a carta cair.
      </p>
      <div style={{position: 'absolute', top: 396, display: 'flex', flexDirection: 'column', gap: 22}}>
        {(['cor', 'naipe', 'carta'] as BetKind[]).map((k, i) => <Cell key={k} kind={k} v={v} f={f} i={i} pickAt={pickAt} />)}
      </div>
    </AbsoluteFill>
  );
};
