import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {VIDEO} from '../schema';
import type {Card} from '../data/game';
import {Card3D} from './PlayingCard';
import {Glove} from './Stage';

// The magician's table: the glove at the bottom and the flying card (.hand + .flywrap + .flyer).
// The throw replays the game's throwCard() keyframes, scaled to a 1920 px tall stage.

export const K = 3.2;                 // game px → video px
export const CARD_W = 116 * K;
export const THROW_FRAMES = 69;       // 2300 ms at 30 fps, like the game
const FLY_BOTTOM = 0.27;              // .flywrap{bottom:27%}

type Key = {o: number; y: number; z: number; ry: number; s: number; ease?: (t: number) => number};
const cb = Easing.bezier;
// T(y, z, ry, s) keyframes from throwCard(): top = -h·0,58 (here 0,52 so the card stays in frame), rest = -h·0,2
const throwKeys = (h: number): Key[] => {
  const top = -h * 0.52, rest = -h * 0.2;
  return [
    {o: 0, y: 0, z: -8, ry: 180, s: 0.72},
    {o: 0.12, y: 16 * K, z: -8, ry: 180, s: 0.68, ease: cb(0.2, 0.8, 0.3, 1)},
    {o: 0.52, y: top, z: 200, ry: 1260, s: 1, ease: cb(0.4, 0, 0.6, 1)},
    {o: 0.78, y: top * 0.7, z: 320, ry: 1620, s: 1.08, ease: cb(0.2, 0.7, 0.2, 1)},
    {o: 1, y: rest, z: 360, ry: 1800, s: 1.16},
  ];
};
function at(keys: Key[], p: number){
  const t = Math.max(0, Math.min(1, p));
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].o) i++;
  const a = keys[i], b = keys[i + 1];
  const local = (b.o - a.o) ? (t - a.o) / (b.o - a.o) : 1;
  const e = a.ease ? a.ease(local) : local;   // WAAPI: a keyframe's easing applies to the segment it starts
  const L = (x: number, y: number) => x + (y - x) * e;
  return {y: L(a.y, b.y), z: L(a.z, b.z), ry: L(a.ry, b.ry), s: L(a.s, b.s)};
}
const T = (y: number, z: number, ry: number, s: number) => `translate(-50%, ${y}px) rotateZ(${z}deg) rotateY(${ry}deg) scale(${s.toFixed(3)})`;

export type MesaState =
  | {mode: 'idle'}
  | {mode: 'throw'; p: number}                // 0..1 of the throw
  | {mode: 'rest'; pop?: number};             // card face up at rest; pop 0..1 = quick flip when there was no throw

export const Mesa: React.FC<{state: MesaState; card: Card; backSrc: string; skin: string; opacity?: number; handY?: number; gold?: boolean; handBobStart?: number}> = ({state, card, backSrc, skin, opacity = 1, handY = 0, gold, handBobStart}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = VIDEO;   // fixed 1080 × 1920 (also inside the Prévia grid)
  const keys = throwKeys(height);

  let tf: string, showFace = false;
  if (state.mode === 'idle'){
    tf = T(0, -8, 180, 0.72);
  } else if (state.mode === 'throw'){
    const v = at(keys, state.p);
    tf = T(v.y, v.z, v.ry, v.s);
    showFace = state.p >= 0.74;               // setFront() at dur·0,74
  } else {
    const end = keys[keys.length - 1];
    const pop = state.pop ?? 1;
    tf = T(end.y, 360, 180 + 1620 * Easing.out(Easing.cubic)(pop), end.s * interpolate(pop, [0, 1], [0.85, 1]));
    showFace = pop > 0.4;
  }
  const busy = state.mode === 'throw';
  const hover = busy ? 0 : Math.sin((frame / fps / 3.2) * Math.PI * 2) * -3 * K - 3 * K;

  // the hand's flick: translateY 0 → 10 px (scaleY .97) → −16 px → 0 over 700 ms, ease-out
  let hy = 0, hs = 1;
  if (handBobStart !== undefined){
    const p = Easing.out(Easing.ease)(interpolate(frame - handBobStart, [0, 21], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
    hy = interpolate(p, [0, 0.33, 0.67, 1], [0, 10 * K, -16 * K, 0]);
    hs = interpolate(p, [0, 0.33, 0.67, 1], [1, 0.97, 1, 1]);
  }

  const gloveW = 840;
  const cardH = CARD_W * (162 / 116);
  return (
    <AbsoluteFill style={{opacity, perspective: 1000 * K, transform: `translateY(${handY}px)`}}>
      <Glove skin={skin} width={gloveW} style={{left: (width - gloveW) / 2, bottom: -6 * K, transformOrigin: '50% 100%', transform: `translateY(${hy}px) scaleY(${hs})`}} />
      <div style={{position: 'absolute', left: width / 2, top: height * (1 - FLY_BOTTOM) - cardH, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateY(${hover}px)`}}>
        <Card3D card={showFace ? card : null} gold={showFace && gold} w={CARD_W} backSrc={backSrc} transform={tf} style={{left: 0, top: 0}} />
      </div>
    </AbsoluteFill>
  );
};

// where the card's centre rests after landing (for the star burst)
export const restCenter = (width: number, height: number) => {
  const cardH = CARD_W * (162 / 116);
  return {x: width / 2, y: height * (1 - FLY_BOTTOM) - cardH / 2 - height * 0.2};
};
