import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, subjectsTable, departmentsTable, facultyTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/subjects", async (req, res): Promise<void> => {
  const { departmentId, semester } = req.query as Record<string, string>;

  const all = await db
    .select({
      id: subjectsTable.id,
      name: subjectsTable.name,
      code: subjectsTable.code,
      credits: subjectsTable.credits,
      semester: subjectsTable.semester,
      departmentId: subjectsTable.departmentId,
      facultyId: subjectsTable.facultyId,
      deptName: departmentsTable.name,
    })
    .from(subjectsTable)
    .leftJoin(departmentsTable, eq(subjectsTable.departmentId, departmentsTable.id));

  const filtered = all
    .filter((s) => !departmentId || s.departmentId === parseInt(departmentId, 10))
    .filter((s) => !semester || s.semester === parseInt(semester, 10));

  const enriched = await Promise.all(
    filtered.map(async (s) => {
      let facultyName: string | null = null;
      if (s.facultyId) {
        const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, s.facultyId));
        if (fac) {
          const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fac.userId));
          facultyName = user?.name ?? null;
        }
      }
      return { ...s, departmentName: s.deptName ?? null, facultyName };
    })
  );

  res.json(enriched);
});

router.post("/subjects", async (req, res): Promise<void> => {
  const { name, code, credits, semester, departmentId, facultyId } = req.body;
  if (!name || !code || !departmentId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [subject] = await db
    .insert(subjectsTable)
    .values({ name, code, credits: credits ?? 3, semester: semester ?? 1, departmentId, facultyId: facultyId ?? null })
    .returning();

  res.status(201).json({ ...subject, departmentName: null, facultyName: null });
});

router.patch("/subjects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, credits, facultyId } = req.body;

  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (credits != null) updates.credits = credits;
  if (facultyId !== undefined) updates.facultyId = facultyId;

  const [subject] = await db
    .update(subjectsTable)
    .set(updates)
    .where(eq(subjectsTable.id, id))
    .returning();

  if (!subject) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...subject, departmentName: null, facultyName: null });
});

router.delete("/subjects/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
