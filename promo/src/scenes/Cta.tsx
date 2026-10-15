import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GAME} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CardBack, CardFront} from '../components/PlayingCard';
import {Logo} from '../components/Stage';
import type {Variation} from '../variation';

// 6 · Call to action: logo over a fan of the round's card and the stage's card backs.
export const Cta: React.FC<{v: Variation; duration: number; chamada: string; legal: boolean}> = ({v, duration, chamada, legal}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fan = interpolate(f, [4, 22], [0, 1], {...clamp, easing: t => 1 - Math.pow(1 - t, 3)});
  const shine = interpolate((f / fps) % 2.2, [0, 0.9], [-30, 130], clamp);
  const w = 300, h = w * 162 / 116;
  const cards = [
    {r: -18, x: -230, y: 40, back: true},
    {r: 18, x: 230, y: 40, back: true},
    {r: 0, x: 0, y: 0, back: false},
  ];
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 8, 0), alignItems: 'center'}}>
      <AbsoluteFill style={{background: 'radial-gradient(60% 40% at 50% 38%, color-mix(in srgb, var(--glow-a) 40%, transparent), transparent 70%)'}} />
      <div style={{position: 'absolute', top: 260, left: 540, width: 0, height: 0}}>
        {cards.map((c, i) => (
          <div key={i} style={{position: 'absolute', left: -w / 2, top: 0, width: w, height: h, transformOrigin: '50% 120%',
            transform: `translate(${c.x * fan}px, ${c.y * fan}px) rotate(${c.r * fan}deg)`}}>
            {c.back ? <CardBack src={v.backSrc} w={w} flipped={false} /> : <CardFront card={v.card} w={w} />}
          </div>
        ))}
      </div>
      <Logo width={860} style={{position: 'absolute', top: 760, transform: `scale(${pop(f, 8, 16)})`}} />
      <p style={{position: 'absolute', top: 1260, margin: 0, fontFamily: F.display, fontSize: 84, color: 'var(--cream)', textAlign: 'center', textShadow: '0 6px 30px rgba(0,0,0,.6)', ...rise(f, 16, 12, 30)}}>
        Será que você acerta?
      </p>
      <div style={{position: 'absolute', top: 1420, padding: '34px 90px', borderRadius: 999, overflow: 'hidden', fontFamily: F.body, fontWeight: 800, fontSize: 62,
        color: 'var(--ink)', background: 'linear-gradient(180deg, #fff1bf, var(--gold) 45%, var(--amber))',
        boxShadow: '0 20px 50px rgba(0,0,0,.45), 0 0 60px color-mix(in srgb, var(--gold) 45%, transparent)', transform: `scale(${pop(f, 22, 14)})`}}>
        {chamada}
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${shine}%`, width: '22%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.65), transparent)', transform: 'skewX(-20deg)'}} />
      </div>
      {legal && (
        <p style={{position: 'absolute', bottom: 80, margin: 0, width: 920, textAlign: 'center', fontFamily: F.body, fontSize: 28, lineHeight: 1.4, color: 'var(--muted)', ...rise(f, 26, 10, 10)}}>
          {GAME.legal}
        </p>
      )}
    </AbsoluteFill>
  );
};
