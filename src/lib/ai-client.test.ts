import { describe, expect, it, vi, beforeEach } from "vitest";
import { getAiClientConfig, callAi } from "./ai-client";
import type { AiClientConfig } from "./ai-client";

const mockConfig: AiClientConfig = {
  provider: "openai",
  apiKey: "sk-test-key-12345",
  model: "gpt-4o",
  timeoutMs: 5000
};

describe("getAiClientConfig", () => {
  beforeEach(() => {
    vi.stubEnv("AI_PROVIDER", "");
    vi.stubEnv("AI_API_KEY", "");
    vi.stubEnv("AI_MODEL", "");
    vi.stubEnv("AI_BASE_URL", "");
  });

  it("returns null when AI_PROVIDER is missing", () => {
    const result = getAiClientConfig();
    expect(result).toBeNull();
  });

  it("returns null when AI_API_KEY is missing", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    const result = getAiClientConfig();
    expect(result).toBeNull();
  });

  it("returns config when both provider and key are set", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_API_KEY", "sk-test-key");
    vi.stubEnv("AI_MODEL", "gpt-4o-mini");
    const result = getAiClientConfig();
    expect(result).not.toBeNull();
    expect(result!.provider).toBe("openai");
    expect(result!.model).toBe("gpt-4o-mini");
  });

  it("uses default model when not specified", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("AI_API_KEY", "sk-test-key");
    const result = getAiClientConfig();
    expect(result!.model).toBe("gpt-4o");
  });

  it("normalizes provider to openai_compatible for unknown providers", () => {
    vi.stubEnv("AI_PROVIDER", "ollama");
    vi.stubEnv("AI_API_KEY", "test-key");
    const result = getAiClientConfig();
    expect(result!.provider).toBe("openai_compatible");
  });
});

describe("callAi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls OpenAI and returns parsed response", async () => {
    const mockResponse = {
      choices: [{ message: { content: '{"result":"ok"}' } }],
      model: "gpt-4o",
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const result = await callAi(
      [{ role: "system", content: "You are helpful." }],
      mockConfig
    );

    expect(result.content).toBe('{"result":"ok"}');
    expect(result.model).toBe("gpt-4o");
    expect(result.usage?.promptTokens).toBe(100);
    expect(result.usage?.completionTokens).toBe(50);
  });

  it("throws on OpenAI API error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 })
    );

    await expect(
      callAi([{ role: "user", content: "hi" }], mockConfig)
    ).rejects.toThrow("OpenAI API error: 401");
  });

  it("throws on timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(
      () =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Aborted")), 100)
        )
    );

    const fastTimeoutConfig = { ...mockConfig, timeoutMs: 10 };
    await expect(
      callAi([{ role: "user", content: "hi" }], fastTimeoutConfig)
    ).rejects.toThrow();
  });

  it("calls Anthropic API", async () => {
    const mockAnthropicResponse = {
      content: [{ type: "text", text: '{"result":"ok"}' }],
      model: "claude-sonnet-4-20250514",
      usage: { input_tokens: 100, output_tokens: 50 }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockAnthropicResponse), { status: 200 })
    );

    const anthropicConfig: AiClientConfig = {
      provider: "anthropic",
      apiKey: "sk-ant-test",
      model: "claude-sonnet-4-20250514",
      timeoutMs: 5000
    };

    const result = await callAi(
      [
        { role: "system", content: "You are Claude." },
        { role: "user", content: "hi" }
      ],
      anthropicConfig
    );

    expect(result.content).toBe('{"result":"ok"}');
  });

  it("calls OpenAI-compatible API with custom base URL", async () => {
    const mockResponse = {
      choices: [{ message: { content: "compatible response" } }],
      model: "local-model",
      usage: { prompt_tokens: 10, completion_tokens: 5 }
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), { status: 200 })
    );

    const compatibleConfig: AiClientConfig = {
      provider: "openai_compatible",
      apiKey: "test-key",
      model: "local-model",
      baseUrl: "http://localhost:11434/v1",
      timeoutMs: 5000
    };

    const result = await callAi(
      [{ role: "user", content: "hello" }],
      compatibleConfig
    );

    expect(result.content).toBe("compatible response");
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const url = fetchCall[0] as string;
    expect(url).toContain("http://localhost:11434/v1/chat/completions");
  });
});
