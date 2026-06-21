import type { GenerationOption, Question, SourceDocument } from "./types";

interface GenerateResponse {
  questions: Question[];
  mode: "ai" | "mock" | "mixed";
  warning?: string;
  mockIndices?: number[];
}

export interface ApiStatus {
  configured: boolean;
  provider: string;
  model: string;
  mode: "ai" | "mock";
  setupUrl: string;
}

export async function fetchApiStatus(): Promise<ApiStatus> {
  const res = await fetch("/api/generate");
  if (!res.ok) throw new Error("API 상태 확인 실패");
  return res.json();
}

export async function requestGeneration(
  source: SourceDocument,
  options: GenerationOption[],
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source, options }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "문제 생성 실패");
  return data;
}

export async function requestRegeneration(
  source: SourceDocument,
  type: GenerationOption["type"],
  difficulty: GenerationOption["difficulty"],
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source,
      options: [],
      regenerate: { type, difficulty },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "재생성 실패");
  return data;
}
