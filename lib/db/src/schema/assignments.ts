import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assignmentsTable = pgTable("assignments", {
  id: serial("id").primaryKey(),

  title: text("title").notNull(),

  description: text("description"),

  subjectId: integer("subject_id").notNull(),

  facultyId: integer("faculty_id").notNull(),

  semester: integer("semester"),

  dueDate: text("due_date").notNull(),

  maxMarks: integer("max_marks").notNull().default(100),

  // 👇 NEW
  attachmentUrl: text("attachment_url"),

  attachmentName: text("attachment_name"),

  attachmentType: text("attachment_type"),

  isPublished: boolean("is_published")
    .notNull()
    .default(true),

  createdAt: timestamp("created_at")
    .defaultNow()
    .notNull(),
});

export const submissionsTable = pgTable("submissions", {
  id: serial("id").primaryKey(),

  assignmentId: integer("assignment_id").notNull(),

  studentId: integer("student_id").notNull(),

  // 👇 NEW
  fileUrl: text("file_url"),

  fileName: text("file_name"),

  fileType: text("file_type"),

  notes: text("notes"),

  marks: integer("marks"),

  feedback: text("feedback"),

  status: text("status")
    .notNull()
    .default("submitted"),

  gradedBy: integer("graded_by"),

  gradedAt: timestamp("graded_at"),

  submittedAt: timestamp("submitted_at")
    .defaultNow()
    .notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ id: true, createdAt: true });
export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ id: true, submittedAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
