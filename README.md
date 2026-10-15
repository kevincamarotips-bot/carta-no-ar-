# Cartas no Ar

Jogo de cassino simulado com fichas virtuais: o mágico joga uma carta para o alto e você aposta em qual vai cair. As fichas não têm valor em dinheiro e não podem ser sacadas, trocadas nem transferidas.

## App Android

Cada envio para a branch `main` gera sozinho, pelo GitHub Actions:

- **APK de teste** em [Releases](../../releases): abra no celular, baixe o `app-debug.apk` e instale. Usa anúncios de teste do Google, então pode tocar neles à vontade.
- **Pacote para a Play Store** (`.aab`, com anúncios reais), quando a chave de upload estiver configurada nos Secrets (ver abaixo). Fica em **Actions → última execução → Artifacts**.

### Como o app ganha dinheiro

| O quê | Como funciona |
|---|---|
| Fichas do dia | 1.000 fichas grátis por dia na fase 1 (cresce com a fase) |
| Vídeo premiado | +200 fichas por vídeo na fase 1, até 5 por dia (bloco `fichas_extras`) |
| Banner | Rodapé da tela (bloco `banner_mesa`) |
| Intersticial | A cada 8 rodadas, depois da carta cair e fora de jogadas (bloco `entre rodadas`) |
| Sem anúncios | Compra única; remove banner e intersticial |
| Clube do Mágico | Assinatura R$ 29,90/mês: 2.000 fichas por dia na fase 1 (não acumulam), 1 Varinha Mágica grátis por dia (cobre até 10 apostas mínimas do palco) e sem anúncios |
| Pacotes de fichas | Só liberam quando o saldo não paga a aposta mínima do palco, com limite de R$ 20 por dia. Aparecem na própria Mesa quando as fichas acabam |
| Fichas acabando | Com menos de 10 apostas mínimas, uma faixa na Mesa oferece as fichas do dia, o vídeo premiado e o Clube; o + do saldo pulsa |
| Visuais | Um visual por palco da jornada, vendido quando o jogador chega nele; o pacote com todos libera os cinco na hora |
| Ofertas | Nunca na primeira sessão e no máximo uma por sessão. "Sem anúncios" a cada 3 anúncios de tela cheia; visuais a cada 3 aberturas do app, logo depois de uma vitória. O X aparece depois de 5 segundos |

### Apostas e vantagem da casa

Toda aposta devolve, em média, entre 95% e 98,7% do que foi apostado (simulado com a Carta Dourada e a Mão quente incluídas). Nenhuma aposta é melhor que as outras: a cor rende partidas longas, a carta exata rende os prêmios gigantes. As mais arriscadas devolvem um pouco mais, porque a Carta Dourada multiplica o lucro.

| Aposta | Chance | Paga | Devolve em média (fase 1 a 5) |
|---|---|---|---|
| Cor | 50% | 1,9× | 96,3% a 97,3% |
| Baixa (A–6) ou Alta (8–K) | 46% | 2,05× | 95,7% a 96,8% |
| Naipe | 25% | 3,8× | 96,5% a 97,9% |
| Figura (J, Q, K) | 23% | 4,1× | 96,1% a 97,2% |
| Sete ou Valor exato | 7,7% | 12,4× | 96,8% a 98,7% |
| Carta exata | 1,9% | 50× | 97,0% a 98,1% |

- **Carta Dourada**: multiplica o lucro das apostas certas. Fica mais rara e maior a cada fase: 1 em 100 com lucro ×3 na Tenda, até 1 em 500 com lucro ×20 na Torre do Infinito.
- **Mão quente**: não paga fichas; com 3 vitórias seguidas a Carta Dourada fica 2× mais provável, com 5 ou mais, 3×.
- **Varinha Mágica** (substitui a Carta Marcada): custa +50% da aposta; se ganhar, multiplica o prêmio por ×1 (72%), ×2 (19%), ×3 (5%), ×5 (3%) ou ×10 (1%). Na média devolve o mesmo que a aposta sozinha, só aumenta o risco.
- **Segunda Chance**: o preço é a chance de errar (50% da aposta na cor, 75% no naipe), então não muda a vantagem da casa.
- **Maior ou menor** (antigo dobrar ou nada): paga 95% das chances justas. Depois de um Ás, "maior" tem 94% de chance e paga ×1,01; depois de uma Dama, "maior" tem 8% e paga ×12,1.
- **Álbum**: a carta só entra quando você acerta naipe, figura, sete, valor ou carta exata. Cor e faixa não contam.

Antes desta versão, todas as apostas devolviam mais do que recebiam (105% a 230%), e por isso dava para subir de palco em minutos. Numa simulação começando com 1.000 fichas e sem fichas grátis, a chance de chegar a 8.000 apostando 10% na cor caiu de 38% para 7%, a mesma de qualquer outro estilo de jogo.

