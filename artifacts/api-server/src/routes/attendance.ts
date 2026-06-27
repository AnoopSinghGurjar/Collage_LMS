import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import {
  db,
  attendanceTable,
  studentsTable,
  subjectsTable,
  usersTable,
  facultyTable,
  timetableTable,
  departmentsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/attendance/history", async (req, res): Promise<void> => {
  const { subjectId, date } = req.query as Record<string, string>;

  if (!subjectId || !date) {
    res.status(400).json({
      error: "subjectId and date required",
    });
    return;
  }

  const records = await db
    .select()
    .from(attendanceTable)
    .where(
      and(
        eq(attendanceTable.subjectId, Number(subjectId)),
        eq(attendanceTable.date, date)
      )
    );

  res.json(records);
});

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
      let subjectCode: string | null = null;
      let facultyName: string | null = null;
      let startTime: string | null = null;
      let endTime: string | null = null;

      if (subject) {

        subjectCode = subject.code;

        if (subject.facultyId) {

          const [faculty] = await db
            .select()
            .from(facultyTable)
            .where(eq(facultyTable.id, subject.facultyId));

          if (faculty) {

            const [facultyUser] = await db
              .select()
              .from(usersTable)
              .where(eq(usersTable.id, faculty.userId));

            facultyName = facultyUser?.name ?? null;
          }
        }

        const [slot] = await db
          .select()
          .from(timetableTable)
          .where(eq(timetableTable.subjectId, subject.id));

        if (slot) {
          startTime = slot.startTime;
          endTime = slot.endTime;
        }
      }
      if (student) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, student.userId));
        studentName = user?.name ?? null;
      }
      return {

        ...r,

        studentName,

        subjectName: subject?.name ?? null,

        subjectCode,

        facultyName,

        startTime,

        endTime,

      };
    })
  );

  res.json(enriched);
});

router.get("/attendance/students", async (req, res): Promise<void> => {
  const subjectId = Number(req.query.subjectId);

  if (!subjectId) {
    res.status(400).json({
      error: "subjectId required",
    });
    return;
  }

  const [subject] = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.id, subjectId));

  if (!subject) {
    res.status(404).json({
      error: "Subject not found",
    });
    return;
  }

  const students = await db
    .select()
    .from(studentsTable)
    .where(eq(studentsTable.departmentId, subject.departmentId));

  const result = await Promise.all(
    students
      .filter((s) => s.semester === subject.semester)
      .map(async (student) => {
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, student.userId));

        return {
          studentId: student.id,
          name: user?.name ?? "",
          rollNumber: student.rollNumber,
        };
      })
  );

  res.json(result);
});

router.post("/attendance/bulk", async (req, res): Promise<void> => {
  try {
    const { subjectId, markedBy, attendance } = req.body;

    if (!subjectId || !attendance || !Array.isArray(attendance)) {
      res.status(400).json({
        error: "Invalid data",
      });
      return;
    }

    const selectedDate =
      req.body.date || new Date().toISOString().split("T")[0];

    for (const item of attendance) {

      const existing = await db
        .select()
        .from(attendanceTable)
        .where(
          and(
            eq(attendanceTable.studentId, item.studentId),
            eq(attendanceTable.subjectId, subjectId),
            eq(attendanceTable.date, selectedDate)
          )
        );

      if (existing.length > 0) {

        await db
          .update(attendanceTable)
          .set({
            status: item.status,
            markedBy,
          })
          .where(eq(attendanceTable.id, existing[0].id));

      } else {

        await db.insert(attendanceTable).values({
          studentId: item.studentId,
          subjectId,
          date: selectedDate,
          status: item.status,
          markedBy,
        });

      }
    }

    res.json({
      success: true,
      total: attendance.length,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to save attendance",
    });
  }
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

router.get("/attendance/student-history", async (req, res): Promise<void> => {
  const { studentId } = req.query as Record<string, string>;

  if (!studentId) {
    res.status(400).json({
      error: "studentId required",
    });
    return;
  }

  const records = await db
    .select()
    .from(attendanceTable)
    .where(eq(attendanceTable.studentId, Number(studentId)));

  const history = await Promise.all(
    records.map(async (record) => {

      const [subject] = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, record.subjectId));

      let facultyName: string | null = null;

      if (subject?.facultyId) {

        const [faculty] = await db
          .select()
          .from(facultyTable)
          .where(eq(facultyTable.id, subject.facultyId));

        if (faculty) {

          const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, faculty.userId));

          facultyName = user?.name ?? null;
        }
      }

      const [timetable] = await db
        .select()
        .from(timetableTable)
        .where(eq(timetableTable.subjectId, record.subjectId));

      return {
        id: record.id,

        date: record.date,

        subjectId: record.subjectId,

        subjectName: subject?.name ?? "",

        subjectCode: subject?.code ?? "",

        facultyName,

        startTime: timetable?.startTime ?? null,

        endTime: timetable?.endTime ?? null,

        room: timetable?.room ?? null,

        status: record.status,
      };
    })
  );
  history.sort((a, b) => b.date.localeCompare(a.date));

  res.json(history);
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

