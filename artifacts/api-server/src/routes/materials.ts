import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, materialsTable, subjectsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/materials", async (req, res): Promise<void> => {
  const { subjectId, semester, search } = req.query as Record<string, string>;

  const all = await db.select().from(materialsTable);
  const filtered = all
    .filter((m) => !subjectId || m.subjectId === parseInt(subjectId, 10))
    .filter((m) => !semester || m.semester === parseInt(semester, 10))
    .filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()));

  const enriched = await Promise.all(
    filtered.map(async (m) => {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, m.subjectId));
      const [uploader] = await db.select().from(usersTable).where(eq(usersTable.id, m.uploadedBy));
      return {
        ...m,
        createdAt: m.createdAt.toISOString(),
        subjectName: subject?.name ?? null,
        uploaderName: uploader?.name ?? null,
      };
    })
  );

  res.json(enriched);
});

router.post("/materials", async (req, res): Promise<void> => {
  const { title, description, subjectId, type, fileUrl, uploadedBy, semester } = req.body;
  if (!title || !subjectId || !uploadedBy) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [material] = await db
    .insert(materialsTable)
    .values({ title, description: description ?? null, subjectId, type: type ?? "pdf", fileUrl: fileUrl ?? null, uploadedBy, semester: semester ?? null })
    .returning();

  res.status(201).json({ ...material, createdAt: material.createdAt.toISOString(), subjectName: null, uploaderName: null });
});

router.delete("/materials/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(materialsTable).where(eq(materialsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
