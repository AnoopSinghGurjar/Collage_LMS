import { pgTable, serial, text, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: integer("subject_id").notNull(),
  facultyId: integer("faculty_id").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  totalMarks: integer("total_marks").notNull().default(10),
  semester: integer("semester"),
  isActive: boolean("is_active").notNull().default(true),
  questions: jsonb("questions").notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  studentId: integer("student_id").notNull(),
  answers: jsonb("answers").notNull().default([]),
  score: integer("score").notNull().default(0),
  totalMarks: integer("total_marks").notNull().default(0),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true });
export const insertQuizAttemptSchema = createInsertSchema(quizAttemptsTable).omit({ id: true, submittedAt: true });
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzesTable.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
