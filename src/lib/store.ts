"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ExamPaper,
  GeneratedSession,
  Question,
  SourceDocument,
} from "./types";

interface AppState {
  sources: SourceDocument[];
  questions: Question[];
  exams: ExamPaper[];
  currentSession: GeneratedSession | null;

  addSource: (source: Omit<SourceDocument, "id" | "createdAt">) => void;
  addSources: (sources: Omit<SourceDocument, "id" | "createdAt">[]) => void;
  deleteSource: (id: string) => void;

  setCurrentSession: (session: GeneratedSession | null) => void;
  updateSessionQuestion: (question: Question) => void;
  replaceSessionQuestion: (index: number, question: Question) => void;

  saveQuestion: (question: Question) => void;
  updateQuestion: (question: Question) => void;
  deleteQuestion: (id: string) => void;

  createExam: (title: string, questionIds: string[]) => ExamPaper;
  updateExam: (exam: ExamPaper) => void;
  deleteExam: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sources: [],
      questions: [],
      exams: [],
      currentSession: null,

      addSource: (source) =>
        set((state) => ({
          sources: [
            {
              ...source,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
            ...state.sources,
          ],
        })),

      addSources: (sources) =>
        set((state) => ({
          sources: [
            ...sources.map((s) => ({
              ...s,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            })),
            ...state.sources,
          ],
        })),

      deleteSource: (id) =>
        set((state) => ({
          sources: state.sources.filter((s) => s.id !== id),
        })),

      setCurrentSession: (session) => set({ currentSession: session }),

      updateSessionQuestion: (question) =>
        set((state) => {
          if (!state.currentSession) return state;
          return {
            currentSession: {
              ...state.currentSession,
              questions: state.currentSession.questions.map((q) =>
                q.id === question.id ? question : q,
              ),
            },
          };
        }),

      replaceSessionQuestion: (index, question) =>
        set((state) => {
          if (!state.currentSession) return state;
          const questions = [...state.currentSession.questions];
          questions[index] = question;
          return {
            currentSession: { ...state.currentSession, questions },
          };
        }),

      saveQuestion: (question) =>
        set((state) => {
          const exists = state.questions.some((q) => q.id === question.id);
          if (exists) {
            return {
              questions: state.questions.map((q) =>
                q.id === question.id ? question : q,
              ),
            };
          }
          return { questions: [question, ...state.questions] };
        }),

      updateQuestion: (question) =>
        set((state) => ({
          questions: state.questions.map((q) =>
            q.id === question.id ? question : q,
          ),
        })),

      deleteQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
          exams: state.exams.map((exam) => ({
            ...exam,
            questionIds: exam.questionIds.filter((qid) => qid !== id),
          })),
        })),

      createExam: (title, questionIds) => {
        const exam: ExamPaper = {
          id: crypto.randomUUID(),
          title,
          questionIds,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({ exams: [exam, ...state.exams] }));
        return exam;
      },

      updateExam: (exam) =>
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === exam.id
              ? { ...exam, updatedAt: new Date().toISOString() }
              : e,
          ),
        })),

      deleteExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
        })),
    }),
    { name: "exam-platform-storage" },
  ),
);

export function getSourceById(id: string) {
  return useAppStore.getState().sources.find((s) => s.id === id);
}

export function getQuestionById(id: string) {
  return useAppStore.getState().questions.find((q) => q.id === id);
}
