import type { Category, Product } from "./products";

export type Lang = "uk" | "en";

/* ------------------------------------------------------------------ */
/* EN data for products / categories / reviews / faq                   */
/* ------------------------------------------------------------------ */

export const PRODUCT_EN: Record<
  string,
  { name: string; short: string; portion: string }
> = {
  "harcho-xl": {
    name: "Kharcho Georgian XL with Chicken",
    short: "Spicy, rich, with rice and aromatic spices. Double portion.",
    portion: "500 g ready meal",
  },
  "borshch-xl": {
    name: "Ukrainian Borsch XL with Chicken",
    short: "Thick and rich, just like grandma's. Ready in 10 minutes.",
    portion: "500 g ready meal",
  },
  "plov-xl": {
    name: "Uzbek Plov XL with Chicken",
    short: "Fluffy rice, juicy meat, sweet carrot.",
    portion: "500 g ready meal",
  },
  "miso-xl": {
    name: "Japanese Miso XL with Shrimp & Tofu",
    short: "A taste of Tokyo somewhere in the mountains.",
    portion: "500 g ready meal",
  },
  "tomyam-xl": {
    name: "Thai Tom Yum Kung XL with Shrimp",
    short: "A hot Thai flavor explosion. Sour, spicy, coconut.",
    portion: "500 g ready meal",
  },
  "pasta-shrimp-xl": {
    name: "Italian Pasta XL with Shrimp",
    short: "Silky cream sauce and large shrimp. Restaurant in a pouch.",
    portion: "500 g ready meal",
  },
  "kuskus-xl": {
    name: "Moroccan Couscous XL with Pork",
    short: "Eastern spices, vegetables and hearty grains.",
    portion: "500 g ready meal",
  },
  "gribnoy-xl": {
    name: "French Mushroom Cream Soup XL",
    short: "Champignons, creamy taste and crispy croutons.",
    portion: "500 g ready meal",
  },
  "grechka-xl": {
    name: "Ukrainian Buckwheat XL with Pork",
    short: "A classic that warms the soul. Lots of meat and veggies.",
    portion: "500 g ready meal",
  },
  "kartoplya-xl": {
    name: "Ukrainian Potato XL with Pork",
    short: "Hearty potato with meat — home even in the mountains.",
    portion: "500 g ready meal",
  },
  "harcho-sub": {
    name: "Kharcho Soup with Beef · Freeze-Dried",
    short: "Beef, sweet and hot peppers. 100% freeze-dried tech.",
    portion: "large portion",
  },
  "tomyam-sub": {
    name: "Tom Yum Kung · Freeze-Dried",
    short: "Thai shrimp soup with no compromises.",
    portion: "large portion",
  },
  "indychka-sub": {
    name: "Turkey in Creamy Mushroom Sauce · Freeze-Dried",
    short: "Tender turkey with mushrooms. Min weight — max flavor.",
    portion: "large portion",
  },
  "plov-basmati": {
    name: "Basmati Rice Plov with Chicken",
    short: "Lots of rice, chicken and sweet carrot.",
    portion: "hearty portion",
  },
  gorohovyj: {
    name: "Pea Soup with Pork",
    short: "A people's favorite. Thick, with a smoky note.",
    portion: "hearty portion",
  },
  pecherytsi: {
    name: "Champignon Cream Soup",
    short: "Silky texture, rich mushroom aroma.",
    portion: "hearty portion",
  },
  borshch: {
    name: "Borsch with Pork",
    short: "Dense vegetable depth with juicy meat.",
    portion: "hearty portion",
  },
  grechka: {
    name: "Buckwheat with Pork & Vegetables",
    short: "Familiar since childhood. Warm, hearty, yours.",
    portion: "hearty portion",
  },
  "kasha-banana": {
    name: "Banana Porridge with Fruits",
    short: "A sweet morning in the mountains. Banana, fruit, energy.",
    portion: "energy breakfast",
  },
  "chia-choco": {
    name: "Chocolate Chia Pudding",
    short: "Dessert for breakfast. Chocolate + chia + goodness.",
    portion: "energy breakfast",
  },
  "bar-prune": {
    name: "Oat Bar with Prunes",
    short: "Quick energy at a rest stop. All natural.",
    portion: "40 g",
  },
  "napij-oblipikha": {
    name: "Sea Buckthorn Drink",
    short: "Sunshine in a cup. Warming, full of vitamins.",
    portion: "hot cup",
  },
  "coffee-drip": {
    name: "Arabica Drip Coffee Bag",
    short: "100% Ethiopian arabica. Mornings without compromise.",
    portion: "1 cup",
  },
};

