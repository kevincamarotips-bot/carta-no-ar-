import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {fmt} from '../data/game';
import {F} from '../fonts';
import {pop, rise, sceneFade} from '../components/anim';
import {BetBadge} from '../components/BetBadge';
import {ChipRain} from '../components/Stage';
import type {Variation} from '../variation';

// 3 · The throw: the table does the moving (see Mesa); only the bet floats above it, as a picture.
export const Lancamento: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 5, 4), alignItems: 'center'}}>
      <BetBadge bet={v.bet} style={{position: 'absolute', top: 120, ...rise(f, 0, 10, 20)}} />
    </AbsoluteFill>
  );
};

// 4 · The card lands: the game's outcome title and the chips, nothing else.
export const Revelacao: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const win = v.bet.wins;
  const p = pop(f, 6, 15);
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 1, 6), alignItems: 'center'}}>
      <BetBadge bet={v.bet} state={win ? 'win' : 'lose'} style={{position: 'absolute', top: 120, transform: `scale(${0.8 + 0.2 * pop(f, 2, 12)})`}} />
      {win && <ChipRain start={10} n={20} seed={`rain${v.seed}`} />}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 1920 * 0.08, textAlign: 'center', padding: '0 40px', opacity: Math.min(1, p * 1.4),
        transform: `scale(${0.6 + 0.4 * p}) translateY(${(1 - p) * 50}px)`}}>
        <div style={{position: 'absolute', zIndex: -1, left: '-10%', right: '-10%', top: -170, bottom: -110,
          background: 'radial-gradient(ellipse 60% 55% at 50% 55%,rgba(5,3,12,.88),rgba(5,3,12,.55) 55%,transparent 75%)'}} />
        {win && <div style={{width: 880, height: 5, margin: '0 auto 30px', background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', boxShadow: '0 0 40px var(--gold)'}} />}
        <div style={{fontFamily: F.display, fontSize: win ? 150 : 112, lineHeight: 1, whiteSpace: 'nowrap', color: win ? 'var(--gold)' : 'var(--cream)',
          textShadow: win ? '0 0 70px color-mix(in srgb, var(--gold) 70%, transparent), 0 10px 0 rgba(0,0,0,.5)' : '0 10px 60px rgba(0,0,0,.7)'}}>
          {win ? 'Você ganhou!' : 'Não foi dessa vez'}
        </div>
        <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 84, marginTop: 22, color: win ? 'var(--gold)' : 'var(--muted)'}}>
          {win ? `+${fmt(v.bet.payout)}` : `−${fmt(v.bet.stake)}`}
        </div>
      </div>
    </AbsoluteFill>
  );
};
