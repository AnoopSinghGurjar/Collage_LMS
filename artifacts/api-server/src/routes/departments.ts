import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, departmentsTable, studentsTable, facultyTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/departments", async (_req, res): Promise<void> => {
  const depts = await db.select().from(departmentsTable);

  const enriched = await Promise.all(
    depts.map(async (dept) => {
      const [studentCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentsTable)
        .where(eq(studentsTable.departmentId, dept.id));

      const [facultyCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(facultyTable)
        .where(eq(facultyTable.departmentId, dept.id));

      let hodName: string | null = null;
      if (dept.hodId) {
        const [hod] = await db.select().from(usersTable).where(eq(usersTable.id, dept.hodId));
        hodName = hod?.name ?? null;
      }

      return {
        ...dept,
        hodName,
        studentCount: Number(studentCount?.count ?? 0),
        facultyCount: Number(facultyCount?.count ?? 0),
      };
    })
  );

  res.json(enriched);
});

router.post("/departments", async (req, res): Promise<void> => {
  const { name, code, hodId } = req.body;
  if (!name || !code) {
    res.status(400).json({ error: "name and code required" });
    return;
  }

  const [dept] = await db
    .insert(departmentsTable)
    .values({ name, code, hodId: hodId ?? null })
    .returning();

  res.status(201).json({ ...dept, hodName: null, studentCount: 0, facultyCount: 0 });
});

router.patch("/departments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, code, hodId } = req.body;

  const updates: Record<string, unknown> = {};
  if (name != null) updates.name = name;
  if (code != null) updates.code = code;
  if (hodId !== undefined) updates.hodId = hodId;

  const [dept] = await db
    .update(departmentsTable)
    .set(updates)
    .where(eq(departmentsTable.id, id))
    .returning();

  if (!dept) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ ...dept, hodName: null, studentCount: 0, facultyCount: 0 });
});

router.delete("/departments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(departmentsTable).where(eq(departmentsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
