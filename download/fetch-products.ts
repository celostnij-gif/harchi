/**
 * Завантажує всі товари з https://harchifood.com (WooCommerce Store API).
 * Результат: download/harchi-products.json (масив товарів)
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";

const BASE = "https://harchifood.com/wp-json/wc/store/v1/products";
const OUT = "download/harchi-products.json";
const PAGE_SIZE = 100;

type WcProduct = { id: number; name: string };

async function fetchPage(page: number): Promise<WcProduct[]> {
  const url = `${BASE}?per_page=${PAGE_SIZE}&page=${page}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "harchi-sync/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} на сторінці ${page}`);
  }
  return (await res.json()) as WcProduct[];
}

async function main() {
  mkdirSync("download", { recursive: true });

  // Якщо частковий файл уже існує — не перезаписуємо, стартуємо з чистого
  if (existsSync(OUT)) {
    console.log(`Файл ${OUT} уже існує — видаляю і качаю заново.`);
  }

  const all: WcProduct[] = [];
  let page = 1;
  for (;;) {
    const items = await fetchPage(page);
    console.log(`Сторінка ${page}: ${items.length} товарів`);
    if (items.length === 0) break;
    all.push(...items);
    if (items.length < PAGE_SIZE) break;
    page++;
    if (page > 50) {
      console.log("Досягнуто ліміт 50 сторінок — зупинка.");
      break;
    }
  }

  writeFileSync(OUT, JSON.stringify(all, null, 2), "utf8");
  console.log(`\nВсього завантажено: ${all.length} товарів`);
  console.log(`Збережено у ${OUT}`);
}

main().catch((e) => {
  console.error("Помилка:", e);
  process.exit(1);
});
