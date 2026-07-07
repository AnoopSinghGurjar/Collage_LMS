import path from "path";
import { uploadAssignment } from "../middlewares/upload";
import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, assignmentsTable, submissionsTable, subjectsTable, facultyTable, usersTable, studentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/assignments", async (req, res): Promise<void> => {
  const { subjectId, facultyId, semester } = req.query as Record<string, string>;

  const all = await db.select().from(assignmentsTable);
  const filtered = all
    .filter((a) => !subjectId || a.subjectId === parseInt(subjectId, 10))
    .filter((a) => !facultyId || a.facultyId === parseInt(facultyId, 10))
    .filter((a) => !semester || a.semester === parseInt(semester, 10));

  const enriched = await Promise.all(
    filtered.map(async (a) => {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, a.subjectId));
      const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, a.facultyId));
      let facultyName: string | null = null;
      if (fac) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fac.userId));
        facultyName = user?.name ?? null;
      }
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(submissionsTable)
        .where(eq(submissionsTable.assignmentId, a.id));

      return {
        ...a,
        createdAt: a.createdAt.toISOString(),
        subjectName: subject?.name ?? null,
        facultyName,
        submissionCount: Number(countResult?.count ?? 0),
      };
    })
  );

  res.json(enriched);
});

// router.post("/assignments", async (req, res): Promise<void> => {
//   const { title, description, subjectId, facultyId, dueDate, maxMarks, semester } = req.body;
//   if (!title || !subjectId || !facultyId || !dueDate) {
//     res.status(400).json({ error: "Missing required fields" });
//     return;
//   }

//   const [assignment] = await db
//     .insert(assignmentsTable)
//     .values({ title, description: description ?? null, subjectId, facultyId, dueDate, maxMarks: maxMarks ?? 100, semester: semester ?? null })
//     .returning();

//   res.status(201).json({ ...assignment, createdAt: assignment.createdAt.toISOString(), subjectName: null, facultyName: null, submissionCount: 0 });
// });

router.get(
  "/student/assignments",
  async (req, res): Promise<void> => {
    try {
      const { studentId } = req.query as Record<
        string,
        string
      >;

      if (!studentId) {
        res.status(400).json({
          error: "studentId required",
        });
        return;
      }

      const sid = Number(studentId);

      const [student] = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.id, sid));

      if (!student) {
        res.status(404).json({
          error: "Student not found",
        });
        return;
      }

      const assignments = await db
        .select()
        .from(assignmentsTable)
        .where(
          eq(
            assignmentsTable.semester,
            student.semester
          )
        );

      const result = await Promise.all(
        assignments.map(async (assignment) => {

          const [subject] = await db
            .select()
            .from(subjectsTable)
            .where(
              eq(
                subjectsTable.id,
                assignment.subjectId
              )
            );

          const [faculty] = await db
            .select()
            .from(facultyTable)
            .where(
              eq(
                facultyTable.id,
                assignment.facultyId
              )
            );

          let facultyName = "";

          if (faculty) {
            const [user] = await db
              .select()
              .from(usersTable)
              .where(
                eq(
                  usersTable.id,
                  faculty.userId
                )
              );

            facultyName = user?.name ?? "";
          }

          const [submission] = await db
            .select()
            .from(submissionsTable)
            .where(
              and(
                eq(
                  submissionsTable.assignmentId,
                  assignment.id
                ),
                eq(
                  submissionsTable.studentId,
                  sid
                )
              )
            );

          return {
            ...assignment,

            subjectName:
              subject?.name ?? "",

            facultyName,

            submitted:
              !!submission,

            marks:
              submission?.marks ?? null,

            feedback:
              submission?.feedback ?? null,

            status:
              submission?.status ??
              "pending",
          };
        })
      );

      res.json(result);

    } catch (err) {
      console.error("========== STUDENT ASSIGNMENT ERROR ==========");
      console.error(err);

      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
);

router.get("/assignments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [a] = await db.select().from(assignmentsTable).where(eq(assignmentsTable.id, id));
  if (!a) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...a, createdAt: a.createdAt.toISOString(), subjectName: null, facultyName: null, submissionCount: 0 });
});

