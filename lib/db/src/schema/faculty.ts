import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const facultyTable = pgTable("faculty", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  employeeId: text("employee_id").notNull().unique(),
  phone: text("phone"),
  designation: text("designation"),
  departmentId: integer("department_id").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertFacultySchema = createInsertSchema(facultyTable).omit({ id: true, joinedAt: true });
export type InsertFaculty = z.infer<typeof insertFacultySchema>;
export type Faculty = typeof facultyTable.$inferSelect;
