import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, leavesTable, studentsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/leaves", async (req, res): Promise<void> => {
  const { studentId, status } = req.query as Record<string, string>;

  const all = await db.select().from(leavesTable);
  const filtered = all
    .filter((l) => !studentId || l.studentId === parseInt(studentId, 10))
    .filter((l) => !status || l.status === status);

  const enriched = await Promise.all(
    filtered.map(async (l) => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, l.studentId));
      let studentName: string | null = null;
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return { ...l, createdAt: l.createdAt.toISOString(), studentName };
    })
  );

  res.json(enriched);
});

router.post("/leaves", async (req, res): Promise<void> => {
  const { studentId, fromDate, toDate, reason } = req.body;
  if (!studentId || !fromDate || !toDate || !reason) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [leave] = await db
    .insert(leavesTable)
    .values({ studentId, fromDate, toDate, reason, status: "pending" })
    .returning();

  res.status(201).json({ ...leave, createdAt: leave.createdAt.toISOString(), studentName: null });
});

router.patch("/leaves/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { status, reviewedBy } = req.body;
  if (!status) {
    res.status(400).json({ error: "status required" });
    return;
  }

  const [leave] = await db
    .update(leavesTable)
    .set({ status, reviewedBy: reviewedBy ?? null })
    .where(eq(leavesTable.id, id))
    .returning();

  if (!leave) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...leave, createdAt: leave.createdAt.toISOString(), studentName: null });
});

export default router;
