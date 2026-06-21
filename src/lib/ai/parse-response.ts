import { CHOICE_LABELS } from "@/lib/constants";
import type {
  Difficulty,
  Question,
  QuestionType,
  SourceDocument,
} from "@/lib/types";

interface RawQuestion {
  type?: string;
  difficulty?: string;
  passage?: string;
  question?: string;
  choices?: unknown[];
  answer?: number;
  explanation?: string;
}

const VALID_TYPES = new Set<string>([
  "topic_sentence_en",
  "topic_sentence_ko",
  "wrong_vocabulary",
  "wrong_grammar",
  "blank_inference",
  "sentence_order",
  "sentence_insertion",
  "summary",
]);

const VALID_DIFFICULTIES = new Set<string>(["easy", "medium", "hard"]);

const TYPE_ALIASES: Record<string, QuestionType> = {
  topic_sentence_en: "topic_sentence_en",
  topic_sentence_ko: "topic_sentence_ko",
  wrong_vocabulary: "wrong_vocabulary",
  wrong_grammar: "wrong_grammar",
  blank_inference: "blank_inference",
  sentence_order: "sentence_order",
  sentence_insertion: "sentence_insertion",
  summary: "summary",
  "주제 문장 선택 (영어)": "topic_sentence_en",
  "주제 문장 선택 (한국어)": "topic_sentence_ko",
};

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(raw);
}

function toRawItems(parsed: unknown): RawQuestion[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    if ("questions" in parsed) {
      return (parsed as { questions: RawQuestion[] }).questions ?? [];
    }
    if ("passage" in parsed || "question" in parsed || "choices" in parsed) {
      return [parsed as RawQuestion];
    }
  }
  return [];
}

function normalizeAnswer(raw: unknown, len: number): number {
  if (typeof raw === "number" && raw >= 0 && raw < len) return raw;
  if (typeof raw === "string") {
    const circled: Record<string, number> = {
      "①": 0,
      "②": 1,
      "③": 2,
      "④": 3,
      "⑤": 4,
    };
    if (raw in circled) return circled[raw];
    const n = Number(raw);
    if (!Number.isNaN(n)) {
      if (n >= 0 && n < len) return n;
      if (n >= 1 && n <= len) return n - 1;
    }
  }
  return 0;
}

function normalizeType(raw: string): QuestionType | null {
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  if (TYPE_ALIASES[key]) return TYPE_ALIASES[key];
  if (VALID_TYPES.has(key)) return key as QuestionType;
  if (TYPE_ALIASES[raw.trim()]) return TYPE_ALIASES[raw.trim()];
  return null;
}

function normalizeDifficulty(raw: string): Difficulty | null {
  const key = raw.trim().toLowerCase();
  if (VALID_DIFFICULTIES.has(key)) return key as Difficulty;
  const koMap: Record<string, Difficulty> = {
    하: "easy",
    중: "medium",
    상: "hard",
    easy: "easy",
    medium: "medium",
    hard: "hard",
  };
  return koMap[key] ?? null;
}

function normalizeChoiceText(choice: unknown): string {
  if (typeof choice === "string") return choice;
  if (choice && typeof choice === "object") {
    const obj = choice as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.choice === "string") return obj.choice;
    if (typeof obj.content === "string") return obj.content;
  }
  return String(choice ?? "");
}

export function parseAiQuestions(
  text: string,
  source: SourceDocument,
  expectedType?: QuestionType,
  expectedDifficulty?: Difficulty,
): Question[] {
  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    return [];
  }
  const items = toRawItems(parsed);

  const results: Question[] = [];

  for (const item of items) {
    let type = item.type ? normalizeType(String(item.type)) : null;
    if (!type && expectedType) type = expectedType;
    if (expectedType && type && type !== expectedType) type = expectedType;

    let difficulty = item.difficulty
      ? normalizeDifficulty(String(item.difficulty))
      : null;
    if (!difficulty && expectedDifficulty) difficulty = expectedDifficulty;

    if (!type || !difficulty || !item.passage || !item.question) continue;
    if (!Array.isArray(item.choices) || item.choices.length < 3) continue;

    const choices = item.choices.slice(0, 5).map((c, i) => ({
      label: CHOICE_LABELS[i] ?? `${i + 1}`,
      text: normalizeChoiceText(c),
    }));
    while (choices.length < 5) {
      choices.push({
        label: CHOICE_LABELS[choices.length],
        text: "",
      });
    }
    const answer = normalizeAnswer(item.answer, choices.length);

    results.push({
      id: crypto.randomUUID(),
      sourceId: source.id,
      sourceTitle: source.title,
      type,
      difficulty,
      passage: String(item.passage),
      question: String(item.question),
      choices,
      answer,
      explanation: item.explanation ? String(item.explanation) : undefined,
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}
