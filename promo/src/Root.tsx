import React from 'react';
import {type CalculateMetadataFunction, Composition, Folder} from 'remotion';
import {Desafio} from './Desafio';
import {waitForFonts} from './fonts';
import {Previa, previaSchema, PREVIA_SIZE} from './Previa';
import {DEFAULT_PROPS, type DesafioProps, desafioSchema, TOTAL_FRAMES, VIDEO} from './schema';
import {resolveVariation} from './variation';

waitForFonts();

// file name that says what is in the video: desafio_s3_biblioteca_naipe_acerto
const metadata: CalculateMetadataFunction<DesafioProps> = ({props}) => {
  const v = resolveVariation(props);
  return {defaultOutName: `desafio_s${props.seed}_${v.casino.k}_${v.bet.kind}_${props.resultado}`};
};

// sidebar of the Studio: the editable video plus ready-made variations to compare
export const VARIATION_SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Desafio"
      component={Desafio}
      schema={desafioSchema}
      defaultProps={DEFAULT_PROPS}
      calculateMetadata={metadata}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO.fps}
      width={VIDEO.width}
      height={VIDEO.height}
    />
    <Folder name="Variacoes">
      {VARIATION_SEEDS.map(seed => {
        const v = resolveVariation({...DEFAULT_PROPS, seed});
        return (
          <Composition
            key={seed}
            id={`Desafio-${seed}-${v.casino.k}-${v.bet.kind}`}
            component={Desafio}
            schema={desafioSchema}
            defaultProps={{...DEFAULT_PROPS, seed}}
            calculateMetadata={metadata}
            durationInFrames={TOTAL_FRAMES}
            fps={VIDEO.fps}
            width={VIDEO.width}
            height={VIDEO.height}
          />
        );
      })}
    </Folder>
    {/* contact sheet: every selected scene of several variations side by side */}
    <Composition
      id="Previa"
      component={Previa}
      schema={previaSchema}
      defaultProps={{seeds: VARIATION_SEEDS.slice(0, 6), base: DEFAULT_PROPS}}
      calculateMetadata={({props}) => ({...PREVIA_SIZE(props.seeds.length, props.base.cenas)})}
      durationInFrames={TOTAL_FRAMES}
      fps={VIDEO.fps}
      width={1600}
      height={1600}
    />
  </>
);
