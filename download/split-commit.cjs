/**
 * Розбиває початковий коміт на серію дрібних комітів, щоб push мав шанс
 * пройти частинами (канал обриває великі POST-пакети з HTTP 408).
 * Кожен коміт несе ≤ ~1.5 МБ вмісту.
 * Використання: node download/split-commit.cjs
 * Результат: download/push-order.txt — SHA комітів у порядку пуша.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const MAX_BYTES = 1.5 * 1024 * 1024; // цільовий розмір коміта
const MAX_FILES = 20; // і не більше 20 файлів

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

// --- Запобіжники ---
const cnt = parseInt(sh("git rev-list --count HEAD").trim(), 10);
if (cnt !== 1) {
  console.error(`Очікую рівно 1 коміт, знайдено ${cnt}. Скрипт працює лише з початковим станом.`);
  process.exit(1);
}
const remoteRefs = sh("git ls-remote origin || true").trim();
if (remoteRefs) {
  console.error("Ремоут не порожній — розбивка не потрібна/небезпечна. Виходжу.");
  process.exit(1);
}

// --- Зібрати файли з розмірами (fs.stat — надійно на будь-якій ОС) ---
const files = sh("git ls-files -z")
  .split("\0")
  .filter(Boolean)
  .map((p) => {
    let size = 0;
    try {
      size = fs.statSync(p).size;
    } catch {
      size = 0; // видалені/перейменовані — рідкість у initial commit
    }
    return { size, path: path.normalize(p).split(path.sep).join("/") };
  });

console.log(`Файлів у коміті: ${files.length}, сумарно ${(files.reduce((s, f) => s + f.size, 0) / 1048576).toFixed(1)} МБ`);

// Найбільші — першими, щоб великі фото не зібралися в одному місці
files.sort((a, b) => b.size - a.size);

// --- Розкласти на чанки ---
const chunks = [];
let cur = { files: [], bytes: 0 };
for (const f of files) {
  if (cur.files.length > 0 && (cur.bytes + f.size > MAX_BYTES || cur.files.length >= MAX_FILES)) {
    chunks.push(cur);
    cur = { files: [], bytes: 0 };
  }
  cur.files.push(f);
  cur.bytes += f.size;
}
if (cur.files.length) chunks.push(cur);
console.log(`Чанків: ${chunks.length}`);

// --- Переписати історію: unborn HEAD → коміти по чанках ---
sh("git update-ref -d HEAD"); // гілка без комітів, індекс лишається повним
sh("git reset -q"); // повністю розстейджити

const shas = [];
for (let i = 0; i < chunks.length; i++) {
  const c = chunks[i];
  for (const f of c.files) sh(`git add -- "${f.path}"`);
  sh(`git commit -q -m "Add project files (part ${i + 1} of ${chunks.length})"`);
  shas.push(sh("git rev-parse HEAD").trim());
  process.stdout.write(`  part ${i + 1}/${chunks.length}: ${c.files.length} файлів, ${(c.bytes / 1048576).toFixed(2)} МБ\n`);
}

// --- Контроль: сума дерев має збігтися зі старим комітом ---
const oldTree = "815a10d"; // початковий коміт (зроблений до розбивки)
const oldList = sh("git ls-tree -r --name-only 815a10d")
  .split("\n")
  .filter(Boolean)
  .sort()
  .join("\n");
const newList = sh("git ls-files").split("\n").filter(Boolean).sort().join("\n");
if (oldList !== newList) {
  console.error("⚠️ Список файлів НЕ збігається з початковим комітом! Перевір вручну.");
  process.exit(1);
}

require("fs").writeFileSync("download/push-order.txt", shas.join("\n") + "\n");
console.log(`\n✓ ${shas.length} комітів створено, список у download/push-order.txt`);
console.log("Пуш частинами:");
console.log("  for sha in $(cat download/push-order.txt); do git push origin $sha:refs/heads/main && echo OK $sha || { echo FAIL $sha; break; }; done");
