/**
 * One-off: clear Postgres Content + Community rows orphaned by the D-011 redeploy (they point at
 * the dead pre-redeploy contract). Safe to run on the fresh deployment — nothing legitimate exists
 * in these tables yet; explore/community pages repopulate via the real API upload + brand flow.
 */
import { prisma } from '../src/config/database.js';

async function main() {
  const content = await prisma.content.deleteMany({});
  const community = await prisma.community.deleteMany({});
  console.log(`Deleted ${content.count} content row(s), ${community.count} community row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
