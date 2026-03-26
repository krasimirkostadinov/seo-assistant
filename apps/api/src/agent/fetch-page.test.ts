import { describe, expect, it } from "vitest";

import { assertSafeRemoteUrl } from "./fetch-page.js";

describe("assertSafeRemoteUrl", () => {
  it("allows public https URLs", () => {
    expect(() =>
      assertSafeRemoteUrl("https://example.com/path", true),
    ).not.toThrow();
  });

  it("blocks localhost", () => {
    expect(() => assertSafeRemoteUrl("http://localhost:8080/", false)).toThrow(
      "blocked_host",
    );
  });

  it("blocks private IPv4 ranges", () => {
    expect(() => assertSafeRemoteUrl("http://192.168.1.1/", false)).toThrow(
      "blocked_host",
    );
  });

  it("requires https when requireHttps is true", () => {
    expect(() =>
      assertSafeRemoteUrl("http://example.com/", true),
    ).toThrow("https_required");
  });

  it("rejects non-http(s) schemes", () => {
    expect(() => assertSafeRemoteUrl("ftp://example.com/", false)).toThrow(
      "invalid_scheme",
    );
  });
});
