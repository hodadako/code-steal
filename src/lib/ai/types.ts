export type AiProviderId = "gemini" | "openai" | "anthropic";

export interface AiProvider {
  readonly id: AiProviderId;
  readonly name: string;
  readonly setupUrl: string;
  readonly envKeyHint: string;
  isConfigured(): boolean;
  getModel(): string;
  completeJson(prompt: string): Promise<string>;
}

export interface AiStatus {
  configured: boolean;
  provider: string;
  providerId: AiProviderId | null;
  model: string;
  mode: "ai" | "mock";
  setupUrl: string;
  envKeyHint: string;
}
