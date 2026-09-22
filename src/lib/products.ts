export type Category =
  | "xl"
  | "sub"
  | "pershi"
  | "drugi"
  | "snidanki"
  | "sneky"
  | "napoi";

/** Оптовий рівень ціни: від minQty штук — ціна price за штуку. */
export interface BulkTier {
  minQty: number;
  price: number;
}

/** Рядок характеристики товару (з БД Product.specs, JSON) */
export interface ProductSpec {
  labelUk: string;
  valueUk: string;
  labelEn?: string;
  valueEn?: string;
}

/** Питання-відповідь про товар (з БД Product.productFaq, JSON) */
export interface ProductFaqItem {
  qUk: string;
  aUk: string;
  qEn?: string;
  aEn?: string;
}

export interface Product {
  id: string;
  name: string;
  short: string;
  price: number;
  oldPrice?: number;
  img: string;
  cats: Category[];
  badge?: "ХІТ" | "NEW" | "ПРЕМІУМ" | "-15%";
  rating: number;
  reviews: number;
  portion: string;
  /** EN-варіанти (з БД); якщо немає — fallback на PRODUCT_EN з i18n */
  nameEn?: string;
  shortEn?: string;
  portionEn?: string;
  /** Повний опис товару (з БД); якщо порожній — авто-фолбек на сторінці товару */
  descriptionUk?: string;
  descriptionEn?: string;
  /** Калорійність порції, ккал (якщо відома) */
  kcal?: number;
  /** Вага пакета, г (якщо відома) */
  weight?: number;
  /** Оптові скидки (з БД Product.bulkTiers, JSON-рядок → розпарсено defensivly).
   *  [{minQty, price}] — ціна за штуку діє, коли в кошику >= minQty цього товару. */
  bulkTiers?: BulkTier[];
  /** Характеристики (з БД Product.specs, JSON-рядок → розпарсено defensivly) */
  specs?: ProductSpec[];
  /** Q/A про товар (з БД Product.productFaq, JSON-рядок → розпарсено defensivly) */
  productFaq?: ProductFaqItem[];
}

export interface CategoryDef {
  id: Category | "all";
  label: string;
  /** EN-лейбл (з БД); якщо немає — fallback на CATEGORY_EN з i18n */
  labelEn?: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: "all", label: "Усі товари" },
  { id: "xl", label: "Харчі XL" },
  { id: "sub", label: "100% Сублімати" },
  { id: "pershi", label: "Перші страви" },
  { id: "drugi", label: "Другі страви" },
  { id: "snidanki", label: "Сніданки" },
  { id: "sneky", label: "Снеки" },
  { id: "napoi", label: "Напої" },
];

