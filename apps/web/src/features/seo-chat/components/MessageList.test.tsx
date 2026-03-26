import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ChatMessage, Suggestion } from "../types.ts";
import { MessageList } from "./MessageList.tsx";

function msg(p: Partial<ChatMessage> & Pick<ChatMessage, "id" | "role" | "content">): ChatMessage {
  return { metadata: null, createdAt: "2025-01-01T00:00:00.000Z", ...p };
}

/** Product rule: three alternative suggestions per tag (title, meta, h1) — nine items total. */
function nineSuggestionsFixture(): Suggestion[] {
  const base = { currentValue: "current" } as const;
  return [
    { tag: "<title>", ...base, suggestedValue: "Title option A — primary keyword" },
    { tag: "<title>", ...base, suggestedValue: "Title option B — keyword variant" },
    { tag: "<title>", ...base, suggestedValue: "Title option C — long-tail keyword" },
    {
      tag: "<meta description>",
      ...base,
      suggestedValue: "Meta option A — keyword in first sentence",
    },
    {
      tag: "<meta description>",
      ...base,
      suggestedValue: "Meta option B — keyword + CTA",
    },
    {
      tag: "<meta description>",
      ...base,
      suggestedValue: "Meta option C — keyword intent match",
    },
    { tag: "<h1>", ...base, suggestedValue: "H1 option A — main keyword" },
    { tag: "<h1>", ...base, suggestedValue: "H1 option B — keyword + clarity" },
    { tag: "<h1>", ...base, suggestedValue: "H1 option C — keyword alignment" },
  ];
}

describe("MessageList", () => {
  it("renders message content", () => {
    render(
      <MessageList
        messages={[msg({ id: "1", role: "user", content: "https://example.com" })]}
      />,
    );
    expect(screen.getByText("https://example.com")).toBeInTheDocument();
  });

  it("groups suggestions by tag and shows three options per SEO requirement", () => {
    const suggestions = nineSuggestionsFixture();
    render(
      <MessageList
        messages={[
          msg({
            id: "1",
            role: "assistant",
            content: "Here are your suggestions",
            metadata: { suggestions },
          }),
        ]}
      />,
    );

    expect(screen.getByText("Title tag")).toBeInTheDocument();
    expect(screen.getByText("Meta description")).toBeInTheDocument();
    expect(screen.getByText("H1 heading")).toBeInTheDocument();

    const titleSection = screen.getByText("Title tag").closest("div");
    expect(titleSection).toBeTruthy();
    const titleList = within(titleSection as HTMLElement).getByRole("list");
    expect(within(titleList).getAllByRole("listitem")).toHaveLength(3);

    const metaSection = screen.getByText("Meta description").closest("div");
    expect(metaSection).toBeTruthy();
    const metaList = within(metaSection as HTMLElement).getByRole("list");
    expect(within(metaList).getAllByRole("listitem")).toHaveLength(3);

    const h1Section = screen.getByText("H1 heading").closest("div");
    expect(h1Section).toBeTruthy();
    const h1List = within(h1Section as HTMLElement).getByRole("list");
    expect(within(h1List).getAllByRole("listitem")).toHaveLength(3);

    expect(screen.getByText("Title option A — primary keyword")).toBeInTheDocument();
    expect(screen.getByText("Meta option C — keyword intent match")).toBeInTheDocument();
    expect(screen.getByText("H1 option B — keyword + clarity")).toBeInTheDocument();
  });

  it("shows suggestion groups when assistant metadata has fewer than three per tag", () => {
    render(
      <MessageList
        messages={[
          msg({
            id: "1",
            role: "assistant",
            content: "Here are your suggestions",
            metadata: {
              suggestions: [
                { tag: "<title>", currentValue: "Old", suggestedValue: "New Title" },
                { tag: "<h1>", currentValue: "Old H1", suggestedValue: "New H1" },
              ],
            },
          }),
        ]}
      />,
    );
    expect(screen.getByText("Title tag")).toBeInTheDocument();
    expect(screen.getByText("New Title")).toBeInTheDocument();
    expect(screen.getByText("H1 heading")).toBeInTheDocument();
    expect(screen.getByText("New H1")).toBeInTheDocument();
  });
});
