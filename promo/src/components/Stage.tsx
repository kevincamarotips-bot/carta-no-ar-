import React from 'react';
import {AbsoluteFill, Img, interpolate, random, useCurrentFrame} from 'remotion';
import {VIDEO} from '../schema';
import {GAME, gloveKey, img} from '../data/game';
import {F} from '../fonts';

const STAR = 'polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)';

// The Mesa backdrop (.stage): stage gradients + glows of the visual, starry sky, sparks, orbs and the light beam.
export const StageBackdrop: React.FC<{tint: string; beam?: number}> = ({tint, beam = 1}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = VIDEO;
  const t = frame / fps;
  const stars = React.useMemo(() => Array.from({length: 70}, (_, i) => ({
    x: random(`sx${i}`) * 100, y: random(`sy${i}`) * 78, s: 3 + random(`ss${i}`) * 5, ph: random(`sp${i}`) * Math.PI * 2,
  })), []);
  const sparks = [[12, 16, 46], [84, 12, 34], [72, 46, 26], [18, 52, 30], [90, 70, 38], [8, 82, 24]];
  const orbs = [[9, 36, 38], [86, 30, 28], [78, 62, 22]];
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(90% 55% at 50% 108%,color-mix(in srgb,var(--amber) 55%,transparent),transparent 62%),
          radial-gradient(80% 60% at 0% 75%,color-mix(in srgb,var(--glow-a) 70%,transparent),transparent 62%),
          radial-gradient(80% 60% at 100% 70%,color-mix(in srgb,var(--glow-b) 40%,transparent),transparent 62%),
          linear-gradient(180deg,var(--stage-1),var(--stage-2) 55%,var(--stage-3))`,
      }}
    >
      {/* the stage's tint (.casino-tint) */}
      <AbsoluteFill style={{background: `radial-gradient(80% 55% at 50% 0%, color-mix(in srgb, ${tint} 45%, transparent), transparent 70%)`, mixBlendMode: 'screen'}} />
      {stars.map((s, i) => (
        <div key={i} style={{position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, borderRadius: '50%', background: 'var(--cream)',
          opacity: 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 1.6 + s.ph))}} />
      ))}
      {sparks.map(([x, y, s], i) => {
        const k = 0.5 + 0.5 * Math.sin((t / 3) * Math.PI * 2 + i * 1.3);
        return <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: s, height: s, background: 'var(--cream)', clipPath: STAR,
          opacity: 0.2 + 0.8 * k, transform: `scale(${0.6 + 0.4 * k}) rotate(${20 * k}deg)`}} />;
      })}
      {orbs.map(([x, y, s], i) => {
        const k = Math.sin((t / 7) * Math.PI * 2 + i * 2);
        return <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: s, height: s, borderRadius: '50%', opacity: 0.75,
          background: 'radial-gradient(circle at 35% 35%,#fff,color-mix(in srgb,var(--glow-b) 70%,#fff) 30%,transparent 70%)',
          transform: `translate(${k * 16}px, ${k * -36}px)`}} />;
      })}
      {/* the light beam over the table (.beam) */}
      <div style={{position: 'absolute', left: '50%', top: '-4%', width: '92%', height: '90%', transform: 'translateX(-50%)', opacity: beam,
        clipPath: 'polygon(8% 0,92% 0,64% 100%,36% 100%)',
        background: 'linear-gradient(180deg,rgba(246,239,255,0),color-mix(in srgb,var(--cream) 22%,transparent) 70%,color-mix(in srgb,var(--cream) 42%,transparent))'}} />
      {/* rune circle under the hand (.rune) */}
      <div style={{position: 'absolute', left: '50%', bottom: height * 0.21, width: width * 0.7, height: width * 0.7, transform: 'translate(-50%,30%)', opacity: 0.5}}>
        <svg viewBox="0 0 200 200" style={{width: '100%', height: '100%', transform: `rotate(${t * 9}deg)`}}>
          <g fill="none" stroke="var(--gold)" strokeOpacity=".55">
            <circle cx="100" cy="100" r="96" strokeWidth="1.2" />
            <circle cx="100" cy="100" r="80" strokeWidth=".8" strokeDasharray="2 6" />
            <circle cx="100" cy="100" r="62" strokeWidth="1" />
            {Array.from({length: 12}, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              return <line key={i} x1={100 + Math.cos(a) * 62} y1={100 + Math.sin(a) * 62} x2={100 + Math.cos(a) * 80} y2={100 + Math.sin(a) * 80} strokeWidth=".8" />;
            })}
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// The painted glove of the visual, framed exactly like the game's 360 × 290 hand box (GLOVE_FIT).
export const Glove: React.FC<{skin: string; width: number; style?: React.CSSProperties}> = ({skin, width, style}) => {
  const k = gloveKey(skin);
  const fit = GAME.gloveFit[k] ?? GAME.gloveFit.def;
  const sc = width / 360;
  return (
    <div style={{position: 'absolute', width, height: width * (290 / 360), ...style}}>
      <Img src={img('glove_' + k)} style={{position: 'absolute', left: fit.x * sc, top: fit.y * sc, width: fit.w * sc, height: fit.w * sc,
        filter: skin === 'meianoite' ? 'hue-rotate(-38deg) saturate(1.15)' : undefined}} />
    </div>
  );
};

export const Chip: React.FC<{i: number; size: number; style?: React.CSSProperties}> = ({i, size, style}) => (
  <Img src={img(`chip${i % 4}`)} style={{width: size, height: size, borderRadius: '50%', boxShadow: '0 8px 16px rgba(0,0,0,.45)', ...style}} />
);

// "FASE 3 Biblioteca Encantada" pill (.casino-badge)
export const CasinoBadge: React.FC<{phase: number; name: string; style?: React.CSSProperties}> = ({phase, name, style}) => (
  <div style={{display: 'inline-block', fontFamily: F.body, fontSize: 32, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--cream)', lineHeight: 1.3,
    padding: '14px 30px', borderRadius: 999, background: 'rgba(5,3,12,.55)', border: '2px solid var(--line-2)', whiteSpace: 'nowrap', ...style}}>
    <b style={{color: 'var(--gold)', fontWeight: 800, marginRight: 12}}>Fase {phase}</b>{name}
  </div>
);

export const Logo: React.FC<{width: number; style?: React.CSSProperties}> = ({width, style}) => (
  <Img src={img('logo')} style={{width, height: width * (403 / 760), filter: 'drop-shadow(0 10px 30px rgba(0,0,0,.6))', ...style}} />
);

// gold/cream star burst when the card lands (.burst)
export const Burst: React.FC<{x: number; y: number; start: number; n?: number; gold?: boolean; seed?: string}> = ({x, y, start, n = 18, gold, seed = 'b'}) => {
  const frame = useCurrentFrame();
  const t = frame - start;
  if (t < 0 || t > 45) return null;
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const ang = random(`${seed}a${i}`) * Math.PI * 2, dist = (70 + random(`${seed}d${i}`) * 110) * 2.6, size = (8 + random(`${seed}s${i}`) * 14) * 2.4;
        const life = 27 + random(`${seed}l${i}`) * 12;
        const p = interpolate(t, [0, life], [0, 1], {extrapolateRight: 'clamp', easing: k => 1 - Math.pow(1 - k, 3)});
        return <div key={i} style={{position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, clipPath: STAR,
          background: gold || random(`${seed}c${i}`) < 0.5 ? 'var(--gold)' : 'var(--cream)',
          transform: `translate(${Math.cos(ang) * dist * p}px, ${Math.sin(ang) * dist * p}px) scale(${0.2 + 0.8 * p}) rotate(${90 * p}deg)`, opacity: 1 - p}} />;
      })}
    </>
  );
};

// the chip rain of a win (chipRain), using the painted chips
export const ChipRain: React.FC<{start: number; n?: number; seed?: string}> = ({start, n = 26, seed = 'r'}) => {
  const frame = useCurrentFrame();
  const {height} = VIDEO;
  const t = frame - start;
  if (t < 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      {Array.from({length: n}, (_, i) => {
        const delay = random(`${seed}dl${i}`) * 12, dur = 42 + random(`${seed}du${i}`) * 27, s = (22 + random(`${seed}sz${i}`) * 22) * 2.6;
        const p = interpolate(t - delay, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
        if (p <= 0 || p >= 1) return null;
        const e = p * p;   // falls with gravity
        return <Chip key={i} i={i} size={s} style={{position: 'absolute', left: `${random(`${seed}x${i}`) * 100}%`, top: -s,
          transform: `translateY(${e * (height + 2 * s)}px) rotate(${e * (360 + random(`${seed}r${i}`) * 540)}deg)`}} />;
      })}
    </AbsoluteFill>
  );
};
