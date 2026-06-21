import type { AiProvider } from "../types";
import { parseApiError, readApiKey, readModel } from "./utils";

const DEFAULT_MODEL = "gpt-4o-mini";
const DEFAULT_BASE_URL = "https://api.openai.com/v1";

function getApiKey(): string | null {
  return readApiKey(process.env.OPENAI_API_KEY);
}

function getBaseUrl(): string {
  return (
    process.env.OPENAI_BASE_URL?.trim() ||
    process.env.AI_BASE_URL?.trim() ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
}

export const openaiProvider: AiProvider = {
  id: "openai",
  name: "OpenAI Compatible",
  setupUrl: "https://platform.openai.com/api-keys",
  envKeyHint: "OPENAI_API_KEY 또는 AI_API_KEY",

  isConfigured() {
    return Boolean(getApiKey());
  },

  getModel() {
    return readModel(process.env.OPENAI_MODEL, DEFAULT_MODEL);
  },

  async completeJson(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY / AI_API_KEY is not configured");
    }

    const model = this.getModel();
    const res = await fetch(`${getBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.85,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a Korean CSAT English exam question generator. Respond with valid JSON only.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      await parseApiError(res, "OpenAI");
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error("OpenAI-compatible API returned empty response");
    }

    return text;
  },
};
