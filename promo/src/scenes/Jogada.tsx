import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {cardName, fmt, fmtX} from '../data/game';
import {F} from '../fonts';
import {pop, rise, sceneFade} from '../components/anim';
import {CardFront} from '../components/PlayingCard';
import {ChipRain} from '../components/Stage';
import type {Variation} from '../variation';

// The result plaque at the top of the stage (.rp), as the game shows it during a round.
const Plaque: React.FC<{name: string; note?: string; amt?: string; win?: boolean; mini?: Variation['card']; style?: React.CSSProperties}> = ({name, note, amt, win, mini, style}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 26, padding: '20px 36px 20px 20px', borderRadius: 40, background: 'rgba(8,5,20,.8)',
    border: '2px solid rgba(246,239,255,.16)', boxShadow: '0 16px 44px rgba(0,0,0,.35)', maxWidth: 960, boxSizing: 'border-box', ...style}}>
    {mini && <div style={{position: 'relative', width: 78, height: 78 * 162 / 116, flex: 'none'}}><CardFront card={mini} w={78} /></div>}
    <div style={{textAlign: 'left'}}>
      <div style={{fontFamily: F.display, fontSize: 56, lineHeight: 1.1, color: 'var(--cream)'}}>{name}</div>
      {(amt || note) && (
        <div style={{display: 'flex', gap: 18, alignItems: 'baseline', marginTop: 6, flexWrap: 'wrap'}}>
          {amt && <span style={{fontFamily: F.mono, fontWeight: 500, fontSize: 40, color: win ? 'var(--gold)' : 'var(--muted)'}}>{amt}</span>}
          {note && <span style={{fontFamily: F.body, fontSize: 34, color: 'var(--cream)', opacity: 0.85}}>{note}</span>}
        </div>
      )}
    </div>
  </div>
);

const betLine = (v: Variation) => `${v.bet.label} · ${v.bet.title} ×${fmtX(v.bet.mult)}`;

// 3 · The throw: the table does the moving (see Mesa), this layer only carries the plaque.
export const Lancamento: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 5, 4), alignItems: 'center'}}>
      <Plaque name="O mágico joga para a mesa…" note={`${fmt(v.bet.stake)} fichas suas na mesa`} style={{position: 'absolute', top: 110, ...rise(f, 0, 10, 20)}} />
      <BetTag v={v} f={f} />
    </AbsoluteFill>
  );
};

const BetTag: React.FC<{v: Variation; f: number}> = ({v, f}) => (
  <div style={{position: 'absolute', top: 330, fontFamily: F.body, fontWeight: 600, fontSize: 36, color: 'var(--cream)', padding: '12px 28px', borderRadius: 999,
    background: 'rgba(5,3,12,.55)', border: '2px solid color-mix(in srgb, var(--gold) 60%, transparent)', ...rise(f, 4, 10, 16)}}>
    Sua aposta: <span style={{color: 'var(--gold)'}}>{betLine(v)}</span>
  </div>
);

// 4 · The card lands: the game's full-screen outcome (.outcome) with its real texts.
export const Revelacao: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const win = v.bet.wins;
  const p = pop(f, 6, 15);
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 1, 6), alignItems: 'center'}}>
      <Plaque mini={v.card} name={cardName(v.card)} amt={win ? `+${fmt(v.bet.payout)} fichas` : `−${fmt(v.bet.stake)} fichas`} win={win}
        style={{position: 'absolute', top: 110, ...rise(f, 2, 10, 20)}} />
      <BetTag v={v} f={f} />
      {win && <ChipRain start={10} n={20} seed={`rain${v.seed}`} />}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 1920 * 0.08, textAlign: 'center', padding: '0 50px', opacity: Math.min(1, p * 1.4),
        transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 50}px)`}}>
        <div style={{position: 'absolute', zIndex: -1, left: '-10%', right: '-10%', top: -170, bottom: -110,
          background: 'radial-gradient(ellipse 60% 55% at 50% 55%,rgba(5,3,12,.88),rgba(5,3,12,.55) 55%,transparent 75%)'}} />
        {win && <div style={{width: 880, height: 5, margin: '0 auto 30px', background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', boxShadow: '0 0 40px var(--gold)'}} />}
        <div style={{fontFamily: F.display, fontSize: win ? 150 : 112, lineHeight: 1, whiteSpace: 'nowrap', color: win ? 'var(--gold)' : 'var(--cream)',
          textShadow: win ? '0 0 70px color-mix(in srgb, var(--gold) 70%, transparent), 0 10px 0 rgba(0,0,0,.5)' : '0 10px 60px rgba(0,0,0,.7)'}}>
          {win ? 'Você ganhou!' : 'Não foi dessa vez'}
        </div>
        <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 76, marginTop: 22, color: win ? 'var(--gold)' : 'var(--muted)'}}>
          {win ? `+${fmt(v.bet.payout)} fichas` : `−${fmt(v.bet.stake)} fichas`}
        </div>
        <div style={{fontFamily: F.body, fontSize: 42, color: 'var(--cream)', opacity: 0.85, marginTop: 14}}>{cardName(v.card)}</div>
      </div>
    </AbsoluteFill>
  );
};
