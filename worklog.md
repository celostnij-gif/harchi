# Worklog

---
Task ID: 1
Agent: Z.ai Code (main)
Task: Редизайн сайта harchifood.com — современный e-commerce лендинг с WOW-эффектом

Work Log:
- Изучен оригинальный сайт через page_reader: украинский магазин сублимированной еды «Харчі» («Гаряча їжа там де ти»), 88 товаров, 8 категорий
- Извлечены реальные данные через WP REST API + WooCommerce Store API (wp-json/wc/store/v1/products): названия, цены, категории, рейтинги, отзывы
- Скачаны 23 реальных фото упаковок в public/products/
- Сгенерированы AI-изображения: hero-camp.png (кинематографичный лагерь с костром) и xl-feature.png (плов с паром, обрезан от текстовых артефактов через sharp)
- Prisma: модель Order (publicId, name, phone, delivery, city, address, comment, items JSON, total) → db:push
- Шрифты Unbounded (display, кириллица) + Inter (body); тёмная «огненная» тема (stone-950 + amber/orange градиенты) в globals.css
- Компоненты src/components/kharchi/: Navbar (стеклянный sticky, счётчик корзины с bounce), Hero (параллакс мышью, плавающие упаковки, пар, угольки, giant outline-текст), Ticker (бегущая строка), Stats (анимированные счётчики), Catalog (фильтр-пилюли с layoutId + AnimatePresence), ProductCard (3D-tilt, бейджи, тосты), HowItWorks (3 шага), XlBanner (параллакс-скролл, вращающееся кольцо), Reviews (2 встречные marquee-ленты), Faq (accordion), CtaBanner, Footer (sticky через mt-auto), CartDrawer (Sheet: корзина → checkout → success)
- Zustand + persist корзина (localStorage); API POST /api/orders с zod-валидацией → SQLite
- Отладка: найден баг «белый фон/чёрный текст» — устаревший Turbopack CSS-кэш; полный рестарт с rm -rf .next
- Agent Browser верификация: hero/каталог/XL/шаги/отзывы/FAQ/CTA/footer, мобильная версия 390px, фильтры, FAQ-аккордеон

Stage Summary:
- Полный golden path проверен в браузере: добавить в корзину (тост + бейдж 3) → корзина → checkout форма → заказ сохранён в БД (687 грн, Нова Пошта, order KELDYCMY) → success-экран
- Консоль без ошибок; lint чистый; HTTP 200; адаптив OK; футер прижат естественно
- Артефакты: src/lib/products.ts (23 товара с реальными ценами), src/lib/cart-store.ts, src/app/api/orders/route.ts, 12 компонентов kharchi, layout+globals переработаны

---
Task ID: 2
Agent: Z.ai Code (main)
Task: Додати перемикач теми (темна ↔ світла) до редизайну «Харчі»

Work Log:
- Створено світлу «теплу вершкову» тему (cream + burnt orange, oklch) у globals.css: блок .light з усіма змінними, світлі версії card-glass / text-stroke / text-gradient-flame / steam-blob / scrollbar, нові семантичні токени --accent-text (text-accent-strong) і --scrim
- Нові theme-aware утиліти: .scrim-b / .scrim-r (hero-затемнення), .hero-photo (фото 45% у темній, 16% у світлій), .cta-panel (градієнт CTA-панелі для обох тем)
- Нові компоненти: ThemeProvider (next-themes, attribute=class, defaultTheme=dark, enableSystem=false), ThemeToggle (анімований swap Sun/Moon через framer-motion + AnimatePresence, hydration-safe через useSyncExternalStore, синхронізує meta theme-color), StyledToaster (sonner слідує темі)
- layout.tsx: загорнуто в ThemeProvider, Toaster → StyledToaster
- Всі 12 компонентів kharchi переведено на семантичні класи: stone-950→background/card, white/5-15→border/card/40/muted, stone-300/400/500→muted-foreground, amber-400/500 текст→text-accent-strong чи text-primary; ThemeToggle додано в Navbar (desktop + mobile)
- Fix lint: react-hooks/set-state-in-effect → useSyncExternalStore-хук useMounted
- Agent Browser верифікація: обидві теми на hero/ticker/stats/catalog/картках/XL/відгуках/CTA/footer/кошику/checkout; golden path у світлій темі (замовлення P03VFSMC збережено в БД); персистентність теми після reload (localStorage); мобільна 390px обидві теми; консоль без помилок

Stage Summary:
- Перемикач теми працює: темна (онова, дефолт) ↔ світла (вершково-помаранчева), анімована іконка, запам'ятовується між сесіями
- Дизайн у темній темі не змігся (візуально ідентичний до правок); світла — повноцінна контрастна тема, а не інверсія
- Артефакти: src/components/kharchi/{ThemeProvider,ThemeToggle,StyledToaster}.tsx; globals.css (свіала палітра + утиліти); semantic-класи в 12 компонентах

---
Task ID: 3
Agent: Z.ai Code (main)
Task: Перемикач мов УКР/EN + блок «Набори для ПХД» зі знижкою за комплект і ціновим сегментом «від 35 грн»

