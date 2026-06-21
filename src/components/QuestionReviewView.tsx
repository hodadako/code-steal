"use client";

import { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RefreshCw,
  Save,
} from "lucide-react";
import type { Question, SourceDocument } from "@/lib/types";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
import { Button } from "./Button";
import { PassageText } from "./PassageText";

interface QuestionReviewViewProps {
  source: SourceDocument;
  questions: Question[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  savedIds: Set<string>;
  generating?: boolean;
  onRegenerate: (index: number) => void;
  onUpdate: (question: Question) => void;
  onSave: (question: Question) => void;
  onRegenerateAll: () => void;
  onBackToGenerate: () => void;
  mockIndices?: number[];
}

export function QuestionReviewView({
  source,
  questions,
  currentIndex,
  onIndexChange,
  savedIds,
  generating = false,
  onRegenerate,
  onUpdate,
  onSave,
  onRegenerateAll,
  onBackToGenerate,
  mockIndices = [],
}: QuestionReviewViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Question | null>(null);

  const question = questions[currentIndex];
  if (!question) return null;

  const saved = savedIds.has(question.id);
  const isMock = mockIndices.includes(currentIndex);
  const q = editing && draft ? draft : question;

  const startEdit = () => {
    setDraft(question);
    setEditing(true);
  };

  const saveEdit = () => {
    if (draft) onUpdate(draft);
    setEditing(false);
    setDraft(null);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setEditing(false);
      setDraft(null);
      onIndexChange(currentIndex - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < questions.length - 1) {
      setEditing(false);
      setDraft(null);
      onIndexChange(currentIndex + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={onBackToGenerate}>
            ← 생성 옵션
          </Button>
          <p className="text-sm font-semibold">
            문항 검수 ({currentIndex + 1} / {questions.length})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={goPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft size={16} />
            이전
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
          >
            다음
            <ChevronRight size={16} />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onRegenerateAll}
            disabled={generating}
          >
            <RefreshCw size={14} />
            전체 재생성
          </Button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-100 p-1">
        {questions.map((item, i) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(null);
              onIndexChange(i);
            }}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              i === currentIndex
                ? "bg-white text-accent shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {i + 1}번
            {mockIndices.includes(i) && (
              <span className="ml-1 text-warning">M</span>
            )}
            {savedIds.has(item.id) && (
              <Check size={10} className="ml-1 inline text-success" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-card-border bg-card">
          <div className="border-b border-card-border px-4 py-2.5">
            <p className="text-xs font-semibold text-muted">원본 지문</p>
          </div>
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-4">
            <p className="mb-2 text-sm font-medium">{source.title}</p>
            <PassageText text={source.passage} />
            {source.explanation && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-xs text-muted">
                <p className="mb-1 font-medium">해설</p>
                {source.explanation}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card">
          <div className="flex items-center justify-between border-b border-card-border px-4 py-2.5">
            <div>
              <p className="text-xs font-semibold text-muted">생성 문항</p>
              <p className="text-sm font-medium">
                {QUESTION_TYPE_LABELS[q.type]}
                <span className="ml-2 text-xs font-normal text-muted">
                  난이도 {DIFFICULTY_LABELS[q.difficulty]}
                </span>
                {saved && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-success">
                    <Check size={12} /> 저장됨
                  </span>
                )}
                {isMock && (
                  <span className="ml-2 inline-flex items-center rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    mock 대체
                  </span>
                )}
              </p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-light text-xs font-bold text-accent">
              {currentIndex + 1}
            </span>
          </div>

          <div className="max-h-[calc(100vh-340px)] space-y-4 overflow-y-auto p-4">
            {editing && draft ? (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    지문
                  </label>
                  <textarea
                    value={draft.passage}
                    onChange={(e) =>
                      setDraft({ ...draft, passage: e.target.value })
                    }
                    rows={6}
                    className="w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">
                    문제
                  </label>
                  <input
                    value={draft.question}
                    onChange={(e) =>
                      setDraft({ ...draft, question: e.target.value })
                    }
                    className="w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-muted">
                    선지
                  </label>
                  {draft.choices.map((choice, ci) => (
                    <div key={ci} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraft({ ...draft, answer: ci })}
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs font-bold transition-colors ${
                          draft.answer === ci
                            ? "bg-accent text-white"
                            : "bg-gray-100 text-muted hover:bg-gray-200"
                        }`}
                        title="정답으로 설정"
                      >
                        {choice.label}
                      </button>
                      <input
                        value={choice.text}
                        onChange={(e) => {
                          const choices = [...draft.choices];
                          choices[ci] = { ...choice, text: e.target.value };
                          setDraft({ ...draft, choices });
                        }}
                        className="flex-1 rounded-lg border border-card-border px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveEdit}>
                    편집 저장
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEdit}>
                    취소
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-lg bg-gray-50 p-4">
                  <PassageText text={q.passage} />
                </div>
                <p className="text-sm font-medium">{q.question}</p>
                <ol className="space-y-2">
                  {q.choices.map((choice, ci) => (
                    <li
                      key={ci}
                      className={`flex gap-2 rounded-lg px-3 py-2 text-sm ${
                        ci === q.answer
                          ? "bg-accent-light font-medium text-accent"
                          : "text-foreground"
                      }`}
                    >
                      <span className="shrink-0 font-semibold">
                        {choice.label}
                      </span>
                      <span>{choice.text}</span>
                    </li>
                  ))}
                </ol>
                {q.explanation && (
                  <div className="rounded-lg bg-gray-50 p-3 text-xs text-muted">
                    <p className="mb-1 font-medium">해설</p>
                    {q.explanation}
                  </div>
                )}
              </>
            )}
          </div>

          {!editing && (
            <div className="flex flex-wrap gap-2 border-t border-card-border px-4 py-3">
              <Button size="sm" variant="secondary" onClick={startEdit}>
                <Pencil size={14} />
                편집
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onRegenerate(currentIndex)}
                disabled={generating}
              >
                <RefreshCw size={14} />
                재생성
              </Button>
              {!saved && (
                <Button size="sm" onClick={() => onSave(q)}>
                  <Save size={14} />
                  문항 DB 저장
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
