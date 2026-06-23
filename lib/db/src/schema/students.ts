import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studentsTable = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  rollNumber: text("roll_number").notNull().unique(),
  phone: text("phone"),
  semester: integer("semester").notNull().default(1),
  departmentId: integer("department_id").notNull(),
  enrolledAt: timestamp("enrolled_at").defaultNow().notNull(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, enrolledAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
