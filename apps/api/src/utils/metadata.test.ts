import { describe, expect, it } from "vitest";

import { deserializeMetadata, serializeMetadata } from "./metadata.js";

describe("serializeMetadata / deserializeMetadata", () => {
  it("serializes objects and round-trips", () => {
    const payload = { suggestions: [{ tag: "<title>" }] };
    const raw = serializeMetadata(payload);
    expect(raw).toBe(JSON.stringify(payload));
    expect(deserializeMetadata(raw)).toEqual(payload);
  });

  it("returns null for nullish input on serialize", () => {
    expect(serializeMetadata(null)).toBeNull();
    expect(serializeMetadata(undefined)).toBeNull();
  });

  it("returns null for empty or invalid JSON on deserialize", () => {
    expect(deserializeMetadata(null)).toBeNull();
    expect(deserializeMetadata("")).toBeNull();
    expect(deserializeMetadata("{")).toBeNull();
  });
});
