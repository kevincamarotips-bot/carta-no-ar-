import React from 'react';
import {fmtX} from '../data/game';
import {F} from '../fonts';
import type {Bet} from '../variation';
import {CardFront} from './PlayingCard';
import {Suit} from './Suit';

// The bet as a picture: a colour disc, a suit or the mini card, plus the payout.
export const BetIcon: React.FC<{bet: Bet; size: number}> = ({bet, size}) => {
  if (bet.kind === 'cor'){
    return <div style={{width: size, height: size, borderRadius: '50%', background: bet.red ? 'var(--card-red)' : 'var(--card-black)',
      border: `${size * 0.07}px solid var(--cream)`, boxSizing: 'border-box', boxShadow: '0 6px 16px rgba(0,0,0,.4)'}} />;
  }
  if (bet.kind === 'naipe' && bet.suit){
    return <Suit k={bet.suit} size={size} color={bet.red ? 'var(--card-red)' : 'var(--cream)'} style={{filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.5))'}} />;
  }
  const w = size * 0.74;
  return <div style={{position: 'relative', width: w, height: w * 162 / 116}}><CardFront card={bet.card ?? null} w={w} /></div>;
};

export const BetBadge: React.FC<{bet: Bet; state?: 'on' | 'win' | 'lose'; style?: React.CSSProperties}> = ({bet, state = 'on', style}) => {
  const ring = state === 'lose' ? 'var(--muted)' : 'var(--gold)';
  return (
    <div style={{display: 'inline-flex', alignItems: 'center', gap: 22, padding: '14px 34px 14px 18px', borderRadius: 999, background: 'rgba(8,5,20,.8)',
      border: `3px solid color-mix(in srgb, ${ring} 70%, transparent)`, boxShadow: '0 14px 40px rgba(0,0,0,.4)', ...style}}>
      <div style={{width: 92, height: 92, display: 'grid', placeItems: 'center'}}><BetIcon bet={bet} size={bet.kind === 'carta' ? 92 : 76} /></div>
      <span style={{fontFamily: F.mono, fontWeight: 500, fontSize: 64, color: state === 'lose' ? 'var(--muted)' : 'var(--gold)'}}>×{fmtX(bet.mult)}</span>
      {state !== 'on' && (
        <span style={{width: 70, height: 70, borderRadius: '50%', display: 'grid', placeItems: 'center', fontFamily: F.body, fontWeight: 800, fontSize: 46,
          background: state === 'win' ? 'var(--gold)' : 'var(--plum-2)', color: state === 'win' ? 'var(--ink)' : 'var(--muted)'}}>
          {state === 'win' ? '✓' : '✕'}
        </span>
      )}
    </div>
  );
};
