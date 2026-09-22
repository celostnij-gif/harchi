/**
 * Синхронізація каталогу з живого сайту harchifood.com (режим MERGE).
 * Джерело: download/harchi-products.json (WooCommerce Store API, 88 товарів).
 * - upsert 8 категорій живого сайту (без "Усі товари" = віртуальний фільтр all);
 * - upsert ~41 товару з категорії "Усі товари": merge за slug, відсутні — create;
 * - кожному товару проставляє bulkTiers (оптові скидки "Від N шт. — ціна").
 * Ідемпотентний. Запуск: node .zscripts/sync-live-catalog.cjs
 */
const { PrismaClient } = require("@prisma/client");
const { readFileSync, existsSync } = require("node:fs");
const { join } = require("node:path");

const db = new PrismaClient();
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "download", "harchi-products.json");

const LIVE_CATS = [
  { slug: "xl", nameUk: "Харчі XL", nameEn: "Kharchi XL", sort: 1 },
  { slug: "sub", nameUk: "100% Сублімати", nameEn: "100% Freeze-Dried", sort: 2 },
  { slug: "subxl", nameUk: "Сублімати XL", nameEn: "Freeze-Dried XL", sort: 3 },
  { slug: "pershi", nameUk: "Перші страви", nameEn: "Soups", sort: 4 },
  { slug: "drugi", nameUk: "Другі страви", nameEn: "Main dishes", sort: 5 },
  { slug: "snidanki", nameUk: "Сніданки", nameEn: "Breakfasts", sort: 6 },
  { slug: "sneky", nameUk: "Снеки", nameEn: "Snacks", sort: 7 },
  { slug: "napoi", nameUk: "Напої", nameEn: "Drinks", sort: 8 },
];

// Оптові рівні з каталогу usi-tovari живого сайту
const BULK = {
  xl149: [{ minQty: 3, price: 125 }, { minQty: 6, price: 120 }, { minQty: 12, price: 115 }],
  xl229: [{ minQty: 3, price: 199 }, { minQty: 6, price: 189 }, { minQty: 12, price: 179 }],
  xl299: [{ minQty: 3, price: 249 }, { minQty: 6, price: 239 }, { minQty: 12, price: 229 }],
  classic120: [{ minQty: 3, price: 100 }, { minQty: 6, price: 90 }, { minQty: 12, price: 85 }],
  sub249: [{ minQty: 3, price: 229 }, { minQty: 6, price: 219 }, { minQty: 12, price: 209 }],
  mid189: [{ minQty: 2, price: 159 }, { minQty: 5, price: 149 }],
  kasha90: [{ minQty: 10, price: 85 }, { minQty: 15, price: 80 }, { minQty: 20, price: 75 }],
  coffee50: [{ minQty: 10, price: 45 }, { minQty: 15, price: 40 }, { minQty: 20, price: 35 }],
  chia90: [{ minQty: 10, price: 80 }, { minQty: 15, price: 75 }, { minQty: 20, price: 70 }],
  kasha75: [{ minQty: 10, price: 70 }, { minQty: 15, price: 65 }, { minQty: 20, price: 60 }],
  kasha110: [{ minQty: 3, price: 95 }, { minQty: 6, price: 90 }, { minQty: 12, price: 85 }],
  kakao60: [{ minQty: 10, price: 55 }, { minQty: 20, price: 50 }],
};

