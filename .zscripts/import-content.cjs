/**
 * Перенос сторінок і постів зі бекапу старого сайту (WordPress REST дамп) у БД.
 *
 * Джерело: temp/site/_api/wp-json_wp_v2_{pages,posts,media}_p*.json
 * Карта ассетів: download/legacy-assets.json (генерує import-assets.cjs)
 * Куди: ContentPage (kind: page | post), посилання на /uploads/..., /products/...
 *
 * Ідемпотентний (upsert по slug). Запуск:
 *   node .zscripts/import-content.cjs [--dry-run]
 */
const { PrismaClient } = require("@prisma/client");
const { existsSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const db = new PrismaClient();
const ROOT = join(__dirname, "..");
const API = join(ROOT, "temp", "site", "_api");
const ASSET_MAP = join(ROOT, "download", "legacy-assets.json");
const REPORT = join(ROOT, "download", "content-import-report.json");
const DRY = process.argv.includes("--dry-run");

/** Службові сторінки WooCommerce/WP — не переносимо (у проєкті свої еквіваленти) */
const SKIP_SLUGS = new Set([
  "cart", "checkout", "checkout-2", "my-account", "all-reviews",
  "affiliate-area", "affiliate-area-2", "purchase-confirmation",
  "purchase-history", "transaction-failed", "zamovlennya-skasovano",
  "oplata-ne-uspishna", "oplata-uspishna", "wc-api-wc_ecc",
  "spovishhennya-torgovczya", "ya", "ghf", "slyders",
  "saphali-shop-product-price", "8202-2",
  "rik-pislya-udaru-istoriya-vidnovlennya-harchiv-2",
]);

const stats = { pages: 0, posts: 0, skipped: 0, imgLocal: 0, imgRemote: 0, cover: 0 };

function readJson(name) {
  const p = join(API, name);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    console.error("! не читається", name, e.message);
    return null;
  }
}

