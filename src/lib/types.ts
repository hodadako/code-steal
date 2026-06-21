export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "topic_sentence_en"
  | "topic_sentence_ko"
  | "wrong_vocabulary"
  | "wrong_grammar"
  | "blank_inference"
  | "sentence_order"
  | "sentence_insertion"
  | "summary";

export interface SourceDocument {
  id: string;
  title: string;
  passage: string;
  explanation?: string;
  createdAt: string;
}

export interface GenerationOption {
  type: QuestionType;
  difficulty: Difficulty;
  count: 1 | 2 | 3;
  enabled: boolean;
}

export interface QuestionChoice {
  label: string;
  text: string;
}

export interface Question {
  id: string;
  sourceId: string;
  sourceTitle: string;
  type: QuestionType;
  difficulty: Difficulty;
  passage: string;
  question: string;
  choices: QuestionChoice[];
  answer: number;
  explanation?: string;
  createdAt: string;
}

export interface ExamPaper {
  id: string;
  title: string;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedSession {
  sourceId: string;
  questions: Question[];
  mockIndices?: number[];
}
