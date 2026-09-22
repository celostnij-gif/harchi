const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const ps = await db.product.findMany({ orderBy: { sort: "asc" } });
  console.log("TOTAL", ps.length);
  for (const p of ps) console.log(p.slug, "|", p.price, "|", p.cats, "|", String(p.bulkTiers).slice(0, 70), "|", p.image);
  const cs = await db.category.findMany({ orderBy: { sort: "asc" } });
  for (const c of cs) console.log("CAT:", c.slug, "|", c.nameUk, "|", c.isActive);
})().finally(() => db.$disconnect());
