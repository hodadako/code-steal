"use client";



import { useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/AppShell";

import { PageHeader } from "@/components/PageHeader";

import { Button } from "@/components/Button";

import { QuestionReviewView } from "@/components/QuestionReviewView";

import { useAppStore } from "@/lib/store";

import {

  DEFAULT_GENERATION_OPTIONS,

  DIFFICULTY_LABELS,

  QUESTION_TYPE_LABELS,

} from "@/lib/constants";

import {

  fetchApiStatus,

  requestGeneration,

  requestRegeneration,

  type ApiStatus,

} from "@/lib/generation-client";

import type { GenerationOption } from "@/lib/types";

import { useHydration } from "@/hooks/useHydration";

import { AlertCircle, ExternalLink, Sparkles } from "lucide-react";

import Link from "next/link";



type ViewMode = "generate" | "review";



export default function GeneratePage() {

  const hydrated = useHydration();

  const sources = useAppStore((s) => s.sources);

  const currentSession = useAppStore((s) => s.currentSession);

  const setCurrentSession = useAppStore((s) => s.setCurrentSession);

  const updateSessionQuestion = useAppStore((s) => s.updateSessionQuestion);

  const replaceSessionQuestion = useAppStore((s) => s.replaceSessionQuestion);

  const saveQuestion = useAppStore((s) => s.saveQuestion);

  const savedQuestions = useAppStore((s) => s.questions);



  const [sourceId, setSourceId] = useState("");

  const [options, setOptions] = useState<GenerationOption[]>(

    DEFAULT_GENERATION_OPTIONS,

  );

  const [viewMode, setViewMode] = useState<ViewMode>("generate");

  const [reviewIndex, setReviewIndex] = useState(0);

  const [generating, setGenerating] = useState(false);

  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(

    null,

  );

  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);

  const [warning, setWarning] = useState<string | null>(null);

  const [lastMode, setLastMode] = useState<"ai" | "mock" | "mixed" | null>(null);



  const sessionSource = currentSession

    ? sources.find((s) => s.id === currentSession.sourceId)

    : undefined;

  const selectedSource = sources.find((s) => s.id === sourceId);



  const savedIds = useMemo(

    () => new Set(savedQuestions.map((q) => q.id)),

    [savedQuestions],

  );



  useEffect(() => {

    fetchApiStatus().then(setApiStatus).catch(() => null);

  }, []);



  useEffect(() => {

    if (!hydrated) return;

    if (currentSession && currentSession.questions.length > 0) {

      setSourceId(currentSession.sourceId);

      setViewMode("review");

    }

  }, [hydrated, currentSession]);



  const toggleOption = (type: GenerationOption["type"]) => {

    setOptions((prev) =>

      prev.map((o) =>

        o.type === type ? { ...o, enabled: !o.enabled } : o,

      ),

    );

  };



  const updateOption = <K extends keyof GenerationOption>(

    type: GenerationOption["type"],

    key: K,

    value: GenerationOption[K],

  ) => {

    setOptions((prev) =>

      prev.map((o) => (o.type === type ? { ...o, [key]: value } : o)),

    );

  };



  const handleGenerate = async () => {

    if (!selectedSource) return;

    const enabled = options.filter((o) => o.enabled);

    if (enabled.length === 0) {

      alert("최소 하나의 문제 유형을 선택해주세요.");

      return;

    }



    setGenerating(true);

    setWarning(null);

    try {

      const { questions, mode, warning: w, mockIndices } = await requestGeneration(

        selectedSource,

        options,

      );

      setCurrentSession({
        sourceId: selectedSource.id,
        questions,
        mockIndices: mockIndices ?? [],
      });

      setLastMode(mode);

      setReviewIndex(0);

      setViewMode("review");

      if (w) setWarning(w);

    } catch (e) {

      alert(e instanceof Error ? e.message : "문제 생성 실패");

    } finally {

      setGenerating(false);

    }

  };



  const handleRegenerateAll = async () => {

    const source = sessionSource ?? selectedSource;

    if (!source) return;

    setGenerating(true);

    setWarning(null);

    try {

      const { questions, mode, warning: w, mockIndices } = await requestGeneration(

        source,

        options,

      );

      setCurrentSession({
        sourceId: source.id,
        questions,
        mockIndices: mockIndices ?? [],
      });

      setLastMode(mode);

      setReviewIndex(0);

      if (w) setWarning(w);

    } catch (e) {

      alert(e instanceof Error ? e.message : "재생성 실패");

    } finally {

      setGenerating(false);

    }

  };



  const handleRegenerateOne = async (index: number) => {

    const source = sessionSource ?? selectedSource;

    if (!source || !currentSession) return;

    const q = currentSession.questions[index];

    setRegeneratingIndex(index);

    setWarning(null);

    try {

      const { questions, warning: w } = await requestRegeneration(

        source,

        q.type,

        q.difficulty,

      );

      if (questions[0]) {
        const newQuestions = [...currentSession.questions];
        newQuestions[index] = questions[0];
        const mockIndices = w
          ? [...(currentSession.mockIndices ?? []).filter((i) => i !== index), index]
          : (currentSession.mockIndices ?? []).filter((i) => i !== index);
        setCurrentSession({
          sourceId: currentSession.sourceId,
          questions: newQuestions,
          mockIndices,
        });
      }

      if (w) setWarning(w);

    } catch (e) {

      alert(e instanceof Error ? e.message : "재생성 실패");

    } finally {

      setRegeneratingIndex(null);

    }

  };



  if (!hydrated) {

    return (

      <AppShell>

        <PageHeader title="문제 생성" description="로딩 중..." />

      </AppShell>

    );

  }



  return (

    <AppShell>

      <PageHeader

        title="유사 문제 생성"

        description={

          viewMode === "review"

            ? "생성된 문항을 원본과 비교하며 검수합니다."

            : "원본 지문을 선택하고 수능 유형별 옵션을 설정한 뒤 유사 문제를 생성합니다."

        }

      />



      {apiStatus && viewMode === "generate" && (

        <div

          className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${

            apiStatus.configured

              ? "border-emerald-200 bg-emerald-50 text-emerald-800"

              : "border-amber-200 bg-amber-50 text-amber-900"

          }`}

        >

          {apiStatus.configured ? (

            <>

              <Sparkles size={18} className="mt-0.5 shrink-0" />

              <div>

                <p className="font-medium">

                  Gemini AI 연결됨 · {apiStatus.model}

                </p>

                <p className="mt-0.5 text-xs opacity-80">

                  무료 API로 실제 유사 문제를 생성합니다.

                  {lastMode === "mock" && " (마지막 생성은 mock fallback)"}

                </p>

              </div>

            </>

          ) : (

            <>

              <AlertCircle size={18} className="mt-0.5 shrink-0" />

              <div>

                <p className="font-medium">API 키 미설정 — mock 생성 모드</p>

                <p className="mt-0.5 text-xs opacity-90">

                  프로젝트 루트에{" "}

                  <code className="rounded bg-white/60 px-1">.env.local</code>{" "}

                  파일을 만들고{" "}

                  <code className="rounded bg-white/60 px-1">

                    GEMINI_API_KEY

                  </code>

                  를 넣은 뒤 서버를 재시작하세요.{" "}

                  <a

                    href={apiStatus.setupUrl}

                    target="_blank"

                    rel="noopener noreferrer"

                    className="inline-flex items-center gap-0.5 underline"

                  >

                    무료 API 키 발급

                    <ExternalLink size={12} />

                  </a>

                </p>

              </div>

            </>

          )}

        </div>

      )}



      {warning && (

        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm whitespace-pre-line text-amber-900">

          {warning}

        </div>

      )}



      {sources.length === 0 ? (

        <div className="rounded-xl border border-card-border bg-card px-8 py-16 text-center">

          <p className="text-muted">등록된 원본 지문이 없습니다.</p>

          <Link href="/sources" className="mt-3 inline-block">

            <Button size="sm">원본 지문 등록하기</Button>

          </Link>

        </div>

      ) : viewMode === "review" && currentSession && sessionSource ? (

        <QuestionReviewView

          source={sessionSource}

          questions={currentSession.questions}

          currentIndex={reviewIndex}

          onIndexChange={setReviewIndex}

          savedIds={savedIds}

          generating={generating || regeneratingIndex !== null}

          onRegenerate={handleRegenerateOne}

          onUpdate={updateSessionQuestion}

          onSave={saveQuestion}

          onRegenerateAll={handleRegenerateAll}

          onBackToGenerate={() => setViewMode("generate")}

          mockIndices={currentSession.mockIndices ?? []}

        />

      ) : (

        <div className="mx-auto max-w-2xl space-y-4">

          <div className="rounded-xl border border-card-border bg-card p-5">

            <h2 className="mb-3 text-sm font-semibold">원본 선택</h2>

            <select

              value={sourceId}

              onChange={(e) => setSourceId(e.target.value)}

              className="w-full rounded-lg border border-card-border px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"

            >

              <option value="">원본 지문을 선택하세요</option>

              {sources.map((s) => (

                <option key={s.id} value={s.id}>

                  {s.title}

                </option>

              ))}

            </select>



            {selectedSource && (

              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-3">

                <p className="prose-passage line-clamp-6 text-xs">

                  {selectedSource.passage}

                </p>

              </div>

            )}

          </div>



          <div className="rounded-xl border border-card-border bg-card p-5">

            <h2 className="mb-3 text-sm font-semibold">생성 옵션</h2>

            <div className="space-y-2">

              {options.map((opt) => (

                <div

                  key={opt.type}

                  className={`rounded-lg border p-3 transition-colors ${

                    opt.enabled

                      ? "border-accent/30 bg-accent-light/30"

                      : "border-card-border"

                  }`}

                >

                  <label className="flex cursor-pointer items-center gap-2">

                    <input

                      type="checkbox"

                      checked={opt.enabled}

                      onChange={() => toggleOption(opt.type)}

                      className="h-4 w-4 rounded accent-accent"

                    />

                    <span className="text-sm font-medium">

                      {QUESTION_TYPE_LABELS[opt.type]}

                    </span>

                  </label>



                  {opt.enabled && (

                    <div className="mt-2.5 flex gap-2 pl-6">

                      <select

                        value={opt.difficulty}

                        onChange={(e) =>

                          updateOption(

                            opt.type,

                            "difficulty",

                            e.target.value as GenerationOption["difficulty"],

                          )

                        }

                        className="flex-1 rounded-md border border-card-border px-2 py-1 text-xs focus:border-accent focus:outline-none"

                      >

                        {(

                          Object.entries(DIFFICULTY_LABELS) as [

                            GenerationOption["difficulty"],

                            string,

                          ][]

                        ).map(([val, label]) => (

                          <option key={val} value={val}>

                            난이도 {label}

                          </option>

                        ))}

                      </select>

                      <select

                        value={opt.count}

                        onChange={(e) =>

                          updateOption(

                            opt.type,

                            "count",

                            Number(e.target.value) as 1 | 2 | 3,

                          )

                        }

                        className="w-20 rounded-md border border-card-border px-2 py-1 text-xs focus:border-accent focus:outline-none"

                      >

                        {[1, 2, 3].map((n) => (

                          <option key={n} value={n}>

                            {n}문항

                          </option>

                        ))}

                      </select>

                    </div>

                  )}

                </div>

              ))}

            </div>



            <Button

              className="mt-4 w-full"

              onClick={handleGenerate}

              disabled={!selectedSource || generating}

            >

              <Sparkles size={16} />

              {generating ? "생성 중..." : "문제 생성"}

            </Button>



            {currentSession && currentSession.questions.length > 0 && (

              <Button

                className="mt-2 w-full"

                variant="secondary"

                onClick={() => {

                  setSourceId(currentSession.sourceId);

                  setViewMode("review");

                }}

              >

                검수 화면으로 ({currentSession.questions.length}문항)

              </Button>

            )}

          </div>

        </div>

      )}

    </AppShell>

  );

}

