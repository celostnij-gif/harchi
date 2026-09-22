/**
 * Перенос ассетів зі бекапу старого сайту у публічну теку Next.js.
 *
 * Джерело: temp/site/wp-content/uploads/**  (бекап harchifood.com)
 * Куди:
 *   public/uploads/<YYYY>/<MM>/<file>      — фото/медіа зі збереженням структури
 *   public/products/<localSlug>.<ext>      — фото товарів (оригінал), + Product.image
 *   public/brand/<file>                    — лого/бренд
 * Побічно:
 *   download/legacy-assets.json            — карта старий-URL → локальний шлях
 *   MediaAsset (upsert)                    — наповнює медіатеку адмінки
 *
 * Ідемпотентний. Запуск:
 *   node .zscripts/import-assets.cjs [--dry-run]
 */
const { PrismaClient } = require("@prisma/client");
const {
  existsSync, statSync, mkdirSync, copyFileSync, readdirSync, readFileSync, writeFileSync,
} = require("node:fs");
const { join, dirname, extname, basename } = require("node:path");
const { WOO_TO_LOCAL } = require("./catalog-map.cjs");

const db = new PrismaClient();
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "temp", "site");
const UPLOADS_SRC = join(SRC, "wp-content", "uploads");
const PUBLIC = join(ROOT, "public");
const PRODUCTS = join(PUBLIC, "products");
const BRAND = join(PUBLIC, "brand");
const MAP_OUT = join(ROOT, "download", "legacy-assets.json");
const WOO_JSON = join(ROOT, "download", "harchi-products.json");
const DRY = process.argv.includes("--dry-run");

const THUMB_RE = /-\d+x\d+(\.(?:png|jpe?g|gif|webp|avif))$/i;
const IMG_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"]);

const stats = { copied: 0, skipped: 0, missing: 0, mapped: 0, productImages: 0, media: 0 };

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

function copyIfNeeded(src, dst) {
  if (existsSync(dst)) {
    try {
      if (statSync(dst).size === statSync(src).size) {
        stats.skipped++;
        return true;
      }
    } catch {
      /* перезапишемо */
    }
  }
  if (DRY) {
    stats.copied++;
    return true;
  }
  ensureDir(dirname(dst));
  copyFileSync(src, dst);
  stats.copied++;
  return true;
}

