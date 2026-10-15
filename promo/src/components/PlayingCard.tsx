import React from 'react';
import {type Card, rankOf, suitOf} from '../data/game';
import {F} from '../fonts';
import {Suit} from './Suit';

// The game's card: cream face (.face.front) with Marcellus corners and a big centre pip,
// and the painted back of the current visual (--back-art). Ratio 116 × 162, like the game.
export const CARD_RATIO = 162 / 116;

const faceBase: React.CSSProperties = {
  position: 'absolute', inset: 0, borderRadius: '10.3%/7.4%', overflow: 'hidden',
  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
};

export const CardFront: React.FC<{card: Card | null; w: number; gold?: boolean; style?: React.CSSProperties}> = ({card, w, gold, style}) => {
  const s = card ? suitOf(card.suit) : null;
  const color = s?.red ? 'var(--card-red)' : 'var(--card-black)';
  const r = card ? rankOf(card) : '';
  const corner = (rot: boolean): React.CSSProperties => ({
    position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: w * 0.012,
    fontFamily: F.display, fontSize: w * 0.19, lineHeight: 0.95,
    ...(rot ? {right: w * 0.078, bottom: w * 0.078, transform: 'rotate(180deg)'} : {left: w * 0.078, top: w * 0.078}),
  });
  return (
    <div
      style={{
        ...faceBase,
        background: gold ? 'linear-gradient(135deg,#fff3c9,var(--gold) 45%,#f8e3a5 55%,var(--amber))' : 'var(--cream)',
        color,
        boxShadow: gold
          ? '0 0 0 6px var(--gold), 0 0 90px 18px color-mix(in srgb, var(--gold) 65%, transparent)'
          : '0 30px 60px rgba(0,0,0,.5), inset 0 0 0 2px rgba(0,0,0,.08)',
        ...style,
      }}
    >
      {card && s ? (
        <>
          <div style={corner(false)}>{r}<Suit k={s.k} size={w * 0.13} color={color} /></div>
          {card.v >= 11 ? (
            <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: F.display, fontSize: w * 0.48, lineHeight: 1}}>
                {r}
                <Suit k={s.k} size={w * 0.24} color={color} style={{marginTop: w * 0.02}} />
              </div>
            </div>
          ) : (
            <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>
              <Suit k={s.k} size={w * 0.46} color={color} />
            </div>
          )}
          <div style={corner(true)}>{r}<Suit k={s.k} size={w * 0.13} color={color} /></div>
        </>
      ) : (
        <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: F.display, fontSize: w * 0.52, color: 'var(--plum-2)', opacity: 0.25}}>?</div>
      )}
    </div>
  );
};

export const CardBack: React.FC<{src: string; w: number; flipped?: boolean}> = ({src, w, flipped = true}) => (
  <div
    style={{
      ...faceBase,
      transform: flipped ? 'rotateY(180deg)' : undefined,
      background: `url(${src}) center/100% 100% no-repeat`,
      boxShadow: `0 ${w * 0.1}px ${w * 0.2}px rgba(0,0,0,.55), 0 0 ${w * 0.15}px color-mix(in srgb, var(--gold) 18%, transparent)`,
    }}
  />
);

// a two-sided card in 3D: rotateY 0 shows the face, 180 shows the back (same as the game's .flyer)
export const Card3D: React.FC<{card: Card | null; w: number; backSrc: string; transform: string; gold?: boolean; style?: React.CSSProperties}> = ({card, w, backSrc, transform, gold, style}) => (
  <div style={{position: 'absolute', width: w, height: w * CARD_RATIO, transformStyle: 'preserve-3d', transform, ...style}}>
    <CardFront card={card} w={w} gold={gold} />
    <CardBack src={backSrc} w={w} />
  </div>
);
