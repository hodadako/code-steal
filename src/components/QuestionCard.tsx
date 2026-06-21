"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Pencil, RefreshCw, Save } from "lucide-react";
import type { Question } from "@/lib/types";
import { QUESTION_TYPE_LABELS, DIFFICULTY_LABELS } from "@/lib/constants";
import { Button } from "./Button";
import { PassageText } from "./PassageText";

interface QuestionCardProps {
  question: Question;
  index: number;
  onSave?: (q: Question) => void;
  onRegenerate?: () => void;
  onUpdate?: (q: Question) => void;
  saved?: boolean;
  showRegenerate?: boolean;
  defaultExpanded?: boolean;
}

export function QuestionCard({
  question,
  index,
  onSave,
  onRegenerate,
  onUpdate,
  saved = false,
  showRegenerate = true,
  defaultExpanded = false,
}: QuestionCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(question);

  const startEdit = () => {
    setDraft(question);
    setEditing(true);
    setExpanded(true);
  };

  const saveEdit = () => {
    onUpdate?.(draft);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(question);
    setEditing(false);
  };

  const q = editing ? draft : question;

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50/80"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-light text-xs font-bold text-accent">
            {index + 1}
          </span>
          <div>
            <p className="text-sm font-semibold">
              {QUESTION_TYPE_LABELS[q.type]}
            </p>
            <p className="text-xs text-muted">
              난이도 {DIFFICULTY_LABELS[q.difficulty]}
              {saved && (
                <span className="ml-2 inline-flex items-center gap-0.5 text-success">
                  <Check size={12} /> 저장됨
                </span>
              )}
            </p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-muted" />
        ) : (
          <ChevronDown size={18} className="text-muted" />
        )}
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-card-border px-5 py-4">
          {editing ? (
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
                    <span className="shrink-0 font-semibold">{choice.label}</span>
                    <span>{choice.text}</span>
                  </li>
                ))}
              </ol>
            </>
          )}

          <div className="flex flex-wrap gap-2 border-t border-card-border pt-3">
            {!editing && (
              <Button size="sm" variant="secondary" onClick={startEdit}>
                <Pencil size={14} />
                편집
              </Button>
            )}
            {showRegenerate && onRegenerate && (
              <Button size="sm" variant="secondary" onClick={onRegenerate}>
                <RefreshCw size={14} />
                재생성
              </Button>
            )}
            {onSave && !saved && (
              <Button size="sm" onClick={() => onSave(q)}>
                <Save size={14} />
                문항 DB 저장
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