/** URL у бекапі → абсолютний шлях у temp/site */
function urlToBackupPath(url) {
  const m = String(url || "").match(/harchifood\.com\/(.+)$/i);
  if (!m) return null;
  const rel = decodeURIComponent(m[1].split("#")[0].split("?")[0]);
  return { rel, abs: join(SRC, rel.replace(/\//g, "\\")) };
}

/** Крок 1: інвентар завантажених uploads у бекапі → карта URL → локальний шлях */
function buildUploadsMap() {
  const map = {};              // oldAbsUrl → localUrl
  const files = walk(UPLOADS_SRC);
  const originals = new Set();
  for (const abs of files) {
    const rel = abs.slice(UPLOADS_SRC.length + 1).replace(/\\/g, "/");
    if (!THUMB_RE.test(rel)) originals.add(rel);
  }
  const targets = new Map();   // targetRel → srcAbs
  for (const abs of files) {
    const rel = abs.slice(UPLOADS_SRC.length + 1).replace(/\\/g, "/");
    const ext = extname(rel).toLowerCase();
    if (!IMG_EXT.has(ext)) continue;
    let targetRel = rel;
    if (THUMB_RE.test(rel)) {
      const originalRel = rel.replace(THUMB_RE, "$1");
      targetRel = originals.has(originalRel) ? originalRel : rel;
    }
    targets.set(targetRel, abs);
  }
  const sizes = ["100x100", "150x150", "300x300", "400x400", "500x500", "600x600", "768x768", "1024x1024"];
  for (const [targetRel, srcAbs] of targets) {
    const dst = join(PUBLIC, "uploads", targetRel.replace(/\//g, "\\"));
    copyIfNeeded(srcAbs, dst);
    const localUrl = "/uploads/" + targetRel;
    map["https://harchifood.com/wp-content/uploads/" + targetRel] = localUrl;
    map["http://harchifood.com/wp-content/uploads/" + targetRel] = localUrl;
    const ext = extname(targetRel).toLowerCase();
    const noExt = targetRel.slice(0, targetRel.length - ext.length);
    for (const size of sizes) {
      map["https://harchifood.com/wp-content/uploads/" + noExt + "-" + size + ext] = localUrl;
    }
  }
  stats.mapped = Object.keys(map).length;
  console.log("uploads у бекапі: файлів=%d, унікальних оригіналів=%d, карта=%d URL",
    files.length, targets.size, stats.mapped);
  return map;
}

/** Крок 2: фото товарів → public/products/<localSlug>.<ext> + Product.image */
async function importProductImages(map) {
  if (!existsSync(WOO_JSON)) {
    console.log("! немає download/harchi-products.json — фото товарів пропущено");
    return;
  }
  const woo = JSON.parse(readFileSync(WOO_JSON, "utf8"));
  const bySlug = new Map(woo.map((p) => [p.slug, p]));
  for (const [wooSlug, localSlug] of Object.entries(WOO_TO_LOCAL)) {
    const w = bySlug.get(wooSlug);
    const img = w?.images?.[0];
    if (!img) continue;
    let bp = urlToBackupPath(img.src || "");
    if (!bp || !existsSync(bp.abs)) bp = urlToBackupPath(img.thumbnail || "");
    if (!bp || !existsSync(bp.abs)) {
      stats.missing++;
      continue;
    }
    const ext = extname(bp.abs).toLowerCase();
    const dst = join(PRODUCTS, localSlug + ext);
    copyIfNeeded(bp.abs, dst);
    const localUrl = "/products/" + localSlug + ext;
    if (img.src) map[img.src] = localUrl;
    await setProductImage(localSlug, localUrl);
    await registerMedia("products/" + localSlug + ext, dst);
    for (let i = 1; i < Math.min(w.images.length, 4); i++) {
      const img2 = w.images[i];
      const bp2 = urlToBackupPath(img2.src || "");
      if (bp2 && existsSync(bp2.abs)) {
        const ext2 = extname(bp2.abs).toLowerCase();
        const name = localSlug + "-g" + i + ext2;
        copyIfNeeded(bp2.abs, join(PRODUCTS, name));
        map[img2.src] = "/products/" + name;
        await registerMedia("products/" + name, join(PRODUCTS, name));
      }
    }
  }
}

async function setProductImage(localSlug, url) {
  const row = await db.product.findUnique({ where: { slug: localSlug } });
  if (!row || row.image === url) return;
  if (!DRY) await db.product.update({ where: { slug: localSlug }, data: { image: url } });
  stats.productImages++;
}

async function registerMedia(relFromPublic, absPath) {
  if (!existsSync(absPath)) return;
  const rel = relFromPublic.replace(/\\/g, "/");
  if (!DRY) {
    await db.mediaAsset.upsert({
      where: { filename: rel },
      create: { filename: rel, url: "/" + rel, size: statSync(absPath).size },
      update: { url: "/" + rel, size: statSync(absPath).size },
    });
  }
  stats.media++;
}

/** Крок 3: бренд-файли (лого старого сайту тощо) */
async function importBrand(map) {
  const cands = [
    "wp-content/uploads/2015/01/logotype.jpg",
    "wp-content/uploads/2021/09/logo_harchi_2.png",
    "wp-content/uploads/2015/01/logo.png",
  ];
  for (const rel of cands) {
    const abs = join(SRC, rel.replace(/\//g, "\\"));
    if (!existsSync(abs)) continue;
    const name = "legacy-" + basename(rel);
    copyIfNeeded(abs, join(BRAND, name));
    map["https://harchifood.com/" + rel] = "/brand/" + name;
    await registerMedia("brand/" + name, join(BRAND, name));
  }
}

async function main() {
  if (!existsSync(SRC)) {
    console.error("Немає бекапу: " + SRC);
    process.exit(1);
  }
  const map = buildUploadsMap();
  await importProductImages(map);
  await importBrand(map);
  if (!DRY) {
    ensureDir(join(ROOT, "download"));
    writeFileSync(MAP_OUT, JSON.stringify(map, null, 2), "utf8");
  }
  console.log("карта ассетів:", MAP_OUT);
  console.log("стат:", JSON.stringify(stats));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

