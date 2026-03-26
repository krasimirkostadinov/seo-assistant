import { load } from "cheerio";

const MAX_BYTES = 2_000_000;

/** Blocks common SSRF targets (loopback, RFC1918, link-local, metadata). */
export function assertSafeRemoteUrl(urlString: string, requireHttps: boolean): void {
  let u: URL;
  try {
    u = new URL(urlString);
  } catch {
    throw new Error("invalid_url");
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("invalid_scheme");
  }
  if (requireHttps && u.protocol !== "https:") {
    throw new Error("https_required");
  }

  const host = u.hostname.toLowerCase();
  if (!host) throw new Error("invalid_host");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "metadata.google.internal"
  ) {
    throw new Error("blocked_host");
  }

  if (host === "169.254.169.254" || host.startsWith("169.254.")) {
    throw new Error("blocked_host");
  }

  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = host.match(v4);
  if (m) {
    const parts = m.slice(1).map(Number);
    if (parts.some((n) => n > 255)) throw new Error("blocked_host");
    const a = parts[0]!;
    const b = parts[1]!;
    if (a === 10) throw new Error("blocked_host");
    if (a === 172 && b >= 16 && b <= 31) throw new Error("blocked_host");
    if (a === 192 && b === 168) throw new Error("blocked_host");
    if (a === 127) throw new Error("blocked_host");
    if (a === 0) throw new Error("blocked_host");
    if (a === 100 && b >= 64 && b <= 127) throw new Error("blocked_host");
  }

  if (host.startsWith("[") && host.endsWith("]")) {
    const inner = host.slice(1, -1).toLowerCase();
    if (inner === "::1" || inner === "0:0:0:0:0:0:0:1") throw new Error("blocked_host");
    if (inner.startsWith("fe80:")) throw new Error("blocked_host");
    const firstSeg = inner.split(":").find((p) => p.length > 0) ?? "";
    if (/^f[c-d][0-9a-f]{0,3}$/i.test(firstSeg)) throw new Error("blocked_host");
  }
}

export async function fetchPageContent(
  url: string,
  options?: { requireHttps?: boolean },
): Promise<{
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  truncated: boolean;
}> {
  assertSafeRemoteUrl(url, options?.requireHttps ?? false);

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "user-agent": "SEOAssistantBot/1.0",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      throw new Error(`http_${res.status}`);
    }
    const buf = await res.arrayBuffer();
    const truncated = buf.byteLength > MAX_BYTES;
    const slice = truncated ? buf.slice(0, MAX_BYTES) : buf;
    const html = new TextDecoder("utf-8", { fatal: false }).decode(slice);
    const $ = load(html);
    const title = $("title").first().text().replace(/\s+/g, " ").trim() || "";
    const metaDescription =
      $('meta[name="description"]')
        .attr("content")
        ?.replace(/\s+/g, " ")
        .trim() || "";
    const h1 = $("h1").first().text().replace(/\s+/g, " ").trim() || "";

    return { url, title, metaDescription, h1, truncated };
  } finally {
    clearTimeout(t);
  }
}
