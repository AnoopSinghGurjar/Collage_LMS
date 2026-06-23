import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import type { ErrorType } from "./custom-fetch";
import {
  deleteSubject,
  deleteTimetableEntry,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission,
  submitQuizAttempt,
  deleteMaterial,
  updateNotice,
  deleteNotice,
  deleteEvent,
  updateLeaveStatus,
  createTimetableEntry,
} from "./generated/api";
import type {
  SubjectInput,
  AssignmentInput,
  SubmissionInput,
  GradeInput,
  QuizAttemptInput,
  MaterialInput,
  NoticeInput,
  LeaveStatusUpdate,
  TimetableInput,
} from "./generated/api.schemas";

// Delete hooks for resources that orval didn't generate hooks for

export const useDeleteSubject = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteSubject(id),
    ...options?.mutation,
  });
};

export const useDeleteTimetableEntry = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteTimetableEntry(id),
    ...options?.mutation,
  });
};

export const useUpdateAssignment = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAssignment>>, TError, { id: number; data: AssignmentInput }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignmentInput }) => updateAssignment(id, data),
    ...options?.mutation,
  });
};

export const useDeleteAssignment = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteAssignment(id),
    ...options?.mutation,
  });
};

export const useSubmitAssignment = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitAssignment>>, TError, { id: number; data: SubmissionInput }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: SubmissionInput }) => submitAssignment(id, data),
    ...options?.mutation,
  });
};

export const useGradeSubmission = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof gradeSubmission>>, TError, { id: number; data: GradeInput }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GradeInput }) => gradeSubmission(id, data),
    ...options?.mutation,
  });
};

export const useSubmitQuizAttempt = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitQuizAttempt>>, TError, { id: number; data: QuizAttemptInput }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuizAttemptInput }) => submitQuizAttempt(id, data),
    ...options?.mutation,
  });
};

export const useDeleteMaterial = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteMaterial(id),
    ...options?.mutation,
  });
};

export const useUpdateNotice = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateNotice>>, TError, { id: number; data: NoticeInput }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: NoticeInput }) => updateNotice(id, data),
    ...options?.mutation,
  });
};

export const useDeleteNotice = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteNotice(id),
    ...options?.mutation,
  });
};

export const useDeleteEvent = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<void, TError, { id: number }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id }: { id: number }) => deleteEvent(id),
    ...options?.mutation,
  });
};

export const useUpdateLeaveStatus = <TError = ErrorType<unknown>, TContext = unknown>(
  options?: { mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateLeaveStatus>>, TError, { id: number; data: LeaveStatusUpdate }, TContext> }
) => {
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LeaveStatusUpdate }) => updateLeaveStatus(id, data),
    ...options?.mutation,
  });
};
