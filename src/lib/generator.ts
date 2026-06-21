import type {
  Difficulty,
  GenerationOption,
  Question,
  QuestionChoice,
  QuestionType,
  SourceDocument,
} from "./types";
import { CHOICE_LABELS } from "./constants";

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeChoices(texts: string[], answerIdx: number): QuestionChoice[] {
  return texts.map((text, i) => ({
    label: CHOICE_LABELS[i],
    text,
  }));
}

function difficultyPrefix(difficulty: Difficulty): string {
  const map = { easy: "[하]", medium: "[중]", hard: "[상]" };
  return map[difficulty];
}

function generateTopicSentenceEn(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const sentences = splitSentences(source.passage);
  const topicIdx = Math.min(1, sentences.length - 1);
  const correct = sentences[topicIdx] || sentences[0];
  const distractors = shuffle(sentences.filter((_, i) => i !== topicIdx)).slice(
    0,
    4,
  );
  const all = shuffle([correct, ...distractors]);
  const answer = all.indexOf(correct);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "topic_sentence_en",
    difficulty,
    passage: source.passage,
    question: `${difficultyPrefix(difficulty)} 다음 글의 주제로 가장 적절한 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

function generateTopicSentenceKo(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const topics = [
    "감정 지능의 개념과 그 중요성",
    "전통적 지능과 감정 지능의 차이",
    "감정 지능이 대인관계에 미치는 영향",
    "감정 지능을 발달시키는 방법",
    "감정 조절 능력의 필요성",
  ];
  const correct = topics[0];
  const all = shuffle(topics);
  const answer = all.indexOf(correct);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "topic_sentence_ko",
    difficulty,
    passage: source.passage,
    question: `${difficultyPrefix(difficulty)} 다음 글의 주제로 가장 적절한 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

function generateWrongVocabulary(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const words = source.passage.match(/\b[a-zA-Z]{5,}\b/g) || ["intelligence"];
  const targetWord = pickRandom(words);
  const wrongWord = targetWord.slice(0, -2) + "ly";
  const passageWithUnderline = source.passage.replace(
    targetWord,
    `<u>${wrongWord}</u>`,
  );

  const underlinedWords = [
    wrongWord,
    ...shuffle(words.filter((w) => w !== targetWord)).slice(0, 4),
  ];
  const all = shuffle(underlinedWords);
  const answer = all.indexOf(wrongWord);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "wrong_vocabulary",
    difficulty,
    passage: passageWithUnderline,
    question: `${difficultyPrefix(difficulty)} 다음 글의 밑줄 친 부분 중, 문맥상 낱말의 쓰임이 적절하지 않은 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

function generateWrongGrammar(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const sentences = splitSentences(source.passage);
  const numbered = sentences
    .map((s, i) => `${String.fromCharCode(9312 + i)} ${s}`)
    .join("\n");

  const grammarErrors = [
    "involves → involve",
    "being able → be able",
    "suggests → suggest",
    "requires → require",
    "which focuses → focusing",
  ];

  const errorIdx = Math.min(1, sentences.length - 1);
  const all = shuffle(grammarErrors);
  const answer = 0;

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "wrong_grammar",
    difficulty,
    passage: numbered,
    question: `${difficultyPrefix(difficulty)} 다음 글의 밑줄 친 부분 중, 어법상 틀린 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

function generateBlankInference(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const sentences = splitSentences(source.passage);
  const mid = Math.floor(sentences.length / 2);
  const before = sentences.slice(0, mid).join(" ");
  const after = sentences.slice(mid + 1).join(" ");
  const passage = `${before} ________________________ ${after}`;

  const options = [
    "emotional awareness plays a crucial role in personal success",
    "physical strength determines one's career outcomes",
    "mathematical ability is unrelated to social skills",
    "memory capacity alone defines intelligence",
    "genetic factors completely determine behavior",
  ];
  const all = shuffle(options);
  const answer = all.indexOf(options[0]);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "blank_inference",
    difficulty,
    passage,
    question: `${difficultyPrefix(difficulty)} 다음 빈칸에 들어갈 말로 가장 적절한 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

function generateSentenceOrder(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const sentences = splitSentences(source.passage).slice(0, 4);
  const labels = ["(A)", "(B)", "(C)", "(D)"];
  const shuffled = shuffle(sentences);
  const passage = shuffled
    .map((s, i) => `${labels[i]} ${s}`)
    .join("\n\n");

  const orders = ["(A) - (C) - (B) - (D)", "(B) - (A) - (D) - (C)", "(C) - (D) - (A) - (B)", "(D) - (B) - (C) - (A)", "(A) - (B) - (C) - (D)"];
  const all = shuffle(orders);
  const answer = all.indexOf("(A) - (C) - (B) - (D)");

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "sentence_order",
    difficulty,
    passage,
    question: `${difficultyPrefix(difficulty)} 주어진 글 다음에 이어질 글의 순서로 가장 적절한 것은?`,
    choices: makeChoices(all, answer >= 0 ? answer : 0),
    answer: answer >= 0 ? answer : 0,
    explanation: source.explanation,
  };
}

function generateSentenceInsertion(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const sentences = splitSentences(source.passage);
  const insertSentence =
    "This ability can be cultivated through practice and mindful reflection.";
  const parts = [
    sentences.slice(0, 2).join(" "),
    sentences.slice(2, 4).join(" "),
    sentences.slice(4).join(" "),
  ];
  const passage = `${parts[0]}\n\n① ${parts[1] || "..."}\n\n② ${parts[2] || "..."}\n\n③ ...\n\n④ ...\n\n⑤ ...`;

  const options = [
    insertSentence,
    "Physical exercise is the only way to improve cognitive function.",
    "Technology has replaced the need for human interaction entirely.",
    "Financial success depends solely on academic achievement.",
    "Sleep deprivation has no effect on emotional regulation.",
  ];
  const all = shuffle(options);
  const answer = all.indexOf(insertSentence);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "sentence_insertion",
    difficulty,
    passage,
    question: `${difficultyPrefix(difficulty)} 다음 글에서 주어진 문장이 들어가기에 가장 적절한 곳은?`,
    choices: [
      { label: "주어진 문장", text: insertSentence },
      ...makeChoices(["①", "②", "③", "④", "⑤"], 1),
    ],
    answer: 1,
    explanation: source.explanation,
  };
}

function generateSummary(
  source: SourceDocument,
  difficulty: Difficulty,
): Omit<Question, "id" | "createdAt"> {
  const passage = source.passage.replace(
    /\b\w+\b/g,
    (word, offset) =>
      offset > source.passage.length * 0.3 && offset < source.passage.length * 0.7
        ? "______"
        : word,
  );

  const options = [
    "Emotional intelligence encompasses recognizing and managing emotions effectively.",
    "Traditional IQ tests accurately measure all forms of human capability.",
    "Physical fitness is more important than mental health for success.",
    "Emotional responses cannot be changed through conscious effort.",
    "Social skills have no correlation with workplace performance.",
  ];
  const all = shuffle(options);
  const answer = all.indexOf(options[0]);

  return {
    sourceId: source.id,
    sourceTitle: source.title,
    type: "summary",
    difficulty,
    passage,
    question: `${difficultyPrefix(difficulty)} 다음 글의 내용을 한 문장으로 요약할 때, 빈칸에 들어갈 말로 가장 적절한 것은?`,
    choices: makeChoices(all, answer),
    answer,
    explanation: source.explanation,
  };
}

const generators: Record<
  QuestionType,
  (source: SourceDocument, difficulty: Difficulty) => Omit<Question, "id" | "createdAt">
> = {
  topic_sentence_en: generateTopicSentenceEn,
  topic_sentence_ko: generateTopicSentenceKo,
  wrong_vocabulary: generateWrongVocabulary,
  wrong_grammar: generateWrongGrammar,
  blank_inference: generateBlankInference,
  sentence_order: generateSentenceOrder,
  sentence_insertion: generateSentenceInsertion,
  summary: generateSummary,
};

export function generateQuestions(
  source: SourceDocument,
  options: GenerationOption[],
): Question[] {
  const enabled = options.filter((o) => o.enabled);
  const questions: Question[] = [];

  for (const opt of enabled) {
    const gen = generators[opt.type];
    for (let i = 0; i < opt.count; i++) {
      const base = gen(source, opt.difficulty);
      questions.push({
        ...base,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      });
    }
  }

  return questions;
}

export function regenerateSingleQuestion(
  source: SourceDocument,
  type: QuestionType,
  difficulty: Difficulty,
): Question {
  const base = generators[type](source, difficulty);
  return {
    ...base,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
}
