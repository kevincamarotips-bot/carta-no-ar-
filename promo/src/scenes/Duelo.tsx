import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GAME, fmt, img} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CasinoBadge} from '../components/Stage';
import type {Variation} from '../variation';

// 5 · The stage's master and the real duel: a race to N points on the same card (Cor +1, Naipe +2, Valor +4).
export const Duelo: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const m = v.master;
  const ring = interpolate(f, [0, duration], [0, 40], clamp);
  const pulse = 1 + Math.sin((f / fps) * Math.PI * 2 / 2.4) * 0.015;
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 7, 6), alignItems: 'center'}}>
      <AbsoluteFill style={{background: 'radial-gradient(70% 45% at 50% 42%, transparent, rgba(5,3,12,.55))'}} />
      <CasinoBadge phase={v.casinoIndex + 1} name={v.casino.n} style={{position: 'absolute', top: 120, ...rise(f, 0, 10, 16)}} />
      <h2 style={{position: 'absolute', top: 230, margin: 0, fontFamily: F.display, fontWeight: 400, fontSize: 124, color: 'var(--cream)', textShadow: '0 6px 30px rgba(0,0,0,.6)', ...rise(f, 3, 12, 30)}}>
        Desafie o mestre
      </h2>
      <div style={{position: 'absolute', top: 440, width: 560, height: 560, transform: `scale(${pop(f, 6, 16) * pulse})`}}>
        <div style={{position: 'absolute', inset: -40, borderRadius: '50%', background: 'radial-gradient(closest-side, color-mix(in srgb, var(--gold) 45%, transparent), transparent)'}} />
        <svg viewBox="0 0 200 200" style={{position: 'absolute', inset: -34, width: 628, height: 628, transform: `rotate(${ring}deg)`}}>
          <circle cx="100" cy="100" r="96" fill="none" stroke="var(--gold)" strokeOpacity=".6" strokeWidth="1" strokeDasharray="2 5" />
        </svg>
        <Img src={img('master' + v.casinoIndex)} style={{position: 'absolute', inset: 0, width: 560, height: 560, borderRadius: '50%', boxShadow: '0 30px 70px rgba(0,0,0,.6)'}} />
      </div>
      <div style={{position: 'absolute', top: 1060, fontFamily: F.display, fontSize: 92, color: 'var(--gold)', textAlign: 'center', ...rise(f, 12, 12, 30)}}>{m.n}</div>
      <p style={{position: 'absolute', top: 1190, margin: 0, width: 900, textAlign: 'center', fontFamily: F.body, fontSize: 46, lineHeight: 1.3, color: 'var(--cream)', textWrap: 'balance', ...rise(f, 16, 12, 24)}}>
        {m.rule}
      </p>
      <div style={{position: 'absolute', top: 1420, display: 'flex', gap: 24}}>
        {GAME.duel.map((d, i) => (
          <div key={d.k} style={{width: 270, padding: '26px 0', borderRadius: 36, textAlign: 'center', background: 'var(--plum)', border: '3px solid var(--line-2)', ...rise(f, 20 + i * 4, 10, 30)}}>
            <div style={{fontFamily: F.display, fontSize: 56, color: 'var(--cream)'}}>{d.n}</div>
            <div style={{fontFamily: F.mono, fontWeight: 500, fontSize: 34, color: 'var(--amber)', marginTop: 4}}>+{d.pts} · {d.chance}%</div>
          </div>
        ))}
      </div>
      <p style={{position: 'absolute', top: 1660, margin: 0, fontFamily: F.body, fontSize: 36, color: 'var(--muted)', ...rise(f, 28, 10, 16)}}>
        Ingresso do duelo: {fmt(v.casino.fee)} fichas · nível {v.casino.lvl}
      </p>
    </AbsoluteFill>
  );
};