router.patch("/assignments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const updates: Record<string, unknown> = {};
  if (req.body.title != null) updates.title = req.body.title;
  if (req.body.description != null) updates.description = req.body.description;
  if (req.body.dueDate != null) updates.dueDate = req.body.dueDate;
  if (req.body.maxMarks != null) updates.maxMarks = req.body.maxMarks;

  const [a] = await db.update(assignmentsTable).set(updates).where(eq(assignmentsTable.id, id)).returning();
  if (!a) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...a, createdAt: a.createdAt.toISOString(), subjectName: null, facultyName: null, submissionCount: 0 });
});

router.delete("/assignments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, id));
  res.json({ message: "Deleted" });
});

router.get("/assignments/:id/submissions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const subs = await db.select().from(submissionsTable).where(eq(submissionsTable.assignmentId, id));

  const enriched = await Promise.all(
    subs.map(async (s) => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, s.studentId));
      let studentName: string | null = null;
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return { ...s, submittedAt: s.submittedAt.toISOString(), studentName };
    })
  );

  res.json(enriched);
});

// router.post("/assignments/:id/submissions", async (req, res): Promise<void> => {
//   const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
//   const assignmentId = parseInt(raw, 10);
//   const { studentId, fileUrl, notes } = req.body;
//   if (!studentId) {
//     res.status(400).json({ error: "studentId required" });
//     return;
//   }

//   const [sub] = await db
//     .insert(submissionsTable)
//     .values({ assignmentId, studentId, fileUrl: fileUrl ?? null, notes: notes ?? null, status: "submitted" })
//     .returning();

//   res.status(201).json({ ...sub, submittedAt: sub.submittedAt.toISOString(), studentName: null });
// });

router.post(
  "/assignments/:id/submissions",
  uploadAssignment.single("file"),
  async (req, res): Promise<void> => {
    try {
      const assignmentId = Number(req.params.id);

      const { studentId, notes } = req.body;

      if (!studentId) {
        res.status(400).json({
          error: "studentId required",
        });
        return;
      }

      const [submission] = await db
        .insert(submissionsTable)
        .values({
          assignmentId,

          studentId: Number(studentId),

          notes: notes ?? null,

          fileUrl: req.file
            ? `/uploads/assignments/students/${req.file.filename}`
            : null,

          fileName: req.file?.originalname ?? null,

          fileType: req.file?.mimetype ?? null,

          status: "submitted",
        })
        .returning();

      res.status(201).json({
        ...submission,
        submittedAt: submission.submittedAt.toISOString(),
      });

    } catch (err) {

      console.error(
        "========== STUDENT SUBMISSION ERROR =========="
      );

      console.error(err);

      res.status(500).json({
        error:
          err instanceof Error
            ? err.message
            : String(err),
      });

    }
  }
);

router.patch("/submissions/:id/grade", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { marks, feedback } = req.body;

  const [sub] = await db
    .update(submissionsTable)
    .set({ marks: marks ?? null, feedback: feedback ?? null, status: "graded" })
    .where(eq(submissionsTable.id, id))
    .returning();

  if (!sub) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ...sub, submittedAt: sub.submittedAt.toISOString(), studentName: null });
});

router.post(
  "/assignments",
  uploadAssignment.single("file"),
  async (req, res): Promise<void> => {
    try {
      const {
        title,
        description,
        subjectId,
        facultyId,
        semester,
        dueDate,
        maxMarks,
      } = req.body;

      if (
        !title ||
        !subjectId ||
        !facultyId ||
        !dueDate
      ) {
        res.status(400).json({
          error: "Missing required fields",
        });
        return;
      }

      const assignment = await db
        .insert(assignmentsTable)
        .values({
          title,
          description,
          subjectId: Number(subjectId),
          facultyId: Number(facultyId),
          semester: semester
            ? Number(semester)
            : null,
          dueDate,
          maxMarks: maxMarks
            ? Number(maxMarks)
            : 100,

          attachmentUrl: req.file
            ? `/uploads/assignments/faculty/${req.file.filename}`
            : null,

          attachmentName: req.file?.originalname ?? null,

          attachmentType: req.file?.mimetype ?? null,
        })
        .returning();

      res.status(201).json(assignment[0]);

    } catch (err) {
      console.error("========== ASSIGNMENT ERROR ==========");
      console.error(err);

      res.status(500).json({
        error: err instanceof Error ? err.message : String(err),
      });

    }
  }
);

export default router;
