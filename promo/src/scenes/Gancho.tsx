import React from 'react';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {img} from '../data/game';
import {F} from '../fonts';
import {clamp, pop, rise, sceneFade} from '../components/anim';
import {CardBack} from '../components/PlayingCard';
import {Logo} from '../components/Stage';
import type {Variation} from '../variation';

// 1 · Hook: a short challenge over the stage's floating island (the Início art), with the card spinning above it.
export const Gancho: React.FC<{v: Variation; duration: number}> = ({v, duration}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const island = pop(f, 4, 18);
  const float = Math.sin(t * Math.PI * 2 / 3.2) * 16;
  const titleSize = v.hook.title.length > 16 ? 124 : 150;
  const cardW = 230;
  return (
    <AbsoluteFill style={{opacity: sceneFade(f, duration, 4, 6), alignItems: 'center'}}>
      <Logo width={380} style={{position: 'absolute', top: 80, ...rise(f, 0, 12, 20)}} />
      <div style={{position: 'absolute', top: 340, width: '100%', textAlign: 'center', padding: '0 60px', boxSizing: 'border-box'}}>
        <div style={{display: 'inline-block', fontFamily: F.body, fontWeight: 800, fontSize: 40, letterSpacing: '.22em', textTransform: 'uppercase',
          color: 'var(--ink)', background: 'linear-gradient(90deg,var(--gold),var(--amber))', padding: '12px 34px 12px 42px', borderRadius: 999,
          transform: `scale(${pop(f, 2, 12)})`, boxShadow: '0 0 40px color-mix(in srgb, var(--gold) 55%, transparent)'}}>
          {v.hook.kicker}
        </div>
        <h1 style={{margin: '34px 0 0', fontFamily: F.display, fontWeight: 400, fontSize: titleSize, lineHeight: 1.02, color: 'var(--cream)', textWrap: 'balance',
          textShadow: '0 6px 40px rgba(0,0,0,.7)', ...rise(f, 6, 14, 50)}}>
          {v.hook.title}
        </h1>
      </div>
      <div style={{position: 'absolute', top: 1000, left: 60, width: 960, height: 960 * (462 / 560), transform: `translateY(${float}px) scale(${island})`, opacity: Math.min(1, island * 1.5)}}>
        <div style={{position: 'absolute', inset: '-10%', background: 'radial-gradient(closest-side, color-mix(in srgb, var(--glow-a) 55%, transparent), transparent)'}} />
        <Img src={img('stage' + v.casinoIndex)} style={{position: 'relative', width: '100%', height: '100%', filter: 'drop-shadow(0 30px 40px rgba(0,0,0,.55))'}} />
        <div style={{position: 'absolute', left: 480 - cardW / 2, top: -cardW * 0.95, width: cardW, height: cardW * 162 / 116, transformStyle: 'preserve-3d',
          transform: `translateY(${-float * 1.6}px) rotateZ(-8deg) rotateY(${interpolate(f, [0, duration], [0, 70], clamp)}deg)`, opacity: interpolate(f, [12, 22], [0, 1], clamp)}}>
          <CardBack src={v.backSrc} w={cardW} flipped={false} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
