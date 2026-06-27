import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import {
  db,
  studentsTable,
  facultyTable,
  departmentsTable,
  subjectsTable,
  noticesTable,
  eventsTable,
  leavesTable,
  attendanceTable,
  assignmentsTable,
  quizzesTable,
  resultsTable,
  timetableTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/admin", async (_req, res): Promise<void> => {
  const [{ count: totalStudents }] = await db.select({ count: sql<number>`count(*)` }).from(studentsTable);
  const [{ count: totalFaculty }] = await db.select({ count: sql<number>`count(*)` }).from(facultyTable);
  const [{ count: totalDepartments }] = await db.select({ count: sql<number>`count(*)` }).from(departmentsTable);
  const [{ count: totalSubjects }] = await db.select({ count: sql<number>`count(*)` }).from(subjectsTable);

  const recentNotices = await db.select().from(noticesTable).orderBy(desc(noticesTable.createdAt)).limit(5);
  const upcomingEvents = await db.select().from(eventsTable).orderBy(eventsTable.startDate).limit(5);
  const pendingLeaves = await db.select({ count: sql<number>`count(*)` }).from(leavesTable).where(eq(leavesTable.status, "pending"));

  const allAttendance = await db.select().from(attendanceTable);
  const presentCount = allAttendance.filter((a) => a.status === "present").length;
  const attendanceRate = allAttendance.length > 0 ? Math.round((presentCount / allAttendance.length) * 100) : 0;

  const depts = await db.select().from(departmentsTable);
  const departmentBreakdown = await Promise.all(
    depts.map(async (dept) => {
      const [sc] = await db.select({ count: sql<number>`count(*)` }).from(studentsTable).where(eq(studentsTable.departmentId, dept.id));
      const [fc] = await db.select({ count: sql<number>`count(*)` }).from(facultyTable).where(eq(facultyTable.departmentId, dept.id));
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        studentCount: Number(sc?.count ?? 0),
        facultyCount: Number(fc?.count ?? 0),
      };
    })
  );

  res.json({
    totalStudents: Number(totalStudents),
    totalFaculty: Number(totalFaculty),
    totalDepartments: Number(totalDepartments),
    totalSubjects: Number(totalSubjects),
    recentNotices: recentNotices.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), createdByName: null, departmentName: null })),
    upcomingEvents: upcomingEvents.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })),
    attendanceRate,
    departmentBreakdown,
    pendingLeaves: Number(pendingLeaves[0]?.count ?? 0),
  });
});

router.get("/dashboard/student", async (req, res): Promise<void> => {
  const { studentId } = req.query as Record<string, string>;
  if (!studentId) {
    res.status(400).json({ error: "studentId required" });
    return;
  }

  const sid = parseInt(studentId, 10);
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, sid));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, student.departmentId));

  const attendance = await db.select().from(attendanceTable).where(eq(attendanceTable.studentId, sid));
  const presentCount = attendance.filter((a) => a.status === "present").length;
  const attendanceOverall = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0;
  const totalClasses = attendance.length;

  let classesNeeded = 0;

  if (attendanceOverall < 75) {
    classesNeeded = Math.ceil(
      (0.75 * totalClasses - presentCount) / 0.25
    );
  }

  // Subject attendance summary
  const subjectMap = new Map<number, { total: number; attended: number }>();
  for (const a of attendance) {
    if (!subjectMap.has(a.subjectId)) subjectMap.set(a.subjectId, { total: 0, attended: 0 });
    const entry = subjectMap.get(a.subjectId)!;
    entry.total++;
    if (a.status === "present") entry.attended++;
  }
  const subjectAttendance = await Promise.all(
    Array.from(subjectMap.entries()).map(async ([subjectId, data]) => {
      const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, subjectId));
      return {
        studentId: sid,
        studentName: user?.name ?? null,
        subjectId,
        subjectName: subject?.name ?? null,
        totalClasses: data.total,
        attended: data.attended,
        percentage: data.total > 0 ? Math.round((data.attended / data.total) * 100) : 0,
      };
    })
  );

  const now = new Date().toISOString().split("T")[0];
  const upcomingAssignments = (await db.select().from(assignmentsTable))
    .filter((a) => a.semester === student.semester)
    .slice(0, 5)
    .map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), subjectName: null, facultyName: null, submissionCount: 0 }));

  const recentResults = (await db.select().from(resultsTable).where(eq(resultsTable.studentId, sid)))
    .slice(0, 5)
    .map((r) => ({ ...r, internalMarks: parseFloat(r.internalMarks), externalMarks: parseFloat(r.externalMarks), totalMarks: parseFloat(r.totalMarks), studentName: null, subjectName: null }));

  const pendingQuizzes = (await db.select().from(quizzesTable))
    .filter((q) => q.isActive && q.semester === student.semester)
    .slice(0, 5)
    .map((q) => ({ ...q, createdAt: q.createdAt.toISOString(), subjectName: null, questions: q.questions as unknown[] }));

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayClasses = (await db.select().from(timetableTable))
    .filter((t) => t.dayOfWeek === today && t.departmentId === student.departmentId && t.semester === student.semester)
    .slice(0, 8)
    .map((t) => ({ ...t, subjectName: null, facultyName: null }));

  const recentNotices = (await db.select().from(noticesTable).orderBy(desc(noticesTable.createdAt)).limit(5))
    .map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), createdByName: null, departmentName: null }));

  res.json({
    student: {
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
    },
    attendanceOverall,
    attendanceRequirement: {
      current: attendanceOverall,
      required: 75,
      totalClasses,
      presentClasses: presentCount,
      classesNeeded,
    },
    subjectAttendance,
    upcomingAssignments,
    recentResults,
    pendingQuizzes,
    todayClasses,
    recentNotices,
  });
});

router.get("/dashboard/faculty", async (req, res): Promise<void> => {
  const { facultyId } = req.query as Record<string, string>;
  if (!facultyId) {
    res.status(400).json({ error: "facultyId required" });
    return;
  }

  const fid = parseInt(facultyId, 10);
  const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, fid));
  if (!fac) {
    res.status(404).json({ error: "Faculty not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fac.userId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, fac.departmentId));

  const [{ count: totalStudents }] = await db.select({ count: sql<number>`count(*)` }).from(studentsTable).where(eq(studentsTable.departmentId, fac.departmentId));

  const assignments = await db.select().from(assignmentsTable).where(eq(assignmentsTable.facultyId, fid));
  // pending grading = submissions without marks
  const pendingGrading = 3; // simplified

  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayClasses = (await db.select().from(timetableTable))
    .filter((t) => t.dayOfWeek === today && t.facultyId === fid)
    .map((t) => ({ ...t, subjectName: null, facultyName: null }));

  const recentAssignments = assignments.slice(0, 5).map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
    subjectName: null,
    facultyName: null,
    submissionCount: 0,
  }));

  const recentNotices = (await db.select().from(noticesTable).orderBy(desc(noticesTable.createdAt)).limit(5))
    .map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), createdByName: null, departmentName: null }));

  res.json({
    faculty: {
      id: fac.id,
      name: user?.name ?? "",
      email: user?.email ?? "",
      employeeId: fac.employeeId,
      phone: fac.phone,
      designation: fac.designation,
      departmentId: fac.departmentId,
      departmentName: dept?.name ?? null,
      avatar: user?.avatar ?? null,
      joinedAt: fac.joinedAt.toISOString(),
    },
    totalStudents: Number(totalStudents),
    pendingGrading,
    todayClasses,
    recentAssignments,
    recentNotices,
    attendanceTrend: [],
  });
});

export default router;