export const productByLang = (
  p: Product,
  lang: Lang
): { name: string; short: string; portion: string } => {
  if (lang !== "en") return { name: p.name, short: p.short, portion: p.portion };
  const en = PRODUCT_EN[p.id];
  return {
    name: p.nameEn ?? en?.name ?? p.name,
    short: p.shortEn ?? en?.short ?? p.short,
    portion: p.portionEn ?? en?.portion ?? p.portion,
  };
};

export const CATEGORY_EN: Record<string, string> = {
  all: "All products",
  xl: "Kharchi XL",
  sub: "100% Freeze-Dried",
  pershi: "Soups",
  drugi: "Main dishes",
  snidanki: "Breakfasts",
  sneky: "Snacks",
  napoi: "Drinks",
};

export const REVIEWS_EN = [
  {
    name: "Oksana",
    role: "soldier's wife",
    text: "I bought 24 different meals for my husband in the military. He loves them all. Everything is delicious. We will order again. I'm calm knowing he's not hungry and eats well. Thank you!",
  },
  {
    name: "Andrii",
    role: "Hoverla trek",
    text: "Took Kharchi XL on a three-day hike. Hot borsch in the mountains in the evening — priceless. It really cooks in 10 min, and the portion is huge.",
  },
  {
    name: "Maryna",
    role: "fishing fan",
    text: "Pea soup with smoked meat is top! It's our ritual on every fishing trip now. Fast delivery, everything packed neatly.",
  },
  {
    name: "Taras",
    role: "solo trekker",
    text: "Tom Yum with shrimp at 1,800 m — feels like Thailand. Minimal weight, incredible taste.",
  },
  {
    name: "Iryna",
    role: "scout mom",
    text: "My son loved the breakfasts and bars. Thank you for caring about quality. The chia pudding is his favorite!",
  },
  {
    name: "Vlad",
    role: "Dnister rafting",
    text: "Took couscous and plov rafting. Filling, tasty, no fuss. Price/quality is superb. Recommend to all active folks.",
  },
];

export const FAQ_EN = [
  {
    q: "What is freeze-drying and why is it so tasty?",
    a: "Freeze-drying is gentle freezing combined with vacuum drying: food loses up to 95% of its weight but keeps up to 98% of its flavor, aroma and vitamins. Just add boiling water — and in 10 minutes you have a full hot meal.",
  },
  {
    q: "How do I prepare a Kharchi meal?",
    a: "It's simple: open the pouch, pour in 350–400 ml of boiling water (for XL — up to the line), stir, wait 8–10 minutes. You can eat right out of the pouch — no dishes needed.",
  },
  {
    q: "How long does the food keep?",
    a: "Freeze-dried meals keep for up to 12 months without a fridge and withstand frost and heat — perfect for field rations, hiking conditions and long storage in a backpack or car.",
  },
  {
    q: "How is the Kharchi XL line different?",
    a: "XL is a double portion for a big appetite: 500 g of ready meal. Made for those who move a lot: hikers, soldiers, anglers, hunters.",
  },
  {
    q: "How does delivery work?",
    a: "We ship via Nova Poshta and Ukrposhta across Ukraine, plus pickup options. Ordering takes 2 minutes on the website — our manager will call you to confirm.",
  },
];

/* ------------------------------------------------------------------ */
/* UI strings                                                          */
/* ------------------------------------------------------------------ */