function decodeEntities(s) {
  return String(s || "")
    .replace(/&#8217;|&#8216;|&rsquo;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .trim();
}

function stripTags(html) {
  return decodeEntities(String(html || "").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Чистка WP-HTML: скрипти, шорткоди, розміри, lazy-атрибути + локалізація посилань */
function cleanBody(html, legacyMap, catalogMaps) {
  let s = String(html || "");

  s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  s = s.replace(/<p>\s*(&nbsp;|\s)*<\/p>/gi, "");
  s = s.replace(/\[caption[^\]]*\]|\[\/caption\]/gi, "");
  s = s.replace(/\[(?:\/)?[a-z][a-z0-9_-]{1,25}(?:\s[^\]]{0,200})?\]/gi, "");
  s = s.replace(/<\/?font[^>]*>/gi, "");

  const mapAsset = (u) => {
    if (!u) return null;
    const direct = legacyMap[u];
    if (direct) return direct;
    const norm = u.replace(/^http:\/\//i, "https://");
    if (legacyMap[norm]) return legacyMap[norm];
    if (legacyMap[norm.replace(/^https:\/\/www\./, "https://")]) {
      return legacyMap[norm.replace(/^https:\/\/www\./, "https://")];
    }
    const stripped = norm.replace(/-\d+x\d+(\.(?:png|jpe?g|gif|webp|avif))$/i, "$1");
    if (legacyMap[stripped]) return legacyMap[stripped];
    return null;
  };

  const mapLink = (u) => {
    const m = String(u || "").match(/^https?:\/\/(?:www\.)?harchifood\.com\/(.*)$/i);
    if (!m) return null;
    const rel = m[1].replace(/\/$/, "");
    const parts = rel.split("/");
    const slug = decodeURIComponent(parts[parts.length - 1] || "");
    if (catalogMaps.productSlugs.has(slug)) return "/product/" + slug;
    if (catalogMaps.postSlugs.has(slug)) return "/blog/" + slug;
    if (catalogMaps.pageSlugs.has(slug)) return "/info/" + slug;
    if (rel === "usi-tovari" || parts[0] === "product-category" || rel === "shop") return "/#catalog";
    return null;
  };

  /* img/src + srcset + lazy-атрибути */
  s = s.replace(/<(img|source)\b([^>]*)>/gi, (full, tag, attrs) => {
    let a = attrs;
    const srcM = a.match(/\b(?:data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i);
    const rawSrc = srcM ? srcM[1] : "";
    let local = mapAsset(rawSrc) || (rawSrc.startsWith("/") ? rawSrc : null);
    if (local) stats.imgLocal++;
    else if (rawSrc) stats.imgRemote++;

    a = a.replace(/\s(?:width|height|sizes|loading|decoding|srcset|data-srcset|data-src|data-lazy-src|data-lazy-sizes|data-attachment-id|data-permalink|data-orig-file|data-orig-size|data-comments-opened|data-image-meta|data-image-title|data-image-description)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    if (local) {
      a = ` src="${local}"` + a;
    } else if (rawSrc) {
      a = ` src="${rawSrc}"` + a;
    }
    return `<${tag}${a}>`;
  });

  /* <a href> — внутрішні посилання на нові роути */
  s = s.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    const hrefM = attrs.match(/\bhref\s*=\s*["']([^"']+)["']/i);
    if (!hrefM) return full;
    const local = mapLink(hrefM[1]);
    if (!local) return full;
    return `<a${attrs.replace(hrefM[1], local)}>`;
  });

  /* Загальна чистка */
  s = s.replace(/\s(?:data-[a-z0-9-]+)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s.replace(/(<\/?(?:div|span)[^>]*>)\s*(?=\n?\s*$)/gi, "");
  return s.trim();
}

function firstLocalImage(bodyHtml) {
  const m = String(bodyHtml || "").match(/<img[^>]*\bsrc\s*=\s*["'](\/[^"']+)["']/i);
  return m ? m[1] : "";
}

function excerptFrom(bodyHtml, max = 200) {
  const text = stripTags(
    String(bodyHtml || "")
      .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
      .replace(/<img[^>]*>/gi, " ")
  );
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return (sp > 60 ? cut.slice(0, sp) : cut) + "…";
}

function firstHeadingTitle(html) {
  const m = String(html || "").match(/<h[12][^>]*>([\s\S]{2,200}?)<\/h[12]>/i);
  return m ? stripTags(m[1]).slice(0, 120) : "";
}

function humanize(slug) {
  const s = String(slug || "").replace(/-/g, " ").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "Без назви";
}

async function main() {
  const legacyMap = existsSync(ASSET_MAP)
    ? JSON.parse(readFileSync(ASSET_MAP, "utf8"))
    : {};
  if (!Object.keys(legacyMap).length) {
    console.log("! немає download/legacy-assets.json — спочатку запусти import-assets.cjs");
  }

  const pages = readJson("wp-json_wp_v2_pages_p1.json") || [];
  const posts = readJson("wp-json_wp_v2_posts_p1.json") || [];
  const media = [...(readJson("wp-json_wp_v2_media_p1.json") || []), ...(readJson("wp-json_wp_v2_media_p2.json") || [])];

  const mediaById = new Map();
  for (const m of media) {
    const u = m?.source_url || m?.guid?.rendered || "";
    if (u) mediaById.set(m.id, u);
  }

  const productSlugs = new Set((await db.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  const pageSlugs = new Set(pages.map((p) => p.slug).filter((s) => s && !SKIP_SLUGS.has(s)));
  const postSlugs = new Set(posts.map((p) => p.slug).filter(Boolean));
  const catalogMaps = { productSlugs, pageSlugs, postSlugs };

  const report = [];
  let sources = [
    ...pages.map((p) => ({ item: p, kind: "page" })),
    ...posts.map((p) => ({ item: p, kind: "post" })),
  ];
  let sort = 0;
  for (const { item, kind } of sources) {
    sort += 10;
    const slug = String(item.slug || "").trim();
    if (!slug) continue;
    if (SKIP_SLUGS.has(slug)) {
      stats.skipped++;
      report.push({ slug, kind, status: "skipped_service" });
      continue;
    }
    const rawBody = item?.content?.rendered || "";
    if (stripTags(rawBody).length < 15) {
      stats.skipped++;
      report.push({ slug, kind, status: "skipped_empty" });
      continue;
    }
    const body = cleanBody(rawBody, legacyMap, catalogMaps);

    let title = stripTags(item?.title?.rendered || "");
    if (!title) title = firstHeadingTitle(body) || humanize(slug);
    const excerpt = excerptFrom(rawBody, 220);

    let cover = "";
    const fm = item.featured_media;
    if (fm && mediaById.has(fm)) {
      cover = legacyMap[mediaById.get(fm)] || "";
    }
    if (!cover) cover = firstLocalImage(body);
    if (cover) stats.cover++;

    const publishedAt = item.date ? new Date(item.date.replace(" ", "T")) : null;
    const data = {
      slug,
      kind,
      legacyUrl: item.link || "",
      titleUk: title.slice(0, 250),
      titleEn: "",
      excerptUk: excerpt,
      excerptEn: "",
      bodyUk: body,
      bodyEn: "",
      coverImage: cover,
      publishedAt: publishedAt && !isNaN(publishedAt.getTime()) ? publishedAt : null,
      isActive: true,
      sort,
      seoTitleUk: `${title.slice(0, 120)} — Харчі`,
      seoDescUk: (excerpt || title).slice(0, 300),
    };
    if (!DRY) {
      await db.contentPage.upsert({ where: { slug }, create: data, update: data });
    }
    if (kind === "post") stats.posts++;
    else stats.pages++;
    report.push({
      slug, kind, status: "imported", title,
      bodyLen: body.length,
      legacyUrl: data.legacyUrl,
      cover,
      imagesLocal: (body.match(/src="\/uploads\//g) || []).length,
      imagesRemote: (body.match(/src="https?:\/\//g) || []).length,
    });
  }

  if (!DRY) writeFileSync(REPORT, JSON.stringify({ stats, report }, null, 2), "utf8");
  console.log("imported:", JSON.stringify(stats));
  console.log("report:", REPORT);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

