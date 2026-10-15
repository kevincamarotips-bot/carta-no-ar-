#!/usr/bin/env python3
"""Gera www/index.html (o jogo do app Android) a partir de src/carta-no-ar.html.

src/carta-no-ar.html é a versão que roda no Claude. Este script:
  - monta um documento HTML completo (doctype, head, meta charset);
  - insere src/app-module.js dentro do script do jogo;
  - liga os ganchos do app (fichas do dia, anúncios, aba Loja, visuais pagos por fase);
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

# ---- game hooks (the game calls app functions only when they exist) ----
body = rep(body, '\n(() => {\nconst SUITS', '\n(() => {\nvar APP = true;\nconst SUITS')
body = rep(body, 'const skinOpen = s => s.pass ? passSkinOwned(s.k) : !s.phase || phaseSeen(s.phase);',
           'const skinOpen = s => s.pass ? passSkinOwned(s.k) : !s.phase || phaseSeen(s.phase) || appSkinOpen(s);')
body = rep(body, '\napplySkin(SKIN, false);\n', '\n' + module + '\napplySkin(SKIN, false);\n')
body = rep(body, "'Sem fichas. Abra o Chapéu do Mágico.'", "'Sem fichas. Pegue fichas grátis na Loja.'")

# ---- markup only the app has ----
body = rep(body, '<div class="rain" id="rain"></div>', """<div class="rain" id="rain"></div>
<div class="promo-modal" id="promoModal" hidden role="dialog" aria-label="Oferta">
  <div class="sheet promo-sheet">
    <div class="wait" id="promoWait" aria-label="Aguarde para fechar"><span id="promoCount">5</span></div>
    <button class="x" id="promoClose" aria-label="Fechar oferta" hidden>✕</button>
    <div id="promoBody"></div>
  </div>
