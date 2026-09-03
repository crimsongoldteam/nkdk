export function hasSoleValueListType(xml: Record<string, unknown>): boolean {
  const type = xml.Type
  if (type === null || typeof type !== "object" || Array.isArray(type)) return false
  const raw = (type as Record<string, unknown>)["v8:Type"]
  const values = Array.isArray(raw) ? raw : raw === undefined ? [] : [raw]
  return values.length === 1 && values[0] === "v8:ValueListType"
}

export function formAttributeValueTypeDefault({ yaml, operation }: {
  readonly yaml?: unknown
  readonly operation: string
}): { type: [] } | undefined {
  if (operation !== "importFromYAML" || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined
  const item = yaml as Record<string, unknown>
  if (
    item.Тип === "СписокЗначений" &&
    !Object.prototype.hasOwnProperty.call(item, "ТипЗначения")
  ) {
    return { type: [] }
  }
  return undefined
}
