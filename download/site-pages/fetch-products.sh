#!/bin/bash
# Скачивает все карточки товаров harchifood.com в download/site-pages/products/
mkdir -p download/site-pages/products
cd download/site-pages/products || exit 1

cat > ../urls.txt <<'EOF'
https://harchifood.com/shop/drugi-stravi/buckwheat-with-meat-harchi/
https://harchifood.com/shop/drugi-stravi/grechka-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm/
https://harchifood.com/shop/drugi-stravi/kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm/
https://harchifood.com/shop/drugi-stravi/kartoplya-zi-svininoyu-ta-ovochami-harchi-tm/
https://harchifood.com/shop/drugi-stravi/kus-kus-marokkanskiy-z-ovochami/
https://harchifood.com/shop/drugi-stravi/kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi/
https://harchifood.com/shop/drugi-stravi/pasta-italijska-z-krevetkamy-u-vershkovomu-sousi-harchi-tm/
https://harchifood.com/shop/drugi-stravi/pasta-z-krevetkamy-u-nizhnomu-vershkovomu-sousi/
https://harchifood.com/shop/drugi-stravi/plov-bagato-rysu-basmati-kurky-ta-solodkoyi-morkvy-harchi-tm/
https://harchifood.com/shop/drugi-stravi/plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm/
https://harchifood.com/shop/drugi-stravi/rice-porridge-with-meat-harchi/
https://harchifood.com/shop/pershi-stravi/borsch-with-pork-harchi/
https://harchifood.com/shop/pershi-stravi/borshh-gustyj-nasychenyj-ovochevyj-smak-z-sokovytoyu-kurkoyu-harchi-tm/
https://harchifood.com/shop/pershi-stravi/borshh-ukrayinskyj-zi-smachnoyu-kurkoyu-harchi-xl/
https://harchifood.com/shop/pershi-stravi/gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi/
https://harchifood.com/shop/pershi-stravi/grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi/
https://harchifood.com/shop/pershi-stravi/harcho-gostrenkyj-sup-kurkoyu-rysom-ta-pryanymy-specziyamy-harchi-tm/
https://harchifood.com/shop/pershi-stravi/harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi/
https://harchifood.com/shop/pershi-stravi/kuryachyj-sup-tatarskyj-z-lokshynoyu-ta-kurkoyu-harchi-tm/
https://harchifood.com/shop/pershi-stravi/miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm/
https://harchifood.com/shop/pershi-stravi/pea-soup-with-pork-harchi/
https://harchifood.com/shop/pershi-stravi/sup-kuryachiy-z-lokshinoyu-harchi-tm/
https://harchifood.com/shop/pershi-stravi/sup-pyure-z-pecherycz-harchi-tm/
https://harchifood.com/shop/snacks/fistashka-korolivska-premium-smazheni-fistashky-czina-za-1-gram/
https://harchifood.com/shop/snacks/funduk-zolota-kolekcziya-premium-smazhenyj-funduk-czina-za-1-gram/
https://harchifood.com/shop/snacks/kedrovyj-gorih-zolota-kolekcziya-premium-kedrovyj-gorih/
https://harchifood.com/shop/snacks/keshyu-zolota-kolekcziya-premium-smazhenyj-keshyu-czina-za-1-gram/
https://harchifood.com/shop/snacks/oat-bar-with-apricots-vivsyanchik/
https://harchifood.com/shop/snacks/oat-bar-with-cranberry-vivsyanchik/
https://harchifood.com/shop/snacks/oat-bar-with-prune-vivsyanchik/
https://harchifood.com/shop/snacks/premium-smazhenyj-mygdal-perekus-do-yakogo-povertayutsya/
https://harchifood.com/shop/snidanki/banana-porridge-with-fruits-harchi/
https://harchifood.com/shop/snidanki/chia-puding-chocolate/
https://harchifood.com/shop/snidanki/chia-puding-zi-shmatochkami-guravliny/
https://harchifood.com/shop/snidanki/kukurudzyana-kasha-z-kopchenym-syrom-suluguni/
https://harchifood.com/shop/snidanki/oat-porridge-with-fruits-harchi/
https://harchifood.com/shop/usi-tovari/100-sublimat-miso-sup-with-shrimp-and-tofu-cheese/
https://harchifood.com/shop/usi-tovari/100-sublimat-sup-tom-yam-kung/
https://harchifood.com/shop/usi-tovari/kakao-na-korov-yachomu-molotsi-harchi-tm/
https://harchifood.com/shop/usi-tovari/kava-arabika-efiopia-u-filtr-paketi-harchi-tm/
https://harchifood.com/shop/usi-tovari/nabir-z-10-odynycz-kozhnogo-z-100-sublimativ/
EOF

i=0
while IFS= read -r url; do
  i=$((i+1))
  name=$(echo "$url" | sed 's|https://harchifood.com/shop/||; s|/$||; s|/|__|g')
  curl -s --max-time 30 "$url" -o "$name.html"
  size=$(wc -c < "$name.html")
  echo "$i: $name ($size bytes)"
done < ../urls.txt
echo "Done: $(ls -1 *.html 2>/dev/null | wc -l) files"
