"use client";

import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/Button";
import { useAppStore } from "@/lib/store";
import { downloadExcelTemplate, parseExcelFile } from "@/lib/excel";
import { SAMPLE_PASSAGE } from "@/lib/constants";
import { useHydration } from "@/hooks/useHydration";
import {
  Download,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

export default function SourcesPage() {
  const hydrated = useHydration();
  const sources = useAppStore((s) => s.sources);
  const addSource = useAppStore((s) => s.addSource);
  const addSources = useAppStore((s) => s.addSources);
  const deleteSource = useAppStore((s) => s.deleteSource);

  const [title, setTitle] = useState("");
  const [passage, setPassage] = useState("");
  const [explanation, setExplanation] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passage.trim()) return;
    addSource({
      title: title.trim() || `지문 ${sources.length + 1}`,
      passage: passage.trim(),
      explanation: explanation.trim() || undefined,
    });
    setTitle("");
    setPassage("");
    setExplanation("");
  };

  const handleExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = await parseExcelFile(file);
      addSources(parsed);
    } catch {
      alert("엑셀 파일을 읽는 중 오류가 발생했습니다.");
    }
    e.target.value = "";
  };

  const selected = sources.find((s) => s.id === selectedId);

  if (!hydrated) {
    return (
      <AppShell>
        <PageHeader title="원본 지문" description="로딩 중..." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="원본 지문"
        description="영어 지문과 해설(선택)을 등록합니다. 직접 입력하거나 엑셀로 일괄 등록할 수 있습니다."
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={downloadExcelTemplate}>
              <Download size={14} />
              템플릿 다운로드
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setPassage(SAMPLE_PASSAGE);
                setTitle("샘플 지문");
              }}
            >
              샘플 불러오기
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-2 space-y-4">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-card-border bg-card p-5"
          >
            <h2 className="mb-4 text-sm font-semibold">지문 직접 입력</h2>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  제목 (선택)
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 감정 지능"
                  className="w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  영어 지문 *
                </label>
                <textarea
                  value={passage}
                  onChange={(e) => setPassage(e.target.value)}
                  rows={10}
                  placeholder="영어 지문을 붙여넣으세요..."
                  className="w-full rounded-lg border border-card-border px-3 py-2 text-sm leading-relaxed focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  해설 (선택)
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={3}
                  placeholder="해설을 입력하세요..."
                  className="w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button type="submit">
                <Plus size={16} />
                등록
              </Button>
            </div>
          </form>

          <div className="rounded-xl border border-dashed border-card-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <FileSpreadsheet size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">엑셀 일괄 등록</p>
                <p className="text-xs text-muted">
                  제목 · 지문 · 해설 컬럼 형식
                </p>
              </div>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleExcel}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              엑셀 파일 선택
            </Button>
          </div>
        </div>

        <div className="col-span-3">
          <div className="rounded-xl border border-card-border bg-card">
            <div className="border-b border-card-border px-5 py-3">
              <h2 className="text-sm font-semibold">
                등록된 원본 ({sources.length})
              </h2>
            </div>

            {sources.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-muted">
                등록된 원본 지문이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-card-border">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex cursor-pointer items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${
                      selectedId === source.id ? "bg-accent-light/50" : ""
                    }`}
                    onClick={() =>
                      setSelectedId(selectedId === source.id ? null : source.id)
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{source.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {source.passage}
                      </p>
                      <p className="mt-1 text-[11px] text-muted/70">
                        {new Date(source.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSource(source.id);
                        if (selectedId === source.id) setSelectedId(null);
                      }}
                      className="shrink-0 rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selected && (
            <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold">{selected.title}</h3>
              <div className="prose-passage max-h-80 overflow-y-auto rounded-lg bg-gray-50 p-4">
                {selected.passage}
              </div>
              {selected.explanation && (
                <div className="mt-3 rounded-lg bg-accent-light/50 p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-accent">해설</p>
                  {selected.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
