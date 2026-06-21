import { buildGenerationPrompt, type PromptTask } from "./prompts";
import { parseAiQuestions } from "./parse-response";
import type { Question, SourceDocument } from "@/lib/types";

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2500;
const BETWEEN_TASK_DELAY_MS = 800;

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate") ||
    lower.includes("resource exhausted") ||
    lower.includes("overloaded") ||
    lower.includes("empty response") ||
    lower.includes("failed to parse") ||
    lower.includes("503") ||
    lower.includes("500")
  );
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = getGeminiModel();
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      }),
    },
  );

  if (!res.ok) {
    const errText = await res.text();
    let message = `Gemini API error (${res.status})`;
    try {
      const errJson = JSON.parse(errText);
      message = errJson.error?.message || message;
    } catch {
      if (errText) message = errText.slice(0, 200);
    }
    throw new Error(message);
  }

  const data = await res.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ??
    data.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text)
      .join("");

  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  return text;
}

async function generateSingleTask(
  source: SourceDocument,
  task: PromptTask,
): Promise<Question> {
  const prompt = buildGenerationPrompt(source, [task]);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
      const text = await callGemini(prompt);
      const parsed = parseAiQuestions(text, source, task.type, task.difficulty);
      if (parsed.length === 0) {
        throw new Error(`AI 응답 파싱 실패 (${task.type})`);
      }
      return parsed[0];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES && isRetryableError(lastError.message)) {
        console.warn(
          `[Gemini] ${task.type} attempt ${attempt + 1} failed, retrying: ${lastError.message}`,
        );
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error(`AI 생성 실패 (${task.type})`);
}

export async function generateWithGemini(
  source: SourceDocument,
  tasks: PromptTask[],
): Promise<Question[]> {
  const questions: Question[] = [];

  for (let i = 0; i < tasks.length; i++) {
    if (i > 0) {
      await sleep(BETWEEN_TASK_DELAY_MS);
    }
    questions.push(await generateSingleTask(source, tasks[i]));
  }

  return questions;
}
