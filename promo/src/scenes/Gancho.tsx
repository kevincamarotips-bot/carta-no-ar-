import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {img} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CardBack} from '../components/PlayingCard';
import {CasinoBadge, Logo} from '../components/Stage';
import type {Variation} from '../variation';

// 1 · Hook: the challenge, over the stage's floating island (the Início screen art).
export const Gancho: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const fade = sceneFade(f, duration, 4, 6);
  const island = pop(f, 6, 18);
  const float = Math.sin(t * Math.PI * 2 / 3.2) * 16;
  const titleSize = v.hook.title.length > 18 ? 118 : 150;
  const cardW = 170;
  return (
    <AbsoluteFill style={{opacity: fade, alignItems: 'center'}}>
      <Logo width={420} style={{position: 'absolute', top: 70, ...rise(f, 0, 12, 20)}} />
      <div style={{position: 'absolute', top: 360, width: '100%', textAlign: 'center', padding: '0 70px', boxSizing: 'border-box'}}>
        <div style={{display: 'inline-block', fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: '.22em', textTransform: 'uppercase',
          color: 'var(--ink)', background: 'linear-gradient(90deg,var(--gold),var(--amber))', padding: '12px 34px 12px 42px', borderRadius: 999,
          transform: `scale(${pop(f, 2, 12)})`, boxShadow: '0 0 40px color-mix(in srgb, var(--gold) 55%, transparent)'}}>
          {v.hook.kicker}
        </div>
        <h1 style={{margin: '36px 0 0', fontFamily: F.display, fontWeight: 400, fontSize: titleSize, lineHeight: 1.02, color: 'var(--cream)', textWrap: 'balance',
          textShadow: '0 6px 40px rgba(0,0,0,.7)', ...rise(f, 6, 14, 50)}}>
          {v.hook.title}
        </h1>
        <p style={{margin: '30px auto 0', maxWidth: 860, fontFamily: F.body, fontSize: 48, lineHeight: 1.3, color: 'color-mix(in srgb, var(--cream) 88%, transparent)', textWrap: 'balance', ...rise(f, 14, 14, 30)}}>
          {v.hook.sub}
        </p>
      </div>
      <div style={{position: 'absolute', top: 1190, left: 150, width: 780, height: 780 * (462 / 560), transform: `translateY(${float}px) scale(${island})`, opacity: Math.min(1, island * 1.5)}}>
        <div style={{position: 'absolute', inset: '-10%', background: 'radial-gradient(closest-side, color-mix(in srgb, var(--glow-a) 55%, transparent), transparent)'}} />
        <Img src={img('stage' + v.casinoIndex)} style={{position: 'relative', width: '100%', height: '100%', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.55))'}} />
        {/* the card waiting above the stage */}
        <div style={{position: 'absolute', left: 390 - cardW / 2, top: -cardW * 0.75, width: cardW, height: cardW * 162 / 116, transformStyle: 'preserve-3d',
          transform: `translateY(${-float * 1.6}px) rotateZ(-8deg) rotateY(${interpolate(f, [0, duration], [0, 50], clamp)}deg)`, opacity: interpolate(f, [16, 26], [0, 1], clamp)}}>
          <CardBack src={v.backSrc} w={cardW} flipped={false} />
        </div>
      </div>
      <CasinoBadge phase={v.casinoIndex + 1} name={v.casino.n} style={{position: 'absolute', bottom: 56, ...rise(f, 20, 12, 20)}} />
    </AbsoluteFill>
  );
};