export const PRODUCTS: Product[] = [
  // ---------- ХАРЧІ XL ----------
  {
    id: "harcho-xl",
    name: "Харчо грузинський XL з куркою",
    short: "Гострий, наваристий, з рисом і пряними спеціями. Подвійна порція.",
    price: 229,
    oldPrice: 259,
    img: "/products/harcho-xl.png",
    cats: ["xl", "pershi"],
    badge: "ХІТ",
    rating: 4.9,
    reviews: 34,
    portion: "500 г готової страви",
  },
  {
    id: "borshch-xl",
    name: "Борщ український XL з куркою",
    short: "Густий, насичений, як у бабусі. Тільки готується за 10 хвилин.",
    price: 229,
    img: "/products/borshch-xl.png",
    cats: ["xl", "pershi"],
    badge: "ХІТ",
    rating: 5.0,
    reviews: 41,
    portion: "500 г готової страви",
  },
  {
    id: "plov-xl",
    name: "Плов узбецький XL з куркою",
    short: "Розсипчастий рис, соковите м'ясо, солодка морква.",
    price: 229,
    img: "/products/plov-xl.png",
    cats: ["xl", "drugi"],
    rating: 4.9,
    reviews: 27,
    portion: "500 г готової страви",
  },
  {
    id: "miso-xl",
    name: "Місо японський XL з креветками та тофу",
    short: "Смак Токіо десь між гір. Креветки, тофу, водорості.",
    price: 299,
    img: "/products/miso-xl.png",
    cats: ["xl", "pershi", "sub"],
    badge: "NEW",
    rating: 4.8,
    reviews: 12,
    portion: "500 г готової страви",
  },
  {
    id: "tomyam-xl",
    name: "Том Ям Кунг тайський XL з креветками",
    short: "Гарячий тайський вибух смаку. Кисло-гострий, з кокосом.",
    price: 299,
    img: "/products/tomyam-xl.png",
    cats: ["xl", "pershi"],
    badge: "NEW",
    rating: 4.9,
    reviews: 18,
    portion: "500 г готової страви",
  },
  {
    id: "pasta-shrimp-xl",
    name: "Паста італійська XL з креветками",
    short: "Ніжний вершковий соус і великі креветки. Ресторан у пакеті.",
    price: 299,
    img: "/products/pasta-shrimp-xl.png",
    cats: ["xl", "drugi"],
    badge: "ПРЕМІУМ",
    rating: 5.0,
    reviews: 9,
    portion: "500 г готової страви",
  },
  {
    id: "kuskus-xl",
    name: "Кускус марокканський XL зі свининою",
    short: "Східні спеції, овочі та ситна крупа.",
    price: 149,
    img: "/products/kuskus-xl.png",
    cats: ["xl", "drugi"],
    rating: 4.7,
    reviews: 11,
    portion: "500 г готової страви",
  },
  {
    id: "gribnoy-xl",
    name: "Грибний крем-суп французький XL",
    short: "Печериці, вершковий смак і хрусткі грінки.",
    price: 149,
    img: "/products/gribnoy-xl.png",
    cats: ["xl", "pershi"],
    rating: 4.8,
    reviews: 15,
    portion: "500 г готової страви",
  },
  {
    id: "grechka-xl",
    name: "Гречка українська XL зі свининою",
    short: "Класика, що гріє душу. Багато м'яса та овочів.",
    price: 149,
    img: "/products/grechka-xl.png",
    cats: ["xl", "drugi"],
    rating: 4.9,
    reviews: 22,
    portion: "500 г готової страви",
  },
  {
    id: "kartoplya-xl",
    name: "Картопля українська XL зі свининою",
    short: "Навариста картопля з м'ясом — вдома навіть у горах.",
    price: 149,
    img: "/products/kartoplya-xl.png",
    cats: ["xl", "drugi"],
    rating: 4.8,
    reviews: 13,
    portion: "500 г готової страви",
  },

  // ---------- 100% СУБЛІМАТИ ----------
  {
    id: "harcho-sub",
    name: "Суп «Харчо» з телятиною · 100% Сублімат",
    short: "Телятина, солодкий і гострий перець. Технологія сублімації 100%.",
    price: 189,
    img: "/products/harcho-sub.png",
    cats: ["sub", "pershi"],
    badge: "ХІТ",
    rating: 5.0,
    reviews: 6,
    portion: "велика порція",
  },
  {
    id: "tomyam-sub",
    name: "Том Ям Кунг · 100% Сублімат",
    short: "Тайський суп з креветками без компромісів.",
    price: 249,
    img: "/products/tomyam-sub.png",
    cats: ["sub", "pershi"],
    badge: "ПРЕМІУМ",
    rating: 5.0,
    reviews: 3,
    portion: "велика порція",
  },
  {
    id: "indychka-sub",
    name: "Індичка у вершково-грибному соусі · Сублімат",
    short: "Ніжна індичка з грибами. Мінімум ваги — максимум смаку.",
    price: 189,
    img: "/products/indychka-sub.png",
    cats: ["sub", "drugi"],
    rating: 5.0,
    reviews: 4,
    portion: "велика порція",
  },

  // ---------- КЛАСИКА ----------
  {
    id: "plov-basmati",
    name: "Плов з рисом «Басматі» з куркою",
    short: "Багато рису, курка та солодка морква.",
    price: 189,
    img: "/products/plov-basmati.png",
    cats: ["drugi"],
    rating: 4.9,
    reviews: 16,
    portion: "ситна порція",
  },
  {
    id: "gorohovyj",
    name: "Суп гороховий зі свининою",
    short: "Народний улюбленець. Густий, з копченим смаком.",
    price: 120,
    img: "/products/gorohovyj.png",
    cats: ["pershi"],
    badge: "ХІТ",
    rating: 5.0,
    reviews: 9,
    portion: "ситна порція",
  },
  {
    id: "pecherytsi",
    name: "Суп-пюре з печериць",
    short: "Шовковиста текстура, аромат грибів на кістці.",
    price: 120,
    img: "/products/pecherytsi.png",
    cats: ["pershi"],
    rating: 5.0,
    reviews: 2,
    portion: "ситна порція",
  },
  {
    id: "borshch",
    name: "Борщ зі свининою",
    short: "Густий насичений овочевий смак із соковитим м'ясом.",
    price: 120,
    img: "/products/borshch.png",
    cats: ["pershi"],
    rating: 4.8,
    reviews: 8,
    portion: "ситна порція",
  },
  {
    id: "grechka",
    name: "Гречка зі свининою та овочами",
    short: "Знайома з дитинства. Тепла, ситна, своя.",
    price: 120,
    img: "/products/grechka.png",
    cats: ["drugi"],
    rating: 5.0,
    reviews: 7,
    portion: "ситна порція",
  },

  // ---------- СНІДАНКИ ----------
  {
    id: "kasha-banana",
    name: "Каша бананова з фруктами",
    short: "Солодкий ранок у горах. Банан, фрукти, енергія.",
    price: 110,
    img: "/products/kasha-banana.png",
    cats: ["snidanki"],
    badge: "ХІТ",
    rating: 5.0,
    reviews: 7,
    portion: "сніданок-енергетик",
  },
  {
    id: "chia-choco",
    name: "Чіа-пудинг шоколадний",
    short: "Десерт на сніданок. Шоколад + чіа + користь.",
    price: 90,
    img: "/products/chia-choco.png",
    cats: ["snidanki"],
    badge: "NEW",
    rating: 5.0,
    reviews: 5,
    portion: "сніданок-енергетик",
  },

  // ---------- СНЕКИ ----------
  {
    id: "bar-prune",
    name: "Батончик вівсяний з чорносливом",
    short: "Швидка енергія на привалі. Тільки натуральне.",
    price: 35,
    img: "/products/bar-prune.png",
    cats: ["sneky"],
    rating: 5.0,
    reviews: 3,
    portion: "40 г",
  },

  // ---------- НАПОЇ ----------
  {
    id: "napij-oblipikha",
    name: "Обліпиховий напій",
    short: "Сонце в чашці. Зігріває та вітамінить.",
    price: 35,
    img: "/products/napij-oblipikha.png",
    cats: ["napoi"],
    rating: 5.0,
    reviews: 1,
    portion: "гаряча чашка",
  },
  {
    id: "coffee-drip",
    name: "Кава арабіка в дріп-пакеті",
    short: "100% ефіопська арабіка. Ранок без компромісів.",
    price: 50,
    img: "/products/coffee-drip.png",
    cats: ["napoi"],
    badge: "ХІТ",
    rating: 4.9,
    reviews: 4,
    portion: "1 чашка",
  },
];