export interface UIStrings {
  nav: {
    catalog: string;
    kits: string;
    how: string;
    reviews: string;
    faq: string;
    cart: string;
    menu: string;
  };
  hero: {
    badge: string;
    h1a: string;
    h1b: string;
    p: string;
    pAccent: string;
    cta: string;
    how: string;
    chips: string[];
  };
  ticker: string[];
  stats: string[];
  catalog: {
    label: string;
    h2a: string;
    h2b: string;
    p: string;
  };
  productCard: {
    deal: string;
    added: string;
    addedDesc: string;
    addAria: string;
    /** "Від {qty} шт. — {price}" (рядки оптових рівнів на картці). */
    bulkFrom: string;
  };
  /** Рядки сторінки товару (Task 6.4) */
  productPage: {
    home: string;
    category: string;
    addToCart: string;
    qty: string;
    save: string;
    portion: string;
    ready: string;
    shelf: string;
    kcal: string;
    net: string;
    reviewsCount: string;
    description: string;
    specs: string;
    faq: string;
    reviews: string;
    recommendations: string;
    avgRating: string;
    beFirst: string;
    formTitle: string;
    formName: string;
    formNamePh: string;
    formRating: string;
    formText: string;
    formTextPh: string;
    submit: string;
    sending: string;
    thanks: string;
    errName: string;
    errRating: string;
    errText: string;
    errConnection: string;
    /** "Оптом дешевше" (заголовок блоку оптових рівнів на сторінці товару). */
    bulkTitle: string;
  };
  badge: Record<string, string>;
  kits: {
    label: string;
    h2a: string;
    h2b: string;
    p: string;
    fromPrice: string;
    perBundle: string;
    save: string;
    items: string;
    kcal: string;
    cta: string;
    added: string;
    addedDesc: string;
    imgAlt: string;
    featureTitle: string;
    featureText: string;
    featurePoint1: string;
    featurePoint2: string;
    featurePoint3: string;
  };
  how: {
    label: string;
    h2a: string;
    h2b: string;
    steps: { title: string; text: string }[];
  };
  xl: {
    badge: string;
    h2sub: string;
    p: string;
    cta: string;
    link: string;
  };
  reviews: {
    label: string;
    h2a: string;
    h2b: string;
    p: string;
  };
  faq: { label: string; h2a: string; h2b: string };
  cta: { h2a: string; h2b: string; p: string; button: string };
  footer: {
    links: string[];
    rights: string;
    concept: string;
  };
  cart: {
    title: string;
    count: string;
    descCart: string;
    descCheckout: string;
    descSuccess: string;
    empty: string;
    emptyHint: string;
    browse: string;
    remove: string;
    minus: string;
    plus: string;
    total: string;
    checkout: string;
    note: string;
    name: string;
    phone: string;
    delivery: string;
    deliveryPlaceholder: string;
    city: string;
    address: string;
    addressCourier: string;
    branch: string;
    comment: string;
    commentPlaceholder: string;
    back: string;
    confirm: string;
    sending: string;
    success: string;
    successTitle: string;
    orderNo: string;
    successText: string;
    thanks: string;
    errName: string;
    errPhone: string;
    errDelivery: string;
    errConnection: string;
    errGeneric: string;
    deliveryOptions: string[];
    cityPlaceholder: string;
  };
  toast: {
    error: string;
    success: string;
  };
  theme: { toLight: string; toDark: string };
  langToggle: string;
}

