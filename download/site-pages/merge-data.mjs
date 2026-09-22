// Склейка: карточки товаров (products.json) + листинг (listing.json) → import.json
// Правила:
//  - имя/описание/картинка — из карточки (для Тома Яма XL — из листинга, карточка битая на источнике)
//  - цены: базовая = max(priceLow, priceHigh) для товаров с tiers (retail = верх диапазона),
//          если tiers нет — priceLow (обычно одиночная цена); oldPrice не используем (это диапазон вариаций)
//  - tiers: из карточки, fallback — из листинга
//  - expected: из листинга (в карточках нет)
//  - категории: маппинг Woocommerce-категорий на локальные слаги
import fs from "fs";

const cards = JSON.parse(fs.readFileSync("download/site-pages/products.json", "utf8"));
const listing = JSON.parse(fs.readFileSync("download/site-pages/listing.json", "utf8"));

/** Маппинг исходных категорий → локальные слаги БД. */
function mapCats(card, title) {
  const slugs = new Set();
  const t = (title || card.name || "").toLowerCase();
  const cats = (card.categories || []).join(",").toLowerCase();

  // По category-ссылкам карточки
  if (cats.includes("harchi-xl")) slugs.add("xl");
  if (cats.includes("сублімат")) slugs.add("sub");
  if (cats.includes("100%")) slugs.add("sub");
  if (cats.includes("перші страви")) slugs.add("pershi");
  if (cats.includes("другі страви")) slugs.add("drugi");
  if (cats.includes("сніданки")) slugs.add("snidanki");
  if (cats.includes("snacks")) slugs.add("sneky");
  if (cats.includes("снеки")) slugs.add("sneky");
  if (cats.includes("напої")) slugs.add("napoi");

  // Фолбек по названию
  if (slugs.has("xl")) { slugs.add(t.includes("суп") ? "pershi" : "drugi"); }
  if (t.includes("сублімат")) slugs.add("sub");
  if (t.includes("каша") || t.includes("чіа")) slugs.add("snidanki");
  if (t.includes("батончик")) slugs.add("sneky");
  if (t.includes("горіх") || t.includes("фундук") || t.includes("кеш’ю") || t.includes("фісташка") || t.includes("мигдал") || t.includes("мигдаль") || t.includes("кешью")) slugs.add("sneky");
  if (t.includes("кава") || t.includes("какао") || t.includes("напій")) slugs.add("napoi");
  if (t.includes("суп") || t.includes("борщ") || t.includes("харчо")) slugs.add("pershi");
  if (t.includes("плов") || t.includes("гречк") || t.includes("картопля") || t.includes("кус-кус") || t.includes("кускус") || t.includes("паста") || t.includes("рис")) slugs.add("drugi");

  // "усі товари" выкидываем
  return [...slugs].filter((s) => s !== "usi-tovari");
}

/** Локальный короткий slug (канонические id из seed, битые — фиксы). */
function localSlug(card) {
  const s = card.slug;
  const MAP = {
    "buckwheat-with-meat-harchi": "grechka",
    "rice-porridge-with-meat-harchi": "rys-svynyna",
    "borsch-with-pork-harchi": "borshch-svynyna",
    "pea-soup-with-pork-harchi": "gorohovyj",
    "kartoplya-zi-svininoyu-ta-ovochami-harchi-tm": "kartoplya-svynyna",
    "kus-kus-marokkanskiy-z-ovochami": "kus-kus-svynyna",
    "kuskus-marokkanskyj-zi-svynynoyu-ta-ovochamy-harchi": "kuskus-marokkanskyj-xl",
    "pasta-italijska-z-krevetkamy-u-vershkovomu-sousi-harchi-tm": "pasta-z-krevetkamy",
    "pasta-z-krevetkamy-u-nizhnomu-vershkovomu-sousi": "pasta-shrimp-xl",
    "plov-bagato-rysu-basmati-kurky-ta-solodkoyi-morkvy-harchi-tm": "plov-basmati",
    "plov-xl-uzbeczkyj-zi-smachnoyu-kurkoyu-harchi-tm": "plov-uzbeczkyj-xl",
    "borshh-ukrayinskyj-zi-smachnoyu-kurkoyu-harchi-xl": "borshch-ukrayinskyj-xl",
    "harcho-gruzynskyj-xl-zi-smachnoyu-kurkoyu-harchi": "harcho-gruzynskyj-xl",
    "gollandskyj-gorohovyj-sup-xl-zi-svynynoyu-ta-grinkamy-harchi": "gorohovyj-sup-gollandskyj-xl",
    "grybnyj-krem-sup-franczuzskyj-xl-z-pecheryczyamy-ta-grinkamy-harchi": "grybnyj-krem-sup-franczuzskyj-xl",
    "kuryachyj-sup-tatarskyj-z-lokshynoyu-ta-kurkoyu-harchi-tm": "kuryachyj-sup-tatarskyj-xl",
    "miso-xl-yaponskyj-sup-z-krevetkamy-ta-syrom-tofu-harchi-tm": "miso-yaponskyj-xl",
    "harcho-gostrenkyj-sup-kurkoyu-rysom-ta-pryanymy-specziyamy-harchi-tm": "harcho-gostrenkyj",
    "sup-kuryachiy-z-lokshinoyu-harchi-tm": "sup-kuryachyj-lokshyna",
    "sup-pyure-z-pecherycz-harchi-tm": "sup-pyure-pecherytsi",
    "borshh-gustyj-nasychenyj-ovochevyj-smak-z-sokovytoyu-kurkoyu-harchi-tm": "borshch-gustyj",
    "grechka-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "grechka-ukrayinska-xl",
    "kartoplya-ukrayinska-xl-zi-svynynoyu-ta-ovochamy-harchi-tm": "kartoplya-ukrayinska-xl",
    "100-sublimat-miso-sup-with-shrimp-and-tofu-cheese": "sublimat-miso-sup",
    "100-sublimat-sup-tom-yam-kung": "sublimat-tom-yam",
    "kakao-na-korov-yachomu-molotsi-harchi-tm": "kakao",
    "kava-arabika-efiopia-u-filtr-paketi-harchi-tm": "kava-arabika",
    "nabir-z-10-odynycz-kozhnogo-z-100-sublimativ": "nabir-sublimativ",
    "banana-porridge-with-fruits-harchi": "kasha-bananova",
    "oat-porridge-with-fruits-harchi": "kasha-vivsyana",
    "chia-puding-chocolate": "chia-shokolad",
    "chia-puding-zi-shmatochkami-guravliny": "chia-zhuravlyna",
    "kukurudzyana-kasha-z-kopchenym-syrom-suluguni": "kukurudzyana-kasha",
    "oat-bar-with-cranberry-vivsyanchik": "batonchyk-zhuravlyna",
    "oat-bar-with-prune-vivsyanchik": "batonchyk-chornoslyv",
    "oat-bar-with-apricots-vivsyanchik": "batonchyk-ku-raha",
    "fistashka-korolivska-premium-smazheni-fistashky-czina-za-1-gram": "fistashka",
    "funduk-zolota-kolekcziya-premium-smazhenyj-funduk-czina-za-1-gram": "funduk",
    "kedrovyj-gorih-zolota-kolekcziya-premium-kedrovyj-gorih": "kedrovyj-gorih",
    "keshyu-zolota-kolekcziya-premium-smazhenyj-keshyu-czina-za-1-gram": "keshyu",
    "premium-smazhenyj-mygdal-perekus-do-yakogo-povertayutsya": "mygdal",
  };
  return MAP[s] ?? s;
}

