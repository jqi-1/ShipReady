export type AiProvider = "openai" | "anthropic" | "openai_compatible";

export interface AiClientConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  timeoutMs: number;
}

export interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiResponse {
  content: string;
  model: string;
  usage?: { promptTokens: number; completionTokens: number };
}

function normalizeProvider(provider: string): AiProvider {
  const p = provider.toLowerCase();
  if (p === "openai") return "openai";
  if (p === "anthropic") return "anthropic";
  return "openai_compatible";
}

export function getAiClientConfig(): AiClientConfig | null {
  const provider = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;
  if (!provider || !apiKey) return null;

  return {
    provider: normalizeProvider(provider),
    apiKey,
    model:
      (process.env.AI_MODEL && process.env.AI_MODEL.length > 0
        ? process.env.AI_MODEL
        : undefined) ??
      (normalizeProvider(provider) === "anthropic"
        ? "claude-sonnet-4-20250514"
        : "gpt-4o"),
    baseUrl: process.env.AI_BASE_URL || undefined,
    timeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS) || 30000
  };
}

export async function callAi(
  messages: AiMessage[],
  config: AiClientConfig
): Promise<AiResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    switch (config.provider) {
      case "openai": {
        const result = await callOpenAi(messages, config, controller.signal);
        return result;
      }
      case "anthropic": {
        const result = await callAnthropic(messages, config, controller.signal);
        return result;
      }
      case "openai_compatible": {
        const result = await callOpenAiCompatible(
          messages,
          config,
          controller.signal
        );
        return result;
      }
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function callOpenAi(
  messages: AiMessage[],
  config: AiClientConfig,
  signal: AbortSignal
): Promise<AiResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens
    }
  };
}

async function callAnthropic(
  messages: AiMessage[],
  config: AiClientConfig,
  signal: AbortSignal
): Promise<AiResponse> {
  const systemMessage =
    messages.find((m) => m.role === "system")?.content ?? "";
  const conversationMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      system: systemMessage,
      messages: conversationMessages,
      max_tokens: 4096,
      temperature: 0.1
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(
      `Anthropic API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  const textContent = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );
  return {
    content: textContent?.text ?? "",
    model: data.model,
    usage: {
      promptTokens: data.usage?.input_tokens,
      completionTokens: data.usage?.output_tokens
    }
  };
}

async function callOpenAiCompatible(
  messages: AiMessage[],
  config: AiClientConfig,
  signal: AbortSignal
): Promise<AiResponse> {
  const baseUrl =
    config.baseUrl?.replace(/\/+$/, "") ?? "https://api.openai.com/v1";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: 0.1,
      response_format: { type: "json_object" }
    }),
    signal
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      promptTokens: data.usage?.prompt_tokens,
      completionTokens: data.usage?.completion_tokens
    }
  };
}
