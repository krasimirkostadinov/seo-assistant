import { useAuth0 } from "@auth0/auth0-react";
import { useCallback, useEffect, useRef } from "react";
import { apiJson } from "@shared/api.ts";
import { messageMetaSchema, type ChatMessage } from "../types.ts";
import { useSeoChatStore } from "../store.ts";

type Row = {
  id: string;
  role: string;
  content: string;
  metadata: unknown;
  createdAt: string;
};

type Res = { messages: Row[] };

function normalizeRow(r: Row): ChatMessage | null {
  if (r.role !== "user" && r.role !== "assistant") return null;
  const meta =
    r.metadata && typeof r.metadata === "object"
      ? messageMetaSchema.safeParse(r.metadata)
      : null;
  return {
    id: r.id,
    role: r.role,
    content: r.content,
    metadata: meta?.success ? meta.data : null,
    createdAt: r.createdAt,
  };
}

export function useSyncMessages(threadId: string | null) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const getTokenRef = useRef(getAccessTokenSilently);
  getTokenRef.current = getAccessTokenSilently;

  const setMessages = useSeoChatStore((s) => s.setMessages);

  const load = useCallback(async () => {
    if (!threadId) return;
    const tokenFn = () =>
      getTokenRef.current({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });
    const data = await apiJson<Res>(
      tokenFn,
      `/threads/${encodeURIComponent(threadId)}/messages`,
    );
    const list = data.messages
      .map(normalizeRow)
      .filter((m): m is ChatMessage => m !== null);
    setMessages(threadId, list);
  }, [setMessages, threadId]);

  useEffect(() => {
    if (!isAuthenticated || !threadId) return;
    void load().catch(() => {});
  }, [isAuthenticated, load, threadId]);

  return { reloadMessages: load };
}
