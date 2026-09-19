import type { UIStrings } from "./i18n";

/**
 * Описи секцій для адмін-редактора контенту.
 * Кожна секція = рядок SectionContent у БД: { uk: {...}, en: {...} } —
 * deep-merge поверх дефолтних STRINGS з i18n.ts.
 * Порожні поля в формі = «залишити дефолт» (не пишуться в БД).
 */

export type FieldType = "text" | "textarea" | "list" | "image";

export interface FieldDef {
  key: string; // ключ у JSON секції (в межах свого UIStrings-розділу)
  label: string;
  type: FieldType;
  hint?: string;
}

export interface SectionDef {
  key: string; // ключ SectionContent
  label: string; // назва в адмінці
  desc: string;
  fields: FieldDef[];
  /** Особливі редактори (кроки/набори) рендеряться окремим блоком */
  special?: "steps3" | "kits";
}

export const SECTION_DEFS: SectionDef[] = [
  {
    key: "nav",
    label: "Навігація",
    desc: "Пункти меню у шапці сайту",
    fields: [
      { key: "catalog", label: "Каталог", type: "text" },
      { key: "kits", label: "Набори ПХД", type: "text" },
      { key: "how", label: "Як готується", type: "text" },
      { key: "reviews", label: "Відгуки", type: "text" },
      { key: "faq", label: "Питання", type: "text" },
      { key: "cart", label: "Кошик", type: "text" },
      { key: "menu", label: "Меню (бургер)", type: "text" },
    ],
  },
  {
    key: "hero",
    label: "Hero (перший екран)",
    desc: "Головний банер: заголовок, підзаголовок, кнопки, чіпси",
    special: undefined,
    fields: [
      { key: "badge", label: "Бейдж над заголовком", type: "text" },
      { key: "h1a", label: "Заголовок — частина 1", type: "text" },
      { key: "h1b", label: "Заголовок — акцентна частина", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
      { key: "pAccent", label: "Акцентний рядок опису", type: "text" },
      { key: "cta", label: "Кнопка №1", type: "text" },
      { key: "how", label: "Кнопка №2", type: "text" },
      {
        key: "chips",
        label: "Чіпси-переваги",
        type: "list",
        hint: "Кожен пункт з нового рядка",
      },
      {
        key: "bgImage",
        label: "Фонове зображення",
        type: "image",
        hint: "URL або завантажте файл у Медіа",
      },
    ],
  },
  {
    key: "ticker",
    label: "Бігучий рядок",
    desc: "Стрічка під Hero",
    fields: [
      {
        key: "items",
        label: "Фрази",
        type: "list",
        hint: "Кожна фраза з нового рядка",
      },
    ],
  },
  {
    key: "stats",
    label: "Статистика",
    desc: "Лейбли під числами (числа анімовані в коді)",
    fields: [
      {
        key: "labels",
        label: "Лейбли (4 шт.)",
        type: "list",
        hint: "Кожен лейбл з нового рядка",
      },
    ],
  },
  {
    key: "catalog",
    label: "Каталог — заголовок",
    desc: "Шапка секції меню",
    fields: [
      { key: "label", label: "Лейбл", type: "text" },
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
    ],
  },
  {
    key: "xl",
    label: "Банер Харчі XL",
    desc: "Промо-блок подвійних порцій",
    fields: [
      { key: "badge", label: "Бейдж", type: "text" },
      { key: "h2sub", label: "Підзаголовок", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
      { key: "cta", label: "Кнопка", type: "text" },
      { key: "link", label: "Посилання кнопки", type: "text" },
    ],
  },
  {
    key: "kits",
    label: "Набори ПХД",
    desc: "Заголовки + 3 комплекти з цінами",
    special: "kits",
    fields: [
      { key: "label", label: "Лейбл", type: "text" },
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
      { key: "featureTitle", label: "Заголовок переваги", type: "text" },
      { key: "featureText", label: "Текст переваги", type: "textarea" },
      { key: "featurePoint1", label: "Перевага — пункт 1", type: "text" },
      { key: "featurePoint2", label: "Перевага — пункт 2", type: "text" },
      { key: "featurePoint3", label: "Перевага — пункт 3", type: "text" },
    ],
  },
  {
    key: "how",
    label: "Як готується",
    desc: "3 кроки приготування",
    special: "steps3",
    fields: [
      { key: "label", label: "Лейбл", type: "text" },
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
    ],
  },
  {
    key: "reviews",
    label: "Відгуки — заголовок",
    desc: "Шапка секції (самі відгуки — окрема сторінка)",
    fields: [
      { key: "label", label: "Лейбл", type: "text" },
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
    ],
  },
  {
    key: "faq",
    label: "FAQ — заголовок",
    desc: "Шапка секції (питання — окрема сторінка)",
    fields: [
      { key: "label", label: "Лейбл", type: "text" },
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
    ],
  },
  {
    key: "cta",
    label: "Фінальний CTA",
    desc: "Останній заклик перед футером",
    fields: [
      { key: "h2a", label: "Заголовок — частина 1", type: "text" },
      { key: "h2b", label: "Заголовок — акцент", type: "text" },
      { key: "p", label: "Опис", type: "textarea" },
      { key: "button", label: "Кнопка", type: "text" },
    ],
  },
  {
    key: "footer",
    label: "Футер",
    desc: "Нижній блок сайту",
    fields: [
      {
        key: "links",
        label: "Посилання",
        type: "list",
        hint: "Кожне з нового рядка",
      },
      { key: "rights", label: "Копірайт", type: "text" },
      { key: "concept", label: "Опис концепції", type: "textarea" },
    ],
  },
  {
    key: "cart",
    label: "Кошик / Оформлення",
    desc: "Ключові тексти кошика та чекауту",
    fields: [
      { key: "title", label: "Заголовок кошика", type: "text" },
      { key: "empty", label: "Порожній кошик", type: "text" },
      { key: "emptyHint", label: "Підказка порожнього кошика", type: "text" },
      { key: "checkout", label: "Кнопка оформлення", type: "text" },
      { key: "note", label: "Примітка", type: "text" },
      { key: "successTitle", label: "Заголовок успіху", type: "text" },
      { key: "successText", label: "Текст успіху", type: "textarea" },
    ],
  },
];

export const SECTION_LABELS: Record<string, string> = Object.fromEntries(
  SECTION_DEFS.map((s) => [s.key, s.label])
);