### Estrutura 2.0: 8 fases, nível por XP e duelos

Uma simulação com jogadores de vários estilos (pasta de economia fora do repositório) calibrou tudo para um jogador dedicado levar uns **20 a 24 horas de jogo** até zerar, e um casual uns 16 a 19 horas espalhadas em dois meses. O relógio é o XP: fichas sozinhas não abrem fases.

- **Nível por XP**: 3 XP por rodada, 15 XP por estrela de missão, 30 pelo baú, 40 × fase por ato, 80 × fase por duelo, 50 por naipe do álbum e 250 pelo álbum completo. Do nível N para o N+1 são 100 + 25×N XP. Subir de nível dá 100 × N × multiplicador da fase em fichas.
- **Atos da fase**: 3 por fase, cada um vale uma estrela (24 no total), 1.000 / 2.000 / 3.000 × multiplicador em fichas e um truque no duelo. Só contam jogando naquela fase.
- **Duelo com o mestre**: para abrir a próxima fase é preciso o nível pedido, 2 atos (3 na Torre) e o ingresso em fichas. É uma corrida de pontos na mesma carta: cor vale 1, naipe 2, valor 4. Os truques são Espiar a cor e Dobro. Cada mestre tem um jeito de jogar; a chance de vitória vai de uns 74% (Bento) até uns 22% (Grande Mestre).
- **Bexigas do Mágico** (Atrações): 6 bexigas, paga ×1,14 a ×5,7 no modo Sobrevivente ou ×5,7 em Primeira a estourar. Devolve 95% em média, como as apostas da Mesa.
- **Coelho da Sorte**: aparece na Mesa a cada 26 a 35 rodadas e uma vez por dia em Atrações. Escolhe-se 1 de 3 cartolas: fichas, varinha grátis, Sorte ×3 (Carta Dourada 3× mais provável por 3 rodadas) ou cenouras. Cada 10 cenouras sobem o nível do coelho (prêmios +10% por nível, até o nível 10).
- **Cartolas**: uma a cada 15 rodadas, em 4 espaços no Início. Uma abre por vez: Prata 1h, Ouro 3h, Mágica 8h. O ciclo é Prata, Prata, Ouro, Prata, Prata, Ouro, Prata, Mágica.
- **Passe do Mágico**: temporadas de 28 dias, 30 níveis de 800 pontos (todo XP vale ponto). A trilha grátis é de todos; a trilha dourada é comprada no app (`passe_magico`) e traz o visual Meia-Noite no nível 15. No Claude a trilha dourada aparece bloqueada.

| Fase | Aposta mínima | Multiplicador | Nível do duelo | Ingresso | Mestre | Carta Dourada | Visual da fase |
|---|---|---|---|---|---|---|---|
| 1. Tenda do Ilusionista | 10 | ×1 | 5 | 1.000 | Bento, o Aprendiz | 1 em 100, ×3 | Chama Violeta |
| 2. Teatro das Sombras | 50 | ×3 | 10 | 4.000 | Madame Sombra | 1 em 111, ×4 | Máscara de Veludo |
| 3. Biblioteca Encantada | 100 | ×6 | 16 | 15.000 | Professora Pergaminho | 1 em 125, ×5 | Grimório |
| 4. Observatório Estelar | 250 | ×12 | 22 | 50.000 | Lúmen, o Astrólogo | 1 em 167, ×7 | Constelação |
| 5. Circo Elétrico | 1.000 | ×30 | 28 | 150.000 | Volt, a Domadora | 1 em 200, ×9 | Relâmpago |
| 6. Abismo das Sereias | 2.500 | ×70 | 34 | 500.000 | Maré, a Sereia | 1 em 250, ×12 | Pérola das Marés |
| 7. Palácio do Mágico | 10.000 | ×180 | 40 | 1.500.000 | O Rei de Copas | 1 em 333, ×15 | Coroa Dourada |
| 8. Torre do Infinito | 25.000 | ×400 | 46 | 5.000.000 | O Grande Mestre | 1 em 500, ×20 | Infinito |

O multiplicador vale para fichas do dia, vídeos, Clube, pacotes, missões, baú, atos, cartolas, coelho e passe. O álbum paga fixo (3.000 por naipe, 30.000 completo). Saves antigos mantêm o nível e as fases abertas; as fases antes da mais alta contam como vencidas.

### Tela inicial, missões e Nova Jornada+

