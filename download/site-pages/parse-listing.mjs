// Парсер листингов категорий (li.product блоки) → listing.json
// Даёт: точные цены, tiers, expected, картинку для каждого из 41 товара.
import fs from "fs";

function parseListing(file) {
  let s = fs.readFileSync(file, "utf8");
  // Вырезаем сайдбар с виджетами (Top-5, отзывы и т.д.) — он идёт после последнего товара
  // и содержит вложенные <li>, ломающие блочный парсинг
  const widgetIdx = s.search(/Top-5 продуктів|product_list_widget/);
  if (widgetIdx !== -1) {
    const containerStart = s.lastIndexOf("<section", widgetIdx);
    s = s.slice(0, containerStart);
  }
  const positions = [];
  const re = /<li class="[^"]*\bproduct\b[^"]*"/g;
  let m;
  while ((m = re.exec(s))) positions.push(m.index);
  positions.push(s.length);

  const items = [];
  for (let i = 0; i < positions.length - 1; i++) {
    let block = s.slice(positions[i], positions[i + 1]);
    // обрезаем блок до конца собственного </li> — иначе хвост захватывает соседей
    const liEnd = block.lastIndexOf("</li>");
    if (liEnd !== -1) block = block.slice(0, liEnd);
    const title = (block.match(/woocommerce-loop-product__title">([^<]+)</) || [])[1];
    if (!title) continue;

    const prices = [
      ...block.matchAll(/([\d.]+)&nbsp;<span class="woocommerce-Price-currencySymbol/g),
    ].map((x) => parseFloat(x[1]));
    const tiers = [
      ...block.matchAll(
        /Від (\d+) <span[^>]*>шт\.<\/span> - <span class="woocommerce-Price-amount amount"><bdi>([\d.]+)&nbsp;/g
      ),
    ].map((x) => ({ qty: +x[1], price: +x[2] }));

    // картинка (первый img с src в блоке)
    const imgM =
      block.match(/data-large-file="([^"]+)"/) ||
      block.match(/ src="([^"]+uploads[^"]+?)"/) ||
      block.match(/src="(https:[^"]+\.(?:png|jpg|jpeg|webp))"/);
    let img = imgM?.[1] ?? "";
    if (img.includes("-300x300") || img.includes("-100x100")) img = img.replace(/-\d+x\d+(?=\.\w+$)/, "");
    if (img.startsWith("//")) img = "https:" + img;

    // ссылка товара
    const link = (block.match(/href="(https:\/\/harchifood\.com\/shop\/[^"]+)"/) || [])[1] ?? "";

    items.push({
      title: title.trim(),
      link,
      priceLow: prices.length ? Math.min(...prices) : null,
      priceHigh: prices.length ? Math.max(...prices) : null,
      tiers,
      expected: block.includes("Очікується"),
      img,
    });
  }
  return items;
}

const all = [
  ...parseListing("download/site-pages/cat1.html"),
  ...parseListing("download/site-pages/cat2.html"),
];
fs.writeFileSync("download/site-pages/listing.json", JSON.stringify(all, null, 2));
console.log(`listing items: ${all.length}`);
console.log(`with tiers: ${all.filter((x) => x.tiers.length).length}`);
console.log(`expected: ${all.filter((x) => x.expected).length}`);
