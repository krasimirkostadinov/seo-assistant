import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

function buildContentSecurityPolicy(
  viteEnv: Record<string, string>,
  mode: string,
): string {
  const isProd = mode === "production";
  const apiUrl = viteEnv.VITE_API_URL;
  let apiOrigin = "";
  if (apiUrl) {
    try {
      apiOrigin = new URL(apiUrl).origin;
    } catch {
      /* ignore invalid env at CSP build time */
    }
  }

  const scriptSrc = isProd
    ? ["'self'"]
    : ["'self'", "'unsafe-inline'", "'unsafe-eval'"];

  const connectParts = new Set<string>(["'self'"]);
  if (apiOrigin) connectParts.add(apiOrigin);

  const auth0Domain = viteEnv.VITE_AUTH0_DOMAIN?.trim();
  if (auth0Domain) {
    try {
      const host = auth0Domain.includes("://")
        ? new URL(auth0Domain).hostname
        : auth0Domain.replace(/\/$/, "");
      if (host) connectParts.add(`https://${host}`);
    } catch {
      /* ignore invalid domain */
    }
  }

  const auth0Audience = viteEnv.VITE_AUTH0_AUDIENCE?.trim();
  if (auth0Audience) {
    try {
      connectParts.add(new URL(auth0Audience).origin);
    } catch {
      /* ignore invalid audience URL */
    }
  }

  if (!isProd) {
    connectParts.add("ws:");
    connectParts.add("wss:");
    connectParts.add("http://127.0.0.1:4000");
    connectParts.add("http://localhost:4000");
    connectParts.add("http://127.0.0.1:5173");
    connectParts.add("http://localhost:5173");
    connectParts.add("http://127.0.0.1:4173");
    connectParts.add("http://localhost:4173");
  }

  const directives = [
    "default-src 'none'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data: https:",
    `style-src 'self' 'unsafe-inline'`,
    `script-src ${scriptSrc.join(" ")}`,
    `connect-src ${[...connectParts].join(" ")}`,
    "frame-src https:",
    "form-action https:",
    "object-src 'none'",
  ];

  if (isProd && (!apiUrl || apiUrl.startsWith("https:"))) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export default defineConfig(({ mode }) => {
  const root = __dirname;
  const viteEnv = loadEnv(mode, root, "VITE_");
  const csp = buildContentSecurityPolicy(viteEnv, mode);

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@features": path.resolve(__dirname, "src/features"),
        "@shared": path.resolve(__dirname, "src/shared"),
      },
    },
    server: {
      headers: {
        "Content-Security-Policy": csp,
      },
    },
    preview: {
      headers: {
        "Content-Security-Policy": csp,
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      setupFiles: ["./src/test/setup.ts"],
    },
  };
});
