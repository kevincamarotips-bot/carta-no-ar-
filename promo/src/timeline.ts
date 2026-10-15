// Splits the fixed 15 s (450 frames) among the selected scenes, keeping each scene's share.
import {SCENE_IDS, type DesafioProps, type SceneId, TOTAL_FRAMES} from './schema';

// base lengths in frames at 30 fps; they add up to exactly 450 with every scene on
export const BASE_FRAMES: Record<SceneId, number> = {
  gancho: 60,      // 2,0 s
  aposta: 72,      // 2,4 s
  lancamento: 72,  // 2,4 s (the game's throw lasts 2,3 s)
  revelacao: 78,   // 2,6 s
  duelo: 72,       // 2,4 s
  cta: 96,         // 3,2 s
};

export type Slot = {id: SceneId; from: number; duration: number};

export function buildTimeline(cenas: DesafioProps['cenas']): Slot[] {
  let ids = SCENE_IDS.filter(id => cenas[id]);
  if (!ids.length) ids = [...SCENE_IDS];
  const base = ids.reduce((a, id) => a + BASE_FRAMES[id], 0);
  const slots: Slot[] = [];
  let from = 0;
  ids.forEach((id, i) => {
    const duration = i === ids.length - 1 ? TOTAL_FRAMES - from : Math.round((BASE_FRAMES[id] / base) * TOTAL_FRAMES);
    slots.push({id, from, duration});
    from += duration;
  });
  return slots;
}
