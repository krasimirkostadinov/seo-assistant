import { useAuth0 } from "@auth0/auth0-react";
import { apiJson } from "@shared/api.ts";
import { useCallback, useEffect, useRef } from "react";
import { useSeoChatStore } from "../store.ts";

type ThreadsRes = { threads: { id: string; title: string }[] };
type PostThreadRes = { thread: { id: string; title: string } };

export function useSyncThreads() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const getTokenRef = useRef(getAccessTokenSilently);
  getTokenRef.current = getAccessTokenSilently;

  const setThreads = useSeoChatStore((s) => s.setThreads);
  const setActiveThread = useSeoChatStore((s) => s.setActiveThread);

  const load = useCallback(async () => {
    const tokenFn = () =>
      getTokenRef.current({
        authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
      });

    let data = await apiJson<ThreadsRes>(tokenFn, "/threads");
    if (data.threads.length === 0) {
      const created = await apiJson<PostThreadRes>(tokenFn, "/threads", {
        method: "POST",
        body: JSON.stringify({ title: "New chat" }),
      });
      data = { threads: [created.thread] };
    }
    setThreads(data.threads);

    const active = useSeoChatStore.getState().activeThreadId;
    const stillThere = data.threads.some((t) => t.id === active);

    if (!active || !stillThere) {
      setActiveThread(data.threads[0]!.id);
    }
  }, [setThreads, setActiveThread]);

  useEffect(() => {
    if (!isAuthenticated) return;

    void load().catch(() => {});
  }, [isAuthenticated, load]);

  return { reloadThreads: load };
}
