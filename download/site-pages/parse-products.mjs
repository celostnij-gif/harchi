// Парсер всех скачанных карточек harchifood.com → products.json
import fs from "fs";
import path from "path";

const dir = "download/site-pages/products";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".html"));

/** Вырезать сбалансированный HTML-блок, начиная с индекса открывающего тега. */
function balancedBlock(s, startIdx) {
  const open = s.indexOf(">", startIdx);
  if (open === -1) return null;
  let depth = 1;
  let i = open + 1;
  while (i < s.length && depth > 0) {
    if (s[i] === "<") {
      if (s[i + 1] === "/") {
        depth--;
        if (depth === 0) return s.slice(startIdx, i);
        const close = s.indexOf(">", i);
        i = close;
      } else if (/[a-zA-Z]/.test(s[i + 1] ?? "")) {
        depth++;
      }
    }
    i++;
  }
  return null;
}

/** Стрип HTML-тегов → читаемый текст. */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) =>
      String.fromCharCode(parseInt(h, 16))
    )
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

const out = [];
const problems = [];

for (const f of files) {
  const s = fs.readFileSync(path.join(dir, f), "utf8");

  // ---------- JSON-LD ----------
  const ldMatch = s.match(
    /<script type="application\/ld\+json">(\{[\s\S]*?\})<\/script>/
  );
  let ld = null;
  if (ldMatch) {
    try {
      ld = JSON.parse(ldMatch[1]);
    } catch {
      ld = null;
    }
  }

  const name = ld?.name ?? "";
  const slug = f.replace(/\.html$/, "").split("__").pop();

  // ---------- описание (полный блок вкладки) ----------
  let description = "";
  const woDescIdx = s.search(/woocommerce-Tabs-panel--description/);
  if (woDescIdx !== -1) {
    // ищем первый div внутри панели (саму панель)
    const panelDiv = s.indexOf("<div", s.indexOf("<h2", woDescIdx) !== -1 ? woDescIdx : woDescIdx);
    const block = balancedBlock(s, woDescIdx);
    if (block) {
      // вырезаем внутренности: от конца заголовка панели до конца блока
      let inner = block;
      // убираем заголовок "Опис" если есть
      inner = inner.replace(/<h2[^>]*>[\s\S]*?<\/h2>/, "");
      description = htmlToText(inner);
    }
  }
  if (description.length < 100 && ld?.description) {
    const ldText = htmlToText(ld.description);
    if (ldText.length > description.length) description = ldText;
  }

  // ---------- короткое описание (short description) ----------
  // На исходном сайте нет блока short-description: берём первый непустой параграф описания
  let shortUk = "";
  const firstPara = description.match(/^[^\n]+/);
  if (firstPara) shortUk = firstPara[0].trim().slice(0, 400);

  // ---------- картинка ----------
  let image = "";
  const ldImg = Array.isArray(ld?.image)
    ? ld.image[0]
    : typeof ld?.image === "string"
      ? ld.image
      : null;
  const ogImg = s.match(/<meta property="og:image" content="([^"]+)"/);
  const wpImg = s.match(
    /<img[^>]+class="[^"]*wp-post-image[^"]*"[^>]+src="([^"]+)"/
  );
  image = ldImg ?? ogImg?.[1] ?? wpImg?.[1] ?? "";

  // ---------- цена (диапазон) ----------
  let priceLow = null;
  let priceHigh = null;
  const pm = s.match(
    /entry-summary[\s\S]{0,3000}?<p class="price">([\s\S]{0,900}?)<\/p>/
  );
  if (pm) {
    const bdies = [...pm[1].matchAll(/<bdi>([\d.]+)&nbsp;/g)].map((m) =>
      parseFloat(m[1])
    );
    if (bdies.length === 1) priceLow = priceHigh = bdies[0];
    if (bdies.length >= 2) {
      priceLow = Math.min(...bdies);
      priceHigh = Math.max(...bdies);
    }
  }

  // ---------- скидки за количество ----------
  const tiers = [...s.matchAll(
    /<p class="price">\s*Від (\d+) <span[^>]*>шт\.<\/span> - <span class="woocommerce-Price-amount amount"><bdi>([\d.]+)&nbsp;/g
  )].map((m) => ({ qty: parseInt(m[1], 10), price: parseFloat(m[2]) }));

  // ---------- категории ----------
  let postedIn = [];
  const pc = s.match(/posted_in[^>]*>([\s\S]*?)<\/span>/);
  if (pc) {
    postedIn = [...pc[1].matchAll(/>([^<]+)<\/a>/g)].map((x) => x[1].trim());
  }

  // ---------- наличие ----------
  const expected = s.includes("Очікується");

  // ---------- рейтинг и отзывы ----------
  let rating = null;
  let reviewsCount = 0;
  const rCount = s.match(
    /<div class="woocommerce-product-rating">[\s\S]{0,400}?aria-label="(\d+)/
  );
  if (rCount) reviewsCount = parseInt(rCount[1], 10);
  const rAvg =
    s.match(/"ratingValue"\s*:\s*"?([\d.]+)"?/) ||
    s.match(/ rated ([\d.]+) з 5 /);
  if (rAvg) rating = parseFloat(rAvg[1]);

  out.push({
    slug,
    url: f.replace(/__/g, "/"),
    name,
    shortUk,
    description,
    image,
    priceLow,
    priceHigh,
    tiers,
    categories: postedIn,
    expected,
    rating,
    reviewsCount,
  });

  if (!name || priceLow === null) {
    problems.push({ file: f, name: !!name, priceLow: priceLow !== null });
  }
}

out.sort((a, b) => a.slug.localeCompare(b.slug));
fs.writeFileSync(
  "download/site-pages/products.json",
  JSON.stringify(out, null, 2),
  "utf8"
);

console.log(`Parsed: ${out.length}`);
console.log(`With tiers: ${out.filter((p) => p.tiers.length > 0).length}`);
console.log(`Expected (out of stock): ${out.filter((p) => p.expected).length}`);
console.log(
  `Avg description length: ${Math.round(
    out.reduce((a, p) => a + p.description.length, 0) / out.length
  )}`
);
console.log(
  `Short descriptions (<100): ${out.filter((p) => p.description.length < 100).map((p) => p.slug).join(", ") || "none"}`
);
console.log(`Problems: ${problems.length ? JSON.stringify(problems) : "none"}`);