// Локальний slug → ключ оптових рівнів
const SLUG_BULK = {
  "harcho-xl": "xl229", "borshch-xl": "xl229", "plov-xl": "xl229",
  "kuskus-xl": "xl149", "gribnoy-xl": "xl149", "grechka-xl": "xl149",
  "kartoplya-xl": "xl149", "goroh-xl": "xl149", "kuryachyj-sup-xl": "xl149",
  "miso-xl": "xl299", "tomyam-xl": "xl299", "pasta-shrimp-xl": "xl299",
  "harcho-sub": "sub249", "tomyam-sub": "sub249", "indychka-sub": "sub249",
  "sublimat-miso-sup": "sub249", "sublimat-tom-yam": "sub249",
  "plov-basmati": "mid189", "borshch": "mid189", "harcho": "mid189",
  "borshch-gustyj": "mid189", "harcho-gostrenkyj": "mid189",
  "gorohovyj": "classic120", "pecherytsi": "classic120", "grechka": "classic120",
  "kartoplya": "classic120", "rys": "classic120", "kartoplya-svynyna": "classic120",
  "borshch-svynyna": "classic120", "sup-gorohovyj": "classic120",
  "sup-kuryachyj-lokshyna": "classic120", "kus-kus-svynyna": "classic120",
  "sup-pyure-pecherytsi": "classic120", "rys-svynyna": "classic120",
  "grechka-svynyna": "classic120",
  "kasha-banana": "kasha110", "kasha-bananova": "kasha110",
  "kasha-vivsyana": "kasha75", "chia-choco": "chia90",
  "chia-shokolad": "chia90", "chia-zhuravlyna": "chia90",
  "kukurudzyana-kasha": "kasha90", "coffee-drip": "coffee50",
  "kakao": "kakao60", "napij-oblipikha": "kakao60",
};
// Woo slug → локальний slug (товари з "Усі товари", без наборів/подарунків)
const WOO_TO_LOCAL = {
  "kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi": "kuskus-xl",
  "harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi": "harcho-xl",
  "grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi": "gribnoy-xl",
  "gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi": "goroh-xl",
  "plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm": "plov-xl",
  "miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm": "miso-xl",
  "kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "kartoplya-xl",
  "n": "tomyam-xl",
  "grechka-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "grechka-xl",
  "kuryachyj-sup-tatarskyj-z-lokshynoyu-ta-kurkoyu-harchi-tm": "kuryachyj-sup-xl",
  "pasta-italijska-z-krevetkamy-u-vershkovomu-sousi-harchi-tm": "pasta-shrimp-xl",
  "borshh-ukrayinskyj-zi-smachnoyu-kurkoyu-harchi-xl": "borshch-xl",
  "kedrovyj-gorih-zolota-kolekcziya-premium-kedrovyj-gorih": "kedrovyj-gorih",
  "funduk-zolota-kolekcziya-premium-smazhenyj-funduk-czina-za-1-gram": "funduk",
  "keshyu-zolota-kolekcziya-premium-smazhenyj-keshyu-czina-za-1-gram": "keshyu",
  "fistashka-korolivska-premium-smazheni-fistashky-czina-za-1-gram": "fistashka",
  "premium-smazhenyj-mygdal-perekus-do-yakogo-povertayutsya": "mygdal",
  "pasta-z-krevetkamy-u-nizhnomu-vershkovomu-sousi": "pasta-z-krevetkamy",
  "plov-bagato-rysu-basmati-kurky-ta-solodkoyi-morkvy-harchi-tm": "plov-basmati",
  "borshh-gustyj-nasychenyj-ovochevyj-smak-z-sokovytoyu-kurkoyu-harchi-tm": "borshch-gustyj",
  "harcho-gostrenkyj-sup-kurkoyu-rysom-ta-pryanymy-specziyamy-harchi-tm": "harcho-gostrenkyj",
  "100-sublimat-miso-sup-with-shrimp-and-tofu-cheese": "sublimat-miso-sup",
  "100-sublimat-sup-tom-yam-kung": "sublimat-tom-yam",
  "sup-pyure-z-pecherycz-harchi-tm": "sup-pyure-pecherytsi",
  "kus-kus-marokkanskiy-z-ovochami": "kus-kus-svynyna",
  "chia-puding-chocolate": "chia-shokolad",
  "chia-puding-zi-shmatochkami-guravliny": "chia-zhuravlyna",
  "kakao-na-korov-yachomu-molotsi-harchi-tm": "kakao",
  "sup-kuryachiy-z-lokshinoyu-harchi-tm": "sup-kuryachyj-lokshyna",
  "kartoplya-zi-svininoyu-ta-ovochami-harchi-tm": "kartoplya-svynyna",
  "pea-soup-with-pork-harchi": "sup-gorohovyj",
  "borsch-with-pork-harchi": "borshch-svynyna",
  "batonchik-vivsyaniy-klasichniy-vivsyanchik-tm": "batonchyk-klasychnyj",
  "batonchik-vivsyaniy-z-medom-vivsyanchik-tm": "batonchyk-med",
  "oat-bar-with-cranberry-vivsyanchik": "batonchyk-zhuravlyna",
  "oat-bar-with-prune-vivsyanchik": "batonchyk-chornoslyv",
  "oat-bar-with-apricots-vivsyanchik": "batonchyk-ku-raha",
  "rice-porridge-with-meat-harchi": "rys-svynyna",
  "oat-porridge-with-fruits-harchi": "kasha-vivsyana",
  "banana-porridge-with-fruits-harchi": "kasha-bananova",
  "buckwheat-with-meat-harchi": "grechka-svynyna",
};

