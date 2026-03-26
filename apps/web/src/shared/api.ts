function parseApiErrorBody(text: string): { error?: string; detail?: string } | null {
  try {
    const body = JSON.parse(text) as { error?: string; detail?: string };
    if (body && typeof body === "object") {
      return body;
    }
  } catch {
    /* not JSON */
  }
  return null;
}

export async function apiJson<T>(
  getToken: () => Promise<string>,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const base = import.meta.env.VITE_API_URL.replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const errBody = parseApiErrorBody(text);
    if (import.meta.env.DEV) {
      console.error("[apiJson]", init?.method ?? "GET", path, res.status, errBody ?? text.slice(0, 400));
    }
    if (errBody?.detail) {
      throw new Error(`${errBody.error ?? "http_error"}: ${errBody.detail}`);
    }
    throw new Error(text || `http_${res.status}`);
  }
  return (await res.json()) as T;
}
