import type { AiProvider } from "../types";
import { parseApiError, readApiKey, readModel } from "./utils";

const DEFAULT_MODEL = "claude-3-5-haiku-latest";

function getApiKey(): string | null {
  return readApiKey(process.env.ANTHROPIC_API_KEY);
}

export const anthropicProvider: AiProvider = {
  id: "anthropic",
  name: "Anthropic Claude",
  setupUrl: "https://console.anthropic.com/settings/keys",
  envKeyHint: "ANTHROPIC_API_KEY 또는 AI_API_KEY",

  isConfigured() {
    return Boolean(getApiKey());
  },

  getModel() {
    return readModel(process.env.ANTHROPIC_MODEL, DEFAULT_MODEL);
  },

  async completeJson(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY / AI_API_KEY is not configured");
    }

    const model = this.getModel();
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 8192,
        temperature: 0.85,
        system:
          "You are a Korean CSAT English exam question generator. Respond with valid JSON only.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      await parseApiError(res, "Anthropic");
    }

    const data = await res.json();
    const text = data.content
      ?.map((block: { type?: string; text?: string }) => block.text ?? "")
      .join("");

    if (!text) {
      throw new Error("Anthropic returned empty response");
    }

    return text;
  },
};
