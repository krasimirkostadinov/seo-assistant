import { z } from "zod";

export const postThreadBody = z.object({
  title: z.string().min(1).max(200).optional(),
});

export const patchThreadBody = z.object({
  title: z.string().min(1).max(200),
});

export const postMessageBody = z.object({
  content: z.string().min(1).max(32000),
});
