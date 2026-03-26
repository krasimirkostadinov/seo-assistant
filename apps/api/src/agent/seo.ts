import {
  generateText,
  tool,
  stepCountIs,
  type ModelMessage,
} from "ai";
import { z } from "zod";
import type { Env } from "../env.js";
import { createChatModel } from "./chat-model.js";
import { fetchPageContent } from "./fetch-page.js";

const SEO_TAGS = ["<title>", "<meta description>", "<h1>"] as const;

const suggestionItem = z.object({
  tag: z.enum(SEO_TAGS),
  currentValue: z.string(),
  suggestedValue: z.string().max(160),
});

const seoOutputSchema = z.object({
  message: z.string(),
  suggestions: z.array(suggestionItem).optional(),
});

export type SeoOutput = z.infer<typeof seoOutputSchema>;
export type SeoTag = (typeof SEO_TAGS)[number];

const system = `You are an SEO assistant. You MUST always respond with a single valid JSON object and absolutely nothing else — no prose, no markdown, no explanation outside the JSON.

Steps:
1. If the user has not provided a URL, ask for it in the "message" field and omit "suggestions".
2. If the user has provided a URL, call fetchPageContent to get the current title, meta description, and H1.
3. If keywords are missing, ask for them in the "message" field and omit "suggestions".
4. Once you have the page content AND keywords, produce EXACTLY 3 suggestions for EACH of the 3 tags (9 suggestion objects total). Rules per tag:
   - "<title>": max 100 characters, includes primary keyword, compelling
   - "<meta description>": max 160 characters, includes keywords naturally, has a call to action
   - "<h1>": max 70 characters, matches search intent, includes primary keyword
5. If the user asks for changes or gives feedback, revise the suggestions and return all 9 again.

REQUIRED output format — always this exact shape:
{
  "message": "one sentence summary of what you did",
  "suggestions": [
    { "tag": "<title>", "currentValue": "exact current title", "suggestedValue": "option 1" },
    { "tag": "<title>", "currentValue": "exact current title", "suggestedValue": "option 2" },
    { "tag": "<title>", "currentValue": "exact current title", "suggestedValue": "option 3" },
    { "tag": "<meta description>", "currentValue": "exact current description", "suggestedValue": "option 1" },
    { "tag": "<meta description>", "currentValue": "exact current description", "suggestedValue": "option 2" },
    { "tag": "<meta description>", "currentValue": "exact current description", "suggestedValue": "option 3" },
    { "tag": "<h1>", "currentValue": "exact current h1", "suggestedValue": "option 1" },
    { "tag": "<h1>", "currentValue": "exact current h1", "suggestedValue": "option 2" },
    { "tag": "<h1>", "currentValue": "exact current h1", "suggestedValue": "option 3" }
  ]
}

Never include text outside the JSON object.`;

function parseSeoOutputFromText(text: string): SeoOutput | null {
  const stripped = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
  const fenced = stripped.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidates = fenced ? [fenced[1].trim(), stripped] : [stripped];
  const jsonMatch = stripped.match(/\{[\s\S]*\}/);
  if (jsonMatch) candidates.push(jsonMatch[0]);
  for (const candidate of candidates) {
    try {
      const raw: unknown = JSON.parse(candidate);
      const parsed = seoOutputSchema.safeParse(raw);
      if (parsed.success) return parsed.data;
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function runSeoTurn(
  env: Env,
  messages: ModelMessage[],
): Promise<SeoOutput> {
  const result = await generateText({
    model: createChatModel(env),
    stopWhen: stepCountIs(10),
    system,
    messages,
    tools: {
      fetchPageContent: tool({
        description:
          "Fetch a public HTML page and return its title, meta description, and first H1 heading.",
        inputSchema: z.object({
          url: z.string().url().describe("HTTPS URL of the page to analyze"),
        }),
        execute: async ({ url }) => {
          try {
            return await fetchPageContent(url, {
              requireHttps: process.env.NODE_ENV === "production",
            });
          } catch (e) {
            const msg = e instanceof Error ? e.message : "fetch_failed";
            return { url, title: "", metaDescription: "", h1: "", truncated: false, error: msg };
          }
        },
      }),
    },
  });

  const parsed = parseSeoOutputFromText(result.text);
  if (parsed) return parsed;

  throw new Error(
    `seo_agent_no_structured_output: finishReason=${result.finishReason} text=${result.text.slice(0, 300)}`,
  );
}
