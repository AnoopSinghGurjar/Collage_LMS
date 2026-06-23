import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, quizzesTable, quizAttemptsTable, subjectsTable, facultyTable, usersTable, studentsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/quizzes", async (req, res): Promise<void> => {
  const { subjectId, semester } = req.query as Record<string, string>;

  const all = await db.select().from(quizzesTable);
  const filtered = all
    .filter((q) => !subjectId || q.subjectId === parseInt(subjectId, 10))
    .filter((q) => !semester || q.semester === parseInt(semester, 10));

  const enriched = await Promise.all(
    filtered.map(async (q) => {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, q.subjectId));
      return {
        ...q,
        createdAt: q.createdAt.toISOString(),
        subjectName: subject?.name ?? null,
        questions: (q.questions as unknown[]) ?? [],
      };
    })
  );

  res.json(enriched);
});

router.post("/quizzes", async (req, res): Promise<void> => {
  const { title, description, subjectId, facultyId, durationMinutes, totalMarks, semester, questions } = req.body;
  if (!title || !subjectId || !facultyId) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [quiz] = await db
    .insert(quizzesTable)
    .values({
      title,
      description: description ?? null,
      subjectId,
      facultyId,
      durationMinutes: durationMinutes ?? 30,
      totalMarks: totalMarks ?? 10,
      semester: semester ?? null,
      isActive: true,
      questions: questions ?? [],
    })
    .returning();

  res.status(201).json({ ...quiz, createdAt: quiz.createdAt.toISOString(), subjectName: null, questions: quiz.questions as unknown[] });
});

router.get("/quizzes/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, id));
  if (!quiz) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, quiz.subjectId));
  res.json({ ...quiz, createdAt: quiz.createdAt.toISOString(), subjectName: subject?.name ?? null, questions: quiz.questions as unknown[] });
});

router.post("/quizzes/:id/attempt", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const quizId = parseInt(raw, 10);
  const { studentId, answers } = req.body;
  if (!studentId || !answers) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, quizId));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const questions = (quiz.questions as Array<{ correctOption: number; marks?: number }>) ?? [];
  let score = 0;
  const answerList = answers as number[];
  questions.forEach((q, i) => {
    if (answerList[i] === q.correctOption) {
      score += q.marks ?? 1;
    }
  });

  const [attempt] = await db
    .insert(quizAttemptsTable)
    .values({ quizId, studentId, answers, score, totalMarks: quiz.totalMarks })
    .returning();

  res.status(201).json({
    ...attempt,
    submittedAt: attempt.submittedAt.toISOString(),
    studentName: null,
    answers: attempt.answers as number[],
  });
});

router.get("/quizzes/:id/attempts", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const attempts = await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, id));

  const enriched = await Promise.all(
    attempts.map(async (a) => {
      const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, a.studentId));
      let studentName: string | null = null;
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return { ...a, submittedAt: a.submittedAt.toISOString(), studentName, answers: a.answers as number[] };
    })
  );

  res.json(enriched);
});

export default router;
