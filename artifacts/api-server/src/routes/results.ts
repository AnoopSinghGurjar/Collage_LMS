import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, resultsTable, studentsTable, subjectsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function calcGrade(total: number, max = 100): { grade: string; passed: boolean } {
  const pct = (total / max) * 100;
  if (pct >= 90) return { grade: "O", passed: true };
  if (pct >= 80) return { grade: "A+", passed: true };
  if (pct >= 70) return { grade: "A", passed: true };
  if (pct >= 60) return { grade: "B+", passed: true };
  if (pct >= 50) return { grade: "B", passed: true };
  if (pct >= 40) return { grade: "C", passed: true };
  return { grade: "F", passed: false };
}

router.get("/results", async (req, res): Promise<void> => {
  const { studentId, subjectId, semester } = req.query as Record<string, string>;

  const all = await db.select().from(resultsTable);
  const filtered = all
    .filter((r) => !studentId || r.studentId === parseInt(studentId, 10))
    .filter((r) => !subjectId || r.subjectId === parseInt(subjectId, 10))
    .filter((r) => !semester || r.semester === parseInt(semester, 10));

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
        internalMarks: parseFloat(r.internalMarks),
        externalMarks: parseFloat(r.externalMarks),
        totalMarks: parseFloat(r.totalMarks),
        studentName,
        subjectName: subject?.name ?? null,
      };
    })
  );

  res.json(enriched);
});

router.post("/results", async (req, res): Promise<void> => {
  const { studentId, subjectId, semester, internalMarks, externalMarks } = req.body;
  if (!studentId || !subjectId || !semester) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const total = Number(internalMarks) + Number(externalMarks);
  const { grade, passed } = calcGrade(total);

  const [result] = await db
    .insert(resultsTable)
    .values({
      studentId,
      subjectId,
      semester,
      internalMarks: String(internalMarks),
      externalMarks: String(externalMarks),
      totalMarks: String(total),
      grade,
      passed,
    })
    .returning();

  res.status(201).json({
    ...result,
    internalMarks: parseFloat(result.internalMarks),
    externalMarks: parseFloat(result.externalMarks),
    totalMarks: parseFloat(result.totalMarks),
    studentName: null,
    subjectName: null,
  });
});

router.patch("/results/:id", async (req, res): Promise<void> => {

  const id = Number(req.params.id);

  const {
    internalMarks,
    externalMarks,
    remarks,
    published,
  } = req.body;

  const total =
    Number(internalMarks) +
    Number(externalMarks);

  const { grade, passed } =
    calcGrade(total);

  const [result] = await db
    .update(resultsTable)
    .set({

      internalMarks:
        String(internalMarks),

      externalMarks:
        String(externalMarks),

      totalMarks:
        String(total),

      grade,

      passed,

      remarks,

      published,

    })
    .where(eq(resultsTable.id, id))
    .returning();

  if (!result) {

    res.status(404).json({
      error: "Result not found",
    });

    return;

  }

  res.json({

    ...result,

    internalMarks: Number(
      result.internalMarks
    ),

    externalMarks: Number(
      result.externalMarks
    ),

    totalMarks: Number(
      result.totalMarks
    ),

  });

});

router.delete("/results/:id", async (req, res): Promise<void> => {

  const id = Number(req.params.id);

  await db
    .delete(resultsTable)
    .where(eq(resultsTable.id, id));

  res.json({
    message: "Result deleted",
  });

});

export default router;
