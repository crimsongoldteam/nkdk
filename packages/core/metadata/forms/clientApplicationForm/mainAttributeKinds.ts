import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"

export function hasMainAttributeKind(
  attributes: unknown,
  index: FormDataPathIndex | undefined,
  kinds: ReadonlySet<string>
): boolean {
  if (!isRecord(attributes) || index === undefined) return false

  return Object.entries(attributes).some(([name, rawAttribute]) => {
    if (!isRecord(rawAttribute) || rawAttribute["ОсновнойРеквизит"] !== "Истина") return false
    return index.getRoot(name)?.typeInfo.nextTypes.some(({ kind }) => kinds.has(kind)) === true
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
