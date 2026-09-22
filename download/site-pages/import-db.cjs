/**
 * Імпорт повного каталогу harchifood.com (42 позиції, з parsing даних).
 * Джерело: download/site-pages/import.json (спарсено з живих HTML-карток).
 * Канонічні slug/фото/категорії/бейджі — з .zscripts/sync-live-catalog.cjs.
 * - MERGE за slug: наявні товари оновлюються, нові — створюються;
 * - bulkTiers — реальні рівні з живого сайту;
 * - isActive=false для «Очікується» (нема в наявності);
 * - ідемпотентний. Запуск: node download/site-pages/import-db.cjs
 */
const { PrismaClient } = require("@prisma/client");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const db = new PrismaClient();
const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "download", "site-pages", "import.json");

/** Woo slug (без домену) → локальний slug. Мапа з sync-live-catalog.cjs. */
const WOO_TO_LOCAL = {
  "buckwheat-with-meat-harchi": "grechka-svynyna",
  "grechka-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "grechka-xl",
  "kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "kartoplya-xl",
  "kartoplya-zi-svininoyu-ta-ovochami-harchi-tm": "kartoplya-svynyna",
  "kus-kus-marokkanskiy-z-ovochami": "kus-kus-svynyna",
  "kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi": "kuskus-xl",
  "pasta-italijska-z-krevetkamy-u-vershkovomu-sousi-harchi-tm": "pasta-shrimp-xl",
  "pasta-z-krevetkamy-u-nizhnomu-vershkovomu-sousi": "pasta-z-krevetkamy",
  "plov-bagato-rysu-basmati-kurky-ta-solodkoyi-morkvy-harchi-tm": "plov-basmati",
  "plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm": "plov-xl",
  "rice-porridge-with-meat-harchi": "rys-svynyna",
  "borsch-with-pork-harchi": "borshch-svynyna",
  "borshh-gustyj-nasychenyj-ovochevyj-smak-z-sokovytoyu-kurkoyu-harchi-tm": "borshch-gustyj",
  "borshh-ukrayinskyj-zi-smachnoyu-kurkoyu-harchi-xl": "borshch-xl",
  "gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi": "goroh-xl",
  "grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi": "gribnoy-xl",
  "harcho-gostrenkyj-sup-kurkoyu-rysom-ta-pryanymy-specziyamy-harchi-tm": "harcho-gostrenkyj",
  "harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi": "harcho-xl",
  "kuryachyj-sup-tatarskyj-z-lokshynoyu-ta-kurkoyu-harchi-tm": "kuryachyj-sup-xl",
  "miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm": "miso-xl",
  "pea-soup-with-pork-harchi": "sup-gorohovyj",
  "sup-kuryachiy-z-lokshinoyu-harchi-tm": "sup-kuryachyj-lokshyna",
  "sup-pyure-z-pecherycz-harchi-tm": "sup-pyure-pecherytsi",
  "fistashka-korolivska-premium-smazheni-fistashky-czina-za-1-gram": "fistashka",
  "funduk-zolota-kolekcziya-premium-smazhenyj-funduk-czina-za-1-gram": "funduk",
  "kedrovyj-gorih-zolota-kolekcziya-premium-kedrovyj-gorih": "kedrovyj-gorih",
  "keshyu-zolota-kolekcziya-premium-smazhenyj-keshyu-czina-za-1-gram": "keshyu",
  "oat-bar-with-apricots-vivsyanchik": "batonchyk-ku-raha",
  "oat-bar-with-cranberry-vivsyanchik": "batonchyk-zhuravlyna",
  "oat-bar-with-prune-vivsyanchik": "batonchyk-chornoslyv",
  "premium-smazhenyj-mygdal-perekus-do-yakogo-povertayutsya": "mygdal",
  "banana-porridge-with-fruits-harchi": "kasha-bananova",
  "chia-puding-chocolate": "chia-shokolad",
  "chia-puding-zi-shmatochkami-guravliny": "chia-zhuravlyna",
  "kukurudzyana-kasha-z-kopchenym-syrom-suluguni": "kukurudzyana-kasha",
  "oat-porridge-with-fruits-harchi": "kasha-vivsyana",
  "100-sublimat-miso-sup-with-shrimp-and-tofu-cheese": "sublimat-miso-sup",
  "100-sublimat-sup-tom-yam-kung": "sublimat-tom-yam",
  "kakao-na-korov-yachomu-molotsi-harchi-tm": "kakao",
  "kava-arabika-efiopia-u-filtr-paketi-harchi-tm": "coffee-drip",
  "nabir-z-10-odynycz-kozhnogo-z-100-sublimativ": "nabir-sublimativ",
};