/** Карточка → листинг: по нормализованному названию. */
function norm(t) {
  return (t || "")
    .toLowerCase()
    .replace(/&#8221;|&#8220;|&quot;/g, "")
    .replace(/[«»"'’ʼ]/g, "")
    .replace(/&[a-z#0-9]+;/g, "")
    .replace(/харчі(™)?( тм)?/g, "")
    .replace(/вівсянчик( тм)?/g, "")
    .replace(/100% сублімат\.?/g, "")
    .replace(/[^a-zа-яіїєґ0-9]/gi, "")
    .trim();
}

const byTitle = new Map(listing.map((l) => [norm(l.title), l]));

const out = [];
const noListing = [];

for (const card of cards) {
  const l = byTitle.get(norm(card.name));
  if (!l) noListing.push(card.slug);

  const tiers = (card.tiers.length ? card.tiers : l?.tiers ?? []).map((t) => ({ minQty: t.qty, price: t.price }));
  // retail price: если есть tiers — retail=priceHigh (обычно), иначе priceLow
  const price = tiers.length
    ? (l?.priceHigh ?? card.priceHigh ?? card.priceLow)
    : (l?.priceLow ?? card.priceLow ?? card.priceHigh);

  const title = card.name;
  const slug = localSlug(card);
  const imgName = slug + ".png";

  out.push({
    slug,
    nameUk: title,
    shortUk: card.shortUk || "",
    descriptionUk: card.description,
    image: "/products/" + imgName,
    sourceImage: card.image,
    price,
    bulkTiers: tiers.sort((a, b) => a.qty - b.qty),
    cats: mapCats(card, title),
    isActive: !(l?.expected ?? false),
    rating: card.rating ?? 4.9,
    reviewsCount: card.reviewsCount ?? 0,
  });
}

// Том Ям XL — карточка битая, собираем из листинга
if (!out.find((p) => p.slug === "tomyam-xl")) {
  const l = listing.find((x) => x.title.includes("Том Ям Кунг тайський XL"));
  if (l) {
    out.push({
      slug: "tomyam-xl",
      nameUk: "Том Ям Кунг тайський XL суп з креветками, Харчі™",
      descriptionUk: "",
      image: "/products/tomyam-xl.png",
      sourceImage: l.img,
      price: l.priceHigh,
      bulkTiers: l.tiers,
      cats: ["xl", "pershi"],
      isActive: !l.expected,
      rating: 4.9,
      reviewsCount: 0,
    });
  }
}

fs.writeFileSync("download/site-pages/import.json", JSON.stringify(out, null, 2));
console.log(`import records: ${out.length}`);
console.log(`no listing match: ${noListing.join(", ") || "none"}`);
console.log(`with tiers: ${out.filter((p) => p.bulkTiers.length).length}`);
console.log(`inactive (expected): ${out.filter((p) => !p.isActive).length}`);
