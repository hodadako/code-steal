import { buildGenerationPrompt, type PromptTask } from "./prompts";
import { parseAiQuestions } from "./parse-response";
import { resolveAiProvider } from "./registry";
import { isRetryableError, sleep } from "./providers/utils";
import type { Question, SourceDocument } from "@/lib/types";

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2500;
const BETWEEN_TASK_DELAY_MS = 800;

async function generateSingleTask(
  source: SourceDocument,
  task: PromptTask,
): Promise<Question> {
  const provider = resolveAiProvider();
  if (!provider) {
    throw new Error("AI provider is not configured");
  }

  const prompt = buildGenerationPrompt(source, [task]);
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
      const text = await provider.completeJson(prompt);
      const parsed = parseAiQuestions(text, source, task.type, task.difficulty);
      if (parsed.length === 0) {
        throw new Error(`AI 응답 파싱 실패 (${task.type})`);
      }
      return parsed[0];
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES && isRetryableError(lastError.message)) {
        console.warn(
          `[AI:${provider.id}] ${task.type} attempt ${attempt + 1} failed, retrying: ${lastError.message}`,
        );
        continue;
      }
      throw lastError;
    }
  }

  throw lastError ?? new Error(`AI 생성 실패 (${task.type})`);
}

export async function generateWithAi(
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
