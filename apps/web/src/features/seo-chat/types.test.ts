import { describe, expect, it } from "vitest";

import { messageMetaSchema, suggestionSchema } from "./types";

describe("suggestionSchema", () => {
  it("accepts a valid suggestion", () => {
    const out = suggestionSchema.safeParse({
      tag: "<title>",
      currentValue: "Old",
      suggestedValue: "New",
    });
    expect(out.success).toBe(true);
  });

  it("rejects unknown tags", () => {
    const out = suggestionSchema.safeParse({
      tag: "<h2>",
      currentValue: "x",
      suggestedValue: "y",
    });
    expect(out.success).toBe(false);
  });
});

describe("messageMetaSchema", () => {
  it("parses optional suggestions array", () => {
    const out = messageMetaSchema.safeParse({
      suggestions: [
        {
          tag: "<h1>",
          currentValue: "a",
          suggestedValue: "b",
        },
      ],
    });
    expect(out.success).toBe(true);
  });

  it("allows empty object (no suggestions)", () => {
    const out = messageMetaSchema.safeParse({});
    expect(out.success).toBe(true);
  });
});
