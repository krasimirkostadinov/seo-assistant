import type { ModelMessage } from "ai";

export function toModelMessages(
  rows: { role: string; content: string }[],
): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const r of rows) {
    if (r.role === "user") {
      out.push({ role: "user", content: r.content });
    } else if (r.role === "assistant") {
      out.push({ role: "assistant", content: r.content });
    }
  }
  return out;
}
