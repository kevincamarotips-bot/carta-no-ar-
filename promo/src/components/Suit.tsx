import React from 'react';
import type {Card} from '../data/game';

// Suit marks drawn as vectors so they look the same on every machine (the game uses ♠♥♦♣ glyphs).
const PATHS: Record<Card['suit'], React.ReactNode> = {
  H: <path d="M50 90C21 68 5 52 5 31 5 16 16 6 29 6c9 0 17 5 21 14 4-9 12-14 21-14 13 0 24 10 24 25 0 21-16 37-45 59z" />,
  D: <path d="M50 3 87 50 50 97 13 50z" />,
  S: <path d="M50 4C41 22 7 38 7 61c0 13 10 22 22 22 7 0 13-3 16-9-1 10-5 17-12 23h34c-7-6-11-13-12-23 3 6 9 9 16 9 12 0 22-9 22-22C93 38 59 22 50 4z" />,
  C: (
    <>
      <circle cx="50" cy="27" r="20" />
      <circle cx="27" cy="59" r="20" />
      <circle cx="73" cy="59" r="20" />
      <rect x="40" y="35" width="20" height="30" />
      <path d="M46 58c-1 17-5 28-13 38h34c-8-10-12-21-13-38z" />
    </>
  ),
};

export const Suit: React.FC<{k: Card['suit']; size: number; color?: string; style?: React.CSSProperties}> = ({k, size, color = 'currentColor', style}) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{display: 'block', fill: color, ...style}} aria-hidden>
    {PATHS[k]}
  </svg>
);
