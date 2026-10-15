# Cartas no Ar · Gerador de vídeos promocionais

Vídeos verticais do tipo **desafio**, feitos com [Remotion](https://www.remotion.dev): **1080×1920, 30 fps, 15 s, MP4 H.264**.

Este gerador vive só nesta pasta e não altera o jogo. Ele **lê** `../src/carta-no-ar.html` e copia de lá as artes e regras reais, então o vídeo acompanha o jogo quando ele muda.

## Começar

Precisa de Node 18 ou mais novo.

```bash
cd promo
npm install
npm run dev        # abre o Remotion Studio para pré-visualizar
```

Na primeira exportação o Remotion baixa um Chrome próprio para renderizar. Para usar um Chrome já instalado: `REMOTION_BROWSER_EXECUTABLE=/caminho/do/chrome npm run render`.

## O que vai no vídeo (tudo do jogo)

| Do jogo | Onde aparece |
|---|---|
| Logo, 8 palcos pintados, 8 mestres | Gancho, Duelo, Chamada |
| Luva e verso da carta do visual de cada fase (Chama Violeta, Máscara de Veludo, Grimório…) | Mesa, Gancho, Chamada |
| Cores de cada visual (`[data-skin]`), fundo do palco, feixe de luz, runa, estrelas | Fundo de todas as cenas |
| Marcellus, Bricolage Grotesque e DM Mono | Toda a tipografia |
| Carta (frente creme, cantos e naipe central) e o arremesso do `throwCard()` com os mesmos quadros-chave, giro e virada aos 74% | Lançamento e Revelação |
| Fichas pintadas, chuva de fichas, estrelas ao cair a carta | Aposta e Revelação |
| Apostas e pagamentos de `def()`: Cor ×1,9 (50%), Naipe ×3,8 (25%), Carta exata ×50 (1 em 52); prêmio = aposta × multiplicador; aposta em múltiplos da aposta mínima da fase | Aposta e Revelação |
| Textos do jogo "Você ganhou!" e "Não foi dessa vez" (o resto do vídeo é imagem, quase sem texto) | Revelação |
| Mestre da fase com o nome | Duelo |
| Aviso legal do app Android (`tools/build_app.py`) | Chamada |

Nada de mecânica inventada: não há Carta Dourada, Varinha nem prêmios fora da tabela.

## Cenas

| Cena | Duração padrão |
|---|---|
| `gancho`: frase curta do desafio sobre o palco da fase | 2,0 s |
| `aposta`: três peças (cores, naipes, carta) com ×1,9, ×3,8 e ×50; a escolhida cresce e recebe a ficha | 2,4 s |
| `lancamento`: a luva joga a carta; no alto, o selo da aposta | 2,4 s |
| `revelacao`: a carta cai, selo com ✓ ou ✕, "Você ganhou!" ou "Não foi dessa vez" e as fichas | 2,6 s |
| `duelo`: retrato do mestre da fase contra a luva do jogador | 2,4 s |
| `cta`: leque de cartas, logo e botão | 3,2 s |

Tirando cenas, as outras se esticam na mesma proporção e o vídeo continua com 15 s.

## Pré-visualizar e escolher

- **Studio** (`npm run dev`): a composição **Desafio** tem um painel de propriedades com arena, semente, cenas (caixas de seleção), aposta, resultado, texto do botão e aviso legal. Em **Variacoes** ficam 8 variações prontas para comparar; o nome mostra semente, fase e aposta. Dá para exportar direto pelo botão Render do Studio.
- **Folha de prévia** (`npm run previa`): gera `out/previa.png` com uma linha por variação e um quadro de cada cena, mais fase, visual, aposta, carta e frase de cada uma.

```bash
npm run previa -- --seed 20 --variacoes 8
npm run previa -- --arena torre --cenas gancho,revelacao,cta
```

## Exportar

```bash
npm run render                                  # semente 1, arena aleatória
npm run render -- --seed 7
npm run render -- --arena biblioteca            # boteco, porto, biblioteca, montecarlo, vegas, abismo, palacio, torre
npm run render -- --cenas gancho,aposta,lancamento,revelacao,cta
npm run render -- --aposta naipe --resultado erro
npm run render -- --chamada "Baixe agora" --sem-legal
npm run variacoes                               # 6 variações, sementes 1 a 6
npm run render -- --variacoes 10 --seed 30      # 10 variações a partir da semente 30
npm run render -- --saida ~/Videos
```

Cada vídeo sai em `out/` com um nome que diz o conteúdo (`desafio_s3_biblioteca_naipe_acerto.mp4`) e um `.json` ao lado com as opções usadas, para gerar o mesmo vídeo de novo.

**Arena aleatória:** a semente sorteia a fase entre as 8. A mesma semente sempre gera o mesmo vídeo (fase, carta, aposta e frase).

## Estrutura

```
promo/
  scripts/extract-assets.mjs   copia artes e regras do jogo (roda sozinho antes de dev, render e previa)
  scripts/render.mjs           exportação MP4 e lotes de variações
  scripts/contact-sheet.mjs    folha de prévia
  src/schema.ts                opções do vídeo
  src/variation.ts             semente → fase, visual, carta, aposta, prêmio, frase
  src/timeline.ts              divisão dos 15 s entre as cenas escolhidas
  src/Desafio.tsx              o vídeo
  src/scenes/                  as 6 cenas
  src/components/              palco, mesa (luva + arremesso), carta, fichas
```

`public/game/` e `src/data/game-data.json` são gerados a partir do jogo e ficam fora do Git.

O vídeo sai sem áudio: os sons do jogo são sintetizados ao vivo no navegador, então a trilha entra na edição ou na plataforma.
