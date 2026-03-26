import { load } from "cheerio";

const MAX_BYTES = 2_000_000;

function isPrivateUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return true;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return true;
  const h = parsed.hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1") return true;
  if (h.startsWith("192.168.") || h.startsWith("10.") || h.startsWith("172.16.")) return true; // private LAN ranges
  if (h.startsWith("169.254.")) return true; // link-local / AWS instance metadata (169.254.169.254)
  return false;
}

export async function fetchPageContent(url: string): Promise<{
  url: string;
  title: string;
  metaDescription: string;
  h1: string;
  truncated: boolean;
}> {
  if (isPrivateUrl(url)) {
    throw new Error("url_not_allowed");
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
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
