import {Easing, interpolate} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// scene content in/out: fades and lifts in, fades out at the end
export function sceneFade(frame: number, duration: number, inF = 8, outF = 6){
  const a = inF > 0 ? interpolate(frame, [0, inF], [0, 1], clamp) : 1;
  const b = outF > 0 ? interpolate(frame, [duration - outF, duration], [1, 0], clamp) : 1;
  return Math.min(a, b);
}

// the game's pop-in (cubic-bezier(.2,1.5,.4,1)): overshoots a little
export const popEase = Easing.bezier(0.2, 1.5, 0.4, 1);
export function pop(frame: number, start: number, len = 15){
  return interpolate(frame, [start, start + len], [0, 1], {...clamp, easing: popEase});
}
export function rise(frame: number, start: number, len = 14, dist = 40){
  const p = interpolate(frame, [start, start + len], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return {opacity: p, transform: `translateY(${(1 - p) * dist}px)`};
}
export {clamp};
