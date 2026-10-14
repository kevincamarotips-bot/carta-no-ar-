#!/usr/bin/env python3
"""Gera www/index.html (o jogo do app Android) a partir de src/carta-no-ar.html.

src/carta-no-ar.html é a versão que roda no Claude. Este script:
  - monta um documento HTML completo (doctype, head, meta charset);
  - insere src/app-module.js dentro do script do jogo;
  - liga os ganchos do app (fichas do dia, anúncios, loja, visuais pagos);
  - esconde os modos que dependem do Claude (ranking e mesa ao vivo).

Uso:  python3 tools/build_app.py            -> anúncios de teste (para desenvolver)
      python3 tools/build_app.py --release  -> anúncios reais (para a Play Store)
"""
import json, re, sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
release = '--release' in sys.argv
src = (ROOT / 'src' / 'carta-no-ar.html').read_text(encoding='utf-8')
module = (ROOT / 'src' / 'app-module.js').read_text(encoding='utf-8')


def rep(text, old, new, count=1):
    n = text.count(old)
    if n != count:
        sys.exit(f'build_app: esperado {count}x, achado {n}x: {old[:80]!r}')
    return text.replace(old, new)


# ---- split the artifact into head parts and body ----
title = re.search(r'<title>.*?</title>', src).group(0)
links = re.findall(r'<link [^>]+>', src)
style = re.search(r'<style>.*?</style>', src, re.S).group(0)
body = src
for chunk in [title, style] + links:
    body = body.replace(chunk, '', 1)
body = body.strip()

# ---- game hooks ----
body = rep(body, '<script>\n(() => {', '<script>\n(() => {\nvar APP = true;')
body = rep(body, 'function renderGift(){', 'function renderGift(){\n  if (APP) return appRenderGift();')
body = rep(body, 'function openGift(){', 'function openGift(){\n  if (APP) return appOpenGift();')
body = rep(body, "  if (typeof renderMode === 'function') renderMode();\n}",
           "  if (typeof renderMode === 'function') renderMode();\n  if (APP && typeof renderShop === 'function') renderShop();\n}")
body = rep(body, '  S.busy = false; save(); renderAll();\n  if (profit > 0) offerGamble(win, card);',
           '  S.busy = false; save(); renderAll();\n  appAfterRound();\n  if (profit > 0) offerGamble(win, card);')
body = rep(body, "if (b && b.dataset.pick !== SKIN) applySkin(b.dataset.pick, true); });",
           "if (b && b.dataset.pick !== SKIN) appPickSkin(b.dataset.pick); });")
body = rep(body, "${s.k === SKIN ? 'Em uso' : s.price + (s.price === 'Grátis' ? '' : ' no app')}", "${skinLabel(s)}")
body = rep(body, '\napplySkin(SKIN, false);\n', '\n' + module + '\napplySkin(SKIN, false);\n')
body = rep(body, 'renderAll();\n})();', 'renderAll();\nappInit();\n})();')

# ---- markup only the app has ----
body = rep(body, '      <div class="panel" id="skinPanel">', '''      <div class="panel" id="shopPanel">
        <p class="eyebrow"><span>Loja</span><span id="shopLimit"></span></p>
        <div id="shop"></div>
      </div>

      <div class="panel" id="skinPanel">''')
body = rep(body, '<span>prévia grátis nesta versão</span>', '<span>toque para comprar</span>')
body = rep(body, '<p class="panel-note">Cada visual troca', '<button class="bundle" id="skinBundle" hidden>Todos os 5 visuais por R$ 14,90</button>\n        <p class="panel-note" id="skinNote">Cada visual troca')
body = rep(body, "Sem fichas. Abra o Chapéu do Mágico.", "Sem fichas. Pegue as fichas do dia, assista a um vídeo ou passe na loja.")
body = rep(body, '<p class="start-msg" id="startMsg" role="status"></p>',
           '<p class="start-msg" id="startMsg" role="status"></p>\n    <p class="app-legal">Fichas virtuais sem valor em dinheiro. Não é possível sacar, trocar ou transferir fichas. Jogo apenas para entretenimento, proibido para menores de 18 anos.</p>')
body = rep(body, '<p class="fineprint">Fichas fictícias e gratuitas, só por diversão. Nenhum dinheiro real envolvido.</p>',
           '<p class="fineprint">Fichas virtuais sem valor em dinheiro: não podem ser sacadas, trocadas nem transferidas. Jogo apenas para entretenimento, para maiores de 18 anos.</p>')

app_css = '''<style>
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);--banner-h:0px}
body{margin:0;font-size:14px}
[hidden]{display:none!important}
.app-build .app{padding-bottom:var(--banner-h)}
.app-build #modeBtn,.app-build .field,.app-build .mode[data-mode="rank"],.app-build .mode:not([data-mode]){display:none!important}
.app-build .modes{grid-template-columns:1fr!important;max-width:420px;width:100%;margin:0 auto}
.app-legal{max-width:420px;margin:0 auto;text-align:center;font-size:12px;color:var(--muted)}
.shop-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;background:var(--plum-2)}
.shop-row div{min-width:0}.shop-row b{display:block}.shop-row span{display:block;font-size:12px;color:var(--muted)}
.buy,.bundle{flex:none;border-radius:12px;padding:10px 14px;font-weight:800;background:var(--flame);color:var(--cream)}
.bundle{width:100%;margin-top:10px}
.owned{font-style:normal;font-family:var(--f-mono);color:var(--amber)}
.packs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}
.pack{display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 6px;border-radius:14px;background:var(--plum-2);border:1px solid var(--line);text-align:center}
.pack b{font-size:13px}.pack em{font-style:normal;font-family:var(--f-mono);font-size:12px;color:var(--amber)}
.pack[aria-disabled="true"]{opacity:.4}
.restore{display:block;margin:8px auto 0;font-size:12px;color:var(--muted);text-decoration:underline;text-underline-offset:3px}
</style>'''

cfg = '<script>window.APP_CONFIG = ' + json.dumps({'adsTest': not release}) + ';</script>'
html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#130713">
{title}
{chr(10).join(links)}
{style}
{app_css}
{cfg}
</head>
<body>
{body}
</body>
</html>
'''
out = ROOT / 'www' / 'index.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'www/index.html gerado ({"anúncios reais" if release else "anúncios de teste"})')
