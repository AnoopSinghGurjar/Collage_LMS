import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, timetableTable, subjectsTable, facultyTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/timetable", async (req, res): Promise<void> => {
  const { departmentId, semester, facultyId } = req.query as Record<string, string>;

  const all = await db.select().from(timetableTable);
  const filtered = all
    .filter((t) => !departmentId || t.departmentId === parseInt(departmentId, 10))
    .filter((t) => !semester || t.semester === parseInt(semester, 10))
    .filter((t) => !facultyId || t.facultyId === parseInt(facultyId, 10));

  const enriched = await Promise.all(
    filtered.map(async (t) => {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, t.subjectId));
      const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, t.facultyId));
      let facultyName: string | null = null;
      if (fac) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fac.userId));
        facultyName = user?.name ?? null;
      }
      return {
        ...t,
        subjectName: subject?.name ?? null,
        facultyName,
      };
    })
  );

  res.json(enriched);
});

router.post("/timetable", async (req, res): Promise<void> => {
  const { subjectId, facultyId, dayOfWeek, startTime, endTime, room, semester, departmentId } = req.body;
  if (!subjectId || !facultyId || !dayOfWeek || !startTime || !endTime || !departmentId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [entry] = await db
    .insert(timetableTable)
    .values({ subjectId, facultyId, dayOfWeek, startTime, endTime, room: room ?? null, semester: semester ?? 1, departmentId })
    .returning();

  res.status(201).json({ ...entry, subjectName: null, facultyName: null });
});

router.delete("/timetable/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(timetableTable).where(eq(timetableTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
