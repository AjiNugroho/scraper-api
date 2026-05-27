import { db } from '../db/drizzle';
import { workers, jobHashtag, workerHashtagTask } from '../db/schema';

export async function rebalance() {
  const [allWorkers, allHashtags] = await Promise.all([
    db.select().from(workers),
    db.select({ id: jobHashtag.id }).from(jobHashtag),
  ]);

  if (allWorkers.length === 0 || allHashtags.length === 0) {
    await db.delete(workerHashtagTask);
    return;
  }

  const assignments = allHashtags.map((h, i) => ({
    hashtagId: h.id,
    workerId: allWorkers[i % allWorkers.length].id,
  }));

  await db.transaction(async (tx) => {
    await tx.delete(workerHashtagTask);
    await tx.insert(workerHashtagTask).values(assignments);
  });
}
