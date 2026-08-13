interface MainAttributeKindIndex {
  getRoot(name: string):
    | {
        typeInfo: { nextTypes: readonly { kind: string }[] }
      }
    | undefined
}

export function hasMainAttributeKind(
  attributes: unknown,
  index: MainAttributeKindIndex | undefined,
  kinds: ReadonlySet<string>,
  effectiveMainAttribute?: string,
): boolean {
  if (index === undefined) return false

  if (isRecord(attributes) && Object.entries(attributes).some(([name, rawAttribute]) => {
    if (!isRecord(rawAttribute) || rawAttribute["ОсновнойРеквизит"] !== "Истина") return false
    return index.getRoot(name)?.typeInfo.nextTypes.some(({ kind }) => kinds.has(kind)) === true
  })) return true

  return effectiveMainAttribute !== undefined &&
    index.getRoot(effectiveMainAttribute)?.typeInfo.nextTypes.some(({ kind }) => kinds.has(kind)) === true
}

export function findMainAttributeName(attributes: unknown): string | undefined {
  if (!isRecord(attributes)) return undefined
  for (const [name, rawAttribute] of Object.entries(attributes)) {
    if (
      isRecord(rawAttribute) &&
      (rawAttribute["ОсновнойРеквизит"] === true || rawAttribute["ОсновнойРеквизит"] === "Истина")
    ) return name
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
