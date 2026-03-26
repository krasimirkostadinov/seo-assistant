import { z } from "zod";

const schema = z
  .object({
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string(),
    AUTH0_DOMAIN: z.string(),
    AUTH0_AUDIENCE: z.string(),
    OPENAI_API_KEY: z.string().default(""),
    OPENAI_BASE_URL: z.preprocess((v) => {
      if (v === undefined || v === null || v === "") return undefined;
      const s = String(v).trim().replace(/\/$/, "");
      return s || undefined;
    }, z.string().url().optional()),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .superRefine((data, ctx) => {
    const hasLocal = Boolean(data.OPENAI_BASE_URL);
    if (!hasLocal && !data.OPENAI_API_KEY.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Set OPENAI_API_KEY for api.openai.com, or OPENAI_BASE_URL for Ollama / LM Studio (dummy key ok)",
        path: ["OPENAI_API_KEY"],
      });
    }
  });

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment");
  }
  return parsed.data;
}
