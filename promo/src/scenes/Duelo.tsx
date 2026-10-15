import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {img} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {Glove} from '../components/Stage';
import type {Variation} from '../variation';

// 5 · The stage's master: the player's glove faces the master's portrait. Just the name, no rules.
export const Duelo: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ring = interpolate(f, [0, duration], [0, 40], clamp);
  const pulse = 1 + Math.sin((f / fps) * Math.PI * 2 / 2.4) * 0.015;
  const vs = pop(f, 14, 12);
  const glove = interpolate(f, [4, 18], [300, 0], {...clamp, easing: t => 1 - Math.pow(1 - t, 3)});
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 7, 6), alignItems: 'center'}}>
      <AbsoluteFill style={{background: 'radial-gradient(70% 45% at 50% 40%, transparent, rgba(5,3,12,.6))'}} />
      <div style={{position: 'absolute', top: 160, display: 'inline-block', fontFamily: F.body, fontWeight: 800, fontSize: 44, letterSpacing: '.22em', textTransform: 'uppercase',
        color: 'var(--ink)', background: 'linear-gradient(90deg,var(--gold),var(--amber))', padding: '12px 36px 12px 46px', borderRadius: 999,
        transform: `scale(${pop(f, 0, 12)})`, boxShadow: '0 0 40px color-mix(in srgb, var(--gold) 55%, transparent)'}}>
        Duelo
      </div>
      <div style={{position: 'absolute', top: 330, width: 680, height: 680, transform: `scale(${pop(f, 4, 16) * pulse})`}}>
        <div style={{position: 'absolute', inset: -60, borderRadius: '50%', background: 'radial-gradient(closest-side, color-mix(in srgb, var(--gold) 45%, transparent), transparent)'}} />
        <svg viewBox="0 0 200 200" style={{position: 'absolute', inset: -40, width: 760, height: 760, transform: `rotate(${ring}deg)`}}>
          <circle cx="100" cy="100" r="96" fill="none" stroke="var(--gold)" strokeOpacity=".6" strokeWidth="1" strokeDasharray="2 5" />
        </svg>
        <Img src={img('master' + v.casinoIndex)} style={{position: 'absolute', inset: 0, width: 680, height: 680, borderRadius: '50%', boxShadow: '0 30px 70px rgba(0,0,0,.6)'}} />
      </div>
      <div style={{position: 'absolute', top: 1060, fontFamily: F.display, fontSize: 96, color: 'var(--gold)', textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,.6)', ...rise(f, 10, 12, 30)}}>
        {v.master.n}
      </div>
      <div style={{position: 'absolute', top: 1220, fontFamily: F.display, fontSize: 150, color: 'var(--cream)', transform: `scale(${vs})`, opacity: Math.min(1, vs * 1.5),
        textShadow: '0 0 50px color-mix(in srgb, var(--glow-a) 80%, transparent)'}}>VS</div>
      <Glove skin={v.skin.k} width={760} style={{left: (1080 - 760) / 2, bottom: -20, transform: `translateY(${glove}px)`}} />
    </AbsoluteFill>
  );
};
