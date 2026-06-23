import { Router, type IRouter } from "express";
import { eq, sql, and, ilike } from "drizzle-orm";
import { db, usersTable, studentsTable, departmentsTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "lms_salt").digest("hex");
}

const router: IRouter = Router();

async function getStudentWithDetails(studentId: number) {
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, studentId));
  if (!student) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, student.departmentId));
  return {
    id: student.id,
    name: user?.name ?? "",
    email: user?.email ?? "",
    rollNumber: student.rollNumber,
    phone: student.phone,
    semester: student.semester,
    departmentId: student.departmentId,
    departmentName: dept?.name ?? null,
    avatar: user?.avatar ?? null,
    enrolledAt: student.enrolledAt.toISOString(),
  };
}

router.get("/students", async (req, res): Promise<void> => {
  const { departmentId, semester, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (departmentId) conditions.push(eq(studentsTable.departmentId, parseInt(departmentId, 10)));
  if (semester) conditions.push(eq(studentsTable.semester, parseInt(semester, 10)));

  const query = db
    .select({
      id: studentsTable.id,
      userId: studentsTable.userId,
      rollNumber: studentsTable.rollNumber,
      phone: studentsTable.phone,
      semester: studentsTable.semester,
      departmentId: studentsTable.departmentId,
      enrolledAt: studentsTable.enrolledAt,
      name: usersTable.name,
      email: usersTable.email,
      avatar: usersTable.avatar,
      deptName: departmentsTable.name,
    })
    .from(studentsTable)
    .leftJoin(usersTable, eq(studentsTable.userId, usersTable.id))
    .leftJoin(departmentsTable, eq(studentsTable.departmentId, departmentsTable.id));

  const allStudents = await query;
  const filtered = search
    ? allStudents.filter(
        (s) =>
          s.name?.toLowerCase().includes(search.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase())
      )
    : allStudents;

  const deptFiltered = departmentId
    ? filtered.filter((s) => s.departmentId === parseInt(departmentId, 10))
    : filtered;
  const semFiltered = semester
    ? deptFiltered.filter((s) => s.semester === parseInt(semester, 10))
    : deptFiltered;

  const total = semFiltered.length;
  const paginated = semFiltered.slice(offset, offset + limitNum);

  const students = paginated.map((s) => ({
    id: s.id,
    name: s.name ?? "",
    email: s.email ?? "",
    rollNumber: s.rollNumber,
    phone: s.phone,
    semester: s.semester,
    departmentId: s.departmentId,
    departmentName: s.deptName ?? null,
    avatar: s.avatar ?? null,
    enrolledAt: s.enrolledAt.toISOString(),
  }));

  res.json({ students, total, page: pageNum, limit: limitNum });
});

router.post("/students", async (req, res): Promise<void> => {
  const { name, email, rollNumber, semester, departmentId, password, phone } = req.body;
  if (!name || !email || !rollNumber || !departmentId || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: "student",
      departmentId,
    })
    .returning();

  const [student] = await db
    .insert(studentsTable)
    .values({ userId: user.id, rollNumber, semester: semester ?? 1, departmentId, phone: phone ?? null })
    .returning();

  const result = await getStudentWithDetails(student.id);
  res.status(201).json(result);
});

router.get("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const result = await getStudentWithDetails(id);
  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
});

router.patch("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, phone, semester, departmentId } = req.body;

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (!student) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (name != null) {
    await db.update(usersTable).set({ name }).where(eq(usersTable.id, student.userId));
  }

  const studentUpdates: Record<string, unknown> = {};
  if (phone != null) studentUpdates.phone = phone;
  if (semester != null) studentUpdates.semester = semester;
  if (departmentId != null) studentUpdates.departmentId = departmentId;

  if (Object.keys(studentUpdates).length > 0) {
    await db.update(studentsTable).set(studentUpdates).where(eq(studentsTable.id, id));
  }

  const result = await getStudentWithDetails(id);
  res.json(result);
});

router.delete("/students/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, id));
  if (student) {
    await db.delete(studentsTable).where(eq(studentsTable.id, id));
    await db.delete(usersTable).where(eq(usersTable.id, student.userId));
  }
  res.json({ message: "Deleted" });
});

export default router;
