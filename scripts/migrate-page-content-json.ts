// 8.2 step 4 — one-off backfill of Page.contentJson from legacy HTML.
//
// Safe by default: runs as a DRY RUN (reads + reports only). Pass --apply to
// actually write. Never touches the legacy `content` column — it only adds the
// versioned block document so the rich-text renderer can cut over (step 5).
//
// Requires the `contentJson` / `contentVer` columns to exist in the target DB
// (prisma db push, plan step 1) — otherwise it exits with a clear message and
// writes nothing.
//
// Usage (PRISMA CLI does NOT read .env.local — load env first):
//   bash -c 'set -a; . ./.env.local; set +a; node scripts/migrate-page-content-json.ts'
//   bash -c 'set -a; . ./.env.local; set +a; node scripts/migrate-page-content-json.ts --apply --limit 50'
import { PrismaClient, Prisma } from '@prisma/client';

import { htmlToBlockDocument } from '../lib/content/html-to-json.ts';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const DRY_RUN = !APPLY;

function readArg(flag: string): string | undefined {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
}

const limitRaw = readArg('--limit');
const LIMIT = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

const prisma = new PrismaClient();

async function main() {
  if (LIMIT !== undefined && (!Number.isFinite(LIMIT) || LIMIT <= 0)) {
    console.error('--limit must be a positive integer');
    process.exit(2);
  }

  console.log(`[migrate] mode=${DRY_RUN ? 'DRY-RUN (no writes)' : 'APPLY'}${LIMIT ? ` limit=${LIMIT}` : ''}`);

  let rows;
  try {
    rows = await prisma.page.findMany({
      where: { contentJson: { equals: Prisma.DbNull } },
      select: { id: true, slug: true, content: true, contentVer: true },
      orderBy: { createdAt: 'asc' },
      ...(LIMIT ? { take: LIMIT } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[migrate] cannot read Page.contentJson — is the column applied (prisma db push)?');
    console.error(`[migrate] ${message}`);
    process.exit(1);
  }

  console.log(`[migrate] rows needing backfill: ${rows.length}`);

  let converted = 0;
  let skippedEmpty = 0;
  let failed = 0;
  let written = 0;

  for (const row of rows) {
    const html = typeof row.content === 'string' ? row.content : '';
    if (html.trim() === '') {
      skippedEmpty += 1;
      continue;
    }

    const doc = htmlToBlockDocument(html);
    if (!doc) {
      failed += 1;
      console.warn(`[migrate]   ! conversion rejected by validator: ${row.slug} (${row.id})`);
      continue;
    }
    converted += 1;

    if (DRY_RUN) {
      console.log(`[migrate]   ~ would backfill ${row.slug} (${row.id}) ver=${doc.version}`);
      continue;
    }

    await prisma.page.update({
      where: { id: row.id },
      data: {
        contentJson: doc as unknown as Prisma.InputJsonValue,
        contentVer: doc.version,
      },
    });
    written += 1;
  }

  console.log(
    `[migrate] done — total=${rows.length} converted=${converted} written=${written} skippedEmpty=${skippedEmpty} failed=${failed}`,
  );

  if (DRY_RUN && converted > 0) {
    console.log('[migrate] dry run only. Re-run with --apply to write.');
  }
}

main()
  .catch((error) => {
    console.error('[migrate] fatal:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