- **Tela de abertura**: logo, mão do mágico e um botão. Na primeira vez é "Começar jornada" (e o toque confirma os 18 anos); depois vira "Continuar". O botão leva para o **Início**.
- **Início**: o palco da fase como uma ilha flutuante (tocar abre a Jornada), as setas trocam a fase mostrada, Jogar e Duelo, o Passe e as 4 cartolas. A barra de baixo é Loja · Coleção · Início · Atrações · Missões; a Mesa e a Jornada abrem a partir do Início.
- **Tour**: uma vez para todos, no Início (`P.tour2`). Na primeira ida à Mesa, as dicas de aposta aparecem uma vez (`P.ftue`).
- **Missões (Etapa 1)**: 3 diárias e 3 semanais. Nenhuma pede aposta mínima. Uma troca grátis de missão diária por dia. Dão fichas × fase e XP.
- **Baú do dia**: 4 espaços. Abrir o app preenche o primeiro e cada diária resgatada preenche mais um. Dá 1.500 fichas × fase e 30 XP.
- **Lembrete na Mesa**: uma faixa fina mostra a missão mais perto de acabar.
- **Nova Jornada+**: aparece depois de vencer o Grande Mestre. Recomeça as fases e os atos com 5.000 fichas e mantém nível, álbum, acessórios e visuais. Cada Jornada+ soma +25% nas fichas de missões e do baú (até +100%).

### Produtos para cadastrar no Play Console

Em **Monetizar → Produtos → Produtos no app**, crie com estes IDs exatos (o preço você escolhe). Como a quantidade de fichas dos pacotes muda com a fase, use nomes sem número no Play Console (por exemplo "Punhado de fichas", "Saquinho de fichas", "Baú de fichas") e diga na descrição que a quantidade aparece na loja do jogo.

| ID do produto | Nome sugerido | Tipo | Preço sugerido |
|---|---|---|---|
| `sem_anuncios` | Sem anúncios | Não consumível | R$ 9,90 |
| `clube_magico` | Clube do Mágico | **Assinatura** (em Monetizar → Assinaturas), plano base mensal | R$ 29,90/mês |
| `visuais_todos` | Todos os visuais | Não consumível | R$ 14,90 |
| `visual_luva` | Visual Chama Violeta | Não consumível | R$ 4,90 |
| `visual_rubi` | Visual Máscara de Veludo | Não consumível | R$ 4,90 |
| `visual_pergaminho` | Visual Grimório | Não consumível | R$ 4,90 |
| `visual_safira` | Visual Constelação | Não consumível | R$ 4,90 |
| `visual_vegas` | Visual Relâmpago | Não consumível | R$ 4,90 |
| `visual_sereia` | Visual Pérola das Marés | Não consumível | R$ 4,90 |
| `visual_montecarlo` | Visual Coroa Dourada | Não consumível | R$ 4,90 |
| `visual_infinito` | Visual Infinito | Não consumível | R$ 4,90 |
| `passe_magico` | Passe do Mágico: trilha dourada (novo) | **Consumível** (uma compra por temporada) | R$ 14,90 |
| `fichas_1000` | Punhado de fichas | Consumível | R$ 1,99 |
| `fichas_5000` | Saquinho de fichas | Consumível | R$ 4,99 |
| `fichas_12000` | Baú de fichas | Consumível | R$ 9,99 |

O limite diário de R$ 20 está em `src/app-module.js` (`DAILY_SPEND_CAP`). Se mudar os preços dos pacotes, ajuste também o campo `brl` de cada pacote ali.

### Chave de upload (para gerar o pacote da Play Store)

Em **Settings → Secrets and variables → Actions → New repository secret**, crie:

- `ANDROID_KEYSTORE_BASE64`: o arquivo `.jks` da chave de upload, em base64
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Guarde o arquivo `.jks` e as senhas em lugar seguro. **Nunca** coloque a chave dentro do repositório.

### Política de privacidade

A Play Store e o AdMob exigem uma. Ela está em `privacidade.html` e fica publicada pelo GitHub Pages em
`https://kevincamarotips-bot.github.io/carta-no-ar-/privacidade.html` (ligue o Pages em **Settings → Pages**, branch `main`, pasta raiz).

### Estrutura

- `src/carta-no-ar.html`: o jogo (mesma versão do Claude).
- `src/app-module.js`: fichas do dia, anúncios, aba Loja (com a progressão por fase), ofertas e visuais pagos.
- `tools/build_app.py`: junta os dois em `www/index.html`. Use `--release` para anúncios reais.
- `android/`: projeto Android (Capacitor). Pacote `com.kevincamaroti.cartanoar`.
- `assets/`: ícone e tela de abertura.


## Artes pintadas e visual místico

Os 8 palcos, os 8 mestres, as luvas, os versos das cartas, as fichas e os ícones (Varinha, Segunda Chance, Maior ou menor e Mão quente) são ilustrações pintadas, guardadas no jogo como WebP leve. Cada visual troca a luva do mágico, o verso da carta e as cores do jogo, sempre em violeta e dourado, com um céu estrelado ao fundo.
## Versão web

`index.html` na raiz é a versão web com modos online pelo Firebase (opcional). Veja `firebase-config.js`.
