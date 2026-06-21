import type { Difficulty, GenerationOption, QuestionType } from "./types";

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  topic_sentence_en: "주제 문장 선택 (영어)",
  topic_sentence_ko: "주제 문장 선택 (한국어)",
  wrong_vocabulary: "틀린 어휘 찾기",
  wrong_grammar: "틀린 문법 찾기",
  blank_inference: "빈칸 추론",
  sentence_order: "순서 배열",
  sentence_insertion: "문장 삽입",
  summary: "요약문 완성",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "하",
  medium: "중",
  hard: "상",
};

export const CHOICE_LABELS = ["①", "②", "③", "④", "⑤"];

export const DEFAULT_GENERATION_OPTIONS: GenerationOption[] = (
  Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]
).map((type) => ({
  type,
  difficulty: "medium" as Difficulty,
  count: 1,
  enabled: false,
}));

export const SAMPLE_PASSAGE = `The concept of emotional intelligence has gained significant attention in recent years. Unlike traditional intelligence, which focuses on cognitive abilities, emotional intelligence involves the capacity to recognize, understand, and manage our own emotions while also being able to recognize, understand, and influence the emotions of others. Research suggests that individuals with high emotional intelligence tend to have better relationships, perform better at work, and experience greater overall well-being. Developing emotional intelligence requires self-awareness, empathy, and the ability to regulate emotional responses in various situations.`;
