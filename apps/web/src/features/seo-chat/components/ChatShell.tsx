import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiJson } from "@shared/api.ts";
import { useSeoChatStore } from "../store.ts";
import { useSyncMessages } from "../hooks/useSyncMessages.ts";
import { useSyncThreads } from "../hooks/useSyncThreads.ts";
import type { ChatMessage, PostRes } from "../types.ts";
import { Composer } from "./Composer.tsx";
import { MessageList } from "./MessageList.tsx";

const EMPTY_THREAD_MESSAGES: ChatMessage[] = [];

export function ChatShell() {
  const { getAccessTokenSilently } = useAuth0();
  const activeThreadId = useSeoChatStore((s) => s.activeThreadId);
  const { reloadThreads } = useSyncThreads();
  const { reloadMessages } = useSyncMessages(activeThreadId);
  const threads = useSeoChatStore((s) => s.threads);
  const setActiveThread = useSeoChatStore((s) => s.setActiveThread);
  const setThreads = useSeoChatStore((s) => s.setThreads);
  const setThreadTitle = useSeoChatStore((s) => s.setThreadTitle);
  const setMessages = useSeoChatStore((s) => s.setMessages);
  const messages = useSeoChatStore(
    (s) =>
      (activeThreadId ? s.messagesByThread[activeThreadId] : undefined) ??
      EMPTY_THREAD_MESSAGES,
  );
  const appendMessages = useSeoChatStore((s) => s.appendMessages);
  const pending = useSeoChatStore((s) => s.pending);
  const setPending = useSeoChatStore((s) => s.setPending);

  const tokenFn = useCallback(
    () =>
      getAccessTokenSilently({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      }),
    [getAccessTokenSilently],
  );

  const activeThread = threads.find((t) => t.id === activeThreadId);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) renameInputRef.current?.focus();
  }, [renaming]);

  const startRename = useCallback(() => {
    setRenameDraft(activeThread?.title ?? "");
    setRenaming(true);
  }, [activeThread?.title]);

  const commitRename = useCallback(async () => {
    setRenaming(false);
    if (!activeThreadId || !activeThread) return;
    const title = renameDraft.trim();
    if (!title || title === activeThread.title) return;
    await apiJson<{ thread: { id: string; title: string } }>(
      tokenFn,
      `/threads/${encodeURIComponent(activeThreadId)}`,
      { method: "PATCH", body: JSON.stringify({ title }) },
    );
    setThreadTitle(activeThreadId, title);
  }, [activeThread, activeThreadId, renameDraft, setThreadTitle, tokenFn]);

  const cancelRename = useCallback(() => {
    setRenaming(false);
    setRenameDraft(activeThread?.title ?? "");
  }, [activeThread?.title]);

  const onSend = useCallback(
    async (content: string) => {
      if (!activeThreadId) return;
      setPending(true);
      try {
        const data = await apiJson<PostRes>(
          tokenFn,
          `/threads/${encodeURIComponent(activeThreadId)}/messages`,
          { method: "POST", body: JSON.stringify({ content }) },
        );
        const u: ChatMessage = {
          id: data.userMessage.id,
          role: "user",
          content: data.userMessage.content,
          metadata: null,
          createdAt: new Date().toISOString(),
        };
        const a: ChatMessage = {
          id: data.assistantMessage.id,
          role: "assistant",
          content: data.assistantMessage.content,
          metadata: data.assistantMessage.metadata,
          createdAt: new Date().toISOString(),
        };
        appendMessages(activeThreadId, u, a);
      } finally {
        setPending(false);
      }
    },
    [activeThreadId, appendMessages, setPending, tokenFn],
  );

  const newThread = useCallback(async () => {
    const data = await apiJson<{ thread: { id: string; title: string } }>(
      tokenFn,
      "/threads",
      { method: "POST", body: JSON.stringify({ title: "New chat" }) },
    );
    const st = useSeoChatStore.getState();
    setThreads([...st.threads, data.thread]);
    setActiveThread(data.thread.id);
    setMessages(data.thread.id, []);
    setRenaming(true);
    setRenameDraft("New chat");
  }, [setActiveThread, setMessages, setThreads, tokenFn]);

  return (
    <div className="flex h-[min(100vh-8rem,720px)] flex-col gap-3 rounded-2xl border border-sf-border bg-sf-surface p-4 shadow-lg shadow-stone-900/8 ring-1 ring-sf-border-subtle">
      {/* Thread bar */}
      <div className="flex items-center gap-2">
        {renaming ? (
          <input
            ref={renameInputRef}
            type="text"
            maxLength={200}
            value={renameDraft}
            onChange={(e) => setRenameDraft(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="min-w-0 flex-1 rounded-lg border border-sf-primary bg-sf-raised px-2 py-1 text-sm text-sf-text outline-none ring-2 ring-sf-primary/20"
          />
        ) : (
          <>
            <select
              className="min-w-0 flex-1 rounded-lg border border-sf-border bg-sf-raised px-2 py-1 text-sm text-sf-text"
              value={activeThreadId ?? ""}
              onChange={(e) => setActiveThread(e.target.value || null)}
            >
              {threads.length === 0 && (
                <option value="" disabled>No threads yet</option>
              )}
              {threads.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            {activeThreadId && (
              <button
                type="button"
                title="Rename thread"
                onClick={startRename}
                className="rounded-lg border border-sf-border p-1.5 text-sf-muted hover:border-sf-primary/40 hover:text-sf-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            )}
          </>
        )}

        <button
          type="button"
          title="New thread"
          onClick={() => void newThread()}
          className="rounded-lg border border-sf-border p-1.5 text-sf-muted hover:border-sf-primary/40 hover:text-sf-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          type="button"
          title="Refresh"
          onClick={() => { void reloadThreads(); void reloadMessages(); }}
          className="rounded-lg border border-sf-border p-1.5 text-sf-muted hover:border-sf-primary/40 hover:text-sf-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <MessageList messages={messages} pending={pending} />
      <Composer disabled={pending || !activeThreadId} onSend={onSend} />
    </div>
  );
}
