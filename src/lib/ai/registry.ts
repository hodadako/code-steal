import type { AiProvider, AiProviderId, AiStatus } from "./types";
import { anthropicProvider } from "./providers/anthropic";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";

const PROVIDERS: Record<AiProviderId, AiProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  anthropic: anthropicProvider,
};

const PROVIDER_ORDER: AiProviderId[] = ["gemini", "openai", "anthropic"];

function hasProviderSpecificKey(id: AiProviderId): boolean {
  switch (id) {
    case "gemini":
      return Boolean(process.env.GEMINI_API_KEY?.trim());
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY?.trim());
    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }
}

function parseProviderId(raw: string | undefined): AiProviderId | null {
  const id = raw?.trim().toLowerCase();
  if (id === "gemini" || id === "google") return "gemini";
  if (
    id === "openai" ||
    id === "openai-compatible" ||
    id === "compatible"
  ) {
    return "openai";
  }
  if (id === "anthropic" || id === "claude") return "anthropic";
  return null;
}

export function resolveAiProvider(): AiProvider | null {
  const explicit = parseProviderId(process.env.AI_PROVIDER);
  if (explicit) {
    const provider = PROVIDERS[explicit];
    return provider.isConfigured() ? provider : null;
  }

  for (const id of PROVIDER_ORDER) {
    if (hasProviderSpecificKey(id)) return PROVIDERS[id];
  }

  return process.env.AI_API_KEY?.trim() ? openaiProvider : null;
}

export function getAiStatus(): AiStatus {
  const provider = resolveAiProvider();
  if (!provider) {
    return {
      configured: false,
      provider: "미설정",
      providerId: null,
      model: "-",
      mode: "mock",
      setupUrl: "https://aistudio.google.com/apikey",
      envKeyHint: "AI_PROVIDER + AI_API_KEY 또는 GEMINI_API_KEY 등",
    };
  }

  return {
    configured: true,
    provider: provider.name,
    providerId: provider.id,
    model: provider.getModel(),
    mode: "ai",
    setupUrl: provider.setupUrl,
    envKeyHint: provider.envKeyHint,
  };
}

export function isAiConfigured(): boolean {
  return resolveAiProvider() !== null;
}
