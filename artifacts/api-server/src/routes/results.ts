import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, resultsTable, studentsTable, subjectsTable, usersTable } from "@workspace/db";
import * as XLSX from "xlsx";
import { uploadResultExcel } from "../middlewares/resultUpload";

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
  const {
    studentId,
    subjectId,
    semester,
    academicSession,
    departmentId,
    published,
  } = req.query as Record<string, string>;

  const all = await db.select().from(resultsTable);
  const filtered = all
  .filter((r) => !studentId || r.studentId === Number(studentId))
  .filter((r) => !subjectId || r.subjectId === Number(subjectId))
  .filter((r) => !semester || r.semester === Number(semester))
  .filter((r) => !academicSession || r.academicSession === academicSession)
  .filter((r) => !departmentId || r.departmentId === Number(departmentId))
  .filter((r) => published === undefined || r.published === (published === "true"));


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
  const {
    studentId,
    subjectId,
    semester,
    academicSession,
    departmentId,
    internalMarks,
    externalMarks,
  } = req.body;
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
      academicSession,
      departmentId,
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

router.patch("/results/publish", async (req, res) => {

  const {
    academicSession,
    departmentId,
    semester,
    subjectId,
  } = req.body;

  await db
    .update(resultsTable)
    .set({
      published: true,
    })
    .where(
      and(
        eq(resultsTable.academicSession, academicSession),
        eq(resultsTable.departmentId, departmentId),
        eq(resultsTable.semester, semester),
        eq(resultsTable.subjectId, subjectId)
      )
    );

  res.json({
    message: "Results Published Successfully",
  });

});

router.patch("/results/:id", async (req, res): Promise<void> => {

  const id = Number(req.params.id);

  const existing = await db
    .select()
    .from(resultsTable)
    .where(eq(resultsTable.id, id));

  if (!existing.length) {
    res.status(404).json({
      error: "Result not found",
    });
    return;
  }

  const current = existing[0];

  const internalMarks =
    req.body.internalMarks ?? Number(current.internalMarks);

  const externalMarks =
    req.body.externalMarks ?? Number(current.externalMarks);

  const total =
    Number(internalMarks) + Number(externalMarks);

  const { grade, passed } = calcGrade(total);

  const [result] = await db
    .update(resultsTable)
    .set({

      internalMarks: String(internalMarks),

      externalMarks: String(externalMarks),

      totalMarks: String(total),

      grade,

      passed,

      remarks:
        req.body.remarks ?? current.remarks,

      published:
        req.body.published ?? current.published,

    })
    .where(eq(resultsTable.id, id))
    .returning();

  res.json(result);

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

router.post(
  "/results/import",
  uploadResultExcel.single("file"),
  async (req, res): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          error: "Excel file required",
        });
        return;
      }

      const workbook = XLSX.readFile(req.file.path);

      const sheet =
        workbook.Sheets[
        workbook.SheetNames[0]
        ];

      const rows = XLSX.utils.sheet_to_json<any>(
        sheet
      );

      const academicSession = req.body.academicSession;

      const departmentId = Number(req.body.departmentId);

      const semester = Number(req.body.semester);

      const subjectId = Number(req.body.subjectId);

      // Remove old results for same Session + Department + Semester + Subject

      await db
        .delete(resultsTable)
        .where(
          and(
            eq(resultsTable.academicSession, academicSession),
            eq(resultsTable.departmentId, departmentId),
            eq(resultsTable.semester, semester),
            eq(resultsTable.subjectId, subjectId)
          )
        );

      let imported = 0;
      let skipped = 0;

      for (const row of rows) {

        const studentCode = row["Student ID"];

        const internal = Number(row["Internal"]);

        const external = Number(row["External"]);

        const [student] = await db
          .select()
          .from(studentsTable)
          .where(
            eq(
              studentsTable.rollNumber,
              studentCode
            )
          );

        // const [subject] = await db
        //   .select()
        //   .from(subjectsTable)
        //   .where(
        //     eq(
        //       subjectsTable.code,
        //       subjectCode
        //     )
        //   );

        if (!student) {
          skipped++;
          continue;
        }

        const total =
          internal + external;

        const {
          grade,
          passed,
        } = calcGrade(total);

        await db.insert(resultsTable).values({
          studentId: student.id,

          subjectId,

          semester,

          academicSession,

          departmentId,

          internalMarks: String(internal),

          externalMarks: String(external),

          totalMarks: String(total),

          grade,

          passed,
        });

        imported++;
      }

      res.json({
        imported,
        skipped,
        total: rows.length,
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Import failed",
      });

    }
  }
);

export default router;
