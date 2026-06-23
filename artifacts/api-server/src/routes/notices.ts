import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, noticesTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/notices", async (req, res): Promise<void> => {
  const { departmentId, pinned } = req.query as Record<string, string>;

  const all = await db.select().from(noticesTable).orderBy(desc(noticesTable.createdAt));
  const filtered = all
    .filter((n) => !departmentId || n.departmentId === parseInt(departmentId, 10) || n.departmentId === null)
    .filter((n) => pinned === undefined || n.isPinned === (pinned === "true"));

  const enriched = await Promise.all(
    filtered.map(async (n) => {
      const [creator] = await db.select().from(usersTable).where(eq(usersTable.id, n.createdBy));
      return {
        ...n,
        createdAt: n.createdAt.toISOString(),
        createdByName: creator?.name ?? null,
        departmentName: null,
      };
    })
  );

  res.json(enriched);
});

router.post("/notices", async (req, res): Promise<void> => {
  const { title, content, isPinned, departmentId, semester, createdBy } = req.body;
  if (!title || !content || !createdBy) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [notice] = await db
    .insert(noticesTable)
    .values({ title, content, isPinned: isPinned ?? false, departmentId: departmentId ?? null, semester: semester ?? null, createdBy })
    .returning();

  res.status(201).json({ ...notice, createdAt: notice.createdAt.toISOString(), createdByName: null, departmentName: null });
});

router.patch("/notices/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  if (req.body.title != null) updates.title = req.body.title;
  if (req.body.content != null) updates.content = req.body.content;
  if (req.body.isPinned != null) updates.isPinned = req.body.isPinned;

  const [notice] = await db.update(noticesTable).set(updates).where(eq(noticesTable.id, id)).returning();
  if (!notice) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...notice, createdAt: notice.createdAt.toISOString(), createdByName: null, departmentName: null });
});

router.delete("/notices/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(noticesTable).where(eq(noticesTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
