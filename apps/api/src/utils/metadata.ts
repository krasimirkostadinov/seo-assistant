export function serializeMetadata(data: unknown): string | null {
  if (data === undefined || data === null) return null;
  return JSON.stringify(data);
}

export function deserializeMetadata(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
