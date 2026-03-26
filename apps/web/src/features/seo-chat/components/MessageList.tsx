import type { ChatMessage, Suggestion } from "../types.ts";
import { TAG_LABELS } from "../constants.ts";

function SuggestionGroup({ tag, items }: { tag: string; items: Suggestion[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-sf-teal">
        {TAG_LABELS[tag] ?? tag}
      </p>
      <ul className="space-y-1.5">
        {items.map((s, i) => (
          <li
            key={`${s.suggestedValue}-${i}`}
            className="rounded-md border border-sf-border-subtle bg-sf-surface px-3 py-2 text-sm shadow-sm"
          >
            <span className="text-sf-muted">{i + 1}. </span>
            <span className="text-sf-text">{s.suggestedValue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionBlock({ suggestions }: { suggestions: Suggestion[] | undefined }) {
  if (!suggestions?.length) return null;

  const grouped = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
    if (!acc[s.tag]) acc[s.tag] = [];
    acc[s.tag].push(s);
    return acc;
  }, {});

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-sf-teal/25 bg-sf-teal-muted p-3">
      {Object.entries(grouped).map(([tag, items]) => (
        <SuggestionGroup key={tag} tag={tag} items={items} />
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="mr-auto flex items-center gap-1.5 rounded-2xl border border-sf-border-subtle bg-sf-raised/95 px-4 py-3">
      <span className="h-2 w-2 animate-bounce rounded-full bg-sf-muted [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sf-muted [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-sf-muted" />
    </div>
  );
}

export function MessageList({ messages, pending }: { messages: ChatMessage[]; pending?: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-1 py-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`max-w-[min(100%,42rem)] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
            m.role === "user"
              ? "ml-auto border border-sf-user-border/80 bg-sf-user text-white shadow-sm"
              : "mr-auto border border-sf-border-subtle bg-sf-raised/95 text-sf-text"
          }`}
        >
          <p className="whitespace-pre-wrap">{m.content}</p>
          {m.role === "assistant" ? (
            <SuggestionBlock suggestions={m.metadata?.suggestions} />
          ) : null}
        </div>
      ))}
      {pending && <TypingIndicator />}
    </div>
  );
}