// Локальний slug → фото в public/products (завантажені раніше)
const SLUG_IMAGE = {
  "kuskus-xl": "/products/kuskus-marokkanskyj-xl.png",
  "harcho-xl": "/products/harcho-xl.png",
  "gribnoy-xl": "/products/gribnoy-xl.png",
  "goroh-xl": "/products/gorohovyj-sup-gollandskyj-xl.png",
  "plov-xl": "/products/plov-xl.png",
  "miso-xl": "/products/miso-xl.png",
  "kartoplya-xl": "/products/kartoplya-xl.png",
  "tomyam-xl": "/products/tomyam-xl.png",
  "grechka-xl": "/products/grechka-xl.png",
  "kuryachyj-sup-xl": "/products/kuryachyj-sup-tatarskyj-xl.png",
  "pasta-shrimp-xl": "/products/pasta-shrimp-xl.png",
  "borshch-xl": "/products/borshch-xl.png",
  "kedrovyj-gorih": "/products/kedrovyj-gorih.png",
  "funduk": "/products/funduk.png",
  "keshyu": "/products/keshyu.png",
  "fistashka": "/products/fistashka.png",
  "mygdal": "/products/mygdal.png",
  "pasta-z-krevetkamy": "/products/pasta-z-krevetkamy.png",
  "plov-basmati": "/products/plov-basmati.png",
  "borshch-gustyj": "/products/borshch-gustyj.png",
  "harcho-gostrenkyj": "/products/harcho-gostrenkyj.png",
  "sublimat-miso-sup": "/products/sublimat-miso-sup.png",
  "sublimat-tom-yam": "/products/sublimat-tom-yam.png",
  "sup-pyure-pecherytsi": "/products/sup-pyure-pecherytsi.png",
  "kus-kus-svynyna": "/products/kus-kus-svynyna.png",
  "chia-shokolad": "/products/chia-shokolad.png",
  "chia-zhuravlyna": "/products/chia-zhuravlyna.png",
  "kakao": "/products/kakao.png",
  "sup-kuryachyj-lokshyna": "/products/sup-kuryachyj-lokshyna.png",
  "kartoplya-svynyna": "/products/kartoplya-svynyna.png",
  "sup-gorohovyj": "/products/sup-gorohovyj.png",
  "borshch-svynyna": "/products/borshch-svynyna.png",
  "batonchyk-zhuravlyna": "/products/batonchyk-zhuravlyna.png",
  "batonchyk-chornoslyv": "/products/batonchyk-chornoslyv.png",
  "batonchyk-ku-raha": "/products/batonchyk-ku-raha.png",
  "batonchyk-klasychnyj": "/products/batonchyk-chornoslyv.png",
  "batonchyk-med": "/products/batonchyk-ku-raha.png",
  "rys-svynyna": "/products/rys-svynyna.png",
  "kasha-vivsyana": "/products/kasha-vivsyana.png",
  "kasha-bananova": "/products/kasha-bananova.png",
  "grechka-svynyna": "/products/grechka-svynyna.png",
};
// Woo slug → категорії сайту
const WOO_CATS = {
  "kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi": ["xl", "drugi"],
  "harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi": ["xl", "pershi"],
  "grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi": ["xl", "pershi"],
  "gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi": ["xl", "pershi"],
  "plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm": ["xl", "drugi"],
  "miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm": ["xl", "pershi", "sub"],
  "kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": ["xl", "drugi"],
  "n": ["xl", "pershi", "sub"],
  "grechka-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": ["xl", "drugi"],
  "kuryachyj-sup-tatarskyj-z-lokshynoyu-ta-kurkoyu-harchi-tm": ["xl", "pershi"],
  "pasta-italijska-z-krevetkamy-u-vershkovomu-sousi-harchi-tm": ["xl", "drugi"],
  "borshh-ukrayinskyj-zi-smachnoyu-kurkoyu-harchi-xl": ["xl", "pershi"],
  "kedrovyj-gorih-zolota-kolekcziya-premium-kedrovyj-gorih": ["sneky"],
  "funduk-zolota-kolekcziya-premium-smazhenyj-funduk-czina-za-1-gram": ["sneky"],
  "keshyu-zolota-kolekcziya-premium-smazhenyj-keshyu-czina-za-1-gram": ["sneky"],
  "fistashka-korolivska-premium-smazheni-fistashky-czina-za-1-gram": ["sneky"],
  "premium-smazhenyj-mygdal-perekus-do-yakogo-povertayutsya": ["sneky"],
  "pasta-z-krevetkamy-u-nizhnomu-vershkovomu-sousi": ["drugi"],
  "plov-bagato-rysu-basmati-kurky-ta-solodkoyi-morkvy-harchi-tm": ["drugi"],
  "borshh-gustyj-nasychenyj-ovochevyj-smak-z-sokovytoyu-kurkoyu-harchi-tm": ["pershi"],
  "harcho-gostrenkyj-sup-kurkoyu-rysom-ta-pryanymy-specziyamy-harchi-tm": ["pershi"],
  "100-sublimat-miso-sup-with-shrimp-and-tofu-cheese": ["sub", "pershi"],
  "100-sublimat-sup-tom-yam-kung": ["sub", "pershi"],
  "sup-pyure-z-pecherycz-harchi-tm": ["pershi"],
  "kus-kus-marokkanskiy-z-ovochami": ["drugi"],
  "chia-puding-chocolate": ["snidanki"],
  "chia-puding-zi-shmatochkami-guravliny": ["snidanki"],
  "kakao-na-korov-yachomu-molotsi-harchi-tm": ["napoi"],
  "sup-kuryachiy-z-lokshinoyu-harchi-tm": ["pershi"],
  "kartoplya-zi-svininoyu-ta-ovochami-harchi-tm": ["drugi"],
  "pea-soup-with-pork-harchi": ["pershi"],
  "borsch-with-pork-harchi": ["pershi"],
  "batonchik-vivsyaniy-klasichniy-vivsyanchik-tm": ["sneky"],
  "batonchik-vivsyaniy-z-medom-vivsyanchik-tm": ["sneky"],
  "oat-bar-with-cranberry-vivsyanchik": ["sneky"],
  "oat-bar-with-prune-vivsyanchik": ["sneky"],
  "oat-bar-with-apricots-vivsyanchik": ["sneky"],
  "rice-porridge-with-meat-harchi": ["drugi"],
  "oat-porridge-with-fruits-harchi": ["snidanki"],
  "banana-porridge-with-fruits-harchi": ["snidanki"],
  "buckwheat-with-meat-harchi": ["drugi"],
};