export const STRINGS: Record<Lang, UIStrings> = {
  uk: {
    nav: {
      catalog: "Каталог",
      kits: "Набори ПХД",
      how: "Як готується",
      reviews: "Відгуки",
      faq: "Питання",
      cart: "Кошик",
      menu: "Меню",
    },
    hero: {
      badge: "Перший український магазин субліматів",
      h1a: "Гаряча їжа",
      h1b: "там, де ти",
      p: "Сублімовані борщі, плови та паста — смак домашньої кухні у поході, на рибалці чи на позиції.",
      pAccent: "Окріп, 10 хвилин — і готово.",
      cta: "Обрати смаколик",
      how: "Як це працює",
      chips: ["Готово за 10 хв", "Витримує мороз і спеку", "До 98% смаку збережено"],
    },
    ticker: [
      "Гаряча їжа там, де ти",
      "Готово за 10 хвилин",
      "Створено для походів та ПХД",
      "Без холодильника до 12 міс",
      "Оцінка 4.9 з 5",
    ],
    stats: ["позицій у меню", "і страва готова", "смаку зберігається", "року на ринку"],
    catalog: {
      label: "Меню",
      h2a: "Обери свою ",
      h2b: " смачну",
      p: "Від класичного борщу до тайського тому яму — усе готується з окропом за 10 хвилин. Подвійні порції XL — для великого апетиту.",
    },
    productCard: {
      deal: "вигідно",
      added: "Додано в кошик",
      addedDesc: "",
      addAria: "Додати {name} в кошик",
      bulkFrom: "Від {qty} шт. — {price}",
    },
    productPage: {
      home: "Головна",
      category: "Каталог",
      addToCart: "Додати в кошик",
      qty: "Кількість",
      save: "економія",
      portion: "Порція",
      ready: "Готово за 10 хв",
      shelf: "Без холодильника до 12 міс",
      kcal: "ккал / порція",
      net: "вага пакета",
      reviewsCount: "відгуків",
      description: "Опис",
      specs: "Характеристики",
      faq: "Питання про товар",
      reviews: "Відгуки",
      recommendations: "З цим часто беруть",
      avgRating: "середня оцінка",
      beFirst: "Ще немає відгуків — будьте першим!",
      formTitle: "Залишити відгук",
      formName: "Ім'я",
      formNamePh: "Як до вас звертатись?",
      formRating: "Ваша оцінка",
      formText: "Ваш відгук",
      formTextPh: "Розкажіть, як вам страва…",
      submit: "Опублікувати відгук",
      sending: "Надсилаємо…",
      thanks: "Дякуємо! Відгук опубліковано",
      errName: "Вкажіть ваше ім'я",
      errRating: "Оберіть оцінку від 1 до 5",
      errText: "Відгук — щонайменше 5 символів",
      errConnection: "Не вдалося надіслати відгук. Спробуйте ще раз.",
      bulkTitle: "Оптом дешевше",
    },
    badge: { "ХІТ": "ХІТ", "NEW": "NEW", "ПРЕМІУМ": "ПРЕМІУМ", "-15%": "-15%" },
    kits: {
      label: "ПХД · Комплекти",
      h2a: "Набори для ",
      h2b: "ПХД",
      p: "Сніданок, обід, вечеря, снек і напій — все в одному наборі. Комплектом вигідніше: знижка до 13%, а окремі позиції — від 35 грн.",
      fromPrice: "від 35 грн / позиція",
      perBundle: "за комплект",
      save: "Економія",
      items: "позицій",
      kcal: "ккал",
      cta: "Взяти комплект",
      added: "Комплект у кошику",
      addedDesc: "",
      imgAlt: "Набір субліматів для ПХД у картонній коробці",
      featureTitle: "Зібраний. Збалансований. Готовий.",
      featureText: "Ми вже склали раціон за калоріями та смаком — тобі залишилось лише взяти його з собою. Зберігається без холодильника до 12 місяців.",
      featurePoint1: "Знижка до 13% за комплект",
      featurePoint2: "Окремі позиції — від 35 грн",
      featurePoint3: "Доставка по всій Україні",
    },
    how: {
      label: "Магія сублімації",
      h2a: "Три кроки до ",
      h2b: "гарячого",
      steps: [
        {
          title: "Залий окропом",
          text: "Відкрий пакет, додай 350–400 мл окропу прямо в упаковку. Посуд не потрібен.",
        },
        {
          title: "Почекай 10 хвилин",
          text: "Сублімат відновлює смак і текстуру. Можеш відпочивати чи розводити вогонь.",
        },
        {
          title: "Їж гарячу страву",
          text: "Перемішай — і насолоджуйся. Гаряча домашня їжа там, де ти.",
        },
      ],
    },
    xl: {
      badge: "Подвійна порція",
      h2sub: "для великого апетиту",
      p: "500 грамів готової страви: борщ, харчо, плов чи паста з креветками. Створено для туристів, військових і всіх, хто рухається багато — а їсть багато. Готується так само просто: окріп + 10 хвилин.",
      cta: "Хочу XL за {price} грн",
      link: "Дивитись усі 10 смаків XL",
    },
    reviews: {
      label: "Соцдокази",
      h2a: "Нас ",
      h2b: " смачно",
      p: "Справжні відгуки туристів, рибалок та родин військових — з сайту та Facebook.",
    },
    faq: { label: "FAQ", h2a: "Питання, що ", h2b: "часті за борщ" },
    cta: {
      h2a: "Голодуєш? ",
      h2b: "Це виправимо",
      p: "Збери свій набір: борщ на вечерю, каша на сніданок, батончик на привал і кава на ранок. Доставка по всій Україні.",
      button: "До каталогу",
    },
    footer: {
      links: ["Каталог", "Як готується", "Відгуки", "Питання"],
      rights: "© 2026 Харчі™ — Гаряча їжа там, де ти. Всі права захищені.",
      concept: "Редизайн-концепт",
    },
    cart: {
      title: "Твій кошик",
      count: "шт",
      descCart: "Оформлення за 2 хвилини — і гаряча їжа вже в дорозі",
      descCheckout: "Заповни дані — менеджер зв'яжеться для підтвердження",
      descSuccess: "Ми зателефонуємо найближчим часом",
      empty: "Поки що порожньо",
      emptyHint: "Додай борщу, плову чи хоча б батончик 🌰",
      browse: "Обрати страви",
      remove: "Видалити {name}",
      minus: "Зменшити кількість",
      plus: "Збільшити кількість",
      total: "Разом до сплати",
      checkout: "Оформити замовлення",
      note: "Доставка Новою Поштою · Оплата при отриманні",
      name: "Ім'я *",
      phone: "Телефон *",
      delivery: "Доставка *",
      deliveryPlaceholder: "Обери спосіб доставки",
      city: "Місто",
      address: "Адреса",
      addressCourier: "Кур'єр (Київ)",
      branch: "Відділення",
      comment: "Коментар",
      commentPlaceholder: "Побажання до замовлення…",
      back: "Назад",
      confirm: "Підтвердити замовлення",
      sending: "Надсилаємо…",
      success: "Замовлення прийнято!",
      successTitle: "Дякуємо за замовлення!",
      orderNo: "Номер замовлення:",
      successText:
        "Менеджер зателефонує найближчим часом для підтвердження. Гаряча їжа вже збирається в дорогу 🔥",
      thanks: "Смачно!",
      errName: "Вкажіть ваше ім'я",
      errPhone: "Вкажіть коректний номер телефону",
      errDelivery: "Оберіть спосіб доставки",
      errConnection: "Немає з'єднання. Спробуйте ще раз.",
      errGeneric: "Помилка оформлення замовлення",
      deliveryOptions: ["Нова Пошта", "Укрпошта", "Самовивіз", "Кур'єр (Київ)"],
      cityPlaceholder: "Київ",
    },
    toast: { error: "Помилка", success: "Успіх" },
    theme: { toLight: "Увімкнути світлу тему", toDark: "Увімкнути темну тему" },
    langToggle: "Мова",
  },
  en: {
    nav: {
      catalog: "Catalog",
      kits: "MRE Kits",
      how: "How it's made",
      reviews: "Reviews",
      faq: "FAQ",
      cart: "Cart",
      menu: "Menu",
    },
    hero: {
      badge: "Ukraine's first freeze-dried food store",
      h1a: "Hot food",
      h1b: "wherever you are",
      p: "Freeze-dried borsch, plov and pasta — the taste of home cooking on a hike, a fishing trip or at the front line.",
      pAccent: "Boiling water, 10 minutes — done.",
      cta: "Choose your meal",
      how: "How it works",
      chips: ["Ready in 10 min", "Withstands frost & heat", "Up to 98% flavor kept"],
    },
    ticker: [
      "Hot food wherever you are",
      "Ready in 10 minutes",
      "Built for hikes & field rations",
      "Up to 12 months without a fridge",
      "Rated 4.9 out of 5",
    ],
    stats: ["meals on the menu", "and your meal is ready", "of flavor preserved", "years on the market"],
    catalog: {
      label: "Menu",
      h2a: "Pick your ",
      h2b: " tasty",
      p: "From classic borsch to Thai tom yum — everything cooks with boiling water in 10 minutes. Double XL portions for a big appetite.",
    },
    productCard: {
      deal: "deal",
      added: "Added to cart",
      addedDesc: "",
      addAria: "Add {name} to cart",
      bulkFrom: "From {qty} pcs — {price}",
    },
    productPage: {
      home: "Home",
      category: "Catalog",
      addToCart: "Add to cart",
      qty: "Quantity",
      save: "you save",
      portion: "Serving",
      ready: "Ready in 10 min",
      shelf: "12 months without a fridge",
      kcal: "kcal / serving",
      net: "package weight",
      reviewsCount: "reviews",
      description: "Description",
      specs: "Specifications",
      faq: "Questions about this product",
      reviews: "Reviews",
      recommendations: "Frequently bought together",
      avgRating: "average rating",
      beFirst: "No reviews yet — be the first!",
      formTitle: "Leave a review",
      formName: "Name",
      formNamePh: "How should we call you?",
      formRating: "Your rating",
      formText: "Your review",
      formTextPh: "Tell us how the meal was…",
      submit: "Publish review",
      sending: "Sending…",
      thanks: "Thank you! Your review has been published",
      errName: "Please enter your name",
      errRating: "Pick a rating from 1 to 5",
      errText: "The review must be at least 5 characters",
      errConnection: "Failed to submit the review. Please try again.",
      bulkTitle: "Cheaper in bulk",
    },
    badge: { "ХІТ": "HIT", "NEW": "NEW", "ПРЕМІУМ": "PREMIUM", "-15%": "-15%" },
    kits: {
      label: "MRE · Bundles",
      h2a: "Field ",
      h2b: "ration kits",
      p: "Breakfast, lunch, dinner, a snack and a drink — all in one pack. Bundles save more: up to 13% off, single items from UAH 35.",
      fromPrice: "from UAH 35 / item",
      perBundle: "per bundle",
      save: "Save",
      items: "items",
      kcal: "kcal",
      cta: "Take the bundle",
      added: "Bundle added to cart",
      addedDesc: "",
      imgAlt: "Freeze-dried MRE kit in a cardboard box",
      featureTitle: "Packed. Balanced. Ready.",
      featureText: "We've already built the ration by calories and taste — just grab it and go. Keeps up to 12 months without a fridge.",
      featurePoint1: "Up to 13% off per bundle",
      featurePoint2: "Single items from UAH 35",
      featurePoint3: "Delivery across Ukraine",
    },
    how: {
      label: "The magic of freeze-drying",
      h2a: "Three steps to ",
      h2b: "hot food",
      steps: [
        {
          title: "Pour boiling water",
          text: "Open the pouch and add 350–400 ml of boiling water right into it. No dishes needed.",
        },
        {
          title: "Wait 10 minutes",
          text: "The freeze-dried meal restores its taste and texture. You can rest or build a fire.",
        },
        {
          title: "Eat a hot meal",
          text: "Stir — and enjoy. Hot homemade food wherever you are.",
        },
      ],
    },
    xl: {
      badge: "Double portion",
      h2sub: "for a big appetite",
      p: "500 grams of ready meal: borsch, kharcho, plov or shrimp pasta. Built for hikers, soldiers and everyone who moves a lot — and eats a lot. Just as simple: boiling water + 10 minutes.",
      cta: "Get XL for {price} UAH",
      link: "See all 10 XL flavors",
    },
    reviews: {
      label: "Social proof",
      h2a: "They feed us ",
      h2b: "well",
      p: "Real reviews from hikers, anglers and military families — from the website and Facebook.",
    },
    faq: { label: "FAQ", h2a: "Questions, ", h2b: "frequent as borsch" },
    cta: {
      h2a: "Hungry? ",
      h2b: "We'll fix that",
      p: "Build your pack: borsch for dinner, porridge for breakfast, a bar for a rest stop and coffee for the morning. Delivery across Ukraine.",
      button: "To the catalog",
    },
    footer: {
      links: ["Catalog", "How it's made", "Reviews", "FAQ"],
      rights: "© 2026 Kharchi™ — Hot food wherever you are. All rights reserved.",
      concept: "Redesign concept",
    },
    cart: {
      title: "Your cart",
      count: "pcs",
      descCart: "Checkout in 2 minutes — and hot food is on its way",
      descCheckout: "Fill in your details — our manager will call to confirm",
      descSuccess: "We will call you shortly",
      empty: "Nothing here yet",
      emptyHint: "Add some borsch, plov or at least a bar 🌰",
      browse: "Browse meals",
      remove: "Remove {name}",
      minus: "Decrease quantity",
      plus: "Increase quantity",
      total: "Total to pay",
      checkout: "Place the order",
      note: "Nova Poshta delivery · Cash on delivery",
      name: "Name *",
      phone: "Phone *",
      delivery: "Delivery *",
      deliveryPlaceholder: "Choose a delivery method",
      city: "City",
      address: "Address",
      addressCourier: "Courier (Kyiv)",
      branch: "Branch",
      comment: "Comment",
      commentPlaceholder: "Order notes…",
      back: "Back",
      confirm: "Confirm the order",
      sending: "Sending…",
      success: "Order received!",
      successTitle: "Thanks for your order!",
      orderNo: "Order number:",
      successText:
        "Our manager will call you shortly to confirm. Your hot food is already being packed 🔥",
      thanks: "Enjoy!",
      errName: "Please enter your name",
      errPhone: "Please enter a valid phone number",
      errDelivery: "Please choose a delivery method",
      errConnection: "No connection. Please try again.",
      errGeneric: "Failed to place the order",
      deliveryOptions: ["Nova Poshta", "Ukrposhta", "Pickup", "Courier (Kyiv)"],
      cityPlaceholder: "Kyiv",
    },
    toast: { error: "Error", success: "Success" },
    theme: { toLight: "Switch to light theme", toDark: "Switch to dark theme" },
    langToggle: "Language",
  },
};

