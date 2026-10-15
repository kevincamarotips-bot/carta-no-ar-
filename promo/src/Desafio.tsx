import React from 'react';
import {AbsoluteFill, interpolate, Sequence, useCurrentFrame} from 'remotion';
import {clamp} from './components/anim';
import {Mesa, type MesaState, restCenter, THROW_FRAMES} from './components/Mesa';
import {Burst, StageBackdrop} from './components/Stage';
import {F} from './fonts';
import {Aposta} from './scenes/Aposta';
import {Cta} from './scenes/Cta';
import {Duelo} from './scenes/Duelo';
import {Gancho} from './scenes/Gancho';
import {Lancamento, Revelacao} from './scenes/Jogada';
import {type DesafioProps, type SceneId, VIDEO} from './schema';
import {buildTimeline, type Slot} from './timeline';
import {paletteVars, resolveVariation, type Variation} from './variation';

const WINDUP = 3;   // frames before the card leaves the hand

// the table (glove + card) runs continuously across Aposta → Lançamento → Revelação
function mesaAt(frame: number, slots: Slot[]): {state: MesaState; opacity: number; handBob?: number} | null {
  const get = (id: SceneId) => slots.find(s => s.id === id);
  const a = get('aposta'), l = get('lancamento'), r = get('revelacao');
  const span = [a, l, r].filter(Boolean) as Slot[];
  if (!span.length) return null;
  const start = span[0].from, end = span[span.length - 1].from + span[span.length - 1].duration;
  if (frame < start || frame >= end) return null;
  const opacity = Math.min(interpolate(frame, [start, start + 8], [0, 1], clamp), interpolate(frame, [end - 6, end], [1, 0], clamp));
  if (a && frame < a.from + a.duration) return {state: {mode: 'idle'}, opacity};
  if (l && frame < l.from + l.duration){
    const dur = Math.min(THROW_FRAMES, l.duration - WINDUP - 1);
    const p = (frame - l.from - WINDUP) / dur;
    return {state: p < 0 ? {mode: 'idle'} : p < 1 ? {mode: 'throw', p} : {mode: 'rest'}, opacity, handBob: l.from};
  }
  if (r){
    if (l) return {state: {mode: 'rest'}, opacity};
    return {state: {mode: 'rest', pop: interpolate(frame, [r.from, r.from + 14], [0, 1], clamp)}, opacity};
  }
  return null;
}

function landFrame(slots: Slot[]){
  const l = slots.find(s => s.id === 'lancamento'), r = slots.find(s => s.id === 'revelacao');
  if (l) return l.from + WINDUP + Math.min(THROW_FRAMES, l.duration - WINDUP - 1);
  if (r) return r.from + 8;
  return null;
}

const Scene: React.FC<{slot: Slot; v: Variation; props: DesafioProps}> = ({slot, v, props}) => {
  const d = slot.duration;
  switch (slot.id){
    case 'gancho': return <Gancho v={v} duration={d} />;
    case 'aposta': return <Aposta v={v} duration={d} />;
    case 'lancamento': return <Lancamento v={v} duration={d} />;
    case 'revelacao': return <Revelacao v={v} duration={d} />;
    case 'duelo': return <Duelo v={v} duration={d} />;
    case 'cta': return <Cta v={v} duration={d} chamada={props.chamada} legal={props.mostrarLegal} />;
  }
};

export const Desafio: React.FC<DesafioProps> = props => {
  const frame = useCurrentFrame();
  const {width, height} = VIDEO;
  const v = React.useMemo(() => resolveVariation(props), [props]);
  const slots = React.useMemo(() => buildTimeline(props.cenas), [props.cenas]);
  const mesa = mesaAt(frame, slots);
  const land = landFrame(slots);
  const lit = land !== null ? interpolate(frame, [land, land + 33], [1.8, 1], clamp) : 1;   // beamPulse
  const rc = restCenter(width, height);
  const inDuelOrCta = slots.some(s => (s.id === 'duelo' || s.id === 'cta') && frame >= s.from && frame < s.from + s.duration);

  return (
    <AbsoluteFill style={{...paletteVars(v.palette), fontFamily: F.body, color: 'var(--cream)', background: 'var(--ink)', overflow: 'hidden'} as React.CSSProperties}>
      <AbsoluteFill style={{filter: `brightness(${lit})`}}>
        <StageBackdrop tint={v.casino.tint} beam={inDuelOrCta ? 0.35 : 1} />
      </AbsoluteFill>
      {mesa && <Mesa state={mesa.state} opacity={mesa.opacity} card={v.card} backSrc={v.backSrc} skin={v.skin.k} handBobStart={mesa.handBob} />}
      {land !== null && <Burst x={rc.x} y={rc.y} start={land} n={18} seed={`burst${v.seed}`} />}
      {slots.map(s => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.duration} name={s.id} layout="none">
          <Scene slot={s} v={v} props={props} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