router.get("/attendance/export-pdf", async (req, res): Promise<void> => {
  try {
    const { studentId } = req.query as Record<string, string>;

    if (!studentId) {
      res.status(400).json({
        error: "studentId required",
      });
      return;
    }

    const sid = Number(studentId);

    // Student
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

    // User
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, student.userId));

    // Department
    const [department] = await db
      .select()
      .from(departmentsTable)
      .where(eq(departmentsTable.id, student.departmentId));

    // Attendance
    const attendance = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.studentId, sid));

    // ==========================
    // Subject Cache
    // ==========================

    const subjects = await db
      .select()
      .from(subjectsTable);

    const subjectMap = new Map<number, string>();

    subjects.forEach((subject) => {
      subjectMap.set(subject.id, subject.name);
    });

    // PDF create
    const pdf = await PDFDocument.create();

    let page = pdf.addPage([595, 842]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);

    // Next step yahan se start hoga...

    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = page.getWidth();

    let y = 800;

    // =========================
    // College Header
    // =========================

    page.drawText("COLLEGE LMS PLATFORM", {
      x: 50,
      y,
      size: 22,
      font: bold,
      color: rgb(0.10, 0.25, 0.70),
    });

    y -= 28;

    page.drawText("Student Attendance Report", {
      x: 50,
      y,
      size: 14,
      font,
    });

    y -= 15;

    page.drawLine({
      start: { x: 50, y },
      end: { x: pageWidth - 50, y },
      thickness: 1.2,
      color: rgb(0.75, 0.75, 0.75),
    });

    y -= 35;

    // =========================
    // Student Details
    // =========================

    page.drawText("Student Details", {
      x: 50,
      y,
      size: 16,
      font: bold,
    });

    y -= 30;

    page.drawText(`Name : ${user?.name ?? "-"}`, {
      x: 50,
      y,
      size: 11,
      font,
    });

    page.drawText(`Roll No : ${student.rollNumber}`, {
      x: 320,
      y,
      size: 11,
      font,
    });

    y -= 22;

    page.drawText(`Department : ${department?.name ?? "-"}`, {
      x: 50,
      y,
      size: 11,
      font,
    });

    page.drawText(`Semester : ${student.semester}`, {
      x: 320,
      y,
      size: 11,
      font,
    });

    y -= 40;

    const totalClasses = attendance.length;

    const presentClasses = attendance.filter(
      (a) => a.status === "present"
    ).length;

    const percentage =
      totalClasses > 0
        ? Math.round((presentClasses / totalClasses) * 100)
        : 0;

    page.drawText("Attendance Summary", {
      x: 50,
      y,
      size: 16,
      font: bold,
    });

    y -= 30;

    page.drawText(
      `Total Classes : ${totalClasses}`,
      {
        x: 50,
        y,
        size: 11,
        font,
      }
    );

    page.drawText(
      `Present : ${presentClasses}`,
      {
        x: 240,
        y,
        size: 11,
        font,
      }
    );

    page.drawText(
      `Attendance : ${percentage}%`,
      {
        x: 390,
        y,
        size: 11,
        font: bold,
        color:
          percentage >= 75
            ? rgb(0, 0.6, 0)
            : rgb(0.8, 0, 0),
      }
    );

    y -= 35;

    page.drawLine({
      start: { x: 50, y },
      end: { x: pageWidth - 50, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    // =========================
    // Subject Wise Summary
    // =========================

    const subjectSummary = new Map<
      number,
      {
        subjectName: string;
        total: number;
        present: number;
      }
    >();

    for (const item of attendance) {
      if (!subjectSummary.has(item.subjectId)) {
        subjectSummary.set(item.subjectId, {
          subjectName:
            subjectMap.get(item.subjectId) ?? "-",
          total: 0,
          present: 0,
        });
      }

      const s = subjectSummary.get(item.subjectId)!;

      s.total++;

      if (item.status === "present") {
        s.present++;
      }
    }

    page.drawText("Subject-wise Attendance", {
      x: 50,
      y,
      size: 16,
      font: bold,
    });

    y -= 28;

    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: 495,
      height: 22,
      color: rgb(0.92, 0.94, 1),
    });

    page.drawText("Subject", {
      x: 60,
      y,
      size: 10,
      font: bold,
    });

    page.drawText("Present", {
      x: 300,
      y,
      size: 10,
      font: bold,
    });

    page.drawText("Total", {
      x: 380,
      y,
      size: 10,
      font: bold,
    });

    page.drawText("%", {
      x: 470,
      y,
      size: 10,
      font: bold,
    });

    y -= 28;

    for (const subject of subjectSummary.values()) {

      const percent =
        Math.round((subject.present / subject.total) * 100);

      page.drawText(subject.subjectName, {
        x: 60,
        y,
        size: 10,
        font,
      });

      page.drawText(subject.present.toString(), {
        x: 315,
        y,
        size: 10,
        font,
      });

      page.drawText(subject.total.toString(), {
        x: 390,
        y,
        size: 10,
        font,
      });

      page.drawText(`${percent}%`, {
        x: 470,
        y,
        size: 10,
        font: bold,
        color:
          percent >= 75
            ? rgb(0, 0.6, 0)
            : rgb(0.8, 0, 0),
      });

      y -= 20;
    }

    y -= 25;

    // =========================
    // Attendance History
    // =========================

    page.drawText("Attendance History", {
      x: 50,
      y,
      size: 16,
      font: bold,
    });

    y -= 28;

    // Table Header
    const drawHistoryHeader = () => {
      page.drawRectangle({
        x: 50,
        y: y - 5,
        width: 495,
        height: 22,
        color: rgb(0.92, 0.94, 1),
      });

      page.drawText("Date", {
        x: 60,
        y,
        size: 10,
        font: bold,
      });

      page.drawText("Subject", {
        x: 180,
        y,
        size: 10,
        font: bold,
      });

      page.drawText("Status", {
        x: 470,
        y,
        size: 10,
        font: bold,
      });

      y -= 28;
    };

    drawHistoryHeader();

    for (const item of attendance) {

      // New Page if required
      if (y < 70) {

        const newPage = pdf.addPage([595, 842]);

        y = 800;

        page = newPage;

        drawHistoryHeader();
      }

      const subjectName =
        subjectMap.get(item.subjectId) ?? "-";

      page.drawText(item.date, {
        x: 60,
        y,
        size: 10,
        font,
      });

      page.drawText(subjectName, {
        x: 180,
        y,
        size: 10,
        font,
      });

      let color = rgb(0, 0.6, 0);

      if (item.status === "absent") {
        color = rgb(0.85, 0, 0);
      }

      if (item.status === "late") {
        color = rgb(0.9, 0.6, 0);
      }

      page.drawText(item.status.toUpperCase(), {
        x: 470,
        y,
        size: 10,
        font: bold,
        color,
      });

      y -= 18;
    }

    // ==========================
// Footer
// ==========================

const pages = pdf.getPages();

pages.forEach((p, index) => {

  const footerFont = bold;

  p.drawLine({
    start: { x: 50, y: 40 },
    end: { x: 545, y: 40 },
    thickness: 0.8,
    color: rgb(0.8, 0.8, 0.8),
  });

  p.drawText(
    `Generated on : ${new Date().toLocaleString()}`,
    {
      x: 50,
      y: 22,
      size: 9,
      font: footerFont,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  p.drawText(
    `Page ${index + 1} of ${pages.length}`,
    {
      x: 470,
      y: 22,
      size: 9,
      font: footerFont,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

});

    const pdfBytes = await pdf.save();

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Report_${student.rollNumber}.pdf`
    );

    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to generate PDF",
    });
  }
});


export default router;
