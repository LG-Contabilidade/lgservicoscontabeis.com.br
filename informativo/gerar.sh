#!/bin/bash
# Gera os posts do Informativo do dia (1080x1920) a partir de um JSON.
# Uso: bash informativo/gerar.sh dados.json pasta_saida
set -e
D="$(cd "$(dirname "$0")" && pwd)"; IN="$(realpath "$1")"; OUT="$(realpath -m "${2:-posts}")"
cd "$D"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
[ -d node_modules/playwright ] || npm i --no-save --silent playwright@1 @fontsource/cormorant-garamond @fontsource/jost >/dev/null 2>&1
cp node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-{600,700}-normal.woff2 node_modules/@fontsource/jost/files/jost-latin-{400,500,600}-normal.woff2 .
cp ../simbolo.webp logo.webp
python3 -c "import qrcode" 2>/dev/null || pip install -q --break-system-packages qrcode >/dev/null 2>&1
python3 -c "
import qrcode
q=qrcode.QRCode(border=1,box_size=12,error_correction=qrcode.constants.ERROR_CORRECT_M)
q.add_data('https://lgservicoscontabeis.com.br/noticias.html');q.make()
q.make_image(fill_color=(18,15,10),back_color=(247,233,180)).save('qr.png')"
node render-posts.js "$IN" "$OUT"
