export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(message: string): boolean {
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

export function readApiKey(
  providerKey: string | undefined,
  universalKey = process.env.AI_API_KEY?.trim(),
): string | null {
  return providerKey?.trim() || universalKey || null;
}

export function readModel(
  providerModel: string | undefined,
  defaultModel: string,
  universalModel = process.env.AI_MODEL?.trim(),
): string {
  return universalModel || providerModel?.trim() || defaultModel;
}

export async function parseApiError(
  res: Response,
  label: string,
): Promise<never> {
  const errText = await res.text();
  let message = `${label} API error (${res.status})`;
  try {
    const errJson = JSON.parse(errText);
    message =
      errJson.error?.message ||
      errJson.message ||
      message;
  } catch {
    if (errText) message = errText.slice(0, 200);
  }
  throw new Error(message);
}
