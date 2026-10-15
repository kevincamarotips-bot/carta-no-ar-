import {z} from 'zod';
import raw from './data/game-data.json';

const casinoKeys = (raw as {casinos: {k: string}[]}).casinos.map(c => c.k);

export const SCENE_IDS = ['gancho', 'aposta', 'lancamento', 'revelacao', 'duelo', 'cta'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export const SCENE_LABEL: Record<SceneId, string> = {
  gancho: 'Gancho do desafio',
  aposta: 'Faça sua aposta',
  lancamento: 'O mágico joga a carta',
  revelacao: 'A carta cai',
  duelo: 'Desafie o mestre',
  cta: 'Chamada final',
};

export const desafioSchema = z.object({
  tipo: z.enum(['desafio']).describe('Tipo de vídeo'),
  arena: z.enum(['aleatoria', ...casinoKeys] as [string, ...string[]]).describe('Fase/palco do jogo. "aleatoria" sorteia pela semente'),
  seed: z.number().int().min(0).describe('Semente: muda arena, carta, aposta e frase'),
  cenas: z.object({
    gancho: z.boolean(),
    aposta: z.boolean(),
    lancamento: z.boolean(),
    revelacao: z.boolean(),
    duelo: z.boolean(),
    cta: z.boolean(),
  }).describe('Cenas incluídas. A duração total continua 15 s'),
  aposta: z.enum(['aleatoria', 'cor', 'naipe', 'carta']).describe('Aposta mostrada'),
  resultado: z.enum(['acerto', 'erro']).describe('A aposta mostrada acerta ou erra'),
  chamada: z.string().max(40).describe('Texto do botão final'),
  mostrarLegal: z.boolean().describe('Aviso de fichas virtuais e 18+'),
});

export type DesafioProps = z.infer<typeof desafioSchema>;

export const DEFAULT_PROPS: DesafioProps = {
  tipo: 'desafio',
  arena: 'aleatoria',
  seed: 1,
  cenas: {gancho: true, aposta: true, lancamento: true, revelacao: true, duelo: true, cta: true},
  aposta: 'aleatoria',
  resultado: 'acerto',
  chamada: 'Jogue agora',
  mostrarLegal: true,
};

export const VIDEO = {width: 1080, height: 1920, fps: 30, seconds: 15} as const;
export const TOTAL_FRAMES = VIDEO.fps * VIDEO.seconds;
