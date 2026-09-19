/**
 * Seed: наповнює БД поточним контентом сайту.
 * Ідемпотентний: створює лише відсутні записи (update: {}), тому
 * адмінські правки не перетираються при повторному запуску.
 * Запуск: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import { PRODUCTS, CATEGORIES, REVIEWS, FAQ } from "../src/lib/products";
import { PRODUCT_EN, CATEGORY_EN, REVIEWS_EN, FAQ_EN } from "../src/lib/i18n";

const db = new PrismaClient();

/** UI-бейджі з products.ts → канонічні слаги в БД (hit|new|premium|deal) */
const BADGE_SLUG: Record<string, string> = {
  "ХІТ": "hit",
  "NEW": "new",
  "ПРЕМІУМ": "premium",
  "-15%": "deal",
};

const SECTION_KEYS = [
  "nav",
  "hero",
  "ticker",
  "stats",
  "catalog",
  "xl",
  "kits",
  "how",
  "reviews",
  "faq",
  "cta",
  "footer",
  "cart",
] as const;

async function main() {
  // --- Категорії ---
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    if (c.id === "all") continue;
    await db.category.upsert({
      where: { slug: c.id },
      create: {
        slug: c.id,
        nameUk: c.label,
        nameEn: CATEGORY_EN[c.id] ?? c.label,
        sort: i,
      },
      update: {},
    });
  }
  console.log(`✓ categories (active: ${await db.category.count()})`);

  // --- Товари ---
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const en = PRODUCT_EN[p.id];
    await db.product.upsert({
      where: { slug: p.id },
      create: {
        slug: p.id,
        nameUk: p.name,
        nameEn: en?.name ?? p.name,
        shortUk: p.short,
        shortEn: en?.short ?? "",
        portionUk: p.portion,
        portionEn: en?.portion ?? "",
        cats: p.cats.join(","),
        price: p.price,
        oldPrice: p.oldPrice ?? null,
        image: p.img,
        badge: BADGE_SLUG[p.badge ?? ""] ?? null,
        rating: p.rating,
        reviewsCount: p.reviews,
        sort: i,
      },
      update: {},
    });
  }
  console.log(`✓ products (active: ${await db.product.count()})`);

  // --- Відгуки ---
  if ((await db.review.count()) === 0) {
    for (let i = 0; i < REVIEWS.length; i++) {
      const r = REVIEWS[i];
      const en = REVIEWS_EN[i];
      await db.review.create({
        data: {
          author: r.name,
          roleUk: r.role,
          roleEn: en?.role ?? "",
          textUk: r.text,
          textEn: en?.text ?? "",
          rating: r.rating ?? 5,
          sort: i,
        },
      });
    }
  }
  console.log(`✓ reviews (${await db.review.count()})`);

  // --- FAQ ---
  if ((await db.faqItem.count()) === 0) {
    for (let i = 0; i < FAQ.length; i++) {
      const f = FAQ[i];
      const en = FAQ_EN[i];
      await db.faqItem.create({
        data: {
          qUk: f.q,
          qEn: en?.q ?? "",
          aUk: f.a,
          aEn: en?.a ?? "",
          sort: i,
        },
      });
    }
  }
  console.log(`✓ faq (${await db.faqItem.count()})`);

  // --- Секції контенту (порожні override → сайт падає на дефолти STRINGS) ---
  for (const key of SECTION_KEYS) {
    await db.sectionContent.upsert({
      where: { key },
      create: { key, data: "{}", visible: true },
      update: {},
    });
  }
  console.log(`✓ sections (${await db.sectionContent.count()})`);

  // --- Замовлення не чіпаємо (живі CRM-дані) ---
  console.log(`✓ orders (${await db.order.count()}) — не змінено`);

  // --- Демо-розширені картки товарів (опис/характеристики/FAQ), лише якщо ще порожні ---
  const DEMO_PRODUCTS: Record<
    string,
    {
      descriptionUk: string;
      descriptionEn: string;
      specs: string;
      productFaq: string;
    }
  > = {
    "harcho-xl": {
      descriptionUk:
        "Харчо грузинський XL з куркою — це подвійна порція наваристої гострої страви, звареної за класичним рецептом грузинської кухні. Соковите мʼясо курки, розсипчастий рис, томати та букет пряних спецій (хмелі-сунелі, коріандр, чорний перець) створюють той самий смак, що й у ресторані Тбілісі — тільки у вашому рюкзаку.\n\nСублимація зберігає до 98% смаку, аромату та вітамінів: страву готують, а потім мʼяко заморожують у вакуумі, видаляючи до 95% вологи. Тож у пакеті — лише натуралЬні інгредієнти без консервантів та підсилювачів смаку.",
      descriptionEn:
        "Georgian kharcho XL with chicken is a double portion of rich, spicy soup cooked to a classic Georgian recipe. Juicy chicken, fluffy rice, tomatoes and a bouquet of spices (khmeli-suneli, coriander, black pepper) deliver a Tbilisi-restaurant taste — right in your backpack.\n\nFreeze-drying preserves up to 98% of taste, aroma and vitamins: the dish is cooked and then gently freeze-dried in vacuum, removing up to 95% of moisture. Only natural ingredients — no preservatives or flavor enhancers.",
      specs: JSON.stringify([
        { labelUk: "Вага готової страви", valueUk: "500 г", labelEn: "Prepared weight", valueEn: "500 g" },
        { labelUk: "Суха вага пакета", valueUk: "95 г", labelEn: "Dry package weight", valueEn: "95 g" },
        { labelUk: "Час приготування", valueUk: "10 хвилин", labelEn: "Cooking time", valueEn: "10 minutes" },
        { labelUk: "Калорійність порції", valueUk: "610 ккал", labelEn: "Calories per serving", valueEn: "610 kcal" },
        { labelUk: "Термін зберігання", valueUk: "12 місяців", labelEn: "Shelf life", valueEn: "12 months" },
        { labelUk: "Білки/жири/вуглеводи", valueUk: "24/18/68 г", labelEn: "Protein/fat/carbs", valueEn: "24/18/68 g" },
        { labelUk: "Склад", valueUk: "рис, курка, томати, цибуля, спеції", labelEn: "Ingredients", valueEn: "rice, chicken, tomatoes, onion, spices" },
      ]),
      productFaq: JSON.stringify([
        {
          qUk: "Скільки води потрібно для XL-порції?",
          aUk: "Для подвійної порції XL потрібно 600–700 мл окропу — до позначки на внутрішній лінії пакета.",
          qEn: "How much water does the XL portion need?",
          aEn: "A double XL portion needs 600–700 ml of boiling water — up to the inner line of the package.",
        },
        {
          qUk: "Наскільки гострий цей харчо?",
          aUk: "Помірно гострий за класичним грузинським рецептом. Гостроту легко регулювати кількістю води та додаванням сметани.",
          qEn: "How spicy is this kharcho?",
          aEn: "Moderately spicy, classic Georgian style. You can adjust heat with more water or a spoon of sour cream.",
        },
        {
          qUk: "Чи можна їсти холодним?",
          aUk: "Так, страва безпечна й без приготування, але найсмачніша — гарячою, як задумано рецептом.",
          qEn: "Can I eat it cold?",
          aEn: "Yes, it is safe without cooking, but it tastes best hot, as the recipe intends.",
        },
      ]),
    },
    "borshch-xl": {
      descriptionUk:
        "Борщ український XL з куркою — густий, насичений, зі справжньою буряковою основою, капустою, картоплею та смаком, як у бабусі на селі. Подвійна порція 500 г ситно нагодує навіть після довгого переходу.\n\nМи відтворили класичний рецепт: зажарка, лавровий лист, зелень і, звісно, ложка сметани за бажанням. Готується за 10 хвилин з окропом — прямо в пакеті, без брудного посуду.",
      descriptionEn:
        "Ukrainian borsch XL with chicken — thick and rich with a real beet base, cabbage, potatoes and that grandma-from-the-village taste. A double 500 g portion satisfies even after a long hike.\n\nWe recreated the classic recipe: sautéed vegetables, bay leaf, herbs and — optionally — a spoonful of sour cream. Ready in 10 minutes with boiling water, right in the pack, no dirty dishes.",
      specs: JSON.stringify([
        { labelUk: "Вага готової страви", valueUk: "500 г", labelEn: "Prepared weight", valueEn: "500 g" },
        { labelUk: "Суха вага пакета", valueUk: "90 г", labelEn: "Dry package weight", valueEn: "90 g" },
        { labelUk: "Час приготування", valueUk: "10 хвилин", labelEn: "Cooking time", valueEn: "10 minutes" },
        { labelUk: "Калорійність порції", valueUk: "540 ккал", labelEn: "Calories per serving", valueEn: "540 kcal" },
        { labelUk: "Термін зберігання", valueUk: "12 місяців", labelEn: "Shelf life", valueEn: "12 months" },
        { labelUk: "Склад", valueUk: "буряк, капуста, картопля, курка, морква, спеції", labelEn: "Ingredients", valueEn: "beet, cabbage, potato, chicken, carrot, spices" },
      ]),
      productFaq: JSON.stringify([
        {
          qUk: "Чи справжній це борщ, чи «хімія»?",
          aUk: "Це справжня страва, приготована швидким заморожуванням з вакуумним сушінням. У складі — лише овочі, курка та спеції, без консервантів.",
          qEn: "Is it real borsch or chemicals?",
          aEn: "It is a real dish, cooked and freeze-dried. The ingredients are only vegetables, chicken and spices — no preservatives.",
        },
        {
          qUk: "Що краще брати в похід — XL чи звичайний?",
          aUk: "XL — подвійна порція для великого апетиту або на двох. Звичайний — на один прийом їжі. На день походу беріть 1 XL або 2 звичайні.",
          qEn: "For a hike — XL or regular?",
          aEn: "XL is a double portion for a big appetite or for two. Regular fits one meal. For a hiking day take 1 XL or 2 regular packs.",
        },
      ]),
    },
  };

  for (const [slug, extra] of Object.entries(DEMO_PRODUCTS)) {
    await db.product.updateMany({
      where: { slug, descriptionUk: "" },
      data: extra,
    });
  }
  console.log("✓ demo product descriptions/specs/faq (якщо були порожні)");

  // --- Реалістичні відгуки про товари (лише якщо ще немає жодного товарного відгуку) ---
  if ((await db.review.count({ where: { productSlug: { not: null } } })) === 0) {
    const PRODUCT_REVIEWS = [
      {
        productSlug: "harcho-xl",
        author: "Олег",
        textUk:
          "Брав у триденний похід на Карпати — харчо з куркою просто знахідка. Густий, мʼясо відчутне, рис розсипчастий. Готується рівно 10 хв, як і обіцяють.",
        rating: 5,
        sort: 1001,
      },
      {
        productSlug: "harcho-xl",
        author: "Марічка",
        textUk:
          "Порція справді подвійна, вистачило на двох. Трохи гострувато для мене, але з ложкою сметани — ідеально. Замовимо ще.",
        rating: 4,
        sort: 1002,
      },
      {
        productSlug: "borshch-xl",
        author: "Андрій",
        textUk:
          "Не вірив, що сублімат може смакувати як домашній борщ. Смак багатий, буряк відчувається, зелень свіжа. XL-порція ситна.",
        rating: 5,
        sort: 1003,
      },
    ];
    for (const r of PRODUCT_REVIEWS) await db.review.create({ data: r });
  }
  console.log("✓ product reviews");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