export const formatPrice = (v: number) =>
  `${v.toFixed(0)} грн`;

/** Ціна за штуку з урахуванням оптових рівнів [{minQty, price}] і кількості. */
export function bulkUnitPrice(base: number, tiers: BulkTier[] | undefined, qty: number): number {
  if (!tiers?.length || qty <= 0) return base;
  let best = base;
  for (const t of tiers) {
    if (Number.isFinite(t.minQty) && Number.isFinite(t.price) && qty >= t.minQty && t.price > 0 && t.price < best) {
      best = t.price;
    }
  }
  return best;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  img: string;
  qty: number;
  /** Роздрібна ціна за шт. (база для перерахунку оптових рівнів при зміні qty). */
  basePrice?: number;
}

export const REVIEWS = [
  {
    name: "Оксана",
    role: "дружина військового",
    text: "Брала чоловіку військовому 24 позиції різних страв. Він дуже задоволений. Все смачно. Замовляти будемо ще. Я спокійна, що він не голодний і смачно їсть. Дякую вам!",
    rating: 5,
  },
  {
    name: "Андрій",
    role: "похід на Говерлу",
    text: "Брали Харчі XL у триденний похід. Вечорами гарячий борщ у горах — це безцін. Вариться реально 10 хв, порція велика.",
    rating: 5,
  },
  {
    name: "Марина",
    role: "рибалка-фанат",
    text: "Гороховий суп із копченостями — топ! Тепер це наш ритуал на кожній рибалці. Доставка швидка, все акуратно запаковано.",
    rating: 5,
  },
  {
    name: "Тарас",
    role: "турист-одиночка",
    text: "Том Ям з креветками на висоті 1800 м — відчуття, ніби в Тайланді. Вага мінімальна, смак приголомшливий.",
    rating: 5,
  },
  {
    name: "Ірина",
    role: "мама скаута",
    text: "Сину дуже сподобались сніданки та батончики. Дякую, що дбаєте про якість. Чіа-пудинг — його улюблений!",
    rating: 5,
  },
  {
    name: "Влад",
    role: "сплав по Дністру",
    text: "Кускус і плов брали на сплав. Ситно, смачно, не примружишся. Ціна/якість — супер. Рекомендую всім активним.",
    rating: 5,
  },
];

export const FAQ = [
  {
    q: "Що таке сублімат і чому це смачно?",
    a: "Сублимація — це м'яке заморожування з вакуумним висушуванням: продукти втрачають до 95% ваги, але зберігають до 98% смаку, аромату та вітамінів. Залишається лише додати окріп — і через 10 хвилин у вас повноцінна гаряча страва.",
  },
  {
    q: "Як приготувати страву Харчі?",
    a: "Все просто: відкрийте пакет, залийте вміст 350–400 мл окропу (для XL — до лінії), перемішайте, зачекайте 8–10 хвилин. Їсти можна прямо з пакета — посуд не потрібен.",
  },
  {
    q: "Скільки зберігається їжа?",
    a: "Сублімовані страви зберігаються до 12 місяців без холодильника, витримують мороз і спеку — ідеально для ПХД, похідних умов і довгих зберігань у рюкзаку чи машини.",
  },
  {
    q: "Чим відрізняється лінійка Харчі XL?",
    a: "XL — це подвійна порція для великого апетиту: 500 г готової страви. Створена для тих, хто багато рухається: туристи, військові, рибалки, мисливці.",
  },
  {
    q: "Як відбувається доставка?",
    a: "Відправляємо Новою Поштою та Укрпоштою по всій Україні, а також самовивіз. Замовлення оформлюється за 2 хвилини на сайті — менеджер зв'яжеться для підтвердження.",
  },
];
