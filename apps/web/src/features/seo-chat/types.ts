import { z } from "zod";

const SEO_TAGS = ["<title>", "<meta description>", "<h1>"] as const;

export const suggestionSchema = z.object({
  tag: z.enum(SEO_TAGS),
  currentValue: z.string(),
  suggestedValue: z.string(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;

export const messageMetaSchema = z.object({
  suggestions: z.array(suggestionSchema).optional(),
});

export type MessageMetadata = z.infer<typeof messageMetaSchema>;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata: MessageMetadata | null;
  createdAt: string;
};

export type PostRes = {
  userMessage: { id: string; role: "user"; content: string };
  assistantMessage: {
    id: string;
    role: "assistant";
    content: string;
    metadata: MessageMetadata | null;
  };
};
