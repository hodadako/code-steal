import { DIFFICULTY_LABELS, QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { Difficulty, GenerationOption, QuestionType, SourceDocument } from "@/lib/types";

const TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  topic_sentence_en:
    "주제 문장 선택 (영어): 지문의 주제를 가장 잘 나타내는 영어 문장 1개가 정답. 나머지 4개는 그럴듯한 오답 영어 문장.",
  topic_sentence_ko:
    "주제 문장 선택 (한국어): 지문의 주제를 가장 잘 나타내는 한국어 문장 1개가 정답. 나머지 4개는 그럴듯한 오답 한국어 문장.",
  wrong_vocabulary:
    "틀린 어휘 찾기: 지문에서 5개 단어/구에 밑줄(<u>...</u>) 처리. 4개는 문맥상 적절, 1개만 부적절. passage에 HTML <u> 태그 포함.",
  wrong_grammar:
    "틀린 문법 찾기: 지문을 ①~⑤ 번호 문장으로 나눔. 4개는 어법상 올바르고 1개만 틀림. choices는 'involves → involve' 형식으로 틀린 부분 표시.",
  blank_inference:
    "빈칸 추론: 지문 일부를 ______ 빈칸으로 대체. 5개 영어 선지 중 문맥상 가장 적절한 것.",
  sentence_order:
    "순서 배열: (A)(B)(C)(D) 4문장을 무작위 순서로 제시. choices는 '(A)-(C)-(B)-(D)' 형식의 순서 5개.",
  sentence_insertion:
    "문장 삽입: 주어진 문장 1개와 ①~⑤ 위치가 있는 지문. choices는 삽입 위치 ①~⑤.",
  summary:
    "요약문 완성: 지문 핵심을 한 문장 요약문으로 만들되 일부를 ______ 빈칸 처리. 5개 선지.",
};

function difficultyGuide(d: Difficulty): string {
  const guides = {
    easy: "쉬운 어휘, 명확한 단서, 오답과 정답 차이가 분명하게",
    medium: "수능 중간 난이도, 적당한 함정",
    hard: "미묘한 함정, 고급 어휘, 오답도 그럴듯하게",
  };
  return guides[d];
}

export interface PromptTask {
  type: QuestionType;
  difficulty: Difficulty;
  count: number;
}

export function buildGenerationPrompt(
  source: SourceDocument,
  tasks: PromptTask[],
): string {
  const taskList = tasks
    .map(
      (t) =>
        `- ${QUESTION_TYPE_LABELS[t.type]} (${t.count}문항, 난이도 ${DIFFICULTY_LABELS[t.difficulty]}): ${TYPE_INSTRUCTIONS[t.type]} · ${difficultyGuide(t.difficulty)}`,
    )
    .join("\n");

  return `당신은 한국 수능 영어 시험 유사 문제 출제 전문가입니다.
아래 원본 지문을 바탕으로 **새로운 유사 문제**를 만드세요. 원본과 동일한 문장을 그대로 쓰지 말고, 같은 주제·난이도대의 변형 지문/문항을 만드세요.

## 원본 지문
${source.passage}

${source.explanation ? `## 참고 해설\n${source.explanation}\n` : ""}
## 생성할 문항
${taskList}

## 출력 규칙
- 반드시 JSON만 출력 (마크다운·설명 금지)
- 형식: {"questions": [ ... ]} — questions 배열에 문항 객체
- 각 문항: type, difficulty, passage, question, choices(문자열 5개), answer(0~4 정수), explanation(한국어 해설)
- question은 "[하/중/상]" 접두어 없이 순수 문제 지시문만
- choices는 정확히 5개
- answer는 choices 배열에서 정답의 0-based index

JSON 형식:
{
  "questions": [
    {
      "type": "topic_sentence_en",
      "difficulty": "medium",
      "passage": "...",
      "question": "다음 글의 주제로 가장 적절한 것은?",
      "choices": ["선지1", "선지2", "선지3", "선지4", "선지5"],
      "answer": 0,
      "explanation": "해설"
    }
  ]
}`;
}
