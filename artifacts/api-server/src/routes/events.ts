import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const { month, year } = req.query as Record<string, string>;

  const all = await db.select().from(eventsTable).orderBy(eventsTable.startDate);
  const filtered = all.filter((e) => {
    if (month && year) {
      const d = new Date(e.startDate);
      return d.getMonth() + 1 === parseInt(month, 10) && d.getFullYear() === parseInt(year, 10);
    }
    return true;
  });

  res.json(filtered.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() })));
});

router.post("/events", async (req, res): Promise<void> => {
  const { title, description, startDate, endDate, type, departmentId } = req.body;
  if (!title || !startDate || !type) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [event] = await db
    .insert(eventsTable)
    .values({ title, description: description ?? null, startDate, endDate: endDate ?? null, type, departmentId: departmentId ?? null })
    .returning();

  res.status(201).json({ ...event, createdAt: event.createdAt.toISOString() });
});

router.delete("/events/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.json({ message: "Deleted" });
});

export default router;
