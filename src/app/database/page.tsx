"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { QuestionCard } from "@/components/QuestionCard";
import { useAppStore } from "@/lib/store";
import {
  QUESTION_TYPE_LABELS,
} from "@/lib/constants";
import type { QuestionType } from "@/lib/types";
import { useHydration } from "@/hooks/useHydration";
import { Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";

export default function DatabasePage() {
  const hydrated = useHydration();
  const questions = useAppStore((s) => s.questions);
  const updateQuestion = useAppStore((s) => s.updateQuestion);
  const deleteQuestion = useAppStore((s) => s.deleteQuestion);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<QuestionType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      const matchType = filterType === "all" || q.type === filterType;
      const matchSearch =
        !search ||
        q.passage.toLowerCase().includes(search.toLowerCase()) ||
        q.sourceTitle.toLowerCase().includes(search.toLowerCase()) ||
        QUESTION_TYPE_LABELS[q.type].includes(search);
      return matchType && matchSearch;
    });
  }, [questions, search, filterType]);

  if (!hydrated) {
    return (
      <AppShell>
        <PageHeader title="문항 DB" description="로딩 중..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="문항 DB"
        description={`저장된 문항 ${questions.length}개 · 시험지 제작에 활용할 수 있습니다.`}
        action={
          questions.length > 0 ? (
            <Link href="/exam">
              <Button size="sm">시험지 만들기</Button>
            </Link>
          ) : undefined
        }
      />

      {questions.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card px-8 py-16 text-center">
          <p className="text-muted">저장된 문항이 없습니다.</p>
          <Link href="/generate" className="mt-3 inline-block">
            <Button size="sm">문제 생성하러 가기</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-3">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="지문, 원본 제목, 유형으로 검색..."
                className="w-full rounded-lg border border-card-border bg-card py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) =>
                setFilterType(e.target.value as QuestionType | "all")
              }
              className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm focus:border-accent focus:outline-none"
            >
              <option value="all">전체 유형</option>
              {(
                Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]
              ).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {(
              Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]
            ).map(([type, label]) => {
              const count = questions.filter((q) => q.type === type).length;
              if (count === 0) return null;
              return (
                <span
                  key={type}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-muted"
                >
                  {label} {count}
                </span>
              );
            })}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                검색 결과가 없습니다.
              </p>
            ) : (
              filtered.map((q, i) => (
                <div key={q.id}>
                  <QuestionCard
                    question={q}
                    index={i}
                    saved
                    showRegenerate={false}
                    onUpdate={updateQuestion}
                  />
                  <div className="mt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm("이 문항을 삭제하시겠습니까?")) {
                          deleteQuestion(q.id);
                        }
                      }}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </AppShell>
  );
}
