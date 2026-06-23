import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attendanceTable, studentsTable, subjectsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const { studentId, subjectId, date, month, year } = req.query as Record<string, string>;

  const conditions = [];
  if (studentId) conditions.push(eq(attendanceTable.studentId, parseInt(studentId, 10)));
  if (subjectId) conditions.push(eq(attendanceTable.subjectId, parseInt(subjectId, 10)));
  if (date) conditions.push(eq(attendanceTable.date, date));

  const records = conditions.length
    ? await db.select().from(attendanceTable).where(and(...conditions))
    : await db.select().from(attendanceTable);

  const filtered = records.filter((r) => {
    if (month && year) {
      const d = new Date(r.date);
      return d.getMonth() + 1 === parseInt(month, 10) && d.getFullYear() === parseInt(year, 10);
    }
    return true;
  });

  const enriched = await Promise.all(
    filtered.map(async (r) => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, r.studentId));
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, r.subjectId));
      let studentName: string | null = null;
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return {
        ...r,
        studentName,
        subjectName: subject?.name ?? null,
      };
    })
  );

  res.json(enriched);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const { studentId, subjectId, date, status, markedBy } = req.body;
  if (!studentId || !subjectId || !date || !status) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [record] = await db
    .insert(attendanceTable)
    .values({ studentId, subjectId, date, status, markedBy: markedBy ?? null })
    .returning();

  res.status(201).json({ ...record, studentName: null, subjectName: null });
});

router.get("/attendance/summary", async (req, res): Promise<void> => {
  const { studentId, subjectId } = req.query as Record<string, string>;

  const conditions = [];
  if (studentId) conditions.push(eq(attendanceTable.studentId, parseInt(studentId, 10)));
  if (subjectId) conditions.push(eq(attendanceTable.subjectId, parseInt(subjectId, 10)));

  const records = conditions.length
    ? await db.select().from(attendanceTable).where(and(...conditions))
    : await db.select().from(attendanceTable);

  // Group by studentId + subjectId
  const map = new Map<string, { studentId: number; subjectId: number; total: number; attended: number }>();

  for (const r of records) {
    const key = `${r.studentId}-${r.subjectId}`;
    if (!map.has(key)) {
      map.set(key, { studentId: r.studentId, subjectId: r.subjectId, total: 0, attended: 0 });
    }
    const entry = map.get(key)!;
    entry.total++;
    if (r.status === "present") entry.attended++;
  }

  const summaries = await Promise.all(
    Array.from(map.values()).map(async (entry) => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, entry.studentId));
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, entry.subjectId));
      let studentName: string | null = null;
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return {
        studentId: entry.studentId,
        studentName,
        subjectId: entry.subjectId,
        subjectName: subject?.name ?? null,
        totalClasses: entry.total,
        attended: entry.attended,
        percentage: entry.total > 0 ? Math.round((entry.attended / entry.total) * 100) : 0,
      };
    })
  );

  res.json(summaries);
});

export default router;