Work Log:
- Створено src/lib/i18n.ts: повний EN-словник UI (nav/hero/ticker/stats/catalog/kits/how/xl/reviews/faq/cta/footer/cart/theme), PRODUCT_EN для 23 товарів (name/short/portion), CATEGORY_EN, REVIEWS_EN (6), FAQ_EN (5), дані KITS (3 комплекти, двомовні), хелпери productByLang / money (грн ↔ UAH)
- LangProvider: контекст + useLang, зберігання в localStorage через useSyncExternalStore (без setState-in-effect, lint clean), синхронізація <html lang>
- LangToggle: пілюля УКР|EN у Navbar (desktop + mobile) з layoutId-анімацією активної мови
- KitsSection (id=kits, між XL-банером і «Як готується»): AI-зображення MRE-коробки (public/mre-kits.png), військовий жетон «ПХД · 12 місяців», плаває паковання, Steam; 3 комплекти: МІНІ (265→239, −10%), ДОБА (420→369, −12%, «найкращий вибір»), ДОБА XL (573→499, −13%); чіпи: позиції, ккал, «Економія N грн»; чіпи-тригери в шапці «від 35 грн / позиція» + «Знижка до 13% за комплект»; кнопка «Взяти комплект» → кошик + тост 🪖
- Navbar: +лінк «Набори ПХД» (#kits), desktop links перенесено на lg:flex; Hero/Ticker/Stats/Catalog/ProductCard/HowItWorks/XlBanner/Reviews/Faq/CtaBanner/Footer/CartDrawer/ThemeToggle — всі тексти через t.*, назви товарів/відгуки/FAQ через lang-хелпери, бейджі ХІТ→HIT, ПРЕМІУМ→PREMIUM, вигідно→deal, варіанти доставки EN
- Cart: комплекти додаються як позиції (name — мовою на момент додавання), total у грн/UAH
- Agent Browser верифікація: UKR+EN × dark+light; kits-секція (жетон, картки, -% бейджі); golden path EN: «Take the bundle» → кошик «Your cart 1 pcs» → checkout (Name/Phone/Nova Poshta) → замовлення J3TAQREC у БД (POST 200) → success EN; персистентність мови після reload; мобільна 390px (перемикачі влазять, бургер-меню з 5 лінками); консоль без помилок; lint чистий

Stage Summary:
- Сайт двомовний (UKR дефолт / EN) з миттєвим перемиканням без перезавантаження і збереженням вибору
- Новий конверсійний блок ПХД: комплектні знижки до −13% + ціновий якір «від 35 грн», повна інтеграція з кошиком і оформленням
- Артефакти: src/lib/i18n.ts, src/components/kharchi/{LangProvider,LangToggle,KitsSection}.tsx, public/mre-kits.png; перекладені 12 компонентів

---
Task ID: 4
Agent: Z.ai Code (main)
Task: Запакувати весь сайт в архів у корені проєкту для завантаження

Work Log:
- Перевірено стан проєкту: сайт повністю готовий як Next.js-застосунок (13 компонентів kharchi, i18n, кошик, API замовлень, Prisma, 26 зображень у public/)
- Визначено виключення: node_modules (1.2G), .next (407M), .git (14M), skills (61M), dev.log, *.zip — не є частиною сайту і відновлюються через bun install
- Створено /home/z/my-project/harchi-food-site.zip (13 MB, 162 файли): усі вихідники src/, конфіги (package.json, bun.lock, tsconfig, tailwind, eslint), prisma/schema.prisma, db/custom.db (з тестовими замовленнями), public/ з усіма фото товарів
- Цілісність архіву перевірено: unzip -t → ZIP OK
- Копію архіву покладено в public/harchi-food-site.zip → доступна для завантаження через браузер за URL /harchi-food-site.zip (перевірено: HTTP 200, Content-Type application/zip)
- Сайт після додавання архіву працює: GET / → 200

Stage Summary:
- Архів усіх файлів сайту: /home/z/my-project/harchi-food-site.zip (корінь, як просив користувач)
- Браузерне завантаження: <preview-url>/harchi-food-site.zip
- Для запуску розпакованого проєкту: bun install → bun run dev (Prisma-клієнт генерується автоматично; за потреби bun run db:generate)

---
Task ID: 5.1-5.2 (foundation)
Agent: Z.ai Code (main)
Task: Фундамент адмінки + CRM: схема БД, авторизація, data-шар, admin shell

Work Log:
- Prisma-схема розширено: Category, Product (slug/nameUk/nameEn/short/portion/cats CSV/price/oldPrice/image/badge hit|new|premium|deal/rating/reviewsCount/kcal/weight/isActive/sort), Review, FaqItem, SectionContent (key/data JSON/visible), MediaAsset; Order + updatedAt (@default(now))
- db push OK; prisma/seed.ts (ідемпотентний, update: {} — не перетирає правки): 7 категорій, 23 товари, 6 відгуків, 5 FAQ, 13 секцій, замовлення не чіпані; скрипт bun run db:seed
- .env: ADMIN_USERNAME=admin, ADMIN_PASSWORD=UbjVShucRTQXqm, ADMIN_TOKEN_SECRET (hmac 32B)
- src/lib/admin-auth.ts: HMAC-SHA256 токен (Web Crypto, edge+node), ADMIN_COOKIE=harchi_admin, TTL 7 днів, checkCredentials
- src/middleware.ts: matcher /admin/:path* + /api/admin/:path*; login сторінка/API пропускаються; неавторизовані сторінки → redirect /admin/login, API → 401 JSON
- src/lib/admin-guard.ts: requireAdminApi() через cookies() для route handlers
- API /api/admin/login (POST, Set-Cookie httpOnly) + /api/admin/logout. Smoke-тест curl: 307/401/200+cookie/401 — все ОК
- src/lib/site-data.ts: getSiteData() → { overrides: {uk,en} deep-partial STRINGS, visibility per секція, heroBg (hero.bgImage), kits (Kit[] з data.kits або KITS), products (DB→UiProduct: id=slug, badge map hit→ХІТ/new→NEW/premium→ПРЕМІУМ/deal→-15%, cats CSV→[], fallback PRODUCTS якщо БД порожня), reviews (→{name,role,text,rating}, fallback REVIEWS), faq (→{q,a}, fallback FAQ), categories (→{id:slug,label:nameUk}, fallback [] — "all" додається на клієнті) }
- deepMerge(base, patch): масиви замінюються целиком; null/undefined у patch ігноруються. Порожні рядки "" у формах адмінки НЕ писати в БД (= «залишити дефолт»)
- src/lib/section-defs.ts: SECTION_DEFS (13 секцій з полями для редактора: nav/hero/ticker/stats/catalog/xl/kits/how/reviews/faq/cta/footer/cart; specials: how→steps3, kits→kits)
- Admin shell: src/components/admin/AdminShell.tsx (sidebar 8 пунктів, мобільний хедер, logout), src/app/admin/(dash)/layout.tsx, src/app/admin/login/page.tsx, src/lib/admin-client.ts (apiGet/apiSend/apiUpload: 401→redirect, {ok,data} протокол)

Stage Summary:
- КОНТРАКТ АДМІН-API (для всіх роутів): відповідь { ok:true, data } | { ok:false, error }, статуси 200/400/401/404/500; кожен route: export const runtime="nodejs" + const authed = await requireAdminApi(); if (!authed) return NextResponse.json({ok:false,error:"unauthorized"},{status:401})
- Роути: /api/admin/products GET(?all=1)|POST, /api/admin/products/[id] PUT|PATCH|DELETE; /api/admin/categories так само; /api/admin/orders GET(?status=&q=&limit=)|—, /api/admin/orders/[id] PATCH {status}, /api/admin/orders/export GET (CSV); /api/admin/content GET all | PUT {key,data,visible} upsert; /api/admin/reviews + [id]; /api/admin/faq + [id]; /api/admin/upload POST multipart (public/uploads, ≤5MB, png/jpg/webp/svg/gif); /api/admin/media GET|DELETE [id]; /api/admin/stats GET
- Після кожної мутації: revalidatePath("/") (import { revalidatePath } from "next/cache")
- Зміна статусов замовлень: new→confirmed→cooking→shipping→done, canceled

---
Task ID: 5.4
Agent: general-purpose (site refactor)
Task: Сайт на даних з БД (динамічний рендер + ідеальний fallback на константи)

Work Log:
- Створено src/lib/deep-merge.ts: pure deepMerge<T>(base, patch) (масиви замінюються целиком, null/undefined у patch ігноруються); site-data.ts більше не містить локальну реалізацію — робить re-export `export { deepMerge }` для сумісності імпортерів
- src/lib/products.ts: Product + опційні nameEn?/shortEn?/portionEn?; новий інтерфейс CategoryDef (id/label/labelEn?) — CATEGORIES перетипізовано, структура констант не змінена
- src/lib/i18n.ts: productByLang для en тепер p.nameEn ?? PRODUCT_EN[p.id]?.name ?? p.name (аналогічно short/portion) — нові товари з БД без EN-словника падають у UKR-текст замість undefined
- src/lib/site-data.ts: UiReview +roleEn?/textEn?, UiFaq +qEn?/aEn?, UiCategory +labelEn?; мапінг з БД заповнює EN-поля (products nameEn/shortEn/portionEn, reviews roleEn/textEn, faq qEn/aEn, categories labelEn з nameEn; порожні рядки "" → undefined щоб спрацював fallback); getSiteData обгорнуто в React cache() — layout+page у одному рендері дають ОДИН прохід по БД; fix latent TS-помилки: cats CSV кастовано до Category[]
- LangProvider: опційний prop overrides: Record<"uk"|"en", Record<string, unknown>> (default {uk:{},en:{}}), t = useMemo(() => deepMerge(STRINGS[lang], overrides[lang] ?? {})); решта (useSyncExternalStore-стор, <html lang>) без змін; експортовано тип LangOverrides
- Hero: prop heroBg? → style backgroundImage url(heroBg ?? "/hero-camp.png")
- KitsSection: prop kits? → list = kits?.length ? kits : KITS
- Catalog: props products?/categories? з fallback PRODUCTS/CATEGORIES (перевірка .length — захист від порожніх БД-масивів); стан фільтра розширено до string (DB-слаги); EN-лейбл категорії: labelEn ?? CATEGORY_EN[id] ?? label (для констант — як зараз, "all" → "All products")
- Reviews: prop reviews?: UiReview[] (fallback REVIEWS); EN: name з REVIEWS_EN[index], role = r.roleEn ?? en?.role ?? r.role, text = r.textEn ?? en?.text ?? r.text (поточна логіка збережена як fallback-гілка)
- Faq: prop faq?: UiFaq[] (fallback FAQ); EN: f.qEn ?? FAQ_EN[i]?.q ?? f.q (аналогічно a)
- layout.tsx: async server component — await getSiteData() → <LangProvider overrides={overrides}>; ThemeProvider/метадані/шрифти збережено
- page.tsx: async + export const dynamic = "force-dynamic"; data.visibility[key] !== false гейтує секції (hero, ticker, stats, catalog, xl, kits, how, reviews, faq, cta); Navbar/Footer не ховаються; пропси Hero heroBg / KitsSection kits / Catalog products+categories / Reviews reviews / Faq faq
- Dev-сервер перезапущено (старий процес тримав Prisma-клієнт без нових моделей → 500 "Cannot read properties of undefined (reading 'findMany')"); після рестарту GET / = 200, у HTML усі дані з БД (товари/категорії/відгуки/FAQ/комплекти)
- Тест динаміки: login admin → PUT /api/admin/content {key:"hero", data:{uk:{badge:"ТЕСТ ДИНАМІКИ"}}, visible:true} → GET / містить "ТЕСТ ДИНАМІКИ" (1), решта hero-текстів не змінена (deep-merge точковий); відкат через PUT data:{} → "ТЕСТ ДИНАМІКИ" зник, дефолтний badge повернувся, у БД hero.data="{}"
- Тест видимості: PUT content {key:"faq", visible:false} → "часті за борщ" зникла з HTML; visible:true → повернулась
- Smoke: /admin/login = 200 (async root layout не зламав адмінку); bun run lint — чистий; tsc по src/ — 0 помилок

Stage Summary:
- Сайт повністю на даних з БД: тексти (overrides у LangProvider), hero-фон, комплекти, товари, категорії, відгуки, FAQ + видимість секцій — усе летить з getSiteData() (cache()-дедуп між layout і page), force-dynamic на /
- Fallback 1:1: порожня БД/без override → константи PRODUCTS/CATEGORIES/REVIEWS/FAQ/KITS/STRINGS + PRODUCT_EN/REVIEWS_EN/FAQ_EN/CATEGORY_EN для EN; порожні EN-рядки в БД → undefined → падіння на константи; секції рендеряться якщо visibility[key] !== false
- Тест динаміки пройдено: "ТЕСТ ДИНАМІКИ" з'явився на сайті після PUT з адмін-API і зник після відкату (БД повернено до data="{}"); lint чистий, dev.log без помилок

---
Task ID: 5.3
Agent: general-purpose (admin API)
Task: Admin API роути

Work Log:
- Створено src/lib/admin-api.ts (спільні хелпери, новий файл): ok/fail ({ok,data}|{ok,error}), parseRouteId, isUniqueConflict (P2002→409), isRecordNotFound (P2025→404), csvCell (екранування ";"), clampInt (з фіксом Number(null)===0 → дефолт), round2, parseOrderItems (defensive-парсинг items JSON [{id,name,price,qty}] — форма з POST /api/orders), ORDER_STATUSES
- products + [id]: GET (?all=1, ?q= по nameUk/nameEn/slug, sort asc→id asc), POST 201, GET/PUT/PATCH/DELETE по id; PATCH-схеми окремо без дефолтів (undefined-key не перетирає поля); slug-конфлікт → 409; жорстке видалення
- categories + [id]: той самий CRUD (slug/nameUk/nameEn/sort/isActive)
- orders: GET (?status= кома-список з валідацією проти ORDER_STATUSES, ?q= по publicId/name/phone contains, ?limit= default 100 кламп 1..500, createdAt desc); POST → 405 method_not_allowed
- orders/[id]: GET (шук id або publicId), PATCH {status} (zod enum new|confirmed|cooking|shipping|done|canceled; інвалідний → 400), DELETE (жорстко)
- orders/export: GET → CSV: BOM \uFEFF, роздільник ";", заголовок publicId;дата;статус;імʼя;телефон;доставка;місто;адреса;коментар;позиції;сума; items → "назва xqty" через " | "; Content-Type text/csv; charset=utf-8 + Content-Disposition attachment; filename="orders.csv"
- content: GET усі 13 секцій [{key, data (JSON.parse defensive), visible, updatedAt}]; PUT {key,data:object,visible} → upsert (JSON.stringify); валідація key непорожній, data — record
- reviews + [id] і faq + [id]: повний CRUD за схемами моделі (rating 1..5, isActive, sort; сортування sort asc→id asc)
- upload: POST multipart поле file; валідація розширення png/jpg/jpeg/webp/svg/gif + ≤5MB; збереження в public/uploads (mkdir recursive); імʼя = Date.now()-<санітизовано [a-zA-Z0-9._-]>; MediaAsset upsert по filename (конфлікт → перезапис файлу + оновлення рядка); відповідь {url, filename, size}
- media: GET (createdAt desc); media/[id] DELETE — unlink файлу (ENOENT ігнорується) + видалення рядка; basename() від filename проти path traversal
- stats: GET aggregates — today {orders, revenue} (від початку доби), total {orders, revenue, avgCheck}, byStatus (усі 6 статусів з нулями), topProducts (агрегація qty/revenue по items всіх замовлень, defensive, топ-5), recentOrders (8: id, publicId, name, total, status, createdAt)
- Кожен роут: export const runtime="nodejs"; перший рядок requireAdminApi() → 401 {ok:false,error:"unauthorized"}; zod-валідація тіл (v4, без any); revalidatePath("/") після кожної мутації; помилки → 500 server_error
- Фікс знайдений тестуванням: clampInt повертав 1 замість fallback 100 для відсутнього ?limit= (Number(null)===0) — виправлено, тести повторено
- Тест-дані прибрано: тестовий продукт/категорію/відгук/FAQ/замовлення видалено через власні DELETE, tmp-секцію content прибрано скриптом Prisma; hero повернуто до {"uk":{},"en":{}}

Stage Summary:
- Створено 16 роут-файлів + 1 хелпер: src/lib/admin-api.ts; src/app/api/admin/{products,categories,reviews,faq}/route.ts + їх [id]/route.ts; orders/route.ts + orders/[id]/route.ts + orders/export/route.ts; content/route.ts; upload/route.ts; media/route.ts + media/[id]/route.ts; stats/route.ts
- curl-тести (cookie від POST /api/admin/login): всі GET списків 200; POST 201; PUT/PATCH 200; DELETE 200 → повторно 404; дублікати slug → 409 conflict; інвалідні тіла/статуси → 400; неіснуючі id → 404; POST /api/admin/orders → 405; orders/export — BOM (ef bb bf) + правильні заголовки attachment; upload PNG 79B → 201 + файл серветься (200) + медіа-ліст; .txt → 400 bad_file_type; 6MB → 400 file_too_large; media DELETE прибрав і файл з диска (public/uploads порожній); stats: today/total/byStatus/topProducts/recentOrders відповідають реальним замовленням
- Без cookie: всі /api/admin/* (включно з [id] роутами) → 401
- bun run lint — чистий (0 помилок); tsc по src/ — 0 помилок; dev.log — компіляція всіх роутів без помилок (тільки попередження про deprecated middleware з Task 5.1)
---
Task ID: 5.5-a
Agent: general-purpose (dashboard+CRM UI)
Task: Дашборд + CRM замовлень

Work Log:
- Прочитано контракт API (5.1-5.3): curl-логін admin → GET /api/admin/stats і /api/admin/orders?limit=3 віддають коректні дані (today/total/byStatus/topProducts/recentOrders; items — JSON-рядок [{id,name,price,qty}], форма звірена з src/app/api/orders/route.ts)
- Створено src/app/admin/(dash)/page.tsx («use client», усі хелпери локально): KPI-картки (Замовлення сьогодні + виручка за добу, Всього, Виручка загалом, Середній чек) з іконками/font-display/Skeleton; чіпи byStatus з лічильниками → Link на /admin/orders?status=X; Топ-5 товарів з qty/revenue і прогрес-баром (div, % від лідера); Останні 8 замовлень (компактна таблиця: publicId mono, клієнт, сума, статус-бейдж, dd.MM HH:mm) + «Усі замовлення →»; Швидкі дії (Експорт CSV <a download>, Контент секцій, Додати товар); кнопка «Оновити» (tick-state refetch) + «оновлено о HH:mm»; скелетон і error-стан з retry
- Створено src/app/admin/(dash)/orders/page.tsx: useSearchParams (+Suspense-межа, бо сторінка клієнтська) → ?status= фільтр синхронізований з URL через router.replace; чіпи фільтрів Усі/Нові/Підтверджені/Готується/В дорозі/Виконані/Скасовані з count з /api/admin/stats; пошук Input з debounce 300 мс → ?q=; таблиця (publicId mono, дата dd.MM HH:mm, клієнт+телефон, доставка city+address, позиції шт., сума грн, Select статусу прямо в рядку + Eye-кнопка) на md+, картки на мобільних (<md); Dialog деталей (усі поля, tel:-лінк, defensive-парсинг позицій «назва × qty — ціна», коментар клієнта в amber-блоці, «Разом», Select статусу також у футері); optimistic-оновлення статусу → PATCH /api/admin/orders/[id] → sonner-тост, rollback+toast.error при фейлі, refetch лічильників після успіху; порожній стан «Замовлень немає» з PackageOpen; скелетони/стан помилки
- Статус-метадані локальні: new=amber, confirmed=emerald, cooking=orange, shipping=stone/foreground, done=emerald filled, canceled=red (бейдж + кольорова крапка у Select); стилі — semantic-токени, card-glass, rounded-2xl, amber/orange акценти, без blue/indigo/violet
- Дані через власний hook-патерн: useState + useEffect з void-async-функцією та alive-прапорцем (setState лише після await — без порушень react-hooks/set-state-in-effect); жодних спільних файлів не створено (STATUS_META/money/fmtDate/parseItems продубльовано локально в обох файлах)
- Тестування: curl 200 для /admin, /admin/orders, /admin/orders?status=new; Agent Browser (desktop 1440 + mobile 390): логін → дашборд (KPI 3/1155 грн/3/385 грн, чіпи з лічильниками, топ-5 з барами, таблиця останніх) → клік чіпа «Новий» → /admin/orders?status=new → зміна статусу Select у рядку (PATCH підтверджено API, список і лічильники оновились, тост) → фільтр «Підтверджені» → Dialog деталей (позиції «MINI» Kit × 1 — 239 грн, Разом, поля) → повернення статусу на «Новий» через Select у діалозі; пошук «Тарас» → показано 1, «ZZZZZ» → «Замовлень немає»; мобільна перевірка: таблиця hidden, 3 картки видимі; консоль чиста (тільки давнє metadataBase-попередження); VLM-огляд 4 скріншотів — критичних дефектів немає
- Тестові дані повернено у початковий стан (усі 3 замовлення знову status=new)

Stage Summary:
- Файли (тільки зона відповідальності): src/app/admin/(dash)/page.tsx (Дашборд), src/app/admin/(dash)/orders/page.tsx (CRM замовлень); допоміжні функції/компоненти локально в цих файлах
- Фічі: KPI-дашборд з агрегатами stats-API, чіпи статусів з лічильниками, топ-5 товарів з прогрес-барами, останні замовлення, швидкі дії (CSV-експорт/контент/товар); CRM — фільтри статусів (URL-sync), debounce-пошук, таблиця→картки на мобільних, inline-Select статусу з optimistic-оновленням і тостами, діалог деталей з позиціями/коментарем/зміною статусу, CSV-експорт
- Перевірки: bun run lint — 0 errors (4 warnings лише у файлах паралельного агента products/categories, не чіпані); eslint по моїх 2 файлах — чисто; tsc --noEmit по src/ — 0 помилок; dev.log — компіляція сторінок без помилок; браузерні curl+Agent Browser тести пройдені

---
Task ID: 5.5-b
Agent: general-purpose (editors UI)
Task: Редактори товарів/категорій/контенту/відгуків/FAQ/медіа

Work Log:
- Створено 6 сторінок у src/app/admin/(dash)/: products, categories, content, reviews, faq, media (усе локально в файлах, спільні патерни продубльовані — без спільних нових файлів, щоб не конфліктувати з паралельним агентом dashboard/orders)
- products: таблиця (img size-12 rounded-lg, UK+EN, чіпи категорій з CSV, ціна + закреслена стара, Badge бейджа з кольорами hit/new/premium/deal, Switch isActive inline → PATCH, sort, edit/delete), пошук ?q= з debounce 300ms (?all=1), Dialog max-h-[85vh] overflow-y-auto з усіма полями: мультивибір категорій чіпами з GET /api/admin/categories, badge Select (radix не приймає value="" → sentinel "none"), image — превʼю + Input URL + hidden file input → apiUpload, числові number-інпути; валідація slug [a-z0-9-], price ≥ 0, image обовʼязкове; 409 → toast «Конфлікт: slug уже існує»; numStr() для акуратних float з SQLite (4.900000095367432 → 4.9)
- categories: компактна таблиця slug/nameUk/nameEn/sort/Switch/edit/delete + діалогова форма; у AlertDialog попередження що видалення категорії, призначеної товарам, прибере її з товарів
- content (найважливіша): grid lg:grid-cols-[300px_1fr]; зліва список SECTION_DEFS (label+desc) зі Switch visible в списку → PUT {key, data: row.data, visible} (stopPropagation); праворуч SectionEditor (key=section.key → remount, useState-ініціалізатори з row.data — без setState-in-effect); під-таби «Українська / English» (shadcn Tabs) для text/textarea/list полів; значення = data.uk.<field>, плейсхолдери = дефолти STRINGS.uk[key] (для ticker/stats — сам масив, для how steps — STRINGS.uk.how.steps[i].title/text); list → Textarea один пункт = рядок; image-поля (hero.bgImage) винесені під таби як спільні ImageInput (превʼю + URL + apiUpload), зберігаються в uk і en одночасно
- content трансформації при збереженні: ticker/stats → data.uk = ["фраза", ...] верхньо-рівневим масивом БЕЗ ключа items/labels (порожнє → ключ не пишеться); how (special steps3) → data.uk.steps=[{title,text}×3] з добором дефолтів у пусті частини; kits (special kits) → data.kits = [{id:"kit-mini|kit-doba|kit-doba-xl", name:{uk,en}, tagline:{uk,en}, items:[{uk,en,productId:"item-N"}], price, oldPrice, kcal, accent}] — стартові значення data.kits ?? KITS, items UK/EN textarea пострічково, акцент Select з 4 градієнтів (emerald/amber/orange/rose), числові Number, порожні ціни → fallback на KITS («не міняти», бо KitsSection ділить price/oldPrice); порожні поля обʼєктних секцій не пишуться (→ дефолт deepMerge); кнопка «Зберегти секцію» → PUT → toast + оновлення рядка в стані
- reviews: таблиця (автор, роль UK, обрізаний текст, rating зірки lucide Star fill-amber, Switch, sort) + форма (author, roleUk/roleEn, textUk/textEn Textarea, rating Select 1-5 зі словами «зірка/зірки/зірок», isActive, sort)
- faq: таблиця (питання UK, обрізна відповідь, Switch, sort) + форма (qUk/qEn Input, aUk/aEn Textarea)
- media: drag&drop зона (onDragOver/onDrop + клік, hidden file input multiple, стани dragOver/uploading) → послідовний apiUpload кожного файлу → toast «Завантажено N файлів»; сітка grid aspect-square object-cover, імʼя truncate, розмір КБ/МБ, «Копіювати URL» → navigator.clipboard → toast + галочка CheckCheck, Видалити → AlertDialog «назавжди» → DELETE → файл з disc + БД
- Спільний патерн у всіх: apiGet список → Skeleton при load → порожній стан з іконкою + підказка + CTA → Dialog форма → apiSend POST/PUT → toast.success → refetch → AlertDialog → DELETE; errText() мапить conflict/unauthorized/bad_file_type/file_too_large; усі іконки lucide, семантичні токени, rounded-2xl картки, amber/orange акценти
- Тести curl: POST test-admin-ui 201 → PATCH isActive → PUT (cats CSV) → дублікат 409 → валідний 400 → GET ?q=Тест → DELETE 200 → повторний 404; reviews/faq/categories цикли POST→PATCH/PUT→DELETE 200/201; upload PNG 69B → 201 → media list → DELETE 200 (uploads порожній)
- Тест контенту: PUT ticker {uk:["ТЕСТ ТІКЕР"],en:[...]} → на / зʼявилось → PUT data:{} → дефолт повернувся; UI-тест: редагування тікера через редактор → фрази на / (8 маркізацій) → очищення через Ctrl+A/Delete (fill "" не тригерить onChange — кверк agent-browser, не баг застосунку) → збережено → БД {} → дефолт на сайті; kits UI: зміна ціни МІНІ 239→249 + порожнє kcal → у БД data.kits[0] = {price:249, kcal:780 (fallback), items:[{uk,en,productId:"item-1"}]}, порожні headingʼи не записані; hero bgImage round-trip через curl; visible:false для faq → секція зникла з / → visible:true повернулась
- Браузерна верифікація (agent-browser): логін → всі 6 сторінок 200 з реальними даними; діалог товару: усі поля, чіпси категорій, валідація поганого slug inline, створення + видалення через AlertDialog пройдено в UI; media upload через UI + копіювання + видалення — цикл чистий; консоль без помилок (єдиний runtime error SelectItem value="" знайдений і виправлений sentinel "none")
- Прибрано всі eslint-disable (правила вимкнені в конфігу — директиви давали warnings «unused»)

Stage Summary:
- Файли: src/app/admin/(dash)/{products,categories,content,reviews,faq,media}/page.tsx (6 файлів, ~1200 рядків, клієнтські, локальні хелпери ImageInput/Stars/numStr/splitLines — жодних спільних змін, dashboard/orders не чіпані)
- Фічі: повний CRUD товарів (пошук+debounce, мультивибір категорій, upload фото, бейджі, inline active), категорій, відгуків, FAQ; редактор контенту з UK/EN табами, плейсхолдерами-дефолтами STRINGS, specials steps3 → data.uk.steps і kits → data.kits (KitItem productId "item-N"), масивні секції ticker/stats пишуться як верхньо-рівневі масиви, hero.bgImage двомовне; медіа з drag&drop + clipboard URL
- Контент-трансформації перевірені end-to-end: редагування в UI миттєво на / (deep-merge override → LangProvider), порожнє поле = дефолт, kits fallback на KITS для порожніх цін
- Перевірки: bun run lint — 0 problems; tsc src/ — 0 помилок; dev.log без помилок; усі /admin/* 200; БД після тестів чиста (23 товарів, 7 категорій, 6 відгуків, 5 FAQ, 0 медіа, усі секції data={} visible=true, uploads порожній)

---
Task ID: 5.6
Agent: Z.ai Code (main)
Task: Комплексна браузерна верифікація адмінки + CRM + фікси

Work Log:
- Agent Browser golden path: сайт рендерить 23 товари з БД (23 кнопки «Додати», hero OK)
- /admin без токена → 307 на /admin/login; логін → дашборд з реальними KPI (3 замовлення, 1 155 грн, середній чек 385 грн, чіпи статусів, топ-5 товарів)
- CRM /admin/orders: таблиця 3 замовлень, зміна статусу Select-ом у рядку → PATCH → БД підтверджено (new→cooking→new), діалог деталей, фільтри/пошук
- /admin/products: 23 рядки, пошук, «Додати товар»
- /admin/content: редагування hero badge → збереження → ТЕКСТ МИТТЄВО НА САЙТІ (server HTML); знайдено UX-дефект «неможливо повернути дефолт» → ВИПРАВЛЕНО: кнопка «Скинути» з AlertDialog-підтвердженням (PUT data:{}) + ремоунт редактора через key=updatedAt; повний цикл edit→save→reset→default перевірено в браузері
- Кошик сайту працює з товарами з БД (борщ XL → кошик OK)
- Мобільна 390px: адмін-бургер + KPI OK; консоль без помилок; lint 0

Stage Summary:
- Адмінка + CRM повністю верифіковані end-to-end
- Fix: reset-to-default у контент-редакторі (src/app/admin/(dash)/content/page.tsx)
- Доступи: /admin · admin / UbjVShucRTQXqm (.env)

---
Task ID: 6.1 (foundation)
Agent: Z.ai Code (main)
Task: Фундамент сторінок товарів: схема + демо-дані

Work Log:
- Product +descriptionUk/descriptionEn, +specs (JSON-рядок [{labelUk,valueUk,labelEn,valueEn}]), +productFaq (JSON-рядок [{qUk,aUk,qEn,aEn}]); Review +productSlug (String? — null = відгук про магазин для головної)
- db push OK; seed.ts: демо description/specs/productFaq для harcho-xl (7 specs, 3 faq) і borshch-xl (6 specs, 2 faq) — лише якщо descriptionUk порожній
- Публічні відгуки: автопублікація (isActive=true) з одразу на сторінці; модерація (приховати/видалити) — через існуючу адмінку Відгуки

Stage Summary:
- КОНТРАКТ: публічне API /api/reviews: GET ?slug=<slug> → {ok,data:[{id,author,rating,text,createdAt}]} (active, createdAt desc); POST {slug, author(2-40), rating(1-5), text(5-500)} → 201 {ok,data:review}; перевірка наявності товару; runtime nodejs; zod; 404 якщо товару немає
- specs/productFaq зберігаються в Product як JSON-РЯДКИ; admin products API приймає/віддає як string (валідувати JSON.parse)
- GET admin reviews: додати productName (join по productSlug) для відображення в адмінці

---
Task ID: 6.3
Agent: general-purpose (reviews API + admin UI)
Task: Публічні відгуки + поля товару в адмінці

Work Log:
- Створено src/app/api/reviews/route.ts (публічне, БЕЗ гварда, runtime nodejs): GET ?slug= → активні відгуки товару (isActive+productSlug, createdAt desc, {id,author,rating,text(=textUk),createdAt}); POST {slug,author,rating,text} → zod (slug 1..200, author 2..40, rating int 1..5, text 5..500, коди помилок slug_required/author_2_40/rating_1_5/text_5_500 у details) → перевірка товару (є й isActive, інакше 404 not_found) → Review {author,textUk,rating,productSlug,isActive:true,sort:1000} → 201; після POST revalidatePath(`/product/${slug}`); формат {ok,data}|{ok:false,error,details?}
- src/lib/admin-api.ts: додано JsonFieldRule + SPECS_RULE/ProductFaqRule + validateJsonStringArray (safe JSON.parse → not_array/item_i.key_must_be_string/too_long) — спільна валідація JSON-рядків Product.specs і Product.productFaq
- admin products API (route.ts + [id]/route.ts): у productSchema/productPatchSchema додано descriptionUk/descriptionEn (trim, ≤5000), specs + productFaq (string ≤100k, superRefine через validateJsonStringArray → 400 з детальним message); PATCH-поля optional (не перетирають), у PUT/POST дефолти ""/"[]"; GET віддає поля як є (strings — підтверджено)
- admin reviews API (route.ts + [id]/route.ts): у схеми додано productSlug (nullable; "" → null transform); GET списку робить db.product.findMany({slug,nameUk,nameEn}) → Map → додає productName (nameUk||nameEn; null якщо slug немає/товар видалено) до кожного відгуку
- /admin/products/page.tsx: AdminProduct +descriptionUk/En/specs/productFaq; ProductForm +descriptionUk/descriptionEn/specsUk/specsEn/faqItems; при завантаженні specs JSON → текстарі "labelUk = valueUk"/"labelEn = valueEn" (specsToFormText), productFaq → масив пар (faqToItems); при збереженні buildSpecsJson (пострічковий парсинг " = ", zip UK/EN за індексом, обидва порожні → "[]") і buildFaqJson (trim, пропуск пар з порожніми qUk І aUk); у діалозі: Опис UK/EN (rows 5) з hint «порожньо → автозгенерований опис», блок Характеристики (2 Textarea mono rows 6, hint «Формат: Назва = Значення, кожна з нового рядка», дефолти при порожніх), блок FAQ товару («+ Додати питання», 4 поля Q/A UK+EN на пару, кнопка видалення, hint про пропуск порожніх пар); payload POST/PUT містить усі 4 нові поля
- /admin/reviews/page.tsx: AdminReview +productSlug/productName; нова колонка «Товар» (hidden lg) з Badge outline amber: іконка Package + «Товар: <productName>» (fallback productSlug), «—» якщо productSlug немає; Badge import додано; решта CRUD не чіпана
- Тести (curl, dev:3000): login 200; POST /api/reviews валідний → 201 (id 9); GET ?slug=harcho-xl → відгук на місці; rating 9 → 400 validation; text "ок" → 400; author "Т" → 400; slug no-such-product → 404 not_found; GET без slug → 400; PATCH review isActive=false → GET [] → isActive=true повернено (фільтр працює); PATCH products/1 {specs:"[...Тест...]",productFaq:"[]"} → GET підтвердив → PUT-тест повного тіла спершу впав 400 через badge="ХІТ" у БД (дані перезасіяні паралельним агентом з UK-лейблами бейджів — поза зоною, повідомлено у Stage Summary), відкат зроблено PATCH-ом усіх 4 полів → RESTORED EXACTLY true; POST+PUT temp-товару з новими полями → echo коректний → DELETE; specs not_json/not_array/missing_key → 400 з деталями; POST temp-review → PATCH productSlug harcho-xl/null/"" → set/null/null → DELETE 200→404; admin reviews GET: review 9 productName = «Харчо грузинський XL з куркою» (перевірено ===), null-slug reviews productName=null; сторінки /admin/products, /admin/reviews, /product/harcho-xl → 200
- ЗАЛИШЕНО в БД: відгук id 9 «Тест Тестер» (rating 4, isActive:true, sort:1000, productSlug harcho-xl) — потрібен іншому агенту; temp-товар і temp-відгук видалено; descriptionUk/En, specs, productFaq harcho-xl відновлені байт-у-байт

Stage Summary:
- Файли: src/app/api/reviews/route.ts (новий), src/app/api/admin/products/route.ts + [id]/route.ts, src/app/api/admin/reviews/route.ts + [id]/route.ts, src/app/admin/(dash)/products/page.tsx, src/app/admin/(dash)/reviews/page.tsx, src/lib/admin-api.ts (хелпери JSON-валідації)
- Усі curl-тести пройдено: публічні відгуки (201/200/400/404), admin products specs/productFaq round-trip PATCH і PUT (PUT з новими полями OK на тест-товарі), admin reviews productName/productSlug
- bun run lint — 0 problems; tsc --noEmit src/ — 0 помилок; dev.log без помилок; тестовий відгук id 9 залишено активним у БД
- УВАГА для main-агента: у БД Product.badge тепер містить UK-лейбли («ХІТ»/«NEW»/«ПРЕМІУМ» замість hit/new/premium/deal) — перезасіяно паралельним агентом (products/page.tsx), через це PUT повного тіла товару з таким badge дає 400 validation; не конфлікт 6.3, але варто уніфікувати seed або схему

---
Task ID: 6.4
Agent: general-purpose (product page)
Task: Сторінка товару + відгуки + рекомендації

Work Log:
- products.ts: Product розширено descriptionUk/descriptionEn?, kcal?, weight?, specs?: ProductSpec[], productFaq?: ProductFaqItem[]; нові типи ProductSpec {labelUk,valueUk,labelEn?,valueEn?} і ProductFaqItem {qUk,aUk,qEn?,aEn?}
- site-data.ts: додано defensiv parseJsonArray<T>() (JSON.parse у try/catch → []); витягнуто спільний мапер mapDbProduct(p: DbProduct) (тип з @prisma/client) — використовується і в getSiteData, і на сторінці товару; існуючий мапінг nameEn/shortEn/portionEn не зламано; mapBadge тепер приймає і EN-слаги (hit/new/premium/deal), і UK-лейбли («ХІТ»/«NEW»/«ПРЕМІУМ»/«-15%») після пересіву БД паралельним агентом (6.3/6.x) — це також полагодило бейджі на головній
- ProductCard: зображення й назва обгорнуті у <Link href={`/product/${p.id}`}> (next/link), кнопка «Додати в кошик» лишилась окремим елементом; tilt-анімація не зламана (hover-scale img через group працює)
- i18n.ts: нова група рядків productPage (uk+en): breadcrumbs, кошик/qty/економія, чіпси (kcal/вага/10 хв/12 міс), заголовки секцій, форма відгука + помилки, «З цим часто беруть», «будьте першим»
- app/product/[slug]/page.tsx (server, dynamic="force-dynamic"): generateMetadata (назва/shortUk/description, OG image), notFound() якщо немає/!isActive; Prisma-запити: product isActive, reviews (productSlug, isActive, createdAt desc), категорія (db.category → фолбек CATEGORIES); рекомендації: перша категорія з cats CSV (cats contains), виключити поточний, take 4, якщо <2 — добір ХІТ/NEW (badge в обох форматах); JSON.parse specs/productFaq відбувається в mapDbProduct (try/catch); JSON-LD Product schema (offers UAH, aggregateRating при reviewCount>0); обгортка як на головній: Navbar+main+Footer+CartDrawer
- components/product/ (усі "use client", useLang, семантичні токени, mobile-first, framer-motion reveal): SectionTitle (спільний заголовок), ProductView (breadcrumbs Головна(/)/Категорія(/#catalog)/назва; плаваюче фото rounded-3xl + Steam + бейджі; rating-зірки amber; ціна + стара + «економія»; порція; qty-лічильник −/+ (дод. qty штук в кошик через zustand add у циклі); чіпси kcal/weight/готово за 10 хв/без холодильника; toast sonner), ProductDescription (опис по \n\n; фолбек short + 2 абзаци про сублимацію/приготування UK/EN), ProductSpecs (таблиця зебра + іконки Timer/Flame/ShieldCheck за ключовими словами; фолбек з portion/kcal/weight/10 хв/12 міс/категорія), ProductFaqSection (shadcn Accordion; фолбек 3 загальні Q/A про приготування/зберігання/доставку UK+EN), ProductReviews (зведення: середнє зі списку інакше product.rating + зірки + count; card-glass картки з аватаром-буквицею і датою dd.MM.yyyy; skeleton при завантаженні; empty state; форма: Input + інтерактивні зірки 1–5 (hover+keyboard) + Textarea; клієнтська валідація (імʼя, оцінка, текст ≥5) з toast.error; POST /api/reviews → toast.success + банер «Дякуємо!» + рефреш GET, фолбек — додати локально; граційна обробка недоступного API), Recommendations (сітка 2/4 з існуючим ProductCard)
- Тестування: dev-сервер :3000; /product/harcho-xl 200 з усіма секціями (description/specs/faq/reviews/recommendations) і JSON-LD; /product/nonexistent → 404; головна містить /product/harcho-xl лінки (img+назва); /product/plov-basmati — усі фолбеки (спеки, опис, FAQ, порожній стан відгуків); agent-browser: додано в кошик qty=2 (бейдж 1→3), форма відгука E2E через живе /api/reviews (thanks-банер + рефреш списку), EN-перемикання (breadcrumbs/опис/чіпси EN), mobile 390px без горизонтального скролу; власний E2E-відгук деактивовано (isActive=false), залишено тест-відгук паралельного агента (id 9)

Stage Summary:
- Файли: src/lib/products.ts (типи), src/lib/site-data.ts (parseJsonArray, mapDbProduct, mapBadge uk+en), src/lib/i18n.ts (productPage uk/en), src/components/kharchi/ProductCard.tsx (лінки), НОВІ: src/app/product/[slug]/page.tsx, src/components/product/{SectionTitle,ProductView,ProductDescription,ProductSpecs,ProductFaqSection,ProductReviews,Recommendations}.tsx
- Фічі: повна сторінка товару з БД (опис/спеки/FAQ/відгуки/рекомендації), автододавання в кошик з кількістю, публічна форма відгуків на /api/reviews, JSON-LD, метадані, 404, breadcrumbs, двомовність UK/EN, dark/light, WOW-анімації (float, steam, reveal)
- Тести: curl 200/404 OK; усі фолбеки перевірено на товарах без опису в БД; agent-browser E2E (кошик qty, відгук, EN, mobile) OK; bun run lint — 0 problems; tsc --noEmit src/ — 0 помилок; dev.log без ⨯/error, GET / 200 (головна не зламана, бейджі на головній полагоджено завдяки mapBadge uk/en)
- Нотатка: лейбл категорії для breadcrumbs береться з db.category, фолбек — CATEGORIES; reviewsCount на сторінці = живі відгуки ?? product.reviewsCount; тест-відгук id 9 («Тест Тестер») у БД лишився активним — moderated через адмінку
---

---
Task ID: 6.5-6.6
Agent: Z.ai Code (main)
Task: Верифікація сторінки товару + фікс isActive + архів

Work Log:
- E2E у браузері: /product/harcho-xl рендерить усі секції (hero з ціною/qty/кошиком, Опис з БД, Характеристики-таблиця, FAQ-акордеон, Відгуки, Рекомендації, JSON-LD)
- Форма відгуку: зірки 1-5 (radioroup) + імʼя + текст → POST /api/reviews 201 → «Дякуємо» + відгук Вероніки (4★) у списку; зведення 4.3 середнє перераховується
- Знайдено і виправлено: harcho-xl.isActive=false (залишок curl-тестів агента) → сторінка товару 404 і товар зникав з каталогу → isActive=true, 23 активних
- Бейджі нормалізовано до слагів (hit/new/premium/deal) у БД + seed (BADGE_SLUG); mapBadge приймає обидва формати
- Адмін-цикл: форма товару префіллена (опис, характеристики «Назва = Значення», FAQ) → правка опису → збереження → миттєво на сторінці товару (перевірено в HTML)
- Адмін-відгуки: колонка «Товар» з productName; тест-смітивидалено, засіяно 3 реалістичні товарні відгуки (seed)
- Мобільна 390px: без горизонтального скролу; lint 0; 404 для неіснуючих товарів
- Архів harchi-food-site.zip оновлено (корінь + public/)

Stage Summary:
- Повний цикл: головна → картка товару (лінк) → сторінка з описом/характеристиками/FAQ/відгуками/рекомендаціями → залишити відгук → адмінка (модерація + редагування товару) → зміни миттєво на сайті

---
Task ID: 7.1
Agent: Cline
Task: Перенос бекапу harchifood.com (temp/site) у проєкт — ассети + контент у БД

Work Log:
- Бекап temp/site: 668/668 сторінок, ~350+ файлів uploads (докачка фоном через dlall.py asset_priority.txt: 3382 URL = 579 оригіналів + 2803 мініатури; попередні збої — рейт-ліміт при 8 паралельних шардах, перезапущено з 3)
- prisma/schema.prisma: додано модель ContentPage (slug@id, kind page|post, title/excerpt/body uk+en, coverImage, legacyUrl, publishedAt, isActive, sort, seoTitle/Desc) → npx prisma db push --accept-data-loss
- .zscripts/catalog-map.cjs — згенеровано (extract-catalog-map.cjs): LIVE_CATS (8 категорій), WOO_TO_LOCAL (41 слаг), BULK-рівні
- .zscripts/import-assets.cjs (ідемпотентний): інвентар temp/site/wp-content/uploads → public/uploads/YYYY/MM (мініатюри мапляться на оригінали), фото товарів → public/products/<localSlug>.<ext> + Product.image, бренд-лого → public/brand/legacy-*, MediaAsset upsert, карта download/legacy-assets.json (3229 URL). media=70 у БД, 63 файли public/products (заповнено ще sync-live-catalog)
- .zscripts/import-content.cjs (ідемпотентний, upsert по slug): джерело temp/site/_api/wp-json_wp_v2_{pages,posts,media}_p1.json; SKIP_SLUGS — 21 службова (cart/checkout/my-account тощо); чистка body: script/style/iframe/коментарі/шорткоди/font, декодування entity; локалізація посилань через legacy-assets.json (з фолбеком мініатюра→оригінал); excerpt з першого абзацу (excerptFrom), cover з featured_media→мапа або перша картка body; publishedAt з WP date; seo-поля. Dry-run + реальний прогін
- Результат імпорту: ContentPage 18 сторінок + 8 постів, пропущено 45 (службові/порожні), scripts у body=0, шорткодів=0; download/content-import-report.json — звіт по кожному slug
- Автофіналізація: temp/finalize-import.cmd (запущений у фоні) чекає завершення python-докачки, потім сам перезапускає import-assets + import-content (мапа стане повною → віддалені зображення в body локалізуються) і пише download/finalize-import.log
- temp/ не комітиться (у .gitignore)

Stage Summary:
- Уся статика старого сайту доступна у public/uploads (структура YYYY/MM збережена), контент сторінок/постів — у ContentPage (uk), медіатека адмінки наповнена (MediaAsset)
- Далі (редизайн): публічний рендер контенту (роут /content/[slug] або /blog) з bodyUk через dangerouslySetInnerHTML (уже чисто), обкладинки, перелинковка legacy URL → нові роути; перегенерувати імпорти після докачки ассетів (finalize-import.cmd зробить сам)
