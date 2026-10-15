import React from 'react';
import {AbsoluteFill, Freeze} from 'remotion';
import {z} from 'zod';
import {Desafio} from './Desafio';
import {F} from './fonts';
import {DEFAULT_PROPS, desafioSchema, type DesafioProps, SCENE_LABEL, VIDEO} from './schema';
import {buildTimeline} from './timeline';
import {resolveVariation} from './variation';
import {cardName} from './data/game';

// One still with a row per variation and a column per selected scene (a frame from the middle of each).
export const previaSchema = z.object({
  seeds: z.array(z.number().int().min(0)).min(1).max(12),
  base: desafioSchema,
});
type PreviaProps = z.infer<typeof previaSchema>;

const SCALE = 0.2, CW = VIDEO.width * SCALE, CH = VIDEO.height * SCALE, GAP = 16, LABEL = 300, HEAD = 70, PAD = 24;
// where in each scene the frame is taken (fraction of the scene)
const PICK: Record<string, number> = {gancho: 0.7, aposta: 0.8, lancamento: 0.3, revelacao: 0.6, duelo: 0.7, cta: 0.75};

export const PREVIA_SIZE = (rows: number, cenas: DesafioProps['cenas']) => {
  const cols = buildTimeline(cenas).length;
  return {width: Math.round(PAD * 2 + LABEL + cols * (CW + GAP)), height: Math.round(PAD * 2 + HEAD + rows * (CH + GAP))};
};

export const Previa: React.FC<PreviaProps> = ({seeds, base}) => {
  const slots = buildTimeline(base.cenas);
  return (
    <AbsoluteFill style={{background: '#0a0618', color: '#f7f0ff', fontFamily: F.body, padding: PAD}}>
      <div style={{display: 'flex', height: HEAD, alignItems: 'center', paddingLeft: LABEL}}>
        {slots.map(s => (
          <div key={s.id} style={{width: CW + GAP, fontSize: 18, fontWeight: 600}}>
            {SCENE_LABEL[s.id]}<div style={{fontFamily: F.mono, fontSize: 14, color: '#ab9fd2'}}>{(s.from / VIDEO.fps).toFixed(1)}–{((s.from + s.duration) / VIDEO.fps).toFixed(1)} s</div>
          </div>
        ))}
      </div>
      {seeds.map(seed => {
        const props = {...DEFAULT_PROPS, ...base, seed};
        const v = resolveVariation(props);
        return (
          <div key={seed} style={{display: 'flex', height: CH + GAP}}>
            <div style={{width: LABEL, paddingRight: 20, boxSizing: 'border-box', fontSize: 18, lineHeight: 1.35}}>
              <div style={{fontFamily: F.display, fontSize: 30, color: '#f3cf6e'}}>Semente {seed}</div>
              <div>Fase {v.casinoIndex + 1} · {v.casino.n}</div>
              <div>{v.skin.n}</div>
              <div style={{marginTop: 8}}>{v.bet.title}: {v.bet.label}</div>
              <div>Carta: {cardName(v.card)}</div>
              <div>{v.bet.wins ? 'Acerta' : 'Erra'}</div>
              <div style={{marginTop: 8, color: '#ab9fd2'}}>“{v.hook.title}”</div>
            </div>
            {slots.map(s => (
              <div key={s.id} style={{position: 'relative', width: CW, height: CH, marginRight: GAP, overflow: 'hidden', borderRadius: 10}}>
                <div style={{position: 'absolute', left: 0, top: 0, width: VIDEO.width, height: VIDEO.height, transform: `scale(${SCALE})`, transformOrigin: '0 0'}}>
                  <Freeze frame={Math.round(s.from + s.duration * (PICK[s.id] ?? 0.6))}>
                    <Desafio {...props} />
                  </Freeze>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