/** Локальний slug → фото в public/products (усі файли вже завантажені). */
const SLUG_IMAGE = {
  "kuskus-xl": "/products/kuskus-marokkanskyj-xl.png",
  "harcho-xl": "/products/harcho-gruzynskyj-xl.png",
  "gribnoy-xl": "/products/grybnyj-krem-sup-franczuzskyj-xl.png",
  "goroh-xl": "/products/gorohovyj-sup-gollandskyj-xl.png",
  "plov-xl": "/products/plov-uzbeczkyj-xl.png",
  "miso-xl": "/products/miso-xl.png",
  "kartoplya-xl": "/products/kartoplya-ukrayinska-xl.png",
  "tomyam-xl": "/products/tom-yam-kung-xl.png",
  "grechka-xl": "/products/grechka-ukrayinska-xl.png",
  "kuryachyj-sup-xl": "/products/kuryachyj-sup-tatarskyj-xl.png",
  "pasta-shrimp-xl": "/products/pasta-italijska-xl-z-krevetkamy.png",
  "borshch-xl": "/products/borshch-ukrayinskyj-xl.png",
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
  "rys-svynyna": "/products/rys-svynyna.png",
  "kasha-vivsyana": "/products/kasha-vivsyana.png",
  "kasha-bananova": "/products/kasha-bananova.png",
  "grechka-svynyna": "/products/grechka-svynyna.png",
  "kukurudzyana-kasha": "/products/kukurudzyana-kasha.png",
  "coffee-drip": "/products/kava-arabika.png",
  "nabir-sublimativ": "/products/nabir-sublimativ.png",
};

/** Канонічні категорії сайтів (Woo slug → локальні). З sync-live-catalog. */
const WOO_CATS = {
  "kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi": ["xl", "drugi"],
  "harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi": ["xl", "pershi"],
  "grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi": ["xl", "pershi"],
  "gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi": ["xl", "pershi"],
  "plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm": ["xl", "drugi"],
  "miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm": ["xl", "pershi", "sub"],
  "kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": ["xl", "drugi"],
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
  "oat-bar-with-cranberry-vivsyanchik": ["sneky"],
  "oat-bar-with-prune-vivsyanchik": ["sneky"],
  "oat-bar-with-apricots-vivsyanchik": ["sneky"],
  "rice-porridge-with-meat-harchi": ["drugi"],
  "oat-porridge-with-fruits-harchi": ["snidanki"],
  "banana-porridge-with-fruits-harchi": ["snidanki"],
  "buckwheat-with-meat-harchi": ["drugi"],
  "kukurudzyana-kasha-z-kopchenym-syrom-suluguni": ["snidanki"],
  "kava-arabika-efiopia-u-filtr-paketi-harchi-tm": ["napoi"],
  "nabir-z-10-odynycz-kozhnogo-z-100-sublimativ": ["sub"],
};

/** Хіти та новинки (для бейджів — як на гол. сторінці). */
const BADGES = {
  "harcho-xl": "hit",
  "borshch-xl": "hit",
  "goroh-xl": "hit",
  "kasha-bananova": "hit",
  "coffee-drip": "hit",
  "miso-xl": "new",
  "tomyam-xl": "new",
  "chia-shokolad": "new",
  "sublimat-miso-sup": "new",
  "pasta-shrimp-xl": "premium",
  "sublimat-tom-yam": "premium",
  "harcho-sub": "hit",
  "nabir-sublimativ": "premium",
};

function cleanName(name) {
  return String(name)
    .replace(/,\s*Харчі™?/g, "")
    .replace(/,\s*Харчі\s*ТМ/g, "")
    .replace(/,\s*Вівсянчик\s*ТМ/g, "")
    .replace(/,?\s*100%\s*Сублімат\.?\s*/i, "")
    .trim();
}

async function main() {
  const rows = JSON.parse(readFileSync(SRC, "utf8"));
  let created = 0, updated = 0, sort = 100;

  for (const row of rows) {
    const localSlug = WOO_TO_LOCAL[row.slug] ?? row.slug;
    // Тома Ям XL у import.json вже склеєний зі slug "tomyam-xl" → мапимо на канонічний tomyam-xl
    const slug = localSlug === "tomyam-xl" ? "tomyam-xl" : localSlug;
    const wooSlug = row.slug === "tomyam-xl" ? "n" : row.slug;

    const cats = (WOO_CATS[wooSlug] ?? row.cats ?? []).join(",");
    const image = SLUG_IMAGE[slug] ?? "/products/" + slug + ".png";

    const data = {
      nameUk: cleanName(row.nameUk),
      shortUk: (row.shortUk || cleanName(row.nameUk)).slice(0, 400),
      descriptionUk: row.descriptionUk || "",
      cats,
      price: row.price,
      image,
      bulkTiers: JSON.stringify(
        (row.bulkTiers || []).map((t) => ({ minQty: t.minQty, price: t.price }))
      ),
      badge: BADGES[slug] ?? null,
      rating: row.rating && row.rating > 0 ? row.rating : 4.9,
      reviewsCount: row.reviewsCount ?? 0,
      isActive: row.isActive !== false,
      sort: sort++,
    };

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) {
      await db.product.update({ where: { slug }, data });
      updated++;
    } else {
      await db.product.create({ data: { slug, ...data } });
      created++;
    }
  }

  console.log(
    `products: created=${created} updated=${updated} total=${await db.product.count()}`
  );
  console.log(
    `with bulkTiers: ${await db.product.count({ where: { bulkTiers: { not: "[]" } } })}`
  );
  console.log(
    `active: ${await db.product.count({ where: { isActive: true } })}`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