</div>""")
body = rep(body, '<p class="start-msg" id="startMsg" role="status"></p>',
           '<p class="start-msg" id="startMsg" role="status"></p>\n    <p class="app-legal">Fichas virtuais sem valor em dinheiro. Não é possível sacar, trocar ou transferir fichas. Jogo apenas para entretenimento, proibido para menores de 18 anos.</p>')
body = rep(body, '<p class="fineprint">Fichas fictícias e gratuitas, só por diversão. Nenhum dinheiro real envolvido.</p>',
           '<p class="fineprint">Fichas virtuais sem valor em dinheiro: não podem ser sacadas, trocadas nem transferidas. Jogo apenas para entretenimento, para maiores de 18 anos.</p>')

app_css = """<style>
:root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
[hidden]{display:none!important}
.app-build #modeBtn,.app-build .field,.app-build .mode[data-mode="rank"],.app-build .mode:not([data-mode]){display:none!important}
.app-build .modes{grid-template-columns:1fr!important;max-width:420px;width:100%;margin:0 auto}
.app-build .tabbar{padding-bottom:6px} /* the page already leaves room for the system bar */
.app-legal{max-width:420px;margin:0 auto;text-align:center;font-size:12px;color:var(--muted)}
#lojaBody{display:flex;flex-direction:column;gap:10px}
#lojaBody .sheet-sub{margin:12px 0 0}
.ph-card{display:flex;flex-direction:column;gap:8px;background:linear-gradient(160deg,color-mix(in srgb,var(--violet) 26%,var(--plum)),var(--plum) 70%)}
.ph-card .eyebrow{margin:0}
.ph-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
.ph-head b{font-family:var(--f-display);font-weight:400;font-size:24px;line-height:1.1}
.ph-mult{font-family:var(--f-mono);font-size:20px;color:var(--ink);background:var(--gold);border-radius:12px;padding:4px 10px;box-shadow:0 0 22px color-mix(in srgb,var(--gold) 45%,transparent)}
.ph-sub,.ph-next{margin:0;font-size:13px;color:var(--muted)}.ph-next b{color:var(--cream);font-weight:600}
.ph-steps{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:2px;position:relative;margin:4px 0}
.ph-steps::before{content:"";position:absolute;left:6%;right:6%;top:15px;height:2px;background:var(--line-2)}
.ph-step{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px}
.ph-step i{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;background:var(--plum-2);border:1px solid var(--line-2);color:var(--muted)}
.ph-step small{font-family:var(--f-mono);font-size:10px;color:var(--muted)}
.ph-step.done i{background:color-mix(in srgb,var(--gold) 30%,var(--plum-2));color:var(--cream);border-color:transparent}
.ph-step.here i{background:var(--gold);color:var(--ink);border-color:transparent;box-shadow:0 0 0 4px color-mix(in srgb,var(--gold) 25%,transparent)}
.ph-step.here small{color:var(--gold)}
.ph-card .pill-btn{align-self:flex-start}
.shop-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:var(--plum);border:1px solid var(--line)}
.shop-row div{min-width:0}.shop-row b{display:block}.shop-row span{display:block;font-size:12px;color:var(--muted)}
.buy{flex:none;border-radius:12px;padding:10px 14px;font-weight:800;background:var(--flame);color:#fff}
.bundle{width:100%;border-radius:14px;padding:12px 14px;text-align:left;background:linear-gradient(135deg,color-mix(in srgb,var(--flame) 70%,var(--plum-2)),color-mix(in srgb,var(--violet) 60%,var(--plum-2)));color:#fff;display:flex;flex-direction:column;gap:1px}
.bundle b{font-size:15px}.bundle span{font-size:12px;opacity:.85}
.owned{font-style:normal;font-family:var(--f-mono);color:var(--amber)}
.packs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pack{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:14px 6px 12px;border-radius:14px;background:var(--plum);border:1px solid var(--line);text-align:center}
.pack.best{border-color:color-mix(in srgb,var(--gold) 60%,transparent)}
.pk-tag{position:absolute;top:-9px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;background:var(--gold);color:var(--ink);border-radius:999px;padding:2px 8px}
.pack small{font-size:11px;color:var(--muted)}.pack b{font-family:var(--f-mono);font-weight:500;font-size:14px}
.pack em{font-style:normal;font-weight:800;font-size:12px;color:var(--ink);background:var(--gold);border-radius:999px;padding:3px 10px;margin-top:2px}
.pack[aria-disabled="true"]{opacity:.45}
.club{position:relative;border-radius:18px;padding:16px;text-align:left;background:linear-gradient(135deg,color-mix(in srgb,var(--amber) 26%,var(--plum-2)),var(--plum-2) 60%);border:1px solid color-mix(in srgb,var(--amber) 55%,transparent);display:flex;flex-direction:column;gap:8px}
.club-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.club-top b{font-family:var(--f-display);font-weight:400;font-size:22px}
.club ul{margin:0;padding-left:18px;color:var(--cream);font-size:14px;display:flex;flex-direction:column;gap:2px}
.club>span,.club-done{font-size:13px;color:var(--muted);font-style:normal}
.buy.wide{width:100%;padding:13px 14px;font-size:15px}
.buy.big{font-size:16px;padding:15px}
.free{display:flex;flex-direction:column;gap:6px}
.free-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border-radius:14px;background:var(--plum);border:1px solid var(--line);text-align:left}
.free-row b{display:block;font-size:14px}.free-row small{display:block;font-size:12px;color:var(--muted)}
.free-row em{font-style:normal;font-weight:800;font-size:13px;color:var(--ink);background:var(--gold);border-radius:12px;padding:8px 12px;flex:none}
.free-row:disabled{opacity:.5}.free-row:disabled em{background:var(--plum-2);color:var(--muted)}
.skin-mini{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.sm{display:flex;flex-direction:column;align-items:center;gap:3px;padding:0 0 8px;border-radius:12px;overflow:hidden;background:var(--plum);color:var(--cream);border:1px solid var(--line);min-width:0}
.sm.on{border-color:var(--gold)}.sm.locked .sm-pv{filter:grayscale(.6) brightness(.6)}
.sm-pv{position:relative;width:100%;height:60px;overflow:hidden;background:radial-gradient(90% 80% at 50% 120%,var(--sleeve-trim),transparent 60%),radial-gradient(80% 70% at 0% 90%,color-mix(in srgb,var(--glow-a) 85%,transparent),transparent 65%),linear-gradient(180deg,var(--stage-1),var(--stage-3))}
.sm-pv .mh{position:absolute;left:50%;bottom:-12px;width:50px;height:48px;margin-left:-25px;overflow:visible}
.promo-skin .sm-pv .mh{width:120px;height:116px;margin-left:-60px;bottom:-30px}
.sm .mb,.promo-skin .mb{z-index:2;position:absolute;left:50%;top:10px;width:26px;height:36px;margin-left:-13px;border-radius:4px;background:var(--back);border:2px solid var(--cream);transform:rotate(-8deg)}
.sm b{font-size:10px;line-height:1.15;padding:0 3px;text-align:center}
.sm em{font-style:normal;font-family:var(--f-mono);font-size:10px;color:var(--amber)}
.promo-modal{position:fixed;inset:0;z-index:75;background:rgba(3,2,8,.74);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:16px}
.promo-sheet{border-radius:24px;border-bottom:1px solid var(--line);max-height:calc(100% - 20px);padding-top:28px;text-align:center}
.wait{--p:1;position:absolute;top:14px;right:14px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-mono);font-size:14px;color:var(--muted);
  background:conic-gradient(var(--amber) calc(var(--p) * 360deg),var(--plum-2) 0);transition:background .9s linear}
.wait span{width:28px;height:28px;border-radius:50%;background:var(--plum);display:grid;place-items:center}
.promo-title{font-family:var(--f-display);font-weight:400;font-size:28px;line-height:1.1;margin:6px 30px 8px;text-wrap:balance}
.promo-text{color:var(--muted);margin:0 auto 14px;max-width:40ch}
.promo-skin{position:relative;height:150px;border-radius:18px;overflow:hidden;margin:0 0 14px}
.promo-skin .sm-pv{position:absolute;inset:0;height:auto}
.promo-skin .mb{width:64px;height:90px;margin-left:-32px;top:28px;border-radius:9px;border-width:3px}
.promo-or{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:12px;margin:12px 0}
.promo-or::before,.promo-or::after{content:"";flex:1;height:1px;background:var(--line)}
.club-cta{width:100%;padding:12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--amber) 55%,transparent);background:var(--plum-2);text-align:left;display:flex;flex-direction:column;gap:2px;margin-top:10px}
.club-cta b{font-family:var(--f-display);font-weight:400;font-size:18px}.club-cta span{font-size:12px;color:var(--muted)}
.promo-art{width:96px;height:96px;margin:0 auto 6px;border-radius:24px;display:grid;place-items:center;background:var(--plum-2);border:1px solid var(--line)}
.no-sign{position:relative;font-family:var(--f-display);font-size:34px;color:var(--cream)}
.no-sign::after{content:"";position:absolute;left:-14px;right:-14px;top:50%;height:5px;border-radius:3px;background:var(--flame);transform:rotate(-35deg)}
.restore{display:block;margin:4px auto 0;font-size:12px;color:var(--muted);text-decoration:underline;text-underline-offset:3px}
</style>"""

cfg = '<script>window.APP_CONFIG = ' + json.dumps({'adsTest': not release}) + ';</script>'
html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0716">
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
