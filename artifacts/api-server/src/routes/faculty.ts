import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, facultyTable, departmentsTable } from "@workspace/db";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "lms_salt").digest("hex");
}

const router: IRouter = Router();

async function getFacultyWithDetails(facultyId: number) {
  const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, facultyId));
  if (!fac) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, fac.userId));
  const [dept] = await db.select().from(departmentsTable).where(eq(departmentsTable.id, fac.departmentId));
  return {
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
  };
}

router.get("/faculty", async (req, res): Promise<void> => {
  const { departmentId, search } = req.query as Record<string, string>;

  const allFaculty = await db
    .select({
      id: facultyTable.id,
      userId: facultyTable.userId,
      employeeId: facultyTable.employeeId,
      phone: facultyTable.phone,
      designation: facultyTable.designation,
      departmentId: facultyTable.departmentId,
      joinedAt: facultyTable.joinedAt,
      name: usersTable.name,
      email: usersTable.email,
      avatar: usersTable.avatar,
      deptName: departmentsTable.name,
    })
    .from(facultyTable)
    .leftJoin(usersTable, eq(facultyTable.userId, usersTable.id))
    .leftJoin(departmentsTable, eq(facultyTable.departmentId, departmentsTable.id));

  const filtered = allFaculty
    .filter((f) => !departmentId || f.departmentId === parseInt(departmentId, 10))
    .filter(
      (f) =>
        !search ||
        f.name?.toLowerCase().includes(search.toLowerCase()) ||
        f.email?.toLowerCase().includes(search.toLowerCase()) ||
        f.employeeId.toLowerCase().includes(search.toLowerCase())
    );

  res.json(
    filtered.map((f) => ({
      id: f.id,
      name: f.name ?? "",
      email: f.email ?? "",
      employeeId: f.employeeId,
      phone: f.phone,
      designation: f.designation,
      departmentId: f.departmentId,
      departmentName: f.deptName ?? null,
      avatar: f.avatar ?? null,
      joinedAt: f.joinedAt.toISOString(),
    }))
  );
});

router.post("/faculty", async (req, res): Promise<void> => {
  const { name, email, employeeId, departmentId, password, phone, designation } = req.body;
  if (!name || !email || !employeeId || !departmentId || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: "faculty",
      departmentId,
    })
    .returning();

  const [fac] = await db
    .insert(facultyTable)
    .values({ userId: user.id, employeeId, departmentId, phone: phone ?? null, designation: designation ?? null })
    .returning();

  const result = await getFacultyWithDetails(fac.id);
  res.status(201).json(result);
});

router.get("/faculty/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const result = await getFacultyWithDetails(id);
  if (!result) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(result);
});

router.patch("/faculty/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { name, phone, designation, departmentId } = req.body;

  const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, id));
  if (!fac) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (name != null) {
    await db.update(usersTable).set({ name }).where(eq(usersTable.id, fac.userId));
  }

  const updates: Record<string, unknown> = {};
  if (phone != null) updates.phone = phone;
  if (designation != null) updates.designation = designation;
  if (departmentId != null) updates.departmentId = departmentId;

  if (Object.keys(updates).length > 0) {
    await db.update(facultyTable).set(updates).where(eq(facultyTable.id, id));
  }

  const result = await getFacultyWithDetails(id);
  res.json(result);
});

router.delete("/faculty/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const [fac] = await db.select().from(facultyTable).where(eq(facultyTable.id, id));
  if (fac) {
    await db.delete(facultyTable).where(eq(facultyTable.id, id));
    await db.delete(usersTable).where(eq(usersTable.id, fac.userId));
  }
  res.json({ message: "Deleted" });
});

export default router;