function cleanName(name) {
  return String(name).replace(/,\s*Харчі™?/g, "").replace(/,\s*Харчі\s*ТМ/g, "").trim();
}
function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const woo = JSON.parse(readFileSync(SRC, "utf8"));
  for (const c of LIVE_CATS) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, nameUk: c.nameUk, nameEn: c.nameEn, sort: c.sort, isActive: true },
      update: { nameUk: c.nameUk, nameEn: c.nameEn, sort: c.sort, isActive: true },
    });
  }
  console.log("categories:", await db.category.count());
  const byWooSlug = new Map(woo.map((p) => [p.slug, p]));
  let created = 0, updated = 0, skipped = 0, sort = 100;
  for (const [wooSlug, localSlug] of Object.entries(WOO_TO_LOCAL)) {
    const w = byWooSlug.get(wooSlug);
    if (!w) { console.log("  ! нема в Woo-JSON:", wooSlug); skipped++; continue; }
    const price = Math.round(parseInt(w.prices.price, 10) / 100);
    const regular = Math.round(parseInt(w.prices.regular_price, 10) / 100);
    const cats = (WOO_CATS[wooSlug] || []).join(",");
    const bulkKey = SLUG_BULK[localSlug];
    const data = {
      nameUk: cleanName(w.name),
      shortUk: stripHtml(w.short_description).slice(0, 400) || cleanName(w.name),
      portionUk: "",
      cats,
      price,
      oldPrice: regular > price ? regular : null,
      image: SLUG_IMAGE[localSlug] || ("/products/" + localSlug + ".png"),
      bulkTiers: bulkKey ? JSON.stringify(BULK[bulkKey]) : "[]",
      rating: w.average_rating ? Number(w.average_rating) : 4.8,
      reviewsCount: Number(w.review_count) || 0,
      isActive: true,
      sort: sort++,
    };
    const existing = await db.product.findUnique({ where: { slug: localSlug } });
    if (existing) { await db.product.update({ where: { slug: localSlug }, data }); updated++; }
    else { await db.product.create({ data: { slug: localSlug, ...data } }); created++; }
  }
  console.log("products: created=" + created + " updated=" + updated + " skipped=" + skipped + " total=" + (await db.product.count()));
  const extra = [
    ["harcho-sub", "sub249"], ["tomyam-sub", "sub249"], ["indychka-sub", "sub249"],
    ["gorohovyj", "classic120"], ["pecherytsi", "classic120"], ["grechka", "classic120"],
    ["kartoplya", "classic120"], ["borshch", "mid189"], ["harcho", "mid189"],
    ["kasha-banana", "kasha110"], ["chia-choco", "chia90"],
    ["napij-oblipikha", "kakao60"], ["coffee-drip", "coffee50"],
  ];
  let extraSet = 0;
  for (const [slug, key] of extra) {
    const r = await db.product.updateMany({ where: { slug, bulkTiers: "[]" }, data: { bulkTiers: JSON.stringify(BULK[key]) } });
    extraSet += r.count;
  }
  console.log("bulkTiers для локальних товарів:", extraSet);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
