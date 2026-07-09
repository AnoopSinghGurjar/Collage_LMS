import { pgTable, serial, integer, numeric, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resultsTable = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  subjectId: integer("subject_id").notNull(),
  semester: integer("semester").notNull(),
  internalMarks: numeric("internal_marks", { precision: 5, scale: 2 }).notNull(),
  externalMarks: numeric("external_marks", { precision: 5, scale: 2 }).notNull(),
  totalMarks: numeric("total_marks", { precision: 5, scale: 2 }).notNull(),
  grade: text("grade").notNull(),
  passed: boolean("passed").notNull().default(true),

  remarks: text("remarks"),

published: boolean("published")
  .notNull()
  .default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(resultsTable).omit({ id: true, createdAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof resultsTable.$inferSelect;
