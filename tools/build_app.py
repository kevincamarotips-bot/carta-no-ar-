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
CART_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2.2l2.3 10.2a1.6 1.6 0 0 0 1.6 1.3h8.1a1.6 1.6 0 0 0 1.6-1.2L20.5 8H6.1"/><circle cx="10" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>'
body = rep(body, '      <div class="bal" title="Saldo de fichas">',
           '      <button class="icon-btn cart-btn" id="cartBtn" aria-label="Abrir a loja" hidden>' + CART_SVG + '<span class="cart-dot"></span></button>\n      <div class="bal" title="Saldo de fichas">')
body = rep(body, '<div class="rain" id="rain"></div>', '''<div class="rain" id="rain"></div>
<div class="modal" id="shopModal" hidden role="dialog" aria-label="Loja">
  <div class="sheet"><button class="x" id="shopClose" aria-label="Fechar a loja">✕</button><div class="sheet-body" id="shopBody"></div></div>
</div>
<div class="modal promo" id="promoModal" hidden role="dialog" aria-label="Oferta">
  <div class="sheet promo-sheet">
    <div class="wait" id="promoWait" aria-label="Aguarde para fechar"><span id="promoCount">5</span></div>
    <button class="x" id="promoClose" aria-label="Fechar oferta" hidden>✕</button>
    <div class="sheet-body" id="promoBody"></div>
  </div>
</div>''')
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
.cart-btn{position:relative;color:var(--cream);background:var(--flame);border-color:transparent;box-shadow:0 4px 0 color-mix(in srgb,var(--flame) 45%,#000)}
.cart-btn:active{transform:translateY(2px);box-shadow:0 2px 0 color-mix(in srgb,var(--flame) 45%,#000)}
.cart-dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:var(--gold);border:2px solid var(--ink)}
.modal{position:fixed;inset:0;z-index:55;background:rgba(5,2,8,.72);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;padding:calc(12px + env(safe-area-inset-top,0px)) 0 0}
.sheet{position:relative;width:100%;max-width:560px;max-height:100%;overflow-y:auto;overscroll-behavior:contain;background:var(--plum);border:1px solid var(--line);border-bottom:0;border-radius:24px 24px 0 0;padding:20px 16px calc(24px + env(safe-area-inset-bottom,0px));animation:sheetUp .35s cubic-bezier(.2,1,.3,1)}
@keyframes sheetUp{from{transform:translateY(40px);opacity:0}}
.promo{align-items:center;padding:16px}
.promo-sheet{border-radius:24px;border-bottom:1px solid var(--line);max-height:calc(100% - 20px);padding-top:28px;text-align:center}
.x{position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;background:var(--plum-2);border:1px solid var(--line);color:var(--cream);font-size:16px;z-index:2}
.wait{--p:1;position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-mono);font-size:14px;color:var(--muted);
  background:conic-gradient(var(--amber) calc(var(--p) * 360deg),var(--plum-2) 0);transition:background .9s linear}
.wait span{width:28px;height:28px;border-radius:50%;background:var(--plum);display:grid;place-items:center}
.sheet-title,.promo-title{font-family:var(--f-display);font-weight:400;font-size:28px;line-height:1.1;margin:0 44px 12px 0;text-wrap:balance}
.promo-title{margin:6px 0 8px}
.promo-text{color:var(--muted);margin:0 auto 14px;max-width:40ch}
.sheet-sub{margin:18px 0 8px}
.club{position:relative;border-radius:18px;padding:16px;text-align:left;background:linear-gradient(135deg,color-mix(in srgb,var(--amber) 28%,var(--plum-2)),var(--plum-2) 60%);border:1px solid color-mix(in srgb,var(--amber) 55%,transparent);display:flex;flex-direction:column;gap:8px}
.club-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.club-top b{font-family:var(--f-display);font-weight:400;font-size:22px}
.club ul{margin:0;padding-left:18px;color:var(--cream);font-size:14px;display:flex;flex-direction:column;gap:2px}
.club>span,.club-done{font-size:13px;color:var(--muted);font-style:normal}
.buy.wide{width:100%;padding:13px 14px;font-size:15px}
.buy.big{font-size:16px;padding:15px}
.free{display:flex;flex-direction:column;gap:6px}
.free-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;border-radius:14px;background:var(--plum-2);border:1px solid var(--line);text-align:left}
.free-row b{display:block;font-size:14px}.free-row small{display:block;font-size:12px;color:var(--muted)}
.free-row em{font-style:normal;font-weight:800;color:var(--amber);flex:none}
.free-row:disabled{opacity:.5}
.skin-mini{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.sm{display:flex;flex-direction:column;align-items:center;gap:3px;padding:0 0 8px;border-radius:12px;overflow:hidden;background:var(--plum-2);color:var(--cream);border:1px solid var(--line);min-width:0}
.sm-pv{position:relative;width:100%;height:60px;background:radial-gradient(90% 80% at 50% 120%,var(--amber),transparent 60%),radial-gradient(80% 70% at 0% 90%,color-mix(in srgb,var(--glow-a) 85%,transparent),transparent 65%),linear-gradient(180deg,var(--stage-1),var(--stage-3))}
.sm .mb{position:absolute;left:50%;top:10px;width:26px;height:36px;margin-left:-13px;border-radius:4px;background:var(--back);border:2px solid var(--cream);transform:rotate(-8deg)}
.sm b{font-size:10px;line-height:1.15;padding:0 3px;text-align:center}
.sm em{font-style:normal;font-family:var(--f-mono);font-size:10px;color:var(--amber)}
.promo-or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:12px;margin:12px 0}
.promo-or::before,.promo-or::after{content:"";flex:1;height:1px;background:var(--line)}
.club-cta{width:100%;padding:12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--amber) 55%,transparent);background:var(--plum-2);text-align:left;display:flex;flex-direction:column;gap:2px}
.club-cta b{font-family:var(--f-display);font-weight:400;font-size:18px}.club-cta span{font-size:12px;color:var(--muted)}
.promo-save{font-size:12px;color:var(--muted);margin:8px 0 0}
.promo-art{width:96px;height:96px;margin:0 auto 6px;border-radius:24px;display:grid;place-items:center;background:var(--plum-2);border:1px solid var(--line)}
.no-sign{position:relative;font-family:var(--f-display);font-size:34px;color:var(--cream)}
.no-sign::after{content:"";position:absolute;left:-14px;right:-14px;top:50%;height:5px;border-radius:3px;background:var(--flame);transform:rotate(-35deg)}
.promo .skin-mini{margin-bottom:14px}
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
