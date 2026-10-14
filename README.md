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

- **Carta Dourada**: multiplica o lucro das apostas certas. Fica mais rara e maior a cada palco: 1 em 100 com lucro ×3 na Tenda, até 1 em 667 com lucro ×20 no Palácio.
- **Mão quente**: não paga fichas; com 3 vitórias seguidas a Carta Dourada fica 2× mais provável, com 5 ou mais, 3×.
- **Varinha Mágica** (substitui a Carta Marcada): custa +50% da aposta; se ganhar, multiplica o prêmio por ×1 (72%), ×2 (19%), ×3 (5%), ×5 (3%) ou ×10 (1%). Na média devolve o mesmo que a aposta sozinha, só aumenta o risco.
- **Segunda Chance**: o preço é a chance de errar (50% da aposta na cor, 75% no naipe), então não muda a vantagem da casa.
- **Maior ou menor** (antigo dobrar ou nada): paga 95% das chances justas. Depois de um Ás, "maior" tem 94% de chance e paga ×1,01; depois de uma Dama, "maior" tem 8% e paga ×12,1.
- **Álbum**: a carta só entra quando você acerta naipe, figura, sete, valor ou carta exata. Cor e faixa não contam.

Antes desta versão, todas as apostas devolviam mais do que recebiam (105% a 230%), e por isso dava para subir de palco em minutos. Numa simulação começando com 1.000 fichas e sem fichas grátis, a chance de chegar a 8.000 apostando 10% na cor caiu de 38% para 7%, a mesma de qualquer outro estilo de jogo.

### A loja cresce com a jornada

Quem está nos palcos finais aposta muito mais, então tudo o que dá fichas é multiplicado pelo palco mais alto que o jogador já abriu (`PHASE_MULT` em `src/carta-no-ar.html`). A aba Loja mostra essa progressão.

| Palco | Entrada | Aposta mínima | Multiplicador | Fichas do dia | Clube por dia | Pacotes (R$ 1,99 / 4,99 / 9,99) | Visual do palco |
|---|---|---|---|---|---|---|---|
| 1. Tenda do Ilusionista | grátis | 10 | ×1 | 1.000 | 2.000 | 1.000 / 5.000 / 12.000 | Luva Branca |
| 2. Teatro das Sombras | 8.000 | 50 | ×3 | 3.000 | 6.000 | 3.000 / 15.000 / 36.000 | Rubi Imperial |
| 3. Observatório Estelar | 40.000 | 200 | ×10 | 10.000 | 20.000 | 10.000 / 50.000 / 120.000 | Safira |
| 4. Circo Elétrico | 200.000 | 1.000 | ×40 | 40.000 | 80.000 | 40.000 / 200.000 / 480.000 | Neon Arcano |
| 5. Palácio do Mágico | 1.000.000 | 5.000 | ×150 | 150.000 | 300.000 | 150.000 / 750.000 / 1.800.000 | Esmeralda Real |

Missões, prêmios de nível e o álbum seguem o mesmo multiplicador. O preço em reais não muda; muda só quantas fichas cada compra entrega.

### Tela inicial, missões e Nova Jornada+

- **Tela inicial**: toda vez que o app abre aparece a logo, a mão do mágico e um botão. Na primeira vez é "Começar jornada" (e o toque confirma os 18 anos); depois vira "Continuar", com o palco e o saldo salvos. O botão leva para a aba Jornada.
- **Tutorial só na primeira vez**: um tour curto mostra a Jornada, Missões, Coleção e Loja e termina no botão Jogar do palco 1. Na primeira ida à Mesa, as dicas de aposta aparecem uma vez. Os dois ficam marcados no aparelho (`P.tour` e `P.ftue`).
- **Missões (Etapa 1)**: 3 diárias e 3 semanais. Cada uma ensina uma parte do jogo (Faixa, naipe seguido, Figura, Varinha, guardar prêmio no Maior ou menor…). Nenhuma pede aposta mínima. Uma troca grátis de missão diária por dia.
- **Baú do dia**: 4 espaços. Abrir o app preenche o primeiro e cada diária resgatada preenche mais um. Aberto, dá 1.500 fichas × palco e ★2, e conta para a semanal "Abra o baú 4 vezes".
- **Lembrete na Mesa**: uma faixa fina mostra a missão mais perto de acabar. Quando está completa, fica dourada e resgata ali mesmo.
- **Nova Jornada+**: só aparece depois de abrir o Palácio do Mágico. Recomeça os palcos com 5.000 fichas e mantém nível, estrelas, álbum, acessórios e visuais (visuais comprados continuam liberados). Cada Jornada+ soma +25% nas fichas de missões e do baú (até +100%) e dá o selo de Mestre da Jornada. Os números ficam em `NG_START` e `ngBonusFor` em `src/carta-no-ar.html`.

### Produtos para cadastrar no Play Console

Em **Monetizar → Produtos → Produtos no app**, crie com estes IDs exatos (o preço você escolhe). Como a quantidade de fichas dos pacotes muda com a fase, use nomes sem número no Play Console (por exemplo "Punhado de fichas", "Saquinho de fichas", "Baú de fichas") e diga na descrição que a quantidade aparece na loja do jogo.

| ID do produto | Nome sugerido | Tipo | Preço sugerido |
|---|---|---|---|
| `sem_anuncios` | Sem anúncios | Não consumível | R$ 9,90 |
| `clube_magico` | Clube do Mágico | **Assinatura** (em Monetizar → Assinaturas), plano base mensal | R$ 29,90/mês |
| `visuais_todos` | Todos os visuais | Não consumível | R$ 14,90 |
| `visual_luva` | Visual Luva Branca | Não consumível | R$ 4,90 |
| `visual_rubi` | Visual Rubi Imperial | Não consumível | R$ 4,90 |
| `visual_safira` | Visual Safira | Não consumível | R$ 4,90 |
| `visual_vegas` | Visual Neon Arcano | Não consumível | R$ 4,90 |
| `visual_montecarlo` | Visual Esmeralda Real | Não consumível | R$ 4,90 |
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

## Versão web

`index.html` na raiz é a versão web com modos online pelo Firebase (opcional). Veja `firebase-config.js`.
