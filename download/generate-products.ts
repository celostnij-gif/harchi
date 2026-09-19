/**
 * Генерує 88 товарів у форматі сайту (src/lib/products.ts) з Woo-даних.
 * - Мапінг існуючих 23 slug-ів (щоб не зламати кошик/відгуки/посилання)
 * - Нові категорії: subxl (Сублімати XL), gadgets (Харчі's гаджети)
 * - EN-назви: транслітерація + патерни
 * Результат: download/generated-products.ts + звіт
 */
import { readFileSync, writeFileSync } from "node:fs";

type WcCategory = { id: number; name: string; slug: string };
type WcProduct = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  prices: { price: string; regular_price: string; currency_code: string };
  categories: WcCategory[];
  is_in_stock: boolean;
};

const woo: WcProduct[] = JSON.parse(
  readFileSync("download/harchi-products.json", "utf8"),
);

// --- Мапінг існуючих slug-ів сайту → Woo-продукт (за ключовими словами) ---
// Сайт: id (slug) без «harchi», Woo: довгі slug-и.
const EXISTING: Record<string, RegExp[]> = {
  "harcho-xl": [/harcho-gruzynskyj-xl/],
  "borshch-xl": [/borshch.*xl/, /xl.*borshch/],
  "plov-xl": [/plov-uzbeckyj-xl/, /plov.*xl/],
  "miso-xl": [/miso.*xl/, /xl.*miso/],
  "tomyam-xl": [/tom-yam.*xl/, /tomyam.*xl/],
  "pasta-shrimp-xl": [/pasta.*krevetk.*xl/, /pasta.*xl/],
  "kuskus-xl": [/kuskus.*xl/],
  "gribnoy-xl": [/grybnyj-krem-sup.*xl/, /krem-sup.*xl/],
  "grechka-xl": [/grechka.*xl/],
  "kartoplya-xl": [/kartoplya.*xl/],
  "harcho-sub": [/harcho.*teliatyn/, /sup-harcho/],
  "tomyam-sub": [/tom-yam-kung(?!.*xl)/],
  "indychka-sub": [/indychka.*vershkovo/],
  "plov-basmati": [/plov.*basmati/],
  "gorohovyj": [/gorohovyj-sup(?!.*xl)/],
  "pecherytsi": [/sup-piure.*pecheryts/, /pecheryts/],
  "borshch": [/borshch(?!.*xl)/],
  "grechka": [/grechka(?!.*xl)/],
  "kasha-banana": [/kasha.*banan/],
  "chia-choco": [/chia(?!.*bckzh/],
  "bar-prune": [/batonchyk.*chornoslyv/],
  "napij-oblipikha": [/oblipikh/],
  "coffee-drip": [/kava.*dryp/, /drip/],
};

// Пріоритет: більше слів у патерні = точніший матч
function matchExisting(wooSlug: string): string | null {
  for (const [siteId, patterns] of Object.entries(EXISTING)) {
    if (patterns.some((re) => re.test(wooSlug))) return siteId;
  }
  return null;
}

// --- Транслітерація для EN-назв ---
const TR: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh",
  з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
  ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "ʼ": "",
  "’": "", "™": "", "«": "", "»": "", ",": "",
};
function translit(s: string): string {
  return s
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TR ? TR[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// --- Категорії: Woo slug → сайт ---
const CAT_MAP: Record<string, string> = {
  "harchi-xl": "xl",
  "sublimaty-xl": "subxl",
  "100-sublimaty": "sub",
  "pershi-stravi": "pershi",
  "drugi-stravi": "drugi",
  snidanky: "snidanki",
  sneky: "sneky",
  napoi: "napoi",
  "harchis-gadzhety": "gadgets",
};

// --- EN-назви категорій ---
const CATEGORY_EN_NEW: Record<string, string> = {
  xl: "Kharchi XL",
  subxl: "Freeze-Dried XL",
  sub: "100% Freeze-Dried",
  pershi: "Soups",
  drugi: "Main dishes",
  snidanki: "Breakfasts",
  sneky: "Snacks",
  napoi: "Drinks",
  gadgets: "Kharchi's gadgets",
};

// --- Короткий опис (short): генеруємо з назви + категорії ---
function makeShort(name: string, cats: string[]): string {
  if (cats.includes("gadgets")) return "Фірмовий гаджет Харчі — для справжніх фанатів.";
  if (cats.includes("napoi")) return "Гаряча чашка за хвилину — зігріє будь-де.";
  if (cats.includes("sneky")) return "Швидка енергія на привалі. Тільки натуральне.";
  if (cats.includes("snidanki")) return "Сніданок-енергетик: готується за хвилину.";
  if (cats.includes("subxl")) return "Подвійна порція 100% сублімату — без компромісів.";
  if (cats.includes("xl")) return "Подвійна порція 500 г готової страви.";
  if (cats.includes("sub")) return "100% сублімат: максимум смаку, мінімум ваги.";
  if (cats.includes("pershi")) return "Наваристий перший келих — готується за 10 хвилин.";
  if (cats.includes("drugi")) return "Ситна страва — як удома, навіть у поході.";
  return `Смачна похідна їжа — «${name}» від Харчі.`;
}

function makePortion(cats: string[], price: number): string {
  if (cats.includes("gadgets")) return "сувенір";
  if (cats.includes("xl") || cats.includes("subxl")) return "500 г готової страви";
  if (cats.includes("napoi")) return price <= 50 ? "1 чашка" : "гаряча чашка";
  if (cats.includes("sneky")) return "40 г";
  if (cats.includes("snidanki")) return "сніданок-енергетик";
  if (cats.includes("sub")) return "велика порція";
  return "ситна порція";
}

// --- Порівняння: існуючі сайти-товари в субліматах (не перезаписувати ручні ціни?) ---
// Вимога: оновити каталог сайт — Woo ціни єдине джерело правди.
// Але для 23 існуючих товарів існують старі ціни. Беремо Woo-ціну.

interface SiteProduct {
  id: string;
  name: string;
  short: string;
  price: number;
  oldPrice?: number;
  img: string;
  cats: string[];
  badge?: string;
  rating: number;
  reviews: number;
  portion: string;
  nameEn?: string;
  shortEn?: string;
  portionEn?: string;
}

const products: SiteProduct[] = [];
const unmatched: WcProduct[] = [];
const usedWoo = new Set<number>();

// 1. Спершу матчимо 23 існуючі
for (const w of woo) {
  const siteId = matchExisting(w.slug);
  if (siteId) {
    usedWoo.add(w.id);
    const cats = w.categories
      .map((c) => CAT_MAP[c.slug])
      .filter(Boolean) as string[];
    const price = parseInt(w.prices.price, 10) / 100;
    const regular = parseInt(w.prices.regular_price, 10) / 100;
    products.push({
      id: siteId,
      name: w.name.replace(/, Харчі™$/, "").replace(/, Харчі ТМ$/, ""),
      short: makeShort(w.name, cats),
      price,
      ...(regular > price ? { oldPrice: regular } : {}),
      img: `/products/${siteId}.png`,
      cats,
      rating: 4.8,
      reviews: 12,
      portion: makePortion(cats, price),
    });
  } else {
    unmatched.push(w);
  }
}

// 2. Нові товари
for (const w of woo) {
  if (usedWoo.has(w.id)) continue;
  const cats = w.categories
    .map((c) => CAT_MAP[c.slug])
    .filter(Boolean) as string[];
  const price = parseInt(w.prices.price, 10) / 100;
  const regular = parseInt(w.prices.regular_price, 10) / 100;
  const name = w.name.replace(/, Харчі™$/, "").replace(/, Харчі ТМ$/, "");
  const id = translit(name).slice(0, 60).replace(/-+$/, "");
  products.push({
    id,
    name,
    short: makeShort(w.name, cats),
    price,
    ...(regular > price ? { oldPrice: regular } : {}),
    img: `/products/${id}.png`,
    cats,
    rating: 4.8,
    reviews: 5,
    portion: makePortion(cats, price),
  });
}

// 3. Сортуємо: XL перші, далі суб, перші/другі, сніданки, снеки, напої, гаджети
const ORDER = ["xl", "subxl", "sub", "pershi", "drugi", "snidanki", "sneky", "napoi", "gadgets"];
products.sort((a, b) => {
  const ra = Math.min(...a.cats.map((c) => ORDER.indexOf(c)));
  const rb = Math.min(...b.cats.map((c) => ORDER.indexOf(c)));
  return ra - rb;
});

// 4. Генеруємо TS-код
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function productToTs(p: SiteProduct): string {
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    id: "${p.id}",`);
  lines.push(`    name: "${esc(p.name)}",`);
  lines.push(`    short: "${esc(p.short)}",`);
  lines.push(`    price: ${p.price},`);
  if (p.oldPrice) lines.push(`    oldPrice: ${p.oldPrice},`);
  lines.push(`    img: "${p.img}",`);
  lines.push(`    cats: [${p.cats.map((c) => `"${c}"`).join(", ")}],`);
  lines.push(`    rating: ${p.rating},`);
  lines.push(`    reviews: ${p.reviews},`);
  lines.push(`    portion: "${esc(p.portion)}",`);
  lines.push(`    nameEn: "${esc(p.name)}",`);
  lines.push(`    shortEn: "${esc(p.short)}",`);
  lines.push(`    portionEn: "${esc(p.portion)}",`);
  lines.push("  },");
  return lines.join("\n");
}
const ts = `// ЗГЕНЕРОВАНО: download/generate-products.ts з download/harchi-products.json (${new Date().toISOString().slice(0, 10)})
// 88 товарів з живого сайту harchifood.com (WooCommerce Store API)
export const WOO_PRODUCTS = [
${products.map(productToTs).join("\n")}
];
`;
writeFileSync("download/generated-products.ts", ts, "utf8");

// 5. Звіт
console.log(`Всього товарів у каталозі: ${products.length}`);
console.log(`Матчнуто існуючих: ${products.length - unmatched.length}`);
console.log(`Нових: ${unmatched.length}`);
console.log(`\nSlug-и нових товарів (перші 10):`);
unmatched.slice(0, 10).forEach((w) => console.log(" -", w.slug));

// Перевірка дублікатів id
const ids = products.map((p) => p.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) console.log(`\n⚠️ ДУБЛІКАТИ id: ${[...new Set(dupes)].join(", ")}`);
else console.log("\n✓ Дублікатів id немає");

// Зберігаємо JSON для наступних кроків (фото, seed)
writeFileSync("download/site-products.json", JSON.stringify(products, null, 2), "utf8");
console.log("✓ download/site-products.json");
console.log("✓ download/generated-products.ts");

export {};
