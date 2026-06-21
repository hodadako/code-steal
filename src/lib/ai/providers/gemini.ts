import type { AiProvider } from "../types";
import { parseApiError, readApiKey, readModel } from "./utils";

const DEFAULT_MODEL = "gemini-2.5-flash";

function getApiKey(): string | null {
  return readApiKey(process.env.GEMINI_API_KEY);
}

export const geminiProvider: AiProvider = {
  id: "gemini",
  name: "Google Gemini",
  setupUrl: "https://aistudio.google.com/apikey",
  envKeyHint: "GEMINI_API_KEY 또는 AI_API_KEY",

  isConfigured() {
    return Boolean(getApiKey());
  },

  getModel() {
    return readModel(process.env.GEMINI_MODEL, DEFAULT_MODEL);
  },

  async completeJson(prompt: string): Promise<string> {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY / AI_API_KEY is not configured");
    }

    const model = this.getModel();
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
      await parseApiError(res, "Gemini");
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
  },
};
