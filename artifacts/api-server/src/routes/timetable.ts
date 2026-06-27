import { Router, type IRouter } from "express";
import multer from "multer";
import XLSX from "xlsx";
import { departmentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { db, timetableTable, subjectsTable, facultyTable, usersTable } from "@workspace/db";

const router: IRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
});

async function findDepartmentId(name: string) {
  const departments = await db.select().from(departmentsTable);

  const department = departments.find(
    (d) => d.name.toLowerCase() === name.toLowerCase().trim(),
  );

  return department?.id ?? null;
}

async function findSubjectId(name: string) {
  const subjects = await db.select().from(subjectsTable);

  const subject = subjects.find(
    (s) => s.name.toLowerCase() === name.toLowerCase().trim(),
  );

  return subject?.id ?? null;
}

async function findFacultyId(name: string) {
  const users = await db.select().from(usersTable);

  const user = users.find(
    (u) =>
      u.role === "faculty" &&
      u.name.toLowerCase() === name.toLowerCase().trim(),
  );

  if (!user) return null;

  const faculty = await db.select().from(facultyTable);

  const facultyRecord = faculty.find((f) => f.userId === user.id);

  return facultyRecord?.id ?? null;
}

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

router.post(
  "/timetable/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {

      if (!req.file) {
        res.status(400).json({
          error: "Please upload an Excel file",
        });
        return;
      }

      // ✅ Allow only Excel files
      const allowedMimeTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        res.status(400).json({
          error: "Only .xlsx and .xls files are allowed",
        });
        return;
      }

      const workbook = XLSX.read(req.file.buffer, {
        type: "buffer",
      });

      const sheetName = workbook.SheetNames[0];

      const sheet = workbook.Sheets[sheetName];

      const rows = XLSX.utils.sheet_to_json<any>(sheet);

      const requiredColumns = [
        "Department",
        "Semester",
        "Subject",
        "Faculty",
        "Day",
        "Start Time",
        "End Time",
        "Room",
      ];

      if (rows.length === 0) {
        res.status(400).json({
          error: "Excel file is empty",
        });
        return;
      }

      const missingColumns = requiredColumns.filter(
        (column) => !(column in rows[0])
      );

      if (missingColumns.length > 0) {
        res.status(400).json({
          error: `Missing columns: ${missingColumns.join(", ")}`,
        });
        return;
      }

      let inserted = 0;
      const errors: any[] = [];

      for (const row of rows) {
        try {
          const departmentId = await findDepartmentId(row.Department);
          const subjectId = await findSubjectId(row.Subject);
          const facultyId = await findFacultyId(row.Faculty);

          if (!departmentId) {
            errors.push({
              row,
              error: "Department not found",
            });
            continue;
          }

          if (!subjectId) {
            errors.push({
              row,
              error: "Subject not found",
            });
            continue;
          }

          if (!facultyId) {
            errors.push({
              row,
              error: "Faculty not found",
            });
            continue;
          }

          await db.insert(timetableTable).values({
            departmentId,
            semester: Number(row.Semester),
            subjectId,
            facultyId,
            dayOfWeek: row.Day,
            startTime: row["Start Time"],
            endTime: row["End Time"],
            room: row.Room,
          });

          inserted++;
        } catch (e) {
          errors.push({
            row,
            error: "Database error",
          });
        }
      }

      res.json({
        success: true,
        totalRows: rows.length,
        inserted,
        failed: errors.length,
        errors,
      });


    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: "Failed to read excel",
      });
    }
  },
);

router.get("/timetable/template", async (_req, res) => {
  const workbook = XLSX.utils.book_new();

  const rows = [
    [
      "Department",
      "Semester",
      "Subject",
      "Faculty",
      "Day",
      "Start Time",
      "End Time",
      "Room",
    ],
    [
      "Computer Science & Engineering",
      3,
      "Data Structures & Algorithms",
      "Prof. Anita Verma",
      "Monday",
      "09:00",
      "10:00",
      "CS-101",
    ],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, sheet, "Timetable");

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="Timetable_Template.xlsx"',
  );

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

  res.send(buffer);
});

router.get("/timetable/export", async (req, res): Promise<void> => {
  const {
    departmentId,
    semester,
    facultyId,
  } = req.query as Record<string, string>;
  try {
    const all = await db.select().from(timetableTable);

    const timetable = all
      .filter(
        (t) =>
          !departmentId || t.departmentId === Number(departmentId),
      )
      .filter(
        (t) =>
          !semester || t.semester === Number(semester),
      )
      .filter(
        (t) =>
          !facultyId || t.facultyId === Number(facultyId),
      );

    const rows = [];

    for (const t of timetable) {
      const [subject] = await db
        .select()
        .from(subjectsTable)
        .where(eq(subjectsTable.id, t.subjectId));

      const [faculty] = await db
        .select()
        .from(facultyTable)
        .where(eq(facultyTable.id, t.facultyId));

      let facultyName = "";

      if (faculty) {
        const [user] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, faculty.userId));

        facultyName = user?.name ?? "";
      }

      rows.push({
        Department: t.departmentId,
        Semester: t.semester,
        Subject: subject?.name ?? "",
        Faculty: facultyName,
        Day: t.dayOfWeek,
        "Start Time": t.startTime,
        "End Time": t.endTime,
        Room: t.room,
      });
    }

    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(rows);

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Timetable",
    );

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Current_Timetable.xlsx"',
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.send(buffer);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Export failed",
    });
  }
});

export default router;
