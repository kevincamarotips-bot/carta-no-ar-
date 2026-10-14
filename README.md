# Carta no Ar

Jogo de cassino com fichas fictícias: o mágico joga uma carta para o alto e você aposta em qual vai cair. Nenhum dinheiro real envolvido.

**Jogar:** https://kevincamarotips-bot.github.io/carta-no-ar-/

Três modos:

- **Sozinho**: você contra o mágico, com todos os truques. Funciona sem nenhuma configuração.
- **Ranking da galera**: cada um joga na sua hora e o placar compartilhado mostra quem tem mais fichas.
- **Mesa ao vivo**: todos apostam na mesma carta, com um código de mesa.

Os dois modos com amigos usam o Firebase (gratuito) para guardar o placar e sincronizar a mesa.

## 1. Ligar o site (GitHub Pages)

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**.
3. Selecione a branch **main** e a pasta **/ (root)**, e toque em **Save**.
4. Em um ou dois minutos o jogo fica no endereço acima.

## 2. Ligar os modos com amigos (Firebase)

1. Entre em https://console.firebase.google.com e toque em **Criar projeto**. Pode desligar o Google Analytics.
2. No menu do projeto, abra **Criação → Realtime Database** e toque em **Criar banco de dados**. Escolha qualquer local e comece em **modo bloqueado**.
3. Na aba **Regras** do banco, apague o que estiver lá, cole o conteúdo do arquivo `database.rules.json` deste repositório e toque em **Publicar**.
4. Toque na engrenagem → **Configurações do projeto**. Em **Seus apps**, toque no ícone **</>** (Web), dê um nome e registre. Não precisa de Hosting.
5. Copie o bloco `firebaseConfig` que aparece. Confira se ele tem a linha `databaseURL`; se não tiver, recarregue a página de configurações depois de criar o banco.
6. No GitHub, abra o arquivo `firebase-config.js`, toque no lápis para editar e troque `null` pelo bloco copiado, assim:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "...",
     authDomain: "...",
     databaseURL: "https://...firebaseio.com",
     projectId: "...",
     appId: "..."
   };
   ```

7. Toque em **Commit changes**. Em um minuto o ranking e a mesa ao vivo já funcionam no site.

A chave do Firebase pode ficar pública: ela só identifica o projeto. Quem protege os dados são as regras do passo 3. Como as fichas são fictícias, as regras deixam qualquer pessoa com o link jogar sem login.

## Arquivos

- `index.html`: o jogo inteiro.
- `firebase-config.js`: onde vai a configuração do seu Firebase.
- `firebase-shim.js`: liga o jogo ao Firebase.
- `database.rules.json`: regras para colar no Realtime Database.
