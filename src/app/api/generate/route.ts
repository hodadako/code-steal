import { NextResponse } from "next/server";
import { generateWithGemini, isGeminiConfigured } from "@/lib/ai/gemini";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import { generateQuestions, regenerateSingleQuestion } from "@/lib/generator";
import type { GenerationOption, Question, SourceDocument } from "@/lib/types";
import type { PromptTask } from "@/lib/ai/prompts";

interface GenerateRequestBody {
  source: SourceDocument;
  options: GenerationOption[];
  regenerate?: {
    type: GenerationOption["type"];
    difficulty: GenerationOption["difficulty"];
  };
}

function optionsToTasks(options: GenerationOption[]): PromptTask[] {
  return options
    .filter((o) => o.enabled)
    .flatMap((o) =>
      Array.from({ length: o.count }, () => ({
        type: o.type,
        difficulty: o.difficulty,
        count: 1,
      })),
    );
}

async function generateWithPerTaskFallback(
  source: SourceDocument,
  tasks: PromptTask[],
): Promise<{ questions: Question[]; mockIndices: number[]; warnings: string[] }> {
  const questions: Question[] = [];
  const mockIndices: number[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    try {
      const result = await generateWithGemini(source, [task]);
      questions.push(result[0]);
    } catch (aiError) {
      const message =
        aiError instanceof Error ? aiError.message : "AI 생성 실패";
      console.error(`[Generate] ${task.type} failed:`, message);
      questions.push(
        regenerateSingleQuestion(source, task.type, task.difficulty),
      );
      mockIndices.push(i);
      warnings.push(
        `${i + 1}번(${QUESTION_TYPE_LABELS[task.type]}) AI 실패 → mock 대체: ${message}`,
      );
    }
  }

  return { questions, mockIndices, warnings };
}

export async function GET() {
  return NextResponse.json({
    configured: isGeminiConfigured(),
    provider: "Google Gemini",
    model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    mode: isGeminiConfigured() ? "ai" : "mock",
    setupUrl: "https://aistudio.google.com/apikey",
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateRequestBody;
    const { source, options, regenerate } = body;

    if (!source?.passage) {
      return NextResponse.json({ error: "원본 지문이 필요합니다." }, { status: 400 });
    }

    let questions: Question[];
    let mode: "ai" | "mock" | "mixed" = "mock";
    const warnings: string[] = [];
    let mockIndices: number[] = [];

    if (isGeminiConfigured()) {
      mode = "ai";
      try {
        if (regenerate) {
          questions = await generateWithGemini(source, [
            {
              type: regenerate.type,
              difficulty: regenerate.difficulty,
              count: 1,
            },
          ]);
        } else {
          const tasks = optionsToTasks(options);
          if (tasks.length === 0) {
            return NextResponse.json(
              { error: "최소 하나의 문제 유형을 선택해주세요." },
              { status: 400 },
            );
          }
          const result = await generateWithPerTaskFallback(source, tasks);
          questions = result.questions;
          mockIndices = result.mockIndices;
          warnings.push(...result.warnings);
          if (result.mockIndices.length === tasks.length) mode = "mock";
          else if (result.mockIndices.length > 0) mode = "mixed";
        }
      } catch (aiError) {
        const message =
          aiError instanceof Error ? aiError.message : "AI 생성 실패";
        if (regenerate) {
          questions = [
            regenerateSingleQuestion(
              source,
              regenerate.type,
              regenerate.difficulty,
            ),
          ];
          return NextResponse.json({
            questions,
            mode: "mock",
            warning: `AI 생성 실패, mock으로 대체: ${message}`,
          });
        }
        questions = generateQuestions(source, options);
        return NextResponse.json({
          questions,
          mode: "mock",
          warning: `AI 생성 실패, mock으로 대체: ${message}`,
        });
      }
    } else {
      if (regenerate) {
        questions = [
          regenerateSingleQuestion(
            source,
            regenerate.type,
            regenerate.difficulty,
          ),
        ];
      } else {
        const enabled = options.filter((o) => o.enabled);
        if (enabled.length === 0) {
          return NextResponse.json(
            { error: "최소 하나의 문제 유형을 선택해주세요." },
            { status: 400 },
          );
        }
        questions = generateQuestions(source, options);
      }
    }

    const warning =
      warnings.length > 0 ? warnings.join("\n") : undefined;

    return NextResponse.json({ questions, mode, warning, mockIndices });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
