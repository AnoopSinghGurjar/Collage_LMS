import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timetableTable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  dayOfWeek: text("day_of_week").notNull(), // Monday-Friday
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(),
  room: text("room"),
  semester: integer("semester").notNull(),
  departmentId: integer("department_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTimetableSchema = createInsertSchema(timetableTable).omit({ id: true, createdAt: true });
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type Timetable = typeof timetableTable.$inferSelect;
