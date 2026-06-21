import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import test from "node:test";

const PROVIDER_ENV_KEYS = [
  "AI_API_KEY",
  "AI_BASE_URL",
  "AI_PROVIDER",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
];

async function withNextServer(port, overrides, run) {
  const env = { ...process.env, ...overrides, PORT: String(port) };
  for (const key of PROVIDER_ENV_KEYS) delete env[key];
  Object.assign(env, overrides);

  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(port)], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/api/generate`);
        if (response.ok) return await run();
      } catch (error) {
        if (!(error instanceof TypeError)) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Next.js test server did not become ready");
  } finally {
    server.kill("SIGTERM");
    await once(server, "exit");
  }
}

test("a generic AI key defaults to the OpenAI-compatible provider", async () => {
  const status = await withNextServer(3111, { AI_API_KEY: "sk-openai-test" }, async () => {
    const response = await fetch("http://127.0.0.1:3111/api/generate");
    return response.json();
  });

  assert.equal(status.providerId, "openai");
  assert.equal(status.mode, "ai");
});

test("a provider-specific key takes precedence over a generic key", async () => {
  let authorization = null;
  const fakeOpenAi = createServer((request, response) => {
    authorization = request.headers.authorization ?? null;
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
      choices: [{
        message: {
          content: JSON.stringify({
            questions: [{
              type: "topic_sentence_en",
              difficulty: "medium",
              passage: "A test passage.",
              question: "What is the topic?",
              choices: ["A", "B", "C", "D", "E"],
              answer: 0,
              explanation: "Test explanation",
            }],
          }),
        },
      }],
    }));
  });
  fakeOpenAi.listen(3113, "127.0.0.1");
  await once(fakeOpenAi, "listening");

  try {
    const result = await withNextServer(3112, {
      AI_API_KEY: "generic-key",
      AI_PROVIDER: "openai",
      OPENAI_API_KEY: "provider-key",
      OPENAI_BASE_URL: "http://127.0.0.1:3113/v1",
    }, async () => {
      const response = await fetch("http://127.0.0.1:3112/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: { passage: "A test passage." },
          options: [{
            type: "topic_sentence_en",
            difficulty: "medium",
            count: 1,
            enabled: true,
          }],
        }),
      });
      return response.json();
    });

    assert.equal(result.mode, "ai");
    assert.equal(authorization, "Bearer provider-key");
  } finally {
    fakeOpenAi.close();
    await once(fakeOpenAi, "close");
  }
});