/* ------------------------------------------------------------------ */
/* MRE kits (ПХД)                                                      */
/* ------------------------------------------------------------------ */

export interface KitItem {
  uk: string;
  en: string;
  productId: string;
}

export interface Kit {
  id: string;
  name: { uk: string; en: string };
  tagline: { uk: string; en: string };
  items: KitItem[];
  price: number;
  oldPrice: number;
  kcal: number;
  accent: string;
}

export const KITS: Kit[] = [
  {
    id: "kit-mini",
    name: { uk: "Набір «МІНІ»", en: "«MINI» Kit" },
    tagline: {
      uk: "На один вихід: сніданок, обід і напій",
      en: "One mission out: breakfast, lunch and a drink",
    },
    items: [
      { uk: "Каша бананова", en: "Banana porridge", productId: "kasha-banana" },
      { uk: "Суп гороховий", en: "Pea soup", productId: "gorohovyj" },
      { uk: "Обліпиховий напій", en: "Sea buckthorn drink", productId: "napij-oblipikha" },
    ],
    price: 239,
    oldPrice: 265,
    kcal: 780,
    accent: "from-emerald-400 to-teal-500",
  },
  {
    id: "kit-doba",
    name: { uk: "Набір «ДОБА»", en: "«Daily» Ration Kit" },
    tagline: {
      uk: "Повний добовий раціон: 5 позицій харчування",
      en: "A full 24-hour ration: 5 meal items",
    },
    items: [
      { uk: "Каша бананова", en: "Banana porridge", productId: "kasha-banana" },
      { uk: "Суп гороховий", en: "Pea soup", productId: "gorohovyj" },
      { uk: "Борщ зі свининою", en: "Borsch with pork", productId: "borshch" },
      { uk: "Батончик вівсяний", en: "Oat bar", productId: "bar-prune" },
      { uk: "Обліпиховий напій", en: "Sea buckthorn drink", productId: "napij-oblipikha" },
    ],
    price: 369,
    oldPrice: 420,
    kcal: 2150,
    accent: "from-amber-400 to-orange-600",
  },
  {
    id: "kit-doba-xl",
    name: { uk: "Набір «ДОБА XL»", en: "«Daily XL» Ration Kit" },
    tagline: {
      uk: "Подвійні порції для великого апетиту",
      en: "Double portions for a big appetite",
    },
    items: [
      { uk: "Каша бананова", en: "Banana porridge", productId: "kasha-banana" },
      { uk: "Борщ український XL", en: "Ukrainian borsch XL", productId: "borshch-xl" },
      { uk: "Гречка українська XL", en: "Ukrainian buckwheat XL", productId: "grechka-xl" },
      { uk: "Батончик вівсяний", en: "Oat bar", productId: "bar-prune" },
      { uk: "Кава арабіка дріп", en: "Arabica drip coffee", productId: "coffee-drip" },
    ],
    price: 499,
    oldPrice: 573,
    kcal: 2950,
    accent: "from-orange-500 to-red-600",
  },
];

export const kitName = (k: Kit, lang: Lang) => k.name[lang];

/** Currency formatting: "369 грн" (uk) / "UAH 369" (en) */
export const money = (v: number, lang: Lang) =>
  lang === "en" ? `UAH ${v}` : `${v} грн`;
