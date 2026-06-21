"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { useAppStore } from "@/lib/store";
import {
  DIFFICULTY_LABELS,
  QUESTION_TYPE_LABELS,
} from "@/lib/constants";
import { PassageText } from "@/components/PassageText";
import { exportToPdf } from "@/lib/pdf";
import type { ExamPaper, Question } from "@/lib/types";
import { useHydration } from "@/hooks/useHydration";
import {
  ArrowDown,
  ArrowUp,
  Download,
  Eye,
  Plus,
  Replace,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";

export default function ExamPage() {
  const hydrated = useHydration();
  const questions = useAppStore((s) => s.questions);
  const exams = useAppStore((s) => s.exams);
  const createExam = useAppStore((s) => s.createExam);
  const updateExam = useAppStore((s) => s.updateExam);
  const deleteExam = useAppStore((s) => s.deleteExam);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState("영어 시험지");
  const [activeExam, setActiveExam] = useState<ExamPaper | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [pdfSaving, setPdfSaving] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const examQuestions: Question[] = activeExam
    ? activeExam.questionIds
        .map((id) => questions.find((q) => q.id === id))
        .filter(Boolean) as Question[]
    : selectedIds
        .map((id) => questions.find((q) => q.id === id))
        .filter(Boolean) as Question[];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreateExam = () => {
    if (selectedIds.length === 0) return;
    const exam = createExam(examTitle, selectedIds);
    setActiveExam(exam);
    setPreviewMode(true);
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    if (!activeExam) return;
    const ids = [...activeExam.questionIds];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= ids.length) return;
    [ids[index], ids[newIndex]] = [ids[newIndex], ids[index]];
    updateExam({ ...activeExam, questionIds: ids });
    setActiveExam({ ...activeExam, questionIds: ids });
  };

  const removeFromExam = (index: number) => {
    if (!activeExam) return;
    const ids = activeExam.questionIds.filter((_, i) => i !== index);
    updateExam({ ...activeExam, questionIds: ids });
    setActiveExam({ ...activeExam, questionIds: ids });
  };

  const swapQuestion = (newId: string) => {
    if (!activeExam || swapIndex === null) return;
    const ids = [...activeExam.questionIds];
    ids[swapIndex] = newId;
    updateExam({ ...activeExam, questionIds: ids });
    setActiveExam({ ...activeExam, questionIds: ids });
    setSwapIndex(null);
  };

  const handlePdf = async () => {
    if (!printRef.current || pdfSaving) return;
    setPdfSaving(true);
    try {
      await exportToPdf(
        printRef.current,
        `${examTitle || "시험지"}.pdf`,
      );
    } catch (e) {
      alert(
        e instanceof Error
          ? `PDF 저장 실패: ${e.message}`
          : "PDF 저장에 실패했습니다.",
      );
    } finally {
      setPdfSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <AppShell>
        <PageHeader title="시험지 만들기" description="로딩 중..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="시험지 만들기"
        description="문항 DB에서 문항을 선택해 시험지를 구성하고 PDF로 내보냅니다."
      />

      {questions.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card px-8 py-16 text-center">
          <p className="text-muted">문항 DB에 저장된 문항이 없습니다.</p>
          <Link href="/generate" className="mt-3 inline-block">
            <Button size="sm">문제 생성하러 가기</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Question picker */}
          {!previewMode && (
            <div className="col-span-5">
              <div className="rounded-xl border border-card-border bg-card">
                <div className="border-b border-card-border px-5 py-3">
                  <h2 className="text-sm font-semibold">문항 선택</h2>
                </div>
                <div className="max-h-[calc(100vh-280px)] divide-y divide-card-border overflow-y-auto">
                  {questions.map((q) => (
                    <label
                      key={q.id}
                      className={`flex cursor-pointer items-start gap-3 px-5 py-3 hover:bg-gray-50 ${
                        selectedIds.includes(q.id) ? "bg-accent-light/30" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        onChange={() => toggleSelect(q.id)}
                        className="mt-1 h-4 w-4 rounded accent-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          {QUESTION_TYPE_LABELS[q.type]}
                          <span className="ml-2 text-xs font-normal text-muted">
                            {DIFFICULTY_LABELS[q.difficulty]}
                          </span>
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {q.passage}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  시험지 제목
                </label>
                <input
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="mb-3 w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <Button
                  className="w-full"
                  onClick={handleCreateExam}
                  disabled={selectedIds.length === 0}
                >
                  <Eye size={16} />
                  시험지 미리보기 ({selectedIds.length}문항)
                </Button>
              </div>

              {exams.length > 0 && (
                <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                  <h3 className="mb-2 text-sm font-semibold">저장된 시험지</h3>
                  <div className="space-y-2">
                    {exams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveExam(exam);
                            setExamTitle(exam.title);
                            setPreviewMode(true);
                          }}
                          className="text-sm hover:text-accent"
                        >
                          {exam.title}{" "}
                          <span className="text-xs text-muted">
                            ({exam.questionIds.length}문항)
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteExam(exam.id)}
                          className="text-muted hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Exam preview */}
          <div className={previewMode ? "col-span-12" : "col-span-7"}>
            {previewMode ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setPreviewMode(false);
                        setActiveExam(null);
                      }}
                    >
                      ← 문항 선택으로
                    </Button>
                    <input
                      value={examTitle}
                      onChange={(e) => {
                        setExamTitle(e.target.value);
                        if (activeExam) {
                          updateExam({ ...activeExam, title: e.target.value });
                          setActiveExam({ ...activeExam, title: e.target.value });
                        }
                      }}
                      className="rounded-lg border border-card-border px-3 py-1.5 text-sm font-semibold focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handlePdf}
                      disabled={pdfSaving}
                    >
                      <Download size={14} />
                      {pdfSaving ? "PDF 생성 중..." : "PDF 저장"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.print()}
                    >
                      인쇄
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-8">
                    <div
                      ref={printRef}
                      className="exam-print-area rounded-xl border border-card-border bg-white p-10 shadow-sm"
                    >
                      <div className="mb-8 border-b-2 border-gray-800 pb-4 text-center">
                        <h1 className="text-xl font-bold">{examTitle}</h1>
                        <p className="mt-1 text-sm text-gray-500">
                          영어 · 총 {examQuestions.length}문항
                        </p>
                      </div>

                      {examQuestions.map((q, i) => (
                        <div key={q.id} className="mb-10 break-inside-avoid">
                          <p className="mb-3 text-sm font-bold">
                            {i + 1}. {q.question.replace(/^\[[하중상]\]\s*/, "")}
                          </p>
                          <div className="mb-4 rounded bg-gray-50 p-4 text-sm">
                            <PassageText text={q.passage} />
                          </div>
                          <ol className="space-y-1.5 pl-1">
                            {q.choices.map((c) => (
                              <li key={c.label} className="text-sm">
                                <span className="mr-2 font-semibold">
                                  {c.label}
                                </span>
                                {c.text}
                              </li>
                            ))}
                          </ol>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <div className="sticky top-8 rounded-xl border border-card-border bg-card p-4">
                      <h3 className="mb-3 text-sm font-semibold">
                        문항 편집
                      </h3>
                      <div className="space-y-2">
                        {examQuestions.map((q, i) => (
                          <div
                            key={q.id}
                            className="flex items-center gap-1 rounded-lg bg-gray-50 px-2 py-1.5"
                          >
                            <span className="w-6 text-xs font-bold text-muted">
                              {i + 1}
                            </span>
                            <span className="flex-1 truncate text-xs">
                              {QUESTION_TYPE_LABELS[q.type]}
                            </span>
                            <button
                              type="button"
                              onClick={() => moveQuestion(i, -1)}
                              disabled={i === 0}
                              className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(i, 1)}
                              disabled={i === examQuestions.length - 1}
                              className="rounded p-1 text-muted hover:bg-white disabled:opacity-30"
                            >
                              <ArrowDown size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSwapIndex(i)}
                              className="rounded p-1 text-muted hover:bg-white hover:text-accent"
                              title="문항 교체"
                            >
                              <Replace size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFromExam(i)}
                              className="rounded p-1 text-muted hover:bg-white hover:text-red-500"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {swapIndex !== null && (
                        <div className="mt-4 border-t border-card-border pt-4">
                          <p className="mb-2 text-xs font-medium text-muted">
                            {swapIndex + 1}번 문항 교체
                          </p>
                          <div className="max-h-48 space-y-1 overflow-y-auto">
                            {questions
                              .filter(
                                (q) =>
                                  !activeExam?.questionIds.includes(q.id),
                              )
                              .map((q) => (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => swapQuestion(q.id)}
                                  className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-accent-light"
                                >
                                  {QUESTION_TYPE_LABELS[q.type]} —{" "}
                                  {q.passage.slice(0, 40)}...
                                </button>
                              ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSwapIndex(null)}
                            className="mt-2 text-xs text-muted hover:text-foreground"
                          >
                            취소
                          </button>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-4 w-full"
                        onClick={() => setPreviewMode(false)}
                      >
                        <Plus size={14} />
                        문항 추가
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[480px] items-center justify-center rounded-xl border border-dashed border-card-border bg-card">
                <div className="text-center">
                  <Eye size={32} className="mx-auto mb-3 text-muted/40" />
                  <p className="text-sm text-muted">
                    왼쪽에서 문항을 선택하고
                    <br />
                    시험지 미리보기를 눌러주세요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
