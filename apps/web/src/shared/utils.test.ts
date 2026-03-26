import { describe, expect, it } from "vitest";

import { decodeOAuthErrorDescription } from "./utils";

describe("decodeOAuthErrorDescription", () => {
  it("decodes percent-encoded OAuth error descriptions", () => {
    expect(decodeOAuthErrorDescription("Access%20denied")).toBe("Access denied");
  });

  it("treats + as space (application/x-www-form-urlencoded style)", () => {
    expect(decodeOAuthErrorDescription("bad+request")).toBe("bad request");
  });

  it("returns the original string when decoding fails", () => {
    const invalid = "%E0%A4%A";
    expect(decodeOAuthErrorDescription(invalid)).toBe(invalid);
  });
});
