# Carta no Ar

Jogo de cassino simulado com fichas virtuais: o mágico joga uma carta para o alto e você aposta em qual vai cair. As fichas não têm valor em dinheiro e não podem ser sacadas, trocadas nem transferidas.

## App Android

Cada envio para a branch `main` gera sozinho, pelo GitHub Actions:

- **APK de teste** em [Releases](../../releases): abra no celular, baixe o `app-debug.apk` e instale. Usa anúncios de teste do Google, então pode tocar neles à vontade.
- **Pacote para a Play Store** (`.aab`, com anúncios reais), quando a chave de upload estiver configurada nos Secrets (ver abaixo). Fica em **Actions → última execução → Artifacts**.

### Como o app ganha dinheiro

| O quê | Como funciona |
|---|---|
| Fichas do dia | 1.000 fichas grátis por dia |
| Vídeo premiado | +200 fichas por vídeo, até 5 por dia (bloco `fichas_extras`) |
| Banner | Rodapé da mesa (bloco `banner_mesa`) |
| Intersticial | A cada 8 rodadas, depois da carta cair (bloco `entre rodadas`) |
| Sem anúncios | Compra única; remove banner e intersticial |
| Visuais | Monte Carlo, Neon de Vegas, Luva Branca, Safira, Rubi Imperial |
| Pacotes de fichas | Só aparecem quando o saldo zera, com limite de R$ 20 por dia |

### Produtos para cadastrar no Play Console

Em **Monetizar → Produtos → Produtos no app**, crie com estes IDs exatos (o preço você escolhe):

| ID do produto | Tipo | Preço sugerido |
|---|---|---|
| `sem_anuncios` | Não consumível | R$ 9,90 |
| `visuais_todos` | Não consumível | R$ 14,90 |
| `visual_montecarlo` | Não consumível | R$ 4,90 |
| `visual_vegas` | Não consumível | R$ 4,90 |
| `visual_luva` | Não consumível | R$ 4,90 |
| `visual_safira` | Não consumível | R$ 4,90 |
| `visual_rubi` | Não consumível | R$ 4,90 |
| `fichas_1000` | Consumível | R$ 1,99 |
| `fichas_5000` | Consumível | R$ 4,99 |
| `fichas_12000` | Consumível | R$ 9,99 |

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
- `src/app-module.js`: fichas do dia, anúncios, loja e visuais pagos.
- `tools/build_app.py`: junta os dois em `www/index.html`. Use `--release` para anúncios reais.
- `android/`: projeto Android (Capacitor). Pacote `com.kevincamaroti.cartanoar`.
- `assets/`: ícone e tela de abertura.

## Versão web

`index.html` na raiz é a versão web com modos online pelo Firebase (opcional). Veja `firebase-config.js`.
