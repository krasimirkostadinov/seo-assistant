import { create } from "zustand";
import type { ChatMessage } from "./types.ts";

type Thread = { id: string; title: string };

type State = {
  threads: Thread[];
  activeThreadId: string | null;
  messagesByThread: Record<string, ChatMessage[]>;
  pending: boolean;
  setThreads: (threads: Thread[]) => void;
  setThreadTitle: (id: string, title: string) => void;
  setActiveThread: (id: string | null) => void;
  setMessages: (threadId: string, messages: ChatMessage[]) => void;
  appendMessages: (threadId: string, a: ChatMessage, b: ChatMessage) => void;
  setPending: (v: boolean) => void;
};

export const useSeoChatStore = create<State>((set) => ({
  threads: [],
  activeThreadId: null,
  messagesByThread: {},
  pending: false,
  setThreads: (threads) => set({ threads }),
  setThreadTitle: (id, title) =>
    set((s) => ({
      threads: s.threads.map((t) => (t.id === id ? { ...t, title } : t)),
    })),
  setActiveThread: (activeThreadId) => set({ activeThreadId }),
  setMessages: (threadId, messages) =>
    set((s) => ({
      messagesByThread: { ...s.messagesByThread, [threadId]: messages },
    })),
  appendMessages: (threadId, a, b) =>
    set((s) => ({
      messagesByThread: {
        ...s.messagesByThread,
        [threadId]: [...(s.messagesByThread[threadId] ?? []), a, b],
      },
    })),
  setPending: (pending) => set({ pending }),
}));
