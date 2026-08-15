export function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isMutableRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value)
}
