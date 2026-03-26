import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import type { Env } from "../env.js";

export function createChatModel(env: Env): LanguageModelV2 {
  const apiKey = env.OPENAI_API_KEY.trim() || "ollama";
  if (env.OPENAI_BASE_URL) {
    return createOpenAI({
      baseURL: env.OPENAI_BASE_URL,
      apiKey,
    })(env.OPENAI_MODEL);
  }
  return createOpenAI({ apiKey })(env.OPENAI_MODEL);
}
